/**
 * CMS Carousel - Clean Room Implementation
 * A production-ready carousel component for Framer with CMS integration.
 *
 * Architecture:
 * - React-based state management (no direct DOM mutation)
 * - Observer pattern for item discovery
 * - Framer Motion for all animations
 * - Declarative layout calculations
 * - Registry pattern for external controls
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

import React, {
    forwardRef,
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
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

import { motion, useMotionValue, animate, type Transition } from "framer-motion"

// ══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════

interface CarouselProps {
    content?: React.ReactNode
    style?: React.CSSProperties
    carouselId: string
    enableDrag: boolean
    itemsVisible: number
    itemGap: number
    padding: number | number[]
    paddingPerSide?: boolean
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    background: string
    overflow: "hidden" | "visible"
    verticalAlign: "flex-start" | "center" | "flex-end"
    indicators?: IndicatorConfig
    autoAdvance: boolean
    advanceDelay: number
    animationOptions?: Transition
    ariaLabel: string
}

interface IndicatorConfig {
    showIndicators: boolean
    indicatorSize: number
    indicatorInset: number
    indicatorSpacing: number
    indicatorPadding: number
    indicatorColor: string
    indicatorBackground: string
    indicatorRadius: number
    inactiveAlpha: number
    activeAlpha: number
    backgroundBlur: number
}

interface CarouselState {
    itemCount: number
    currentPage: number
    viewportWidth: number
    itemWidth: number
    isReady: boolean
}

interface GestureState {
    isActive: boolean
    startX: number
    startY: number
    pointerId: number | null
    direction: "horizontal" | "vertical" | null
    hasCaptured: boolean
    shouldSuppressClick: boolean
}

interface NavigationState {
    canPrev: boolean
    canNext: boolean
}

interface ExternalControl {
    prev: () => void
    next: () => void
}

// ══════════════════════════════════════════════════════════════════
// EXTERNAL CONTROL REGISTRY
// ══════════════════════════════════════════════════════════════════

const controlRegistry = new Map<string, ExternalControl>()
const navStateRegistry = new Map<string, NavigationState>()
const navStateListeners = new Map<string, Set<() => void>>()

const DEFAULT_CAROUSEL_ID = "carousel-1"
const CAROUSEL_ID_REGEX = /carousel-[a-zA-Z0-9_-]+/i

function getNavigationState(id: string): NavigationState {
    return navStateRegistry.get(id) ?? { canPrev: false, canNext: false }
}

function updateNavigationState(id: string, state: NavigationState): void {
    const current = navStateRegistry.get(id)
    if (
        current?.canPrev === state.canPrev &&
        current?.canNext === state.canNext
    ) {
        return
    }
    navStateRegistry.set(id, state)
    navStateListeners.get(id)?.forEach((fn) => fn())
}

function subscribeToNavState(id: string, callback: () => void): () => void {
    const callbacks = navStateListeners.get(id) ?? new Set()
    callbacks.add(callback)
    navStateListeners.set(id, callbacks)

    return () => {
        const current = navStateListeners.get(id)
        if (current) {
            current.delete(callback)
            if (current.size === 0) navStateListeners.delete(id)
        }
    }
}

// ══════════════════════════════════════════════════════════════════
// ID EXTRACTION UTILITIES
// ══════════════════════════════════════════════════════════════════

function extractCarouselId(value: unknown): string | null {
    if (typeof value !== "string") return null
    const match = value.match(CAROUSEL_ID_REGEX)
    return match?.[0] ?? null
}

function findCarouselIdInAncestry(element: HTMLElement | null): string | null {
    let node = element
    while (node) {
        const attributes = [
            node.getAttribute("data-framer-name"),
            node.getAttribute("data-name"),
            node.getAttribute("aria-label"),
            node.className,
            node.id,
        ]

        for (const attr of attributes) {
            const id = extractCarouselId(attr)
            if (id) return id
        }
        node = node.parentElement
    }
    return null
}

function resolveCarouselId(name: unknown, silent = false): string {
    const id = extractCarouselId(name)
    if (id) return id

    if (!silent && typeof name === "string") {
        console.warn(
            `[Carousel] Layer name "${name}" missing carousel ID. Using "${DEFAULT_CAROUSEL_ID}". ` +
                `Rename layer like "Next carousel-2" to target a specific carousel.`
        )
    }

    return DEFAULT_CAROUSEL_ID
}

// ══════════════════════════════════════════════════════════════════
// PADDING RESOLVER
// ══════════════════════════════════════════════════════════════════

function resolvePaddingValues(
    padding: number | number[],
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number
): [number, number, number, number] {
    if (paddingTop !== undefined) {
        return [
            paddingTop ?? 0,
            paddingRight ?? 0,
            paddingBottom ?? 0,
            paddingLeft ?? 0,
        ]
    }

    if (Array.isArray(padding)) {
        return [
            padding[0] ?? 0,
            padding[1] ?? 0,
            padding[2] ?? 0,
            padding[3] ?? 0,
        ]
    }

    const value = typeof padding === "number" ? padding : 0
    return [value, value, value, value]
}

// ══════════════════════════════════════════════════════════════════
// LAYOUT CALCULATOR
// ══════════════════════════════════════════════════════════════════

interface LayoutResult {
    itemWidth: number
    trackWidth: number
    totalPages: number
}

function calculateLayout(
    viewportWidth: number,
    itemCount: number,
    itemsVisible: number,
    gap: number
): LayoutResult {
    if (viewportWidth <= 0 || itemCount === 0) {
        return { itemWidth: 0, trackWidth: 0, totalPages: 0 }
    }

    const visibleItems = Math.max(1, itemsVisible)
    const totalGapWidth = gap * (visibleItems - 1)
    const itemWidth = Math.max(
        1,
        (viewportWidth - totalGapWidth) / visibleItems
    )

    const trackWidth = itemCount * itemWidth + (itemCount - 1) * gap
    const totalPages = Math.max(1, Math.ceil(itemCount / visibleItems))

    return { itemWidth, trackWidth, totalPages }
}

// ══════════════════════════════════════════════════════════════════
// ITEM DISCOVERY HOOK
// ══════════════════════════════════════════════════════════════════

function useItemDiscovery(
    containerRef: React.RefObject<HTMLElement>,
    content: React.ReactNode
): { items: HTMLElement[]; itemsContainer: HTMLElement | null } {
    const [result, setResult] = useState<{
        items: HTMLElement[]
        itemsContainer: HTMLElement | null
    }>({
        items: [],
        itemsContainer: null,
    })

    const discoverItems = useCallback(() => {
        const container = containerRef.current
        if (!container) {
            setResult({ items: [], itemsContainer: null })
            return
        }

        // Strategy: Find the element with the most direct children
        // This is typically where Framer CMS renders individual items
        let bestCandidate: HTMLElement = container
        let maxChildren = 0

        const queue: Element[] = [container]
        const visited = new Set<Element>()

        while (queue.length > 0) {
            const current = queue.shift()!
            if (visited.has(current)) continue
            visited.add(current)

            const childCount = current.children.length

            // Prioritize containers with multiple children
            if (childCount > maxChildren) {
                maxChildren = childCount
                bestCandidate = current as HTMLElement
            }

            // Continue searching deeper if we haven't found multiple items yet
            if (childCount >= 1 && childCount <= 2) {
                for (let i = 0; i < current.children.length; i++) {
                    queue.push(current.children[i])
                }
            }
        }

        const discovered = Array.from(bestCandidate.children) as HTMLElement[]
        setResult({
            items: discovered.length > 0 ? discovered : [],
            itemsContainer: discovered.length > 0 ? bestCandidate : null,
        })
    }, [containerRef])

    useEffect(() => {
        discoverItems()

        const container = containerRef.current
        if (!container) return

        const observer = new MutationObserver(() => {
            discoverItems()
        })

        observer.observe(container, {
            childList: true,
            subtree: true,
        })

        return () => observer.disconnect()
    }, [discoverItems, containerRef, content])

    return result
}

// ══════════════════════════════════════════════════════════════════
// VIEWPORT SIZE HOOK
// ══════════════════════════════════════════════════════════════════

function useViewportSize(containerRef: React.RefObject<HTMLElement>): number {
    const [width, setWidth] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const measure = () => {
            const measured = container.offsetWidth
            if (measured >= 10) {
                setWidth(measured)
            }
        }

        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(container)

        return () => observer.disconnect()
    }, [containerRef])

    return width
}

// ══════════════════════════════════════════════════════════════════
// MAIN CAROUSEL COMPONENT
// ══════════════════════════════════════════════════════════════════

function CustomCMSCarousel(props: CarouselProps) {
    const {
        content,
        style,
        carouselId = "carousel-1",
        enableDrag = true,
        itemsVisible = 1,
        itemGap = 0,
        padding = 0,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        background = "transparent",
        overflow = "hidden",
        verticalAlign = "center",
        indicators = {
            showIndicators: true,
            indicatorSize: 8,
            indicatorInset: 16,
            indicatorSpacing: 6,
            indicatorPadding: 8,
            indicatorColor: "#ffffff",
            indicatorBackground: "rgba(0,0,0,0.25)",
            indicatorRadius: 20,
            inactiveAlpha: 0.4,
            activeAlpha: 1,
            backgroundBlur: 8,
        },
        autoAdvance = false,
        advanceDelay = 4,
        animationOptions = {
            type: "tween",
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
        ariaLabel = "CMS Carousel",
    } = props

    const isStatic = useIsStaticRenderer()
    const hasExplicitWidth =
        style?.width !== undefined && style.width !== "100%"
    const hasExplicitHeight =
        style?.height !== undefined && style.height !== "100%"

    const [paddingT, paddingR, paddingB, paddingL] = resolvePaddingValues(
        padding,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft
    )

    // ── State ──────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(0)
    const [isLayoutReady, setIsLayoutReady] = useState(isStatic)
    const [showEmptyState, setShowEmptyState] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const autoAdvanceTimerRef = useRef<number | null>(null)
    const currentPageRef = useRef(currentPage)

    // ── Discovery and Measurement ──────────────────────────────────
    const { items, itemsContainer } = useItemDiscovery(containerRef, content)
    const viewportWidth = useViewportSize(containerRef)

    const layout = useMemo(
        () =>
            calculateLayout(viewportWidth, items.length, itemsVisible, itemGap),
        [viewportWidth, items.length, itemsVisible, itemGap]
    )

    const maxPage = layout.totalPages - 1
    const safeCurrentPage = Math.min(currentPage, maxPage)

    // ── Motion Value ───────────────────────────────────────────────
    const translateX = useMotionValue(0)
    const animationRef = useRef<ReturnType<typeof animate> | null>(null)

    // ── Gesture State ──────────────────────────────────────────────
    const [gestureState, setGestureState] = useState<GestureState>({
        isActive: false,
        startX: 0,
        startY: 0,
        pointerId: null,
        direction: null,
        hasCaptured: false,
        shouldSuppressClick: false,
    })

    const gestureRef = useRef(gestureState)

    useEffect(() => {
        gestureRef.current = gestureState
    }, [gestureState])

    useEffect(() => {
        currentPageRef.current = currentPage
    }, [currentPage])

    // ── Empty State Management ─────────────────────────────────────
    useEffect(() => {
        if (!content) {
            setShowEmptyState(false)
            return
        }

        if (items.length > 0) {
            setShowEmptyState(false)
            return
        }

        const timer = setTimeout(() => {
            setShowEmptyState(true)
        }, 300)

        return () => clearTimeout(timer)
    }, [content, items.length])

    // ── Layout Ready Gate ──────────────────────────────────────────
    useEffect(() => {
        if (isStatic || isLayoutReady) return

        if (items.length > 0 && viewportWidth > 0) {
            setIsLayoutReady(true)
            return
        }

        const safetyTimer = setTimeout(() => {
            if (items.length > 0) {
                setIsLayoutReady(true)
            }
        }, 800)

        return () => clearTimeout(safetyTimer)
    }, [isStatic, isLayoutReady, items.length, viewportWidth])

    // ── Page Navigation ────────────────────────────────────────────
    const navigateToPage = useCallback(
        (page: number) => {
            const targetPage = Math.max(0, Math.min(page, maxPage))
            startTransition(() => {
                setCurrentPage(targetPage)
            })
        },
        [maxPage]
    )

    const prevPage = useCallback(() => {
        navigateToPage(currentPage - 1)
    }, [currentPage, navigateToPage])

    const nextPage = useCallback(() => {
        navigateToPage(currentPage + 1)
    }, [currentPage, navigateToPage])

    // ── Auto Advance ───────────────────────────────────────────────
    const stopAutoAdvance = useCallback(() => {
        if (autoAdvanceTimerRef.current !== null) {
            clearInterval(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = null
        }
    }, [])

    const startAutoAdvance = useCallback(() => {
        if (!autoAdvance || items.length <= itemsVisible) return

        stopAutoAdvance()

        autoAdvanceTimerRef.current = window.setInterval(() => {
            const next = currentPageRef.current + 1
            if (next > maxPage) {
                navigateToPage(0)
            } else {
                navigateToPage(next)
            }
        }, advanceDelay * 1000)
    }, [
        autoAdvance,
        items.length,
        itemsVisible,
        maxPage,
        advanceDelay,
        navigateToPage,
        stopAutoAdvance,
    ])

    useEffect(() => {
        startAutoAdvance()
        return () => stopAutoAdvance()
    }, [startAutoAdvance, stopAutoAdvance])

    // ── Apply Track Position ───────────────────────────────────────
    useEffect(() => {
        if (layout.itemWidth === 0 || !itemsContainer) return

        const pageOffset = safeCurrentPage * itemsVisible
        const targetX = -pageOffset * (layout.itemWidth + itemGap)

        animationRef.current?.stop()

        if (isStatic) {
            translateX.set(targetX)
            if (itemsContainer) {
                itemsContainer.style.transform = `translateX(${targetX}px) translateZ(0)`
            }
        } else {
            animationRef.current = animate(
                translateX,
                targetX,
                animationOptions
            )
        }
    }, [
        safeCurrentPage,
        layout.itemWidth,
        itemGap,
        itemsVisible,
        translateX,
        animationOptions,
        isStatic,
        itemsContainer,
    ])

    // Apply translateX changes to the items container
    useEffect(() => {
        if (!itemsContainer) return

        const unsubscribe = translateX.on("change", (value) => {
            itemsContainer.style.transform = `translateX(${value}px) translateZ(0)`
        })

        return unsubscribe
    }, [translateX, itemsContainer])

    useEffect(() => {
        return () => animationRef.current?.stop()
    }, [])

    // ── Style Items ────────────────────────────────────────────────
    useEffect(() => {
        if (layout.itemWidth === 0 || !itemsContainer) return

        items.forEach((item) => {
            item.style.flex = `0 0 ${layout.itemWidth}px`
            item.style.width = `${layout.itemWidth}px`
            item.style.minWidth = `${layout.itemWidth}px`
            item.style.height = "auto"
            item.style.maxHeight = "100%"
            item.style.boxSizing = "border-box"
            item.style.overflow = "hidden"
        })
    }, [items, itemsContainer, layout.itemWidth])

    // ── Style Track ────────────────────────────────────────────────
    useEffect(() => {
        if (!itemsContainer || layout.trackWidth === 0) return

        itemsContainer.style.display = "flex"
        itemsContainer.style.flexDirection = "row"
        itemsContainer.style.flexWrap = "nowrap"
        itemsContainer.style.alignItems = verticalAlign
        itemsContainer.style.gap = `${itemGap}px`
        itemsContainer.style.width = `${layout.trackWidth}px`
        itemsContainer.style.height = "100%"
        itemsContainer.style.willChange = "transform"
        itemsContainer.style.transform = "translateZ(0)"
    }, [itemsContainer, layout.trackWidth, verticalAlign, itemGap])

    // ── External Control Registration ──────────────────────────────
    useEffect(() => {
        const id = carouselId.trim()
        if (!id) return

        controlRegistry.set(id, { prev: prevPage, next: nextPage })

        return () => {
            const current = controlRegistry.get(id)
            if (current?.prev === prevPage && current?.next === nextPage) {
                controlRegistry.delete(id)
            }
        }
    }, [carouselId, prevPage, nextPage])

    // ── Update Navigation State ────────────────────────────────────
    useEffect(() => {
        const id = carouselId.trim()
        if (!id) return

        updateNavigationState(id, {
            canPrev: currentPage > 0,
            canNext: currentPage < maxPage,
        })
    }, [carouselId, currentPage, maxPage])

    // ── Pointer Handlers ───────────────────────────────────────────
    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!enableDrag || !e.isPrimary) return
            if (e.pointerType === "mouse" && e.button !== 0) return

            setGestureState({
                isActive: true,
                startX: e.clientX,
                startY: e.clientY,
                pointerId: e.pointerId,
                direction: null,
                hasCaptured: false,
                shouldSuppressClick: false,
            })

            stopAutoAdvance()
        },
        [enableDrag, stopAutoAdvance]
    )

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const state = gestureRef.current
        if (!state.isActive || state.pointerId !== e.pointerId) return

        const deltaX = Math.abs(e.clientX - state.startX)
        const deltaY = Math.abs(e.clientY - state.startY)

        // Determine direction once threshold is crossed
        if (!state.direction && (deltaX > 6 || deltaY > 6)) {
            const direction = deltaX > deltaY ? "horizontal" : "vertical"

            setGestureState((prev) => ({ ...prev, direction }))

            // Capture pointer for horizontal gestures
            if (direction === "horizontal") {
                try {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    setGestureState((prev) => ({ ...prev, hasCaptured: true }))
                } catch {}
            }
        }
    }, [])

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
            const state = gestureRef.current
            if (!state.isActive || state.pointerId !== e.pointerId) return

            const deltaX = e.clientX - state.startX
            const absDeltaX = Math.abs(deltaX)
            const absDeltaY = Math.abs(e.clientY - state.startY)

            const isHorizontal =
                state.direction === "horizontal" || absDeltaX > absDeltaY
            const shouldSuppressClick = isHorizontal && absDeltaX > 8

            if (isHorizontal && absDeltaX > 40) {
                if (deltaX < 0) {
                    nextPage()
                } else {
                    prevPage()
                }
            }

            if (state.hasCaptured) {
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId)
                } catch {}
            }

            setGestureState({
                isActive: false,
                startX: 0,
                startY: 0,
                pointerId: null,
                direction: null,
                hasCaptured: false,
                shouldSuppressClick,
            })

            startAutoAdvance()
        },
        [nextPage, prevPage, startAutoAdvance]
    )

    const handlePointerCancel = useCallback(
        (e: React.PointerEvent) => {
            const state = gestureRef.current
            if (!state.isActive) return

            if (state.hasCaptured && state.pointerId !== null) {
                try {
                    e.currentTarget.releasePointerCapture(state.pointerId)
                } catch {}
            }

            setGestureState({
                isActive: false,
                startX: 0,
                startY: 0,
                pointerId: null,
                direction: null,
                hasCaptured: false,
                shouldSuppressClick: false,
            })

            startAutoAdvance()
        },
        [startAutoAdvance]
    )

    const handleClickCapture = useCallback((e: React.MouseEvent) => {
        if (gestureRef.current.shouldSuppressClick) {
            e.preventDefault()
            e.stopPropagation()
            setGestureState((prev) => ({ ...prev, shouldSuppressClick: false }))
        }
    }, [])

    // ── Keyboard Navigation ────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                prevPage()
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                nextPage()
            }
        },
        [prevPage, nextPage]
    )

    // ── Render ─────────────────────────────────────────────────────
    const showPlaceholder = !content || (items.length === 0 && showEmptyState)

    const {
        showIndicators = true,
        indicatorSize = 8,
        indicatorInset = 16,
        indicatorSpacing = 6,
        indicatorPadding = 8,
        indicatorColor = "#ffffff",
        indicatorBackground = "rgba(0,0,0,0.25)",
        indicatorRadius = 20,
        inactiveAlpha = 0.4,
        activeAlpha = 1,
        backgroundBlur = 8,
    } = indicators

    return (
        <div
            role="region"
            aria-label={ariaLabel}
            aria-roledescription="carousel"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={stopAutoAdvance}
            onMouseLeave={startAutoAdvance}
            onPointerDown={enableDrag ? handlePointerDown : undefined}
            onPointerMove={enableDrag ? handlePointerMove : undefined}
            onPointerUp={enableDrag ? handlePointerUp : undefined}
            onPointerCancel={enableDrag ? handlePointerCancel : undefined}
            onClickCapture={enableDrag ? handleClickCapture : undefined}
            style={{
                position: "relative",
                width: style?.width ?? "100%",
                height: style?.height ?? "100%",
                minWidth: hasExplicitWidth ? undefined : 600,
                minHeight: hasExplicitHeight ? undefined : 400,
                background,
                boxSizing: "border-box",
                outline: "none",
                cursor: enableDrag
                    ? gestureState.isActive
                        ? "grabbing"
                        : "grab"
                    : "default",
                touchAction: enableDrag ? "pan-y" : "auto",
                ...style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow,
                    paddingTop: paddingT,
                    paddingRight: paddingR,
                    paddingBottom: paddingB,
                    paddingLeft: paddingL,
                    boxSizing: "border-box",
                }}
            >
                <div
                    ref={containerRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        opacity: isLayoutReady ? 1 : 0,
                        visibility: isLayoutReady ? "visible" : "hidden",
                        transition: "opacity 0.2s ease",
                    }}
                >
                    {content}
                </div>

                {showPlaceholder && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: 10,
                            background:
                                "linear-gradient(180deg, rgba(98,84,243,0.12) 0%, rgba(98,84,243,0.08) 100%)",
                            borderRadius: 14,
                            border: "1px dashed rgba(121,102,255,0.45)",
                            fontFamily: "system-ui, sans-serif",
                            userSelect: "none",
                            padding: 24,
                            boxSizing: "border-box",
                            pointerEvents: "none",
                            zIndex: 20,
                        }}
                    >
                        <span style={{ fontSize: 40, lineHeight: 1.15 }}>
                            ✨
                        </span>
                        <span
                            style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: "#9966FF",
                                letterSpacing: "-0.02em",
                                lineHeight: 1.15,
                            }}
                        >
                            Connect to Content
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "#9966FF",
                                lineHeight: 1.45,
                                maxWidth: 320,
                                textAlign: "center",
                            }}
                        >
                            Add layers or components to swipe between.
                        </span>
                    </div>
                )}
            </div>

            {/* Indicators */}
            {showIndicators && items.length > itemsVisible && (
                <div
                    aria-label="Slide navigation"
                    style={{
                        position: "absolute",
                        bottom: indicatorInset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: indicatorSpacing,
                        padding: indicatorPadding,
                        background: indicatorBackground,
                        borderRadius: indicatorRadius,
                        backdropFilter:
                            backgroundBlur > 0
                                ? `blur(${backgroundBlur}px)`
                                : undefined,
                        WebkitBackdropFilter:
                            backgroundBlur > 0
                                ? `blur(${backgroundBlur}px)`
                                : undefined,
                        zIndex: 10,
                        boxSizing: "border-box",
                    }}
                >
                    {Array.from({ length: layout.totalPages }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Go to page ${i + 1}`}
                            aria-current={
                                i === safeCurrentPage ? "true" : undefined
                            }
                            onClick={(e) => {
                                e.stopPropagation()
                                navigateToPage(i)
                            }}
                            style={{
                                width: indicatorSize,
                                height: indicatorSize,
                                borderRadius: "50%",
                                background: indicatorColor,
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                opacity:
                                    i === safeCurrentPage
                                        ? activeAlpha
                                        : inactiveAlpha,
                                transition: "opacity 0.25s ease",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════
// EXTERNAL CONTROL OVERRIDES
// ══════════════════════════════════════════════════════════════════

export function withCarouselPrev(Component: any): React.ComponentType {
    return forwardRef(function WithCarouselPrev(props: any, ref) {
        const fallbackId = resolveCarouselId(props?.name, true)
        const [isDisabled, setIsDisabled] = useState(
            !getNavigationState(fallbackId).canPrev
        )

        useEffect(() => {
            const update = () => {
                startTransition(() => {
                    setIsDisabled(!getNavigationState(fallbackId).canPrev)
                })
            }
            update()
            return subscribeToNavState(fallbackId, update)
        }, [fallbackId])

        const handleClick = (event: any) => {
            if (isDisabled) {
                event?.preventDefault?.()
                event?.stopPropagation?.()
                return
            }

            props?.onClick?.(event)
            event?.stopPropagation?.()

            const ancestorId = findCarouselIdInAncestry(
                event?.currentTarget ?? null
            )
            const targetId = ancestorId ?? resolveCarouselId(props?.name)
            const control = controlRegistry.get(targetId)

            control?.prev()
        }

        return (
            <Component
                ref={ref}
                {...props}
                onClick={handleClick}
                aria-disabled={isDisabled}
                style={{
                    ...props?.style,
                    opacity: isDisabled ? 0.45 : props?.style?.opacity,
                    pointerEvents: isDisabled
                        ? "none"
                        : props?.style?.pointerEvents,
                }}
            />
        )
    })
}

export function withCarouselNext(Component: any): React.ComponentType {
    return forwardRef(function WithCarouselNext(props: any, ref) {
        const fallbackId = resolveCarouselId(props?.name, true)
        const [isDisabled, setIsDisabled] = useState(
            !getNavigationState(fallbackId).canNext
        )

        useEffect(() => {
            const update = () => {
                startTransition(() => {
                    setIsDisabled(!getNavigationState(fallbackId).canNext)
                })
            }
            update()
            return subscribeToNavState(fallbackId, update)
        }, [fallbackId])

        const handleClick = (event: any) => {
            if (isDisabled) {
                event?.preventDefault?.()
                event?.stopPropagation?.()
                return
            }

            props?.onClick?.(event)
            event?.stopPropagation?.()

            const ancestorId = findCarouselIdInAncestry(
                event?.currentTarget ?? null
            )
            const targetId = ancestorId ?? resolveCarouselId(props?.name)
            const control = controlRegistry.get(targetId)

            control?.next()
        }

        return (
            <Component
                ref={ref}
                {...props}
                onClick={handleClick}
                aria-disabled={isDisabled}
                style={{
                    ...props?.style,
                    opacity: isDisabled ? 0.45 : props?.style?.opacity,
                    pointerEvents: isDisabled
                        ? "none"
                        : props?.style?.pointerEvents,
                }}
            />
        )
    })
}

// ══════════════════════════════════════════════════════════════════
// FRAMER PROPERTY CONTROLS
// ══════════════════════════════════════════════════════════════════

addPropertyControls(CustomCMSCarousel, {
    content: {
        type: ControlType.ComponentInstance,
        title: "Content",
        description:
            "Connect a CMS Collection List for this carousel to render.",
    },

    carouselId: {
        type: ControlType.String,
        title: "Carousel ID",
        description:
            "ID used by Prev/Next overrides to target this carousel. [Learn more](https://forest-wavelength-29c.notion.site/Carousel-ID-Quick-Guide-3ddda009397580da82e9e98371c0df66)",
        defaultValue: "carousel-1",
        placeholder: "carousel-1",
    },

    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    itemsVisible: {
        type: ControlType.Number,
        title: "Items Visible",
        description: "How many slides are fully visible at once.",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },

    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 0,
        min: 0,
        max: 200,
        unit: "px",
    },

    padding: {
        type: ControlType.FusedNumber,
        title: "Padding",
        defaultValue: 0,
        toggleKey: "paddingPerSide",
        toggleTitles: ["All", "Individual"],
        valueKeys: [
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
    },

    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical Align",
        defaultValue: "center",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
    },

    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        defaultValue: "hidden",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },

    animationOptions: {
        title: "Animation",
        type: ControlType.Transition,
        defaultValue: {
            type: "tween",
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        },
    },

    autoAdvance: {
        type: ControlType.Boolean,
        title: "Auto Advance",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    advanceDelay: {
        type: ControlType.Number,
        title: "Advance Delay",
        defaultValue: 4,
        min: 1,
        max: 30,
        unit: "s",
        hidden: (p: CarouselProps) => !p.autoAdvance,
    },

    indicators: {
        type: ControlType.Object,
        title: "Indicators",
        controls: {
            showIndicators: {
                type: ControlType.Boolean,
                title: "Show Indicators",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            indicatorSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 8,
                min: 4,
                max: 24,
                unit: "px",
                hidden: (p: any) => !p.showIndicators,
            },
            indicatorInset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 16,
                min: 0,
                max: 100,
                unit: "px",
                hidden: (p: any) => !p.showIndicators,
            },
            indicatorSpacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 6,
                min: 0,
                max: 32,
                unit: "px",
                hidden: (p: any) => !p.showIndicators,
            },
            indicatorPadding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 8,
                min: 0,
                max: 32,
                unit: "px",
                hidden: (p: any) => !p.showIndicators,
            },
            indicatorColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
                hidden: (p: any) => !p.showIndicators,
            },
            indicatorBackground: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0.25)",
                hidden: (p: any) => !p.showIndicators,
            },
            indicatorRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 20,
                min: 0,
                max: 60,
                unit: "px",
                hidden: (p: any) => !p.showIndicators,
            },
            inactiveAlpha: {
                type: ControlType.Number,
                title: "Inactive Opacity",
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => !p.showIndicators,
            },
            activeAlpha: {
                type: ControlType.Number,
                title: "Active Opacity",
                defaultValue: 1,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => !p.showIndicators,
            },
            backgroundBlur: {
                type: ControlType.Number,
                title: "Background Blur",
                defaultValue: 8,
                min: 0,
                max: 40,
                unit: "px",
                hidden: (p: any) => !p.showIndicators,
            },
        },
    },

    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "CMS Carousel",
        placeholder: "e.g. Featured Posts Carousel",
    },
})

export default CustomCMSCarousel
