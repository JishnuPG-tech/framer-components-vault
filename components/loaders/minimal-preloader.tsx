import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: Create a new Framer code component named "SiteLoader" (default export). It is a full-screen loading overlay that tracks the REAL loading state of the page and disappears once the site is genuinely ready, using real browser loading signals, smooth/monotonic real progress, configurable visuals, static-render fallback, and full property controls.

interface MyComponentProps {
    logo?: { src?: string; srcSet?: string; alt?: string }
    logoWidth: number
    backgroundColor: string
    backgroundGradient: string
    overlayOpacity: number
    blur: number
    barColor: string
    barTrackColor: string
    barWidth: number
    barHeight: number
    barRadius: number
    borderRadius: number
    contentGap: number
    animationDuration: number
    fadeDuration: number
    minDisplay: number
    showPercentage: boolean
    percentageColor: string
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SiteLoader(props: MyComponentProps) {
    const {
        logo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        logoWidth,
        backgroundColor,
        backgroundGradient,
        overlayOpacity,
        blur,
        barColor,
        barTrackColor,
        barWidth,
        barHeight,
        barRadius,
        borderRadius,
        contentGap,
        animationDuration,
        fadeDuration,
        minDisplay,
        showPercentage,
        percentageColor,
    } = props

    const isStatic = useIsStaticRenderer()
    const hasWindow = typeof window !== "undefined"
    const shouldRunRuntimeLogic = hasWindow && !isStatic

    const [displayedProgress, setDisplayedProgress] = useState(shouldRunRuntimeLogic ? 0 : 35)
    const [isVisible, setIsVisible] = useState(true)
    const [isFadingOut, setIsFadingOut] = useState(false)

    const targetProgressRef = useRef(shouldRunRuntimeLogic ? 0 : 35)
    const displayedProgressRef = useRef(shouldRunRuntimeLogic ? 0 : 35)
    const animationFrameRef = useRef<number | null>(null)
    const isFinishingRef = useRef(false)
    const hasHiddenRef = useRef(false)
    const fadeTimeoutRef = useRef<number | null>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const mountTimeRef = useRef<number>(
        shouldRunRuntimeLogic && typeof performance !== "undefined" ? performance.now() : 0
    )

    const loadGateRef = useRef({
        windowLoaded: false,
        fontsReady: false,
        readyState: hasWindow ? document.readyState : "loading",
        totalResources: 0,
        loadedResources: 0,
        totalImages: 0,
        loadedImages: 0,
    })

    const visualBackground = useMemo(() => {
        return backgroundGradient && backgroundGradient.trim().length > 0
            ? backgroundGradient
            : backgroundColor
    }, [backgroundColor, backgroundGradient])

    const updateRealTarget = useCallback(() => {
        if (!shouldRunRuntimeLogic) return

        const gate = loadGateRef.current

        const readyStateProgress =
            gate.readyState === "complete" ? 1 : gate.readyState === "interactive" ? 0.6 : 0.2
        const resourceProgress =
            gate.totalResources > 0 ? gate.loadedResources / gate.totalResources : 1
        const imageProgress = gate.totalImages > 0 ? gate.loadedImages / gate.totalImages : 1
        const assetProgress = (resourceProgress + imageProgress) / 2
        const fontProgress = gate.fontsReady ? 1 : 0

        const finalReady =
            gate.windowLoaded && gate.readyState === "complete" && gate.fontsReady === true

        const weighted = readyStateProgress * 0.45 + assetProgress * 0.4 + fontProgress * 0.15
        const rawTarget = finalReady ? 100 : Math.min(weighted * 100, 99)
        const monotonicTarget = Math.max(targetProgressRef.current, rawTarget)
        targetProgressRef.current = monotonicTarget
    }, [shouldRunRuntimeLogic])

    const finalizeHide = useCallback(() => {
        if (hasHiddenRef.current) return
        hasHiddenRef.current = true
        if (fadeTimeoutRef.current !== null && hasWindow) {
            window.clearTimeout(fadeTimeoutRef.current)
            fadeTimeoutRef.current = null
        }
        startTransition(() => setIsVisible(false))
    }, [hasWindow])

    useEffect(() => {
        if (!shouldRunRuntimeLogic) return

        mountTimeRef.current = typeof performance !== "undefined" ? performance.now() : Date.now()

        const gate = loadGateRef.current
        gate.readyState = document.readyState
        gate.windowLoaded = document.readyState === "complete"

        const resourceEntries = performance.getEntriesByType("resource")
        gate.totalResources = resourceEntries.length
        gate.loadedResources = resourceEntries.length

        const images = Array.from(document.querySelectorAll("img"))
        gate.totalImages = images.length
        gate.loadedImages = images.filter((img) => img.complete).length

        updateRealTarget()

        const cleanupImageListeners: Array<() => void> = []
        images.forEach((img) => {
            if (img.complete) return
            const onDone = () => {
                loadGateRef.current.loadedImages += 1
                updateRealTarget()
            }
            img.addEventListener("load", onDone, { once: true })
            img.addEventListener("error", onDone, { once: true })
            cleanupImageListeners.push(() => {
                img.removeEventListener("load", onDone)
                img.removeEventListener("error", onDone)
            })
        })

        const onReadyStateChange = () => {
            loadGateRef.current.readyState = document.readyState
            updateRealTarget()
        }

        const onWindowLoad = () => {
            loadGateRef.current.windowLoaded = true
            loadGateRef.current.readyState = document.readyState
            updateRealTarget()
        }

        document.addEventListener("readystatechange", onReadyStateChange)
        window.addEventListener("load", onWindowLoad, { once: true })

        let observer: PerformanceObserver | null = null
        if (typeof PerformanceObserver !== "undefined") {
            observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                if (entries.length === 0) return
                loadGateRef.current.totalResources += entries.length
                loadGateRef.current.loadedResources += entries.length
                updateRealTarget()
            })
            try {
                observer.observe({ entryTypes: ["resource"] })
            } catch {
                observer = null
            }
        }

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready
                .then(() => {
                    loadGateRef.current.fontsReady = true
                    updateRealTarget()
                })
                .catch(() => {
                    loadGateRef.current.fontsReady = true
                    updateRealTarget()
                })
        } else {
            loadGateRef.current.fontsReady = true
            updateRealTarget()
        }

        return () => {
            cleanupImageListeners.forEach((cleanup) => cleanup())
            document.removeEventListener("readystatechange", onReadyStateChange)
            window.removeEventListener("load", onWindowLoad)
            observer?.disconnect()
        }
    }, [shouldRunRuntimeLogic, updateRealTarget])

    useEffect(() => {
        if (!isVisible) return
        if (!shouldRunRuntimeLogic) return

        let lastTime = 0
        const tick = (now: number) => {
            if (!lastTime) lastTime = now
            const dt = now - lastTime
            lastTime = now

            const durationMs = Math.max(animationDuration, 0.01) * 1000
            const alpha = 1 - Math.exp(-dt / durationMs)
            const target = targetProgressRef.current
            const current = displayedProgressRef.current
            const next = Math.min(target, current + (target - current) * alpha)
            const boundedNext = Math.max(current, Math.min(100, next))

            displayedProgressRef.current = boundedNext
            startTransition(() => setDisplayedProgress(boundedNext))

            const realReady =
                targetProgressRef.current >= 100 &&
                boundedNext >= 99.9 &&
                loadGateRef.current.windowLoaded &&
                loadGateRef.current.readyState === "complete" &&
                loadGateRef.current.fontsReady

            const nowTime = typeof performance !== "undefined" ? now : Date.now()
            const elapsed = nowTime - mountTimeRef.current
            const minDisplayMs = Math.max(minDisplay, 0) * 1000
            const minTimeReached = elapsed >= minDisplayMs

            if (
                !isFinishingRef.current &&
                realReady &&
                minTimeReached
            ) {
                isFinishingRef.current = true
                startTransition(() => setIsFadingOut(true))
                const fadeMs = Math.max(fadeDuration, 0) * 1000
                fadeTimeoutRef.current = window.setTimeout(() => {
                    finalizeHide()
                }, fadeMs)
            }

            if (isVisible) {
                animationFrameRef.current = window.requestAnimationFrame(tick)
            }
        }

        animationFrameRef.current = window.requestAnimationFrame(tick)

        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        animationDuration,
        fadeDuration,
        finalizeHide,
        isVisible,
        minDisplay,
        shouldRunRuntimeLogic,
    ])

    useEffect(() => {
        if (!shouldRunRuntimeLogic) return
        if (!isFadingOut) return
        const element = overlayRef.current
        if (!element) return

        const onTransitionEnd = (event: TransitionEvent) => {
            if (event.target !== element) return
            if (event.propertyName !== "opacity") return
            finalizeHide()
        }

        element.addEventListener("transitionend", onTransitionEnd)
        return () => {
            element.removeEventListener("transitionend", onTransitionEnd)
        }
    }, [finalizeHide, isFadingOut, shouldRunRuntimeLogic])

    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null && hasWindow) {
                window.cancelAnimationFrame(animationFrameRef.current)
            }
            if (fadeTimeoutRef.current !== null && hasWindow) {
                window.clearTimeout(fadeTimeoutRef.current)
                fadeTimeoutRef.current = null
            }
        }
    }, [hasWindow])

    if (!isVisible) return null

    const percentLabel = `${Math.round(displayedProgress)}%`

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                pointerEvents: isFadingOut ? "none" : "auto",
            }}
        >
            <div
                ref={overlayRef}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 2147483000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: isFadingOut ? "none" : "auto",
                    opacity: isFadingOut ? 0 : overlayOpacity,
                    transition: isFadingOut
                        ? `opacity ${Math.max(fadeDuration, 0)}s ease`
                        : "none",
                    background: visualBackground,
                    backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                    WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: contentGap,
                        borderRadius,
                    }}
                >
                    {logo?.src ? (
                        <img
                            src={logo.src}
                            srcSet={logo.srcSet}
                            alt={logo.alt || "Logo"}
                            style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: logoWidth,
                                height: "auto",
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    ) : null}

                    <div
                        style={{
                            position: "relative",
                            width: barWidth,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                height: barHeight,
                                borderRadius: barRadius,
                                background: barTrackColor,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    height: "100%",
                                    width: `${displayedProgress}%`,
                                    borderRadius: barRadius,
                                    background: barColor,
                                    willChange: "width",
                                }}
                            />
                        </div>
                        {showPercentage ? (
                            <div
                                style={{
                                    position: "relative",
                                    color: percentageColor,
                                    fontSize: 12,
                                    lineHeight: "1em",
                                    letterSpacing: "0.01em",
                                    minWidth: "max-content",
                                }}
                            >
                                {percentLabel}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(SiteLoader, {
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 120,
        min: 24,
        max: 600,
        unit: "px",
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    backgroundGradient: {
        type: ControlType.String,
        title: "Gradient",
        defaultValue: "",
        placeholder: "linear-gradient(...)",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay α",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0,
        min: 0,
        max: 50,
        unit: "px",
        step: 1,
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar",
        defaultValue: "#111111",
    },
    barTrackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "rgba(0, 0, 0, 0.12)",
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 280,
        min: 80,
        max: 1000,
        unit: "px",
        step: 1,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 4,
        min: 2,
        max: 24,
        unit: "px",
        step: 1,
    },
    barRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        unit: "px",
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 64,
        unit: "px",
        step: 1,
    },
    contentGap: {
        type: ControlType.Number,
        title: "Content Gap",
        defaultValue: 28,
        min: 0,
        max: 120,
        unit: "px",
        step: 1,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Easing (s)",
        defaultValue: 0.4,
        min: 0.05,
        max: 3,
        step: 0.01,
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade (s)",
        defaultValue: 0.6,
        min: 0,
        max: 3,
        step: 0.01,
    },
    minDisplay: {
        type: ControlType.Number,
        title: "Min Show (s)",
        defaultValue: 3,
        min: 0,
        max: 15,
        step: 0.1,
    },
    showPercentage: {
        type: ControlType.Boolean,
        title: "Show %",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    percentageColor: {
        type: ControlType.Color,
        title: "% Color",
        defaultValue: "#000000",
    },
})