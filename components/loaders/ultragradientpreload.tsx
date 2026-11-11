// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useInView } from "framer-motion"
import { startTransition, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

/*
Instructions from user:
- Fix issue where hero content shows above/under the preloader by allowing higher z-index (set to 10).
- Add full customization: text, colors, font color, background color.
*/

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function UltraGradientPreloader(props: Props) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.1 })
    const shouldAnimate = !isStatic && isInView

    const {
        enabled,
        title,
        showPercentage,
        showProgressBar,
        zIndex,
        backgroundBlur,
        overlayOpacity,

        gradient1,
        gradient2,
        gradient3,

        overlayColor,
        textColor,
        progressTrackColor,

        progressGradient1,
        progressGradient2,
        progressGradient3,

        titleFont,
        percentFont,

        tickMs,
        incrementMax,
        holdMsAfterDone,
        exitDuration,

        style,
    } = props

    const [loading, setLoading] = useState(enabled)
    const [progress, setProgress] = useState(0)

    const intervalIdRef = useRef<number | null>(null)
    const doneTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
        startTransition(() => {
            setLoading(enabled)
            setProgress(0)
        })
    }, [enabled])

    useEffect(() => {
        if (!shouldAnimate) return
        if (!enabled) return
        if (!loading) return

        if (typeof window === "undefined") return

        if (intervalIdRef.current != null) {
            window.clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
        }
        if (doneTimeoutRef.current != null) {
            window.clearTimeout(doneTimeoutRef.current)
            doneTimeoutRef.current = null
        }

        const safeTickMs = Math.max(16, Math.round(tickMs))
        const safeIncrementMax = Math.max(0.1, incrementMax)

        intervalIdRef.current = window.setInterval(() => {
            startTransition(() => {
                setProgress((prev) => {
                    if (prev >= 100) return 100
                    const next = prev + Math.random() * safeIncrementMax
                    return next >= 100 ? 100 : next
                })
            })
        }, safeTickMs)

        return () => {
            if (typeof window === "undefined") return
            if (intervalIdRef.current != null) {
                window.clearInterval(intervalIdRef.current)
                intervalIdRef.current = null
            }
            if (doneTimeoutRef.current != null) {
                window.clearTimeout(doneTimeoutRef.current)
                doneTimeoutRef.current = null
            }
        }
    }, [enabled, loading, shouldAnimate, tickMs, incrementMax])

    useEffect(() => {
        if (!shouldAnimate) return
        if (!enabled) return
        if (!loading) return
        if (progress < 100) return

        if (typeof window === "undefined") return

        if (intervalIdRef.current != null) {
            window.clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
        }

        if (doneTimeoutRef.current != null) {
            window.clearTimeout(doneTimeoutRef.current)
            doneTimeoutRef.current = null
        }

        const safeHold = Math.max(0, Math.round(holdMsAfterDone))
        doneTimeoutRef.current = window.setTimeout(() => {
            startTransition(() => setLoading(false))
        }, safeHold)

        return () => {
            if (typeof window === "undefined") return
            if (doneTimeoutRef.current != null) {
                window.clearTimeout(doneTimeoutRef.current)
                doneTimeoutRef.current = null
            }
        }
    }, [progress, enabled, loading, shouldAnimate, holdMsAfterDone])

    const gradientFrames = useMemo(() => {
        const g1 = `linear-gradient(120deg, ${gradient1}, ${gradient2}, ${gradient3})`
        const g2 = `linear-gradient(240deg, ${gradient2}, ${gradient3}, ${gradient1})`
        const g3 = `linear-gradient(360deg, ${gradient3}, ${gradient1}, ${gradient2})`
        return [g1, g2, g3]
    }, [gradient1, gradient2, gradient3])

    const progressGradient = useMemo(() => {
        return `linear-gradient(90deg, ${progressGradient1}, ${progressGradient2}, ${progressGradient3})`
    }, [progressGradient1, progressGradient2, progressGradient3])

    const clampedProgress = Math.min(100, Math.max(0, progress))
    const percentText = `${Math.min(100, Math.floor(clampedProgress))}%`

    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    if (isThumbnail) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: "#000",
                    borderRadius: 12,
                    ...style,
                }}
                aria-label="Preloader thumbnail"
            />
        )
    }

    if (isStatic) {
        if (!(enabled && loading)) return null

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex,
                    overflow: "hidden",
                    pointerEvents: "auto",
                    ...style,
                }}
                role="status"
                aria-live="polite"
                aria-label="Loading screen"
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        filter: `blur(${Math.max(0, backgroundBlur)}px)`,
                        opacity: 1,
                        background: gradientFrames[0],
                    }}
                    aria-hidden="true"
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: overlayColor,
                        opacity: Math.min(1, Math.max(0, overlayOpacity)),
                    }}
                    aria-hidden="true"
                />

                <h1
                    style={{
                        margin: 0,
                        marginBottom: 20,
                        textAlign: "center",
                        zIndex: 1,
                        textShadow: "0 0 30px rgba(255,255,255,0.2)",
                        ...titleFont,
                        color: textColor,
                    }}
                >
                    {title}
                </h1>

                {showPercentage && (
                    <div
                        style={{
                            letterSpacing: "2px",
                            opacity: 0.9,
                            zIndex: 1,
                            ...percentFont,
                            color: textColor,
                        }}
                    >
                        {percentText}
                    </div>
                )}

                {showProgressBar && (
                    <div
                        style={{
                            width: 260,
                            height: 4,
                            marginTop: 14,
                            borderRadius: 10,
                            overflow: "hidden",
                            background: progressTrackColor,
                            zIndex: 1,
                        }}
                        aria-hidden="true"
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${clampedProgress}%`,
                                background: progressGradient,
                            }}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <AnimatePresence>
            {enabled && loading && (
                <motion.div
                    ref={containerRef}
                    initial={false}
                    exit={shouldAnimate ? { opacity: 0, scale: 1.05, filter: "blur(8px)" } : undefined}
                    transition={shouldAnimate ? { duration: Math.max(0, exitDuration) } : undefined}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: textColor,
                        zIndex,
                        overflow: "hidden",
                        pointerEvents: "auto",
                        ...style,
                    }}
                    role="status"
                    aria-live="polite"
                    aria-label="Loading screen"
                >
                    {shouldAnimate ? (
                        <motion.div
                            animate={{
                                background: gradientFrames,
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                filter: `blur(${Math.max(0, backgroundBlur)}px)`,
                                opacity: 1,
                                background: gradientFrames[0],
                            }}
                            aria-hidden="true"
                        />
                    ) : (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                filter: `blur(${Math.max(0, backgroundBlur)}px)`,
                                opacity: 1,
                                background: gradientFrames[0],
                            }}
                            aria-hidden="true"
                        />
                    )}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: overlayColor,
                            opacity: Math.min(1, Math.max(0, overlayOpacity)),
                        }}
                        aria-hidden="true"
                    />

                    {shouldAnimate ? (
                        <motion.h1
                            initial={{ opacity: 0, y: 40, letterSpacing: "20px" }}
                            animate={{ opacity: 1, y: 0, letterSpacing: "6px" }}
                            transition={{ duration: 1 }}
                            style={{
                                margin: 0,
                                marginBottom: 20,
                                textAlign: "center",
                                zIndex: 1,
                                textShadow: "0 0 30px rgba(255,255,255,0.2)",
                                ...titleFont,
                                color: textColor,
                            }}
                        >
                            {title}
                        </motion.h1>
                    ) : (
                        <h1
                            style={{
                                margin: 0,
                                marginBottom: 20,
                                textAlign: "center",
                                zIndex: 1,
                                textShadow: "0 0 30px rgba(255,255,255,0.2)",
                                ...titleFont,
                                color: textColor,
                            }}
                        >
                            {title}
                        </h1>
                    )}

                    {showPercentage &&
                        (shouldAnimate ? (
                            <motion.div
                                key={percentText}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    letterSpacing: "2px",
                                    opacity: 0.9,
                                    zIndex: 1,
                                    ...percentFont,
                                    color: textColor,
                                }}
                            >
                                {percentText}
                            </motion.div>
                        ) : (
                            <div
                                style={{
                                    letterSpacing: "2px",
                                    opacity: 0.9,
                                    zIndex: 1,
                                    ...percentFont,
                                    color: textColor,
                                }}
                            >
                                {percentText}
                            </div>
                        ))}

                    {showProgressBar && (
                        <div
                            style={{
                                width: 260,
                                height: 4,
                                marginTop: 14,
                                borderRadius: 10,
                                overflow: "hidden",
                                background: progressTrackColor,
                                zIndex: 1,
                            }}
                            aria-hidden="true"
                        >
                            <div
                                style={{
                                    height: "100%",
                                    width: `${clampedProgress}%`,
                                    background: progressGradient,
                                }}
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

type Props = {
    enabled: boolean
    title: string
    showPercentage: boolean
    showProgressBar: boolean

    zIndex: number

    gradient1: string
    gradient2: string
    gradient3: string

    overlayColor: string
    overlayOpacity: number

    textColor: string

    progressTrackColor: string
    progressGradient1: string
    progressGradient2: string
    progressGradient3: string

    backgroundBlur: number

    tickMs: number
    incrementMax: number
    holdMsAfterDone: number
    exitDuration: number

    titleFont: CSSProperties
    percentFont: CSSProperties

    style?: CSSProperties
}

addPropertyControls(UltraGradientPreloader, {
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "MileMaker",
    },
    showPercentage: {
        type: ControlType.Boolean,
        title: "Percentage",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showProgressBar: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 10,
        min: -10,
        max: 99999,
        step: 1,
        displayStepper: true,
    },

    gradient1: { type: ControlType.Color, title: "Gradient 1", defaultValue: "#000000" },
    gradient2: { type: ControlType.Color, title: "Gradient 2", defaultValue: "#CCCCCC" },
    gradient3: { type: ControlType.Color, title: "Gradient 3", defaultValue: "#FFFFFF" },

    overlayColor: { type: ControlType.Color, title: "Overlay", defaultValue: "#000000" },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
    },

    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },

    progressTrackColor: { type: ControlType.Color, title: "Track", defaultValue: "#CCCCCC" },
    progressGradient1: { type: ControlType.Color, title: "Bar 1", defaultValue: "#000000" },
    progressGradient2: { type: ControlType.Color, title: "Bar 2", defaultValue: "#CCCCCC" },
    progressGradient3: { type: ControlType.Color, title: "Bar 3", defaultValue: "#FFFFFF" },

    backgroundBlur: {
        type: ControlType.Number,
        title: "BG Blur",
        defaultValue: 60,
        min: 0,
        max: 160,
        step: 1,
    },

    tickMs: {
        type: ControlType.Number,
        title: "Tick (ms)",
        defaultValue: 90,
        min: 16,
        max: 500,
        step: 1,
    },
    incrementMax: {
        type: ControlType.Number,
        title: "Increment Max",
        defaultValue: 6,
        min: 0.1,
        max: 30,
        step: 0.1,
    },
    holdMsAfterDone: {
        type: ControlType.Number,
        title: "Hold (ms)",
        defaultValue: 500,
        min: 0,
        max: 5000,
        step: 50,
    },
    exitDuration: {
        type: ControlType.Number,
        title: "Exit (s)",
        defaultValue: 0.8,
        min: 0,
        max: 5,
        step: 0.05,
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 100,
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },
    percentFont: {
        type: ControlType.Font,
        title: "Percent Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 22,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
})