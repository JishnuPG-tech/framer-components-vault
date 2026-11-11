/**
 * CarouselLite: free Framer Marketplace code component.
 * Two layouts (3D Ring, Classic), manual image slides. More layouts + CMS in the
 * full 3D Carousel 6-in-1: https://www.framer.com/marketplace/components/3d-carousel-6-in-1/
 *
 * Sizing: the root always fills the Framer frame (width/height 100%). The stage is
 * measured with ResizeObserver and every layout fits its cards inside the measured
 * box (cards scale down when the frame is smaller than Item Width/Height).
 *
 * Static renderer (Framer canvas / export / thumbnails, `useIsStaticRenderer()`):
 * renders a deterministic first frame (slide 1 active, settled positions) with no
 * autoplay timer, no rAF, no motion-value subscriptions/springs and no drag, wheel,
 * keyboard or hover handlers.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 480
 */
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type MutableRefObject,
    type ReactElement,
    type ReactNode,
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

import {
    animate,
    useMotionValue,
    useReducedMotion as useFMReduced,
    type AnimationPlaybackControls,
    type MotionValue,
} from "framer-motion"

/* -------------------------------------------------------------------------- */
/* Inlined helpers (from shared.tsx) — self-contained for Framer paste          */
/* -------------------------------------------------------------------------- */

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        if (mq.addEventListener) mq.addEventListener("change", update)
        else mq.addListener(update)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [])
    return reduced
}

/**
 * IntersectionObserver visibility for one element, keyed on stable primitives only.
 * The observer is created once per element (the element itself is the dependency, so a
 * remounted node is re-observed) and is rebuilt only if `threshold` / `rootMargin`
 * actually change — never because a caller re-rendered with a fresh options object.
 * Pass module-level constants (or other primitives) for `threshold` / `rootMargin`.
 */
function useElementInView(
    el: Element | null,
    threshold: number,
    rootMargin: string = "0px"
): boolean {
    const [inView, setInView] = useState(false)
    useEffect(() => {
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                setInView(!!entry?.isIntersecting)
            },
            { threshold, rootMargin }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [el, threshold, rootMargin])
    return inView
}

/**
 * Measures an element's content box with ResizeObserver. Takes the element itself
 * (from a callback ref / state) so it re-subscribes when a conditionally rendered
 * node mounts. Returns 0×0 until the first measurement.
 */
function useElementSize(el: HTMLElement | null): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 })
    useEffect(() => {
        if (!el) return
        const update = (w: number, h: number) =>
            setSize((s) =>
                Math.abs(s.width - w) < 0.5 && Math.abs(s.height - h) < 0.5 ? s : { width: w, height: h }
            )
        update(el.clientWidth, el.clientHeight)
        if (typeof ResizeObserver === "undefined") {
            const onResize = () => update(el.clientWidth, el.clientHeight)
            window.addEventListener("resize", onResize)
            return () => window.removeEventListener("resize", onResize)
        }
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (r) update(r.width, r.height)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [el])
    return size
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n))
}

function wrapIndex(i: number, len: number): number {
    if (len <= 0) return 0
    return ((i % len) + len) % len
}

/**
 * Autoplay timer. Pass the current index as `resetKey`: ANY index change (arrow,
 * dot, keyboard, drag, or the tick itself) restarts the full interval, so an
 * automatic advance can never land right after a manual click.
 */
function useAutoplay(
    enabled: boolean,
    intervalMs: number,
    onTick: () => void,
    paused: boolean,
    resetKey?: unknown
): void {
    const cb = useRef(onTick)
    cb.current = onTick
    useEffect(() => {
        if (!enabled || paused || intervalMs <= 0) return
        const id = window.setTimeout(() => cb.current(), intervalMs)
        return () => window.clearTimeout(id)
    }, [enabled, intervalMs, paused, resetKey])
}

function usePointerDrag(opts: {
    onDrag: (dx: number, dy: number, e: PointerEvent) => void
    onDragEnd?: (vx: number, vy: number) => void
    axis?: "x" | "y" | "both"
    threshold?: number
}): {
    onPointerDown: (e: ReactPointerEvent) => void
    dragging: boolean
    didDragRef: MutableRefObject<boolean>
} {
    const draggingRef = useRef(false)
    const didDragRef = useRef(false)
    const [dragging, setDragging] = useState(false)
    const start = useRef({ x: 0, y: 0, t: 0, lastX: 0, lastY: 0, lastT: 0, vx: 0, vy: 0 })
    const axis = opts.axis ?? "x"
    const threshold = opts.threshold ?? 4
    // Keep latest callbacks in refs so pointerup never sees a stale closure
    // (e.g. dragOffset from the pointerdown render).
    const onDragRef = useRef(opts.onDrag)
    const onDragEndRef = useRef(opts.onDragEnd)
    onDragRef.current = opts.onDrag
    onDragEndRef.current = opts.onDragEnd

    const onPointerDown = useCallback(
        (e: ReactPointerEvent) => {
            if (e.button !== 0) return
            const el = e.currentTarget as HTMLElement
            const pointerId = e.pointerId
            // Do NOT capture yet — early capture retargets click away from slides
            // (breaks tap-to-expand / click-to-select). Capture only after drag starts.
            draggingRef.current = false
            didDragRef.current = false
            setDragging(false)
            start.current = {
                x: e.clientX,
                y: e.clientY,
                t: performance.now(),
                lastX: e.clientX,
                lastY: e.clientY,
                lastT: performance.now(),
                vx: 0,
                vy: 0,
            }

            const move = (ev: PointerEvent) => {
                const dx = ev.clientX - start.current.x
                const dy = ev.clientY - start.current.y
                const now = performance.now()
                const dt = Math.max(1, now - start.current.lastT)
                start.current.vx = (ev.clientX - start.current.lastX) / dt
                start.current.vy = (ev.clientY - start.current.lastY) / dt
                start.current.lastX = ev.clientX
                start.current.lastY = ev.clientY
                start.current.lastT = now
                if (!draggingRef.current) {
                    const dist =
                        axis === "x" ? Math.abs(dx) : axis === "y" ? Math.abs(dy) : Math.hypot(dx, dy)
                    if (dist < threshold) return
                    draggingRef.current = true
                    didDragRef.current = true
                    setDragging(true)
                    el.setPointerCapture?.(pointerId)
                }
                onDragRef.current(
                    axis === "y" ? 0 : dx,
                    axis === "x" ? 0 : dy,
                    ev
                )
            }
            const up = () => {
                window.removeEventListener("pointermove", move)
                window.removeEventListener("pointerup", up)
                window.removeEventListener("pointercancel", up)
                if (draggingRef.current) {
                    onDragEndRef.current?.(start.current.vx * 1000, start.current.vy * 1000)
                }
                try {
                    el.releasePointerCapture?.(pointerId)
                } catch {
                    /* not capturing */
                }
                draggingRef.current = false
                setDragging(false)
            }
            window.addEventListener("pointermove", move)
            window.addEventListener("pointerup", up)
            window.addEventListener("pointercancel", up)
        },
        [axis, threshold]
    )

    return { onPointerDown, dragging, didDragRef }
}

const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
}

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type CarouselLayout =
    | "ring"
    | "classic"

/** Framer passes a string for ControlType.Image and an object for ResponsiveImage. */
export type CarouselImage = string | { src?: string; srcSet?: string; alt?: string } | null

export interface CarouselManualItem {
    id?: string
    image?: CarouselImage
    title?: string
    link?: string
    alt?: string
}

export interface CarouselLiteProps {
    layout?: CarouselLayout
    items?: CarouselManualItem[]
    width?: number
    height?: number
    gap?: number
    radius?: number
    itemWidth?: number
    itemHeight?: number
    ringRadius?: number
    ringTilt?: number
    classicPeek?: number
    loop?: boolean
    autoplay?: boolean
    autoplayInterval?: number
    pauseOnHover?: boolean
    showPauseButton?: boolean
    /** Code-only (no property control). Controlled state of the pause/play button: pass it
     *  (with onAutoplayPausedChange) to keep a visitor's "paused" choice when the carousel is
     *  re-mounted, e.g. by a wrapper that swaps layouts. Omit it and the carousel keeps its own state. */
    autoplayPaused?: boolean
    /** Code-only. Called with the new paused state whenever the visitor presses pause/play. */
    onAutoplayPausedChange?: (paused: boolean) => void
    showArrows?: boolean
    showDots?: boolean
    arrowColor?: string
    arrowBg?: string
    dotColor?: string
    dotActiveColor?: string
    dragEnabled?: boolean
    titleColor?: string
    showCaptions?: boolean
    placeholderImages?: boolean
    /** Accessible name of the carousel region (screen readers). */
    label?: string
    style?: CSSProperties
}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                    */
/* -------------------------------------------------------------------------- */

const DEFAULT_ITEMS: CarouselManualItem[] = [
    { id: "1", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80", title: "Still Water", link: "#", alt: "Calm lake below mountains" },
    { id: "2", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", title: "High Pass", link: "#", alt: "Mountain lake and valley" },
    { id: "3", image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80", title: "Morning Fog", link: "#", alt: "Fog over green hills" },
    { id: "4", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80", title: "Old Forest", link: "#", alt: "Sunlight through forest trees" },
    { id: "5", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", title: "Open Valley", link: "#", alt: "Wide valley at sunrise" },
    { id: "6", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80", title: "Far Ridge", link: "#", alt: "Ridge line under open sky" },
]

/**
 * Property-control default for the Items array. Only keys that have a matching
 * control are included (no `id`): Framer's Array→Object editor round-trips exactly
 * the declared fields, and Image controls inside arrays don't accept defaults, so
 * demo imagery is supplied in code instead (see `placeholderImages`).
 */
const DEFAULT_ITEMS_CONTROL_VALUE = DEFAULT_ITEMS.map((it) => ({
    title: it.title,
    link: it.link,
    alt: it.alt,
}))

/** Vivid per-index gradients shown behind images (while loading / on error / no image). */
const FALLBACK_GRADIENTS = [
    "linear-gradient(160deg,#fde68a 0%,#fca5a5 100%)",
    "linear-gradient(160deg,#bbf7d0 0%,#5eead4 100%)",
    "linear-gradient(160deg,#fed7aa 0%,#fb923c 100%)",
    "linear-gradient(160deg,#e9d5ff 0%,#f9a8d4 100%)",
    "linear-gradient(160deg,#bae6fd 0%,#a5b4fc 100%)",
    "linear-gradient(160deg,#fef3c7 0%,#86efac 100%)",
]

function imageSrc(image: CarouselImage | undefined): string | undefined {
    if (!image) return undefined
    if (typeof image === "string") return image || undefined
    return image.src || undefined
}

/** Cheap content signature so edits always re-derive, even if the host reuses the array. */
function itemsSignature(items: CarouselManualItem[] | null | undefined): string {
    if (items == null) return "__default__"
    return items
        .map((it) =>
            it
                ? [it.id, imageSrc(it.image), it.title, it.link, it.alt].join("\u0001")
                : ""
        )
        .join("\u0002")
}

type ResolvedItem = CarouselManualItem & {
    id: string
    src?: string
    fallback: string
}

/* -------------------------------------------------------------------------- */
/* Media slide                                                                 */
/* -------------------------------------------------------------------------- */

/** IntersectionObserver thresholds. Module-level primitives: the observers are created once
 *  per element and never rebuilt by a re-render (autoplay steps, hover, drag, resize). */
const ROOT_IN_VIEW_THRESHOLD = 0.15

/** Non-empty trimmed string or undefined. */
function nonEmpty(v: string | undefined | null): string | undefined {
    const t = typeof v === "string" ? v.trim() : ""
    return t ? t : undefined
}


function MediaSlide({
    item,
    radius,
    shadow,
    showCaptions,
    titleColor,
    eager,
    backface = false,
    slideNumber,
    slideCount,
    onActivate,
}: {
    item: ResolvedItem
    active: boolean
    radius: number
    shadow: string
    showCaptions: boolean
    titleColor: string
    eager: boolean
    /** 3D Ring only: hide back faces. Off elsewhere — backface-visibility inside a
     *  filtered/blurred, frequently re-transformed parent can drop the layer entirely
     *  in WebKit/Safari (cards vanish mid-drag). */
    backface?: boolean
    /** 1-based item number and item count (loop copies pass their item's number). */
    slideNumber: number
    slideCount: number
    onActivate?: () => void
}): ReactElement {
    // Callback ref into state: the observer is tied to this exact element and a module-level
    // threshold, so re-renders never recreate it.
    const [imgFailed, setImgFailed] = useState(false)
    useEffect(() => setImgFailed(false), [item.src])


    // Accessible name for linked slides. A visible caption names the link (no aria-label, so the
    // name matches what's on screen); otherwise aria-label = title → subtitle → alt → "Open slide N of M".
    const title = nonEmpty(item.title)
    const explicitAlt = nonEmpty(item.alt)
    const isLink = !!item.link
    const captionNames = showCaptions && !!title
    const linkLabel =
        isLink && !captionNames
            ? title || explicitAlt || `Open slide ${slideNumber} of ${slideCount}`
            : undefined
    // Inside a link whose caption is visible, an image alt that only repeats the caption (or the
    // title fallback) would be announced twice: it becomes decorative there. Elsewhere unchanged.
    const imgAlt =
        isLink && captionNames
            ? explicitAlt && explicitAlt !== title
                ? explicitAlt
                : ""
            : item.alt || item.title || ""

    const media =
        item.src && !imgFailed ? (
            <img
                src={item.src}
                alt={imgAlt}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                onError={() => setImgFailed(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
        ) : null

    const inner = (
        <div
            data-mlc-card=""
            onClick={onActivate}
            style={{
                position: "relative",
                // Only the cards look and act clickable; the stage around them doesn't.
                cursor: onActivate ? "pointer" : undefined,
                width: "100%",
                height: "100%",
                borderRadius: radius,
                overflow: "hidden",
                boxShadow: shadow,
                // Colourful gradient behind the media: visible while loading, on error,
                // or when an item has no image — never a flat dark placeholder.
                background: item.fallback,
                // Ring only: keep text upright even if an ancestor ends up rotated in 3D.
                ...(backface
                    ? { backfaceVisibility: "hidden" as const, WebkitBackfaceVisibility: "hidden" as const }
                    : null),
            }}
        >
            {media}
            {showCaptions && item.title && (
                <div
                    style={{
                        position: "absolute",
                        left: 12,
                        right: 12,
                        bottom: 12,
                        padding: "10px 14px",
                        borderRadius: Math.max(8, radius - 10),
                        background: "rgba(255,255,255,0.84)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: titleColor,
                        fontSize: 15,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        pointerEvents: "none",
                    }}
                >
                    {item.title}
                </div>
            )}
        </div>
    )


    return (
        <>
            {isLink ? (
                <a
                    href={item.link}
                    aria-label={linkLabel}
                    draggable={false}
                    style={{ display: "block", width: "100%", height: "100%", textDecoration: "none", color: "inherit" }}
                >
                    {inner}
                </a>
            ) : (
                inner
            )}
        </>
    )
}

/* -------------------------------------------------------------------------- */
/* Nav chrome                                                                  */
/* -------------------------------------------------------------------------- */

function ArrowButton({
    direction,
    onClick,
    color,
    bg,
    size,
    disabled,
}: {
    direction: "prev" | "next"
    onClick: () => void
    color: string
    bg: string
    size: number
    disabled?: boolean
}): ReactElement {
    return (
        <button
            type="button"
            aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
            onClick={onClick}
            disabled={disabled}
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                border: "none",
                background: bg,
                color,
                display: "grid",
                placeItems: "center",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
                boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                padding: 0,
            }}
        >
            <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d={direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

function Dots({
    count,
    active,
    onSelect,
    color,
    activeColor,
    animate = true,
}: {
    count: number
    active: number
    onSelect?: (i: number) => void
    color: string
    activeColor: string
    /** false in the static renderer: no CSS transition on the active dot. */
    animate?: boolean
}): ReactElement {
    // Plain buttons (not the ARIA tabs pattern): the slides are not tab panels, so each dot
    // is an ordinary button. Enter/Space activate it natively; aria-current marks the active one.
    return (
        <div
            role="group"
            aria-label="Slide navigation"
            data-qa="carousel-dots"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
            {Array.from({ length: count }).map((_, i) => {
                const isActive = i === active
                return (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to slide ${i + 1} of ${count}`}
                        aria-current={isActive ? "true" : undefined}
                        data-qa="carousel-dot"
                        onClick={onSelect ? () => onSelect(i) : undefined}
                        style={{
                            width: isActive ? 22 : 8,
                            height: 8,
                            borderRadius: 99,
                            border: "none",
                            padding: 0,
                            background: isActive ? activeColor : color,
                            cursor: "pointer",
                            transition: animate ? "width 200ms ease, background 200ms ease" : "none",
                        }}
                    />
                )
            })}
        </div>
    )
}

function PauseButton({
    playing,
    onToggle,
    color,
    bg,
}: {
    playing: boolean
    onToggle: () => void
    color: string
    bg: string
}): ReactElement {
    return (
        <button
            type="button"
            aria-label={playing ? "Pause autoplay" : "Play autoplay"}
            onClick={onToggle}
            style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: bg,
                color,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
            }}
        >
            {playing ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <rect x="1" y="1" width="3.5" height="10" rx="1" fill="currentColor" />
                    <rect x="7.5" y="1" width="3.5" height="10" rx="1" fill="currentColor" />
                </svg>
            ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2 1.5v9l8-4.5-8-4.5z" fill="currentColor" />
                </svg>
            )}
        </button>
    )
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/** Inner padding between the stage edge and any card. */
const STAGE_PAD = 12
/** Virtual camera distance used to project the 3D ring into 2D. */
const RING_CAMERA = 1100
/** Max yaw (deg) a ring card turns at the sides. Back cards face the viewer again,
 *  so text is never mirrored. */
const RING_MAX_YAW = 34

interface RingProjection {
    x: number
    y: number
    s: number
    depth: number
}

function projectRing(R: number, theta: number, tiltRad: number): RingProjection {
    // depth = distance behind the front card (0 … 2R). Front card sits at scale 1.
    const depth = R * (1 - Math.cos(theta))
    const zc = depth * Math.cos(tiltRad)
    const f = RING_CAMERA / (RING_CAMERA + zc)
    const depthNorm = R > 0 ? depth / (2 * R) : 0
    return {
        x: R * Math.sin(theta) * f,
        y: -depth * Math.sin(tiltRad) * f,
        s: f * (1 - 0.18 * depthNorm),
        depth,
    }
}

function ringFitsWidth(R: number, w: number, halfW: number, tiltRad: number): boolean {
    for (let step = 0; step <= 18; step++) {
        const p = projectRing(R, (step / 18) * Math.PI, tiltRad)
        if (Math.abs(p.x) + (w / 2) * p.s > halfW + 0.5) return false
    }
    return true
}

interface Geometry {
    w: number
    h: number
    /** ring */
    ringR: number
    ringTilt: number
    ringShiftY: number
}


/* -------------------------------------------------------------------------- */
/* Continuous-position engine slot                                             */
/* -------------------------------------------------------------------------- */

const FOCUSABLE_SELECTOR =
    'a[href], button, input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"]), [data-mlc-tabindex]'
const FOCUS_RING_CSS =
    "[data-mlc-root]{outline:none}[data-mlc-root]:focus-visible{outline:2px solid #3b82f6;outline-offset:-2px}[data-mlc-dragging] [data-mlc-card]{cursor:grabbing}"

interface SlotVisual {
    transform: string
    opacity?: number
    filter?: string
    zIndex?: number
}

/**
 * One card of the continuous-position engine (every layout except the 3D Ring).
 * `compute(p)` maps the live, unbounded carousel position to this card's visual
 * state. It is written straight to the DOM on every motion-value change, so arrows,
 * autoplay, drag and settle are frame-continuous without React re-renders and with
 * no CSS transitions to switch on/off mid-gesture.
 */
function EngineSlot({
    pos,
    compute,
    baseStyle,
    attrs,
    live,
    children,
}: {
    pos: MotionValue<number>
    compute: (p: number) => SlotVisual
    baseStyle: CSSProperties
    attrs: Record<string, string | number | boolean>
    /** false in the static renderer: render-time style only, no motion-value subscription. */
    live: boolean
    children: ReactNode
}): ReactElement {
    const ref = useRef<HTMLDivElement | null>(null)
    const computeRef = useRef(compute)
    computeRef.current = compute
    const apply = useCallback((p: number) => {
        const el = ref.current
        if (!el) return
        const v = computeRef.current(p)
        el.style.transform = v.transform
        el.style.opacity = v.opacity == null ? "" : String(v.opacity)
        el.style.filter = v.filter ?? ""
        el.style.zIndex = v.zIndex == null ? "" : String(v.zIndex)
    }, [])
    // Re-apply after every render (geometry / hover may have changed) …
    useLayoutEffect(() => {
        if (live) apply(pos.get())
    })
    // … and on every frame the position moves. Static renderer: no subscription at all.
    useLayoutEffect(() => (live ? pos.on("change", apply) : undefined), [pos, apply, live])
    const v = compute(pos.get())
    return (
        <div
            ref={ref}
            {...attrs}
            style={{
                ...baseStyle,
                transform: v.transform,
                opacity: v.opacity,
                filter: v.filter,
                zIndex: v.zIndex,
                willChange: live ? "transform" : undefined,
            }}
        >
            {children}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CarouselLite(props: CarouselLiteProps): ReactElement {
    return <CarouselView {...props} />
}

function CarouselView(
    props: CarouselLiteProps
): ReactElement {
    const {
        layout = "ring",
        items,
        gap = 20,
        radius = 28,
        itemWidth = 240,
        itemHeight = 320,
        ringRadius = 360,
        ringTilt = 8,
        classicPeek = 0.2,
        loop = true,
        autoplay = true,
        autoplayInterval = 3.5,
        pauseOnHover = true,
        showPauseButton = true,
        autoplayPaused,
        onAutoplayPausedChange,
        showArrows = true,
        showDots = true,
        arrowColor = "#ffffff",
        arrowBg = "#111827",
        dotColor = "rgba(17,24,39,0.22)",
        dotActiveColor = "#111827",
        dragEnabled = true,
        titleColor = "#111827",
        showCaptions = true,
        placeholderImages = true,
        label = "Image carousel",
        style,
    } = props
    // Fixed look in Lite (the full 3D Carousel 6-in-1 exposes these as controls).
    const shadow = "0 14px 30px rgba(17,24,39,0.16)"
    const dimInactive = 0.3
    const arrowSize = 40
    const buffer = 3

    const prefersReduced = usePrefersReducedMotion()
    const fmReduced = useFMReduced()
    const reduced = prefersReduced || !!fmReduced
    const isCanvas =
        typeof RenderTarget !== "undefined" &&
        (RenderTarget.current() === RenderTarget.canvas ||
            RenderTarget.current() === RenderTarget.thumbnail)
    // Framer's static renderer (canvas, export, thumbnails). Called unconditionally (rules of
    // hooks); when true the component renders a deterministic, settled first frame: no autoplay,
    // no rAF, no motion-value subscriptions / springs, no drag / wheel / keyboard / hover handlers.
    const isStatic = !!useIsStaticRenderer()
    /** Pointer/keyboard/wheel interaction is wired up only in live (non-canvas, non-static) renders. */
    const interactive = !isStatic && !isCanvas

    /* ----- items ----- */
    // Content signature: re-derive whenever any field changes (e.g. editing an item's
    // Title in the property panel), not only when the array identity changes.
    const itemsSig = itemsSignature(items)
    const resolvedItems = useMemo<ResolvedItem[]>(() => {
        // undefined/null → demo defaults; explicit [] → empty carousel
        const source = items == null ? DEFAULT_ITEMS : items
        return source.map((raw, i) => {
            const it = raw ?? {}
            const own = imageSrc(it.image)
            // Framer can't seed Image controls inside arrays, so items without media
            // get demo imagery (toggle with "Demo Images") on top of a vivid gradient.
            const src =
                own ??
                (placeholderImages
                    ? imageSrc(DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].image)
                    : undefined)
            const alt = it.alt || (typeof it.image === "object" && it.image ? it.image.alt : undefined)
            return {
                // New objects every time (never mutate props); index-based keys stay stable
                // while editing so slides don't remount mid-edit.
                ...it,
                id: it.id || `item-${i}`,
                src,
                alt,
                fallback: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsSig, items, placeholderImages])

    const count = resolvedItems.length
    /** Infinite looping needs ≥2 items (one item is a single static card). */
    const infinite = loop && count > 1
    // Unbounded virtual position: Next = +1, Prev = −1, drag = ±steps, forever — motion
    // never rewinds. The displayed/active item is wrapIndex(vpos). Non-loop stays clamped.
    const [vpos, setVpos] = useState(0)
    const vposRef = useRef(0)
    vposRef.current = vpos
    const index = count > 0 ? wrapIndex(vpos, count) : 0
    /** The visitor's pause/play choice (null = not pressed yet). */
    const [pausedChoice, setPausedChoice] = useState<boolean | null>(null)
    /** Mouse is over the carousel (Pause on Hover). Never set by touch. */
    const [hoverPaused, setHoverPaused] = useState(false)

    /* ----- measurement (ResizeObserver on root + stage) ----- */
    const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
    const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null)
    const rootSize = useElementSize(rootEl)
    const stageSize = useElementSize(stageEl)
    // Same element as the ResizeObserver root; module-level threshold → one observer per mount.
    const inView = useElementInView(rootEl, ROOT_IN_VIEW_THRESHOLD)

    const hasChrome = count > 0 && (showArrows || showDots || (showPauseButton && autoplay))
    const chromeH = hasChrome
        ? Math.max(showArrows ? arrowSize : 0, showDots ? 8 : 0, showPauseButton && autoplay ? 36 : 0) + 16
        : 0

    // Natural stage height: only used as the flex-basis (so "fit content" frames get a
    // sensible height) and as a fallback before the first measurement.
    const naturalStageH = Math.round(
        layout === "ring" ? itemHeight * 1.15 + 40 : itemHeight + 24
    )

    const stageW = stageSize.width || rootSize.width || 900
    const stageH =
        stageSize.height || (rootSize.height > 0 ? Math.max(0, rootSize.height - chromeH) : naturalStageH)
    const measured = stageSize.width > 0 && stageSize.height > 0

    // Enable CSS transitions only after the first real measurement so cards don't
    // animate in from fallback positions.
    const [ready, setReady] = useState(false)
    useEffect(() => {
        // Static renderer: transitions stay off (ready=false) and no rAF is scheduled.
        if (isStatic || !measured || ready) return
        const id = window.requestAnimationFrame(() => setReady(true))
        return () => window.cancelAnimationFrame(id)
    }, [isStatic, measured, ready])

    const geom = useMemo<Geometry>(() => {
        const availW = Math.max(1, stageW - STAGE_PAD * 2)
        const availH = Math.max(1, stageH - STAGE_PAD * 2)
        const fitK = (maxW: number, maxH: number) =>
            Math.max(0.05, Math.min(1, maxW / Math.max(1, itemWidth), maxH / Math.max(1, itemHeight)))
        const base: Geometry = {
            w: itemWidth,
            h: itemHeight,
            ringR: 0,
            ringTilt: 0,
            ringShiftY: 0,
        }
        const sized = (k: number): Geometry => ({ ...base, w: itemWidth * k, h: itemHeight * k })

        switch (layout) {
            case "ring": {
                const tilt = (clamp(ringTilt, 0, 60) * Math.PI) / 180
                const halfW = stageW / 2 - STAGE_PAD
                let k = fitK(availW, availH)
                let R = 0
                let shiftY = 0
                for (let iter = 0; iter < 8; iter++) {
                    const w = itemWidth * k
                    const h = itemHeight * k
                    // Largest radius ≤ Ring Radius whose projected cards stay inside the width.
                    if (ringFitsWidth(ringRadius, w, halfW, tilt)) R = ringRadius
                    else {
                        let lo = 0
                        let hi = ringRadius
                        for (let b = 0; b < 22; b++) {
                            const mid = (lo + hi) / 2
                            if (ringFitsWidth(mid, w, halfW, tilt)) lo = mid
                            else hi = mid
                        }
                        R = lo
                    }
                    const back = projectRing(R, Math.PI, tilt)
                    const top = Math.max(h / 2, -back.y + (h / 2) * back.s)
                    const vertical = top + h / 2
                    shiftY = (top - h / 2) / 2
                    // Radius needed so neighbours don't fully overlap; shrink cards if the
                    // frame is too narrow to give them that much room.
                    const wantR = count > 1 ? Math.min(ringRadius, (count * w * 0.62) / (2 * Math.PI)) : 0
                    let shrink = 1
                    if (vertical > availH) shrink = Math.min(shrink, availH / vertical)
                    if (wantR > 0 && R < wantR * 0.98) shrink = Math.min(shrink, Math.max(0.6, R / wantR))
                    if (shrink >= 0.995 || k <= 0.05) break
                    k = Math.max(0.05, k * shrink)
                }
                return { ...sized(k), ringR: R, ringTilt: tilt, ringShiftY: shiftY }
            }
            case "classic":
            default:
                return sized(fitK(availW, availH))
        }
    }, [
        layout,
        stageW,
        stageH,
        itemWidth,
        itemHeight,
        ringRadius,
        ringTilt,
        count,
    ])
    const { w: cardW, h: cardH } = geom

    const isRing = layout === "ring"
    const isClassic = layout === "classic"
    const isTrack = isClassic

    // Keep the position valid when the item list shrinks or Loop is switched off.
    const wasInfiniteRef = useRef(infinite)
    useEffect(() => {
        const was = wasInfiniteRef.current
        wasInfiniteRef.current = infinite
        if (count <= 0) {
            if (vpos !== 0) setVpos(0)
            return
        }
        if (!infinite && (vpos < 0 || vpos > count - 1)) {
            setVpos(was ? wrapIndex(vpos, count) : clamp(vpos, 0, count - 1))
        }
    }, [count, vpos, infinite])

    /** Jump to a virtual position (drag settle, slide taps). */
    const stepTo = useCallback(
        (target: number) => {
            if (count <= 0 || isStatic) return
            setVpos(infinite ? target : clamp(target, 0, count - 1))
        },
        [count, infinite, isStatic]
    )
    /** Go to item i (dots, Home/End, ring taps): shortest path around the loop. */
    const goToItem = useCallback(
        (i: number) => {
            if (count <= 0 || isStatic) return
            if (!infinite) setVpos(clamp(i, 0, count - 1))
            else
                setVpos((v) => {
                    let d = wrapIndex(i - wrapIndex(v, count), count)
                    if (d > count / 2) d -= count
                    return v + d
                })
        },
        [count, infinite, isStatic]
    )

    // Next ALWAYS means position + 1 (the following item moves into the active slot);
    // every layout maps a larger position to a more-negative translation.
    const next = useCallback(() => {
        if (count <= 0 || isStatic) return
        setVpos((v) => (infinite ? v + 1 : clamp(v + 1, 0, count - 1)))
    }, [count, infinite, isStatic])
    const prev = useCallback(() => {
        if (count <= 0 || isStatic) return
        setVpos((v) => (infinite ? v - 1 : clamp(v - 1, 0, count - 1)))
    }, [count, infinite, isStatic])

    // What the pause/play button shows and controls: the visitor's choice (controlled prop
    // first, then our own state). Until they press it, reduced-motion visitors start paused.
    // Hover / off-screen / canvas only suspend the timer; they never flip the button.
    const userPaused = autoplayPaused ?? pausedChoice ?? reduced
    const autoplayOn =
        autoplay && !isStatic && !isCanvas && inView && !userPaused && !(pauseOnHover && hoverPaused)
    const onStageHover = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse" || !pauseOnHover) return
        const onCard = !!(e.target as Element).closest?.("[data-mlc-card]")
        setHoverPaused((cur) => (cur === onCard ? cur : onCard))
    }
    const toggleAutoplay = () => {
        const nextPaused = !userPaused
        // An explicit Play wins over Pause on Hover (the cursor is on the button, inside the
        // carousel): slides resume now; hover-pause applies again after the pointer re-enters.
        if (!nextPaused) setHoverPaused(false)
        setPausedChoice(nextPaused)
        onAutoplayPausedChange?.(nextPaused)
    }

    // resetKey = vpos: a manual arrow/dot/key/drag restarts the full interval.
    useAutoplay(autoplayOn, Math.max(1, autoplayInterval) * 1000, next, false, vpos)

    const transition = useMemo(() => {
        if (reduced) return { duration: 0 }
        return layout === "classic"
            ? { type: "spring" as const, stiffness: 160, damping: 36, mass: 1.05 }
            : { type: "spring" as const, stiffness: 200, damping: 26 }
    }, [reduced, layout])
    // The engine animates in *card* units (1 = one step), so tighten the spring's rest
    // thresholds (defaults are tuned for px) — otherwise it would stop ~2px early and snap.
    const engineTransition = useMemo(
        () =>
            "type" in transition && transition.type === "spring"
                ? { ...transition, restDelta: 0.0005, restSpeed: 0.002 }
                : transition,
        [transition]
    )

    // Ring needs a wide window so cards don't pop in/out mid-drag; small counts mount all.
    const viewBuffer = Math.max(buffer, 8)

    // Horizontal distance between neighbouring cards for each layout (also used to
    // normalise drag offsets).
    const spacing =
        cardW + gap

    /* ----- continuous-position engine (every layout except the 3D Ring) ----- */
    // `pos` is the live, unbounded carousel position (float). Cards are virtual slots
    // k ∈ ℤ showing item wrapIndex(k); each card's visual is a pure function of k − pos,
    // so motion is continuous in both directions forever, with no seam to teleport across.
    const pos = useMotionValue(vpos)
    const animRef = useRef<AnimationPlaybackControls | null>(null)
    /** Position at drag start (null = not dragging). */
    const dragBaseRef = useRef<number | null>(null)
    // Integer the live position is nearest to — re-renders only when it changes, so the
    // mounted window of slots follows the motion (incl. mid-animation / mid-drag).
    const [center, setCenter] = useState(vpos)
    const centerRef = useRef(vpos)
    useEffect(() => {
        // Static renderer: the position never moves, so no motion-value subscription.
        if (isStatic) return
        return pos.on("change", (v) => {
            const c = Math.round(v)
            if (c !== centerRef.current) {
                centerRef.current = c
                setCenter(c)
            }
        })
    }, [pos, isStatic])
    const instantMotion = reduced || !ready || isCanvas || isStatic
    const settleTo = useCallback(
        (target: number) => {
            animRef.current?.stop()
            animRef.current = null
            if (instantMotion) {
                pos.set(target)
                return
            }
            // Picks up the current velocity (drag release / interrupted animation).
            animRef.current = animate(pos, target, engineTransition)
        },
        [pos, instantMotion, engineTransition]
    )
    useEffect(() => {
        // Static renderer: pos is created at vpos (0) and never moves; nothing to settle.
        if (isStatic || dragBaseRef.current !== null) return
        settleTo(vpos)
    }, [vpos, settleTo, isStatic])
    useEffect(() => () => animRef.current?.stop(), [])

    const { onPointerDown, dragging, didDragRef } = usePointerDrag({
        axis: "x",
        threshold: 6,
        onDrag: (dx) => {
            if (!dragEnabled || !interactive) return
            if (dragBaseRef.current === null) {
                animRef.current?.stop()
                animRef.current = null
                dragBaseRef.current = pos.get()
            }
            // Cards follow the pointer 1:1 (one spacing of travel = one card).
            let p = dragBaseRef.current - dx / Math.max(1, spacing)
            if (!infinite) {
                const max = Math.max(0, count - 1)
                if (p < 0) p *= 0.3
                else if (p > max) p = max + (p - max) * 0.3
            }
            pos.set(p)
        },
        onDragEnd: (vx) => {
            if (!dragEnabled || !interactive) return
            const stepPx = Math.max(1, spacing)
            const threshold = Math.min(cardW * 0.22, stepPx * 0.35)
            const base = dragBaseRef.current ?? pos.get()
            dragBaseRef.current = null
            const cur = pos.get()
            // Settle by distance: nearest whole card to where the drag left off …
            let target = Math.round(cur)
            const startIdx = Math.round(base)
            if (target === startIdx && Math.abs(cur - base) >= threshold / stepPx) {
                target += cur > base ? 1 : -1
            }
            // … plus at most one extra card in the direction of a flick.
            if (Math.abs(vx) >= 400) {
                const f = vx < 0 ? 1 : -1
                if ((target - cur) * f < 0) target += f
            }
            if (!infinite) target = clamp(target, 0, Math.max(0, count - 1))
            if (target === vposRef.current) settleTo(target)
            else setVpos(target)
        },
    })


    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            next()
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            prev()
        } else if (e.key === "Home") {
            e.preventDefault()
            goToItem(0)
        } else if (e.key === "End") {
            e.preventDefault()
            goToItem(count - 1)
        }
    }

    /* ===================== 3D Ring (reference — unchanged) ===================== */
    /** Ring visual for item i at live position p: the angle is a pure function of i − p. */
    const ringVisual = (i: number, p: number): SlotVisual => {
        const step = (Math.PI * 2) / Math.max(count, 1)
        // Normalised to (−π, π]; the wrap happens at the back of the ring, where x = 0 on both
        // sides, so the projected position is continuous across it.
        let theta = (i - p) * step
        theta = Math.atan2(Math.sin(theta), Math.cos(theta))
        const pr = projectRing(geom.ringR, theta, geom.ringTilt)
        const depthNorm = geom.ringR > 0 ? pr.depth / (2 * geom.ringR) : 0
        const yaw = Math.sin(theta) * RING_MAX_YAW
        return {
            transform: `translate3d(${pr.x}px, ${pr.y + geom.ringShiftY}px, 0) perspective(900px) rotateY(${yaw}deg) scale(${pr.s})`,
            opacity: 0.35 + (1 - depthNorm) * 0.65,
            filter: depthNorm > 0.55 ? `brightness(${1 - dimInactive * 0.5 * depthNorm})` : "none",
            zIndex: Math.round(1000 - pr.depth),
        }
    }
    const ringBaseStyle: CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardW,
        height: cardH,
        marginLeft: -cardW / 2,
        marginTop: -cardH / 2,
    }

    const renderRingSlide = (i: number) => {
        const item = resolvedItems[i]
        if (!item) return null
        const active = i === index
        const near = Math.abs(wrapIndex(i - index + Math.floor(count / 2), count) - Math.floor(count / 2)) <= 2
        return (
            <EngineSlot
                key={item.id}
                pos={pos}
                compute={(p) => ringVisual(i, p)}
                baseStyle={ringBaseStyle}
                live={!isStatic}
                attrs={{
                    role: "group",
                    "aria-roledescription": "slide",
                    "aria-label": `${i + 1} of ${count}`,
                    "aria-hidden": !active,
                    "data-index": i,
                    "data-active": active ? "true" : "false",
                }}
            >
                <MediaSlide
                    item={item}
                    active={active}
                    radius={radius}
                    shadow={shadow}
                    showCaptions={showCaptions}
                    titleColor={titleColor}
                    eager={isCanvas || isStatic || near}
                    backface
                    slideNumber={i + 1}
                    slideCount={count}
                    onActivate={isStatic ? undefined : () => goToItem(i)}
                />
            </EngineSlot>
        )
    }
    // Mount every ring card for typical counts; very large rings mount a window around the
    // live centre (each item once — the ring itself is the loop, no copies).
    const ringIndices: number[] = []
    if (isRing && count > 0) {
        if (isCanvas || isStatic || count <= 24) for (let i = 0; i < count; i++) ringIndices.push(i)
        else {
            const c = wrapIndex(center, count)
            const reach = Math.min(Math.floor((count - 1) / 2), viewBuffer + 4)
            for (let d = -reach; d <= reach; d++) ringIndices.push(wrapIndex(c + d, count))
        }
    }

    /* ===================== Engine layouts ===================== */
    const halfW = Math.max(1, stageW / 2)
    const stride = cardW + gap
    const trackTotal = count * stride - gap
    const trackFits = !infinite && trackTotal <= stageW - STAGE_PAD * 2
    const peekPx = isClassic ? cardW * classicPeek : 0
    /** Track layouts: x (px from the stage's left edge) of slot 0 at position p. */
    const trackBase = (p: number): number => {
        // Infinite: active card at the left edge (Classic: after a peek of the previous
        // card). Copies fill both sides, so there is never an empty strip.
        if (infinite) return STAGE_PAD + peekPx - p * stride
        if (trackFits) return (stageW - trackTotal) / 2
        const raw = STAGE_PAD - p * stride + peekPx * clamp(p, 0, 1)
        return clamp(raw, stageW - STAGE_PAD - trackTotal, STAGE_PAD)
    }


    // Slots to mount: everything that can be on screen around the live position.
    let reachL: number
    let reachR: number
    if (isTrack) {
        const x0 = infinite ? STAGE_PAD + peekPx : STAGE_PAD
        reachL = (x0 + cardW) / Math.max(1, stride)
        reachR = (stageW - x0) / Math.max(1, stride)
    } else {
        reachL = reachR = (halfW + Math.max(cardW, cardH)) / Math.max(1, spacing)
    }
    const slotKs: number[] = []
    if (!isRing && count > 0) {
        let lo = Math.floor(center - 0.5 - reachL) - 1
        let hi = Math.ceil(center + 0.5 + reachR) + 1
        if (!infinite) {
            if (isTrack) {
                lo = 0
                hi = count - 1
            } else {
                lo = Math.max(0, lo)
                hi = Math.min(count - 1, hi)
            }
        }
        if (hi - lo > 240) hi = lo + 240
        for (let k = lo; k <= hi; k++) slotKs.push(k)
    }

    /** Visual state of virtual slot k at live position p. */
    const slotVisual = (k: number, p: number): SlotVisual => {
        switch (layout) {
            default: {
                // Classic: a straight strip of card strides.
                return {
                    transform: `translate3d(${trackBase(p) + k * stride}px, 0, 0)`,
                    zIndex: 1,
                }
            }
        }
    }

    const slotBaseStyle: CSSProperties = isTrack
        ? {
              position: "absolute",
              left: 0,
              top: "50%",
              width: cardW,
              height: cardH,
              marginTop: -cardH / 2,
              // Hit-testing follows the (possibly shifted / grown) inner card.
              pointerEvents: "none",
          }
          : {
                position: "absolute",
                left: "50%",
                top: "50%",
                width: cardW,
                height: cardH,
                marginLeft: -cardW / 2,
                marginTop: -cardH / 2,
            }

    const renderEngineSlot = (k: number) => {
        const i = wrapIndex(k, count)
        // Infinite-loop copies render the SAME item element again; each copy lives under
        // its own EngineSlot key (`s${k}`), so React mounts an independent instance.
        const item = resolvedItems[i]
        if (!item) return null
        const active = k === vpos
        const media = (
            <MediaSlide
                item={item}
                active={active}
                radius={radius}
                shadow={shadow}
                showCaptions={showCaptions}
                titleColor={titleColor}
                eager={isCanvas || isStatic || Math.abs(k - vpos) <= 2}
                slideNumber={i + 1}
                slideCount={count}
                onActivate={
                    isStatic
                        ? undefined
                        : () => {
                              stepTo(k)
                          }
                }
            />
        )
        let content: ReactNode = media
        if (isTrack) {
            content = (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>{media}</div>
            )
        }
        return (
            <EngineSlot
                key={`s${k}`}
                pos={pos}
                compute={(p) => slotVisual(k, p)}
                baseStyle={slotBaseStyle}
                live={!isStatic}
                attrs={{
                    role: "group",
                    "aria-roledescription": "slide",
                    "aria-label": `${i + 1} of ${count}`,
                    "aria-hidden": !active,
                    "data-index": i,
                    "data-slot": k,
                    "data-active": active ? "true" : "false",
                }}
            >
                {content}
            </EngineSlot>
        )
    }

    // Inactive slides are aria-hidden, so nothing inside them may take keyboard focus. (Not
    // `inert`: that would also block the click-a-neighbour-to-go-there interaction.)
    useLayoutEffect(() => {
        if (!stageEl || isStatic) return
        for (const slide of stageEl.querySelectorAll<HTMLElement>("[data-active]")) {
            const hide = slide.dataset.active !== "true"
            for (const el of slide.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
                if (hide) {
                    if (el.dataset.mlcTabindex === undefined) {
                        el.dataset.mlcTabindex = el.getAttribute("tabindex") ?? ""
                        el.setAttribute("tabindex", "-1")
                    }
                } else if (el.dataset.mlcTabindex !== undefined) {
                    const orig = el.dataset.mlcTabindex
                    if (orig === "") el.removeAttribute("tabindex")
                    else el.setAttribute("tabindex", orig)
                    delete el.dataset.mlcTabindex
                }
            }
        }
    })


    return (
        <div
            ref={setRootEl}
            data-dragging={dragging ? "true" : "false"}
            data-layout={layout}
            data-measured={measured ? "true" : "false"}
            role="region"
            aria-roledescription="carousel"
            aria-label={label || "Media carousel"}
            data-mlc-root=""
            data-static={isStatic ? "true" : undefined}
            tabIndex={0}
            onKeyDown={isStatic ? undefined : onKeyDown}
            // Every new press starts a fresh gesture: a swipe that ended without a click (touch)
            // must not leave the "just dragged" flag set for the next tap on the chrome buttons.
            onPointerDownCapture={
                interactive
                    ? () => {
                          didDragRef.current = false
                      }
                    : undefined
            }
            onClickCapture={(e) => {
                // Swallow the synthetic click that follows a drag so linked slides don't navigate
                // (only clicks on the slides; the arrows / dots / pause button always work).
                if (didDragRef.current) {
                    didDragRef.current = false
                    if (stageEl && stageEl.contains(e.target as Node)) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }
            }}
            onPointerLeave={
                isStatic
                    ? undefined
                    : () => {
                          setHoverPaused(false)
                      }
            }
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                userSelect: "none",
                WebkitUserSelect: "none",
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
        >
            <style>{FOCUS_RING_CSS}</style>
            {/* Silent while autoplay advances on its own (WAI carousel pattern). */}
            <span style={srOnly} aria-live={autoplayOn ? "off" : "polite"}>
                Slide {count === 0 ? 0 : index + 1} of {count}
            </span>


            {count === 0 && (
                <div
                    data-qa="empty-state"
                    style={{
                        flex: `1 1 ${naturalStageH}px`,
                        minHeight: 0,
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,0.55)",
                        fontSize: 14,
                        letterSpacing: "0.01em",
                    }}
                >
                    No items to display
                </div>
            )}

            {count > 0 && (
                <div
                    ref={setStageEl}
                    data-qa="carousel-stage"
                    onPointerDown={dragEnabled && interactive ? onPointerDown : undefined}
                    // Pause on Hover = a real mouse cursor over an actual card (every layout, loop
                    // copies included), never the gaps or empty stage. Touch taps fire compatibility
                    // mouse events, so only pointerType "mouse" counts. After Play, the next move
                    // onto a card pauses again.
                    onPointerMove={isStatic ? undefined : onStageHover}
                    onPointerOver={isStatic ? undefined : onStageHover}
                    onPointerLeave={isStatic ? undefined : () => setHoverPaused(false)}
                    data-mlc-dragging={dragging ? "" : undefined}
                    style={{
                        position: "relative",
                        width: "100%",
                        // Grow/shrink to whatever the frame gives us; natural height is only
                        // the basis for auto-height frames.
                        flex: `1 1 ${naturalStageH}px`,
                        minHeight: 0,
                        overflow: "hidden",
                        // Empty stage: drag still starts here, but it doesn't look clickable.
                        cursor: dragging ? "grabbing" : "default",
                        touchAction: "pan-y",
                    }}
                >

                    {isRing ? (
                        <div style={{ position: "absolute", inset: 0 }}>{ringIndices.map(renderRingSlide)}</div>
                    ) : (
                        <div data-qa={isTrack ? "carousel-track" : undefined} style={{ position: "absolute", inset: 0 }}>
                            {slotKs.map(renderEngineSlot)}
                        </div>
                    )}
                </div>
            )}

            {hasChrome && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        height: chromeH,
                        boxSizing: "border-box",
                        paddingTop: 8,
                        paddingBottom: 8,
                        flexShrink: 0,
                        position: "relative",
                        zIndex: 5,
                    }}
                >
                    {showArrows && (
                        <ArrowButton
                            direction="prev"
                            onClick={prev}
                            color={arrowColor}
                            bg={arrowBg}
                            size={arrowSize}
                            disabled={!loop && index === 0}
                        />
                    )}
                    {showDots && count <= 24 && (
                        <Dots
                            count={count}
                            active={index}
                            onSelect={isStatic ? undefined : goToItem}
                            color={dotColor}
                            activeColor={dotActiveColor}
                            animate={!isStatic}
                        />
                    )}
                    {showPauseButton && autoplay && (
                        <PauseButton
                            // Shows the visitor's choice, not the momentary timer state (hovering
                            // the button used to flip it to "play"). Static renderer: the on-load
                            // icon ("pause", or "play" for reduced motion) although no timer runs.
                            playing={!userPaused}
                            onToggle={toggleAutoplay}
                            color={arrowColor}
                            bg={arrowBg}
                        />
                    )}
                    {showArrows && (
                        <ArrowButton
                            direction="next"
                            onClick={next}
                            color={arrowColor}
                            bg={arrowBg}
                            size={arrowSize}
                            disabled={!loop && index === count - 1}
                        />
                    )}
                </div>
            )}

        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Property controls                                                           */
/* -------------------------------------------------------------------------- */

addPropertyControls(CarouselLite, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["ring", "classic"],
        optionTitles: ["3D Ring", "Classic"],
        defaultValue: "ring",
        displaySegmentedControl: true,
        description: "More layouts + CMS in the full 3D Carousel 6-in-1.",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Title" },
                link: { type: ControlType.Link, title: "Link" },
                alt: { type: ControlType.String, title: "Alt text", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_ITEMS_CONTROL_VALUE,
    },
    placeholderImages: {
        type: ControlType.Boolean,
        title: "Demo Images",
        defaultValue: true,
        description: "Show sample photos for items that have no image yet.",
    },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 80, step: 1, defaultValue: 20, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, step: 1, defaultValue: 28, unit: "px" },
    itemWidth: { type: ControlType.Number, title: "Item Width", min: 120, max: 720, step: 4, defaultValue: 240, unit: "px" },
    itemHeight: { type: ControlType.Number, title: "Item Height", min: 120, max: 900, step: 4, defaultValue: 320, unit: "px" },
    ringRadius: {
        type: ControlType.Number,
        title: "Ring Radius",
        hidden: (p) => p.layout !== "ring",
        min: 120,
        max: 800,
        step: 10,
        defaultValue: 360,
        unit: "px",
    },
    ringTilt: {
        type: ControlType.Number,
        title: "Ring Tilt",
        hidden: (p) => p.layout !== "ring",
        min: 0,
        max: 45,
        step: 1,
        defaultValue: 8,
        unit: "°",
    },
    classicPeek: {
        type: ControlType.Number,
        title: "Peek",
        hidden: (p) => p.layout !== "classic",
        min: 0,
        max: 0.5,
        step: 0.05,
        defaultValue: 0.2,
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Interval",
        hidden: (p) => !p.autoplay,
        min: 1,
        max: 12,
        step: 0.5,
        defaultValue: 3.5,
        unit: "s",
    },
    pauseOnHover: { type: ControlType.Boolean, title: "Pause Hover", hidden: (p) => !p.autoplay, defaultValue: true },
    showPauseButton: { type: ControlType.Boolean, title: "Pause Button", hidden: (p) => !p.autoplay, defaultValue: true },
    dragEnabled: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
    showArrows: { type: ControlType.Boolean, title: "Arrows", defaultValue: true },
    showDots: { type: ControlType.Boolean, title: "Dots", defaultValue: true },
    arrowColor: { type: ControlType.Color, title: "Arrow Color", defaultValue: "#ffffff", hidden: (p) => !p.showArrows },
    arrowBg: { type: ControlType.Color, title: "Arrow BG", defaultValue: "#111827", hidden: (p) => !p.showArrows },
    dotColor: { type: ControlType.Color, title: "Dot Color", defaultValue: "rgba(17,24,39,0.22)", hidden: (p) => !p.showDots },
    dotActiveColor: { type: ControlType.Color, title: "Dot Active", defaultValue: "#111827", hidden: (p) => !p.showDots },
    showCaptions: { type: ControlType.Boolean, title: "Captions", defaultValue: true },
    titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: "#111827", hidden: (p) => !p.showCaptions },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Image carousel",
        description: "Accessible name read by screen readers.",
    },
})

