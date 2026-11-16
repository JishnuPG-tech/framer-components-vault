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
    AnimatePresence,
    motion,
    useInView,
    useReducedMotion,
} from "framer-motion"
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react"

/**
 * GalleryViewer
 *
 * One image at a time with a choice of transitions, navigation controls
 * (text / chevron / custom icon) placeable in several positions, optional tap
 * zones over the left/right halves, a configurable progress indicator
 * (counter, shapes, or an all-images filmstrip), and optional click-to-zoom
 * with pan.
 *
 * CONNECTING THE CMS: bind "Image 1", "Image 2", … to the matching Gallery
 * Image fields. Each is a separate scalar Image property, which is what makes
 * it bindable — Framer cannot bind an Array control to CMS data. Empty slots
 * are skipped, so fields don't have to be filled contiguously.
 *
 * ZOOM vs TAP SIDES: with Click Zoom on, the zoom target covers only the
 * visible image, and the tap zones sit beneath it as full left/right halves —
 * so tapping the image zooms, while tapping the margins beside (or around) it
 * navigates, right up to the image's edge. Desktop pans by hovering; touch pans
 * by dragging and exits on a second tap. Zoom uses the system zoom cursors by
 * default; turn on Custom Cursor to upload your own (with a size + hotspot). A
 * separate Zoom Padding Y expands the frame only while zoomed.
 *
 * LABEL STYLING: Label Font sets typography, Label Colour sets colour and also
 * drives the chevron (drawn with currentColor). The colour picker lists project
 * COLOUR styles; project TEXT styles can't be referenced from a control.
 *
 * ACCESSIBILITY: every interactive target — the arrows and each progress
 * indicator (dots / squares / bars / thumbnails) — is at least 24×24 CSS px
 * (WCAG 2.2 SC 2.5.8, AA). Small indicators keep their visual size but sit
 * inside a transparent 24×24 hit area.
 *
 * STATIC RENDERING: on the Framer canvas, in exports and in thumbnails the
 * component must not move. `useIsStaticRenderer` (plus a thumbnail check)
 * drives a single `isStatic` flag, and everything that animates or runs
 * continuously is gated behind it: the slide transition falls back to a plain
 * first-frame render, every CSS transition is dropped, and the key listener,
 * neighbour preloading, cursor repainting, ResizeObserver and smooth
 * scrolling never start. The static fallback is the real image at its real
 * size, so the canvas still shows what the visitor will see.
 */

const MAX_IMAGES = 20
const DEFAULT_INSET = 20
// Horizontal breathing room for the thumbnail filmstrip so it never touches
// the frame edges. The vertical offset of the progress indicator is set per
// instance by the Progress Inset control.
const PROGRESS_EDGE_MARGIN = 20
// WCAG 2.2 SC 2.5.8 (Target Size, Minimum, AA): interactive targets ≥ 24×24.
const MIN_TARGET = 24
// Movement beyond this (px) counts as a drag rather than a tap.
const TAP_SLOP = 6

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

type TransitionKind = "none" | "fade" | "slide" | "zoom" | "blur"
type ProgressKind =
    | "none"
    | "counter"
    | "dots"
    | "squares"
    | "bars"
    | "thumbnails"
type NavStyle = "text" | "chevron" | "image"
type Placement = "bottomCorners" | "topCorners" | "middleSides"

type ImageValue =
    | { src?: string; srcSet?: string; alt?: string }
    | string
    | null
    | undefined

interface GalleryViewerProps {
    verticalPadding?: number
    horizontalPadding?: number
    loop?: boolean
    transition?: TransitionKind
    transitionDuration?: number
    easing?: string
    slideDistance?: number
    zoomAmount?: number
    blurAmount?: number
    clickToZoom?: boolean
    zoomScale?: number
    zoomedPaddingY?: number
    customCursor?: boolean
    zoomInCursor?: string
    zoomOutCursor?: string
    cursorSize?: number
    cursorHotspotX?: number
    cursorHotspotY?: number
    progress?: ProgressKind
    progressInset?: number
    indicatorSize?: number
    indicatorGap?: number
    indicatorColor?: string
    inactiveOpacity?: number
    thumbnailHeight?: number
    thumbnailGap?: number
    navStyle?: NavStyle
    arrowSize?: number
    buttonInsetX?: number
    buttonInsetY?: number
    buttonOpacity?: number
    buttonHoverOpacity?: number
    previousImage?: string
    nextImage?: string
    placement?: Placement
    previousLabel?: string
    nextLabel?: string
    labelFont?: CSSProperties
    labelColor?: string
    keyboardNavigation?: boolean
    tapZones?: boolean
    style?: CSSProperties
    [key: string]: any
}

type Slide = { src: string; srcSet?: string; alt: string }

/**
 * Framer supplies these as ResponsiveImage objects. A plain string URL is also
 * accepted, so the component still works if images are set by hand in code.
 */
function normalise(value: ImageValue): Slide | null {
    if (!value) return null
    if (typeof value === "string") {
        return value.trim() ? { src: value, alt: "" } : null
    }
    if (!value.src) return null
    return { src: value.src, srcSet: value.srcSet, alt: value.alt ?? "" }
}

/**
 * Variants receive the navigation direction as `custom`: 1 when moving
 * forward, -1 when moving back. That's what lets Slide travel the correct way
 * rather than always drifting one direction.
 */
function buildVariants(
    kind: TransitionKind,
    slideDistance: number,
    zoomAmount: number,
    blurAmount: number
) {
    switch (kind) {
        case "slide":
            return {
                enter: (dir: number) => ({
                    x: `${dir >= 0 ? slideDistance : -slideDistance}%`,
                    opacity: 0,
                }),
                center: { x: "0%", opacity: 1 },
                exit: (dir: number) => ({
                    x: `${dir >= 0 ? -slideDistance : slideDistance}%`,
                    opacity: 0,
                }),
            }
        case "zoom":
            return {
                enter: { opacity: 0, scale: 1 + zoomAmount },
                center: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 1 - zoomAmount },
            }
        case "blur":
            return {
                enter: { opacity: 0, filter: `blur(${blurAmount}px)` },
                center: { opacity: 1, filter: "blur(0px)" },
                exit: { opacity: 0, filter: `blur(${blurAmount}px)` },
            }
        // "none" shares the fade shape and simply runs at zero duration.
        case "none":
        case "fade":
        default:
            return {
                enter: { opacity: 0 },
                center: { opacity: 1 },
                exit: { opacity: 0 },
            }
    }
}

/** Bars are a wide, short pill; dots are round; squares are hard-cornered. */
function indicatorShape(kind: ProgressKind, size: number) {
    if (kind === "bars") {
        return {
            width: size * 4,
            height: Math.max(2, Math.round(size / 3)),
            borderRadius: 999,
        }
    }
    return {
        width: size,
        height: size,
        borderRadius: kind === "squares" ? 0 : "50%",
    }
}

/**
 * A stroked chevron drawn with currentColor, so Label Colour governs it. The
 * viewBox is fixed, so stroke weight scales in proportion to `size`.
 */
function Chevron({
    direction,
    size,
}: {
    direction: "left" | "right"
    size: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            style={{ display: "block" }}
        >
            <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
        </svg>
    )
}

/**
 * Where each control sits. `insetX` is the horizontal distance from the frame
 * edge (all placements); `insetY` is the vertical distance from the top/bottom
 * edge (corner placements only — Middle Sides is vertically centred). Previous
 * stays on the left and Next on the right, so they never collide with the
 * centred progress indicator.
 */
function navPosition(
    placement: Placement,
    side: "prev" | "next",
    insetX: number,
    insetY: number
): CSSProperties {
    const horizontal = side === "prev" ? { left: insetX } : { right: insetX }
    const base: CSSProperties = { position: "absolute", zIndex: 3 }

    if (placement === "middleSides") {
        // Vertically centred, so only the X inset applies here.
        return {
            ...base,
            top: "50%",
            transform: "translateY(-50%)",
            ...horizontal,
        }
    }
    if (placement === "topCorners") {
        return { ...base, top: insetY, ...horizontal }
    }
    // bottomCorners (default)
    return { ...base, bottom: insetY, ...horizontal }
}

/**
 * Build a CSS cursor value. A custom cursor image is layered before the system
 * keyword, which stays as the fallback if the image is missing or rejected
 * (browsers ignore cursor images larger than ~128px). The hotspot is the
 * active point of the cursor, in px from its top-left.
 */
function cursorValue(
    url: string | undefined,
    hotspotX: number,
    hotspotY: number,
    fallback: string
): string {
    if (!url) return fallback
    return `url("${url}") ${hotspotX} ${hotspotY}, ${fallback}`
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GalleryViewer(props: GalleryViewerProps) {
    const {
        verticalPadding = 120,
        horizontalPadding = 0,
        loop = true,
        transition = "fade",
        transitionDuration = 0.4,
        easing = "easeInOut",
        slideDistance = 100,
        zoomAmount = 0.06,
        blurAmount = 12,
        clickToZoom = false,
        zoomScale = 2,
        zoomedPaddingY = 40,
        customCursor = false,
        zoomInCursor,
        zoomOutCursor,
        cursorSize = 32,
        cursorHotspotX = 0,
        cursorHotspotY = 0,
        progress = "counter",
        progressInset = 20,
        indicatorSize = 6,
        indicatorGap = 8,
        indicatorColor = "rgb(10, 10, 10)",
        inactiveOpacity = 0.3,
        thumbnailHeight = 64,
        thumbnailGap = 8,
        navStyle = "chevron",
        arrowSize = 24,
        buttonInsetX = DEFAULT_INSET,
        buttonInsetY = DEFAULT_INSET,
        buttonOpacity = 1,
        buttonHoverOpacity = 1,
        previousImage,
        nextImage,
        placement = "bottomCorners",
        previousLabel = "Previous",
        nextLabel = "Next",
        labelFont,
        labelColor = "rgb(10, 10, 10)",
        keyboardNavigation = true,
        tapZones = true,
        style,
    } = props

    /**
     * True on the Framer canvas, during export, and for project thumbnails.
     * `useIsStaticRenderer` covers canvas + export; the thumbnail target is
     * added so previews capture a clean first frame too. Nothing that moves,
     * observes, listens or fetches may start while this is true.
     */
    const isStatic =
        useIsStaticRenderer() ||
        RenderTarget.current() === RenderTarget.thumbnail

    /**
     * Respect the visitor's reduced-motion setting. Opacity changes are
     * generally considered acceptable under that preference, so this degrades
     * to a plain fade rather than removing the transition outright.
     */
    const shouldReduceMotion = useReducedMotion()

    /**
     * Wraps every CSS transition in this component. Returns undefined on a
     * static render, so the canvas and exports paint a settled frame instead
     * of catching an element mid-transition.
     */
    const anim = (value: string) => (isStatic ? undefined : value)

    const raw: ImageValue[] = []
    for (let i = 1; i <= MAX_IMAGES; i++) raw.push(props[`image${i}`])

    // Memo key built from the resolved URLs. Framer recreates the prop objects
    // on every render, so comparing object identity would never hit the cache.
    const signature = raw
        .map((value) =>
            typeof value === "string" ? value : (value?.src ?? "")
        )
        .join("|")

    const slides = useMemo(
        () =>
            raw
                .map(normalise)
                .filter((slide): slide is Slide => slide !== null),
        [signature]
    )

    const total = slides.length
    const [index, setIndex] = useState(0)
    const [direction, setDirection] = useState(1)

    // Zoom state. `focal` is the normalised point (0..1 on each axis) kept
    // centred while zoomed; it drives transform-origin so panning is a pure
    // origin change with no layout cost.
    const [zoomed, setZoomed] = useState(false)
    const [focal, setFocal] = useState({ x: 0.5, y: 0.5 })
    // Which arrow the mouse is over, for the hover-opacity state.
    const [hoverSide, setHoverSide] = useState<null | "prev" | "next">(null)
    // Custom cursors redrawn to Cursor Size (see effect below).
    const [cursorData, setCursorData] = useState<{ in?: string; out?: string }>(
        {}
    )
    // Natural aspect ratio (w / h) of the current image, read on load. Drives
    // the zoom surface so it covers only the visible image, not the letterbox
    // or pillarbox gaps around it.
    const [naturalAspect, setNaturalAspect] = useState<number | null>(null)
    // Measured sizes of the root frame and the padded content area, so the zoom
    // surface can be placed over the image rectangle.
    const [sizes, setSizes] = useState({
        rootW: 0,
        rootH: 0,
        contentW: 0,
        contentH: 0,
    })
    const rootRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const drag = useRef({
        active: false,
        moved: false,
        startX: 0,
        startY: 0,
        startFocal: { x: 0.5, y: 0.5 },
    })

    // Reset when the list changes — i.e. when the visitor opens a different
    // CMS item, or when images are re-bound on the canvas.
    useEffect(() => {
        setIndex(0)
        setDirection(1)
        setZoomed(false)
    }, [signature])

    // Guard against rendering with a stale index before the effect above runs.
    const safeIndex = total === 0 ? 0 : Math.min(index, total - 1)
    const current = slides[safeIndex] ?? null

    const go = useCallback(
        (step: number) => {
            if (total === 0) return
            setZoomed(false)
            setFocal({ x: 0.5, y: 0.5 })
            setDirection(step >= 0 ? 1 : -1)
            setIndex((prev) => {
                const next = prev + step
                if (loop) return (next + total) % total
                return Math.min(Math.max(next, 0), total - 1)
            })
        },
        [loop, total]
    )

    // Used by the indicator / filmstrip, which jump rather than step. Direction
    // is derived from the jump so Slide still travels the sensible way.
    const goTo = useCallback(
        (target: number) => {
            if (total === 0) return
            setZoomed(false)
            setFocal({ x: 0.5, y: 0.5 })
            setDirection(target >= safeIndex ? 1 : -1)
            setIndex(Math.min(Math.max(target, 0), total - 1))
        },
        [safeIndex, total]
    )

    /**
     * Arrow keys. Scoped in three ways, because this is a window-level
     * listener: never on a static render; only while the gallery is actually
     * on screen (two galleries on one page would otherwise both answer the
     * same key press, and an off-screen one would swallow the arrow keys a
     * visitor is using to scroll); and never while the visitor is typing or
     * holding a modifier.
     */
    const inView = useInView(rootRef, { amount: 0.3 })

    useEffect(() => {
        if (!keyboardNavigation) return
        if (isStatic) return
        if (total < 2) return
        if (!inView) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return
            const target = event.target as HTMLElement | null
            if (
                target &&
                (target.isContentEditable ||
                    /^(input|textarea|select)$/i.test(target.tagName))
            ) {
                return
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault()
                go(-1)
            } else if (event.key === "ArrowRight") {
                event.preventDefault()
                go(1)
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [keyboardNavigation, total, go, isStatic, inView])

    // Escape leaves zoom, independent of the arrow-key setting.
    useEffect(() => {
        if (!zoomed) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setZoomed(false)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [zoomed])

    // Warm the neighbouring images. Matters more with a transition: a
    // half-loaded image would animate in blank.
    useEffect(() => {
        if (total < 2) return
        if (isStatic) return

        const neighbours = [
            slides[(safeIndex + 1) % total],
            slides[(safeIndex - 1 + total) % total],
        ]

        neighbours.forEach((slide) => {
            if (!slide) return
            const preloader = new Image()
            if (slide.srcSet) preloader.srcset = slide.srcSet
            preloader.src = slide.src
        })
    }, [safeIndex, slides, total, isStatic])

    // Redraw the custom cursors at Cursor Size. CSS shows a cursor image at its
    // native pixel size, so the only way to size it is to repaint it onto a
    // canvas at the requested dimensions and hand back a data URL. If the image
    // can't be read cross-origin (canvas would taint), we fall back to the raw
    // URL at its original size rather than dropping the cursor. Skipped entirely
    // unless the visitor has opted into custom cursors.
    useEffect(() => {
        if (typeof document === "undefined") return
        // No custom cursor on a static render — there is no pointer to give
        // it to, and the repaint would be pure canvas cost.
        if (isStatic) return
        if (!customCursor) {
            setCursorData({})
            return
        }
        let cancelled = false

        const resize = (url?: string) =>
            new Promise<string | undefined>((resolve) => {
                if (!url) return resolve(undefined)
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas")
                        canvas.width = cursorSize
                        canvas.height = cursorSize
                        const ctx = canvas.getContext("2d")
                        if (!ctx) return resolve(url)
                        // Contain-fit into the square so aspect is preserved.
                        const scale = Math.min(
                            cursorSize / img.width,
                            cursorSize / img.height
                        )
                        const w = img.width * scale
                        const h = img.height * scale
                        ctx.drawImage(
                            img,
                            (cursorSize - w) / 2,
                            (cursorSize - h) / 2,
                            w,
                            h
                        )
                        resolve(canvas.toDataURL("image/png"))
                    } catch {
                        resolve(url)
                    }
                }
                img.onerror = () => resolve(url)
                img.src = url
            })

        Promise.all([resize(zoomInCursor), resize(zoomOutCursor)]).then(
            ([inUrl, outUrl]) => {
                if (!cancelled) setCursorData({ in: inUrl, out: outUrl })
            }
        )

        return () => {
            cancelled = true
        }
    }, [customCursor, zoomInCursor, zoomOutCursor, cursorSize, isStatic])

    // Measure the frame and the content area so the zoom surface can be sized to
    // the visible image. A ResizeObserver keeps it current through layout
    // changes, including the padding animation when zooming.
    useEffect(() => {
        // These measurements exist only to place the zoom surface, so there is
        // nothing to observe when zoom is off or the render is static — which
        // keeps a ResizeObserver off every instance on the canvas.
        if (isStatic || !clickToZoom) return
        const rootEl = rootRef.current
        const stageEl = stageRef.current
        if (!rootEl || !stageEl) return
        const measure = () => {
            setSizes({
                rootW: rootEl.clientWidth,
                rootH: rootEl.clientHeight,
                contentW: stageEl.clientWidth,
                contentH: stageEl.clientHeight,
            })
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(rootEl)
        ro.observe(stageEl)
        return () => ro.disconnect()
    }, [isStatic, clickToZoom])

    // Filmstrip: hide the scrollbar (once) and keep the active thumb in view.
    const activeThumbRef = useRef<HTMLButtonElement | null>(null)
    const stripRef = useRef<HTMLDivElement | null>(null)
    const stripDrag = useRef({
        active: false,
        moved: false,
        startX: 0,
        startScroll: 0,
    })

    useEffect(() => {
        if (progress !== "thumbnails") return
        if (typeof document === "undefined") return
        if (document.getElementById("gv-strip-style")) return
        const s = document.createElement("style")
        s.id = "gv-strip-style"
        s.textContent =
            "[data-gv-strip]::-webkit-scrollbar{width:0;height:0;display:none}"
        document.head.appendChild(s)
    }, [progress])

    useEffect(() => {
        if (progress !== "thumbnails") return
        // Smooth scrolling is an animation: never on a static render, and a
        // plain jump when the visitor has asked for reduced motion.
        if (isStatic) return
        // Don't yank the strip while the user is dragging it.
        if (stripDrag.current.active) return
        activeThumbRef.current?.scrollIntoView({
            inline: "center",
            block: "nearest",
            behavior: shouldReduceMotion ? "auto" : "smooth",
        })
    }, [safeIndex, progress, isStatic, shouldReduceMotion])

    const hasMultiple = total > 1
    const prevDisabled = !hasMultiple || (!loop && safeIndex === 0)
    const nextDisabled = !hasMultiple || (!loop && safeIndex === total - 1)

    // Reduced motion degrades to a plain fade (see shouldReduceMotion above);
    // a static render has no transition at all and is handled in the markup.
    const activeKind: TransitionKind =
        shouldReduceMotion && transition !== "none" ? "fade" : transition

    const duration =
        activeKind === "none" ? 0 : Math.max(0, transitionDuration)

    const variants = useMemo(
        () =>
            buildVariants(activeKind, slideDistance, zoomAmount, blurAmount),
        [activeKind, slideDistance, zoomAmount, blurAmount]
    )

    // --- Zoom interaction ------------------------------------------------
    // Focal point of a pointer within the zoom surface (0..1 on each axis).
    // Geometry comes from the surface element itself (e.currentTarget), which
    // is stable across navigation — unlike the image, it never unmounts when
    // the slide swaps, so the interaction keeps working on every image.
    const focalFromEvent = (e: React.PointerEvent) => {
        const r = e.currentTarget.getBoundingClientRect()
        return {
            x: clamp01((e.clientX - r.left) / r.width),
            y: clamp01((e.clientY - r.top) / r.height),
        }
    }

    const onZoomPointerDown = (e: React.PointerEvent) => {
        drag.current.active = true
        drag.current.moved = false
        drag.current.startX = e.clientX
        drag.current.startY = e.clientY
        drag.current.startFocal = focal
        // Only capture while zoomed (for drag-pan). Capturing when idle would
        // swallow a normal scroll gesture that happens to start on the image.
        if (zoomed) {
            try {
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            } catch {}
        }
    }

    const onZoomPointerMove = (e: React.PointerEvent) => {
        if (drag.current.active) {
            const dx = e.clientX - drag.current.startX
            const dy = e.clientY - drag.current.startY
            if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) {
                drag.current.moved = true
            }
            // Touch/pen drag pans by delta so the image follows the finger.
            if (zoomed && e.pointerType !== "mouse") {
                const r = e.currentTarget.getBoundingClientRect()
                const overflowX = r.width * (zoomScale - 1)
                const overflowY = r.height * (zoomScale - 1)
                setFocal({
                    x: clamp01(
                        drag.current.startFocal.x - dx / (overflowX || 1)
                    ),
                    y: clamp01(
                        drag.current.startFocal.y - dy / (overflowY || 1)
                    ),
                })
            }
            return
        }
        // Desktop: hovering while zoomed pans by mapping the cursor position.
        if (zoomed && e.pointerType === "mouse") {
            setFocal(focalFromEvent(e))
        }
    }

    const onZoomPointerUp = (e: React.PointerEvent) => {
        const wasActive = drag.current.active
        drag.current.active = false
        if (!wasActive || drag.current.moved) return
        // A tap/click without movement toggles zoom.
        if (!zoomed) {
            setFocal(focalFromEvent(e))
            setZoomed(true)
        } else {
            setZoomed(false)
        }
    }

    // --- Filmstrip drag-to-scroll ---------------------------------------
    // Touch already scrolls the strip natively; the mouse can't, so this adds
    // click-and-drag scrolling. Movement past the slop sets `moved`, which the
    // thumbnail's onClick reads to suppress an accidental jump after a drag.
    const onStripPointerDown = (e: React.PointerEvent) => {
        const el = stripRef.current
        if (!el) return
        stripDrag.current = {
            active: true,
            moved: false,
            startX: e.clientX,
            startScroll: el.scrollLeft,
        }
    }

    const onStripPointerMove = (e: React.PointerEvent) => {
        if (!stripDrag.current.active) return
        const el = stripRef.current
        if (!el) return
        const dx = e.clientX - stripDrag.current.startX
        if (Math.abs(dx) > TAP_SLOP) stripDrag.current.moved = true
        // Touch scrolls natively; only the mouse needs a manual assist.
        if (e.pointerType === "mouse") {
            el.scrollLeft = stripDrag.current.startScroll - dx
        }
    }

    const endStripDrag = () => {
        stripDrag.current.active = false
    }

    // The font control spreads last so it wins, while these defaults keep the
    // original look if it's left untouched. Only the text style uses the
    // typography; chevron and image ignore it but keep the reset + colour.
    //
    // The 24×24 floor makes the button itself the accessible target (WCAG
    // 2.2 SC 2.5.8). Content centres within it; a larger Arrow Size grows the
    // button past the floor rather than being capped by it.
    const labelStyle: CSSProperties = {
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        userSelect: "none",
        transition: anim("opacity 0.2s ease"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: MIN_TARGET,
        minHeight: MIN_TARGET,
        fontFamily: '"Haas Grot Text Web", "Inter", sans-serif',
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: "0.01em",
        lineHeight: "1.65em",
        ...(labelFont ?? {}),
        color: labelColor,
    }

    // Resting opacity, hover opacity, or fully hidden at a disabled end.
    const buttonOpacityFor = (side: "prev" | "next", disabled: boolean) => {
        if (disabled) return 0
        return hoverSide === side ? buttonHoverOpacity : buttonOpacity
    }

    // Resolve what a nav button shows. Image style falls back to the chevron
    // for any side whose icon hasn't been uploaded, so it's never blank.
    const navContent = (side: "prev" | "next"): ReactNode => {
        const dir = side === "prev" ? "left" : "right"
        if (navStyle === "text") {
            return side === "prev" ? previousLabel : nextLabel
        }
        if (navStyle === "image") {
            const icon = side === "prev" ? previousImage : nextImage
            if (icon) {
                return (
                    <img
                        src={icon}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        style={{
                            width: arrowSize,
                            height: arrowSize,
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                )
            }
        }
        return <Chevron direction={dir} size={arrowSize} />
    }

    // The canvas gets the binding hint below; every static target (canvas,
    // export, thumbnail) loses the interactive layers.
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const zoomActive = clickToZoom && !isStatic
    const showZones = tapZones && hasMultiple && !isStatic
    const showProgress = progress !== "none" && hasMultiple
    const isShapes =
        progress === "dots" || progress === "squares" || progress === "bars"
    const shape = indicatorShape(progress, indicatorSize)

    // While zoomed, the frame expands to Zoom Padding Y so more of the enlarged
    // image is visible; otherwise the normal Padding Y applies. The change is
    // transitioned in step with the zoom scale.
    const activeVerticalPadding = zoomed ? zoomedPaddingY : verticalPadding

    // Zoom cursor: the system zoom-in / zoom-out icons by default. When Custom
    // Cursor is on, use the uploaded (and resized) images, still falling back to
    // the system icons for any side left empty. The hotspot is clamped to the
    // cursor size — a hotspot outside the image makes browsers ignore it.
    const hotX = Math.min(cursorHotspotX, cursorSize)
    const hotY = Math.min(cursorHotspotY, cursorSize)
    const zoomInUrl = customCursor ? (cursorData.in ?? zoomInCursor) : undefined
    const zoomOutUrl = customCursor
        ? (cursorData.out ?? zoomOutCursor)
        : undefined
    const zoomCursor = zoomed
        ? cursorValue(zoomOutUrl, hotX, hotY, "zoom-out")
        : cursorValue(zoomInUrl, hotX, hotY, "zoom-in")

    // The zoom surface should cover only the VISIBLE image, so hovering or
    // clicking the empty gaps around a portrait/landscape image does nothing and
    // shows no zoom cursor. The image is centred in the frame (symmetric
    // padding), so its rect is the contain-fit of its aspect ratio within the
    // content area, centred in the root. While zoomed the enlarged image fills
    // the frame, so the surface expands to the whole content area to allow
    // panning across all of it.
    const centreRect = (w: number, h: number) => ({
        left: (sizes.rootW - w) / 2,
        top: (sizes.rootH - h) / 2,
        width: w,
        height: h,
    })
    const fullRect = centreRect(sizes.contentW, sizes.contentH)
    let imageRect = fullRect
    if (naturalAspect && sizes.contentW > 0 && sizes.contentH > 0) {
        const contentAspect = sizes.contentW / sizes.contentH
        let dW: number
        let dH: number
        if (contentAspect > naturalAspect) {
            dH = sizes.contentH
            dW = dH * naturalAspect
        } else {
            dW = sizes.contentW
            dH = dW / naturalAspect
        }
        imageRect = centreRect(dW, dH)
    }
    const surfaceRect = zoomed ? fullRect : imageRect

    // Tap zones are the full left/right halves, sitting BELOW the zoom surface
    // (z1 vs z2). Over the image the zoom surface takes the click (zoom); in the
    // margins around the image the half beneath is exposed, so a tap right next
    // to the image navigates — no dead space between the frame edge and the
    // image. Without zoom there's no surface on top, so the halves simply cover
    // the whole frame as before.
    const zoneStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "50%",
        zIndex: 1,
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        userSelect: "none",
    }
    // While zoomed, disable the zones so panning owns the whole image.
    const zonesLive = showZones && !zoomed

    // The slide layer is identical in both render modes; only its wrapper
    // differs — a motion element when live, a plain div when static — so the
    // image itself is built once here.
    const slideLayerStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    const slideImage = current ? (
        <img
            src={current.src}
            srcSet={current.srcSet}
            alt={current.alt}
            draggable={false}
            // The measured aspect ratio only feeds the zoom surface, which
            // never renders statically — so skip the state update there.
            onLoad={
                isStatic
                    ? undefined
                    : (e) => {
                          const t = e.currentTarget
                          if (t.naturalWidth > 0 && t.naturalHeight > 0) {
                              const a = t.naturalWidth / t.naturalHeight
                              setNaturalAspect((prev) => (prev === a ? prev : a))
                          }
                      }
            }
            style={{
                height: "100%",
                width: "auto",
                maxWidth: "100%",
                display: "block",
                objectFit: "contain",
                transform: zoomed ? `scale(${zoomScale})` : "none",
                transformOrigin: `${focal.x * 100}% ${focal.y * 100}%`,
                // Scale animates; origin (pan) is instant because it isn't
                // transitioned.
                transition: anim("transform 0.3s ease"),
                willChange: zoomActive ? "transform" : undefined,
            }}
        />
    ) : null

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
            }}
        >
            {/*
             * The padding lives on this inner wrapper, not the outer one, so
             * the nav controls stay pinned to the frame's edges and only the
             * image is inset. Padding Y is animated so the zoomed frame expands
             * smoothly.
             */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    paddingTop: activeVerticalPadding,
                    paddingBottom: activeVerticalPadding,
                    paddingLeft: horizontalPadding,
                    paddingRight: horizontalPadding,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: anim("padding 0.3s ease"),
                }}
            >
                {/*
                 * The stage exists so the animating slides have something to
                 * position against. An absolutely positioned element resolves
                 * its insets against the containing block's PADDING box, so
                 * anchoring the slides to the wrapper above would make them
                 * ignore the padding entirely. Clipping here also keeps Slide,
                 * Zoom and the pan inside the content area.
                 */}
                <div
                    ref={stageRef}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    {/*
                     * Static renders (canvas, export, thumbnail) skip Motion
                     * entirely and paint the current image as a plain layer.
                     * That is the static preview the marketplace asks for: no
                     * enter/exit animation to catch mid-flight in an export,
                     * and no animation machinery running per instance while
                     * the designer works on the canvas.
                     */}
                    {isStatic ? (
                        current ? (
                            <div style={slideLayerStyle}>{slideImage}</div>
                        ) : null
                    ) : (
                        <AnimatePresence initial={false} custom={direction}>
                            {current ? (
                                <motion.div
                                    key={`${safeIndex}-${current.src}`}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        duration,
                                        ease: easing as any,
                                    }}
                                    style={slideLayerStyle}
                                >
                                    {slideImage}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    )}

                    {!current && isCanvas ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                                fontFamily: "sans-serif",
                                fontSize: 13,
                                textAlign: "center",
                                padding: "0 20px",
                            }}
                        >
                            Bind the Gallery Image fields to Image 1, Image 2, …
                        </div>
                    ) : null}
                </div>
            </div>

            {showZones ? (
                <>
                    {/*
                     * aria-hidden and tabIndex -1: these duplicate the labels
                     * below, so screen readers and keyboard users get one set
                     * of controls rather than four. They sit at z1 — beneath the
                     * zoom surface (z2) — so the image zooms while the margins
                     * around it navigate.
                     */}
                    <div
                        onClick={() => go(-1)}
                        aria-hidden="true"
                        tabIndex={-1}
                        style={{
                            ...zoneStyle,
                            left: 0,
                            cursor: prevDisabled ? "default" : "pointer",
                            pointerEvents:
                                zonesLive && !prevDisabled ? "auto" : "none",
                        }}
                    />
                    <div
                        onClick={() => go(1)}
                        aria-hidden="true"
                        tabIndex={-1}
                        style={{
                            ...zoneStyle,
                            right: 0,
                            cursor: nextDisabled ? "default" : "pointer",
                            pointerEvents:
                                zonesLive && !nextDisabled ? "auto" : "none",
                        }}
                    />
                </>
            ) : null}

            {/*
             * Zoom surface — a top-level layer sized to the visible image, kept
             * OUTSIDE the transition wrapper so it never unmounts when the image
             * swaps (that unmount was what previously killed zoom after the first
             * navigation). Idle, it covers only the image rectangle; while zoomed
             * it grows to the whole content area for panning. Sits ABOVE the tap
             * zones (z2 vs z1) so the image zooms while the margins around it
             * navigate, and below the controls (z3). touchAction none while
             * zoomed stops a drag from scrolling the page.
             */}
            {zoomActive && current && sizes.rootW > 0 ? (
                <div
                    onPointerDown={onZoomPointerDown}
                    onPointerMove={onZoomPointerMove}
                    onPointerUp={onZoomPointerUp}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: surfaceRect.left,
                        top: surfaceRect.top,
                        width: surfaceRect.width,
                        height: surfaceRect.height,
                        zIndex: 2,
                        cursor: zoomCursor,
                        touchAction: zoomed ? "none" : "auto",
                        transition: anim(
                            "left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease"
                        ),
                        WebkitTapHighlightColor: "transparent",
                    }}
                />
            ) : null}

            <button
                type="button"
                onClick={() => go(-1)}
                onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setHoverSide("prev")
                }}
                onPointerLeave={() => setHoverSide(null)}
                aria-label={previousLabel}
                style={{
                    ...labelStyle,
                    ...navPosition(placement, "prev", buttonInsetX, buttonInsetY),
                    opacity: buttonOpacityFor("prev", prevDisabled),
                    pointerEvents: prevDisabled ? "none" : "auto",
                }}
            >
                {navContent("prev")}
            </button>

            {showProgress && progress === "counter" ? (
                <div
                    style={{
                        ...labelStyle,
                        cursor: "default",
                        // Not an interactive target, so the 24px floor is
                        // unnecessary here; keep it intrinsic to the text.
                        minWidth: 0,
                        minHeight: 0,
                        position: "absolute",
                        zIndex: 3,
                        // Distance from the bottom edge (Progress Inset).
                        bottom: progressInset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        // Lets a tap fall through to the zone beneath.
                        pointerEvents: "none",
                    }}
                >
                    {safeIndex + 1} / {total}
                </div>
            ) : null}

            {showProgress && isShapes ? (
                <div
                    role="tablist"
                    aria-label="Gallery position"
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        // Distance from the bottom edge (Progress Inset).
                        bottom: progressInset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: indicatorGap,
                    }}
                >
                    {slides.map((slide, i) => {
                        const active = i === safeIndex
                        return (
                            <button
                                key={`${i}-${slide.src}`}
                                type="button"
                                role="tab"
                                aria-label={`Go to image ${i + 1}`}
                                aria-selected={active}
                                onClick={() => goTo(i)}
                                style={{
                                    // 24×24 minimum hit area (WCAG 2.2 SC
                                    // 2.5.8); the visible indicator sits centred
                                    // inside at its chosen size.
                                    width: Math.max(
                                        MIN_TARGET,
                                        Number(shape.width)
                                    ),
                                    height: Math.max(
                                        MIN_TARGET,
                                        Number(shape.height)
                                    ),
                                    padding: 0,
                                    margin: 0,
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flex: "0 0 auto",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    style={{
                                        ...shape,
                                        background: indicatorColor,
                                        opacity: active ? 1 : inactiveOpacity,
                                        transition: anim(
                                            "opacity 0.2s ease, transform 0.2s ease"
                                        ),
                                        display: "block",
                                    }}
                                />
                            </button>
                        )
                    })}
                </div>
            ) : null}

            {showProgress && progress === "thumbnails" ? (
                <div
                    ref={stripRef}
                    data-gv-strip="true"
                    role="tablist"
                    aria-label="Gallery images"
                    onPointerDown={onStripPointerDown}
                    onPointerMove={onStripPointerMove}
                    onPointerUp={endStripDrag}
                    onPointerLeave={endStripDrag}
                    onPointerCancel={endStripDrag}
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        bottom: progressInset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        maxWidth: `calc(100% - ${2 * PROGRESS_EDGE_MARGIN}px)`,
                        display: "flex",
                        alignItems: "center",
                        gap: thumbnailGap,
                        overflowX: "auto",
                        overflowY: "hidden",
                        padding: 2,
                        scrollbarWidth: "none",
                        WebkitOverflowScrolling: "touch",
                        // Horizontal drag scrolls the strip; vertical drags the
                        // page. Cursor + no-select signal draggability.
                        touchAction: "pan-x",
                        cursor: "grab",
                        userSelect: "none",
                    }}
                >
                    {slides.map((slide, i) => {
                        const active = i === safeIndex
                        return (
                            <button
                                key={`${i}-${slide.src}`}
                                ref={active ? activeThumbRef : undefined}
                                type="button"
                                role="tab"
                                aria-label={`Go to image ${i + 1}`}
                                aria-selected={active}
                                onClick={() => {
                                    // Suppress the jump if this click ended a
                                    // drag rather than being a clean tap.
                                    if (stripDrag.current.moved) return
                                    goTo(i)
                                }}
                                style={{
                                    flex: "0 0 auto",
                                    padding: 0,
                                    margin: 0,
                                    border: "none",
                                    background: "none",
                                    height: thumbnailHeight,
                                    cursor: "pointer",
                                    opacity: active ? 1 : inactiveOpacity,
                                    transition: anim("opacity 0.2s ease"),
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <img
                                    src={slide.src}
                                    srcSet={slide.srcSet}
                                    alt={slide.alt}
                                    draggable={false}
                                    style={{
                                        height: "100%",
                                        width: "auto",
                                        display: "block",
                                        objectFit: "contain",
                                        pointerEvents: "none",
                                    }}
                                />
                            </button>
                        )
                    })}
                </div>
            ) : null}

            <button
                type="button"
                onClick={() => go(1)}
                onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setHoverSide("next")
                }}
                onPointerLeave={() => setHoverSide(null)}
                aria-label={nextLabel}
                style={{
                    ...labelStyle,
                    ...navPosition(placement, "next", buttonInsetX, buttonInsetY),
                    opacity: buttonOpacityFor("next", nextDisabled),
                    pointerEvents: nextDisabled ? "none" : "auto",
                }}
            >
                {navContent("next")}
            </button>
        </div>
    )
}

// Generated rather than hand-written, so the count stays in step with
// MAX_IMAGES and there are no numbering mistakes across twenty entries.
const imageControls: Record<string, any> = {}
for (let i = 1; i <= MAX_IMAGES; i++) {
    imageControls[`image${i}`] = {
        type: ControlType.ResponsiveImage,
        title: `Image ${i}`,
    }
}

const noTransition = (p: any) => p.transition === "none"
const noProgress = (p: any) => p.progress === "none"
const isShapeProgress = (p: any) =>
    p.progress === "dots" || p.progress === "squares" || p.progress === "bars"
const isThumbProgress = (p: any) => p.progress === "thumbnails"
const noZoom = (p: any) => !p.clickToZoom
// Cursor image slots appear once custom cursors are enabled; the size and
// hotspot controls appear only after at least one image has been uploaded.
const noCustomCursor = (p: any) => !p.clickToZoom || !p.customCursor
const noCursorImage = (p: any) =>
    noCustomCursor(p) || (!p.zoomInCursor && !p.zoomOutCursor)
// navStyle defaults to "chevron", so treat a missing value as non-text.
const isTextStyle = (p: any) => p.navStyle === "text"
const isImageStyle = (p: any) => p.navStyle === "image"

addPropertyControls(GalleryViewer, {
    ...imageControls,
    verticalPadding: {
        type: ControlType.Number,
        title: "Image Padding Y",
        defaultValue: 120,
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
        displayStepper: true,
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Image Padding X",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
        displayStepper: true,
    },
    navStyle: {
        type: ControlType.Enum,
        title: "Buttons",
        defaultValue: "chevron",
        options: ["text", "chevron", "image"],
        optionTitles: ["Text", "Chevron", "Custom"],
        displaySegmentedControl: true,
    },
    placement: {
        type: ControlType.Enum,
        title: "Placement",
        defaultValue: "bottomCorners",
        options: ["bottomCorners", "topCorners", "middleSides"],
        optionTitles: ["Bottom", "Top", "Sides"],
    },
    buttonInsetX: {
        type: ControlType.Number,
        title: "Button Inset X",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
        displayStepper: true,
        description: "Horizontal distance of the arrows from the frame edge.",
    },
    buttonInsetY: {
        type: ControlType.Number,
        title: "Button Inset Y",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
        displayStepper: true,
        description:
            "Vertical distance from the top/bottom edge. Applies to the Bottom and Top placements only.",
        hidden: (p: any) => p.placement === "middleSides",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 24,
        min: 8,
        max: 120,
        step: 2,
        unit: "px",
        hidden: isTextStyle,
    },
    previousImage: {
        type: ControlType.Image,
        title: "Prev Icon",
        hidden: (p: any) => !isImageStyle(p),
    },
    nextImage: {
        type: ControlType.Image,
        title: "Next Icon",
        hidden: (p: any) => !isImageStyle(p),
    },
    previousLabel: {
        type: ControlType.String,
        title: "Previous",
        defaultValue: "Previous",
        description: "Shown as text; also the accessible label for arrows.",
    },
    nextLabel: {
        type: ControlType.String,
        title: "Next",
        defaultValue: "Next",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: (p: any) => !isTextStyle(p),
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Colour",
        defaultValue: "rgb(10, 10, 10)",
    },
    buttonOpacity: {
        type: ControlType.Number,
        title: "Idle Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    buttonHoverOpacity: {
        type: ControlType.Number,
        title: "Hover Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    clickToZoom: {
        type: ControlType.Boolean,
        title: "Click Zoom",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    zoomScale: {
        type: ControlType.Number,
        title: "Zoom Scale",
        defaultValue: 2,
        min: 1.2,
        max: 4,
        step: 0.1,
        hidden: noZoom,
    },
    zoomedPaddingY: {
        type: ControlType.Number,
        title: "Zoom Padding Y",
        defaultValue: 40,
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
        displayStepper: true,
        description: "Vertical padding while zoomed in — expands the frame.",
        hidden: noZoom,
    },
    customCursor: {
        type: ControlType.Boolean,
        title: "Custom Cursor",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Default",
        description:
            "Use uploaded cursor images instead of the system zoom cursors.",
        hidden: noZoom,
    },
    zoomInCursor: {
        type: ControlType.Image,
        title: "Zoom-In Cursor",
        hidden: noCustomCursor,
    },
    zoomOutCursor: {
        type: ControlType.Image,
        title: "Zoom-Out Cursor",
        hidden: noCustomCursor,
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 32,
        min: 8,
        max: 128,
        step: 2,
        unit: "px",
        description: "On-screen size of the custom cursor images (max 128px).",
        hidden: noCursorImage,
    },
    cursorHotspotX: {
        type: ControlType.Number,
        title: "Hotspot X",
        defaultValue: 0,
        min: 0,
        max: 128,
        step: 1,
        unit: "px",
        description:
            "The point inside the cursor that clicks, measured from its top-left. Set X and Y to half the Cursor Size to centre it.",
        hidden: noCursorImage,
    },
    cursorHotspotY: {
        type: ControlType.Number,
        title: "Hotspot Y",
        defaultValue: 0,
        min: 0,
        max: 128,
        step: 1,
        unit: "px",
        hidden: noCursorImage,
    },
    progress: {
        type: ControlType.Enum,
        title: "Progress",
        defaultValue: "counter",
        options: ["none", "counter", "dots", "squares", "bars", "thumbnails"],
        optionTitles: [
            "None",
            "Counter",
            "Dots",
            "Squares",
            "Bars",
            "All Images",
        ],
    },
    progressInset: {
        type: ControlType.Number,
        title: "Progress Inset",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
        displayStepper: true,
        description: "Distance of the progress indicator from the bottom edge.",
        hidden: noProgress,
    },
    indicatorSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 6,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => !isShapeProgress(p),
    },
    indicatorGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => !isShapeProgress(p),
    },
    indicatorColor: {
        type: ControlType.Color,
        title: "Indicator",
        defaultValue: "rgb(10, 10, 10)",
        hidden: (p: any) => !isShapeProgress(p),
    },
    thumbnailHeight: {
        type: ControlType.Number,
        title: "Thumb Height",
        defaultValue: 64,
        min: 24,
        max: 240,
        step: 4,
        unit: "px",
        hidden: (p: any) => !isThumbProgress(p),
    },
    thumbnailGap: {
        type: ControlType.Number,
        title: "Thumb Gap",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => !isThumbProgress(p),
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !isShapeProgress(p) && !isThumbProgress(p),
    },
    transition: {
        type: ControlType.Enum,
        title: "Transition",
        defaultValue: "fade",
        options: ["none", "fade", "slide", "zoom", "blur"],
        optionTitles: ["None", "Fade", "Slide", "Zoom", "Blur"],
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        hidden: noTransition,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeInOut",
        options: ["linear", "easeOut", "easeInOut", "circOut", "anticipate"],
        optionTitles: [
            "Linear",
            "Ease Out",
            "Ease In Out",
            "Circ Out",
            "Anticipate",
        ],
        hidden: noTransition,
    },
    slideDistance: {
        type: ControlType.Number,
        title: "Distance",
        defaultValue: 100,
        min: 10,
        max: 100,
        step: 5,
        unit: "%",
        hidden: (p: any) => p.transition !== "slide",
    },
    zoomAmount: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 0.06,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        hidden: (p: any) => p.transition !== "zoom",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 12,
        min: 1,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.transition !== "blur",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tapZones: {
        type: ControlType.Boolean,
        title: "Tap sides",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    keyboardNavigation: {
        type: ControlType.Boolean,
        title: "Arrow keys",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
