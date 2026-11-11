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
    motion,
    useInView,
    useMotionValue,
    useTransform,
    type MotionValue,
} from "framer-motion"
import {
    Children,
    useCallback,
    useEffect,
    useId,
    useRef,
    type CSSProperties,
    type ReactNode,
} from "react"

type Anchor =
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "top-left"
    | "top-center"
    | "top-right"

interface LayoutGroup {
    imageWidth?: number
    imageHeight?: number
    gap?: number
    radius?: string
}
interface ImageGroup {
    maskFlow?: number
    scaleDrop?: number
    fade?: number
}
interface CardGroup {
    anchor?: Anchor
    offsetX?: number
    offsetY?: number
}
/** one complete set of motion values, used once for entering and once for leaving */
interface CardMotion {
    x?: number
    y?: number
    scale?: number
    rotate?: number
    blur?: number
    fadeOver?: number
}
interface PlaybackGroup {
    loop?: boolean
    snap?: boolean
    slideDuration?: number
    ease?: "smooth" | "out" | "linear"
    autoplay?: boolean
    interval?: number
    pauseOnHover?: boolean
    resumeDelay?: number
    mouseDrag?: boolean
    dragSpeed?: number
}
interface MaskGroup {
    enabled?: boolean
    left?: number
    right?: number
}
interface ArrowsGroup {
    show?: boolean
    placement?: "center" | "top" | "bottom"
    offsetX?: number
    offsetY?: number
    spacing?: number
    size?: number
    radius?: string
    color?: string
    background?: string
    backgroundBlur?: number
    previousImage?: string | { src?: string }
    nextImage?: string | { src?: string }
}
interface DotsGroup {
    show?: boolean
    offset?: number
    size?: number
    activeSize?: number
    spacing?: number
    color?: string
    activeColor?: string
}

interface MotionCarouselProps {
    images?: ReactNode
    cards?: ReactNode
    layout?: LayoutGroup
    image?: ImageGroup
    card?: CardGroup
    cardIn?: CardMotion
    cardOut?: CardMotion
    playback?: PlaybackGroup
    mask?: MaskGroup
    arrows?: ArrowsGroup
    dots?: DotsGroup
    style?: CSSProperties
}

/** shortest signed distance from the drag position to an item, wrapping when looping */
function delta(p: number, index: number, count: number, loop: boolean) {
    if (!loop || count < 2) return p - index
    const here = ((p % count) + count) % count
    let d = here - index
    if (d > count / 2) d -= count
    if (d < -count / 2) d += count
    return d
}

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v))
}

function easeWith(kind: string, t: number) {
    if (kind === "linear") return t
    if (kind === "out") return 1 - Math.pow(1 - t, 3)
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Motion Carousel
 *
 * Thank you for your purchase.
 *
 * A scroll-driven carousel built from two slots. The layers in Images scroll
 * horizontally in a snapping track. The layers in Cards ride above them, one
 * card per image, paired by index — card 1 belongs to image 1, card 2 to
 * image 2, and so on.
 *
 * Everything moves from a single value: the track's scroll position, read every
 * frame and expressed as a fractional item index. Scale, fade, parallax, card
 * entry and exit, and the dots are all pure functions of that number, so the
 * animation holds wherever you stop instead of playing on its own timeline.
 *
 * SETTING IT UP
 *
 * 1. Select the component and open the properties panel.
 * 2. Connect the layers that should scroll to the Images slot — one layer per
 *    slide. Anything works: a photo frame, a video, a whole composed layout.
 * 3. Connect the overlay layers to the Cards slot — one per slide, in the same
 *    order as the images.
 * 4. Set the slide size under Layout, then tune the movement under Image
 *    Motion, Card Position and Card In / Out, the timing under Playback, the
 *    edge fade under Mask, and the navigation under Arrows and Dots.
 *
 * Keep both lists the same length and in the same order. Arrows, dots and
 * infinite looping all switch on by themselves once there is more than one
 * slide, and the arrows and dots hide again when there is only one.
 *
 * THE SETTINGS
 *
 * - Layout ......... size of each slide, the space between them, corner radius.
 * - Image Motion ... how side slides shrink, fade and drift as they pass by.
 * - Mask ........... a soft fade on each edge of the track, set per side.
 * - Card Position .. which of six corners the card is pinned by, and its
 *                    offsets from it. Cards of different sizes keep the same
 *                    offsets and grow away from that corner.
 * - Card In ........ where a card travels from as it becomes the active one.
 * - Card Out ....... where a card travels to as it leaves.
 * - Playback ....... looping, snapping, autoplay, hover pausing and dragging.
 * - Arrows ......... previous / next buttons, their placement and styling.
 * - Dots ........... the pagination row under the track.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerDisableUnlink
 */
export default function MotionCarousel(props: MotionCarouselProps) {
    const { images, cards, style } = props
    const {
        imageWidth = 560,
        imageHeight = 560,
        gap = 32,
        radius = "18px",
    } = props.layout ?? {}
    const {
        maskFlow = 0.14,
        scaleDrop: imageScaleDrop = 0.16,
        fade: imageFade = 0.78,
    } = props.image ?? {}
    const {
        anchor: cardAnchor = "bottom-left",
        offsetX: cardOffsetX = -72,
        offsetY: cardOffsetY = 56,
    } = props.card ?? {}
    const {
        x: inX = 0,
        y: inY = 120,
        scale: inScale = 0,
        rotate: inRotate = 0,
        blur: inBlur = 0,
        fadeOver: inFade = 0.75,
    } = props.cardIn ?? {}
    const {
        x: outX = 0,
        y: outY = -90,
        scale: outScale = 0.92,
        rotate: outRotate = 0,
        blur: outBlur = 0,
        fadeOver: outFade = 0.75,
    } = props.cardOut ?? {}
    const {
        loop = true,
        snap = true,
        slideDuration = 0.6,
        ease = "smooth",
        autoplay = true,
        interval = 4,
        pauseOnHover = true,
        resumeDelay = 2.5,
        mouseDrag = true,
        dragSpeed = 1,
    } = props.playback ?? {}
    const {
        enabled: maskEnabled = false,
        left: maskLeft = 12,
        right: maskRight = 12,
    } = props.mask ?? {}
    const {
        show: showArrows = true,
        placement: arrowPlacement = "center",
        offsetX: arrowOffsetX = 16,
        offsetY: arrowOffsetY = 0,
        spacing: arrowSpacing = 12,
        size: arrowSize = 44,
        radius: arrowRadius = "50%",
        color: arrowColor = "rgba(255, 255, 255, 0.95)",
        background: arrowBackground = "rgba(0, 0, 0, 0.35)",
        backgroundBlur: arrowBlur = 8,
        previousImage: arrowPrevImage,
        nextImage: arrowNextImage,
    } = props.arrows ?? {}
    const {
        show: showDots = true,
        offset: dotsGap = 24,
        size: dotSize = 6,
        activeSize: dotActiveSize = 9,
        spacing: dotGap = 8,
        color: dotColor = "rgba(0, 0, 0, 0.18)",
        activeColor: dotActiveColor = "rgba(0, 0, 0, 0.75)",
    } = props.dots ?? {}

    const isStatic = useIsStaticRenderer()
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const rootRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.15 })

    const imageList = Children.toArray(images)
    const cardList = Children.toArray(cards)
    const count = Math.max(imageList.length, cardList.length)

    /** the one value everything reads from: a fractional item index */
    const progress = useMotionValue(0)
    const step = imageWidth + gap

    /**
     * Looping renders five copies of the track and quietly recentres on the
     * middle one. Five rather than three leaves two full sets of runway in
     * each direction, so the recentre can wait until the scroll has actually
     * settled and never has to interrupt a scroll that is still moving.
     */
    const canLoop = loop && count > 1 && !isStatic
    const copies = canLoop ? 5 : 1
    const setWidth = count * step
    const home = setWidth * 2

    const drag = useRef({ active: false, startX: 0, startScroll: 0 })
    /**
     * A pointer that landed on the card overlay. It is watched but not acted on
     * until it has clearly travelled sideways, so a tap on something inside the
     * card stays a tap.
     */
    const cardPointer = useRef({
        id: -1,
        startX: 0,
        startY: 0,
        startScroll: 0,
        watching: false,
    })
    const anim = useRef({ active: false, from: 0, to: 0, start: 0, dur: 600 })

    /**
     * Framer renders slide images as real <img> elements, and an <img> is
     * draggable by default: pressing one hands the gesture to the browser's own
     * drag-and-drop, which shows a ghost of the picture and never lets the
     * carousel see the drag.
     *
     * CSS alone is not enough. "-webkit-user-drag" is ignored by Firefox, and a
     * React onDragStart only sees events that bubble, which a nested handler can
     * stop first. The draggable attribute is what every browser honours, so it
     * is written straight onto whatever the slots contain — and again whenever
     * that content changes, since these layers are the user's own and can be
     * swapped at any time. The capture-phase listener is the backstop.
     */
    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const disarm = () => {
            const nodes = root.querySelectorAll("img, a, picture, video")
            nodes.forEach((node) => node.setAttribute("draggable", "false"))
        }
        disarm()
        const observer = new MutationObserver(disarm)
        observer.observe(root, { childList: true, subtree: true })
        const block = (event: Event) => event.preventDefault()
        root.addEventListener("dragstart", block, true)
        return () => {
            observer.disconnect()
            root.removeEventListener("dragstart", block, true)
        }
    }, [])

    /** start in the middle copy */
    useEffect(() => {
        if (!canLoop) return
        const el = viewportRef.current
        if (!el) return
        el.scrollLeft = home
    }, [canLoop, home])

    /** snap fights a JS-driven scroll, so it is switched off while one runs */
    const setSnap = useCallback(
        (on: boolean) => {
            const el = viewportRef.current
            if (!el) return
            el.style.scrollSnapType = on && snap ? "x mandatory" : "none"
        },
        [snap]
    )

    const glideTo = useCallback(
        (targetScroll: number) => {
            const el = viewportRef.current
            if (!el) return
            setSnap(false)
            anim.current = {
                active: true,
                from: el.scrollLeft,
                to: targetScroll,
                start:
                    typeof performance !== "undefined"
                        ? performance.now()
                        : Date.now(),
                dur: Math.max(60, slideDuration * 1000),
            }
        },
        [slideDuration, setSnap]
    )

    const stopGlide = useCallback(() => {
        if (!anim.current.active) return
        anim.current.active = false
        setSnap(true)
    }, [setSnap])

    /**
     * One read loop. It never runs on the canvas, so editing the component can
     * never be blocked by it. It only writes scrollLeft in two cases: while a
     * slide tween is running with snap switched off, and to recentre once
     * everything has come to a complete stop.
     */
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !inView) return
        let frame = 0
        let last = -1
        /**
         * Touch scrolling coasts. A momentum fling can report the same position
         * for a single frame without having actually stopped, and recentring
         * mid-fling kills the momentum with a visible jump. So a settle only
         * counts once the position has held still for a few frames running.
         */
        let stillFrames = 0
        function read() {
            const node = viewportRef.current
            if (node && step > 0) {
                if (anim.current.active) {
                    const now =
                        typeof performance !== "undefined"
                            ? performance.now()
                            : Date.now()
                    const t = clamp(
                        (now - anim.current.start) / anim.current.dur,
                        0,
                        1
                    )
                    const e = easeWith(ease, t)
                    node.scrollLeft =
                        anim.current.from +
                        (anim.current.to - anim.current.from) * e
                    if (t >= 1) {
                        anim.current.active = false
                        node.style.scrollSnapType = snap
                            ? "x mandatory"
                            : "none"
                    }
                }

                const sl = node.scrollLeft
                const resting =
                    sl === last && !drag.current.active && !anim.current.active
                stillFrames = resting ? stillFrames + 1 : 0
                if (canLoop && stillFrames >= 3 && setWidth > 0) {
                    if (sl >= home + setWidth) node.scrollLeft = sl - setWidth
                    else if (sl < home) node.scrollLeft = sl + setWidth
                }
                last = node.scrollLeft
                progress.set(node.scrollLeft / step)
            }
            frame = requestAnimationFrame(read)
        }
        frame = requestAnimationFrame(read)
        return () => cancelAnimationFrame(frame)
    }, [isStatic, inView, step, progress, canLoop, setWidth, home, snap, ease])

    /** autoplay, held off while the reader is touching it */
    const heldUntil = useRef(0)
    const hovering = useRef(false)

    /**
     * Hovering is a mouse-only idea. Touch browsers synthesise an enter on tap
     * and often never send the matching leave, which would leave Pause Hover
     * holding autoplay off for good after a reader's first tap.
     */
    const onPointerEnter = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.pointerType !== "mouse") return
            hovering.current = true
        },
        []
    )
    const onPointerLeave = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.pointerType !== "mouse") return
            hovering.current = false
        },
        []
    )

    const hold = useCallback(() => {
        heldUntil.current = Date.now() + resumeDelay * 1000
    }, [resumeDelay])

    useEffect(() => {
        if (isStatic || !autoplay || !inView || count < 2) return
        if (typeof window === "undefined") return
        const id = window.setInterval(
            () => {
                if (Date.now() < heldUntil.current) return
                if (pauseOnHover && hovering.current) return
                const el = viewportRef.current
                if (!el || step <= 0) return
                const current = Math.round(el.scrollLeft / step)
                const next = canLoop || current + 1 < count ? current + 1 : 0
                glideTo(next * step)
            },
            Math.max(0.5, interval) * 1000
        )
        return () => window.clearInterval(id)
    }, [
        isStatic,
        autoplay,
        inView,
        count,
        interval,
        pauseOnHover,
        step,
        canLoop,
        glideTo,
    ])

    /** mouse click-and-drag; trackpad and touch scroll the container natively */
    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            hold()
            stopGlide()
            if (!mouseDrag || event.pointerType !== "mouse") return
            const el = viewportRef.current
            if (!el) return
            drag.current = {
                active: true,
                startX: event.clientX,
                startScroll: el.scrollLeft,
            }
            el.setPointerCapture(event.pointerId)
        },
        [mouseDrag, hold, stopGlide]
    )

    const onPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!drag.current.active) return
            const el = viewportRef.current
            if (!el) return
            event.preventDefault()
            hold()
            const dx = (event.clientX - drag.current.startX) * dragSpeed
            el.scrollLeft = drag.current.startScroll - dx
        },
        [dragSpeed, hold]
    )

    const endDrag = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            hold()
            if (!drag.current.active) return
            drag.current.active = false
            const el = viewportRef.current
            if (el && el.hasPointerCapture(event.pointerId))
                el.releasePointerCapture(event.pointerId)
        },
        [hold]
    )

    /**
     * The cards sit in their own layer above the track, so a gesture that
     * starts on a card never reaches the scroller underneath and the carousel
     * felt stuck there. These three handlers forward such a gesture to the
     * track by hand.
     *
     * Nothing is captured on pointer down and nothing is prevented, so a click
     * on a button inside a card behaves exactly as it would anywhere else. Only
     * once the pointer has moved more than a few pixels, and more sideways than
     * down, is it treated as a drag — at which point the pointer is captured,
     * which cancels the pending click the way a drag should.
     */
    const onCardPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            hold()
            stopGlide()
            if (event.pointerType === "mouse" && !mouseDrag) return
            const el = viewportRef.current
            if (!el) return
            cardPointer.current = {
                id: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startScroll: el.scrollLeft,
                watching: true,
            }
        },
        [hold, stopGlide, mouseDrag]
    )

    const onCardPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const pointer = cardPointer.current
            if (!pointer.watching || event.pointerId !== pointer.id) return
            const el = viewportRef.current
            if (!el) return
            const dx = event.clientX - pointer.startX
            const dy = event.clientY - pointer.startY
            if (!drag.current.active) {
                if (Math.abs(dx) < 6 || Math.abs(dx) <= Math.abs(dy)) return
                drag.current = {
                    active: true,
                    startX: pointer.startX,
                    startScroll: pointer.startScroll,
                }
                event.currentTarget.setPointerCapture(event.pointerId)
            }
            hold()
            el.scrollLeft = pointer.startScroll - dx * dragSpeed
        },
        [hold, dragSpeed]
    )

    const endCardDrag = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const pointer = cardPointer.current
            if (event.pointerId === pointer.id) {
                pointer.watching = false
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId)
            }
            drag.current.active = false
            hold()
        },
        [hold]
    )

    const onUserScroll = useCallback(() => {
        hold()
        stopGlide()
    }, [hold, stopGlide])

    const goTo = useCallback(
        (i: number) => {
            hold()
            const el = viewportRef.current
            if (!el || step <= 0) return
            let target = i
            if (canLoop) {
                const here = el.scrollLeft / step
                target = i + count * Math.round((here - i) / count)
            }
            glideTo(target * step)
        },
        [step, hold, canLoop, count, glideTo]
    )

    /** one slide forward or back from wherever the track currently sits */
    const stepBy = useCallback(
        (direction: number) => {
            hold()
            const el = viewportRef.current
            if (!el || step <= 0) return
            const current = Math.round(el.scrollLeft / step)
            const next = current + direction
            glideTo((canLoop ? next : clamp(next, 0, count - 1)) * step)
        },
        [step, hold, canLoop, count, glideTo]
    )

    /**
     * A soft fade on each edge of the track, so slides dissolve on their way
     * out instead of being cut off by the viewport. Each side is set on its own
     * and the stops are ordered before use, so the two can never cross over and
     * invert the gradient.
     */
    const maskStart = clamp(maskLeft, 0, 50)
    const maskEnd = clamp(100 - maskRight, maskStart, 100)
    const maskImage = maskEnabled
        ? `linear-gradient(to right, transparent 0%, black ${maskStart}%, black ${maskEnd}%, transparent 100%)`
        : undefined

    const edge = `calc(50% - ${imageWidth / 2}px)`

    /** anchor the card overlay to the centre image, allowing it to overhang */
    /**
     * The offsets pin the card by its own corner, not by the box around the
     * stack.
     *
     * Every card shares one grid cell, and that cell is as tall and as wide as
     * the largest card in the set. Pinning only the cell would leave a short
     * card floating away from the chosen corner, and changing a card's size
     * would move it. Aligning the items inside the cell to the same corner the
     * cell is pinned to fixes that corner for every card: a tall card and a
     * short one both start at exactly (offsetX, offsetY) and grow away from it,
     * in whichever directions are left.
     */
    const [anchorY, anchorX] = cardAnchor.split("-") as [
        "top" | "bottom",
        "left" | "center" | "right",
    ]
    const anchorStyle: CSSProperties = {
        position: "absolute",
        display: "grid",
        alignItems: anchorY === "top" ? "start" : "end",
        justifyItems:
            anchorX === "left"
                ? "start"
                : anchorX === "right"
                  ? "end"
                  : "center",
        ...(anchorY === "top" ? { top: cardOffsetY } : { bottom: cardOffsetY }),
    }
    if (anchorX === "left") {
        anchorStyle.left = `calc(50% - ${imageWidth / 2}px + ${cardOffsetX}px)`
    } else if (anchorX === "right") {
        anchorStyle.right = `calc(50% - ${imageWidth / 2}px + ${cardOffsetX}px)`
    } else {
        anchorStyle.left = "50%"
        anchorStyle.transform = `translateX(calc(-50% + ${cardOffsetX}px))`
    }

    /**
     * Arrows sit inside the track box, so "centre" lines them up with the
     * middle image rather than the whole component. Both offsets apply in every
     * placement: on the sides they inset the pair from the image edges, grouped
     * they move the pair as one.
     */
    const arrowInset = `calc(50% - ${imageWidth / 2}px + ${arrowOffsetX}px)`
    const sideArrow: CSSProperties = {
        position: "absolute",
        top: `calc(50% + ${arrowOffsetY}px)`,
        transform: "translateY(-50%)",
        zIndex: 2,
    }
    const groupedArrows: CSSProperties = {
        position: "absolute",
        left: "50%",
        transform: `translateX(calc(-50% + ${arrowOffsetX}px))`,
        display: "flex",
        alignItems: "center",
        gap: arrowSpacing,
        zIndex: 2,
        ...(arrowPlacement === "top"
            ? { top: arrowOffsetY }
            : { bottom: arrowOffsetY }),
    }
    const arrowLook = {
        size: arrowSize,
        radius: arrowRadius,
        color: arrowColor,
        background: arrowBackground,
        blur: arrowBlur,
    }

    /**
     * Nothing is connected yet, so the component explains itself instead of
     * rendering an empty strip. This panel disappears the moment a single
     * layer lands in either slot.
     */
    if (count === 0) {
        return (
            <div style={{ ...style, position: "relative", minHeight: 260 }}>
                <div style={onboardingSheet}>
                    <div style={onboardingHeader}>
                        <div style={onboardingTitle}>Motion Carousel</div>
                        <div style={onboardingThanks}>
                            Thank you for your purchase — two connections and
                            this is running.
                        </div>
                    </div>

                    <ol style={onboardingList}>
                        <Step
                            n="1"
                            title="Connect the Images slot"
                            body="In the properties panel, click Images and pick the layers that should scroll. One layer per slide — a photo, a video, or a whole composed layout."
                        />
                        <Step
                            n="2"
                            title="Connect the Cards slot"
                            body="Click Cards and pick the overlay layers, in the same order. Card 1 belongs to image 1, card 2 to image 2. Keep both lists the same length."
                        />
                        <Step
                            n="3"
                            title="Size it, then tune it"
                            body="Set the slide size under Layout. Shape the movement under Image Motion, Card Position and Card In / Out, the timing under Playback, and the navigation under Arrows and Dots."
                        />
                    </ol>

                    <div style={onboardingFooter}>
                        Arrows, dots and infinite looping switch on by
                        themselves once there is more than one slide.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: dotsGap,
                overflow: "visible",
            }}
        >
            <style>{`
                .dcv-${uid}{scrollbar-width:none;-ms-overflow-style:none}
                .dcv-${uid}::-webkit-scrollbar{display:none}
                .dcf-${uid}>*{width:100%!important;height:100%!important;flex:none!important}
                /*
                 * A press on a picture or a link starts the browser's own
                 * drag-and-drop, which swallows the gesture and leaves a ghost
                 * image trailing the cursor instead of moving the carousel.
                 * Turning that off across the track and the card layer, along
                 * with text selection, leaves every press to the carousel.
                 */
                .dcv-${uid},.dca-${uid}{-webkit-user-select:none;user-select:none}
                .dcv-${uid} img,.dca-${uid} img,
                .dcv-${uid} a,.dca-${uid} a,
                .dcv-${uid} picture,.dca-${uid} picture{
                    -webkit-user-drag:none;user-drag:none
                }
            `}</style>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: imageHeight,
                }}
            >
                <div
                    ref={viewportRef}
                    className={`dcv-${uid}`}
                    onDragStart={(event) => event.preventDefault()}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onWheel={onUserScroll}
                    onTouchStart={onUserScroll}
                    style={{
                        position: "relative",
                        display: "flex",
                        gap,
                        width: "100%",
                        height: "100%",
                        overflowX: isStatic ? "hidden" : "auto",
                        overflowY: "hidden",
                        maskImage,
                        WebkitMaskImage: maskImage,
                        paddingLeft: edge,
                        paddingRight: edge,
                        scrollSnapType:
                            snap && !isStatic ? "x mandatory" : "none",
                        /**
                         * The track moves by native horizontal scrolling, so
                         * horizontal panning has to be permitted here. "pan-y"
                         * alone told the browser to ignore sideways swipes on
                         * this element, which is why touch did nothing on
                         * phones and tablets. Naming both axes lets the browser
                         * lock to whichever one the gesture starts in, so a
                         * vertical swipe still scrolls the page past the
                         * carousel instead of being trapped by it.
                         */
                        touchAction: "pan-x pan-y pinch-zoom",
                        overscrollBehaviorX: "contain",
                        cursor: mouseDrag ? "grab" : "default",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    {Array.from({ length: copies }).flatMap((_, copy) =>
                        imageList.map((node, i) => (
                            <Cell
                                key={`img-${copy}-${i}`}
                                index={copy * count + i}
                                progress={progress}
                                width={imageWidth}
                                height={imageHeight}
                                radius={radius}
                                maskFlow={maskFlow}
                                scaleDrop={imageScaleDrop}
                                fade={imageFade}
                                snap={snap}
                                fillClass={`dcf-${uid}`}
                            >
                                {node}
                            </Cell>
                        ))
                    )}
                </div>

                <div
                    className={`dca-${uid}`}
                    onDragStart={(event) => event.preventDefault()}
                    style={{
                        ...anchorStyle,
                        /** the browser must not claim sideways gestures here */
                        touchAction: "pan-y",
                        /** otherwise a drag across a card selects its text */
                        userSelect: "none",
                        cursor: mouseDrag ? "grab" : "default",
                    }}
                    onPointerDown={onCardPointerDown}
                    onPointerMove={onCardPointerMove}
                    onPointerUp={endCardDrag}
                    onPointerCancel={endCardDrag}
                >
                    {cardList.map((node, i) => (
                        <CardLayer
                            key={`card-${i}`}
                            index={i}
                            progress={progress}
                            enter={{
                                x: inX,
                                y: inY,
                                scale: inScale,
                                rotate: inRotate,
                                blur: inBlur,
                                fadeOver: inFade,
                            }}
                            exit={{
                                x: outX,
                                y: outY,
                                scale: outScale,
                                rotate: outRotate,
                                blur: outBlur,
                                fadeOver: outFade,
                            }}
                            count={count}
                            loop={canLoop}
                        >
                            {node}
                        </CardLayer>
                    ))}
                </div>

                {showArrows &&
                    count > 1 &&
                    (arrowPlacement === "center" ? (
                        <>
                            <Arrow
                                {...arrowLook}
                                direction="previous"
                                image={imageSrc(arrowPrevImage)}
                                onPress={() => stepBy(-1)}
                                style={{ ...sideArrow, left: arrowInset }}
                            />
                            <Arrow
                                {...arrowLook}
                                direction="next"
                                image={imageSrc(arrowNextImage)}
                                onPress={() => stepBy(1)}
                                style={{ ...sideArrow, right: arrowInset }}
                            />
                        </>
                    ) : (
                        <div style={groupedArrows}>
                            <Arrow
                                {...arrowLook}
                                direction="previous"
                                image={imageSrc(arrowPrevImage)}
                                onPress={() => stepBy(-1)}
                            />
                            <Arrow
                                {...arrowLook}
                                direction="next"
                                image={imageSrc(arrowNextImage)}
                                onPress={() => stepBy(1)}
                            />
                        </div>
                    ))}
            </div>

            {showDots && count > 1 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: dotGap,
                    }}
                >
                    {Array.from({ length: count }).map((_, i) => (
                        <Dot
                            key={`dot-${i}`}
                            index={i}
                            progress={progress}
                            size={dotSize}
                            activeSize={dotActiveSize}
                            color={dotColor}
                            activeColor={dotActiveColor}
                            onSelect={goTo}
                            count={count}
                            loop={canLoop}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface CellProps {
    index: number
    progress: MotionValue<number>
    width: number
    height: number
    radius: string
    maskFlow: number
    scaleDrop: number
    fade: number
    snap: boolean
    fillClass: string
    children: ReactNode
}

function Cell(props: CellProps) {
    const {
        index,
        progress,
        width,
        height,
        radius,
        maskFlow,
        scaleDrop,
        fade,
        snap,
        fillClass,
        children,
    } = props

    const d = useTransform(progress, (p: number) => clamp(index - p, -1.8, 1.8))
    const innerX = useTransform(d, (v: number) => v * maskFlow * width)
    const scale = useTransform(d, (v: number) =>
        Math.max(0.2, 1 - Math.min(Math.abs(v), 1) * scaleDrop)
    )
    const opacity = useTransform(d, (v: number) =>
        Math.max(0, 1 - Math.min(Math.abs(v), 1) * fade)
    )

    return (
        <motion.div
            style={{
                position: "relative",
                flex: "none",
                width,
                height,
                borderRadius: radius,
                overflow: "hidden",
                scrollSnapAlign: snap ? "center" : "none",
                scrollSnapStop: "always",
                scale,
                opacity,
                willChange: "transform, opacity",
            }}
        >
            <motion.div
                className={fillClass}
                style={{
                    position: "absolute",
                    top: 0,
                    left: -maskFlow * width,
                    width: width * (1 + maskFlow * 2),
                    height,
                    x: innerX,
                    willChange: "transform",
                }}
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

interface Motion {
    x: number
    y: number
    scale: number
    rotate: number
    blur: number
    fadeOver: number
}

interface CardLayerProps {
    index: number
    progress: MotionValue<number>
    enter: Motion
    exit: Motion
    count: number
    loop: boolean
    children: ReactNode
}

function CardLayer(props: CardLayerProps) {
    const { index, progress, enter, exit, count, loop, children } = props

    /** signed distance from this card. negative is still coming, positive has left */
    const d = useTransform(progress, (p: number) =>
        delta(p, index, count, loop)
    )

    /** every property picks the entering or the leaving set from the sign of d */
    const side = (v: number) => (v > 0 ? exit : enter)
    const k = (v: number) => clamp(Math.abs(v), 0, 1)

    const x = useTransform(d, (v: number) => k(v) * side(v).x)
    const y = useTransform(d, (v: number) => k(v) * side(v).y)
    const scale = useTransform(d, (v: number) => 1 + k(v) * (side(v).scale - 1))
    const rotate = useTransform(d, (v: number) => k(v) * side(v).rotate)
    const opacity = useTransform(d, (v: number) =>
        clamp(1 - Math.abs(v) / Math.max(0.05, side(v).fadeOver), 0, 1)
    )
    const filter = useTransform(d, (v: number) => {
        const b = k(v) * side(v).blur
        return b > 0.01 ? `blur(${b}px)` : "none"
    })
    /**
     * Only the card at the centre answers to the pointer; the ones stacked
     * behind it stay out of the way. Typed as the CSS property itself rather
     * than a bare string, so only real CSS values can reach the style.
     */
    const pointerEvents = useTransform<number, CSSProperties["pointerEvents"]>(
        d,
        (v: number) => (Math.abs(v) < 0.5 ? "auto" : "none")
    )

    return (
        <motion.div
            style={{
                gridArea: "1 / 1",
                x,
                y,
                scale,
                rotate,
                opacity,
                filter,
                pointerEvents,
                willChange: "transform, opacity",
            }}
        >
            {children}
        </motion.div>
    )
}

interface DotProps {
    index: number
    progress: MotionValue<number>
    size: number
    activeSize: number
    color: string
    activeColor: string
    onSelect: (i: number) => void
    count: number
    loop: boolean
}

/** an Image control hands back either a plain URL or a responsive object */
function imageSrc(value?: string | { src?: string }) {
    if (!value) return ""
    return typeof value === "string" ? value : (value.src ?? "")
}

function Chevron(props: {
    direction: "previous" | "next"
    color: string
    size: number
}) {
    const { direction, color, size } = props
    const glyph = Math.max(10, Math.round(size * 0.36))
    return (
        <svg
            width={glyph}
            height={glyph}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
        >
            <polyline
                points={
                    direction === "previous"
                        ? "15 18 9 12 15 6"
                        : "9 18 15 12 9 6"
                }
            />
        </svg>
    )
}

/**
 * One arrow button. A custom image replaces the drawn chevron but keeps the
 * button's background and blur, so an uploaded glyph can sit on the same pill
 * or be shown bare by setting the background to transparent.
 */
function Arrow(props: {
    direction: "previous" | "next"
    size: number
    radius: string
    color: string
    background: string
    blur: number
    image: string
    onPress: () => void
    style?: CSSProperties
}) {
    const {
        direction,
        size,
        radius,
        color,
        background,
        blur,
        image,
        onPress,
        style,
    } = props
    const blurCss = blur > 0 ? `blur(${blur}px)` : undefined
    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={
                direction === "previous" ? "Previous slide" : "Next slide"
            }
            onClick={onPress}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onPress()
                }
            }}
            style={{
                ...style,
                flex: "none",
                width: size,
                height: size,
                borderRadius: radius,
                background,
                backdropFilter: blurCss,
                WebkitBackdropFilter: blurCss,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                overflow: "hidden",
            }}
        >
            {image ? (
                <img
                    src={image}
                    alt=""
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        pointerEvents: "none",
                    }}
                />
            ) : (
                <Chevron direction={direction} color={color} size={size} />
            )}
        </div>
    )
}

function Dot(props: DotProps) {
    const {
        index,
        progress,
        size,
        activeSize,
        color,
        activeColor,
        onSelect,
        count,
        loop,
    } = props
    const t = useTransform(progress, (p: number) =>
        clamp(1 - Math.abs(delta(p, index, count, loop)), 0, 1)
    )
    const dim = useTransform(t, (v: number) => size + (activeSize - size) * v)
    const background = useTransform(t, [0, 1], [color, activeColor])

    return (
        <motion.div
            role="button"
            aria-label={`Go to item ${index + 1}`}
            tabIndex={0}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(index)
            }}
            style={{
                width: dim,
                height: dim,
                borderRadius: "50%",
                background,
                cursor: "pointer",
                flex: "none",
            }}
        />
    )
}

/* ---------------------------------------------------------------- *
 * Onboarding panel — shown only while both slots are empty
 * ---------------------------------------------------------------- */

const onboardingSheet: CSSProperties = {
    width: "100%",
    height: "100%",
    minHeight: 260,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 18,
    padding: 28,
    border: "1px dashed #D2D2D6",
    borderRadius: 12,
    background: "#FBFBFC",
    fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
}

const onboardingHeader: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
}

const onboardingTitle: CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: "#111114",
    letterSpacing: "-0.01em",
}

const onboardingThanks: CSSProperties = {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.5,
    color: "#6E6E76",
}

const onboardingList: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    margin: 0,
    padding: 0,
    listStyle: "none",
}

const onboardingFooter: CSSProperties = {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#8E8E96",
}

const stepRow: CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
}

const stepBadge: CSSProperties = {
    flex: "none",
    width: 18,
    height: 18,
    borderRadius: 9,
    background: "#111114",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const stepTitle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#111114",
    marginBottom: 2,
}

const stepBody: CSSProperties = {
    fontSize: 11,
    lineHeight: 1.55,
    color: "#6E6E76",
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
    return (
        <li style={stepRow}>
            <div style={stepBadge}>{n}</div>
            <div>
                <div style={stepTitle}>{title}</div>
                <div style={stepBody}>{body}</div>
            </div>
        </li>
    )
}

addPropertyControls(MotionCarousel, {
    images: { type: ControlType.Slot, title: "Images" },
    cards: { type: ControlType.Slot, title: "Cards" },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            imageWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 560,
                min: 80,
                max: 1600,
                step: 10,
                unit: "px",
            },
            imageHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 560,
                min: 80,
                max: 1600,
                step: 10,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 32,
                min: 0,
                max: 300,
                step: 2,
                unit: "px",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "18px",
            },
        },
    },

    image: {
        type: ControlType.Object,
        title: "Image Motion",
        icon: "effect",
        controls: {
            maskFlow: {
                type: ControlType.Number,
                title: "Mask Flow",
                defaultValue: 0.14,
                min: 0,
                max: 0.5,
                step: 0.01,
                description: "Drift of the picture inside its frame.",
            },
            scaleDrop: {
                type: ControlType.Number,
                title: "Side Scale",
                defaultValue: 0.16,
                min: 0,
                max: 0.6,
                step: 0.01,
            },
            fade: {
                type: ControlType.Number,
                title: "Side Fade",
                defaultValue: 0.78,
                min: 0,
                max: 1,
                step: 0.02,
            },
        },
    },

    mask: {
        type: ControlType.Object,
        title: "Mask",
        icon: "effect",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Mask",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: false,
                description:
                    "Fades the track out at its edges so slides dissolve on the way out instead of being cut off.",
            },
            left: {
                type: ControlType.Number,
                title: "Left",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                hidden: (props: MaskGroup) => !props.enabled,
            },
            right: {
                type: ControlType.Number,
                title: "Right",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                hidden: (props: MaskGroup) => !props.enabled,
            },
        },
    },

    card: {
        type: ControlType.Object,
        title: "Card Position",
        icon: "object",
        controls: {
            anchor: {
                type: ControlType.Enum,
                title: "Anchor",
                options: [
                    "bottom-left",
                    "bottom-center",
                    "bottom-right",
                    "top-left",
                    "top-center",
                    "top-right",
                ],
                optionTitles: [
                    "Bottom Left",
                    "Bottom Center",
                    "Bottom Right",
                    "Top Left",
                    "Top Center",
                    "Top Right",
                ],
                defaultValue: "bottom-left",
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: -72,
                min: -400,
                max: 400,
                step: 2,
                unit: "px",
                description:
                    "Negative hangs it off the edge of the image. The card is pinned by this corner, so it keeps these offsets at any size and grows the other way.",
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 56,
                min: -400,
                max: 400,
                step: 2,
                unit: "px",
            },
        },
    },

    cardIn: {
        type: ControlType.Object,
        title: "Card In",
        icon: "effect",
        controls: {
            y: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 120,
                min: -600,
                max: 600,
                step: 4,
                unit: "px",
                description:
                    "Where the incoming card starts. Positive is below.",
            },
            x: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 0,
                min: -600,
                max: 600,
                step: 4,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0,
                min: 0,
                max: 2,
                step: 0.01,
                description: "Scale at full distance. Reaches 1 at centre.",
            },
            rotate: {
                type: ControlType.Number,
                title: "Rotate",
                defaultValue: 0,
                min: -180,
                max: 180,
                step: 1,
                unit: "deg",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 0,
                min: 0,
                max: 30,
                step: 0.5,
                unit: "px",
            },
            fadeOver: {
                type: ControlType.Number,
                title: "Fade Over",
                defaultValue: 0.75,
                min: 0.2,
                max: 2,
                step: 0.05,
                description: "Items of distance before fully transparent.",
            },
        },
    },

    cardOut: {
        type: ControlType.Object,
        title: "Card Out",
        icon: "effect",
        controls: {
            y: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: -90,
                min: -600,
                max: 600,
                step: 4,
                unit: "px",
                description:
                    "Where the leaving card ends up. Negative is above.",
            },
            x: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 0,
                min: -600,
                max: 600,
                step: 4,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0.92,
                min: 0,
                max: 2,
                step: 0.01,
                description: "Scale at full distance. Reaches 1 at centre.",
            },
            rotate: {
                type: ControlType.Number,
                title: "Rotate",
                defaultValue: 0,
                min: -180,
                max: 180,
                step: 1,
                unit: "deg",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 0,
                min: 0,
                max: 30,
                step: 0.5,
                unit: "px",
            },
            fadeOver: {
                type: ControlType.Number,
                title: "Fade Over",
                defaultValue: 0.75,
                min: 0.2,
                max: 2,
                step: 0.05,
                description: "Items of distance before fully transparent.",
            },
        },
    },

    playback: {
        type: ControlType.Object,
        title: "Playback",
        icon: "interaction",
        controls: {
            loop: {
                type: ControlType.Boolean,
                title: "Infinite",
                defaultValue: true,
                description:
                    "Runs past the last item back to the first, both ways.",
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                defaultValue: true,
            },
            slideDuration: {
                type: ControlType.Number,
                title: "Slide Time",
                defaultValue: 0.6,
                min: 0.1,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            ease: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["smooth", "out", "linear"],
                optionTitles: ["Smooth", "Ease Out", "Linear"],
                defaultValue: "smooth",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            interval: {
                type: ControlType.Number,
                title: "Every",
                defaultValue: 4,
                min: 0.5,
                max: 20,
                step: 0.5,
                unit: "s",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
            },
            resumeDelay: {
                type: ControlType.Number,
                title: "Resume After",
                defaultValue: 2.5,
                min: 0,
                max: 15,
                step: 0.5,
                unit: "s",
            },
            mouseDrag: {
                type: ControlType.Boolean,
                title: "Mouse Drag",
                defaultValue: true,
            },
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag Speed",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
        },
    },

    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        icon: "object",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            placement: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["center", "top", "bottom"],
                optionTitles: ["Sides", "Top", "Bottom"],
                defaultValue: "center",
                description:
                    "Sides puts one arrow at each edge of the centre image. Top and Bottom group the pair together.",
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 16,
                min: -400,
                max: 400,
                step: 2,
                unit: "px",
                description:
                    "On the sides this insets both arrows from the image edges. Grouped, it slides the pair sideways.",
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 0,
                min: -400,
                max: 400,
                step: 2,
                unit: "px",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 12,
                min: 0,
                max: 200,
                step: 2,
                unit: "px",
                description:
                    "Gap between the two arrows when they sit together.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 44,
                min: 20,
                max: 140,
                step: 2,
                unit: "px",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "50%",
            },
            color: {
                type: ControlType.Color,
                title: "Arrow",
                defaultValue: "rgba(255, 255, 255, 0.95)",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0.35)",
            },
            backgroundBlur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 8,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            previousImage: {
                type: ControlType.Image,
                title: "Previous",
                description:
                    "Optional. Replaces the drawn chevron. The background and blur still apply behind it.",
            },
            nextImage: {
                type: ControlType.Image,
                title: "Next",
            },
        },
    },

    dots: {
        type: ControlType.Object,
        title: "Dots",
        icon: "object",
        description:
            "Component built by [Ekjot Singh](https://www.framer.com/%40ekjot-singh/) in [Framer](https://framer.link/ekjot-singh)",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            offset: {
                type: ControlType.Number,
                title: "Distance",
                defaultValue: 24,
                min: 0,
                max: 120,
                step: 2,
                unit: "px",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 6,
                min: 2,
                max: 30,
                step: 1,
                unit: "px",
            },
            activeSize: {
                type: ControlType.Number,
                title: "Active Size",
                defaultValue: 9,
                min: 2,
                max: 40,
                step: 1,
                unit: "px",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 8,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0, 0, 0, 0.18)",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "rgba(0, 0, 0, 0.75)",
            },
        },
    },
})

MotionCarousel.displayName = "Motion Carousel"
