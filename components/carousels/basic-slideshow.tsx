import {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
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


interface ResponsiveImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface SlideItem {
    image?: ResponsiveImageValue
}

interface BorderValue {
    borderColor?: string
    borderStyle?: "solid" | "dashed" | "dotted" | "double"
    borderWidth?: number
    borderTopWidth?: number
    borderLeftWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
}

interface PaginationSettings {
    enabled: boolean
    activeColor: string
    inactiveColor: string
    background: string
    border: BorderValue
    padding: string
    offset: number
    dotSize: number
    dotGap: number
}

interface ArrowSettings {
    enabled: boolean
    size: number
    activeColor: string
    color: string
    background: string
    border: BorderValue
    padding: string
    offset: number
}

interface CounterSettings {
    enabled: boolean
    fontSize: number
    color: string
    background: string
    border: BorderValue
    padding: string
    offset: number
}

interface AutoplaySettings {
    enabled: boolean
    duration: number
    loop: boolean
    stopOnInteraction: boolean
}

interface ZoomSettings {
    enabled: boolean
    scale: number
}

type TransitionEffect = "slide" | "fade"

// Lets the outgoing slide's duplicate in a "slide" transition pick up the
// zoom exactly where the real (untouched) track's animation currently is,
// and keep animating toward the same target over whatever time is left -
// computed once, at the exact moment the transition starts, from how long
// the slide has actually been active.
interface ZoomContinuation {
    startScale: number
    targetScale: number
    remainingDuration: number
}

interface DirectTransitionState {
    from: number
    to: number
    mode: TransitionEffect
    direction: 1 | -1
    zoom?: ZoomContinuation
}

const ZOOM_DURATION = 6
// How fast an in-flight transition wraps up once another navigation request
// is already queued behind it, so rapid clicking/key-pressing chains right
// away instead of always waiting out the full configured Speed.
const FAST_FORWARD_DURATION = 0.06
// The blurred cover-fit backdrop shown behind "contain" images.
const BACKDROP_BLUR = 28
// How far past the frame's own edges the backdrop's box extends (a fixed
// pixel margin, not a scale) so object-fit: cover always has real image
// data to bleed the blur into on every side, regardless of the frame's
// aspect ratio - a percentage scale gives uneven margins depending on the
// crop, which is exactly what let the blur's edge run out of room and
// visibly darken.
const BACKDROP_MARGIN = 70
// How much of an over-drag past a boundary actually shows as visual
// stretch, and the cap on that stretch, for the desktop-drag rubber band.
const DRAG_RESISTANCE = 0.35
const DRAG_MAX_OVERSHOOT = 60

interface MediaSliderProps {
    source: "manual" | "cms" | "url"
    slides: SlideItem[]
    image1?: ResponsiveImageValue
    image2?: ResponsiveImageValue
    image3?: ResponsiveImageValue
    image4?: ResponsiveImageValue
    image5?: ResponsiveImageValue
    image6?: ResponsiveImageValue
    image7?: ResponsiveImageValue
    image8?: ResponsiveImageValue
    image9?: ResponsiveImageValue
    image10?: ResponsiveImageValue
    url1?: string
    url2?: string
    url3?: string
    url4?: string
    url5?: string
    url6?: string
    url7?: string
    url8?: string
    url9?: string
    url10?: string
    fit: "cover" | "contain"
    effect: TransitionEffect
    transitionDuration: number
    desktopDrag: boolean
    pagination: PaginationSettings
    arrows: ArrowSettings
    counter: CounterSettings
    autoplay: AutoplaySettings
    zoom: ZoomSettings
    fill: string
    border?: BorderValue
    cornerRadius: string
    style?: CSSProperties
}

/**
 * Basic Slideshow
 *
 * A simple swipeable image slideshow with a glass-style dot pagination.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 */
export default function BasicSlideshow(props: MediaSliderProps) {
    const {
        source = "manual",
        slides = defaultSlides,
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
        url1,
        url2,
        url3,
        url4,
        url5,
        url6,
        url7,
        url8,
        url9,
        url10,
        fit = "cover",
        effect = "slide",
        transitionDuration = 0.4,
        desktopDrag = false,
        pagination,
        arrows,
        counter,
        autoplay,
        zoom,
        fill = "#000000",
        border,
        cornerRadius = "0px",
        style,
    } = props

    const {
        enabled: autoplayEnabled = true,
        duration: autoplayDuration = 6,
        loop: autoplayLoop = true,
        stopOnInteraction: autoplayStopOnInteraction = true,
    } = autoplay || {}
    const { enabled: zoomEnabled = true, scale: zoomScale = 1.07 } = zoom || {}
    // A deactivated slide's zoom should only ever reset once it's safely
    // out of view, so give it a margin comfortably past the transition.
    const zoomResetDelay = transitionDuration * 1000 + 300
    const {
        enabled: showPagination = true,
        activeColor: activeDotColor = "#FFFFFF",
        inactiveColor: inactiveDotColor = "rgba(255, 255, 255, 0.45)",
        background: pillBackground = "rgba(0, 0, 0, 0.4)",
        border: pillBorder = {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(255, 255, 255, 0.05)",
        },
        padding: pillPadding = "8px 13px 8px 13px",
        offset: pillOffset = 20,
        dotSize = 6,
        dotGap = 8,
    } = pagination || {}

    const {
        enabled: showArrows = true,
        size: arrowSize = 18,
        activeColor: arrowActiveColor = "#FFFFFF",
        color: arrowColor = "rgba(255, 255, 255, 0.45)",
        background: arrowBackground = "rgba(0, 0, 0, 0.4)",
        border: arrowBorder = {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(255, 255, 255, 0.05)",
        },
        padding: arrowPadding = "6px 6px 6px 6px",
        offset: arrowOffset = 15,
    } = arrows || {}

    const {
        enabled: showCounter = false,
        fontSize: counterFontSize = 10,
        color: counterColor = "#FFFFFF",
        background: counterBackground = "rgba(0, 0, 0, 0.4)",
        border: counterBorder = {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(255, 255, 255, 0.05)",
        },
        padding: counterPadding = "4px 6px 4px 6px",
        offset: counterOffset = 15,
    } = counter || {}

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [inViewport, setInViewport] = useState(true)
    const [directTransition, setDirectTransition] =
        useState<DirectTransitionState | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    // Keeps native scroll-snap disabled a bit longer after a drag release,
    // through the JS-driven settle scroll: `isDragging` alone flips false
    // the instant the mouse lifts, right as that scroll starts, so snap
    // would otherwise immediately re-engage and fight it back toward
    // whichever slide is nearest the *current* position - which, now that
    // the release threshold is well under 50%, is still the old slide, not
    // the one being dragged toward.
    const [isSettling, setIsSettling] = useState(false)
    // How far (px) the track is visually pulled past a boundary while
    // dragging - scrollLeft itself can't go negative or past the max, so
    // this rubber-band stretch is a separate transform layered on top, that
    // springs back to 0 once the drag releases.
    const [overshoot, setOvershoot] = useState(0)
    const scrollRaf = useRef<number | null>(null)
    const dragStart = useRef({ x: 0, scrollLeft: 0 })
    // When the current slide actually became active, so a transition that
    // starts mid-zoom can compute exactly how far along it is.
    const activatedAt = useRef(Date.now())
    // Whether the visitor has manually changed slide (drag, pagination, or
    // keyboard) - checked by the autoplay effect when "Stop on Interaction"
    // is on, to permanently stop scheduling further auto-advances.
    const userInteracted = useRef(false)
    // Marks a scrollLeft write as our own (from finishing a transition), so
    // the scroll listener doesn't mistake it for a genuine user drag.
    const programmaticScroll = useRef(false)
    // A click/key-press that arrives while a transition is still playing
    // doesn't get dropped: it's remembered here and picked up the instant
    // the current one ends, so rapid clicking chains smoothly instead of
    // only ever reacting to the first click.
    const pendingTargetRef = useRef<number | null>(null)
    // Mirrors "is something queued" as real state (the ref alone can't
    // trigger a re-render), so the in-flight transition can be told to wrap
    // up quickly instead of playing out its full duration.
    const [hasPendingTarget, setHasPendingTarget] = useState(false)
    const uid = useMemo(
        () => "ms-" + Math.random().toString(36).slice(2, 9),
        []
    )

    const items = useMemo(() => {
        if (source === "cms") {
            const cmsSlides = [
                image1,
                image2,
                image3,
                image4,
                image5,
                image6,
                image7,
                image8,
                image9,
                image10,
            ]
                .filter((image): image is ResponsiveImageValue => !!image?.src)
                .map((image) => ({ image }))
            return cmsSlides.length > 0 ? cmsSlides : defaultSlides
        }
        if (source === "url") {
            const urlSlides = [
                url1,
                url2,
                url3,
                url4,
                url5,
                url6,
                url7,
                url8,
                url9,
                url10,
            ]
                .filter((url): url is string => !!url && url.trim().length > 0)
                .map((src) => ({ image: { src } }))
            return urlSlides.length > 0 ? urlSlides : defaultSlides
        }
        return slides && slides.length > 0 ? slides : defaultSlides
    }, [
        source,
        slides,
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
        url1,
        url2,
        url3,
        url4,
        url5,
        url6,
        url7,
        url8,
        url9,
        url10,
    ])

    useEffect(() => {
        activatedAt.current = Date.now()
    }, [currentIndex])

    // Optional desktop click-and-drag, mirroring native touch dragging. For
    // "slide" it mirrors native dragging 1:1 (scroll-snap switched off for
    // the duration, same reason as the push animation: rapid writes
    // otherwise fight the browser's own snap-correction; settles on the
    // nearest slide on release). Other effects aren't spatial, so a drag is
    // just a swipe gesture there: nothing moves until release, then a
    // regular effect-aware transition fires if the drag passed a threshold.
    function handleMouseDown(e: React.MouseEvent) {
        // A Slide push still owns the real track's scrollLeft directly, so
        // starting a new drag while one is mid-flight would fight the snap
        // it's heading to - Fade doesn't touch scrollLeft during the drag
        // itself (just reads the gesture at release), so there's nothing to
        // fight and a new drag can start right away, keeping the cursor and
        // responsiveness continuous instead of dropping out mid-transition.
        if (!desktopDrag || (directTransition && effect === "slide")) return
        const track = trackRef.current
        if (!track) return
        if (autoplayStopOnInteraction) userInteracted.current = true
        dragStart.current = { x: e.clientX, scrollLeft: track.scrollLeft }
        setIsDragging(true)
    }

    useEffect(() => {
        if (!isDragging) return
        function handleMove(e: MouseEvent) {
            if (effect !== "slide") return
            const track = trackRef.current
            if (!track) return
            const maxScroll = track.scrollWidth - track.clientWidth
            const raw =
                dragStart.current.scrollLeft - (e.clientX - dragStart.current.x)
            if (raw < 0) {
                track.scrollLeft = 0
                setOvershoot(
                    Math.min(-raw * DRAG_RESISTANCE, DRAG_MAX_OVERSHOOT)
                )
            } else if (raw > maxScroll) {
                track.scrollLeft = maxScroll
                setOvershoot(
                    Math.max(
                        -(raw - maxScroll) * DRAG_RESISTANCE,
                        -DRAG_MAX_OVERSHOOT
                    )
                )
            } else {
                track.scrollLeft = raw
                setOvershoot(0)
            }
        }
        function handleUp(e: MouseEvent) {
            setIsDragging(false)
            setOvershoot(0)
            const track = trackRef.current
            if (!track) return
            if (effect === "slide") {
                const width = track.clientWidth || 1
                // Rounding scrollLeft/width outright means needing to drag past
                // the halfway point (50% of the slide's width) before it
                // commits to the next one - a real swipe threshold judges the
                // drag distance from where it *started* instead, so a much
                // shorter, more natural drag is enough to change slide.
                const startIndex = Math.round(
                    dragStart.current.scrollLeft / width
                )
                const delta = track.scrollLeft - dragStart.current.scrollLeft
                const threshold = Math.min(width * 0.1, 120)
                const target =
                    Math.abs(delta) >= threshold
                        ? startIndex + (delta > 0 ? 1 : -1)
                        : startIndex
                const nearest = Math.max(
                    0,
                    Math.min(items.length - 1, target)
                )
                setIsSettling(true)
                track.scrollTo({ left: width * nearest, behavior: "smooth" })
                window.setTimeout(() => setIsSettling(false), 600)
                return
            }
            const dx = e.clientX - dragStart.current.x
            if (Math.abs(dx) < 50) return
            requestStep(dx < 0 ? 1 : -1)
        }
        window.addEventListener("mousemove", handleMove)
        window.addEventListener("mouseup", handleUp)
        return () => {
            window.removeEventListener("mousemove", handleMove)
            window.removeEventListener("mouseup", handleUp)
        }
    }, [isDragging, items.length, effect, currentIndex])

    // Track which slide is active while the user swipes/scrolls.
    useEffect(() => {
        if (isStatic) return
        const track = trackRef.current
        if (!track) return

        function handleScroll() {
            // A real drag/swipe, not our own end-of-transition snap.
            if (!programmaticScroll.current) userInteracted.current = true
            if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
            scrollRaf.current = requestAnimationFrame(() => {
                if (!track) return
                const width = track.clientWidth || 1
                const index = Math.round(track.scrollLeft / width)
                startTransition(() => {
                    setCurrentIndex((prev) =>
                        prev === index ? prev : Math.min(index, items.length - 1)
                    )
                })
            })
        }

        track.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            track.removeEventListener("scroll", handleScroll)
            if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
        }
    }, [isStatic, items.length])

    // Pause everything once the component itself leaves the page viewport.
    useEffect(() => {
        if (isStatic) return
        const container = containerRef.current
        if (!container || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            ([entry]) => {
                startTransition(() => setInViewport(entry.isIntersecting))
            },
            { threshold: 0.1 }
        )
        observer.observe(container)
        return () => observer.disconnect()
    }, [isStatic])

    // Advance to the next slide after `autoplayDuration`. Restarts on any
    // manual navigation since currentIndex is a dependency. With loop off,
    // simply stops scheduling once the last slide is reached. With "stop on
    // interaction" on, stops for good the moment the visitor has dragged,
    // clicked a dot, or used the keyboard - `userInteracted` isn't a
    // dependency since it's a ref, but currentIndex already changes on every
    // one of those, which re-runs this effect and picks up the latest value.
    useEffect(() => {
        if (
            isStatic ||
            !autoplayEnabled ||
            items.length <= 1 ||
            !inViewport ||
            directTransition ||
            (!autoplayLoop && currentIndex === items.length - 1) ||
            (autoplayStopOnInteraction && userInteracted.current)
        )
            return
        const timer = window.setTimeout(() => {
            triggerTransition((currentIndex + 1) % items.length)
        }, Math.max(autoplayDuration, 0.5) * 1000)
        return () => window.clearTimeout(timer)
    }, [
        isStatic,
        autoplayEnabled,
        autoplayDuration,
        autoplayLoop,
        autoplayStopOnInteraction,
        inViewport,
        currentIndex,
        items.length,
        directTransition,
    ])

    // Snaps the native track straight to the target (no animation), the
    // moment the transition's visuals actually need the real content to be
    // the new slide - once it's fully covered, so it happens invisibly.
    function swapDirectTransition(target: number) {
        const track = trackRef.current
        if (track) {
            programmaticScroll.current = true
            track.scrollLeft = track.clientWidth * target
            window.setTimeout(() => {
                programmaticScroll.current = false
            }, 50)
        }
        setCurrentIndex(target)
    }

    // Unmounts the transition overlay once its own animation has fully
    // finished, handing control back to the (already swapped) real track.
    function endDirectTransition() {
        setDirectTransition(null)
    }

    // Shared by autoplay and pagination clicks. Always goes through the
    // overlay, never native scroll, so the speed stays consistent and
    // nothing in between the two slides is ever visible or scrolled through.
    function triggerTransition(target: number) {
        if (directTransition || target === currentIndex) return
        let zoom: ZoomContinuation | undefined
        if (zoomEnabled) {
            const elapsedS = (Date.now() - activatedAt.current) / 1000
            const progress = Math.min(elapsedS / ZOOM_DURATION, 1)
            zoom = {
                startScale: 1 + (zoomScale - 1) * progress,
                targetScale: zoomScale,
                remainingDuration: Math.max(ZOOM_DURATION - elapsedS, 0),
            }
        }
        setDirectTransition({
            from: currentIndex,
            to: target,
            mode: effect,
            direction: target > currentIndex ? 1 : -1,
            zoom,
        })
    }

    function goToSlide(index: number) {
        if (autoplayStopOnInteraction) userInteracted.current = true
        if (directTransition) {
            pendingTargetRef.current = index
            setHasPendingTarget(true)
            return
        }
        triggerTransition(index)
    }

    // Shared by the arrow buttons and arrow-key navigation: steps one slide
    // from wherever navigation is conceptually headed (the queued target if
    // one's already waiting, otherwise the in-flight transition's
    // destination, otherwise just the current slide). Returns whether it
    // actually did anything, so callers can decide whether to swallow the
    // key event.
    function requestStep(delta: 1 | -1): boolean {
        const base =
            pendingTargetRef.current ??
            (directTransition ? directTransition.to : currentIndex)
        const target = base + delta
        if (target < 0 || target > items.length - 1) return false
        if (autoplayStopOnInteraction) userInteracted.current = true
        if (directTransition) {
            pendingTargetRef.current = target
            setHasPendingTarget(true)
        } else {
            triggerTransition(target)
        }
        return true
    }

    // Picks up a click/key-press that arrived mid-transition the instant
    // the current one finishes, so rapid navigation chains right away
    // instead of waiting for each transition to play out before the next
    // one even starts.
    useEffect(() => {
        if (directTransition) return
        const pending = pendingTargetRef.current
        if (pending === null) return
        pendingTargetRef.current = null
        setHasPendingTarget(false)
        if (pending !== currentIndex) triggerTransition(pending)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [directTransition])

    // Arrow-key navigation for keyboard/screen-reader users, since there are
    // no dedicated keyboard shortcuts beyond the arrows already visible.
    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "ArrowRight") {
            if (requestStep(1)) e.preventDefault()
        } else if (e.key === "ArrowLeft") {
            if (requestStep(-1)) e.preventDefault()
        }
    }

    // Framer omits `style.width`/`style.height` when the component is set to
    // "Fit" sizing rather than Fixed/Fill, expecting the component's own
    // content to establish a natural size - otherwise it collapses to 0x0,
    // since nothing else here is in normal flow (every slide is absolutely
    // positioned). The invisible reference image below, sized like a plain
    // <img> from the first slide, is what gives it something to size to.
    const autoWidth = style?.width === undefined
    const autoHeight = style?.height === undefined
    const firstImageSrc = (items[0]?.image || defaultImage).src

    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: autoWidth ? undefined : "100%",
        height: autoHeight ? undefined : "100%",
        overflow: "hidden",
        borderRadius: cornerRadius,
        backgroundColor: fill,
        boxSizing: "border-box",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...border,
    }

    if (isStatic) {
        const first = items[0]
        return (
            <div style={rootStyle}>
                <SizingReference src={firstImageSrc} />
                <SlideMedia item={first} fit={fit} />
                {showPagination && (
                    <Pagination
                        count={items.length}
                        current={0}
                        onSelect={undefined}
                        activeDotColor={activeDotColor}
                        inactiveDotColor={inactiveDotColor}
                        pillBackground={pillBackground}
                        pillBorder={pillBorder}
                        pillPadding={pillPadding}
                        pillOffset={pillOffset}
                        dotSize={dotSize}
                        dotGap={dotGap}
                        transitions={false}
                    />
                )}
                {showArrows && items.length > 1 && (
                    <>
                        <ArrowButton
                            direction="prev"
                            ariaLabel="Previous slide"
                            onClick={() => {}}
                            disabled
                            side="left"
                            size={arrowSize}
                            idleColor={arrowColor}
                            activeColor={arrowActiveColor}
                            background={arrowBackground}
                            border={arrowBorder}
                            padding={arrowPadding}
                            offset={arrowOffset}
                        />
                        <ArrowButton
                            direction="next"
                            ariaLabel="Next slide"
                            onClick={() => {}}
                            disabled={false}
                            side="right"
                            size={arrowSize}
                            idleColor={arrowColor}
                            activeColor={arrowActiveColor}
                            background={arrowBackground}
                            border={arrowBorder}
                            padding={arrowPadding}
                            offset={arrowOffset}
                        />
                    </>
                )}
                {showCounter && (
                    <Counter
                        current={0}
                        count={items.length}
                        fontSize={counterFontSize}
                        textColor={counterColor}
                        pillBackground={counterBackground}
                        pillBorder={counterBorder}
                        pillPadding={counterPadding}
                        pillOffset={counterOffset}
                    />
                )}
            </div>
        )
    }

    // Pagination/Counter/Arrows should all reflect where a direct transition
    // is actually headed, not the slide it's still animating away from.
    const effectiveIndex = directTransition
        ? directTransition.to
        : currentIndex

    // How many slides on either side of the current one to load eagerly,
    // rather than `loading="lazy"`: with pagination on, that's whatever is
    // reachable with a single dot click - every dot when they're all shown
    // at once, or the visible reach of the windowed pill once there are
    // enough slides for it to truncate. Without pagination, only the
    // immediate neighbor ever gets reached in one step (swipe, drag, arrow
    // key, or autoplay), so there's nothing to gain loading further out.
    const preloadReach = !showPagination
        ? 1
        : items.length <= PAGINATION_WINDOW_THRESHOLD
          ? items.length
          : PAGINATION_REACH

    return (
        <div
            ref={containerRef}
            style={rootStyle}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image slideshow"
            onKeyDown={handleKeyDown}
        >
            <SizingReference src={firstImageSrc} />
            <span
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {`Slide ${currentIndex + 1} of ${items.length}`}
            </span>
            <style>{`.${uid}::-webkit-scrollbar{display:none}`}</style>
            <div
                ref={trackRef}
                className={uid}
                onMouseDown={desktopDrag ? handleMouseDown : undefined}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollSnapType:
                        isDragging || isSettling ? "none" : "x mandatory",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                    pointerEvents:
                        directTransition && effect === "slide"
                            ? "none"
                            : "auto",
                    cursor: desktopDrag
                        ? isDragging
                            ? "grabbing"
                            : "grab"
                        : undefined,
                    transform: overshoot
                        ? `translateX(${overshoot}px)`
                        : undefined,
                    transition: isDragging
                        ? "none"
                        : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
            >
                {items.map((item, index) => {
                    const isActive = index === currentIndex
                    return (
                        <div
                            key={index}
                            style={{
                                position: "relative",
                                flex: "0 0 100%",
                                width: "100%",
                                height: "100%",
                                overflow: "hidden",
                                scrollSnapAlign: "center",
                                scrollSnapStop: "always",
                            }}
                        >
                            <SlideMedia
                                item={item}
                                fit={fit}
                                eager={Math.abs(index - currentIndex) <= preloadReach}
                                zoom={
                                    zoomEnabled
                                        ? {
                                              active: isActive,
                                              scale: zoomScale,
                                              duration: ZOOM_DURATION,
                                              resetDelay: zoomResetDelay,
                                          }
                                        : undefined
                                }
                            />
                        </div>
                    )
                })}
            </div>
            {directTransition && (
                <Transition
                    mode={directTransition.mode}
                    fromItem={items[directTransition.from]}
                    toItem={items[directTransition.to]}
                    direction={directTransition.direction}
                    fit={fit}
                    duration={transitionDuration}
                    fastForward={hasPendingTarget}
                    fromZoom={directTransition.zoom}
                    onSwap={() => swapDirectTransition(directTransition.to)}
                    onDone={endDirectTransition}
                />
            )}
            {showPagination && items.length > 1 && (
                <Pagination
                    count={items.length}
                    current={effectiveIndex}
                    onSelect={goToSlide}
                    activeDotColor={activeDotColor}
                    inactiveDotColor={inactiveDotColor}
                    pillBackground={pillBackground}
                    pillBorder={pillBorder}
                    pillPadding={pillPadding}
                    pillOffset={pillOffset}
                    dotSize={dotSize}
                    dotGap={dotGap}
                    transitions
                />
            )}
            {showArrows && items.length > 1 && (
                <>
                    <ArrowButton
                        direction="prev"
                        ariaLabel="Previous slide"
                        onClick={() => requestStep(-1)}
                        disabled={effectiveIndex === 0}
                        side="left"
                        size={arrowSize}
                        idleColor={arrowColor}
                        activeColor={arrowActiveColor}
                        background={arrowBackground}
                        border={arrowBorder}
                        padding={arrowPadding}
                        offset={arrowOffset}
                    />
                    <ArrowButton
                        direction="next"
                        ariaLabel="Next slide"
                        onClick={() => requestStep(1)}
                        disabled={effectiveIndex === items.length - 1}
                        side="right"
                        size={arrowSize}
                        idleColor={arrowColor}
                        activeColor={arrowActiveColor}
                        background={arrowBackground}
                        border={arrowBorder}
                        padding={arrowPadding}
                        offset={arrowOffset}
                    />
                </>
            )}
            {showCounter && items.length > 1 && (
                <Counter
                    current={effectiveIndex}
                    count={items.length}
                    fontSize={counterFontSize}
                    textColor={counterColor}
                    pillBackground={counterBackground}
                    pillBorder={counterBorder}
                    pillPadding={counterPadding}
                    pillOffset={counterOffset}
                />
            )}
        </div>
    )
}

// Dispatches to the right transition overlay.
function Transition({
    mode,
    fromItem,
    toItem,
    direction,
    fit,
    duration,
    fastForward,
    fromZoom,
    onSwap,
    onDone,
}: {
    mode: TransitionEffect
    fromItem?: SlideItem
    toItem?: SlideItem
    direction: 1 | -1
    fit: "cover" | "contain"
    duration: number
    fastForward: boolean
    fromZoom?: ZoomContinuation
    onSwap: () => void
    onDone: () => void
}) {
    if (mode === "slide") {
        return (
            <SlideTransition
                fromItem={fromItem}
                toItem={toItem}
                direction={direction}
                fit={fit}
                duration={duration}
                fastForward={fastForward}
                fromZoom={fromZoom}
                onSwap={onSwap}
                onDone={onDone}
            />
        )
    }
    return (
        <FadeTransition
            toItem={toItem}
            fit={fit}
            duration={duration}
            fastForward={fastForward}
            onSwap={onSwap}
            onDone={onDone}
        />
    )
}

// Two simple, absolutely positioned full-size layers: the outgoing slide
// slides out one way while the incoming slide slides in from the other, both
// driven by the same `animate` flag so they move in lockstep with zero
// possibility of a gap - they're always exactly one container-width apart,
// for every value of the shared progress.
function SlideTransition({
    fromItem,
    toItem,
    direction,
    fit,
    duration,
    fastForward,
    fromZoom,
    onSwap,
    onDone,
}: {
    fromItem?: SlideItem
    toItem?: SlideItem
    direction: 1 | -1
    fit: "cover" | "contain"
    duration: number
    fastForward: boolean
    fromZoom?: ZoomContinuation
    onSwap: () => void
    onDone: () => void
}) {
    const [animate, setAnimate] = useState(false)
    const [activeDuration, setActiveDuration] = useState(duration)
    const raf2Ref = useRef(0)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        const raf1 = requestAnimationFrame(() => {
            raf2Ref.current = requestAnimationFrame(() => setAnimate(true))
        })
        timerRef.current = window.setTimeout(() => {
            onSwap()
            onDone()
        }, duration * 1000)
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2Ref.current)
            if (timerRef.current) window.clearTimeout(timerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Another navigation request is already queued behind this one - wrap
    // up quickly instead of making it wait out the full configured Speed,
    // so rapid clicking/key-pressing chains right away.
    useEffect(() => {
        if (!fastForward) return
        if (timerRef.current) window.clearTimeout(timerRef.current)
        setActiveDuration(FAST_FORWARD_DURATION)
        timerRef.current = window.setTimeout(() => {
            onSwap()
            onDone()
        }, FAST_FORWARD_DURATION * 1000)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fastForward])

    const layerStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        // Without its own clip, the "contain" backdrop's blur() can bleed
        // past this layer's edge while it's mid-transform (a compositing
        // quirk of animating a blurred, absolutely positioned layer) -
        // containing it here keeps that smear from ever showing.
        overflow: "hidden",
        transition: `transform ${activeDuration}s cubic-bezier(0.22, 1, 0.36, 1)`,
    }

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    ...layerStyle,
                    transform: `translateX(${animate ? -direction * 100 : 0}%)`,
                }}
            >
                {/* First frame: exactly the scale the real (untouched) track
                    was at the instant this transition started, no
                    transition - so there's nothing to jump from. Once that's
                    committed (next tick), it continues on to the target over
                    whatever time was actually left, so the zoom reads as
                    one continuous animation that was simply never
                    interrupted - it only ever "resets" once this whole
                    layer is gone. */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        transform: fromZoom
                            ? `scale(${animate ? fromZoom.targetScale : fromZoom.startScale})`
                            : undefined,
                        transformOrigin: "center center",
                        transition:
                            fromZoom && fromZoom.remainingDuration > 0
                                ? `transform ${fromZoom.remainingDuration}s linear`
                                : "none",
                    }}
                >
                    <SlideMedia item={fromItem} fit={fit} />
                </div>
            </div>
            <div
                style={{
                    ...layerStyle,
                    transform: `translateX(${animate ? 0 : direction * 100}%)`,
                }}
            >
                <SlideMedia item={toItem} fit={fit} />
            </div>
        </div>
    )
}

function FadeTransition({
    toItem,
    fit,
    duration,
    fastForward,
    onSwap,
    onDone,
}: {
    toItem?: SlideItem
    fit: "cover" | "contain"
    duration: number
    fastForward: boolean
    onSwap: () => void
    onDone: () => void
}) {
    const [animate, setAnimate] = useState(false)
    const [activeDuration, setActiveDuration] = useState(duration)
    const raf2Ref = useRef(0)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        const raf1 = requestAnimationFrame(() => {
            raf2Ref.current = requestAnimationFrame(() => setAnimate(true))
        })
        timerRef.current = window.setTimeout(() => {
            onSwap()
            onDone()
        }, duration * 1000)
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2Ref.current)
            if (timerRef.current) window.clearTimeout(timerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Another navigation request is already queued behind this one - wrap
    // up quickly instead of making it wait out the full configured Speed,
    // so rapid clicking/key-pressing chains right away.
    useEffect(() => {
        if (!fastForward) return
        if (timerRef.current) window.clearTimeout(timerRef.current)
        setActiveDuration(FAST_FORWARD_DURATION)
        timerRef.current = window.setTimeout(() => {
            onSwap()
            onDone()
        }, FAST_FORWARD_DURATION * 1000)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fastForward])

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                opacity: animate ? 1 : 0,
                transition: `opacity ${activeDuration}s ease`,
                pointerEvents: "none",
            }}
        >
            <SlideMedia item={toItem} fit={fit} />
        </div>
    )
}

interface SlideZoom {
    active: boolean
    scale: number
    duration: number
    // How long (ms) to hold the zoom after deactivating before resetting to
    // scale(1), long enough for whatever transition is playing to finish.
    resetDelay: number
}

// Invisible, normal-flow image that gives the root something to size itself
// to when Framer's own "Fit" layout option is chosen - every other visual
// element here is absolutely positioned so on its own the root has nothing
// to compute an intrinsic size from. Ignored entirely when the component has
// an explicit width/height (Fixed/Fill), which is the common case.
function SizingReference({ src }: { src: string }) {
    return (
        <img
            src={src}
            alt=""
            aria-hidden="true"
            style={{
                display: "block",
                width: "auto",
                height: "auto",
                opacity: 0,
                pointerEvents: "none",
            }}
        />
    )
}

function SlideMedia({
    item,
    fit,
    zoom,
    eager = true,
}: {
    item?: SlideItem
    fit: "cover" | "contain"
    zoom?: SlideZoom
    eager?: boolean
}) {
    const zoomIsActive = !!zoom?.active
    const [zoomPrimed, setZoomPrimed] = useState(false)
    const raf2Ref = useRef(0)

    // Always commit one frame at scale(1) with no transition before turning
    // the zoom on, even the very first time a slide is active - otherwise
    // that first activation has nothing to transition *from* and the scale
    // just appears instantly instead of animating in. When it deactivates,
    // don't snap back to scale(1) right away either: this slide may still be
    // visible for the duration of whatever transition is taking it off
    // screen, so keep holding its current zoom until that's had time to
    // finish, then reset invisibly once it's actually out of view.
    useEffect(() => {
        if (zoomIsActive) {
            const raf1 = requestAnimationFrame(() => {
                raf2Ref.current = requestAnimationFrame(() => setZoomPrimed(true))
            })
            return () => {
                cancelAnimationFrame(raf1)
                cancelAnimationFrame(raf2Ref.current)
            }
        }
        const resetTimer = window.setTimeout(
            () => setZoomPrimed(false),
            zoom?.resetDelay ?? 1400
        )
        return () => window.clearTimeout(resetTimer)
    }, [zoomIsActive])

    if (!item) return null

    const zoomEngaged = zoomPrimed
    const mediaStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit,
        transform: zoomEngaged ? `scale(${zoom!.scale})` : "scale(1)",
        transformOrigin: "center center",
        transition: zoomEngaged
            ? `transform ${zoom!.duration}s linear`
            : "none",
    }

    const image = item.image || defaultImage
    return (
        <>
            {/* In "contain" mode the image doesn't fill the box, so a blurred,
                cover-fit copy of the same image fills the gutters behind it
                instead of leaving them empty (or showing whatever else is
                behind the slide) - the classic Stories-style backdrop. */}
            {fit === "contain" && (
                <img
                    src={image.src}
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -BACKDROP_MARGIN,
                        objectFit: "cover",
                        filter: `blur(${BACKDROP_BLUR}px)`,
                        transform: "translateZ(0)",
                    }}
                    loading={eager ? "eager" : "lazy"}
                />
            )}
            <img
                src={image.src}
                srcSet={image.srcSet}
                alt={image.alt || ""}
                style={mediaStyle}
                loading={eager ? "eager" : "lazy"}
                draggable={false}
            />
        </>
    )
}

// Not exposed as a prop on purpose - past 5 slides, showing every dot gets
// unwieldy. Instead, up to REACH dots show on each side of the current one
// (so the pill never exceeds 2*REACH+1 = 7 dots), shrinking near either end
// as there's naturally less to show there. Every dot is always in the DOM,
// laid out in one continuous strip clipped by a fixed-width viewport; moving
// between slides just slides that strip sideways (animated), so dots visibly
// travel into and out of view instead of the visible set silently swapping.
const PAGINATION_WINDOW_THRESHOLD = 5
const PAGINATION_REACH = 3
const PAGINATION_EDGE_SCALE = 0.5
const PAGINATION_SLIDE_DURATION = 0.3

function Pagination({
    count,
    current,
    onSelect,
    activeDotColor,
    inactiveDotColor,
    pillBackground,
    pillBorder,
    pillPadding,
    pillOffset,
    dotSize,
    dotGap,
    transitions,
}: {
    count: number
    current: number
    onSelect?: (index: number) => void
    activeDotColor: string
    inactiveDotColor: string
    pillBackground: string
    pillBorder: BorderValue
    pillPadding: string
    pillOffset: number
    dotSize: number
    dotGap: number
    transitions: boolean
}) {
    // The hit target is centered on the dot and absolutely positioned, so it
    // never affects layout or spacing: the dots stay exactly where they'd be
    // with just their own size and gap, but clicking around them still works.
    const hitSize = Math.max(dotSize * 3, 22)

    const windowed = count > PAGINATION_WINDOW_THRESHOLD
    const leadCount = windowed
        ? Math.min(current, PAGINATION_REACH)
        : current
    const trailCount = windowed
        ? Math.min(count - 1 - current, PAGINATION_REACH)
        : count - 1 - current
    // How many dots are actually visible right now - this is what makes the
    // pill itself grow from 4 up to 7 and back down near either end, exactly
    // as before; the viewport width transitions right along with it.
    const visibleCount = leadCount + 1 + trailCount
    const stripStart = current - leadCount

    const step = dotSize + dotGap
    const viewportWidth = visibleCount * dotSize + (visibleCount - 1) * dotGap
    const stripOffset = -stripStart * step

    return (
        <div
            style={{
                position: "absolute",
                bottom: pillOffset,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                padding: pillPadding,
                borderRadius: 999,
                background: pillBackground,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxSizing: "border-box",
                ...pillBorder,
            }}
            role="tablist"
            aria-label="Slide pagination"
        >
            <div
                style={{
                    width: viewportWidth,
                    height: dotSize * 1.3,
                    overflow: "hidden",
                    transition: transitions
                        ? `width ${PAGINATION_SLIDE_DURATION}s ease`
                        : "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: dotGap,
                        height: "100%",
                        transform: `translateX(${stripOffset}px)`,
                        transition: transitions
                            ? `transform ${PAGINATION_SLIDE_DURATION}s ease`
                            : "none",
                    }}
                >
                    {Array.from({ length: count }).map((_, index) => {
                        const isActive = index === current
                        const distance = Math.abs(index - current)
                        const isSmall = windowed && distance === PAGINATION_REACH
                        const scale = isActive
                            ? 1.15
                            : isSmall
                              ? PAGINATION_EDGE_SCALE
                              : 1
                        return (
                            <div
                                key={index}
                                style={{
                                    position: "relative",
                                    width: dotSize,
                                    height: dotSize,
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        width: dotSize,
                                        height: dotSize,
                                        borderRadius: "50%",
                                        backgroundColor: isActive
                                            ? activeDotColor
                                            : inactiveDotColor,
                                        transform: `scale(${scale})`,
                                        transition: transitions
                                            ? "background-color 0.2s ease, transform 0.2s ease"
                                            : "none",
                                    }}
                                />
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-label={`Go to slide ${index + 1}`}
                                    disabled={!onSelect}
                                    onClick={
                                        onSelect
                                            ? () => onSelect(index)
                                            : undefined
                                    }
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        width: hitSize,
                                        height: hitSize,
                                        transform: "translate(-50%, -50%)",
                                        margin: 0,
                                        padding: 0,
                                        border: "none",
                                        background: "none",
                                        font: "inherit",
                                        appearance: "none",
                                        WebkitAppearance: "none",
                                        cursor: onSelect ? "pointer" : "default",
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function Counter({
    current,
    count,
    fontSize,
    textColor,
    pillBackground,
    pillBorder,
    pillPadding,
    pillOffset,
}: {
    current: number
    count: number
    fontSize: number
    textColor: string
    pillBackground: string
    pillBorder: BorderValue
    pillPadding: string
    pillOffset: number
}) {
    return (
        <div
            style={{
                position: "absolute",
                top: pillOffset,
                right: pillOffset,
                padding: pillPadding,
                borderRadius: 999,
                background: pillBackground,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxSizing: "border-box",
                fontFamily: "Inter, sans-serif",
                fontSize,
                fontWeight: 500,
                lineHeight: 1,
                color: textColor,
                whiteSpace: "nowrap",
                ...pillBorder,
            }}
            aria-hidden="true"
        >
            {current + 1}/{count}
        </div>
    )
}

const ARROW_PATH = {
    prev: "M15 6l-6 6 6 6",
    next: "M9 6l6 6-6 6",
}

function ArrowButton({
    direction,
    ariaLabel,
    onClick,
    disabled,
    side,
    size,
    idleColor,
    activeColor,
    background,
    border,
    padding,
    offset,
}: {
    direction: "prev" | "next"
    ariaLabel: string
    onClick: () => void
    disabled: boolean
    side: "left" | "right"
    size: number
    idleColor: string
    activeColor: string
    background: string
    border: BorderValue
    padding: string
    offset: number
}) {
    // A chevron's ink is bounding-box centered, but its point reads as the
    // visual anchor, so a perfectly centered chevron looks like it's leaning
    // away from its point - nudging it a touch toward the point corrects
    // for that optical illusion.
    const opticalNudge = size * 0.08
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            style={{
                position: "absolute",
                top: "50%",
                left: side === "left" ? offset : undefined,
                right: side === "right" ? offset : undefined,
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding,
                margin: 0,
                border: "none",
                borderRadius: 999,
                background,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxSizing: "border-box",
                cursor: disabled ? "default" : "pointer",
                font: "inherit",
                appearance: "none",
                WebkitAppearance: "none",
                ...border,
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                style={{
                    transform: `translateX(${direction === "prev" ? -opticalNudge : opticalNudge}px)`,
                }}
            >
                <path
                    d={ARROW_PATH[direction]}
                    stroke={disabled ? idleColor : activeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

const defaultImage: ResponsiveImageValue = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1",
}

const defaultSlides: SlideItem[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1",
        },
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2",
        },
    },
    {
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gradient 3",
        },
    },
]

BasicSlideshow.displayName = "Basic Slideshow"

addPropertyControls(BasicSlideshow, {
    source: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["manual", "cms", "url"],
        optionTitles: ["Manual", "CMS", "URL"],
        defaultValue: "manual",
        displaySegmentedControl: true,
    },
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: defaultSlides,
        maxCount: 12,
        hidden: (props) => props.source !== "manual",
    },
    image1: {
        type: ControlType.ResponsiveImage,
        title: "Image 1",
        hidden: (props) => props.source !== "cms",
    },
    image2: {
        type: ControlType.ResponsiveImage,
        title: "Image 2",
        hidden: (props) => props.source !== "cms",
    },
    image3: {
        type: ControlType.ResponsiveImage,
        title: "Image 3",
        hidden: (props) => props.source !== "cms",
    },
    image4: {
        type: ControlType.ResponsiveImage,
        title: "Image 4",
        hidden: (props) => props.source !== "cms",
    },
    image5: {
        type: ControlType.ResponsiveImage,
        title: "Image 5",
        hidden: (props) => props.source !== "cms",
    },
    image6: {
        type: ControlType.ResponsiveImage,
        title: "Image 6",
        hidden: (props) => props.source !== "cms",
    },
    image7: {
        type: ControlType.ResponsiveImage,
        title: "Image 7",
        hidden: (props) => props.source !== "cms",
    },
    image8: {
        type: ControlType.ResponsiveImage,
        title: "Image 8",
        hidden: (props) => props.source !== "cms",
    },
    image9: {
        type: ControlType.ResponsiveImage,
        title: "Image 9",
        hidden: (props) => props.source !== "cms",
    },
    image10: {
        type: ControlType.ResponsiveImage,
        title: "Image 10",
        hidden: (props) => props.source !== "cms",
    },
    url1: {
        type: ControlType.String,
        title: "URL 1",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url2: {
        type: ControlType.String,
        title: "URL 2",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url3: {
        type: ControlType.String,
        title: "URL 3",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url4: {
        type: ControlType.String,
        title: "URL 4",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url5: {
        type: ControlType.String,
        title: "URL 5",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url6: {
        type: ControlType.String,
        title: "URL 6",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url7: {
        type: ControlType.String,
        title: "URL 7",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url8: {
        type: ControlType.String,
        title: "URL 8",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url9: {
        type: ControlType.String,
        title: "URL 9",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    url10: {
        type: ControlType.String,
        title: "URL 10",
        placeholder: "https://...",
        hidden: (props) => props.source !== "url",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    effect: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["slide", "fade"],
        optionTitles: ["Slide", "Fade"],
        defaultValue: "slide",
        displaySegmentedControl: true,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.4,
        min: 0.15,
        max: 1.5,
        step: 0.05,
        unit: "s",
    },
    desktopDrag: {
        type: ControlType.Boolean,
        title: "Desktop Drag",
        defaultValue: false,
    },
    pagination: {
        type: ControlType.Object,
        title: "Pagination",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Pagination",
                defaultValue: true,
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 6,
                min: 4,
                max: 12,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
            dotGap: {
                type: ControlType.Number,
                title: "Dot Gap",
                defaultValue: 8,
                min: 2,
                max: 16,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Dot",
                defaultValue: "#FFFFFF",
                hidden: (props) => !props.enabled,
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Dot",
                defaultValue: "rgba(255, 255, 255, 0.45)",
                hidden: (props) => !props.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Pill Glass",
                defaultValue: "rgba(0, 0, 0, 0.4)",
                hidden: (props) => !props.enabled,
            },
            border: {
                type: ControlType.Border,
                title: "Pill Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(255, 255, 255, 0.05)",
                },
                hidden: (props) => !props.enabled,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "8px 13px 8px 13px",
                hidden: (props) => !props.enabled,
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: 20,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            activeColor: "#FFFFFF",
            inactiveColor: "rgba(255, 255, 255, 0.45)",
            background: "rgba(0, 0, 0, 0.4)",
            border: {
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255, 255, 255, 0.05)",
            },
            padding: "8px 13px 8px 13px",
            offset: 20,
            dotSize: 6,
            dotGap: 8,
        },
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
            },
            size: {
                type: ControlType.Number,
                title: "Arrow Size",
                defaultValue: 18,
                min: 10,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Arrow",
                defaultValue: "#FFFFFF",
                hidden: (props) => !props.enabled,
            },
            color: {
                type: ControlType.Color,
                title: "Arrow",
                defaultValue: "rgba(255, 255, 255, 0.45)",
                hidden: (props) => !props.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Pill Glass",
                defaultValue: "rgba(0, 0, 0, 0.4)",
                hidden: (props) => !props.enabled,
            },
            border: {
                type: ControlType.Border,
                title: "Pill Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(255, 255, 255, 0.05)",
                },
                hidden: (props) => !props.enabled,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "6px 6px 6px 6px",
                hidden: (props) => !props.enabled,
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: 15,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            size: 18,
            activeColor: "#FFFFFF",
            color: "rgba(255, 255, 255, 0.45)",
            background: "rgba(0, 0, 0, 0.4)",
            border: {
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255, 255, 255, 0.05)",
            },
            padding: "6px 6px 6px 6px",
            offset: 15,
        },
    },
    counter: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Counter",
                defaultValue: false,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Font Size",
                defaultValue: 10,
                min: 7,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (props) => !props.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Pill Glass",
                defaultValue: "rgba(0, 0, 0, 0.4)",
                hidden: (props) => !props.enabled,
            },
            border: {
                type: ControlType.Border,
                title: "Pill Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(255, 255, 255, 0.05)",
                },
                hidden: (props) => !props.enabled,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "4px 6px 4px 6px",
                hidden: (props) => !props.enabled,
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: 15,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: false,
            fontSize: 10,
            color: "#FFFFFF",
            background: "rgba(0, 0, 0, 0.4)",
            border: {
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(255, 255, 255, 0.05)",
            },
            padding: "4px 6px 4px 6px",
            offset: 15,
        },
    },
    autoplay: {
        type: ControlType.Object,
        title: "Autoplay",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 6,
                min: 1,
                max: 15,
                step: 0.5,
                unit: "s",
                hidden: (props) => !props.enabled,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                hidden: (props) => !props.enabled,
            },
            stopOnInteraction: {
                type: ControlType.Boolean,
                title: "Stop on Interaction",
                defaultValue: true,
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            duration: 6,
            loop: true,
            stopOnInteraction: true,
        },
    },
    zoom: {
        type: ControlType.Object,
        title: "Zoom",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Zoom",
                defaultValue: true,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1.07,
                min: 1,
                max: 1.5,
                step: 0.01,
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            scale: 1.07,
        },
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#000000",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        optional: true,
    },
    cornerRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
})
