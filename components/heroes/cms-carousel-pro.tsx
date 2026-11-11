/**
 * CMS Carousel — Framer Code Component
 * ─────────────────────────────────────
 * Connect any CMS Collection List via "CMS Collection" property.
 * Uses DOM + MutationObserver so it works in canvas AND preview/published.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Types ─────────────────────────────────────────────────────────

interface Props {
    cmsCollection?: React.ReactNode
    slidesPerView: number
    peekAmount: number
    gap: number
    padding: number | number[]
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    background: string
    overflow: "hidden" | "visible"
    alignment: "flex-start" | "center" | "flex-end"
    showArrows: boolean
    arrowFill: string
    arrowSize: number
    arrowRadius: number
    arrowInset: number
    arrowVerticalOffset: number
    prevArrowImage: string
    nextArrowImage: string
    showDots: boolean
    dotSize: number
    dotInset: number
    dotGap: number
    dotPadding: number
    dotFill: string
    dotBackdrop: string
    dotRadius: number
    dotInactiveOpacity: number
    dotActiveOpacity: number
    dotBlur: number
    autoplay: boolean
    autoplayInterval: number
    transition: boolean
    transitionDuration: number
    fading: boolean
    fadeWidth: number
    fadeOpacity: number
    ariaLabel: string
}

// ── Helpers ───────────────────────────────────────────────────────

function findItemContainer(root: Element): HTMLElement | null {
    if (root.children.length > 1) return root as HTMLElement
    if (root.children.length === 1) return findItemContainer(root.children[0])
    return null
}

function getContrastColor(hex: string): string {
    try {
        const h = hex.replace("#", "")
        const r = parseInt(h.substring(0, 2), 16)
        const g = parseInt(h.substring(2, 4), 16)
        const b = parseInt(h.substring(4, 6), 16)
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000" : "#fff"
    } catch {
        return "#000"
    }
}

// ── SVG arrow icons ───────────────────────────────────────────────

const ChevronLeft = ({ color }: { color: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <path
            d="M15 18L9 12L15 6"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ChevronRight = ({ color }: { color: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <path
            d="M9 18L15 12L9 6"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// ── Main component ────────────────────────────────────────────────

export default function CMSCarousel(props: Props) {
    const {
        cmsCollection,
        slidesPerView = 1,
        peekAmount = 0,
        gap = 0,
        padding = 0,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        background = "transparent",
        overflow = "hidden",
        alignment = "center",
        showArrows = true,
        arrowFill = "#ffffff",
        arrowSize = 40,
        arrowRadius = 20,
        arrowInset = 16,
        arrowVerticalOffset = 0,
        prevArrowImage = "",
        nextArrowImage = "",
        showDots = true,
        dotSize = 8,
        dotInset = 16,
        dotGap = 6,
        dotPadding = 8,
        dotFill = "#ffffff",
        dotBackdrop = "rgba(0,0,0,0.25)",
        dotRadius = 20,
        dotInactiveOpacity = 0.4,
        dotActiveOpacity = 1,
        dotBlur = 8,
        autoplay = false,
        autoplayInterval = 4,
        transition: useTransition = true,
        transitionDuration = 400,
        fading = false,
        fadeWidth = 10,
        fadeOpacity = 0,
        ariaLabel = "CMS Carousel",
    } = props

    // Resolve FusedNumber padding into [top, right, bottom, left]
    const resolvePadding = (): [number, number, number, number] => {
        if (paddingTop !== undefined)
            return [
                paddingTop ?? 0,
                paddingRight ?? 0,
                paddingBottom ?? 0,
                paddingLeft ?? 0,
            ]
        if (Array.isArray(padding))
            return [
                padding[0] ?? 0,
                padding[1] ?? 0,
                padding[2] ?? 0,
                padding[3] ?? 0,
            ]
        const n = typeof padding === "number" ? padding : 0
        return [n, n, n, n]
    }
    const [pt, pr, pb, pl] = resolvePadding()

    const wrapperRef = useRef<HTMLDivElement>(null)
    const [count, setCount] = useState(0)
    const [current, setCurrent] = useState(0)
    const timerRef = useRef<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef(0)

    // ── Core layout engine ────────────────────────────────────────
    // Reads CMS children from the DOM and applies flex carousel layout.
    // Called only from explicit triggers (observers, prop changes, navigation)
    // — never from a bare useLayoutEffect to avoid render loops.

    const applyCarousel = useCallback(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const container = findItemContainer(wrapper)
        if (!container) return
        const items = Array.from(container.children) as HTMLElement[]
        const n = items.length
        if (n === 0) return

        setCount((prev) => (prev !== n ? n : prev))

        const viewportWidth = wrapper.offsetWidth - pl - pr
        if (viewportWidth <= 0) return

        const spv = Math.max(1, slidesPerView)
        let slideWidth: number
        if (peekAmount > 0) {
            slideWidth = (viewportWidth - gap * spv) / (spv + peekAmount)
        } else {
            slideWidth = (viewportWidth - gap * (spv - 1)) / spv
        }
        slideWidth = Math.max(1, slideWidth)

        container.style.display = "flex"
        container.style.flexDirection = "row"
        container.style.flexWrap = "nowrap"
        container.style.alignItems = alignment
        container.style.gap = `${gap}px`
        container.style.height = "100%"
        container.style.width = `${n * slideWidth + (n - 1) * gap}px`
        container.style.transition = useTransition
            ? `transform ${transitionDuration}ms cubic-bezier(0.4,0,0.2,1)`
            : "none"
        container.style.transform = `translateX(${pl}px) translateX(calc(-${current} * (${slideWidth}px + ${gap}px)))`
        container.style.willChange = "transform"

        items.forEach((item) => {
            item.style.flex = `0 0 ${slideWidth}px`
            item.style.width = `${slideWidth}px`
            item.style.minWidth = `${slideWidth}px`
            item.style.height = "100%"
            item.style.boxSizing = "border-box"
            item.style.overflow = "hidden"
        })
    }, [
        current,
        gap,
        pl,
        pr,
        alignment,
        useTransition,
        transitionDuration,
        slidesPerView,
        peekAmount,
    ])

    // Trigger layout when any visual prop or current index changes.
    useEffect(() => {
        applyCarousel()
    }, [applyCarousel])

    // MutationObserver — picks up CMS children loading asynchronously.
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const mo = new MutationObserver(() => applyCarousel())
        mo.observe(wrapper, {
            childList: true,
            subtree: true,
            attributes: true,
        })
        return () => mo.disconnect()
    }, [applyCarousel])

    // ResizeObserver — re-runs layout when the container is resized.
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const ro = new ResizeObserver(() => applyCarousel())
        ro.observe(wrapper)
        return () => ro.disconnect()
    }, [applyCarousel])

    // Clamp current index when slidesPerView or count changes.
    useEffect(() => {
        const max = Math.max(0, count - Math.max(1, slidesPerView))
        if (current > max) setCurrent(max)
    }, [count, slidesPerView])

    // ── Navigation ────────────────────────────────────────────────

    const maxIndex = Math.max(0, count - Math.max(1, slidesPerView))

    const goTo = useCallback(
        (idx: number) => {
            if (idx > maxIndex) setCurrent(0)
            else if (idx < 0) setCurrent(maxIndex)
            else setCurrent(idx)
        },
        [maxIndex]
    )

    const prev = useCallback(() => goTo(current - 1), [current, goTo])
    const next = useCallback(() => goTo(current + 1), [current, goTo])

    // ── Autoplay ──────────────────────────────────────────────────

    const pauseAutoplay = useCallback(() => {
        if (timerRef.current != null) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const resumeAutoplay = useCallback(() => {
        if (!autoplay || count < 2) return
        timerRef.current = window.setInterval(next, autoplayInterval * 1000)
    }, [autoplay, autoplayInterval, next, count])

    useEffect(() => {
        if (!autoplay || count < 2) return
        timerRef.current = window.setInterval(next, autoplayInterval * 1000)
        return () => {
            if (timerRef.current != null) clearInterval(timerRef.current)
        }
    }, [autoplay, autoplayInterval, next, count])

    // ── Interaction handlers ──────────────────────────────────────

    const handlePointerDown = (e: React.PointerEvent) => {
        dragStart.current = e.clientX
        setIsDragging(true)
        pauseAutoplay()
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return
        const delta = e.clientX - dragStart.current
        if (Math.abs(delta) > 40) delta < 0 ? next() : prev()
        setIsDragging(false)
        resumeAutoplay()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") prev()
        if (e.key === "ArrowRight") next()
    }

    // ── Edge fade mask ────────────────────────────────────────────

    const fadeMask = fading
        ? `linear-gradient(to right, rgba(0,0,0,${fadeOpacity}) 0%, rgba(0,0,0,1) ${fadeWidth}%, rgba(0,0,0,1) ${100 - fadeWidth}%, rgba(0,0,0,${fadeOpacity}) 100%)`
        : undefined

    // ── Render ────────────────────────────────────────────────────

    return (
        <div
            role="region"
            aria-label={ariaLabel || "CMS Carousel"}
            aria-roledescription="carousel"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={pauseAutoplay}
            onMouseLeave={resumeAutoplay}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                boxSizing: "border-box",
                outline: "none",
                cursor: isDragging ? "grabbing" : "grab",
                WebkitMaskImage: fadeMask,
                maskImage: fadeMask,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow,
                    paddingTop: pt,
                    paddingBottom: pb,
                    boxSizing: "border-box",
                }}
            >
                <div
                    ref={wrapperRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                    }}
                >
                    {cmsCollection ?? (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: 8,
                                background: background || "rgba(0,0,0,0.04)",
                                borderRadius: 12,
                                border: "1.5px dashed rgba(0,0,0,0.15)",
                                fontFamily: "system-ui, sans-serif",
                                color: "rgba(0,0,0,0.4)",
                                fontSize: 13,
                                userSelect: "none",
                                padding: 24,
                                boxSizing: "border-box",
                            }}
                        >
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <rect
                                    x="2"
                                    y="6"
                                    width="20"
                                    height="12"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M7 12H17M7 12L10 9M7 12L10 15"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span
                                style={{ textAlign: "center", lineHeight: 1.5 }}
                            >
                                Connect a <strong>CMS Collection List</strong>{" "}
                                via
                                <br />
                                "CMS Collection" in the right panel →
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Arrows */}
            {showArrows &&
                count > 1 &&
                (["prev", "next"] as const).map((dir) => (
                    <button
                        key={dir}
                        aria-label={
                            dir === "prev" ? "Previous slide" : "Next slide"
                        }
                        onClick={(e) => {
                            e.stopPropagation()
                            dir === "prev" ? prev() : next()
                        }}
                        style={{
                            position: "absolute",
                            top: `calc(50% + ${arrowVerticalOffset}px)`,
                            [dir === "prev" ? "left" : "right"]: arrowInset,
                            transform: "translateY(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: arrowRadius,
                            background: arrowFill,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            padding: arrowSize * 0.22,
                            boxSizing: "border-box",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                            transition: "opacity 0.2s, transform 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.opacity = "0.85"
                            el.style.transform = "translateY(-50%) scale(1.08)"
                        }}
                        onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement
                            el.style.opacity = "1"
                            el.style.transform = "translateY(-50%) scale(1)"
                        }}
                    >
                        {dir === "prev" ? (
                            prevArrowImage ? (
                                <img
                                    src={prevArrowImage}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <ChevronLeft
                                    color={getContrastColor(arrowFill)}
                                />
                            )
                        ) : nextArrowImage ? (
                            <img
                                src={nextArrowImage}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        ) : (
                            <ChevronRight color={getContrastColor(arrowFill)} />
                        )}
                    </button>
                ))}

            {/* Dots */}
            {showDots && count > 1 && (
                <div
                    role="tablist"
                    aria-label="Slide navigation"
                    style={{
                        position: "absolute",
                        bottom: dotInset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: dotGap,
                        padding: dotPadding,
                        background: dotBackdrop,
                        borderRadius: dotRadius,
                        backdropFilter:
                            dotBlur > 0 ? `blur(${dotBlur}px)` : undefined,
                        WebkitBackdropFilter:
                            dotBlur > 0 ? `blur(${dotBlur}px)` : undefined,
                        zIndex: 10,
                        boxSizing: "border-box",
                    }}
                >
                    {Array.from({
                        length:
                            Math.max(0, count - Math.max(1, slidesPerView)) + 1,
                    }).map((_, i) => (
                        <button
                            key={i}
                            role="tab"
                            aria-label={`Go to slide ${i + 1}`}
                            aria-selected={i === current}
                            onClick={(e) => {
                                e.stopPropagation()
                                goTo(i)
                            }}
                            style={{
                                width: i === current ? dotSize * 2.2 : dotSize,
                                height: dotSize,
                                borderRadius: dotSize / 2,
                                background: dotFill,
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                opacity:
                                    i === current
                                        ? dotActiveOpacity
                                        : dotInactiveOpacity,
                                transition:
                                    "width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Property Controls ─────────────────────────────────────────────

addPropertyControls(CMSCarousel, {
    // ── Content ──────────────────────────────────────────────────
    cmsCollection: {
        type: ControlType.ComponentInstance,
        title: "CMS Collection",
        description:
            "Connect a Framer CMS Collection List here. The carousel will automatically read its items.",
    },

    // ── Layout ───────────────────────────────────────────────────
    slidesPerView: {
        type: ControlType.Number,
        title: "Slides / View",
        description: "Number of slides fully visible at once.",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    peekAmount: {
        type: ControlType.Number,
        title: "Peek Amount",
        description:
            "Shows a partial slice of the next slide. 0.3 = 30% of the next slide is visible at the edge.",
        defaultValue: 0,
        min: 0,
        max: 0.9,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Space between slides.",
        defaultValue: 0,
        min: 0,
        max: 200,
        unit: "px",
    },
    padding: {
        type: ControlType.FusedNumber,
        title: "Padding",
        description: "Inner padding of the carousel container.",
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
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        description: "Vertical alignment of slides within the carousel height.",
        defaultValue: "center",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        description:
            "Hidden clips slides at the container edge. Visible allows the peek effect to show outside the bounds.",
        defaultValue: "hidden",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },

    // ── Transition ───────────────────────────────────────────────
    transition: {
        type: ControlType.Boolean,
        title: "Transition",
        description: "Smooth slide animation between positions.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        description: "How long the slide animation takes.",
        defaultValue: 400,
        min: 100,
        max: 2000,
        unit: "ms",
        hidden: (p: Props) => !p.transition,
    },

    // ── Autoplay ─────────────────────────────────────────────────
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description:
            "Automatically advances to the next slide on a timer. Pauses on hover.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Interval",
        description: "Seconds between each auto-advance.",
        defaultValue: 4,
        min: 1,
        max: 30,
        unit: "s",
        hidden: (p: Props) => !p.autoplay,
    },

    // ── Edge Fading ──────────────────────────────────────────────
    fading: {
        type: ControlType.Boolean,
        title: "Edge Fading",
        description:
            "Applies a transparency fade mask at the left and right edges of the carousel.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fadeWidth: {
        type: ControlType.Number,
        title: "Fade Width",
        description:
            "How far the fade extends inward from each edge, as a percentage of carousel width.",
        defaultValue: 10,
        min: 1,
        max: 50,
        unit: "%",
        hidden: (p: Props) => !p.fading,
    },
    fadeOpacity: {
        type: ControlType.Number,
        title: "Fade Opacity",
        description:
            "Transparency at the very edge. 0 = fully transparent, 1 = no fade.",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => !p.fading,
    },

    // ── Arrows ───────────────────────────────────────────────────
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        description: "Previous / next navigation buttons.",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowFill: {
        type: ControlType.Color,
        title: "Arrow Fill",
        description:
            "Background color of the arrow buttons. The chevron icon auto-contrasts.",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.showArrows,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 40,
        min: 20,
        max: 120,
        unit: "px",
        hidden: (p: Props) => !p.showArrows,
    },
    arrowRadius: {
        type: ControlType.Number,
        title: "Arrow Radius",
        description:
            "Border radius of the arrow button. Set to half the size for a circle.",
        defaultValue: 20,
        min: 0,
        max: 60,
        unit: "px",
        hidden: (p: Props) => !p.showArrows,
    },
    arrowInset: {
        type: ControlType.Number,
        title: "Arrow H. Inset",
        description: "Horizontal distance of the arrow from the carousel edge.",
        defaultValue: 16,
        min: 0,
        max: 100,
        unit: "px",
        hidden: (p: Props) => !p.showArrows,
    },
    arrowVerticalOffset: {
        type: ControlType.Number,
        title: "Arrow V. Offset",
        description:
            "Nudges the arrow up (negative) or down (positive) from the vertical center.",
        defaultValue: 0,
        min: -500,
        max: 500,
        unit: "px",
        hidden: (p: Props) => !p.showArrows,
    },
    prevArrowImage: {
        type: ControlType.Image,
        title: "Prev Icon",
        description:
            "Custom image for the previous arrow. Replaces the default chevron.",
        hidden: (p: Props) => !p.showArrows,
    },
    nextArrowImage: {
        type: ControlType.Image,
        title: "Next Icon",
        description:
            "Custom image for the next arrow. Replaces the default chevron.",
        hidden: (p: Props) => !p.showArrows,
    },

    // ── Dots ─────────────────────────────────────────────────────
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        description: "Dot indicator row showing the current slide position.",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 4,
        max: 24,
        unit: "px",
        hidden: (p: Props) => !p.showDots,
    },
    dotInset: {
        type: ControlType.Number,
        title: "Dot Inset",
        description: "Distance of the dot row from the bottom edge.",
        defaultValue: 16,
        min: 0,
        max: 100,
        unit: "px",
        hidden: (p: Props) => !p.showDots,
    },
    dotGap: {
        type: ControlType.Number,
        title: "Dot Gap",
        description: "Space between each dot.",
        defaultValue: 6,
        min: 0,
        max: 32,
        unit: "px",
        hidden: (p: Props) => !p.showDots,
    },
    dotPadding: {
        type: ControlType.Number,
        title: "Dot Padding",
        description: "Inner padding of the dot container pill.",
        defaultValue: 8,
        min: 0,
        max: 32,
        unit: "px",
        hidden: (p: Props) => !p.showDots,
    },
    dotFill: {
        type: ControlType.Color,
        title: "Dot Fill",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.showDots,
    },
    dotBackdrop: {
        type: ControlType.Color,
        title: "Backdrop",
        description: "Background color of the pill that contains the dots.",
        defaultValue: "rgba(0,0,0,0.25)",
        hidden: (p: Props) => !p.showDots,
    },
    dotRadius: {
        type: ControlType.Number,
        title: "Backdrop Radius",
        description: "Border radius of the dot backdrop pill.",
        defaultValue: 20,
        min: 0,
        max: 60,
        unit: "px",
        hidden: (p: Props) => !p.showDots,
    },
    dotInactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        description: "Opacity of non-active dots.",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => !p.showDots,
    },
    dotActiveOpacity: {
        type: ControlType.Number,
        title: "Active Opacity",
        description: "Opacity of the currently active dot.",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => !p.showDots,
    },
    dotBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        description: "Frosted glass blur applied to the dot backdrop.",
        defaultValue: 8,
        min: 0,
        max: 40,
        unit: "px",
        hidden: (p: Props) => !p.showDots,
    },

    // ── Accessibility ─────────────────────────────────────────────
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        description:
            "Screen reader label for the carousel region. Use a descriptive name like 'Featured Posts'.",
        defaultValue: "CMS Carousel",
        placeholder: "e.g. Featured Posts Carousel",
    },
})
