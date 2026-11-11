// CMS Slider — turns any Collection List into a swipeable slider.
// Connect a Collection List to "Content"; every CMS item becomes a slide.
// Cards keep their own design and CMS bindings; the slider only lays them out
// in a row, sizes them per breakpoint and adds arrows, dots, drag and autoplay.
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
    type PointerEvent as ReactPointerEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
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

import { useReducedMotion } from "framer-motion"

interface CMSSliderProps {
    content: ReactNode
    header: ReactNode
    slideSize: "perView" | "full"
    desktopSlides: number
    tabletSlides: number
    phoneSlides: number
    maxSlides: number
    slideGap: number
    peek: number
    slideOverflow: "hidden" | "visible"
    showArrows: boolean
    arrowPlacement: "below" | "top" | "sides" | "outside" | "custom"
    arrowAnchor: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
    arrowOffsetX: number
    arrowOffsetY: number
    arrowSize: number
    arrowFill: string
    arrowIcon: string
    arrowBorder: string
    arrowRadius: number
    showDots: boolean
    indicator: "dots" | "numbers" | "counter"
    counterSeparator: string
    dotColor: string
    dotActiveColor: string
    dotWidth: number
    activeDotWidth: number
    dotHeight: number
    dotGap: number
    numberFont: CSSProperties
    numberColor: string
    activeNumberColor: string
    leadingZero: boolean
    controlsGap: number
    controlsAlign: "space-between" | "center" | "flex-end"
    draggable: boolean
    autoplay: boolean
    interval: number
    loop: boolean
    style?: CSSProperties
}

function Chevron({ direction, color }: { direction: "left" | "right"; color: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
                stroke={color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * CMS Slider
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 480
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CMSSlider(props: CMSSliderProps) {
    const {
        content,
        header,
        slideSize = "perView",
        desktopSlides = 3,
        tabletSlides = 2,
        phoneSlides = 1,
        maxSlides = 0,
        slideGap = 20,
        peek = 0,
        slideOverflow = "hidden",
        showArrows = true,
        arrowPlacement = "below",
        arrowAnchor = "top-right",
        arrowOffsetX = 0,
        arrowOffsetY = 0,
        arrowSize = 44,
        arrowFill = "#FFFFFF",
        arrowIcon = "#161A19",
        arrowBorder = "rgba(22, 26, 25, 0.12)",
        arrowRadius = 999,
        showDots = true,
        indicator = "dots",
        counterSeparator = "/",
        dotColor = "rgba(22, 26, 25, 0.2)",
        dotActiveColor = "#161A19",
        dotWidth = 8,
        activeDotWidth = 24,
        dotHeight = 8,
        dotGap = 16,
        numberFont,
        numberColor = "rgba(22, 26, 25, 0.4)",
        activeNumberColor = "#161A19",
        leadingZero = false,
        controlsGap = 24,
        controlsAlign = "space-between",
        draggable = true,
        autoplay = false,
        interval = 4,
        loop = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const viewportRef = useRef<HTMLDivElement>(null)

    const [index, setIndex] = useState(0)
    const [measured, setPositions] = useState(1)
    // The canvas can't measure slides, so preview the controls with 3 positions.
    // Until the slides are measured, reserve room for the controls (hidden) so the
    // page doesn't shift when they appear.
    const [ready, setReady] = useState(false)
    const positions = isStatic ? 3 : ready ? measured : 2
    const pending = !isStatic && !ready
    const [hovered, setHovered] = useState(false)
    const [dragging, setDragging] = useState(false)
    const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false })
    const frameRef = useRef<HTMLDivElement>(null)
    // Visible overflow: how far our own frame sits from the window edges.
    const [bleed, setBleed] = useState({ left: 0, right: 0, base: 0 })
    const showOutside = slideOverflow === "visible" && !isStatic
    const wantsOutsideArrows = showArrows && arrowPlacement === "outside"

    const hasContent = Array.isArray(content) ? content.length > 0 : !!content
    const hasHeader = Array.isArray(header) ? header.length > 0 : !!header

    // Distance between two slides, measured on our own viewport.
    const getStep = useCallback(() => {
        const viewport = viewportRef.current
        const first = viewport?.firstElementChild?.firstElementChild as HTMLElement | null
        if (!viewport || !first) return 0
        return first.getBoundingClientRect().width + slideGap
    }, [slideGap])

    const measure = useCallback(() => {
        const viewport = viewportRef.current
        const step = getStep()
        if (!viewport || step <= 0) return
        const max = viewport.scrollWidth - viewport.clientWidth
        const count = Math.max(1, Math.round(max / step) + 1)
        const current = Math.min(count - 1, Math.round(viewport.scrollLeft / step))
        setPositions((p) => (p === count ? p : count))
        setIndex((i) => (i === current ? i : current))
        setReady(true)
    }, [getStep])

    useEffect(() => {
        const viewport = viewportRef.current
        if (!viewport || isStatic) return
        measure()
        const observer = new ResizeObserver(() => measure())
        observer.observe(viewport)
        if (viewport.firstElementChild) observer.observe(viewport.firstElementChild)
        viewport.addEventListener("scroll", measure, { passive: true })
        return () => {
            observer.disconnect()
            viewport.removeEventListener("scroll", measure)
        }
    }, [measure, isStatic, hasContent])

    useEffect(() => {
        const frame = frameRef.current
        if ((!showOutside && !wantsOutsideArrows) || isStatic || !frame) {
            setBleed((b) => (b.left || b.right || b.base ? { left: 0, right: 0, base: 0 } : b))
            return
        }
        const update = () => {
            const rect = frame.getBoundingClientRect()
            const pageWidth = document.documentElement.clientWidth
            const next = {
                left: Math.max(0, Math.round(rect.left)),
                right: Math.max(0, Math.round(pageWidth - rect.right)),
                base: Math.round(rect.width),
            }
            setBleed((b) =>
                b.left === next.left && b.right === next.right && b.base === next.base ? b : next
            )
        }
        update()
        const observer = new ResizeObserver(update)
        observer.observe(frame)
        window.addEventListener("resize", update)
        return () => {
            observer.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [showOutside, wantsOutsideArrows, isStatic, hasContent])

    const goTo = useCallback(
        (target: number) => {
            const viewport = viewportRef.current
            const step = getStep()
            if (!viewport || step <= 0) return
            let next = target
            if (next > positions - 1) next = loop ? 0 : positions - 1
            if (next < 0) next = loop ? positions - 1 : 0
            setIndex(next)
            viewport.scrollTo({
                left: next * step,
                behavior: reduceMotion ? "auto" : "smooth",
            })
        },
        [getStep, positions, loop, reduceMotion]
    )

    // Autoplay pauses on hover, while dragging and when the tab is hidden.
    useEffect(() => {
        if (!autoplay || isStatic || hovered || dragging || positions < 2) return
        const id = window.setInterval(() => {
            if (document.visibilityState !== "visible") return
            if (!loop && index >= positions - 1) return
            goTo(index + 1)
        }, Math.max(1, interval) * 1000)
        return () => window.clearInterval(id)
    }, [autoplay, isStatic, hovered, dragging, positions, index, interval, loop, goTo])

    // Mouse drag (touch devices scroll natively).
    function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
        if (!draggable || e.pointerType !== "mouse" || e.button !== 0) return
        const viewport = viewportRef.current
        if (!viewport) return
        drag.current = { active: true, startX: e.clientX, startScroll: viewport.scrollLeft, moved: false }
    }
    function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
        const viewport = viewportRef.current
        if (!drag.current.active || !viewport) return
        const dx = e.clientX - drag.current.startX
        if (!drag.current.moved && Math.abs(dx) > 4) {
            drag.current.moved = true
            setDragging(true)
            viewport.setPointerCapture(e.pointerId)
        }
        if (drag.current.moved) viewport.scrollLeft = drag.current.startScroll - dx
    }
    function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
        const viewport = viewportRef.current
        if (!drag.current.active || !viewport) return
        const moved = drag.current.moved
        drag.current.active = false
        if (!moved) return
        if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId)
        setDragging(false)
        const step = getStep()
        if (step > 0) {
            const dx = e.clientX - drag.current.startX
            const from = Math.round(drag.current.startScroll / step)
            // A short flick moves one slide; a longer drag snaps to the nearest.
            const nearest = Math.round(viewport.scrollLeft / step)
            const target =
                nearest === from && Math.abs(dx) > step * 0.15 ? from + (dx < 0 ? 1 : -1) : nearest
            viewport.scrollTo({
                left: Math.max(0, Math.min(positions - 1, target)) * step,
                behavior: reduceMotion ? "auto" : "smooth",
            })
        }
    }
    // Swallow the click that ends a drag so links inside cards don't open.
    function onClickCapture(e: ReactMouseEvent) {
        if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
            drag.current.moved = false
        }
    }
    function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            goTo(index + 1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            goTo(index - 1)
        }
    }

    const atStart = !loop && index <= 0
    const atEnd = !loop && index >= positions - 1
    // Full width: one slide fills the slider on every breakpoint, no peek.
    const slideWidth = (n: number) =>
        slideSize === "full"
            ? "var(--cms-slider-base, 100cqw)"
            : `calc((var(--cms-slider-base, 100cqw) - ${Math.max(0, n - 1) * slideGap}px - ${peek}px) / ${Math.max(1, n)})`

    // Layout for the connected Collection List (list > cards) inside our viewport.
    // The style text is identical for every instance (values come in as CSS
    // variables), so the server and browser render exactly the same markup.
    const maxCount = Math.floor(maxSlides)
    const css = `${SLIDER_CSS}${
        maxCount > 0
            ? `.cms-slider-vp[data-max="${maxCount}"] > * > *:nth-child(n + ${maxCount + 1}) { display: none !important; }`
            : ""
    }`
    const viewportVars = {
        "--cms-gap": `${slideGap}px`,
        "--cms-w-desktop": slideWidth(desktopSlides),
        "--cms-w-tablet": slideWidth(tabletSlides),
        "--cms-w-phone": slideWidth(phoneSlides),
        "--cms-pad-left": `${showOutside ? bleed.left : 0}px`,
        "--cms-pad-right": `${showOutside ? bleed.right : 0}px`,
    } as CSSProperties

    const arrowButton = (direction: "left" | "right", disabled: boolean): ReactNode => (
        <button
            type="button"
            aria-label={direction === "left" ? "Previous slide" : "Next slide"}
            disabled={disabled}
            onClick={() => goTo(index + (direction === "left" ? -1 : 1))}
            style={{
                width: arrowSize,
                height: arrowSize,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                margin: 0,
                borderRadius: arrowRadius,
                border: `1px solid ${arrowBorder}`,
                background: arrowFill,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.35 : 1,
                transition: "opacity 0.2s ease, transform 0.2s ease",
                boxShadow: arrowPlacement === "sides" ? "0 6px 20px rgba(0, 0, 0, 0.12)" : "none",
                pointerEvents: "auto",
                visibility: pending ? "hidden" : "visible",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <Chevron direction={direction} color={arrowIcon} />
        </button>
    )

    const pad = (n: number) => (leadingZero && n < 10 ? `0${n}` : `${n}`)
    const counter = showDots && positions > 1 && indicator === "counter" && (
        <div
            aria-live="polite"
            aria-label={`Slide ${index + 1} of ${positions}`}
            style={{
                display: "flex",
                alignItems: "baseline",
                gap: Math.min(dotGap, 12),
                whiteSpace: "nowrap",
                visibility: pending ? "hidden" : "visible",
                fontVariantNumeric: "tabular-nums",
                ...numberFont,
            }}
        >
            <span style={{ color: activeNumberColor }}>{pad(index + 1)}</span>
            <span style={{ color: numberColor }}>{counterSeparator}</span>
            <span style={{ color: numberColor }}>{pad(positions)}</span>
        </div>
    )

    // Dots share one height; only the active dot's width and color change.
    // Every dot and number keeps a tap target of at least 24 x 24px; the visible
    // dot sits centered inside it, so Spacing is the space between targets.
    const dots = counter || (showDots && positions > 1 && (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: indicator === "numbers" ? Math.max(0, dotGap - 8) : 0,
                flexWrap: "wrap",
                visibility: pending ? "hidden" : "visible",
            }}
        >
            {Array.from({ length: positions }, (_, i) => {
                const isActive = i === index
                const label = pad(i + 1)
                return indicator === "numbers" ? (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={isActive}
                        onClick={() => goTo(i)}
                        style={{
                            minWidth: 24,
                            minHeight: 24,
                            padding: "2px 4px",
                            margin: 0,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            color: isActive ? activeNumberColor : numberColor,
                            transition: "color 0.3s ease",
                            fontVariantNumeric: "tabular-nums",
                            ...numberFont,
                        }}
                    >
                        {label}
                    </button>
                ) : (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={isActive}
                        onClick={() => goTo(i)}
                        style={{
                            width: Math.max(24, (isActive ? activeDotWidth : dotWidth) + dotGap),
                            height: Math.max(24, dotHeight),
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            margin: 0,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                display: "block",
                                width: isActive ? activeDotWidth : dotWidth,
                                height: dotHeight,
                                borderRadius: dotHeight,
                                background: isActive ? dotActiveColor : dotColor,
                                transition: "width 0.3s ease, background-color 0.3s ease",
                            }}
                        />
                    </button>
                )
            })}
        </div>
    ))

    const canSlide = showArrows && positions > 1
    const showBelowArrows = canSlide && arrowPlacement === "below"
    const showTopArrows = canSlide && arrowPlacement === "top"
    // Outside arrows need room beside the slider; without it they move below the slides.
    const outsideRoom = arrowSize + 16
    const outsideFits = isStatic || (bleed.left >= outsideRoom && bleed.right >= outsideRoom)
    const isOutside = canSlide && arrowPlacement === "outside" && outsideFits
    const outsideFallback = canSlide && arrowPlacement === "outside" && !outsideFits
    const showSideArrows = canSlide && (arrowPlacement === "sides" || isOutside)
    const showCustomArrows = canSlide && arrowPlacement === "custom"
    const [anchorY, anchorX] = arrowAnchor.split("-")
    const customArrowStyle: CSSProperties = {
        position: "absolute",
        zIndex: 3,
        [anchorY === "top" ? "top" : "bottom"]: arrowOffsetY,
        ...(anchorX === "center"
            ? { left: "50%", transform: `translateX(calc(-50% + ${arrowOffsetX}px))` }
            : { [anchorX === "left" ? "left" : "right"]: arrowOffsetX }),
    }

    const arrowPair = () => (
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {arrowButton("left", atStart)}
            {arrowButton("right", atEnd)}
        </div>
    )

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Slider"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: controlsGap,
                minWidth: 0,
            }}
        >
            {/* Raw CSS so the server and browser output match (React escapes ">" in text). */}
            <style dangerouslySetInnerHTML={{ __html: css }} />
            {showCustomArrows && <div style={customArrowStyle}>{arrowPair()}</div>}
            {(hasHeader || showTopArrows) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px 24px",
                        width: "100%",
                    }}
                >
                    {/* The header wraps above the arrows when there isn't room for both. */}
                    <div className="cms-slider-header" style={{ flex: "1 1 260px", minWidth: 0 }}>
                        {hasHeader ? header : null}
                    </div>
                    {showTopArrows && <div style={{ marginLeft: "auto" }}>{arrowPair()}</div>}
                </div>
            )}
            {hasContent ? (
                <div ref={frameRef} style={{ position: "relative", width: "100%" }}>
                    <div
                        ref={viewportRef}
                        className="cms-slider-vp"
                        data-max={maxCount > 0 ? maxCount : undefined}
                        tabIndex={0}
                        aria-live={autoplay ? "off" : "polite"}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onClickCapture={onClickCapture}
                        onKeyDown={onKeyDown}
                        style={{
                            ...viewportVars,
                            position: "relative",
                            width: showOutside ? `calc(100% + ${bleed.left + bleed.right}px)` : "100%",
                            marginLeft: showOutside ? -bleed.left : 0,
                            scrollPaddingLeft: showOutside ? bleed.left : 0,
                            ...(showOutside && bleed.base > 0
                                ? ({ "--cms-slider-base": `${bleed.base}px` } as CSSProperties)
                                : {}),
                            overflowX: isStatic ? (slideOverflow === "visible" ? "visible" : "hidden") : "auto",
                            overflowY: "hidden",
                            scrollSnapType: dragging ? "none" : "x mandatory",
                            scrollbarWidth: "none",
                            overscrollBehaviorX: "contain",
                            WebkitOverflowScrolling: "touch",
                            cursor: draggable ? (dragging ? "grabbing" : "grab") : "auto",
                            userSelect: dragging ? "none" : "auto",
                            outline: "none",
                        }}
                    >
                        {content}
                    </div>
                    {showSideArrows && (
                        <>
                            <div
                                style={sideArrowStyle("left", arrowSize, isOutside)}
                            >
                                {arrowButton("left", atStart)}
                            </div>
                            <div
                                style={sideArrowStyle("right", arrowSize, isOutside)}
                            >
                                {arrowButton("right", atEnd)}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div
                    style={{
                        width: "100%",
                        minHeight: 240,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        boxSizing: "border-box",
                        borderRadius: 16,
                        border: "1px dashed rgba(0, 153, 255, 0.6)",
                        background: "rgba(0, 153, 255, 0.06)",
                        color: "#0077CC",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        textAlign: "center",
                    }}
                >
                    Connect a Collection List to “Content” in the properties panel.
                </div>
            )}
            {hasContent && (dots || showBelowArrows || outsideFallback) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            dots && (showBelowArrows || outsideFallback)
                                ? controlsAlign
                                : dots
                                  ? "center"
                                  : "flex-end",
                        gap: 16,
                        flexWrap: "wrap",
                    }}
                >
                    {dots || null}
                    {showBelowArrows && arrowPair()}
                    {outsideFallback && arrowPair()}
                </div>
            )}
        </section>
    )
}

const SLIDER_CSS = `
.cms-slider-vp { container-type: inline-size; }
.cms-slider-vp > * {
  display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important;
  align-items: stretch !important; gap: var(--cms-gap) !important;
  width: max-content !important; min-width: 100% !important; max-width: none !important;
  height: auto !important; margin: 0 !important;
  padding: 0 var(--cms-pad-right) 0 var(--cms-pad-left) !important;
}
.cms-slider-vp > * > * {
  flex: 0 0 auto !important; width: var(--cms-w-desktop) !important;
  max-width: none !important; scroll-snap-align: start; height: auto !important;
}
@media (max-width: 1199.98px) { .cms-slider-vp > * > * { width: var(--cms-w-tablet) !important; } }
@media (max-width: 809.98px) { .cms-slider-vp > * > * { width: var(--cms-w-phone) !important; } }
.cms-slider-vp::-webkit-scrollbar { display: none; }
.cms-slider-header > * { width: 100% !important; max-width: 100% !important; }
`

function sideArrowStyle(side: "left" | "right", size: number, outside: boolean): CSSProperties {
    return {
        position: "absolute",
        top: "50%",
        // Sides: on top of the slides. Outside: just past the slider's edges.
        [side]: outside ? -(size + 16) : 12,
        transform: `translateY(-${size / 2}px)`,
        zIndex: 2,
    }
}

CMSSlider.displayName = "CMS Slider"

addPropertyControls(CMSSlider, {
    content: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
        description: "Connect a Collection List. Each item becomes a slide.",
    },
    header: {
        type: ControlType.Slot,
        title: "Header",
        maxCount: 1,
        description: "Optional. Connect a frame with your heading and text; it sits above the slides.",
    },
    slideSize: {
        type: ControlType.Enum,
        title: "Slide Width",
        options: ["perView", "full"],
        optionTitles: ["Per View", "Full Width"],
        defaultValue: "perView",
        displaySegmentedControl: true,
        description: "Full Width stretches each slide across the whole slider.",
    },
    desktopSlides: {
        type: ControlType.Number,
        title: "Desktop",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 0.5,
        description: "Slides visible at 1200px and wider.",
        hidden: ({ slideSize }) => slideSize === "full",
    },
    tabletSlides: {
        type: ControlType.Number,
        title: "Tablet",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 0.5,
        hidden: ({ slideSize }) => slideSize === "full",
    },
    phoneSlides: {
        type: ControlType.Number,
        title: "Phone",
        defaultValue: 1,
        min: 1,
        max: 4,
        step: 0.5,
        description: "Slides visible below 810px.",
        hidden: ({ slideSize }) => slideSize === "full",
    },
    maxSlides: {
        type: ControlType.Number,
        title: "Max Slides",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
        description: "Show only the first CMS items. 0 shows every item.",
    },
    slideGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
        max: 80,
        unit: "px",
    },
    peek: {
        type: ControlType.Number,
        title: "Peek",
        defaultValue: 0,
        min: 0,
        max: 200,
        unit: "px",
        description: "Optional sliver of the next slide at the edge. 0 fits the visible slides exactly.",
        hidden: ({ slideSize }) => slideSize === "full",
    },
    slideOverflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
        defaultValue: "hidden",
        displaySegmentedControl: true,
        description: "Visible lets slides show outside the slider, up to the window edges. Parent frames must not clip content.",
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Mouse Drag",
        defaultValue: true,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: ({ autoplay }) => !autoplay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        description: "On: after the last slide, go back to the first. Off: arrows disable at the first and last slide.",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    arrowPlacement: {
        type: ControlType.Enum,
        title: "Placement",
        options: ["below", "top", "sides", "outside", "custom"],
        optionTitles: ["Below", "Top", "Sides", "Outside", "Custom"],
        description:
            "Top sits beside the Header. Sides sit on the slides. Outside sits past the slider's edges and moves below when there isn't room. Custom lets you pin them anywhere.",
        defaultValue: "below",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowAnchor: {
        type: ControlType.Enum,
        title: "Anchor",
        options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"],
        optionTitles: ["Top Left", "Top Center", "Top Right", "Bottom Left", "Bottom Center", "Bottom Right"],
        defaultValue: "top-right",
        description: "Corner or edge of the slider the arrows are pinned to.",
        hidden: ({ showArrows, arrowPlacement }) => !showArrows || arrowPlacement !== "custom",
    },
    arrowOffsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 0,
        min: -400,
        max: 400,
        unit: "px",
        hidden: ({ showArrows, arrowPlacement }) => !showArrows || arrowPlacement !== "custom",
    },
    arrowOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        min: -400,
        max: 400,
        unit: "px",
        description: "Moves the arrows away from the anchor; negative values move them outside the slider.",
        hidden: ({ showArrows, arrowPlacement }) => !showArrows || arrowPlacement !== "custom",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 44,
        min: 28,
        max: 72,
        unit: "px",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowFill: {
        type: ControlType.Color,
        title: "Arrow Fill",
        defaultValue: "#FFFFFF",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowIcon: {
        type: ControlType.Color,
        title: "Arrow Icon",
        defaultValue: "#161A19",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowBorder: {
        type: ControlType.Color,
        title: "Arrow Border",
        defaultValue: "rgba(22, 26, 25, 0.12)",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowRadius: {
        type: ControlType.Number,
        title: "Arrow Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        unit: "px",
        hidden: ({ showArrows }) => !showArrows,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Indicator",
        defaultValue: true,
        description: "Dots, numbers or a 1 / 4 counter.",
    },
    indicator: {
        type: ControlType.Enum,
        title: "Style",
        options: ["dots", "numbers", "counter"],
        optionTitles: ["Dots", "Numbers", "1 / 4"],
        defaultValue: "dots",
        displaySegmentedControl: true,
        hidden: ({ showDots }) => !showDots,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot",
        defaultValue: "rgba(22, 26, 25, 0.2)",
        hidden: ({ showDots, indicator }) => !showDots || indicator !== "dots",
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Active Dot",
        defaultValue: "#161A19",
        hidden: ({ showDots, indicator }) => !showDots || indicator !== "dots",
    },
    dotWidth: {
        type: ControlType.Number,
        title: "Dot Width",
        defaultValue: 8,
        min: 2,
        max: 40,
        unit: "px",
        hidden: ({ showDots, indicator }) => !showDots || indicator !== "dots",
    },
    activeDotWidth: {
        type: ControlType.Number,
        title: "Active Width",
        defaultValue: 24,
        min: 2,
        max: 80,
        unit: "px",
        hidden: ({ showDots, indicator }) => !showDots || indicator !== "dots",
    },
    dotHeight: {
        type: ControlType.Number,
        title: "Dot Height",
        defaultValue: 8,
        min: 2,
        max: 24,
        unit: "px",
        description: "Shared by all dots, active or not.",
        hidden: ({ showDots, indicator }) => !showDots || indicator !== "dots",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
        hidden: ({ showDots, indicator }) => !showDots || indicator === "dots",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number",
        defaultValue: "rgba(22, 26, 25, 0.4)",
        hidden: ({ showDots, indicator }) => !showDots || indicator === "dots",
    },
    activeNumberColor: {
        type: ControlType.Color,
        title: "Active Number",
        defaultValue: "#161A19",
        hidden: ({ showDots, indicator }) => !showDots || indicator === "dots",
    },
    counterSeparator: {
        type: ControlType.String,
        title: "Separator",
        defaultValue: "/",
        hidden: ({ showDots, indicator }) => !showDots || indicator !== "counter",
    },
    leadingZero: {
        type: ControlType.Boolean,
        title: "Leading Zero",
        defaultValue: false,
        description: "Shows 01, 02… instead of 1, 2…",
        hidden: ({ showDots, indicator }) => !showDots || indicator === "dots",
    },
    dotGap: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 16,
        min: 0,
        max: 40,
        unit: "px",
        hidden: ({ showDots }) => !showDots,
    },
    controlsAlign: {
        type: ControlType.Enum,
        title: "Controls",
        options: ["space-between", "center", "flex-end"],
        optionTitles: ["Spread", "Center", "End"],
        defaultValue: "space-between",
        hidden: ({ showDots, showArrows, arrowPlacement }) =>
            !showDots || !showArrows || (arrowPlacement !== "below" && arrowPlacement !== "outside"),
    },
    controlsGap: {
        type: ControlType.Number,
        title: "Controls Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        unit: "px",
    },
})
