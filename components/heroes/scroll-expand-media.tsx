// Media component that animates to fullscreen when a selected scroll section is in view
// Animation duration matches scroll section length
// Width animation pushes neighboring stack children

import {
    useEffect,
    useState,
    useRef,
    useMemo,
    useCallback,
    startTransition,
    type ReactNode,
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

import { motion, useAnimationControls } from "framer-motion"

const DEFAULT_ANIMATION_SETTINGS = Object.freeze({
    easingType: "tween" as const,
    tweenEasing: "easeInOut",
    bezierCurve: "0.42, 0, 0.58, 1",
    customDuration: 0.4,
    delay: 0,
    springTime: 0.4,
    springBounce: 0.2,
})

interface ScrollExpandMediaProps {
    mediaType: "image" | "canvas"
    image: {
        src: string
        alt: string
    }
    canvasContent?: ReactNode
    canvasSize: "original" | "viewport"
    canvasAlignX: "left" | "center" | "right"
    canvasAlignY: "top" | "center" | "bottom"
    scrollSectionId: string
    initialWidth: number
    initialHeight: number
    viewportPadding: number
    paddingPerSide: boolean
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    initialBorderRadius: number
    radiusPerCorner: boolean
    radiusTopLeft: number
    radiusTopRight: number
    radiusBottomRight: number
    radiusBottomLeft: number
    animateRadius: boolean
    trigger: "sectionInView" | "animateOnScroll"
    viewportPosition: "top" | "center" | "bottom"
    replay: boolean
    animationSettings: {
        easingType: "tween" | "spring"
        tweenEasing: string
        bezierCurve: string
        customDuration: number
        delay: number
        springTime: number
        springBounce: number
    }
    style?: CSSProperties
}

/**
 * Scroll Expand Media
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollExpandMedia(props: ScrollExpandMediaProps) {
    const {
        mediaType = "image",
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        canvasContent,
        canvasSize = "original",
        canvasAlignX = "center",
        canvasAlignY = "center",
        scrollSectionId = "",
        initialWidth = 400,
        initialHeight = 300,
        viewportPadding = 0,
        paddingPerSide = false,
        paddingTop = 0,
        paddingRight = 0,
        paddingBottom = 0,
        paddingLeft = 0,
        initialBorderRadius = 8,
        radiusPerCorner = false,
        radiusTopLeft = 8,
        radiusTopRight = 8,
        radiusBottomRight = 8,
        radiusBottomLeft = 8,
        animateRadius = true,
        trigger = "sectionInView",
        viewportPosition = "center",
        replay = true,
        animationSettings = DEFAULT_ANIMATION_SETTINGS,
    } = props
    const {
        easingType,
        tweenEasing,
        bezierCurve,
        customDuration,
        delay,
        springTime,
        springBounce,
    } = animationSettings

    const [hasAnimated, setHasAnimated] = useState(false)
    const [authoredCanvasSize, setAuthoredCanvasSize] = useState<{
        width: number
        height: number
    }>({ width: 0, height: 0 })
    const [viewportSize, setViewportSize] = useState<{
        width: number
        height: number
    }>(() => {
        if (typeof window !== "undefined") {
            return { width: window.innerWidth, height: window.innerHeight }
        }
        return { width: 0, height: 0 }
    })
    const lastScrollY = useRef(0)
    const controls = useAnimationControls()
    const isStaticRenderer = useIsStaticRenderer()
    const canvasMeasureWrapperRef = useRef<HTMLDivElement>(null)

    // Calculate rootMargin based on viewport position
    const rootMargin = useMemo(() => {
        switch (viewportPosition) {
            case "top":
                return "-10% 0px -90% 0px"
            case "center":
                return "-50% 0px -50% 0px"
            case "bottom":
                return "-90% 0px -10% 0px"
            default:
                return "0px"
        }
    }, [viewportPosition])

    const safeImageSrc = useMemo(() => {
        const src = image?.src ?? ""
        if (!src) return ""
        const trimmedSrc = src.trim()
        if (
            trimmedSrc.startsWith("http://") ||
            trimmedSrc.startsWith("https://") ||
            trimmedSrc.startsWith("data:") ||
            trimmedSrc.startsWith("blob:") ||
            trimmedSrc.startsWith("/")
        ) {
            return trimmedSrc
        }
        return ""
    }, [image])

    const safeImageAlt = useMemo(() => {
        return typeof image?.alt === "string" ? image.alt : ""
    }, [image])

    const prefersReducedMotion = useMemo(() => {
        if (typeof window !== "undefined" && "matchMedia" in window) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        }
        return false
    }, [])
    const hasCanvasContent = useMemo(() => {
        if (Array.isArray(canvasContent)) return canvasContent.length > 0
        return (
            canvasContent !== null &&
            canvasContent !== undefined &&
            canvasContent !== false
        )
    }, [canvasContent])
    const canvasAlignmentStyles = useMemo(
        () => ({
            alignItems:
                canvasAlignY === "top"
                    ? "flex-start"
                    : canvasAlignY === "bottom"
                      ? "flex-end"
                      : "center",
            justifyContent:
                canvasAlignX === "left"
                    ? "flex-start"
                    : canvasAlignX === "right"
                      ? "flex-end"
                      : "center",
        }),
        [canvasAlignX, canvasAlignY]
    )
    const shouldUseOriginalCanvasMode =
        canvasSize === "original" ||
        !hasCanvasContent ||
        authoredCanvasSize.width <= 0 ||
        authoredCanvasSize.height <= 0 ||
        viewportSize.width <= 0 ||
        viewportSize.height <= 0
    const effectivePadding = useMemo(() => {
        const uniform = sanitizePaddingValue(viewportPadding)
        if (paddingPerSide) {
            return {
                top: sanitizePaddingValue(paddingTop),
                right: sanitizePaddingValue(paddingRight),
                bottom: sanitizePaddingValue(paddingBottom),
                left: sanitizePaddingValue(paddingLeft),
            }
        }
        return { top: uniform, right: uniform, bottom: uniform, left: uniform }
    }, [
        paddingBottom,
        paddingLeft,
        paddingPerSide,
        paddingRight,
        paddingTop,
        viewportPadding,
    ])
    const targetViewportSize = useMemo(() => {
        if (viewportSize.width <= 0 || viewportSize.height <= 0) return null
        return computePaddedSize(
            viewportSize.width,
            viewportSize.height,
            effectivePadding
        )
    }, [effectivePadding, viewportSize.height, viewportSize.width])
    const viewportStageDimensions = useMemo(() => {
        if (targetViewportSize) {
            return {
                width: `${targetViewportSize.width}px`,
                height: `${targetViewportSize.height}px`,
            }
        }
        return { width: "100vw", height: "100vh" }
    }, [targetViewportSize])

    const canvasScale = useMemo(() => {
        if (
            authoredCanvasSize.width <= 0 ||
            authoredCanvasSize.height <= 0 ||
            !targetViewportSize
        ) {
            return { x: 1, y: 1 }
        }
        const uniformScale = Math.max(
            targetViewportSize.width / authoredCanvasSize.width,
            targetViewportSize.height / authoredCanvasSize.height
        )
        return {
            x: uniformScale,
            y: uniformScale,
        }
    }, [
        authoredCanvasSize.height,
        authoredCanvasSize.width,
        targetViewportSize,
    ])
    const canvasFootprintSize = useMemo(() => {
        if (
            authoredCanvasSize.width <= 0 ||
            authoredCanvasSize.height <= 0 ||
            !targetViewportSize
        ) {
            return {
                width: authoredCanvasSize.width,
                height: authoredCanvasSize.height,
            }
        }

        return {
            width: authoredCanvasSize.width * canvasScale.x,
            height: authoredCanvasSize.height * canvasScale.y,
        }
    }, [
        authoredCanvasSize.height,
        authoredCanvasSize.width,
        canvasScale.x,
        canvasScale.y,
        targetViewportSize,
    ])

    const getTweenEase = useCallback(() => {
        if (tweenEasing === "bezier") {
            return parseBezier(bezierCurve)
        }
        return tweenEasing
    }, [bezierCurve, tweenEasing])

    const radiusValuesAtFactor = useCallback(
        (factor: number) => {
            const effectiveFactor = animateRadius ? factor : 1
            const uniformValue = initialBorderRadius * effectiveFactor
            return {
                borderRadius: uniformValue,
                borderTopLeftRadius: radiusPerCorner
                    ? radiusTopLeft * effectiveFactor
                    : uniformValue,
                borderTopRightRadius: radiusPerCorner
                    ? radiusTopRight * effectiveFactor
                    : uniformValue,
                borderBottomRightRadius: radiusPerCorner
                    ? radiusBottomRight * effectiveFactor
                    : uniformValue,
                borderBottomLeftRadius: radiusPerCorner
                    ? radiusBottomLeft * effectiveFactor
                    : uniformValue,
            }
        },
        [
            animateRadius,
            initialBorderRadius,
            radiusBottomLeft,
            radiusBottomRight,
            radiusPerCorner,
            radiusTopLeft,
            radiusTopRight,
        ]
    )
    const initialRadiusValues = useMemo(
        () => radiusValuesAtFactor(1),
        [radiusValuesAtFactor]
    )
    const fullscreenRadiusValues = useMemo(
        () => radiusValuesAtFactor(0),
        [radiusValuesAtFactor]
    )
    const getCurrentPaddedViewport = useCallback(() => {
        if (typeof window === "undefined") {
            return {
                width: Math.max(1, initialWidth),
                height: Math.max(1, initialHeight),
            }
        }
        return computePaddedSize(
            window.innerWidth,
            window.innerHeight,
            effectivePadding
        )
    }, [effectivePadding, initialHeight, initialWidth])

    useEffect(() => {
        if (typeof window === "undefined" || isStaticRenderer) return

        const updateViewportSize = () => {
            startTransition(() =>
                setViewportSize((prev) => {
                    const width = window.innerWidth
                    const height = window.innerHeight
                    if (prev.width === width && prev.height === height)
                        return prev
                    return { width, height }
                })
            )
        }

        updateViewportSize()
        window.addEventListener("resize", updateViewportSize, { passive: true })
        window.addEventListener("orientationchange", updateViewportSize)

        return () => {
            window.removeEventListener("resize", updateViewportSize)
            window.removeEventListener("orientationchange", updateViewportSize)
        }
    }, [isStaticRenderer])

    useEffect(() => {
        if (typeof window === "undefined" || isStaticRenderer) return
        if (mediaType !== "canvas" || !hasCanvasContent) return

        const wrapper = canvasMeasureWrapperRef.current
        if (!wrapper) return

        let rafId = 0
        let resizeObserver: ResizeObserver | null = null

        const getConnectedRootElement = (): HTMLElement | null => {
            if (wrapper.firstElementChild instanceof HTMLElement) {
                return wrapper.firstElementChild
            }
            const queried = wrapper.querySelector("*")
            return queried instanceof HTMLElement ? queried : null
        }

        const measure = () => {
            const connectedRoot = getConnectedRootElement()
            if (!connectedRoot) return

            const measuredWidth = connectedRoot.offsetWidth
            const measuredHeight = connectedRoot.offsetHeight

            startTransition(() => {
                setAuthoredCanvasSize((prev) => {
                    if (
                        prev.width === measuredWidth &&
                        prev.height === measuredHeight
                    ) {
                        return prev
                    }
                    return {
                        width: measuredWidth,
                        height: measuredHeight,
                    }
                })
            })
        }

        const scheduleMeasure = () => {
            if (rafId) return
            rafId = window.requestAnimationFrame(() => {
                rafId = 0
                measure()
            })
        }

        scheduleMeasure()

        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                scheduleMeasure()
            })
            const connectedRoot = getConnectedRootElement()
            if (connectedRoot) {
                resizeObserver.observe(connectedRoot)
            } else {
                resizeObserver.observe(wrapper)
            }
        } else {
            window.addEventListener("resize", scheduleMeasure, {
                passive: true,
            })
            window.addEventListener("orientationchange", scheduleMeasure)
        }

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect()
            } else {
                window.removeEventListener("resize", scheduleMeasure)
                window.removeEventListener("orientationchange", scheduleMeasure)
            }
            if (rafId) {
                window.cancelAnimationFrame(rafId)
            }
        }
    }, [canvasContent, hasCanvasContent, mediaType, canvasSize, isStaticRenderer])

    // Track scroll section visibility and calculate duration
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof document === "undefined" ||
            isStaticRenderer
        ) {
            return
        }

        // For animateOnScroll, gate scroll work to near-viewport visibility
        if (trigger === "animateOnScroll") {
            if (!scrollSectionId) return

            const targetElement = document.getElementById(scrollSectionId)
            if (!targetElement) return

            let rafId = 0
            let scrollAttached = false
            const handleScroll = () => {
                if (rafId) return
                rafId = window.requestAnimationFrame(() => {
                    rafId = 0
                    const rect = targetElement.getBoundingClientRect()
                    const sectionTop = rect.top + window.scrollY
                    const viewportHeight = window.innerHeight
                    const currentScrollY = window.scrollY

                    // Calculate progress based on scrolling through the section
                    // Progress goes from 0 (section top at viewport bottom) to 1 (section top at viewport top)
                    const scrollStart = sectionTop - viewportHeight
                    const scrollEnd = sectionTop
                    const scrollRange = scrollEnd - scrollStart
                    const progress = Math.max(
                        0,
                        Math.min(
                            1,
                            (currentScrollY - scrollStart) / scrollRange
                        )
                    )

                    // Animate dimensions based on scroll progress
                    const paddedViewport = getCurrentPaddedViewport()
                    const currentWidth =
                        initialWidth +
                        (paddedViewport.width - initialWidth) * progress
                    const currentHeight =
                        initialHeight +
                        (paddedViewport.height - initialHeight) * progress
                    controls.set({
                        width: `${currentWidth}px`,
                        height: `${currentHeight}px`,
                        ...radiusValuesAtFactor(1 - progress),
                    })
                })
            }

            const attachScroll = () => {
                if (scrollAttached) return
                window.addEventListener("scroll", handleScroll, { passive: true })
                scrollAttached = true
            }

            const detachScroll = () => {
                if (!scrollAttached) return
                window.removeEventListener("scroll", handleScroll)
                scrollAttached = false
                if (rafId) {
                    window.cancelAnimationFrame(rafId)
                    rafId = 0
                }
            }

            const nearViewObserver = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    if (!entry) return

                    if (entry.isIntersecting) {
                        attachScroll()
                        handleScroll() // Sync immediately when entering near-view zone
                    } else {
                        detachScroll()
                    }
                },
                {
                    threshold: 0,
                    // Covers the active progress range and nearby pre/post area.
                    rootMargin: "100% 0px 100% 0px",
                }
            )

            nearViewObserver.observe(targetElement)

            return () => {
                nearViewObserver.disconnect()
                detachScroll()
            }
        }

        // For sectionInView, use the existing IntersectionObserver logic
        let targetElement: HTMLElement | null = null

        if (trigger === "sectionInView" && scrollSectionId) {
            targetElement = document.getElementById(scrollSectionId)
        }

        if (!targetElement) return

        // Calculate animation duration based on section height
        const sectionHeight = targetElement.offsetHeight
        const viewportHeight = window.innerHeight
        // Duration scales with section size (1s per viewport height)
        const duration = Math.max(
            0.5,
            Math.min(3, sectionHeight / viewportHeight)
        )

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const inView = entry.isIntersecting
                    const currentScrollY = window.scrollY
                    const isScrollingUp = currentScrollY < lastScrollY.current

                    if (inView && (!hasAnimated || replay)) {
                        // Animate to fullscreen when section comes into view
                        const transition =
                            easingType === "spring"
                                ? {
                                      type: "spring" as const,
                                      duration: prefersReducedMotion
                                          ? 0
                                          : springTime,
                                      bounce: springBounce,
                                      delay: delay,
                                  }
                                : {
                                      duration: prefersReducedMotion
                                          ? 0
                                          : customDuration > 0
                                            ? customDuration
                                            : duration,
                                      ease: getTweenEase() as any,
                                      delay: delay,
                                  }

                        const paddedViewport = getCurrentPaddedViewport()
                        controls.start({
                            width: `${paddedViewport.width}px`,
                            height: `${paddedViewport.height}px`,
                            ...fullscreenRadiusValues,
                            transition,
                        })
                        startTransition(() => setHasAnimated(true))
                    } else if (
                        !inView &&
                        isScrollingUp &&
                        hasAnimated &&
                        replay
                    ) {
                        // Only animate back when scrolling up and replay is enabled
                        const transition =
                            easingType === "spring"
                                ? {
                                      type: "spring" as const,
                                      duration: prefersReducedMotion
                                          ? 0
                                          : springTime,
                                      bounce: springBounce,
                                      delay: delay * 0.5,
                                  }
                                : {
                                      duration: prefersReducedMotion
                                          ? 0
                                          : customDuration > 0
                                            ? customDuration * 0.5
                                            : duration * 0.5,
                                      ease: getTweenEase() as any,
                                      delay: delay * 0.5,
                                  }

                        controls.start({
                            width: `${initialWidth}px`,
                            height: `${initialHeight}px`,
                            ...initialRadiusValues,
                            transition,
                        })
                        startTransition(() => setHasAnimated(false))
                    }

                    lastScrollY.current = currentScrollY
                })
            },
            {
                threshold: 0.1,
                rootMargin: rootMargin,
            }
        )

        observer.observe(targetElement)

        return () => {
            observer.disconnect()
        }
    }, [
        scrollSectionId,
        trigger,
        initialWidth,
        initialHeight,
        getCurrentPaddedViewport,
        initialRadiusValues,
        fullscreenRadiusValues,
        radiusValuesAtFactor,
        controls,
        hasAnimated,
        replay,
        rootMargin,
        easingType,
        tweenEasing,
        bezierCurve,
        customDuration,
        delay,
        springTime,
        springBounce,
        getTweenEase,
        isStaticRenderer,
        prefersReducedMotion,
    ])

    if (isStaticRenderer) {
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                    justifySelf: "start",
                    alignSelf: "start",
                    width: `${initialWidth}px`,
                    height: `${initialHeight}px`,
                    ...initialRadiusValues,
                }}
            >
                {mediaType === "image" ? (
                    <img
                        src={safeImageSrc}
                        alt={safeImageAlt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : hasCanvasContent ? (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            ...canvasAlignmentStyles,
                        }}
                    >
                        <div style={{ flex: "0 0 auto" }}>{canvasContent}</div>
                    </div>
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#F5F5F5",
                            color: "#666666",
                            fontSize: 12,
                            lineHeight: 1.2,
                            textAlign: "center",
                            padding: 12,
                            boxSizing: "border-box",
                        }}
                    >
                        Connect Canvas Content
                    </div>
                )}
            </div>
        )
    }

    return (
        <motion.div
            initial={{
                width: `${initialWidth}px`,
                height: `${initialHeight}px`,
                ...initialRadiusValues,
            }}
            animate={controls}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
                justifySelf: "start",
                alignSelf: "start",
            }}
        >
            {mediaType === "image" ? (
                <img
                    src={safeImageSrc}
                    alt={safeImageAlt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : hasCanvasContent ? (
                shouldUseOriginalCanvasMode ? (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            ...canvasAlignmentStyles,
                        }}
                    >
                        <div style={{ flex: "0 0 auto" }}>
                            <div
                                ref={canvasMeasureWrapperRef}
                                style={{ display: "inline-block" }}
                            >
                                {canvasContent}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: viewportStageDimensions.width,
                            height: viewportStageDimensions.height,
                            transform: "translate(-50%, -50%)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: `${canvasFootprintSize.width}px`,
                                height: `${canvasFootprintSize.height}px`,
                                flex: "0 0 auto",
                            }}
                        >
                            <div
                                style={{
                                    transform: `scale(${canvasScale.x}, ${canvasScale.y})`,
                                    transformOrigin: "top left",
                                    flex: "0 0 auto",
                                    width: `${authoredCanvasSize.width}px`,
                                    height: `${authoredCanvasSize.height}px`,
                                }}
                            >
                                <div
                                    ref={canvasMeasureWrapperRef}
                                    style={{ display: "inline-block" }}
                                >
                                    {canvasContent}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#F5F5F5",
                        color: "#666666",
                        fontSize: 12,
                        lineHeight: 1.2,
                        textAlign: "center",
                        padding: 12,
                        boxSizing: "border-box",
                    }}
                >
                    Connect Canvas Content
                </div>
            )}
        </motion.div>
    )
}

// Helper function to parse bezier curve string
function parseBezier(bezierString: string): number[] {
    const values = bezierString
        .split(",")
        .map((v) => Number.parseFloat(v.trim()))
        .filter((v) => Number.isFinite(v))

    if (values.length !== 4) return [0.42, 0, 0.58, 1]

    return values as [number, number, number, number]
}

function sanitizePaddingValue(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, value)
}

function computePaddedSize(
    width: number,
    height: number,
    padding: { top: number; right: number; bottom: number; left: number }
): { width: number; height: number } {
    const safeWidth = Number.isFinite(width) ? width : 0
    const safeHeight = Number.isFinite(height) ? height : 0
    const paddedWidth = safeWidth - padding.left - padding.right
    const paddedHeight = safeHeight - padding.top - padding.bottom
    return {
        width: Math.max(1, paddedWidth),
        height: Math.max(1, paddedHeight),
    }
}

addPropertyControls(ScrollExpandMedia, {
    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        options: ["image", "canvas"],
        optionTitles: ["Image", "Canvas"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (props) => props.mediaType !== "image",
    },
    canvasContent: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
        hidden: (props) => props.mediaType !== "canvas",
    },
    canvasSize: {
        type: ControlType.Enum,
        title: "Size",
        description:
            "Original keeps authored size. Viewport fills the padded reveal area.",
        options: ["original", "viewport"],
        optionTitles: ["Original", "Viewport"],
        defaultValue: "original",
        displaySegmentedControl: true,
        hidden: (props) => props.mediaType !== "canvas",
    },
    canvasAlignX: {
        type: ControlType.Enum,
        title: "X Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (props) =>
            props.mediaType !== "canvas" || props.canvasSize === "viewport",
    },
    canvasAlignY: {
        type: ControlType.Enum,
        title: "Y Align",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (props) =>
            props.mediaType !== "canvas" || props.canvasSize === "viewport",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Animation",
        description:
            "Autoplay triggers on section entry. On Scroll follows section progress.",
        options: ["sectionInView", "animateOnScroll"],
        optionTitles: ["Autoplay", "On Scroll"],
        defaultValue: "animateOnScroll",
        displaySegmentedControl: false,
    },
    scrollSectionId: {
        type: ControlType.String,
        title: "Section",
        description: "Target section element ID.",
        defaultValue: "",
        placeholder: "Select...",
    },
    viewportPosition: {
        type: ControlType.Enum,
        title: "Viewport",
        description: "Where section entry is detected.",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (props) => props.trigger === "animateOnScroll",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        description: "Restores initial state when scrolling back.",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => props.trigger === "animateOnScroll",
    },
    initialWidth: {
        type: ControlType.Number,
        title: "Initial Width",
        defaultValue: 400,
        min: 100,
        max: 2000,
        step: 10,
        unit: "px",
    },
    initialHeight: {
        type: ControlType.Number,
        title: "Initial Height",
        defaultValue: 300,
        min: 100,
        max: 2000,
        step: 10,
        unit: "px",
    },
    viewportPadding: {
        type: ControlType.FusedNumber,
        title: "Padding",
        description: "Insets the final viewport reveal area.",
        defaultValue: 0,
        toggleKey: "paddingPerSide",
        toggleTitles: ["All", "Each"],
        valueKeys: [
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
    },
    initialBorderRadius: {
        type: ControlType.FusedNumber,
        title: "Radius",
        description: "Starting corner radius.",
        defaultValue: 8,
        toggleKey: "radiusPerCorner",
        toggleTitles: ["All", "Each"],
        valueKeys: [
            "radiusTopLeft",
            "radiusTopRight",
            "radiusBottomRight",
            "radiusBottomLeft",
        ],
        valueLabels: ["TL", "TR", "BR", "BL"],
        min: 0,
    },
    animateRadius: {
        type: ControlType.Boolean,
        title: "Animate Radius",
        description:
            "Yes transitions radius to zero. No keeps it fixed \n\nMore resources at [olonks](https://x.com/o_lonks).",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    animationSettings: {
        type: ControlType.Object,
        title: "Animation Settings",
        description: "Applies to Autoplay only.",
        optional: false,
        controls: {
            easingType: {
                type: ControlType.Enum,
                title: "Easing Type",
                options: ["tween", "spring"],
                optionTitles: ["Ease", "Spring"],
                defaultValue: "tween",
                displaySegmentedControl: true,
            },
            tweenEasing: {
                type: ControlType.Enum,
                title: "Ease",
                options: [
                    "linear",
                    "easeIn",
                    "easeOut",
                    "easeInOut",
                    "circIn",
                    "circOut",
                    "circInOut",
                    "backIn",
                    "backOut",
                    "backInOut",
                    "bezier",
                ],
                optionTitles: [
                    "Linear",
                    "Ease In",
                    "Ease Out",
                    "Ease In Out",
                    "Circ In",
                    "Circ Out",
                    "Circ In Out",
                    "Back In",
                    "Back Out",
                    "Back In Out",
                    "Bezier",
                ],
                defaultValue: "easeInOut",
                displaySegmentedControl: false,
                hidden: (props) => props.easingType === "spring",
            },
            bezierCurve: {
                type: ControlType.String,
                title: "Bezier",
                description: "Custom cubic-bezier: x1, y1, x2, y2.",
                defaultValue: "0.42, 0, 0.58, 1",
                placeholder: "x1, y1, x2, y2",
                hidden: (props) =>
                    props.easingType === "spring" ||
                    props.tweenEasing !== "bezier",
            },
            customDuration: {
                type: ControlType.Number,
                title: "Time",
                defaultValue: 0.4,
                min: 0,
                max: 5,
                step: 0.1,
                unit: "s",
                displayStepper: false,
                hidden: (props) => props.easingType === "spring",
            },
            springTime: {
                type: ControlType.Number,
                title: "Time",
                defaultValue: 0.4,
                min: 0,
                max: 5,
                step: 0.1,
                unit: "s",
                displayStepper: false,
                hidden: (props) => props.easingType === "tween",
            },
            springBounce: {
                type: ControlType.Number,
                title: "Bounce",
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.01,
                displayStepper: false,
                hidden: (props) => props.easingType === "tween",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: 0,
                min: 0,
                max: 5,
                step: 0.1,
                unit: "s",
                displayStepper: false,
            },
        },
        hidden: (props) => props.trigger === "animateOnScroll",
    },
})
