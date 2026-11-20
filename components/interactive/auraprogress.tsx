import * as React from "react"
import {
    useEffect,
    useMemo,
    useState,
    useRef,
    useId,
} from "react"
import { motion, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

// Shared global scroll dispatcher: throttled with requestAnimationFrame and shared across instances
const scrollSubscribers = new Set<(percent: number) => void>()
let scrollRafId: number | null = null

function calculateScrollPercent(): number {
    if (typeof window === "undefined" || typeof document === "undefined") return 0
    const scrollY = window.scrollY || document.documentElement.scrollTop
    const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
    if (maxScroll <= 0) return 100
    return Math.min(100, Math.max(0, (scrollY / maxScroll) * 100))
}

function handleGlobalScroll() {
    if (scrollRafId !== null) return
    scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null
        const pct = calculateScrollPercent()
        scrollSubscribers.forEach((cb) => cb(pct))
    })
}

function subscribeScroll(callback: (percent: number) => void): () => void {
    scrollSubscribers.add(callback)
    callback(calculateScrollPercent())
    if (scrollSubscribers.size === 1 && typeof window !== "undefined") {
        window.addEventListener("scroll", handleGlobalScroll, { passive: true })
        window.addEventListener("resize", handleGlobalScroll, { passive: true })
    }
    return () => {
        scrollSubscribers.delete(callback)
        if (scrollSubscribers.size === 0 && typeof window !== "undefined") {
            window.removeEventListener("scroll", handleGlobalScroll)
            window.removeEventListener("resize", handleGlobalScroll)
            if (scrollRafId !== null) {
                cancelAnimationFrame(scrollRafId)
                scrollRafId = null
            }
        }
    }
}

interface AuraProgressProps {
    progress: number
    mode: "manual" | "scroll" | "indeterminate"
    variant:
        | "bar"
        | "capsule"
        | "circle"
        | "gauge"
        | "wave"
        | "drop"
        | "segmented"
    showAllVariants: boolean
    title: string
    showTitle: boolean
    trackHeight: number
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    glowEffect: boolean
    glowIntensity: number
    enablePulse: boolean
    pulseIntensity: number
    animateOnView: boolean
    showPercentage: boolean
    labelPrefix: string
    labelSuffix: string
    percentageFont?: React.CSSProperties
    percentageColor: string
    strokeWidth: number
    segmentCount: number
    borderRadius: number
    waveSpeed: number
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AuraProgress(props: AuraProgressProps) {
    const {
        progress = 68,
        mode = "manual",
        variant = "capsule",
        showAllVariants = false,
        title = "Progress",
        showTitle = false,
        trackHeight = 12,
        primaryColor = "#6366F1",
        secondaryColor = "#06B6D4",
        backgroundColor = "rgba(255, 255, 255, 0.08)",
        glowEffect = true,
        glowIntensity = 18,
        enablePulse = true,
        pulseIntensity = 0.35,
        animateOnView = true,
        showPercentage = true,
        labelPrefix = "",
        labelSuffix = "%",
        percentageFont,
        percentageColor = "#FFFFFF",
        strokeWidth = 7,
        segmentCount = 14,
        borderRadius = 9999,
        waveSpeed = 1.0,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.15 })
    const isIndeterminate = mode === "indeterminate"

    // Unique SVG ID to eliminate cross-instance defs collisions
    const rawId = useId()
    const svgId = useMemo(() => `aura-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`, [rawId])

    // Container dimension tracking with ResizeObserver
    const [dimensions, setDimensions] = useState({ width: 360, height: 100 })
    useEffect(() => {
        if (!containerRef.current || isStatic || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry && entry.contentRect) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                })
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    const isSmall = dimensions.width < 220 || dimensions.height < 70

    // Reduced motion support
    const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mq.matches)

        const handler = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches)
        }
        if (mq.addEventListener) {
            mq.addEventListener("change", handler)
            return () => mq.removeEventListener("change", handler)
        } else if (mq.addListener) {
            mq.addListener(handler)
            return () => mq.removeListener(handler)
        }
    }, [])

    const shouldAnimate = !isStatic && (!animateOnView || isInView) && !prefersReducedMotion
    const loopRepeat = shouldAnimate ? Number.POSITIVE_INFINITY : 0

    // Scroll progress tracking (for page reading mode via shared throttled dispatcher)
    const [scrollPercent, setScrollPercent] = useState<number>(0)
    useEffect(() => {
        if (mode !== "scroll" || isStatic || typeof window === "undefined") return
        return subscribeScroll(setScrollPercent)
    }, [mode, isStatic])

    // Target progress calculation
    const targetProgress = useMemo(() => {
        if (mode === "scroll") return scrollPercent
        if (mode === "indeterminate") return 0
        return Math.max(0, Math.min(100, progress))
    }, [mode, scrollPercent, progress])

    // Smooth Spring physics
    const springProgress = useSpring(0, {
        stiffness: 85,
        damping: 18,
        mass: 1.0,
    })

    const [displayProgress, setDisplayProgress] = useState<number>(() =>
        isStatic || !animateOnView ? targetProgress : 0
    )

    useEffect(() => {
        if (isStatic || prefersReducedMotion) {
            springProgress.set(targetProgress)
            setDisplayProgress(targetProgress)
            return
        }

        if (animateOnView && mode !== "indeterminate") {
            if (isInView) {
                springProgress.set(targetProgress)
            } else {
                springProgress.set(0)
            }
        } else {
            springProgress.set(targetProgress)
        }
    }, [
        targetProgress,
        animateOnView,
        isInView,
        isStatic,
        prefersReducedMotion,
        springProgress,
        mode,
    ])

    // Subscribe to spring value for reactive number counter
    useEffect(() => {
        if (isStatic || prefersReducedMotion || mode === "indeterminate") return
        const unsubscribe = springProgress.on("change", (latest: number) => {
            setDisplayProgress(Math.max(0, Math.min(100, latest)))
        })
        return () => unsubscribe()
    }, [springProgress, isStatic, prefersReducedMotion, mode])

    // Shared SVG definitions (gradients & generous unclipped filter regions)
    const renderDefs = () => (
        <defs>
            <linearGradient id={`${svgId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            <linearGradient id={`${svgId}-grad-h`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            <linearGradient id={`${svgId}-grad-v`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            {/* Unclipped filter region: -100% to 300% avoids edge cutoff */}
            <filter id={`${svgId}-glow`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation={Math.max(2, glowIntensity * 0.35)}
                    result="softBlur"
                />
                <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation={Math.max(1, glowIntensity * 0.12)}
                    result="coreBlur"
                />
                <feMerge>
                    <feMergeNode in="softBlur" />
                    <feMergeNode in="coreBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    )

    // Formatted label text for indeterminate or numeric progress
    const labelText = isIndeterminate
        ? labelPrefix
            ? `${labelPrefix}...`
            : "Loading..."
        : `${labelPrefix}${Math.round(displayProgress)}${labelSuffix}`

    // Header row with Title & Percentage
    const renderHeader = () => {
        if (!showTitle && !showPercentage) return null
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    marginBottom: "8px",
                    overflow: "visible",
                }}
            >
                {showTitle ? (
                    <span
                        style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            color: "rgba(255, 255, 255, 0.7)",
                            textTransform: "uppercase",
                        }}
                    >
                        {title}
                    </span>
                ) : <span />}
                {showPercentage && (
                    <motion.span
                        animate={
                            isIndeterminate && shouldAnimate
                                ? { opacity: [0.5, 1, 0.5] }
                                : undefined
                        }
                        transition={
                            isIndeterminate
                                ? {
                                      duration: 1.5,
                                      repeat: loopRepeat,
                                      ease: "easeInOut",
                                  }
                                : undefined
                        }
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                            color: percentageColor,
                            letterSpacing: "-0.01em",
                            ...percentageFont,
                        }}
                    >
                        {labelText}
                    </motion.span>
                )}
            </div>
        )
    }

    // 1. LINEAR BAR
    const renderBar = () => {
        const fillWidth = `${displayProgress}%`
        const actualRadius = borderRadius > 0 ? borderRadius : 8

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                {renderHeader()}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: `${trackHeight}px`,
                        overflow: "visible",
                    }}
                >
                    {/* Unclipped Ambient Glow Underlay */}
                    {glowEffect && (
                        <motion.div
                            style={{
                                position: "absolute",
                                top: "-3px",
                                bottom: "-3px",
                                width: isIndeterminate ? "35%" : `calc(${fillWidth} + 6px)`,
                                borderRadius: actualRadius,
                                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                filter: `blur(${glowIntensity}px)`,
                                opacity: 0.75,
                                pointerEvents: "none",
                                zIndex: 0,
                                ...(isIndeterminate ? {} : { left: "-3px" }),
                            }}
                            animate={
                                isIndeterminate
                                    ? shouldAnimate
                                        ? { left: ["-35%", "100%"] }
                                        : { left: "32%" }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.6 / waveSpeed,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                        />
                    )}

                    {/* Physical Track Container */}
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            backgroundColor,
                            borderRadius: actualRadius,
                            overflow: "hidden",
                            zIndex: 1,
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                height: "100%",
                                width: isIndeterminate ? "35%" : fillWidth,
                                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                borderRadius: actualRadius,
                                ...(isIndeterminate ? {} : { left: 0 }),
                            }}
                            animate={
                                isIndeterminate
                                    ? shouldAnimate
                                        ? { left: ["-35%", "100%"] }
                                        : { left: "32%" }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.6 / waveSpeed,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                        >
                            {/* Specular gloss highlight */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "45%",
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
                                    borderRadius: `${actualRadius}px ${actualRadius}px 0 0`,
                                }}
                            />
                            {/* Rhythmic breathing pulse in manual/scroll mode */}
                            {!isIndeterminate && enablePulse && !prefersReducedMotion && isInView && (
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "rgba(255, 255, 255, 0.25)",
                                        borderRadius: actualRadius,
                                    }}
                                    animate={{ opacity: [0, pulseIntensity, 0] }}
                                    transition={{
                                        duration: 2.2,
                                        repeat: loopRepeat,
                                        ease: "easeInOut",
                                    }}
                                />
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        )
    }

    // 2. LIQUID CAPSULE
    const renderCapsule = () => {
        const fillWidth = `${displayProgress}%`
        const capsuleHeight = Math.max(trackHeight, 18)

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                {renderHeader()}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: `${capsuleHeight}px`,
                        overflow: "visible",
                    }}
                >
                    {/* Unclipped Ambient Pill Glow Underlay */}
                    {glowEffect && (
                        <motion.div
                            style={{
                                position: "absolute",
                                top: "-3px",
                                bottom: "-3px",
                                width: isIndeterminate ? "35%" : `calc(${fillWidth} + 6px)`,
                                borderRadius: 9999,
                                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                filter: `blur(${glowIntensity}px)`,
                                opacity: 0.8,
                                pointerEvents: "none",
                                zIndex: 0,
                                ...(isIndeterminate ? {} : { left: "-3px" }),
                            }}
                            animate={
                                isIndeterminate
                                    ? shouldAnimate
                                        ? { left: ["-35%", "100%"] }
                                        : { left: "32%" }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.6 / waveSpeed,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                        />
                    )}

                    {/* Physical Pill Container */}
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            backgroundColor,
                            borderRadius: 9999,
                            overflow: "hidden",
                            zIndex: 1,
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                height: "100%",
                                width: isIndeterminate ? "35%" : fillWidth,
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                borderRadius: 9999,
                                ...(isIndeterminate ? {} : { left: 0 }),
                            }}
                            animate={
                                isIndeterminate
                                    ? shouldAnimate
                                        ? { left: ["-35%", "100%"] }
                                        : { left: "32%" }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.6 / waveSpeed,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                        >
                            {/* Glass curvature highlight */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "50%",
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
                                    borderRadius: "9999px 9999px 0 0",
                                }}
                            />
                            {/* Liquid breathing pulse in manual/scroll mode */}
                            {!isIndeterminate && enablePulse && !prefersReducedMotion && isInView && (
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "rgba(255, 255, 255, 0.3)",
                                        borderRadius: 9999,
                                    }}
                                    animate={{ opacity: [0, pulseIntensity, 0] }}
                                    transition={{
                                        duration: 2.0,
                                        repeat: loopRepeat,
                                        ease: "easeInOut",
                                    }}
                                />
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        )
    }

    // 3. RADIAL RING
    const renderCircle = () => {
        const radius = 38
        const circumference = 2 * Math.PI * radius
        const offset = circumference * (1 - displayProgress / 100)

        // Dynamic clockwise gradient: Start (12 o'clock in <g>) is always primaryColor (dark),
        // and the leading tip of the progress arc is always secondaryColor (bright blue).
        const effP = isIndeterminate ? 65 : Math.max(15, Math.min(95, displayProgress))
        const effRad = (effP / 100) * 2 * Math.PI
        const tipX = (60 + radius * Math.cos(effRad)).toFixed(2)
        const tipY = (60 + radius * Math.sin(effRad)).toFixed(2)

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                <svg
                    style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: showAllVariants ? "105px" : "100%",
                        maxWidth: showAllVariants ? "105px" : "100%",
                        aspectRatio: "1 / 1",
                        overflow: "visible",
                    }}
                    viewBox="0 0 120 120"
                >
                    {renderDefs()}
                    <defs>
                        <linearGradient
                            id={`${svgId}-ring-grad`}
                            gradientUnits="userSpaceOnUse"
                            x1="98"
                            y1="60"
                            x2={tipX}
                            y2={tipY}
                        >
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>
                    </defs>

                    {/* Standard SVG group rotation to 12 o'clock (prevents Framer Motion CSS transform-origin bugs) */}
                    <g transform="rotate(-90 60 60)">
                        {/* Unclipped Ambient Diffused Ring Glow Underlay */}
                        {glowEffect && (
                            <motion.circle
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                stroke={`url(#${svgId}-ring-grad)`}
                                strokeWidth={strokeWidth * 1.5}
                                strokeLinecap="round"
                                strokeDasharray={
                                    isIndeterminate
                                        ? `${circumference * 0.3} ${circumference * 0.7}`
                                        : `${circumference} ${circumference}`
                                }
                                strokeDashoffset={isIndeterminate ? 0 : offset}
                                opacity={0.65}
                                filter={`url(#${svgId}-glow)`}
                                animate={
                                    isIndeterminate && shouldAnimate
                                        ? { strokeDashoffset: [0, -circumference] }
                                        : !isIndeterminate && enablePulse && !prefersReducedMotion && isInView
                                        ? { opacity: [0.35, Math.min(1, 0.35 + pulseIntensity * 0.5), 0.35] }
                                        : undefined
                                }
                                transition={
                                    isIndeterminate
                                        ? {
                                              duration: 1.4 / waveSpeed,
                                              repeat: loopRepeat,
                                              ease: "linear",
                                          }
                                        : {
                                              duration: 2.0,
                                              repeat: loopRepeat,
                                              ease: "easeInOut",
                                          }
                                }
                            />
                        )}

                        {/* Background track ring */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={backgroundColor}
                            strokeWidth={strokeWidth}
                        />

                        {/* Foreground sharp gradient progress arc */}
                        <motion.circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={`url(#${svgId}-ring-grad)`}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={
                                isIndeterminate
                                    ? `${circumference * 0.3} ${circumference * 0.7}`
                                    : `${circumference} ${circumference}`
                            }
                            strokeDashoffset={isIndeterminate ? 0 : offset}
                            animate={
                                isIndeterminate && shouldAnimate
                                    ? { strokeDashoffset: [0, -circumference] }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.4 / waveSpeed,
                                          repeat: loopRepeat,
                                          ease: "linear",
                                      }
                                    : undefined
                            }
                        />
                    </g>
                </svg>

                {/* Centered Readout & Subtitle */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 10,
                    }}
                >
                    {showPercentage && (
                        <motion.span
                            animate={
                                isIndeterminate && shouldAnimate
                                    ? { opacity: [0.5, 1, 0.5] }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.5,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                            style={{
                                fontSize: isIndeterminate ? "13px" : "15px",
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                color: percentageColor,
                                letterSpacing: "-0.02em",
                                ...percentageFont,
                            }}
                        >
                            {labelText}
                        </motion.span>
                    )}
                    {showTitle && (
                        <span
                            style={{
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                color: "rgba(255, 255, 255, 0.5)",
                                textTransform: "uppercase",
                                marginTop: "1px",
                            }}
                        >
                            {title}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    // 4. DASHBOARD ARC GAUGE (220° Precision Meter)
    const renderGauge = () => {
        const radius = 38
        const totalAngle = 220
        const totalCircumference = 2 * Math.PI * radius
        const arcCircumference = (totalAngle / 360) * totalCircumference
        const filledLength = (displayProgress / 100) * arcCircumference

        // Dynamic clockwise gauge gradient: Start (160° screen left in <g>) is always primaryColor (dark),
        // and the advancing tip is always secondaryColor (bright blue).
        const effGP = isIndeterminate ? 60 : Math.max(15, Math.min(95, displayProgress))
        const effGRad = ((effGP / 100) * 220 * Math.PI) / 180
        const gaugeTipX = (60 + radius * Math.cos(effGRad)).toFixed(2)
        const gaugeTipY = (60 + radius * Math.sin(effGRad)).toFixed(2)

        // Gauge tick marks
        const tickCount = 9
        const ticks = Array.from({ length: tickCount }).map((_, i) => {
            const angle = 160 + (i / (tickCount - 1)) * 220
            const rad = (angle * Math.PI) / 180
            const x1 = 60 + (radius + 5) * Math.cos(rad)
            const y1 = 60 + (radius + 5) * Math.sin(rad)
            const x2 = 60 + (radius + 9) * Math.cos(rad)
            const y2 = 60 + (radius + 9) * Math.sin(rad)
            const isActive = isIndeterminate || (i / (tickCount - 1)) * 100 <= displayProgress
            return { x1, y1, x2, y2, isActive }
        })

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                <svg
                    style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: showAllVariants ? "105px" : "100%",
                        maxWidth: showAllVariants ? "140px" : "100%",
                        overflow: "visible",
                    }}
                    viewBox="0 0 120 110"
                >
                    {renderDefs()}
                    <defs>
                        <linearGradient
                            id={`${svgId}-gauge-grad`}
                            gradientUnits="userSpaceOnUse"
                            x1="98"
                            y1="60"
                            x2={gaugeTipX}
                            y2={gaugeTipY}
                        >
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>
                    </defs>

                    {/* Precision Dashboard Ticks */}
                    {ticks.map((t, idx) => (
                        <line
                            key={idx}
                            x1={t.x1}
                            y1={t.y1}
                            x2={t.x2}
                            y2={t.y2}
                            stroke={t.isActive ? secondaryColor : "rgba(255,255,255,0.18)"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity={t.isActive ? 0.9 : 0.4}
                        />
                    ))}

                    {/* Standard SVG group rotation to 160° start */}
                    <g transform="rotate(160 60 60)">
                        {/* Unclipped Ambient Glow Arc */}
                        {glowEffect && (
                            <motion.circle
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                stroke={`url(#${svgId}-gauge-grad)`}
                                strokeWidth={strokeWidth * 1.5}
                                strokeLinecap="round"
                                strokeDasharray={
                                    isIndeterminate
                                        ? `${arcCircumference * 0.35} ${totalCircumference}`
                                        : `${filledLength} ${totalCircumference}`
                                }
                                opacity={0.65}
                                filter={`url(#${svgId}-glow)`}
                                animate={
                                    isIndeterminate && shouldAnimate
                                        ? {
                                              strokeDashoffset: [
                                                  0,
                                                  -(arcCircumference * 0.65),
                                                  0,
                                              ],
                                          }
                                        : !isIndeterminate && enablePulse && !prefersReducedMotion && isInView
                                        ? { opacity: [0.35, Math.min(1, 0.35 + pulseIntensity * 0.5), 0.35] }
                                        : undefined
                                }
                                transition={
                                    isIndeterminate
                                        ? {
                                              duration: 2.2 / waveSpeed,
                                              repeat: loopRepeat,
                                              ease: "easeInOut",
                                          }
                                        : {
                                              duration: 2.0,
                                              repeat: loopRepeat,
                                              ease: "easeInOut",
                                          }
                                }
                            />
                        )}

                        {/* Background Arc */}
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={backgroundColor}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${arcCircumference} ${totalCircumference}`}
                        />

                        {/* Foreground Glowing Progress Arc */}
                        <motion.circle
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={`url(#${svgId}-gauge-grad)`}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={
                                isIndeterminate
                                    ? `${arcCircumference * 0.35} ${totalCircumference}`
                                    : `${filledLength} ${totalCircumference}`
                            }
                            animate={
                                isIndeterminate && shouldAnimate
                                    ? {
                                          strokeDashoffset: [
                                              0,
                                              -(arcCircumference * 0.65),
                                              0,
                                          ],
                                      }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 2.2 / waveSpeed,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                        />
                    </g>
                </svg>

                {/* Centered Readout & Subtitle */}
                <div
                    style={{
                        position: "absolute",
                        top: "52%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 10,
                    }}
                >
                    {showPercentage && (
                        <motion.span
                            animate={
                                isIndeterminate && shouldAnimate
                                    ? { opacity: [0.5, 1, 0.5] }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.5,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                            style={{
                                fontSize: isIndeterminate ? "13px" : "15px",
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                color: percentageColor,
                                letterSpacing: "-0.02em",
                                ...percentageFont,
                            }}
                        >
                            {labelText}
                        </motion.span>
                    )}
                    {showTitle && (
                        <span
                            style={{
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                color: "rgba(255, 255, 255, 0.5)",
                                textTransform: "uppercase",
                                marginTop: "1px",
                            }}
                        >
                            {title}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    // 5. CYBER HUD SEGMENTED
    const renderSegmented = () => {
        const total = Math.max(6, Math.min(30, segmentCount))
        const activeCount = Math.round((displayProgress / 100) * total)
        const segHeight = Math.max(trackHeight, 14)

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                {renderHeader()}
                <div
                    style={{
                        display: "flex",
                        gap: isSmall ? "3px" : "4px",
                        width: "100%",
                        height: `${segHeight}px`,
                        alignItems: "center",
                        overflow: "visible",
                    }}
                >
                    {Array.from({ length: total }).map((_, idx) => {
                        const isActive = idx < activeCount
                        const isFrontier = idx === activeCount - 1
                        return (
                            <motion.div
                                key={idx}
                                style={{
                                    flex: 1,
                                    height: "100%",
                                    borderRadius: 3,
                                    background:
                                        isActive || isIndeterminate
                                            ? `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})`
                                            : backgroundColor,
                                    boxShadow:
                                        (isActive || isIndeterminate) && glowEffect
                                            ? `0 0 ${glowIntensity * 0.5}px ${secondaryColor}88`
                                            : "none",
                                    border:
                                        isActive || isIndeterminate
                                            ? "1px solid rgba(255,255,255,0.18)"
                                            : "1px solid rgba(255,255,255,0.04)",
                                    opacity: isIndeterminate ? 0.35 : isActive ? 1 : 0.35,
                                }}
                                animate={
                                    shouldAnimate
                                        ? isIndeterminate
                                            ? {
                                                  opacity: [0.2, 1, 0.2],
                                                  scale: [1, 1.06, 1],
                                              }
                                            : isFrontier && enablePulse
                                            ? {
                                                  opacity: [1, 0.45, 1],
                                                  scale: [1, 1.04, 1],
                                              }
                                            : undefined
                                        : undefined
                                }
                                transition={{
                                    duration: isIndeterminate ? 1.4 / waveSpeed : 1.2,
                                    repeat: loopRepeat,
                                    delay: isIndeterminate ? (idx / total) * 0.8 : 0,
                                    ease: "easeInOut",
                                }}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }

    // 6. LIQUID WAVE TANK (Fluid Glass Card)
    const renderWave = () => {
        const waveAmp = 4
        const fillY = isIndeterminate ? 50 : 100 - displayProgress

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                {/* Wave Card Container */}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "200px",
                        height: showAllVariants ? "90px" : "100%",
                        maxHeight: "160px",
                        minHeight: "80px",
                        backgroundColor,
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        boxShadow: glowEffect
                            ? `0 8px 24px rgba(0,0,0,0.3), 0 0 ${glowIntensity}px ${primaryColor}35`
                            : "0 6px 18px rgba(0,0,0,0.25)",
                    }}
                >
                    <svg
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "visible",
                        }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        {renderDefs()}
                        {/* Background secondary wave */}
                        <motion.path
                            fill={secondaryColor}
                            opacity="0.4"
                            animate={
                                !prefersReducedMotion && isInView
                                    ? {
                                          d: [
                                              `M0,${fillY} Q12.5,${fillY + waveAmp} 25,${fillY} T50,${fillY} T75,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                              `M0,${fillY} Q12.5,${fillY - waveAmp} 25,${fillY} T50,${fillY} T75,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                              `M0,${fillY} Q12.5,${fillY + waveAmp} 25,${fillY} T50,${fillY} T75,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                          ],
                                      }
                                    : undefined
                            }
                            d={`M0,${fillY} Q25,${fillY - waveAmp} 50,${fillY} T100,${fillY} L100,100 L0,100 Z`}
                            transition={{
                                duration: 3.5 / waveSpeed,
                                repeat: loopRepeat,
                                ease: "easeInOut",
                            }}
                        />
                        {/* Foreground primary wave */}
                        <motion.path
                            fill={`url(#${svgId}-grad-v)`}
                            animate={
                                !prefersReducedMotion && isInView
                                    ? {
                                          d: [
                                              `M0,${fillY} Q12.5,${fillY - waveAmp} 25,${fillY} T50,${fillY} T75,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                              `M0,${fillY} Q12.5,${fillY + waveAmp} 25,${fillY} T50,${fillY} T75,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                              `M0,${fillY} Q12.5,${fillY - waveAmp} 25,${fillY} T50,${fillY} T75,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                          ],
                                      }
                                    : undefined
                            }
                            d={`M0,${fillY} Q25,${fillY + waveAmp} 50,${fillY} T100,${fillY} L100,100 L0,100 Z`}
                            transition={{
                                duration: 2.8 / waveSpeed,
                                repeat: loopRepeat,
                                ease: "easeInOut",
                            }}
                        />
                    </svg>

                    {/* Floating Glass Pill Badge */}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            padding: "4px 12px",
                            background: "rgba(0, 0, 0, 0.5)",
                            backdropFilter: "blur(12px)",
                            borderRadius: 9999,
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            pointerEvents: "none",
                            zIndex: 10,
                        }}
                    >
                        {showPercentage && (
                            <motion.span
                                animate={
                                    isIndeterminate && shouldAnimate
                                        ? { opacity: [0.5, 1, 0.5] }
                                        : undefined
                                }
                                transition={
                                    isIndeterminate
                                        ? {
                                              duration: 1.5,
                                              repeat: loopRepeat,
                                              ease: "easeInOut",
                                          }
                                        : undefined
                                }
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                    color: percentageColor,
                                    ...percentageFont,
                                }}
                            >
                                {labelText}
                            </motion.span>
                        )}
                        {showTitle && (
                            <span
                                style={{
                                    fontSize: "8px",
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    color: "rgba(255, 255, 255, 0.6)",
                                    textTransform: "uppercase",
                                }}
                            >
                                {title}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // 7. FLUID DROP
    const renderDrop = () => {
        const dropPath = "M50,8 C32,8 20,24 20,46 C20,68 34,88 50,92 C66,88 80,68 80,46 C80,24 68,8 50,8 Z"
        const fillY = isIndeterminate ? 50 : 100 - displayProgress

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                <svg
                    style={{
                        height: "100%",
                        maxHeight: showAllVariants ? "105px" : "100%",
                        maxWidth: showAllVariants ? "90px" : "100%",
                        aspectRatio: "1 / 1.2",
                        overflow: "visible",
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {renderDefs()}

                    <clipPath id={`${svgId}-drop-clip`}>
                        <path d={dropPath} />
                    </clipPath>

                    {/* Unclipped Ambient Glow */}
                    {glowEffect && (
                        <path
                            d={dropPath}
                            fill={primaryColor}
                            opacity={0.6}
                            filter={`url(#${svgId}-glow)`}
                        />
                    )}

                    {/* Flask Glass Outline */}
                    <path
                        d={dropPath}
                        fill={backgroundColor}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1.5"
                    />

                    {/* Liquid fill group */}
                    <g clipPath={`url(#${svgId}-drop-clip)`}>
                        <rect
                            x="0"
                            y={fillY}
                            width="100"
                            height="100"
                            fill={`url(#${svgId}-grad-v)`}
                        />
                        {/* Waving fluid surface inside drop */}
                        {!prefersReducedMotion && isInView && (
                            <motion.path
                                fill="white"
                                opacity="0.3"
                                animate={{
                                    d: [
                                        `M0,${fillY} Q25,${fillY - 3} 50,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                        `M0,${fillY} Q25,${fillY + 3} 50,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                        `M0,${fillY} Q25,${fillY - 3} 50,${fillY} T100,${fillY} L100,100 L0,100 Z`,
                                    ],
                                }}
                                transition={{
                                    duration: 3.0 / waveSpeed,
                                    repeat: loopRepeat,
                                    ease: "easeInOut",
                                }}
                            />
                        )}
                    </g>

                    {/* Specular curved reflection on glass */}
                    <path
                        d="M26,38 C26,24 35,14 46,12"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.5)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Floating Glass Pill Badge */}
                <div
                    style={{
                        position: "absolute",
                        top: "52%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: "3px 8px",
                        background: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 9999,
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        pointerEvents: "none",
                        zIndex: 10,
                    }}
                >
                    {showPercentage && (
                        <motion.span
                            animate={
                                isIndeterminate && shouldAnimate
                                    ? { opacity: [0.5, 1, 0.5] }
                                    : undefined
                            }
                            transition={
                                isIndeterminate
                                    ? {
                                          duration: 1.5,
                                          repeat: loopRepeat,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                color: percentageColor,
                                ...percentageFont,
                            }}
                        >
                            {labelText}
                        </motion.span>
                    )}
                </div>
            </div>
        )
    }

    // Showcase Grid Cards
    const renderShowcaseCard = (cardTitle: string, badgeText: string, content: React.ReactNode) => (
        <div
            style={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                overflow: "visible",
                height: "170px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    height: "22px",
                }}
            >
                <span
                    style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.85)",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {cardTitle}
                </span>
                <span
                    style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 9999,
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "rgba(255, 255, 255, 0.6)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                    }}
                >
                    {badgeText}
                </span>
            </div>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "calc(100% - 30px)",
                    maxHeight: "125px",
                    position: "relative",
                    overflow: "visible",
                }}
            >
                {content}
            </div>
        </div>
    )

    return (
        <div
            ref={containerRef}
            role="progressbar"
            aria-valuenow={isIndeterminate ? undefined : Math.round(displayProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={isIndeterminate ? "Loading" : "Progress indicator"}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
                ...style,
            }}
        >
            {showAllVariants ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px",
                        padding: "16px",
                        overflow: "visible",
                    }}
                >
                    {renderShowcaseCard("Linear Bar", "Minimal", renderBar())}
                    {renderShowcaseCard("Liquid Capsule", "Fluid", renderCapsule())}
                    {renderShowcaseCard("Radial Ring", "Circular", renderCircle())}
                    {renderShowcaseCard("Dashboard Arc", "Gauge", renderGauge())}
                    {renderShowcaseCard("Cyber HUD", "Segmented", renderSegmented())}
                    {renderShowcaseCard("Liquid Wave Tank", "Dynamic", renderWave())}
                    {renderShowcaseCard("Fluid Drop", "Flask", renderDrop())}
                </div>
            ) : (
                <>
                    {variant === "bar" && renderBar()}
                    {variant === "capsule" && renderCapsule()}
                    {variant === "circle" && renderCircle()}
                    {variant === "gauge" && renderGauge()}
                    {variant === "segmented" && renderSegmented()}
                    {variant === "wave" && renderWave()}
                    {variant === "drop" && renderDrop()}
                </>
            )}
        </div>
    )
}

addPropertyControls(AuraProgress, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["manual", "scroll", "indeterminate"],
        optionTitles: ["Manual Value", "Page Scroll", "Indeterminate Loop"],
        defaultValue: "manual",
        description: "Page Scroll tracks reading depth; Indeterminate loops continuous loading.",
    },
    progress: {
        type: ControlType.Number,
        title: "Progress",
        defaultValue: 68,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        displayStepper: true,
        hidden(props: Partial<AuraProgressProps>) {
            return props.mode === "scroll" || props.mode === "indeterminate"
        },
    },
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["bar", "capsule", "circle", "gauge", "wave", "drop", "segmented"],
        optionTitles: [
            "Linear Bar",
            "Liquid Capsule",
            "Radial Ring",
            "Dashboard Gauge",
            "Liquid Wave Tank",
            "Fluid Drop",
            "Cyber Segmented",
        ],
        defaultValue: "capsule",
        hidden(props: Partial<AuraProgressProps>) {
            return Boolean(props.showAllVariants)
        },
    },
    showAllVariants: {
        type: ControlType.Boolean,
        title: "Showcase Grid",
        defaultValue: false,
        enabledTitle: "All Styles",
        disabledTitle: "Single",
        description: "Side-by-side comparison matrix of all 7 styles",
    },
    trackHeight: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 12,
        min: 6,
        max: 48,
        step: 2,
        unit: "px",
        hidden(props: Partial<AuraProgressProps>) {
            return (
                props.variant === "circle" ||
                props.variant === "gauge" ||
                props.variant === "wave" ||
                props.variant === "drop"
            )
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        hidden(props: Partial<AuraProgressProps>) {
            return props.variant !== "bar"
        },
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Arc Thickness",
        defaultValue: 7,
        min: 2,
        max: 20,
        step: 1,
        hidden(props: Partial<AuraProgressProps>) {
            return props.variant !== "circle" && props.variant !== "gauge"
        },
    },
    segmentCount: {
        type: ControlType.Number,
        title: "Segments",
        defaultValue: 14,
        min: 6,
        max: 30,
        step: 1,
        hidden(props: Partial<AuraProgressProps>) {
            return props.variant !== "segmented"
        },
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 1.0,
        min: 0.2,
        max: 3.0,
        step: 0.1,
        hidden(props: Partial<AuraProgressProps>) {
            return props.variant !== "wave" && props.variant !== "drop"
        },
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: false,
    },
    title: {
        type: ControlType.String,
        title: "Title Text",
        defaultValue: "Progress",
        hidden(props: Partial<AuraProgressProps>) {
            return !props.showTitle
        },
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#6366F1",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#06B6D4",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "rgba(255, 255, 255, 0.08)",
    },
    glowEffect: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 2,
        hidden(props: Partial<AuraProgressProps>) {
            return !props.glowEffect
        },
    },
    enablePulse: {
        type: ControlType.Boolean,
        title: "Fluid Pulse",
        defaultValue: true,
    },
    pulseIntensity: {
        type: ControlType.Number,
        title: "Pulse Power",
        defaultValue: 0.35,
        min: 0.1,
        max: 0.8,
        step: 0.05,
        displayStepper: true,
        hidden(props: Partial<AuraProgressProps>) {
            return !props.enablePulse
        },
    },
    showPercentage: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
    },
    labelPrefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        hidden(props: Partial<AuraProgressProps>) {
            return !props.showPercentage
        },
    },
    labelSuffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "%",
        hidden(props: Partial<AuraProgressProps>) {
            return !props.showPercentage || props.mode === "indeterminate"
        },
    },
    percentageFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden(props: Partial<AuraProgressProps>) {
            return !props.showPercentage
        },
    },
    percentageColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#FFFFFF",
        hidden(props: Partial<AuraProgressProps>) {
            return !props.showPercentage
        },
    },
    animateOnView: {
        type: ControlType.Boolean,
        title: "View Spring",
        defaultValue: true,
        description: "via [Tanzil Rayhan](https://www.framer.com/%40tanzilrayhan/)",
    },
})
