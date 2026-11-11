import * as React from "react"
import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    cubicBezier,
    easeInOut,
    useReducedMotion,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Define TypeScript props for the component
interface ScrollRevealProps {
    image: any // Supports ResponsiveImage object
    imageUrl?: any // Backward compatibility / fallback
    altText: string
    // Framer does not pass the image dialog's focal point to code components,
    // so the component exposes its own (applied via CSS object-position)
    focalPoint:
        | "center"
        | "top"
        | "bottom"
        | "left"
        | "right"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
        | "custom"
    focalX: number
    focalY: number
    showImageOnCanvas: boolean
    revealMode: "auto" | "scrub"
    revealType:
        | "solid"
        | "double"
        | "triple"
        | "columns"
        | "rows"
        | "split-doors"
        | "grid"
        | "clip"
    // direction is split into per-group sub-props so Framer can show only relevant options
    direction:
        | "left-to-right"
        | "right-to-left"
        | "top-to-bottom"
        | "bottom-to-top"
        | "center-out" // kept for type compat
    directionCurtain:
        | "left-to-right"
        | "right-to-left"
        | "top-to-bottom"
        | "bottom-to-top"
    directionColumns: "top-to-bottom" | "bottom-to-top"
    directionRows: "left-to-right" | "right-to-left"
    directionDoors: "left-to-right" | "top-to-bottom"
    directionClip:
        | "left-to-right"
        | "right-to-left"
        | "top-to-bottom"
        | "bottom-to-top"
        | "center-out"
    directionScrub:
        | "left-to-right"
        | "right-to-left"
        | "top-to-bottom"
        | "bottom-to-top"
    scrubStyle: "clip" | "curtain" | "columns"
    scrubStart: number
    scrubEnd: number
    scrubSmoothing: number
    scrubEasing: "easeOut" | "easeInOut" | "circOut" | "backOut" | "customBezier"
    scrubPanelCount: number
    rowCount: number
    scrubColumnStagger: number
    stripTransparency: boolean
    stripTransparencyMin: number
    parallax: boolean
    parallaxSpeed: number
    parallaxDirection: "vertical" | "horizontal"
    scrubCurtainColor: string
    curtainColor1: string
    curtainColor2: string
    curtainColor3: string
    duration: number
    delay: number
    imageZoomStart: number
    imageZoomDuration: number
    easing: "easeOut" | "easeInOut" | "circOut" | "backOut" | "customBezier"
    triggerOnce: boolean
    viewportMargin: "bottom" | "quarter" | "middle" | "upper" | "top"
    overlayOpacity: number
    overlayColor: string
    borderRadius: number
    aspectRatio: "auto" | "16-9" | "4-3" | "1-1"
    panelCount: number
    staggerDelay: number
    width: number | string
    height: number | string
}

export default function ScrollReveal(props: ScrollRevealProps) {
    const {
        image,
        imageUrl,
        altText = "Scroll Reveal Image",
        focalPoint = "center",
        focalX = 50,
        focalY = 50,
        showImageOnCanvas = true,
        revealMode = "auto",
        revealType = "double",
        directionCurtain = "left-to-right",
        directionColumns = "bottom-to-top",
        directionRows = "left-to-right",
        directionDoors = "left-to-right",
        directionClip = "left-to-right",
        directionScrub = "bottom-to-top",
        direction: _directionUnused = "left-to-right", // kept for type compat
        curtainColor1 = "#111111",
        curtainColor2 = "#3B82F6",
        curtainColor3 = "#FFFFFF",
        duration = 1.0,
        delay = 0.1,
        imageZoomStart = 1.15,
        imageZoomDuration = 1.6,
        easing = "customBezier",
        triggerOnce = true,
        viewportMargin = "middle",
        overlayOpacity = 0.2,
        overlayColor = "#000000",
        borderRadius = 16,
        aspectRatio = "auto",
        panelCount = 3,
        staggerDelay = 0.15,
        scrubStyle = "clip" as "clip" | "curtain" | "columns",
        scrubStart = 0.0,
        scrubEnd = 0.8,
        scrubSmoothing = 0.55,
        scrubEasing = "customBezier",
        scrubPanelCount = 3,
        rowCount = 3,
        scrubColumnStagger = 0.08,
        stripTransparency = false,
        stripTransparencyMin = 0.75,
        parallax = false,
        parallaxSpeed = 0.25,
        parallaxDirection = "vertical",
        scrubCurtainColor = "#111111",
    } = props

    // Resolve the active direction from the correct sub-control for the current mode
    const activeDirection = React.useMemo(() => {
        if (revealMode === "scrub") return directionScrub
        switch (revealType) {
            case "columns":
                return directionColumns
            case "rows":
                return directionRows
            case "split-doors":
                return directionDoors
            case "clip":
                return directionClip
            default:
                return directionCurtain // solid, double, triple
        }
    }, [
        revealMode,
        revealType,
        directionCurtain,
        directionColumns,
        directionRows,
        directionDoors,
        directionClip,
        directionScrub,
    ])

    const containerRef = React.useRef<HTMLDivElement>(null)

    // ─── Scroll Scrub: useScroll tracks element position directly ───────────────
    // offset[0] = "start end" → scrollYProgress=0 when element top hits viewport bottom
    // offset[1] = "end start" → scrollYProgress=1 when element bottom hits viewport top
    // We clamp the user's scrubStart/scrubEnd within that range.
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    // Map scroll progress to a 0→1 reveal value clamped by scrubStart/scrubEnd
    const scrubProgressLinear = useTransform(
        scrollYProgress,
        [scrubStart, Math.max(scrubStart + 0.01, scrubEnd)],
        [0, 1],
        { clamp: true }
    )
    const scrubEaseFn = React.useMemo(() => {
        switch (scrubEasing) {
            case "easeInOut":
                return easeInOut
            case "circOut":
                return cubicBezier(0, 0.55, 0.45, 1)
            case "backOut":
                return cubicBezier(0.34, 1.56, 0.64, 1)
            case "customBezier":
                return cubicBezier(0.76, 0, 0.24, 1)
            case "easeOut":
            default:
                return cubicBezier(0.25, 1, 0.5, 1)
        }
    }, [scrubEasing])
    const scrubProgressEased = useTransform(
        scrubProgressLinear,
        [0, 1],
        [0, 1],
        { ease: scrubEaseFn, clamp: true }
    )
    const scrubProgress = useSpring(scrubProgressEased, {
        stiffness: 140 + (1 - scrubSmoothing) * 360,
        damping: 18 + scrubSmoothing * 30,
        mass: 0.9 + scrubSmoothing * 0.35,
    })
    const prefersReducedMotion = useReducedMotion()
    // Static contexts (Framer canvas, exports) must not run animations or
    // continuous effects — everything renders as a fixed state instead.
    const isStatic = useIsStaticRenderer()
    const parallaxRawOffset = useTransform(scrollYProgress, [0, 1], [-1, 1], {
        clamp: true,
    })
    const isParallaxActive = parallax && !prefersReducedMotion && !isStatic
    const parallaxMaxTravel = isParallaxActive
        ? Math.abs(parallaxSpeed) * 120
        : 0
    const parallaxTargetTravel = useTransform(parallaxRawOffset, (v) =>
        isParallaxActive ? v * parallaxSpeed * 120 : 0
    )
    const parallaxOffset = useSpring(parallaxTargetTravel, {
        stiffness: 140 + (1 - scrubSmoothing) * 360,
        damping: 18 + scrubSmoothing * 30,
        mass: 0.9 + scrubSmoothing * 0.35,
    })
    // Clamp spring output so translation never exceeds the intended travel range.
    const parallaxOffsetClamped = useTransform(parallaxOffset, (v) =>
        Math.max(-parallaxMaxTravel, Math.min(parallaxMaxTravel, v))
    )
    const parallaxX = useTransform(parallaxOffsetClamped, (v) =>
        parallaxDirection === "horizontal" ? v : 0
    )
    const parallaxY = useTransform(parallaxOffsetClamped, (v) =>
        parallaxDirection === "vertical" ? v : 0
    )
    // Include spring overshoot headroom plus a small safety buffer.
    const parallaxOverscanPx = isParallaxActive
        ? parallaxMaxTravel * 1.15 + 8
        : 0
    // Negative margins keep the oversized layer centered (overhanging
    // equally on both sides) and flexShrink: 0 stops the row-direction
    // flex parent from shrinking the extra width back to 100%, which
    // caused visible background strips at the edges during horizontal
    // parallax.
    const parallaxOverscanStyle: React.CSSProperties = isParallaxActive
        ? parallaxDirection === "horizontal"
            ? {
                  width: `calc(100% + ${parallaxOverscanPx * 2}px)`,
                  marginLeft: `${-parallaxOverscanPx}px`,
                  marginRight: `${-parallaxOverscanPx}px`,
                  flexShrink: 0,
              }
            : {
                  height: `calc(100% + ${parallaxOverscanPx * 2}px)`,
                  marginTop: `${-parallaxOverscanPx}px`,
                  marginBottom: `${-parallaxOverscanPx}px`,
                  flexShrink: 0,
              }
        : {}
    const parallaxMotionStyle = { x: parallaxX, y: parallaxY }
    const scrubOverlayOpacityValue = useTransform(
        scrubProgress,
        [0, 1],
        [overlayOpacity, 0]
    )
    const scrubImageScaleValue = useTransform(
        scrubProgress,
        [0, 1],
        [imageZoomStart, 1]
    )

    // Scrub clip-path motionValues — map 0→1 to hidden→fully-visible
    const scrubClipLTR = useTransform(
        scrubProgress,
        [0, 1],
        ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]
    )
    const scrubClipRTL = useTransform(
        scrubProgress,
        [0, 1],
        ["inset(0% 0% 0% 100%)", "inset(0% 0% 0% 0%)"]
    )
    const scrubClipTTB = useTransform(
        scrubProgress,
        [0, 1],
        ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"]
    )
    const scrubClipBTT = useTransform(
        scrubProgress,
        [0, 1],
        ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"]
    )

    // Scrub curtain translate motionValues — map 0→1 to covering→fully-slid-away
    const scrubCurtainLTR = useTransform(scrubProgress, [0, 1], ["0%", "100%"])
    const scrubCurtainRTL = useTransform(scrubProgress, [0, 1], ["0%", "-100%"])
    const scrubCurtainTTB = useTransform(scrubProgress, [0, 1], ["0%", "100%"])
    const scrubCurtainBTT = useTransform(scrubProgress, [0, 1], ["0%", "-100%"])

    // Select the correct motionValue pair based on scrubStyle + direction
    const getScrubClipValue = () => {
        switch (activeDirection) {
            case "right-to-left":
                return scrubClipRTL
            case "top-to-bottom":
                return scrubClipTTB
            case "bottom-to-top":
                return scrubClipBTT
            default:
                return scrubClipLTR
        }
    }
    const getScrubCurtainTranslate = () => {
        // returns { axis: "x" | "y", motionValue }
        switch (activeDirection) {
            case "right-to-left":
                return { axis: "x" as const, val: scrubCurtainRTL }
            case "top-to-bottom":
                return { axis: "y" as const, val: scrubCurtainTTB }
            case "bottom-to-top":
                return { axis: "y" as const, val: scrubCurtainBTT }
            default:
                return { axis: "x" as const, val: scrubCurtainLTR }
        }
    }

    // ─── Scrub Split Columns ─────────────────────────────────────────────────────
    // Pre-declare 8 column progress motionValues (hooks must be at top level, not in loops).
    // Each uses the function form of useTransform so scrubColumnStagger + activeDirection
    // are captured from the React closure and updated on every re-render when props change.
    //
    // Column i starts revealing when scrubProgress > i * scrubColumnStagger,
    // so columns appear left-to-right with a gentle waterfall effect.
    //
    // Formula: colProgress_i = clamp((scrubProgress - i * stagger) / (1 - i * stagger), 0, 1)
    const scrubCol0 = useTransform(scrubProgress, (p: number) => {
        const o = 0 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol1 = useTransform(scrubProgress, (p: number) => {
        const o = 1 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol2 = useTransform(scrubProgress, (p: number) => {
        const o = 2 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol3 = useTransform(scrubProgress, (p: number) => {
        const o = 3 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol4 = useTransform(scrubProgress, (p: number) => {
        const o = 4 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol5 = useTransform(scrubProgress, (p: number) => {
        const o = 5 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol6 = useTransform(scrubProgress, (p: number) => {
        const o = 6 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })
    const scrubCol7 = useTransform(scrubProgress, (p: number) => {
        const o = 7 * scrubColumnStagger
        return Math.max(0, Math.min(1, (p - o) / Math.max(0.01, 1 - o)))
    })

    // Column axis translates — compute BOTH X and Y motionValues unconditionally.
    // We then choose which axis drives each panel in JSX based on activeDirection.
    const colSlideX = (p: number) => {
        if (activeDirection === "left-to-right") return `${p * 100}%`
        if (activeDirection === "right-to-left") return `${p * -100}%`
        return "0%"
    }
    const colSlideY = (p: number) => {
        if (activeDirection === "top-to-bottom") return `${p * 100}%`
        if (activeDirection === "bottom-to-top") return `${p * -100}%`
        return "0%"
    }
    const scrubColX0 = useTransform(scrubCol0, colSlideX)
    const scrubColX1 = useTransform(scrubCol1, colSlideX)
    const scrubColX2 = useTransform(scrubCol2, colSlideX)
    const scrubColX3 = useTransform(scrubCol3, colSlideX)
    const scrubColX4 = useTransform(scrubCol4, colSlideX)
    const scrubColX5 = useTransform(scrubCol5, colSlideX)
    const scrubColX6 = useTransform(scrubCol6, colSlideX)
    const scrubColX7 = useTransform(scrubCol7, colSlideX)
    const scrubColY0 = useTransform(scrubCol0, colSlideY)
    const scrubColY1 = useTransform(scrubCol1, colSlideY)
    const scrubColY2 = useTransform(scrubCol2, colSlideY)
    const scrubColY3 = useTransform(scrubCol3, colSlideY)
    const scrubColY4 = useTransform(scrubCol4, colSlideY)
    const scrubColY5 = useTransform(scrubCol5, colSlideY)
    const scrubColY6 = useTransform(scrubCol6, colSlideY)
    const scrubColY7 = useTransform(scrubCol7, colSlideY)
    // Indexed arrays for clean JSX access
    const scrubColXValues = [
        scrubColX0,
        scrubColX1,
        scrubColX2,
        scrubColX3,
        scrubColX4,
        scrubColX5,
        scrubColX6,
        scrubColX7,
    ]
    const scrubColYValues = [
        scrubColY0,
        scrubColY1,
        scrubColY2,
        scrubColY3,
        scrubColY4,
        scrubColY5,
        scrubColY6,
        scrubColY7,
    ]

    // ─── Manual IntersectionObserver (used for all non-scrub revealTypes) ───────
    // Percentage rootMargin is silently ignored by browsers when root=null (viewport),
    // so we convert the enum to pixel values derived from the live viewport height.
    const [isInView, setIsInView] = React.useState(false)

    React.useEffect(() => {
        const element = containerRef.current
        if (!element || typeof window === "undefined" || isStatic) return

        // Reset reveal state whenever triggerOnce or position changes
        if (!triggerOnce) setIsInView(false)

        const vh = window.innerHeight
        const offsetMap: Record<string, number> = {
            bottom: 0, // fires the moment element enters viewport bottom (0px shrink)
            quarter: vh * 0.25, // fires when element is 25 % above the bottom
            middle: vh * 0.5, // fires at viewport centre
            upper: vh * 0.75, // fires 75 % up
            top: vh * 0.9, // fires near the very top
        }
        const offset = offsetMap[viewportMargin] ?? vh * 0.5
        // Negative bottom margin shrinks the intersection root upward
        const rootMargin = `0px 0px -${Math.round(offset)}px 0px`

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    if (triggerOnce) observer.disconnect()
                } else if (!triggerOnce) {
                    setIsInView(false)
                }
            },
            { rootMargin }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [viewportMargin, triggerOnce, isStatic])

    // ─── Pixel-snapped strip geometry ────────────────────────────────────────
    // Percentage-based strip positions can round to different device pixels,
    // leaving intermittent 1px hairline gaps between strips that come and go
    // with container size. Measuring the container and snapping every strip
    // boundary to the device-pixel grid guarantees exact tiling: adjacent
    // strips share the exact same edge coordinate.
    const [measuredSize, setMeasuredSize] = React.useState<{
        width: number
        height: number
    } | null>(null)
    React.useEffect(() => {
        const element = containerRef.current
        if (!element || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(([entry]) => {
            setMeasuredSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            })
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    // Start/size for strip i of count along the given axis. Falls back to
    // percentages until the container has been measured (SSR / first paint).
    const getStripRect = (
        i: number,
        count: number,
        axis: "x" | "y",
        overlapPx: number
    ): { start: string; size: string } => {
        const total = axis === "x" ? measuredSize?.width : measuredSize?.height
        // First/last strips bleed 1px past the container edge (clipped by
        // overflow: hidden) so compositing-layer rounding can't leak a
        // hairline of the image at the container borders.
        const lead = i === 0 ? 1 : 0
        const tail = i === count - 1 ? 1 : 0
        if (!total) {
            const pct = 100 / count
            const extra =
                (overlapPx > 0 && i < count - 1 ? overlapPx : 0) + lead + tail
            return {
                start: lead
                    ? `calc(${i * pct}% - ${lead}px)`
                    : `${i * pct}%`,
                size: extra > 0 ? `calc(${pct}% + ${extra}px)` : `${pct}%`,
            }
        }
        const dpr =
            (typeof window !== "undefined" && window.devicePixelRatio) || 1
        const snap = (v: number) => Math.round(v * dpr) / dpr
        const startPx = snap((i * total) / count)
        const endPx = snap(((i + 1) * total) / count)
        const overlap = i < count - 1 ? overlapPx : 0
        return {
            start: `${startPx - lead}px`,
            size: `${endPx - startPx + overlap + lead + tail}px`,
        }
    }

    // Static contexts (canvas, export) render a fixed state with no
    // animations: fully revealed when "On Canvas: Image" is chosen (curtain
    // layers are skipped entirely), or the pre-reveal state otherwise. In
    // both cases initial and animate values are equal, so nothing animates.
    const revealForCanvas = isStatic && showImageOnCanvas
    const shouldAnimate = isStatic ? revealForCanvas : isInView

    // Resolve easing function/bezier curve
    const getEasing = () => {
        switch (easing) {
            case "easeInOut":
                return "easeInOut"
            case "circOut":
                return [0, 0.55, 0.45, 1]
            case "backOut":
                return [0.34, 1.56, 0.64, 1]
            case "customBezier":
                return [0.76, 0, 0.24, 1] // Premium Editorial Easing
            case "easeOut":
            default:
                return [0.25, 1, 0.5, 1]
        }
    }

    const resolvedEasing: any = getEasing()

    // Determine target translate properties for curtains based on direction
    const getCurtainAnimation = (curtainNum: 1 | 2 | 3) => {
        const curtainDelay = delay + (curtainNum - 1) * (duration * 0.25)

        switch (activeDirection) {
            case "right-to-left":
                return {
                    initial: { x: "0%" },
                    animate: shouldAnimate ? { x: "-100%" } : { x: "0%" },
                    transition: {
                        duration,
                        delay: curtainDelay,
                        ease: resolvedEasing,
                    },
                }
            case "top-to-bottom":
                return {
                    initial: { y: "0%" },
                    animate: shouldAnimate ? { y: "100%" } : { y: "0%" },
                    transition: {
                        duration,
                        delay: curtainDelay,
                        ease: resolvedEasing,
                    },
                }
            case "bottom-to-top":
                return {
                    initial: { y: "0%" },
                    animate: shouldAnimate ? { y: "-100%" } : { y: "0%" },
                    transition: {
                        duration,
                        delay: curtainDelay,
                        ease: resolvedEasing,
                    },
                }
            case "left-to-right":
            default:
                return {
                    initial: { x: "0%" },
                    animate: shouldAnimate ? { x: "100%" } : { x: "0%" },
                    transition: {
                        duration,
                        delay: curtainDelay,
                        ease: resolvedEasing,
                    },
                }
        }
    }

    // Determine target clip-path based on direction
    const getClipPathAnimation = () => {
        let initialClip = "inset(0% 0% 0% 0%)"
        let animateClip = "inset(0% 0% 0% 0%)"

        switch (activeDirection) {
            case "left-to-right":
                initialClip = "inset(0% 100% 0% 0%)"
                break
            case "right-to-left":
                initialClip = "inset(0% 0% 0% 100%)"
                break
            case "top-to-bottom":
                initialClip = "inset(0% 0% 100% 0%)"
                break
            case "bottom-to-top":
                initialClip = "inset(100% 0% 0% 0%)"
                break
            case "center-out":
            default:
                initialClip = "inset(50% 50% 50% 50%)"
                break
        }

        return {
            initial: { clipPath: initialClip },
            animate: { clipPath: shouldAnimate ? animateClip : initialClip },
            transition: { duration, delay, ease: resolvedEasing },
        }
    }

    // Resolve active image source (supports both ResponsiveImage object and string URL, handles fallback)
    const activeImageProp = image || imageUrl
    let resolvedImageSrc =
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
    let resolvedSrcSet: string | undefined = undefined
    let resolvedAlt = altText

    if (activeImageProp) {
        if (typeof activeImageProp === "string") {
            resolvedImageSrc = activeImageProp
        } else if (typeof activeImageProp === "object") {
            resolvedImageSrc =
                activeImageProp.src || activeImageProp.url || resolvedImageSrc
            resolvedSrcSet = activeImageProp.srcSet
            if (activeImageProp.alt) {
                resolvedAlt = activeImageProp.alt
            }
        }
    }

    // Container Styles
    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#111111",
        borderRadius: `${borderRadius}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // Apply aspect ratio if not auto
        ...(aspectRatio === "16-9" && {
            aspectRatio: "16 / 9",
            height: "auto",
        }),
        ...(aspectRatio === "4-3" && { aspectRatio: "4 / 3", height: "auto" }),
        ...(aspectRatio === "1-1" && { aspectRatio: "1 / 1", height: "auto" }),
    }

    // Curtain layer styles. Cover layers bleed 1px past the container on
    // every side (clipped by the container's overflow: hidden): when the
    // browser promotes an animating curtain to its own compositing layer,
    // fractional layout sizes can round the layer edge a hair short of the
    // container, leaking a 1px sliver of the image beneath. The bleed makes
    // that rounding harmless.
    const getCurtainStyle = (
        color: string,
        zIndex: number
    ): React.CSSProperties => ({
        position: "absolute",
        top: -1,
        left: -1,
        right: -1,
        bottom: -1,
        backgroundColor: color,
        zIndex,
        pointerEvents: "none",
    })

    // Image container styles (for clip path animations)
    const imageContainerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    // Focal point → object-position, so the cover crop keeps the chosen
    // area in view at every breakpoint and container aspect ratio
    const focalPositionMap: Record<string, string> = {
        center: "50% 50%",
        top: "50% 0%",
        bottom: "50% 100%",
        left: "0% 50%",
        right: "100% 50%",
        "top-left": "0% 0%",
        "top-right": "100% 0%",
        "bottom-left": "0% 100%",
        "bottom-right": "100% 100%",
    }
    const clampPct = (v: number) => Math.max(0, Math.min(100, v))
    const objectPositionValue =
        focalPoint === "custom"
            ? `${clampPct(focalX)}% ${clampPct(focalY)}%`
            : (focalPositionMap[focalPoint] ?? "50% 50%")

    // Image tag styles
    const imageStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: objectPositionValue,
        display: "block",
    }

    // Overlay style
    const overlayStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: overlayColor,
        zIndex: 1,
        pointerEvents: "none",
    }

    // Variants for curtain animations
    const curtain1Anim = getCurtainAnimation(1)
    const curtain2Anim = getCurtainAnimation(2)
    const curtain3Anim = getCurtainAnimation(3)
    const clipPathAnim = getClipPathAnimation()

    return (
        <div ref={containerRef} style={containerStyle}>
            {/* 1. Solid Curtain Reveal */}
            {revealMode === "auto" &&
                revealType === "solid" &&
                !revealForCanvas && (
                <motion.div
                    initial={curtain1Anim.initial}
                    animate={curtain1Anim.animate}
                    transition={curtain1Anim.transition}
                    style={getCurtainStyle(curtainColor1, 3)}
                />
            )}

            {/* 2. Double Curtain Reveal */}
            {revealMode === "auto" &&
                revealType === "double" &&
                !revealForCanvas && (
                <>
                    <motion.div
                        initial={curtain1Anim.initial}
                        animate={curtain1Anim.animate}
                        transition={curtain1Anim.transition}
                        style={getCurtainStyle(curtainColor1, 3)}
                    />
                    <motion.div
                        initial={curtain2Anim.initial}
                        animate={curtain2Anim.animate}
                        transition={curtain2Anim.transition}
                        style={getCurtainStyle(curtainColor2, 2)}
                    />
                </>
            )}

            {/* 3. Triple Curtain Reveal */}
            {revealMode === "auto" &&
                revealType === "triple" &&
                !revealForCanvas && (
                <>
                    <motion.div
                        initial={curtain1Anim.initial}
                        animate={curtain1Anim.animate}
                        transition={curtain1Anim.transition}
                        style={getCurtainStyle(curtainColor1, 4)}
                    />
                    <motion.div
                        initial={curtain2Anim.initial}
                        animate={curtain2Anim.animate}
                        transition={curtain2Anim.transition}
                        style={getCurtainStyle(curtainColor2, 3)}
                    />
                    <motion.div
                        initial={curtain3Anim.initial}
                        animate={curtain3Anim.animate}
                        transition={curtain3Anim.transition}
                        style={getCurtainStyle(curtainColor3, 2)}
                    />
                </>
            )}

            {/* 4. Split Columns Reveal */}
            {revealMode === "auto" &&
                revealType === "columns" &&
                !revealForCanvas &&
                Array.from({ length: panelCount }).map((_, i) => {
                    const stripRect = getStripRect(
                        i,
                        panelCount,
                        "x",
                        stripTransparency ? 0 : 1
                    )
                    const stripRatio =
                        panelCount <= 1 ? 0 : i / (panelCount - 1)
                    const stripOpacity = stripTransparency
                        ? Math.max(
                              0.6,
                              Math.min(
                                  1,
                                  1 -
                                      (1 - stripTransparencyMin) *
                                          stripRatio
                              )
                          )
                        : 1
                    // Stagger order dynamically based on direction setting
                    const staggerIndex =
                        activeDirection === "right-to-left"
                            ? panelCount - 1 - i
                            : i
                    const panelDelay = delay + staggerIndex * staggerDelay
                    const isSlideDown = activeDirection === "top-to-bottom"
                    return (
                        <motion.div
                            key={`col-${i}`}
                            initial={{ y: "0%" }}
                            animate={
                                shouldAnimate
                                    ? { y: isSlideDown ? "100%" : "-100%" }
                                    : { y: "0%" }
                            }
                            transition={{
                                duration,
                                delay: panelDelay,
                                ease: resolvedEasing,
                            }}
                            style={{
                                position: "absolute",
                                top: -1,
                                left: stripRect.start,
                                width: stripRect.size,
                                height: "calc(100% + 2px)",
                                backgroundColor: curtainColor1,
                                opacity: stripOpacity,
                                zIndex: 3,
                                pointerEvents: "none",
                            }}
                        />
                    )
                })}

            {/* 5. Split Rows Reveal */}
            {revealMode === "auto" &&
                revealType === "rows" &&
                !revealForCanvas &&
                Array.from({ length: panelCount }).map((_, i) => {
                    const stripRect = getStripRect(
                        i,
                        panelCount,
                        "y",
                        stripTransparency ? 0 : 1
                    )
                    const stripRatio =
                        panelCount <= 1 ? 0 : i / (panelCount - 1)
                    const stripOpacity = stripTransparency
                        ? Math.max(
                              0.6,
                              Math.min(
                                  1,
                                  1 -
                                      (1 - stripTransparencyMin) *
                                          stripRatio
                              )
                          )
                        : 1
                    // Stagger order dynamically based on direction setting
                    const staggerIndex =
                        activeDirection === "bottom-to-top"
                            ? panelCount - 1 - i
                            : i
                    const panelDelay = delay + staggerIndex * staggerDelay
                    const isSlideRight = activeDirection === "left-to-right"
                    return (
                        <motion.div
                            key={`row-${i}`}
                            initial={{ x: "0%" }}
                            animate={
                                shouldAnimate
                                    ? { x: isSlideRight ? "100%" : "-100%" }
                                    : { x: "0%" }
                            }
                            transition={{
                                duration,
                                delay: panelDelay,
                                ease: resolvedEasing,
                            }}
                            style={{
                                position: "absolute",
                                top: stripRect.start,
                                left: -1,
                                width: "calc(100% + 2px)",
                                height: stripRect.size,
                                backgroundColor: curtainColor1,
                                opacity: stripOpacity,
                                zIndex: 3,
                                pointerEvents: "none",
                            }}
                        />
                    )
                })}

            {/* 6. Split Doors (Bi-parting) */}
            {revealMode === "auto" &&
                revealType === "split-doors" &&
                !revealForCanvas && (
                <>
                    {/* Left/Top Door */}
                    <motion.div
                        initial={
                            activeDirection === "top-to-bottom" ||
                            activeDirection === "bottom-to-top"
                                ? { y: "0%" }
                                : { x: "0%" }
                        }
                        animate={
                            shouldAnimate
                                ? activeDirection === "top-to-bottom" ||
                                  activeDirection === "bottom-to-top"
                                    ? { y: "-100%" }
                                    : { x: "-100%" }
                                : { x: "0%", y: "0%" }
                        }
                        transition={{ duration, delay, ease: resolvedEasing }}
                        style={{
                            position: "absolute",
                            top: -1,
                            left: -1,
                            // Doors bleed 1px past the outer edges and 1px
                            // into the center seam so compositing rounding
                            // can't leak a hairline of the image
                            width:
                                activeDirection === "top-to-bottom" ||
                                activeDirection === "bottom-to-top"
                                    ? "calc(100% + 2px)"
                                    : "calc(50% + 2px)",
                            height:
                                activeDirection === "top-to-bottom" ||
                                activeDirection === "bottom-to-top"
                                    ? "calc(50% + 2px)"
                                    : "calc(100% + 2px)",
                            backgroundColor: curtainColor1,
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Right/Bottom Door */}
                    <motion.div
                        initial={
                            activeDirection === "top-to-bottom" ||
                            activeDirection === "bottom-to-top"
                                ? { y: "0%" }
                                : { x: "0%" }
                        }
                        animate={
                            shouldAnimate
                                ? activeDirection === "top-to-bottom" ||
                                  activeDirection === "bottom-to-top"
                                    ? { y: "100%" }
                                    : { x: "100%" }
                                : { x: "0%", y: "0%" }
                        }
                        transition={{ duration, delay, ease: resolvedEasing }}
                        style={{
                            position: "absolute",
                            top:
                                activeDirection === "top-to-bottom" ||
                                activeDirection === "bottom-to-top"
                                    ? "50%"
                                    : -1,
                            left:
                                activeDirection === "top-to-bottom" ||
                                activeDirection === "bottom-to-top"
                                    ? -1
                                    : "50%",
                            width:
                                activeDirection === "top-to-bottom" ||
                                activeDirection === "bottom-to-top"
                                    ? "calc(100% + 2px)"
                                    : "calc(50% + 1px)",
                            height:
                                activeDirection === "top-to-bottom" ||
                                activeDirection === "bottom-to-top"
                                    ? "calc(50% + 1px)"
                                    : "calc(100% + 2px)",
                            backgroundColor: curtainColor1,
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            {/* 7. Grid Split (2x2) */}
            {revealMode === "auto" &&
                revealType === "grid" &&
                !revealForCanvas && (
                <>
                    {/* Top-Left */}
                    <motion.div
                        initial={{ x: "0%", y: "0%" }}
                        animate={
                            shouldAnimate
                                ? { x: "-100%", y: "-100%" }
                                : { x: "0%", y: "0%" }
                        }
                        transition={{ duration, delay, ease: resolvedEasing }}
                        style={{
                            position: "absolute",
                            // Quadrants bleed 1px past outer edges and
                            // overlap the center seams so compositing
                            // rounding can't leak hairlines
                            top: -1,
                            left: -1,
                            width: "calc(50% + 2px)",
                            height: "calc(50% + 2px)",
                            backgroundColor: curtainColor1,
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Top-Right */}
                    <motion.div
                        initial={{ x: "0%", y: "0%" }}
                        animate={
                            shouldAnimate
                                ? { x: "100%", y: "-100%" }
                                : { x: "0%", y: "0%" }
                        }
                        transition={{
                            duration,
                            delay: delay + staggerDelay,
                            ease: resolvedEasing,
                        }}
                        style={{
                            position: "absolute",
                            top: -1,
                            left: "50%",
                            width: "calc(50% + 1px)",
                            height: "calc(50% + 2px)",
                            backgroundColor: curtainColor1,
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Bottom-Left */}
                    <motion.div
                        initial={{ x: "0%", y: "0%" }}
                        animate={
                            shouldAnimate
                                ? { x: "-100%", y: "100%" }
                                : { x: "0%", y: "0%" }
                        }
                        transition={{
                            duration,
                            delay: delay + staggerDelay,
                            ease: resolvedEasing,
                        }}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: -1,
                            width: "calc(50% + 2px)",
                            height: "calc(50% + 1px)",
                            backgroundColor: curtainColor1,
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    />
                    {/* Bottom-Right */}
                    <motion.div
                        initial={{ x: "0%", y: "0%" }}
                        animate={
                            shouldAnimate
                                ? { x: "100%", y: "100%" }
                                : { x: "0%", y: "0%" }
                        }
                        transition={{
                            duration,
                            delay: delay + staggerDelay * 2,
                            ease: resolvedEasing,
                        }}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "calc(50% + 1px)",
                            height: "calc(50% + 1px)",
                            backgroundColor: curtainColor1,
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            {/* ── Scroll Scrub Reveal (split columns variant) ──────────────────── */}
            {revealMode === "scrub" &&
                scrubStyle === "columns" &&
                (() => {
                    const isHorizontalScrub =
                        activeDirection === "left-to-right" ||
                        activeDirection === "right-to-left"
                    const count = isHorizontalScrub
                        ? Math.min(Math.max(1, rowCount), 5)
                        : Math.min(Math.max(2, scrubPanelCount), 7)
                    // Image is always rendered underneath; panel slices sit on top and slide away
                    return (
                        <>
                            {/* Image base layer */}
                            <motion.div
                                style={{
                                    ...imageContainerStyle,
                                    ...parallaxOverscanStyle,
                                    ...parallaxMotionStyle,
                                }}
                            >
                                {overlayOpacity > 0 && !revealForCanvas && (
                                    <motion.div
                                        style={{
                                            ...overlayStyle,
                                            opacity: scrubOverlayOpacityValue,
                                        }}
                                    />
                                )}
                                <motion.img
                                    src={resolvedImageSrc}
                                    srcSet={resolvedSrcSet}
                                    alt={resolvedAlt}
                                    style={{
                                        ...imageStyle,
                                        scale: revealForCanvas
                                            ? 1
                                            : scrubImageScaleValue,
                                    }}
                                />
                            </motion.div>
                            {/* Panels on top — split orientation + axis depend on scrub direction */}
                            {!revealForCanvas &&
                                Array.from({ length: count }).map((_, i) => {
                                // For horizontal scrub rows:
                                // - left-to-right: top row reveals first
                                // - right-to-left: bottom row reveals first
                                // For vertical scrub columns: preserve existing top-to-bottom ordering.
                                const staggerIndex =
                                    isHorizontalScrub &&
                                    activeDirection === "right-to-left"
                                        ? count - 1 - i
                                        : i
                                const stripRatio =
                                    count <= 1 ? 0 : i / (count - 1)
                                const stripOpacity = stripTransparency
                                    ? Math.max(
                                          0.6,
                                          Math.min(
                                              1,
                                              1 -
                                                  (1 - stripTransparencyMin) *
                                                      stripRatio
                                          )
                                      )
                                    : 1
                                const stripRect = getStripRect(
                                    i,
                                    count,
                                    isHorizontalScrub ? "y" : "x",
                                    stripTransparency ? 0 : 1
                                )
                                return (
                                    <motion.div
                                        key={`scrubcol-${i}`}
                                        style={{
                                            position: "absolute",
                                            top: isHorizontalScrub
                                                ? stripRect.start
                                                : -1,
                                            left: isHorizontalScrub
                                                ? -1
                                                : stripRect.start,
                                            width: isHorizontalScrub
                                                ? "calc(100% + 2px)"
                                                : stripRect.size,
                                            height: isHorizontalScrub
                                                ? stripRect.size
                                                : "calc(100% + 2px)",
                                            backgroundColor: scrubCurtainColor,
                                            opacity: stripOpacity,
                                            zIndex: 3,
                                            pointerEvents: "none",
                                            x: scrubColXValues[staggerIndex],
                                            y: scrubColYValues[staggerIndex],
                                        }}
                                    />
                                )
                            })}
                        </>
                    )
                })()}

            {/* ── Scroll Scrub Reveal (clip-path variant) ──────────────────────── */}
            {revealMode === "scrub" && scrubStyle === "clip" && (
                // Outer div fills the full container with the background color.
                // The inner clipped div progressively reveals the image over it.
                <div
                    style={{
                        ...imageContainerStyle,
                        backgroundColor: scrubCurtainColor,
                    }}
                >
                    <motion.div
                        style={{
                            ...imageContainerStyle,
                            ...parallaxOverscanStyle,
                            clipPath: revealForCanvas
                                ? "none"
                                : getScrubClipValue(),
                            ...parallaxMotionStyle,
                        }}
                    >
                        {overlayOpacity > 0 && !revealForCanvas && (
                            <motion.div
                                style={{
                                    ...overlayStyle,
                                    opacity: scrubOverlayOpacityValue,
                                }}
                            />
                        )}
                        <motion.img
                            src={resolvedImageSrc}
                            srcSet={resolvedSrcSet}
                            alt={resolvedAlt}
                            style={{
                                ...imageStyle,
                                scale: revealForCanvas
                                    ? 1
                                    : scrubImageScaleValue,
                            }}
                        />
                    </motion.div>
                </div>
            )}

            {/* ── Scroll Scrub Reveal (curtain variant) ───────────────────────── */}
            {revealMode === "scrub" &&
                scrubStyle === "curtain" &&
                (() => {
                    const { axis, val } = getScrubCurtainTranslate()
                    return (
                        <>
                            {/* Scrub curtain slides away in 1:1 sync with scroll */}
                            {!revealForCanvas && (
                                <motion.div
                                    style={{
                                        ...getCurtainStyle(
                                            scrubCurtainColor,
                                            3
                                        ),
                                        ...(axis === "x"
                                            ? { x: val }
                                            : { y: val }),
                                    }}
                                />
                            )}
                            {/* Image beneath */}
                            <motion.div
                                style={{
                                    ...imageContainerStyle,
                                    ...parallaxOverscanStyle,
                                    ...parallaxMotionStyle,
                                }}
                            >
                                {overlayOpacity > 0 && !revealForCanvas && (
                                    <motion.div
                                        style={{
                                            ...overlayStyle,
                                            opacity: scrubOverlayOpacityValue,
                                        }}
                                    />
                                )}
                                <motion.img
                                    src={resolvedImageSrc}
                                    srcSet={resolvedSrcSet}
                                    alt={resolvedAlt}
                                    style={{
                                        ...imageStyle,
                                        scale: revealForCanvas
                                            ? 1
                                            : scrubImageScaleValue,
                                    }}
                                />
                            </motion.div>
                        </>
                    )
                })()}

            {/* ── Auto reveal: clip / default image wrapper ───────────────────────── */}
            {revealMode === "auto" && (
                <motion.div
                    initial={
                        revealType === "clip" && !revealForCanvas
                            ? clipPathAnim.initial
                            : {}
                    }
                    animate={revealType === "clip" ? clipPathAnim.animate : {}}
                    transition={
                        revealType === "clip" ? clipPathAnim.transition : {}
                    }
                    style={{
                        ...imageContainerStyle,
                        ...parallaxOverscanStyle,
                        ...parallaxMotionStyle,
                    }}
                >
                    {/* Optional dark overlay that fades out as revealed */}
                    {overlayOpacity > 0 && !revealForCanvas && (
                        <motion.div
                            initial={{ opacity: overlayOpacity }}
                            animate={
                                shouldAnimate
                                    ? { opacity: 0 }
                                    : { opacity: overlayOpacity }
                            }
                            transition={{
                                duration: imageZoomDuration,
                                delay,
                                ease: "easeOut",
                            }}
                            style={overlayStyle}
                        />
                    )}

                    {/* Animated Image */}
                    <motion.img
                        src={resolvedImageSrc}
                        srcSet={resolvedSrcSet}
                        alt={resolvedAlt}
                        initial={
                            revealForCanvas
                                ? { scale: 1, opacity: 1 }
                                : { scale: imageZoomStart, opacity: 0.8 }
                        }
                        animate={
                            shouldAnimate
                                ? { scale: 1, opacity: 1 }
                                : { scale: imageZoomStart, opacity: 0.8 }
                        }
                        transition={{
                            scale: {
                                duration: imageZoomDuration,
                                delay,
                                ease: "easeOut",
                            },
                            opacity: {
                                duration: duration,
                                delay,
                                ease: "easeOut",
                            },
                        }}
                        style={imageStyle}
                    />
                </motion.div>
            )}
        </div>
    )
}

// Framer property panel configuration
addPropertyControls(ScrollReveal, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    altText: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "Scroll Reveal Image",
    },
    focalPoint: {
        type: ControlType.Enum,
        title: "Focal Point",
        options: [
            "center",
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "custom",
        ],
        optionTitles: [
            "Center",
            "Top",
            "Bottom",
            "Left",
            "Right",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
            "Custom",
        ],
        defaultValue: "center",
    },
    focalX: {
        type: ControlType.Number,
        title: "Focal X",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        unit: "%",
        hidden(props) {
            return props.focalPoint !== "custom"
        },
    },
    focalY: {
        type: ControlType.Number,
        title: "Focal Y",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        unit: "%",
        hidden(props) {
            return props.focalPoint !== "custom"
        },
    },
    showImageOnCanvas: {
        type: ControlType.Boolean,
        title: "On Canvas",
        defaultValue: true,
        enabledTitle: "Image",
        disabledTitle: "Reveal",
        description:
            "Show the image on the canvas instead of the pre-reveal state. Only affects editing — preview and the published site always animate.",
    },
    // ─── TOP-LEVEL MODE SELECTOR — always visible, shown first ───────────────
    revealMode: {
        type: ControlType.Enum,
        title: "Reveal Mode",
        options: ["auto", "scrub"],
        optionTitles: ["Auto Reveal", "Scrub Reveal"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    // ─── Reveal Type — only for auto mode ────────────────────────────────────
    revealType: {
        type: ControlType.Enum,
        title: "Reveal Type",
        options: [
            "solid",
            "double",
            "triple",
            "columns",
            "rows",
            "split-doors",
            "grid",
            "clip",
        ],
        optionTitles: [
            "Solid Curtain",
            "Double Curtain",
            "Triple Curtain",
            "Split Columns",
            "Split Rows",
            "Split Doors (Bi-Parting)",
            "Grid Split (2x2)",
            "Direct Clip Reveal",
        ],
        defaultValue: "double",
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
    // ─── Direction controls — each filtered to only the relevant options ───
    // Solid / Double / Triple curtains: all four cardinal directions
    directionCurtain: {
        type: ControlType.Enum,
        title: "Direction",
        options: [
            "left-to-right",
            "right-to-left",
            "top-to-bottom",
            "bottom-to-top",
        ],
        optionTitles: [
            "Left → Right",
            "Right → Left",
            "Top → Bottom",
            "Bottom → Top",
        ],
        defaultValue: "left-to-right",
        hidden(props) {
            return (
                props.revealMode === "scrub" ||
                !(["solid", "double", "triple"] as string[]).includes(
                    props.revealType ?? ""
                )
            )
        },
    },
    // Split Columns: panels are vertical strips that slide vertically → only Up / Down
    directionColumns: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["bottom-to-top", "top-to-bottom"],
        optionTitles: [
            "Slide Up (panels exit upward)",
            "Slide Down (panels exit downward)",
        ],
        defaultValue: "bottom-to-top",
        hidden(props) {
            return (
                props.revealMode === "scrub" || props.revealType !== "columns"
            )
        },
    },
    // Split Rows: panels are horizontal strips that slide horizontally → only Left / Right
    directionRows: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left-to-right", "right-to-left"],
        optionTitles: [
            "Slide Right (panels exit right)",
            "Slide Left (panels exit left)",
        ],
        defaultValue: "left-to-right",
        hidden(props) {
            return props.revealMode === "scrub" || props.revealType !== "rows"
        },
    },
    // Split Doors: bi-parting — either horizontal or vertical split
    directionDoors: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left-to-right", "top-to-bottom"],
        optionTitles: [
            "Open Horizontally (left & right)",
            "Open Vertically (up & down)",
        ],
        defaultValue: "left-to-right",
        hidden(props) {
            return (
                props.revealMode === "scrub" ||
                props.revealType !== "split-doors"
            )
        },
    },
    // Clip Reveal: all five options including radial Center Out
    directionClip: {
        type: ControlType.Enum,
        title: "Direction",
        options: [
            "left-to-right",
            "right-to-left",
            "top-to-bottom",
            "bottom-to-top",
            "center-out",
        ],
        optionTitles: [
            "Left → Right",
            "Right → Left",
            "Top → Bottom",
            "Bottom → Top",
            "Center Out (radial)",
        ],
        defaultValue: "left-to-right",
        hidden(props) {
            return props.revealMode === "scrub" || props.revealType !== "clip"
        },
    },
    // Scrub direction — only shown in scrub mode
    directionScrub: {
        type: ControlType.Enum,
        title: "Direction",
        options: [
            "bottom-to-top",
            "left-to-right",
            "right-to-left",
            "top-to-bottom",
        ],
        optionTitles: [
            "Bottom → Top",
            "Left → Right",
            "Right → Left",
            "Top → Bottom",
        ],
        defaultValue: "bottom-to-top",
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    // ─── Scrub-specific settings (only visible in scrub mode) ────────────────────
    scrubStyle: {
        type: ControlType.Enum,
        title: "Scrub Style",
        options: ["clip", "curtain", "columns"],
        optionTitles: ["Clip Mask", "Sliding Curtain", "Split Columns"],
        defaultValue: "clip",
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    scrubStart: {
        type: ControlType.Number,
        title: "Scrub Start",
        min: 0,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.0,
        displayStepper: true,
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    scrubEnd: {
        type: ControlType.Number,
        title: "Scrub End",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.8,
        displayStepper: true,
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    scrubSmoothing: {
        type: ControlType.Number,
        title: "Scrub Smoothing",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    scrubEasing: {
        type: ControlType.Enum,
        title: "Scrub Easing",
        options: ["easeOut", "easeInOut", "circOut", "backOut", "customBezier"],
        optionTitles: [
            "Ease Out",
            "Ease In Out",
            "Circ Out",
            "Back Out",
            "Premium Bezier",
        ],
        defaultValue: "customBezier",
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    parallax: {
        type: ControlType.Boolean,
        title: "Parallax",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    parallaxSpeed: {
        type: ControlType.Number,
        title: "Parallax Speed",
        min: -1,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
        displayStepper: true,
        hidden(props) {
            return !props.parallax
        },
    },
    parallaxDirection: {
        type: ControlType.Enum,
        title: "Parallax Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        hidden(props) {
            return !props.parallax
        },
    },
    // Split Columns scrub — panel count and stagger
    scrubPanelCount: {
        type: ControlType.Number,
        title: "Column Count",
        min: 2,
        max: 7,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
        hidden(props) {
            return (
                props.revealMode !== "scrub" ||
                props.scrubStyle !== "columns" ||
                props.directionScrub === "left-to-right" ||
                props.directionScrub === "right-to-left"
            )
        },
    },
    rowCount: {
        type: ControlType.Number,
        title: "Rows",
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
        hidden(props) {
            return (
                props.revealMode !== "scrub" ||
                props.scrubStyle !== "columns" ||
                (props.directionScrub !== "left-to-right" &&
                    props.directionScrub !== "right-to-left")
            )
        },
    },
    scrubColumnStagger: {
        type: ControlType.Number,
        title: "Column Stagger",
        min: 0,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.08,
        displayStepper: true,
        hidden(props) {
            return (
                props.revealMode !== "scrub" || props.scrubStyle !== "columns"
            )
        },
    },
    stripTransparency: {
        type: ControlType.Boolean,
        title: "Strip Transparency",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden(props) {
            if (props.revealMode === "scrub")
                return props.scrubStyle !== "columns"
            return (
                props.revealType !== "columns" && props.revealType !== "rows"
            )
        },
    },
    stripTransparencyMin: {
        type: ControlType.Number,
        title: "Transparency Min",
        min: 0.6,
        max: 1,
        step: 0.01,
        defaultValue: 0.75,
        hidden(props) {
            if (!props.stripTransparency) return true
            if (props.revealMode === "scrub")
                return props.scrubStyle !== "columns"
            return (
                props.revealType !== "columns" && props.revealType !== "rows"
            )
        },
    },
    // Curtain color shown in scrub columns mode
    scrubCurtainColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#111111",
        hidden(props) {
            return props.revealMode !== "scrub"
        },
    },
    // Grid has no direction control — it always explodes outward from all four corners
    curtainColor1: {
        type: ControlType.Color,
        title: "Curtain Color 1",
        defaultValue: "#111111",
        hidden(props) {
            return props.revealMode === "scrub" || props.revealType === "clip"
        },
    },
    curtainColor2: {
        type: ControlType.Color,
        title: "Curtain Color 2",
        defaultValue: "#3B82F6",
        hidden(props) {
            return (
                props.revealMode === "scrub" ||
                (props.revealType !== "double" && props.revealType !== "triple")
            )
        },
    },
    curtainColor3: {
        type: ControlType.Color,
        title: "Curtain Color 3",
        defaultValue: "#FFFFFF",
        hidden(props) {
            return props.revealMode === "scrub" || props.revealType !== "triple"
        },
    },
    panelCount: {
        type: ControlType.Number,
        title: "Split Panel Count",
        min: 2,
        max: 8,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
        hidden(props) {
            return (
                props.revealMode === "scrub" ||
                (props.revealType !== "columns" && props.revealType !== "rows")
            )
        },
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        min: 0.05,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.15,
        unit: "s",
        displayStepper: true,
        hidden(props) {
            return (
                props.revealMode === "scrub" ||
                (props.revealType !== "columns" &&
                    props.revealType !== "rows" &&
                    props.revealType !== "grid")
            )
        },
    },
    duration: {
        type: ControlType.Number,
        title: "Curtain Speed",
        min: 0.2,
        max: 4.0,
        step: 0.1,
        displayStepper: true,
        defaultValue: 1.0,
        unit: "s",
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 3.0,
        step: 0.05,
        displayStepper: true,
        defaultValue: 0.1,
        unit: "s",
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "easeInOut", "circOut", "backOut", "customBezier"],
        optionTitles: [
            "Ease Out",
            "Ease In Out",
            "Circ Out",
            "Back Out",
            "Premium Bezier",
        ],
        defaultValue: "customBezier",
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
    imageZoomStart: {
        type: ControlType.Number,
        title: "Image Zoom Start",
        min: 1.0,
        max: 1.5,
        step: 0.05,
        displayStepper: true,
        defaultValue: 1.15,
        unit: "x",
    },
    imageZoomDuration: {
        type: ControlType.Number,
        title: "Zoom Duration",
        min: 0.2,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
        defaultValue: 1.6,
        unit: "s",
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        min: 0.0,
        max: 0.8,
        step: 0.05,
        displayStepper: true,
        defaultValue: 0.2,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 100,
        defaultValue: 16,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["auto", "16-9", "4-3", "1-1"],
        optionTitles: ["Auto (Fill)", "16:9", "4:3", "1:1"],
        defaultValue: "auto",
    },
    triggerOnce: {
        type: ControlType.Boolean,
        title: "Trigger Once",
        defaultValue: true,
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
    viewportMargin: {
        type: ControlType.Enum,
        title: "Trigger Position",
        options: ["bottom", "quarter", "middle", "upper", "top"],
        optionTitles: [
            "Bottom Edge (earliest)",
            "Quarter Up",
            "Middle (default)",
            "Upper Quarter",
            "Near Top (latest)",
        ],
        defaultValue: "middle",
        hidden(props) {
            return props.revealMode === "scrub"
        },
    },
})
