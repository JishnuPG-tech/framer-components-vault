import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
    type KeyboardEvent as ReactKeyboardEvent,
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
    motion,
    type MotionValue,
    useInView,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion"

/* ---------------------------------- Types --------------------------------- */

interface SlideImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface Slide {
    image?: SlideImage
    caption?: string
    tags?: string[]
    link?: string
}

type Effect =
    | "fade"
    | "slide"
    | "slideUp"
    | "cover"
    | "wipe"
    | "zoom"
    | "blur"
    | "none"

interface MediaOptions {
    fit: "cover" | "contain"
    position: "center" | "top" | "bottom" | "left" | "right"
    scale: number
    overlayColor: string
    overlayTop: number
    overlayBottom: number
    overlayAngle: number
    parallax: boolean
    parallaxAmount: number
}

interface ProgressOptions {
    align: "start" | "center" | "end"
    stretch: boolean
    clickable: boolean
    barWidth: number
    barHeight: number
    gap: number
    radius: number
    activeColor: string
    trackColor: string
}

interface ArrowOptions {
    position: "bottom" | "sides"
    size: number
    iconSize: number
    strokeWidth: number
    radius: number
    background: string
    color: string
    inset: number
    gap: number
}

interface LinkHoverOptions {
    zoom: number
    overlayColor: string
    overlayOpacity: number
    duration: number
}

interface PlaybackOptions {
    startSlide: number
    loop: boolean
    swipe: boolean
    autoplay: boolean
    interval: number
    pauseOnHover: boolean
    pauseOffscreen: boolean
}

interface TransitionOptions {
    effect: Effect
    duration: number
    ease: string
}

interface CaptionOptions {
    show: boolean
    text: string
    font: CSSProperties
    color: string
}

interface TagOptions {
    show: boolean
    align: "left" | "center" | "right"
    items: string[]
    font: CSSProperties
    color: string
    background: string
    blur: number
    radius: number
    paddingX: number
    paddingY: number
    gap: number
}

interface LayoutOptions {
    arrangement: "split" | "stacked"
    position: "top" | "bottom"
    gap: number
    paddingX: number
    paddingY: number
    animateText: boolean
}

interface OmniSlideshowProps {
    slides: Slide[]
    playback: Partial<PlaybackOptions>
    transition: Partial<TransitionOptions>
    media: Partial<MediaOptions>
    linkHover: Partial<LinkHoverOptions>
    caption: Partial<CaptionOptions>
    tags: Partial<TagOptions>
    layout: Partial<LayoutOptions>
    showProgress: boolean
    progress: Partial<ProgressOptions>
    showArrows: boolean
    arrows: Partial<ArrowOptions>
    background: string
    radius: string
    ariaLabel: string
    style?: CSSProperties
}

/* -------------------------------- Defaults -------------------------------- */

// Framer's stock gradient placeholders, so the component never ships with
// anyone's project imagery.
const DEFAULT_SLIDES: Slide[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Blue gradient",
        },
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Purple gradient",
        },
    },
]

const DEFAULT_TAGS = ["Tag 1", "Tag 2", "Tag 3", "Tag 4"]

const DEFAULT_MEDIA: MediaOptions = {
    fit: "cover",
    position: "center",
    scale: 1.1,
    overlayColor: "#0E0E0E",
    overlayTop: 0.3,
    overlayBottom: 0,
    overlayAngle: 180,
    parallax: true,
    parallaxAmount: 120,
}

const DEFAULT_PROGRESS: ProgressOptions = {
    align: "end",
    stretch: false,
    clickable: true,
    barWidth: 56,
    barHeight: 6,
    gap: 8,
    radius: 0,
    activeColor: "#FFFFFF",
    trackColor: "rgba(0, 0, 0, 0.3)",
}

const DEFAULT_ARROWS: ArrowOptions = {
    position: "bottom",
    size: 44,
    iconSize: 16,
    strokeWidth: 2,
    radius: 32,
    background: "#F6F6F4",
    color: "#0E0E0E",
    inset: 24,
    gap: 8,
}

const DEFAULT_LINK_HOVER: LinkHoverOptions = {
    zoom: 0.06,
    overlayColor: "#0E0E0E",
    overlayOpacity: 0.25,
    duration: 0.4,
}

const DEFAULT_PLAYBACK: PlaybackOptions = {
    startSlide: 1,
    loop: true,
    swipe: true,
    autoplay: true,
    interval: 4,
    pauseOnHover: false,
    pauseOffscreen: true,
}

const DEFAULT_TRANSITION: TransitionOptions = {
    effect: "fade",
    duration: 0.8,
    ease: "easeInOut",
}

const DEFAULT_CAPTION: CaptionOptions = {
    show: false,
    text: "Enter your caption here..",
    font: {},
    color: "#FFFFFF",
}

const DEFAULT_TAGS_OPTIONS: TagOptions = {
    show: false,
    align: "right",
    items: DEFAULT_TAGS,
    font: {},
    color: "#FFFFFF",
    background: "rgba(255, 255, 255, 0.14)",
    blur: 4,
    radius: 2,
    paddingX: 12,
    paddingY: 6,
    gap: 8,
}

const DEFAULT_LAYOUT: LayoutOptions = {
    arrangement: "split",
    position: "top",
    gap: 17,
    paddingX: 64,
    paddingY: 24,
    animateText: true,
}

const EASE_OPTIONS = [
    "easeInOut",
    "easeOut",
    "easeIn",
    "linear",
    "circOut",
    "backOut",
]

/* --------------------------------- Helpers -------------------------------- */

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

// Bars before the active one are full, bars after it are empty.
function barProgress(index: number, current: number, activeProgress: number) {
    if (index < current) return 1
    if (index === current) return activeProgress
    return 0
}

// Slide the fill in from the left rather than scaling it, so rounded ends
// keep their shape.
function fillTransform(progress: number) {
    return `translateX(${(progress - 1) * 100}%)`
}

function layerMotion(
    effect: Effect,
    role: "enter" | "exit",
    direction: number
) {
    const enter = role === "enter"
    const stay = { initial: { opacity: 1 }, animate: { opacity: 1 } }
    switch (effect) {
        case "slide":
            return enter
                ? {
                      initial: { x: `${direction * 100}%` },
                      animate: { x: "0%" },
                  }
                : {
                      initial: { x: "0%" },
                      animate: { x: `${-direction * 100}%` },
                  }
        case "slideUp":
            return enter
                ? {
                      initial: { y: `${direction * 100}%` },
                      animate: { y: "0%" },
                  }
                : {
                      initial: { y: "0%" },
                      animate: { y: `${-direction * 100}%` },
                  }
        case "cover":
            // New slide slides over the old one, which drifts away slowly.
            return enter
                ? {
                      initial: { x: `${direction * 100}%` },
                      animate: { x: "0%" },
                  }
                : {
                      initial: { x: "0%" },
                      animate: { x: `${-direction * 25}%` },
                  }
        case "wipe":
            // New slide is revealed by a moving edge.
            return enter
                ? {
                      initial: {
                          clipPath:
                              direction > 0
                                  ? "inset(0 0 0 100%)"
                                  : "inset(0 100% 0 0)",
                      },
                      animate: { clipPath: "inset(0 0 0 0%)" },
                  }
                : stay
        case "zoom":
            return enter
                ? {
                      initial: { opacity: 0, scale: 1.12 },
                      animate: { opacity: 1, scale: 1 },
                  }
                : stay
        case "blur":
            return enter
                ? {
                      initial: { opacity: 0, filter: "blur(24px)" },
                      animate: { opacity: 1, filter: "blur(0px)" },
                  }
                : {
                      initial: { opacity: 1, filter: "blur(0px)" },
                      animate: { opacity: 1, filter: "blur(12px)" },
                  }
        default:
            // fade: the leaving slide stays opaque underneath so there is no dip
            return enter
                ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
                : stay
    }
}

const visuallyHidden: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

/* ------------------------------ Slide layer ------------------------------- */

interface SlideLayerProps {
    slide: Slide | undefined
    role: "enter" | "exit"
    effect: Effect
    direction: number
    duration: number
    ease: string
    animate: boolean
    media: MediaOptions
    parallaxY: MotionValue<number>
    parallaxActive: boolean
    hoverScale: number
    hoverDuration: number
}

function SlideLayer(props: SlideLayerProps) {
    const {
        slide,
        role,
        effect,
        direction,
        duration,
        ease,
        animate,
        media,
        parallaxY,
        parallaxActive,
        hoverScale,
        hoverDuration,
    } = props

    const { initial, animate: target } = layerMotion(effect, role, direction)
    const amount = parallaxActive ? media.parallaxAmount : 0
    const image = slide?.image

    return (
        <motion.div
            initial={animate ? initial : false}
            animate={target}
            transition={{ duration, ease: ease as any }}
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: role === "enter" ? 2 : 1,
                willChange: "transform, opacity",
            }}
        >
            {image?.src ? (
                <motion.img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={slide?.image?.alt ?? ""}
                    draggable={false}
                    initial={false}
                    animate={{ scale: media.scale * hoverScale }}
                    transition={{ duration: hoverDuration, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: -amount,
                        width: "100%",
                        height: `calc(100% + ${amount * 2}px)`,
                        objectFit: media.fit,
                        objectPosition: media.position,
                        y: parallaxActive ? parallaxY : 0,
                        userSelect: "none",
                        display: "block",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(135deg, #1c1c1c 0%, #2b2b2b 100%)",
                    }}
                />
            )}
        </motion.div>
    )
}

/* -------------------------------- Component -------------------------------- */

/**
 * Omni Slideshow
 *
 * Full-bleed image slideshow with parallax, a caption, tags and a progress
 * indicator. Add as many slides as you like in the Slides control.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function OmniSlideshow(props: OmniSlideshowProps) {
    const {
        slides: slidesProp,
        showProgress = true,
        showArrows = true,
        background = "#0E0E0E",
        radius = "0px",
        ariaLabel = "Projects slideshow",
        style,
    } = props

    const media: MediaOptions = { ...DEFAULT_MEDIA, ...props.media }
    const progress: ProgressOptions = { ...DEFAULT_PROGRESS, ...props.progress }
    const arrows: ArrowOptions = { ...DEFAULT_ARROWS, ...props.arrows }
    const linkHover: LinkHoverOptions = {
        ...DEFAULT_LINK_HOVER,
        ...props.linkHover,
    }
    const {
        startSlide: startIndex,
        loop,
        swipe,
        autoplay,
        interval,
        pauseOnHover,
        pauseOffscreen,
    }: PlaybackOptions = { ...DEFAULT_PLAYBACK, ...props.playback }
    const { effect, duration, ease }: TransitionOptions = {
        ...DEFAULT_TRANSITION,
        ...props.transition,
    }
    const captionOptions: CaptionOptions = {
        ...DEFAULT_CAPTION,
        ...props.caption,
    }
    const {
        show: showCaption,
        text: caption,
        font: captionFont,
        color: captionColor,
    } = captionOptions
    const tagOptions: TagOptions = { ...DEFAULT_TAGS_OPTIONS, ...props.tags }
    const {
        show: showTags,
        align: tagAlign,
        items: tags,
        font: tagFont,
        color: tagColor,
        background: tagBackground,
        blur: tagBlur,
        radius: tagRadius,
        paddingX: tagPaddingX,
        paddingY: tagPaddingY,
        gap: tagGap,
    } = tagOptions
    const tagPadding = `${tagPaddingY}px ${tagPaddingX}px`
    const {
        arrangement: contentLayout,
        position: contentPosition,
        gap: contentGap,
        paddingX,
        paddingY,
        animateText: animateContent,
    }: LayoutOptions = { ...DEFAULT_LAYOUT, ...props.layout }
    const padding = `${paddingY}px ${paddingX}px`

    const isBlankSlide = (slide: Slide) =>
        !slide.image?.src &&
        !slide.caption &&
        !slide.link &&
        !(slide.tags && slide.tags.length)

    const rawSlides = (
        Array.isArray(slidesProp) && slidesProp.length > 0
            ? slidesProp
            : slidesProp === undefined
              ? DEFAULT_SLIDES
              : []
    ).filter(Boolean) as Slide[]

    // A brand-new instance arrives with one empty slide item (the image
    // control has no default value), so show the starter slides instead of a
    // lone blank slide. Untouched slides in the first positions get a starter
    // image too.
    const slides: Slide[] =
        rawSlides.length === 1 && isBlankSlide(rawSlides[0])
            ? DEFAULT_SLIDES
            : rawSlides.map((slide, index) =>
                  isBlankSlide(slide) && DEFAULT_SLIDES[index]
                      ? { ...slide, image: DEFAULT_SLIDES[index].image }
                      : slide
              )
    const count = slides.length

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const rootRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(rootRef)

    /* ------------------------------ Slide state ----------------------------- */

    const firstIndex = clamp(
        Math.round(startIndex) - 1,
        0,
        Math.max(0, count - 1)
    )
    const [view, setView] = useState({
        index: firstIndex,
        prev: null as number | null,
        direction: 1,
        id: 0,
    })
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [overLink, setOverLink] = useState(false)
    const current = clamp(view.index, 0, Math.max(0, count - 1))

    const effectiveEffect: Effect = reduceMotion ? "none" : effect
    const durationSec = clamp(duration, 0.05, 5)

    const progressRef = useRef(0)
    const fillRefs = useRef<(HTMLDivElement | null)[]>([])
    const countRef = useRef(count)
    countRef.current = count
    const effectRef = useRef(effectiveEffect)
    effectRef.current = effectiveEffect

    const goTo = useCallback((target: number, direction: number) => {
        const total = countRef.current
        if (total < 1) return
        const next = ((target % total) + total) % total
        progressRef.current = 0
        startTransition(() =>
            setView((v) =>
                next === v.index
                    ? v
                    : {
                          index: next,
                          prev: effectRef.current === "none" ? null : v.index,
                          direction,
                          id: v.id + 1,
                      }
            )
        )
    }, [])

    // The link element is replaced on every slide change, so drop the hover.
    useEffect(() => setOverLink(false), [current])

    const currentRef = useRef(current)
    currentRef.current = current
    const goNext = useCallback(() => goTo(currentRef.current + 1, 1), [goTo])
    const goPrev = useCallback(() => goTo(currentRef.current - 1, -1), [goTo])

    // Follow the Start Slide control when it changes.
    const lastStart = useRef(firstIndex)
    useEffect(() => {
        if (firstIndex === lastStart.current) return
        lastStart.current = firstIndex
        progressRef.current = 0
        setView((v) => ({
            index: firstIndex,
            prev: null,
            direction: 1,
            id: v.id + 1,
        }))
    }, [firstIndex])

    // Drop the leaving slide once the transition has finished.
    useEffect(() => {
        if (view.prev === null) return
        const id = view.id
        const timeout = window.setTimeout(
            () => setView((v) => (v.id === id ? { ...v, prev: null } : v)),
            durationSec * 1000 + 80
        )
        return () => window.clearTimeout(timeout)
    }, [view.id, view.prev, durationSec])

    // Fetch and decode the neighbouring slides ahead of time so they paint
    // instantly when the transition starts.
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || count < 2) return
        for (const offset of [1, -1]) {
            const image = slides[(current + offset + count) % count]?.image
            if (!image?.src) continue
            const preload = new window.Image()
            if (image.srcSet) preload.srcset = image.srcSet
            preload.src = image.src
            preload.decode?.().catch(() => {})
        }
    }, [current, count, slidesProp, isStatic])

    /* -------------------------------- Autoplay ------------------------------- */

    const canAutoplay = autoplay && count > 1
    const paused =
        isStatic ||
        !canAutoplay ||
        (pauseOffscreen && !isInView) ||
        (pauseOnHover && isHovered)
    const intervalMs = Math.max(0.5, interval) * 1000

    // The loop writes transforms outside React, so sync every bar explicitly
    // whenever the slide changes.
    useIsomorphicLayoutEffect(() => {
        if (isStatic) return
        fillRefs.current.slice(0, count).forEach((fill, index) => {
            if (!fill) return
            fill.style.transform = fillTransform(
                barProgress(
                    index,
                    current,
                    canAutoplay ? progressRef.current : 1
                )
            )
        })
    }, [current, count, isStatic, canAutoplay])

    useEffect(() => {
        if (paused) return
        let frame = 0
        let last = performance.now()

        const tick = (now: number) => {
            // Clamp the delta so a backgrounded tab doesn't skip ahead.
            const delta = Math.min(now - last, 100)
            last = now
            progressRef.current = Math.min(
                1,
                progressRef.current + delta / intervalMs
            )
            const fill = fillRefs.current[current]
            if (fill) fill.style.transform = fillTransform(progressRef.current)

            if (progressRef.current >= 1) {
                if (loop || current + 1 < count) {
                    goTo(current + 1, 1)
                }
                return
            }
            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [paused, current, count, intervalMs, loop, goTo])

    /* ------------------------------ Interactions ----------------------------- */

    const canSwipe = swipe && count > 1
    const pointerStart = useRef<{ x: number; y: number } | null>(null)
    const didSwipe = useRef(false)

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        didSwipe.current = false
        pointerStart.current = { x: event.clientX, y: event.clientY }
        if (canSwipe) setIsDragging(true)
    }
    const endDrag = () => {
        pointerStart.current = null
        setIsDragging(false)
    }
    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = pointerStart.current
        endDrag()
        if (!start || !canSwipe) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            didSwipe.current = true
            if (dx < 0) {
                if (loop || current + 1 < count) goNext()
            } else if (loop || current > 0) {
                goPrev()
            }
        }
    }

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (count < 2) return
        if (event.key === "ArrowRight") {
            event.preventDefault()
            if (loop || current + 1 < count) goNext()
        } else if (event.key === "ArrowLeft") {
            event.preventDefault()
            if (loop || current > 0) goPrev()
        }
    }

    /* -------------------------------- Parallax ------------------------------- */

    const parallaxActive = media.parallax && !isStatic && !reduceMotion
    const amountRef = useRef(media.parallaxAmount)
    amountRef.current = media.parallaxAmount
    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: ["start end", "end start"],
    })
    const parallaxY = useTransform(
        scrollYProgress,
        (value) => (value * 2 - 1) * amountRef.current
    )

    /* -------------------------------- Rendering ------------------------------ */

    if (count === 0) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background,
                    borderRadius: radius,
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                }}
            >
                Add slides in the properties panel
            </div>
        )
    }

    const slide = slides[current]
    const linkHovered = overLink && !!slide?.link
    const slideCaption = slide?.caption?.trim() ? slide.caption : caption
    const slideTags = slide?.tags && slide.tags.length > 0 ? slide.tags : tags
    const hasCaption = showCaption && !!slideCaption
    const hasTags = showTags && slideTags.length > 0
    const hasContent = hasCaption || hasTags
    const multiple = count > 1
    const activeProgress = isStatic
        ? 0.5
        : canAutoplay
          ? progressRef.current
          : 1
    // With a single slide the controls stay visible (so they can be styled
    // on the canvas) but the arrows are disabled.
    const atStart = !multiple || (!loop && current === 0)
    const atEnd = !multiple || (!loop && current === count - 1)
    const arrowsBottom = showArrows && arrows.position === "bottom"
    const arrowsSides = showArrows && arrows.position === "sides"
    const showRow = showProgress || arrowsBottom

    const overlay = `linear-gradient(${media.overlayAngle}deg, color-mix(in srgb, ${media.overlayColor} ${clamp(media.overlayTop, 0, 1) * 100}%, transparent) 0%, color-mix(in srgb, ${media.overlayColor} ${clamp(media.overlayBottom, 0, 1) * 100}%, transparent) 100%)`

    const content = hasContent ? (
        <motion.div
            // Keyed by the text itself: slides that share a caption and tags
            // keep the same element instead of re-animating on every change.
            key={`${slideCaption}|${slideTags.join("|")}`}
            initial={
                animateContent && view.id > 0 && !isStatic
                    ? { opacity: 0, y: 8 }
                    : false
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                display: "flex",
                flexDirection: contentLayout === "split" ? "row" : "column",
                alignItems: contentLayout === "split" ? "center" : "flex-start",
                gap: contentGap,
                width: "100%",
                pointerEvents: "none",
            }}
        >
            {hasCaption && (
                <p
                    style={{
                        margin: 0,
                        color: captionColor,
                        fontFamily: "'Aspekta Variable', Inter, sans-serif",
                        ...captionFont,
                    }}
                >
                    {slideCaption}
                </p>
            )}
            {hasTags && (
                <div
                    role="list"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: tagGap,
                        flex: contentLayout === "split" ? "1 1 0" : "0 0 auto",
                        minWidth: 0,
                        alignSelf: contentLayout === "split" ? undefined : "stretch",
                        justifyContent:
                            tagAlign === "center"
                                ? "center"
                                : tagAlign === "right"
                                  ? "flex-end"
                                  : "flex-start",
                    }}
                >
                    {slideTags.map((tag, index) => (
                        <span
                            key={`${tag}-${index}`}
                            role="listitem"
                            style={{
                                padding: tagPadding,
                                borderRadius: tagRadius,
                                background: tagBackground,
                                color: tagColor,
                                backdropFilter: tagBlur
                                    ? `blur(${tagBlur}px)`
                                    : undefined,
                                WebkitBackdropFilter: tagBlur
                                    ? `blur(${tagBlur}px)`
                                    : undefined,
                                fontFamily:
                                    "'Aspekta Variable', Inter, sans-serif",
                                whiteSpace: "nowrap",
                                ...tagFont,
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    ) : null

    const arrowButton = (direction: "prev" | "next", disabled: boolean) => (
        <button
            type="button"
            aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
            aria-disabled={disabled}
            onClick={() => {
                if (disabled) return
                direction === "prev" ? goPrev() : goNext()
            }}
            style={{
                all: "unset",
                boxSizing: "border-box",
                width: arrows.size,
                height: arrows.size,
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: arrows.radius,
                background: arrows.background,
                color: arrows.color,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
                pointerEvents: "auto",
                ...(arrowsSides
                    ? {
                          position: "absolute",
                          top: "50%",
                          transform: "translateY(-50%)",
                          [direction === "prev" ? "left" : "right"]:
                              arrows.inset,
                      }
                    : {}),
            }}
        >
            <svg
                width={arrows.iconSize}
                height={arrows.iconSize}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={arrows.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{
                    transform:
                        direction === "next" ? "rotate(180deg)" : undefined,
                }}
            >
                <path d="M10 3 5 8l5 5" />
            </svg>
        </button>
    )

    const progressBars = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: progress.gap,
                width: progress.stretch ? "100%" : undefined,
            }}
        >
            {slides.map((_, index) => {
                const bar = (
                    <div
                        style={{
                            position: "relative",
                            width: progress.stretch
                                ? "100%"
                                : progress.barWidth,
                            height: progress.barHeight,
                            borderRadius: progress.radius,
                            background: progress.trackColor,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            ref={(el) => {
                                fillRefs.current[index] = el
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: progress.radius,
                                background: progress.activeColor,
                                transform: fillTransform(
                                    barProgress(index, current, activeProgress)
                                ),
                                willChange: "transform",
                            }}
                        />
                    </div>
                )
                const itemStyle: CSSProperties = progress.stretch
                    ? { flex: "1 1 0", minWidth: 0 }
                    : { flex: "0 0 auto" }

                return progress.clickable ? (
                    <button
                        key={index}
                        type="button"
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={index === current}
                        onClick={() => goTo(index, index > current ? 1 : -1)}
                        style={{
                            all: "unset",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            padding: "8px 0",
                            pointerEvents: "auto",
                            ...itemStyle,
                        }}
                    >
                        {bar}
                    </button>
                ) : (
                    <div key={index} aria-hidden="true" style={itemStyle}>
                        {bar}
                    </div>
                )
            })}
        </div>
    )

    const contentOnBottom = contentPosition === "bottom"

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            tabIndex={multiple ? 0 : undefined}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={endDrag}
            onPointerEnter={pauseOnHover ? () => setIsHovered(true) : undefined}
            onPointerLeave={() => {
                if (pauseOnHover) setIsHovered(false)
                if (isDragging) endDrag()
            }}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background,
                borderRadius: radius,
                touchAction: swipe ? "pan-y" : undefined,
                cursor: canSwipe
                    ? isDragging
                        ? "grabbing"
                        : "grab"
                    : undefined,
                userSelect: canSwipe ? "none" : undefined,
                outline: "none",
            }}
        >
            {/* Keyed array so each slide keeps its element when it switches
                from entering to leaving, instead of remounting. */}
            {[
                view.prev !== null && slides[view.prev] ? (
                    <SlideLayer
                        key={`slide-${view.prev}`}
                        slide={slides[view.prev]}
                        role="exit"
                        effect={effectiveEffect}
                        direction={view.direction}
                        duration={durationSec}
                        ease={ease}
                        animate
                        media={media}
                        parallaxY={parallaxY}
                        parallaxActive={parallaxActive}
                        hoverScale={linkHovered ? 1 + linkHover.zoom : 1}
                        hoverDuration={linkHover.duration}
                    />
                ) : null,
                <SlideLayer
                    key={`slide-${current}`}
                    slide={slide}
                    role="enter"
                    effect={effectiveEffect}
                    direction={view.direction}
                    duration={durationSec}
                    ease={ease}
                    animate={view.id > 0 && effectiveEffect !== "none"}
                    media={media}
                    parallaxY={parallaxY}
                    parallaxActive={parallaxActive}
                    hoverScale={linkHovered ? 1 + linkHover.zoom : 1}
                    hoverDuration={linkHover.duration}
                />,
            ]}

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: overlay,
                    zIndex: 3,
                    pointerEvents: "none",
                }}
            />

            {slide?.link && linkHover.overlayOpacity > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 3,
                        background: linkHover.overlayColor,
                        opacity: overLink
                            ? clamp(linkHover.overlayOpacity, 0, 1)
                            : 0,
                        transition: `opacity ${linkHover.duration}s ease-out`,
                        pointerEvents: "none",
                    }}
                />
            )}

            {slide?.link && (
                <a
                    key={`link-${current}`}
                    href={slide.link}
                    onPointerEnter={() => setOverLink(true)}
                    onPointerLeave={() => setOverLink(false)}
                    aria-label={
                        slide.image?.alt || caption || `Slide ${current + 1}`
                    }
                    onClick={(event) => {
                        if (didSwipe.current) event.preventDefault()
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 4,
                        cursor: canSwipe && isDragging ? "grabbing" : "pointer",
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 5,
                    boxSizing: "border-box",
                    padding,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: contentOnBottom
                        ? "flex-end"
                        : "space-between",
                    gap: contentGap,
                    pointerEvents: "none",
                }}
            >
                {!contentOnBottom && content}
                {contentOnBottom && content}
                {showRow && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: arrows.gap,
                            width: "100%",
                            justifyContent: "flex-end",
                            // Keep the row pinned to the bottom even when there is no caption or
                            // tags above it.
                            marginTop: "auto",
                        }}
                    >
                        {showProgress && (
                            <div
                                style={{
                                    flex: "1 1 auto",
                                    minWidth: 0,
                                    display: "flex",
                                    justifyContent:
                                        progress.align === "start"
                                            ? "flex-start"
                                            : progress.align === "center"
                                              ? "center"
                                              : "flex-end",
                                }}
                            >
                                {progressBars}
                            </div>
                        )}
                        {arrowsBottom && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: arrows.gap,
                                    flex: "none",
                                }}
                            >
                                {arrowButton("prev", atStart)}
                                {arrowButton("next", atEnd)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {arrowsSides && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 6,
                        pointerEvents: "none",
                    }}
                >
                    {arrowButton("prev", atStart)}
                    {arrowButton("next", atEnd)}
                </div>
            )}

            <span aria-live="polite" style={visuallyHidden}>
                {`Slide ${current + 1} of ${count}`}
            </span>
        </div>
    )
}

OmniSlideshow.displayName = "Omni Slideshow"

/* ----------------------------- Property controls --------------------------- */

/*
 * Property panel order, top to bottom:
 * content (Slides) > behaviour (Playback, Transition) > look (Image, Caption,
 * Tags, Content Layout) > navigation (Progress, Arrows) > container
 * (Background, Radius) > accessibility.
 */
addPropertyControls(OmniSlideshow, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        description:
            "Add as many slides as you need. A slide with no caption or tags of its own uses the shared ones from the Caption and Tags groups.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    placeholder: "Uses shared caption",
                    displayTextArea: true,
                },
                tags: {
                    type: ControlType.Array,
                    title: "Tags",
                    description: "Leave empty to use the shared tags.",
                    control: { type: ControlType.String },
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Makes the whole slide clickable.",
                },
            },
        },
        defaultValue: DEFAULT_SLIDES as any,
    },

    playback: {
        type: ControlType.Object,
        title: "Playback",
        buttonTitle: "Playback",
        icon: "interaction",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                description: "Advance to the next slide automatically.",
                defaultValue: true,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                description: "How long each slide stays on screen.",
                defaultValue: 4,
                min: 0.5,
                max: 30,
                step: 0.5,
                unit: "s",
                hidden: ({ autoplay }) => !autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                description:
                    "Freeze the timer while the pointer is over the slideshow.",
                defaultValue: false,
                hidden: ({ autoplay }) => !autoplay,
            },
            pauseOffscreen: {
                type: ControlType.Boolean,
                title: "Pause Offscreen",
                description:
                    "Stop the timer while the slideshow is scrolled out of view, so visitors do not miss slides.",
                defaultValue: true,
                hidden: ({ autoplay }) => !autoplay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                description:
                    "Return to the first slide after the last. When off, autoplay stops on the final slide.",
                defaultValue: true,
            },
            swipe: {
                type: ControlType.Boolean,
                title: "Swipe",
                description:
                    "Let visitors drag or swipe left and right to change slides. The cursor becomes a grab hand over the slideshow (a pointer over slides with a link).",
                defaultValue: true,
            },
            startSlide: {
                type: ControlType.Number,
                title: "Start Slide",
                description: "Which slide shows first (1 is the first slide).",
                defaultValue: 1,
                min: 1,
                step: 1,
                displayStepper: true,
            },
        },
    },

    transition: {
        type: ControlType.Object,
        title: "Transition",
        buttonTitle: "Transition",
        icon: "effect",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                defaultValue: "fade",
                options: [
                    "fade",
                    "slide",
                    "slideUp",
                    "cover",
                    "wipe",
                    "zoom",
                    "blur",
                    "none",
                ],
                optionTitles: [
                    "Fade",
                    "Slide",
                    "Slide Up",
                    "Cover",
                    "Wipe",
                    "Zoom",
                    "Blur",
                    "None",
                ],
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                description: "How long the change between slides takes.",
                defaultValue: 0.8,
                min: 0.1,
                max: 3,
                step: 0.1,
                unit: "s",
                hidden: ({ effect }) => effect === "none",
            },
            ease: {
                type: ControlType.Enum,
                title: "Easing",
                description: "The acceleration curve of the transition.",
                defaultValue: "easeInOut",
                options: EASE_OPTIONS,
                optionTitles: [
                    "Ease In Out",
                    "Ease Out",
                    "Ease In",
                    "Linear",
                    "Circ Out",
                    "Back Out",
                ],
                hidden: ({ effect }) => effect === "none",
            },
        },
    },

    media: {
        type: ControlType.Object,
        title: "Image",
        buttonTitle: "Image",
        icon: "effect",
        controls: {
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                description:
                    "Cover fills the area and crops; Contain shows the whole image.",
                defaultValue: "cover",
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                displaySegmentedControl: true,
            },
            position: {
                type: ControlType.Enum,
                title: "Focus",
                description:
                    "Which part of the image stays visible when it is cropped.",
                defaultValue: "center",
                options: ["center", "top", "bottom", "left", "right"],
                optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
            },
            scale: {
                type: ControlType.Number,
                title: "Zoom",
                description: "Enlarges every image slightly. 1 is no zoom.",
                defaultValue: 1.1,
                min: 1,
                max: 2,
                step: 0.01,
            },
            parallax: {
                type: ControlType.Boolean,
                title: "Parallax",
                description: "Images drift slower than the page as you scroll.",
                defaultValue: true,
            },
            parallaxAmount: {
                type: ControlType.Number,
                title: "Parallax Distance",
                description:
                    "How far images travel while scrolling. Higher is more dramatic.",
                defaultValue: 120,
                min: 0,
                max: 400,
                step: 1,
                unit: "px",
                hidden: ({ parallax }) => !parallax,
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay Color",
                description:
                    "A gradient tint over the image that keeps text readable.",
                defaultValue: "#0E0E0E",
            },
            overlayTop: {
                type: ControlType.Number,
                title: "Overlay Start",
                description:
                    "Overlay strength where the gradient begins (top by default).",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.01,
            },
            overlayBottom: {
                type: ControlType.Number,
                title: "Overlay End",
                description:
                    "Overlay strength where the gradient ends (bottom by default).",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.01,
            },
            overlayAngle: {
                type: ControlType.Number,
                title: "Overlay Angle",
                description:
                    "Gradient direction. 180 runs top to bottom, 90 runs left to right.",
                defaultValue: 180,
                min: 0,
                max: 360,
                step: 1,
                unit: "deg",
            },
        },
    },

    linkHover: {
        type: ControlType.Object,
        title: "Link Hover",
        buttonTitle: "Link Hover",
        icon: "interaction",
        description:
            "Hover effect for slides that have a link. Slides without a link are not affected.",
        controls: {
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                description:
                    "Extra image zoom while the pointer is over the slide.",
                defaultValue: 0.06,
                min: 0,
                max: 0.3,
                step: 0.01,
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Tint",
                defaultValue: "#0E0E0E",
            },
            overlayOpacity: {
                type: ControlType.Number,
                title: "Tint Opacity",
                description: "Strength of the tint on hover. 0 turns it off.",
                defaultValue: 0.25,
                min: 0,
                max: 1,
                step: 0.01,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                description: "How quickly the hover effect plays.",
                defaultValue: 0.4,
                min: 0.05,
                max: 1.5,
                step: 0.05,
                unit: "s",
            },
        },
    },

    caption: {
        type: ControlType.Object,
        title: "Caption",
        buttonTitle: "Caption",
        icon: "object",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            text: {
                type: ControlType.String,
                title: "Shared Text",
                description:
                    "Shown on every slide that has no caption of its own.",
                defaultValue: "Enter your caption here..",
                displayTextArea: true,
                hidden: ({ show }) => !show,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0.01em",
                    lineHeight: "1.2em",
                },
                hidden: ({ show }) => !show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: ({ show }) => !show,
            },
        },
    },

    tags: {
        type: ControlType.Object,
        title: "Tags",
        buttonTitle: "Tags",
        icon: "object",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                description: "Aligns the tags within the available space.",
                defaultValue: "right",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Middle", "Right"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            items: {
                type: ControlType.Array,
                title: "Shared Tags",
                description:
                    "Shown on every slide that has no tags of its own.",
                control: { type: ControlType.String },
                defaultValue: DEFAULT_TAGS,
                hidden: ({ show }) => !show,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0.01em",
                    lineHeight: "1.2em",
                },
                hidden: ({ show }) => !show,
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
                hidden: ({ show }) => !show,
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(255, 255, 255, 0.14)",
                hidden: ({ show }) => !show,
            },
            blur: {
                type: ControlType.Number,
                title: "Background Blur",
                description:
                    "Blurs the image behind each tag (frosted glass look).",
                defaultValue: 4,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 2,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                description: "Left and right padding inside each tag.",
                defaultValue: 12,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                description: "Top and bottom padding inside each tag.",
                defaultValue: 6,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Space between tags.",
                defaultValue: 8,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Content Layout",
        buttonTitle: "Content Layout",
        icon: "object",
        controls: {
            arrangement: {
                type: ControlType.Enum,
                title: "Arrangement",
                description:
                    "Split puts the caption left and tags right. Stacked puts tags under the caption.",
                defaultValue: "split",
                options: ["split", "stacked"],
                optionTitles: ["Split", "Stacked"],
                displaySegmentedControl: true,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                description:
                    "Whether the caption and tags sit at the top or the bottom.",
                defaultValue: "top",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                displaySegmentedControl: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Space between the caption and the tags.",
                defaultValue: 17,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                description:
                    "Left and right inset of the caption, tags, progress and arrows from the slideshow edges.",
                defaultValue: 64,
                min: 0,
                max: 300,
                step: 1,
                unit: "px",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                description:
                    "Top and bottom inset of the caption, tags, progress and arrows from the slideshow edges.",
                defaultValue: 24,
                min: 0,
                max: 300,
                step: 1,
                unit: "px",
            },
            animateText: {
                type: ControlType.Boolean,
                title: "Animate Text",
                description:
                    "Fade the caption and tags in when the slide changes.",
                defaultValue: true,
            },
        },
    },

    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        description:
            "Show a bar per slide. The active bar fills as autoplay counts down.",
        defaultValue: true,
    },
    progress: {
        type: ControlType.Object,
        title: "Progress Style",
        buttonTitle: "Progress Style",
        icon: "interaction",
        hidden: ({ showProgress }) => !showProgress,
        controls: {
            align: {
                type: ControlType.Enum,
                title: "Align",
                defaultValue: "end",
                options: ["start", "center", "end"],
                optionTitles: ["Start", "Center", "End"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            stretch: {
                type: ControlType.Boolean,
                title: "Stretch",
                description:
                    "Bars share the full available width instead of using a fixed width.",
                defaultValue: false,
            },
            barWidth: {
                type: ControlType.Number,
                title: "Bar Width",
                defaultValue: 56,
                min: 4,
                max: 400,
                step: 1,
                unit: "px",
                hidden: ({ stretch }) => stretch,
            },
            barHeight: {
                type: ControlType.Number,
                title: "Bar Height",
                defaultValue: 6,
                min: 1,
                max: 40,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Space between bars.",
                defaultValue: 8,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 0,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Fill",
                description: "Color of the progress as it fills.",
                defaultValue: "#FFFFFF",
            },
            trackColor: {
                type: ControlType.Color,
                title: "Track",
                description: "Color of the empty bar behind the fill.",
                defaultValue: "rgba(0, 0, 0, 0.3)",
            },
            clickable: {
                type: ControlType.Boolean,
                title: "Clickable",
                description: "Clicking a bar jumps to that slide.",
                defaultValue: true,
            },
        },
    },

    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        description: "Show previous and next buttons.",
        defaultValue: true,
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrow Style",
        buttonTitle: "Arrow Style",
        icon: "interaction",
        hidden: ({ showArrows }) => !showArrows,
        controls: {
            position: {
                type: ControlType.Enum,
                title: "Position",
                description:
                    "Bottom places the buttons beside the progress bars. Sides centers them on the left and right edges.",
                defaultValue: "bottom",
                options: ["bottom", "sides"],
                optionTitles: ["Bottom", "Sides"],
                displaySegmentedControl: true,
            },
            inset: {
                type: ControlType.Number,
                title: "Side Inset",
                description: "Distance from the left and right edges.",
                defaultValue: 24,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                hidden: ({ position }) => position !== "sides",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Space between the two buttons.",
                defaultValue: 8,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: ({ position }) => position === "sides",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 44,
                min: 20,
                max: 96,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 32,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#F6F6F4",
            },
            color: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#0E0E0E",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 16,
                min: 8,
                max: 48,
                step: 1,
                unit: "px",
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Icon Stroke",
                defaultValue: 2,
                min: 1,
                max: 6,
                step: 0.5,
            },
        },
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        description:
            "Shown behind the images, for example while they load or with Contain fit.",
        defaultValue: "#0E0E0E",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        description: "Read aloud by screen readers to describe the slideshow.",
        defaultValue: "Projects slideshow",
        preventLocalization: true,
    },
})
