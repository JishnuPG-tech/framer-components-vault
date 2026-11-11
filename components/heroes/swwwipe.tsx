import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
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


/**
 * Image Carousel
 * Finite (non-looping) carousel with a single sliding track: the slides follow
 * the pointer 1:1 while dragging and settle to the nearest slide on release,
 * with flicks respected. Arrows sit outside the media frame and collapse on
 * narrow widths. Dots sit below in a fixed window, shrinking at whichever edge
 * still has slides beyond it.
 */

type CarouselImageItem = {
    image?: { src?: string; srcSet?: string; alt?: string }
    alt?: string
}

interface ImageCarouselProps {
    Images: CarouselImageItem[]
    images?: CarouselImageItem[]
    aspectRatio: "1:1" | "4:5" | "16:9"
    objectFit: "cover" | "contain"
    slideGap: number
    borderRadius: number
    mediaBackground: string
    showArrows: boolean
    hideArrowsBelow: number
    gutter: number
    arrowGap: number
    arrowColor: string
    arrowBackground: string
    arrowDisabledOpacity: number
    showDots: boolean
    dotSize: number
    dotSpacing: number
    dotShape: "circle" | "square"
    maxDots: number
    dotEdgeScale: number
    dotActiveColor: string
    dotInactiveColor: string
    transitionDuration: number
    draggable: boolean
    maxWidth: number
    style?: CSSProperties
}

// Distance past which a slow drag still commits, as a fraction of one step.
const DISTANCE_THRESHOLD = 0.2
// Pointer speed (px/ms) past which a short flick commits regardless of distance.
const FLICK_VELOCITY = 0.35
// Resistance applied when dragging past the first or last slide.
const EDGE_RESISTANCE = 0.35
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)"

const CAROUSEL_CSS = `
.framer-ic-stage {
    position: relative;
    width: 100%;
    display: grid;
    grid-template-columns: var(--ic-gutter, 56px) minmax(0, 1fr) var(--ic-gutter, 56px);
    column-gap: var(--ic-arrow-gap, 0px);
    align-items: center;
}
.framer-ic-stage[data-arrows="false"] { grid-template-columns: minmax(0, 1fr); }
.framer-ic-arrow { transition: transform 160ms ease, opacity 200ms ease; }
.framer-ic-arrow:not(:disabled):hover { transform: scale(1.06); }
.framer-ic-arrow:not(:disabled):active { transform: scale(0.94); }
.framer-ic-dot > span {
    transition: transform 220ms ${EASING}, background 200ms ease, opacity 200ms ease;
}
.framer-ic-dot:not([aria-current="true"]):hover > span { filter: brightness(0.85); }
.framer-ic-arrow:focus-visible,
.framer-ic-dot:focus-visible,
.framer-ic-viewport:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
    .framer-ic-track,
    .framer-ic-dot-strip,
    .framer-ic-dot > span { transition: none !important; }
    .framer-ic-arrow { transition: none !important; }
}
`

const fallbackImages = [
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
]

function Chevron({ size, flip }: { size: number; flip: boolean }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
            style={{
                display: "block",
                transform: flip ? "scaleX(-1)" : undefined,
            }}
        >
            <path
                d="M9.5 5.5 16 12l-6.5 6.5"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// Reads the track's live translateX so a drag started mid-settle picks up
// exactly where the animation had got to, instead of jumping.
function readOffset(node: HTMLElement): number {
    try {
        const value = window.getComputedStyle(node).transform
        if (!value || value === "none") return 0
        const Matrix =
            (window as any).DOMMatrixReadOnly || (window as any).WebKitCSSMatrix
        if (!Matrix) return 0
        return new Matrix(value).m41 || 0
    } catch {
        return 0
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function Swwwipe(props: ImageCarouselProps) {
    const {
        Images,
        images,
        aspectRatio,
        objectFit,
        slideGap,
        borderRadius,
        mediaBackground,
        showArrows,
        hideArrowsBelow,
        gutter,
        arrowGap,
        arrowColor,
        arrowBackground,
        arrowDisabledOpacity,
        showDots,
        dotSize,
        dotSpacing,
        dotShape,
        maxDots,
        dotEdgeScale,
        dotActiveColor,
        dotInactiveColor,
        transitionDuration,
        draggable,
        maxWidth,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rawId = useId()
    const scope = useMemo(
        () => `framer-ic-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`,
        [rawId]
    )

    const [current, setCurrent] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(false)

    const trackRef = useRef<HTMLDivElement>(null)
    const currentRef = useRef(0)
    const mountedRef = useRef(false)
    // Lets a drag release choose its own settle duration based on how far and
    // how fast it was travelling, instead of always using the prop value.
    const settleRef = useRef<number | null>(null)
    const dragRef = useRef({
        active: false,
        pointerId: -1,
        startX: 0,
        startY: 0,
        baseOffset: 0,
        dx: 0,
        axis: "none" as "none" | "x" | "y",
        step: 1,
    })
    const samplesRef = useRef<{ x: number; t: number }[]>([])

    const ratio = useMemo(() => {
        if (aspectRatio === "4:5") return "4 / 5"
        if (aspectRatio === "16:9") return "16 / 9"
        return "1 / 1"
    }, [aspectRatio])

    const slides = useMemo(() => {
        const source = (Images ?? images ?? []).filter(Boolean)
        const base = source.length > 0 ? source : [{}, {}, {}]
        return base.map((item, index) => {
            const fallback = fallbackImages[index % fallbackImages.length]
            return {
                src: item.image?.src || fallback.src,
                srcSet: item.image?.srcSet,
                alt: item.alt || item.image?.alt || fallback.alt,
            }
        })
    }, [Images, images])

    const count = slides.length
    const safeGap = Math.max(0, slideGap)
    const safeDotSize = Math.max(4, dotSize)
    const safeDuration = Math.max(120, transitionDuration)
    const arrowSize = Math.max(44, gutter)
    const animate = !isStatic && !reducedMotion

    const scopedCss = useMemo(() => {
        if (!showArrows || hideArrowsBelow <= 0) return ""
        const collapse = `
    .${scope} .framer-ic-arrow { display: none; }
    .${scope} .framer-ic-stage { grid-template-columns: minmax(0, 1fr); }`
        return `
.${scope} { container-type: inline-size; container-name: ${scope}; }
@container ${scope} (max-width: ${hideArrowsBelow}px) {${collapse}
}
@supports not (container-type: inline-size) {
    @media (max-width: ${hideArrowsBelow}px) {${collapse}
    }
}
`
    }, [hideArrowsBelow, scope, showArrows])

    useEffect(() => {
        setCurrent((value) => Math.min(Math.max(0, value), count - 1))
    }, [count])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])

    const activeIndex = Math.min(Math.max(0, current), count - 1)
    const canGoPrevious = activeIndex > 0
    const canGoNext = activeIndex < count - 1

    // One slide plus one gap: the distance the track travels per step. The
    // percentage half survives resizes without measuring; the gap is fixed px.
    const applyPosition = useCallback(
        (index: number, dx: number, duration: number) => {
            const node = trackRef.current
            if (!node) return
            node.style.transition =
                duration > 0 ? `transform ${duration}ms ${EASING}` : "none"
            node.style.transform = `translate3d(calc(${-index * 100}% - ${
                index * safeGap
            }px + ${dx}px), 0, 0)`
        },
        [safeGap]
    )

    useEffect(() => {
        currentRef.current = activeIndex
        const requested = settleRef.current
        settleRef.current = null
        const duration =
            !mountedRef.current || !animate ? 0 : (requested ?? safeDuration)
        applyPosition(activeIndex, 0, duration)
        mountedRef.current = true
    }, [activeIndex, animate, applyPosition, safeDuration, safeGap])

    const goToIndex = useCallback(
        (nextIndex: number) => {
            const clamped = Math.min(Math.max(0, nextIndex), count - 1)
            if (clamped === currentRef.current) return
            setCurrent(clamped)
        },
        [count]
    )

    const handleNavigate = useCallback(
        (direction: 1 | -1) => goToIndex(currentRef.current + direction),
        [goToIndex]
    )

    const onPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!draggable || count < 2) return
            if (event.pointerType === "mouse" && event.button !== 0) return
            const node = event.currentTarget
            const track = trackRef.current
            const step = (node.offsetWidth || 1) + safeGap
            // Where the track actually is right now, relative to its resting
            // position for the current slide.
            const live = track ? readOffset(track) : 0
            const baseOffset = live + currentRef.current * step

            dragRef.current = {
                active: true,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                baseOffset,
                dx: baseOffset,
                axis: "none",
                step,
            }
            samplesRef.current = [{ x: event.clientX, t: event.timeStamp }]
            node.setPointerCapture?.(event.pointerId)
            applyPosition(currentRef.current, baseOffset, 0)
        },
        [applyPosition, count, draggable, safeGap]
    )

    const onPointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current
            if (!drag.active || drag.pointerId !== event.pointerId) return

            const deltaX = event.clientX - drag.startX
            const deltaY = event.clientY - drag.startY

            // Wait until the gesture declares itself, so a vertical page scroll
            // that starts on the image isn't swallowed.
            if (drag.axis === "none") {
                if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return
                drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y"
            }
            if (drag.axis !== "x") return

            const samples = samplesRef.current
            samples.push({ x: event.clientX, t: event.timeStamp })
            if (samples.length > 6) samples.shift()

            let offset = drag.baseOffset + deltaX
            const min = -(count - 1 - currentRef.current) * drag.step
            const max = currentRef.current * drag.step
            if (offset > max) offset = max + (offset - max) * EDGE_RESISTANCE
            if (offset < min) offset = min + (offset - min) * EDGE_RESISTANCE

            drag.dx = offset
            applyPosition(currentRef.current, offset, 0)
        },
        [applyPosition, count]
    )

    const endDrag = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current
            if (!drag.active || drag.pointerId !== event.pointerId) return
            drag.active = false
            event.currentTarget.releasePointerCapture?.(event.pointerId)

            if (drag.axis !== "x") return

            const samples = samplesRef.current
            const first = samples[0]
            const last = samples[samples.length - 1]
            const elapsed = last && first ? last.t - first.t : 0
            const velocity = elapsed > 0 ? (last.x - first.x) / elapsed : 0

            const index = currentRef.current
            let target = index
            if (Math.abs(velocity) > FLICK_VELOCITY) {
                target = index + (velocity < 0 ? 1 : -1)
            } else if (Math.abs(drag.dx) > drag.step * DISTANCE_THRESHOLD) {
                target = index + (drag.dx < 0 ? 1 : -1)
            }
            target = Math.min(Math.max(0, target), count - 1)

            // Settle at roughly the speed the finger was already moving, so a
            // fast flick lands fast and a slow release eases home.
            const remaining = Math.abs((index - target) * drag.step - drag.dx)
            const speed = Math.max(0.4, Math.abs(velocity))
            const duration = Math.round(
                Math.min(safeDuration, Math.max(140, remaining / speed))
            )

            if (target === index) {
                applyPosition(index, 0, animate ? duration : 0)
            } else {
                settleRef.current = duration
                setCurrent(target)
            }

            drag.dx = 0
            drag.axis = "none"
            samplesRef.current = []
        },
        [animate, applyPosition, count, safeDuration]
    )

    const onKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLDivElement>) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault()
                handleNavigate(-1)
            }
            if (event.key === "ArrowRight") {
                event.preventDefault()
                handleNavigate(1)
            }
        },
        [handleNavigate]
    )

    // --- Dot window -------------------------------------------------------
    // A fixed number of dots stay visible; the strip slides to keep the active
    // one centred. A dot sitting at a window edge that still has slides beyond
    // it renders small, which is what signals "there is more this way".
    const dotSlot = safeDotSize + Math.max(0, dotSpacing)
    const windowSize = Math.max(1, Math.min(Math.round(maxDots), count))
    const windowStart = Math.min(
        Math.max(0, activeIndex - Math.floor(windowSize / 2)),
        Math.max(0, count - windowSize)
    )
    const windowEnd = windowStart + windowSize - 1

    const dotScale = useCallback(
        (index: number) => {
            if (index < windowStart || index > windowEnd) return 0
            if (index === windowStart && windowStart > 0) return dotEdgeScale
            if (index === windowEnd && windowEnd < count - 1)
                return dotEdgeScale
            return 1
        },
        [count, dotEdgeScale, windowEnd, windowStart]
    )

    const arrowStyle = (enabled: boolean): CSSProperties => ({
        width: arrowSize,
        height: arrowSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        justifySelf: "center",
        padding: 0,
        border: "none",
        borderRadius: 999,
        background: arrowBackground,
        color: arrowColor,
        cursor: enabled ? "pointer" : "default",
        opacity: enabled ? 1 : arrowDisabledOpacity,
        WebkitTapHighlightColor: "transparent",
    })

    return (
        <div
            className={scope}
            style={{
                position: "relative",
                width: "100%",
                maxWidth,
                marginInline: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                ...style,
            }}
        >
            <style>{CAROUSEL_CSS + scopedCss}</style>

            <div
                className="framer-ic-stage"
                data-arrows={showArrows ? "true" : "false"}
                role="group"
                aria-roledescription="carousel"
                aria-label="Image carousel"
                style={
                    {
                        "--ic-gutter": `${arrowSize}px`,
                        "--ic-arrow-gap": `${Math.max(0, arrowGap)}px`,
                    } as CSSProperties
                }
            >
                {showArrows && (
                    <button
                        type="button"
                        className="framer-ic-arrow"
                        aria-label="Previous image"
                        onClick={() => handleNavigate(-1)}
                        disabled={!canGoPrevious}
                        style={arrowStyle(canGoPrevious)}
                    >
                        <Chevron size={arrowSize * 0.42} flip />
                    </button>
                )}

                <div
                    className="framer-ic-viewport"
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: ratio,
                        borderRadius,
                        overflow: "hidden",
                        background: mediaBackground,
                        touchAction: draggable ? "pan-y pinch-zoom" : "auto",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTapHighlightColor: "transparent",
                        cursor: draggable && count > 1 ? "grab" : "default",
                    }}
                >
                    <div
                        ref={trackRef}
                        className="framer-ic-track"
                        style={{
                            display: "flex",
                            gap: safeGap,
                            width: "100%",
                            height: "100%",
                            willChange: "transform",
                        }}
                    >
                        {slides.map((slide, index) => (
                            <div
                                key={index}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${index + 1} of ${count}`}
                                aria-hidden={index !== activeIndex}
                                style={{
                                    position: "relative",
                                    flex: "0 0 100%",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius,
                                    overflow: "hidden",
                                    background: mediaBackground,
                                }}
                            >
                                <img
                                    src={slide.src}
                                    srcSet={slide.srcSet}
                                    alt={slide.alt || ""}
                                    draggable={false}
                                    decoding="async"
                                    loading={
                                        Math.abs(index - activeIndex) <= 1
                                            ? "eager"
                                            : "lazy"
                                    }
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit,
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {showArrows && (
                    <button
                        type="button"
                        className="framer-ic-arrow"
                        aria-label="Next image"
                        onClick={() => handleNavigate(1)}
                        disabled={!canGoNext}
                        style={arrowStyle(canGoNext)}
                    >
                        <Chevron size={arrowSize * 0.42} flip={false} />
                    </button>
                )}
            </div>

            {showDots && count > 1 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: windowSize * dotSlot,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="framer-ic-dot-strip"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                transform: `translate3d(${
                                    -windowStart * dotSlot
                                }px, 0, 0)`,
                                transition: animate
                                    ? `transform 260ms ${EASING}`
                                    : "none",
                            }}
                        >
                            {slides.map((slide, index) => {
                                const isActive = index === activeIndex
                                const scale = dotScale(index)
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        className="framer-ic-dot"
                                        aria-label={`Go to image ${index + 1}`}
                                        aria-current={isActive}
                                        tabIndex={scale === 0 ? -1 : 0}
                                        onClick={() => goToIndex(index)}
                                        style={{
                                            flex: `0 0 ${dotSlot}px`,
                                            width: dotSlot,
                                            height: Math.max(24, dotSlot),
                                            display: "grid",
                                            placeItems: "center",
                                            padding: 0,
                                            border: "none",
                                            background: "transparent",
                                            cursor: isActive
                                                ? "default"
                                                : "pointer",
                                            WebkitTapHighlightColor:
                                                "transparent",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "block",
                                                width: safeDotSize,
                                                height: safeDotSize,
                                                borderRadius:
                                                    dotShape === "square"
                                                        ? Math.max(
                                                              1,
                                                              safeDotSize * 0.25
                                                          )
                                                        : 999,
                                                background: isActive
                                                    ? dotActiveColor
                                                    : dotInactiveColor,
                                                transform: `scale(${scale})`,
                                                opacity: scale === 0 ? 0 : 1,
                                            }}
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            <span
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                }}
            >
                {`Image ${activeIndex + 1} of ${count}`}
            </span>
        </div>
    )
}

addPropertyControls(Swwwipe, {
    Images: {
        type: ControlType.Array,
        title: "Images",
        defaultValue: [
            { alt: "Image 1" },
            { alt: "Image 2" },
            { alt: "Image 3" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
            },
        },
        maxCount: 12,
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["1:1", "4:5", "16:9"],
        optionTitles: ["1:1", "4:5", "16:9"],
        defaultValue: "1:1",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    slideGap: {
        type: ControlType.Number,
        title: "Slide Gap",
        description: "Space revealed between slides while swiping.",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Slide Radius",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    mediaBackground: {
        type: ControlType.Color,
        title: "Media BG",
        defaultValue: "#F5F5F5",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    hideArrowsBelow: {
        type: ControlType.Number,
        title: "Hide Below",
        description:
            "Collapses the arrows when the carousel is narrower than this. Set to 0 to always show them.",
        defaultValue: 520,
        min: 0,
        max: 900,
        step: 10,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    gutter: {
        type: ControlType.Number,
        title: "Arrow Gutter",
        defaultValue: 56,
        min: 44,
        max: 120,
        step: 1,
        hidden: (props) => !props.showArrows,
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow Gap",
        description: "Space between each arrow and the edge of the slide.",
        defaultValue: 12,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow",
        defaultValue: "#000000",
        hidden: (props) => !props.showArrows,
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showArrows,
    },
    arrowDisabledOpacity: {
        type: ControlType.Number,
        title: "Arrow Off",
        defaultValue: 0.35,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.showArrows,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotShape: {
        type: ControlType.Enum,
        title: "Dot Shape",
        options: ["circle", "square"],
        optionTitles: ["Circle", "Square"],
        defaultValue: "circle",
        displaySegmentedControl: true,
        hidden: (props) => !props.showDots,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 4,
        max: 24,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showDots,
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Dot Spacing",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showDots,
    },
    maxDots: {
        type: ControlType.Number,
        title: "Max Dots",
        description:
            "How many dots stay visible. Beyond this the strip slides and the edge dots shrink.",
        defaultValue: 5,
        min: 3,
        max: 12,
        step: 1,
        hidden: (props) => !props.showDots,
    },
    dotEdgeScale: {
        type: ControlType.Number,
        title: "Edge Dot",
        description:
            "Size of a dot at the edge of the window when more slides remain in that direction.",
        defaultValue: 0.5,
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.showDots,
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Dot Active",
        defaultValue: "#000000",
        hidden: (props) => !props.showDots,
    },
    dotInactiveColor: {
        type: ControlType.Color,
        title: "Dot Inactive",
        defaultValue: "#CCCCCC",
        hidden: (props) => !props.showDots,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        description:
            "Used for arrow and dot navigation. Swipes settle at the speed of the gesture, capped at this value.",
        defaultValue: 320,
        min: 120,
        max: 1000,
        step: 10,
        unit: "ms",
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 720,
        min: 220,
        max: 1440,
        step: 10,
    },
})
