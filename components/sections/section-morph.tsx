import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMotionValue, useSpring } from "framer-motion"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 340
 */

type ResponseMode = "smooth" | "elastic" | "cinematic" | "custom"

type SpringSettings = {
    stiffness: number
    damping: number
    mass: number
}

type ResponseSettings = {
    spring: SpringSettings
    sensitivity: number
    overshoot: number
    verticalShift: number
    smoothing: number
}

interface SectionMorphProps {
    topColor: string
    bottomColor: string
    visualHeight: number
    curveDepth: number
    curveWidth: number
    responseMode: ResponseMode
    sensitivity: number
    velocitySmoothing: number
    stiffness: number
    damping: number
    mass: number
    overshoot: number
    settleDelay: number
    verticalShift: number
    edgeTension: number
    highlightStrength: number
    reverseMorph: boolean
    fullBleed: boolean
    reducedMotion: boolean
    style?: React.CSSProperties
}

const PRESETS: Record<Exclude<ResponseMode, "custom">, ResponseSettings> = {
    smooth: {
        spring: { stiffness: 120, damping: 28, mass: 0.8 },
        sensitivity: 0.95,
        overshoot: 0.05,
        verticalShift: 6,
        smoothing: 0.14,
    },
    elastic: {
        spring: { stiffness: 85, damping: 15, mass: 1 },
        sensitivity: 1.35,
        overshoot: 0.18,
        verticalShift: 14,
        smoothing: 0.28,
    },
    cinematic: {
        spring: { stiffness: 95, damping: 24, mass: 1 },
        sensitivity: 1.1,
        overshoot: 0.1,
        verticalShift: 10,
        smoothing: 0.18,
    },
}

// The wrapper overlaps its neighbours by this many px on the top and bottom.
// The SVG viewBox overscans by the same amount so it stays 1:1 with the
// rendered size (no resampling, no hairline at the edges).
const OVERSCAN = 3

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function mix(from: number, to: number, amount: number) {
    return from + (to - from) * amount
}

function usePrefersReducedMotion(enabled: boolean) {
    const [matches, setMatches] = React.useState(false)

    React.useEffect(() => {
        if (!enabled || typeof window === "undefined") {
            setMatches(false)
            return
        }

        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setMatches(query.matches)

        update()
        query.addEventListener?.("change", update)

        return () => query.removeEventListener?.("change", update)
    }, [enabled])

    return matches
}

/**
 * @framerDisableUnlink
 */
export default function SectionMorph(props: SectionMorphProps) {
    const {
        topColor = "#111111",
        bottomColor = "#F4F1E8",
        visualHeight = 340,
        curveDepth = 165,
        curveWidth = 72,
        responseMode = "cinematic",
        sensitivity = 1.1,
        velocitySmoothing = 0.18,
        stiffness = 95,
        damping = 24,
        mass = 1,
        overshoot = 0.1,
        settleDelay = 70,
        verticalShift = 10,
        edgeTension = 78,
        highlightStrength = 0.08,
        reverseMorph = false,
        fullBleed = true,
        reducedMotion = true,
        style,
    } = props

    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const animationFrameRef = React.useRef<number | null>(null)
    const settleTimerRef = React.useRef<number | null>(null)
    const returnTimerRef = React.useRef<number | null>(null)
    const previousScrollRef = React.useRef(0)
    const smoothedVelocityRef = React.useRef(0)
    const lastDirectionRef = React.useRef(1)

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = usePrefersReducedMotion(
        reducedMotion && !isStatic
    )

    const settings = React.useMemo<ResponseSettings>(() => {
        if (responseMode !== "custom") return PRESETS[responseMode]

        return {
            spring: { stiffness, damping, mass },
            sensitivity,
            overshoot,
            verticalShift,
            smoothing: velocitySmoothing,
        }
    }, [
        responseMode,
        stiffness,
        damping,
        mass,
        sensitivity,
        overshoot,
        verticalShift,
        velocitySmoothing,
    ])

    const impulse = useMotionValue(isStatic ? 0.55 : 0)
    const spring = useSpring(impulse, {
        stiffness: prefersReducedMotion ? 300 : settings.spring.stiffness,
        damping: prefersReducedMotion ? 45 : settings.spring.damping,
        mass: prefersReducedMotion ? 0.5 : settings.spring.mass,
        restDelta: 0.0005,
        restSpeed: 0.0005,
    })

    const [morphAmount, setMorphAmount] = React.useState(isStatic ? 0.55 : 0)
    const [isReady, setIsReady] = React.useState(isStatic)

    React.useEffect(() => {
        if (isStatic) return

        return spring.on("change", (latest) => {
            setMorphAmount(clamp(latest, -1.2, 1.2))
        })
    }, [isStatic, spring])

    React.useLayoutEffect(() => {
        // Static renderers (Framer Canvas and static export) use the initial
        // fallback geometry and must not initialize any animation work.
        if (isStatic || typeof window === "undefined") return

        previousScrollRef.current = window.scrollY
        smoothedVelocityRef.current = 0
        impulse.set(0)
        spring.jump(0)
        setMorphAmount(0)
        setIsReady(true)

        const clearTimers = () => {
            if (settleTimerRef.current !== null) {
                window.clearTimeout(settleTimerRef.current)
                settleTimerRef.current = null
            }

            if (returnTimerRef.current !== null) {
                window.clearTimeout(returnTimerRef.current)
                returnTimerRef.current = null
            }
        }

        const scheduleSettle = () => {
            clearTimers()

            settleTimerRef.current = window.setTimeout(() => {
                if (prefersReducedMotion || settings.overshoot === 0) {
                    impulse.set(0)
                    return
                }

                impulse.set(-lastDirectionRef.current * settings.overshoot)
                returnTimerRef.current = window.setTimeout(
                    () => impulse.set(0),
                    55
                )
            }, settleDelay)
        }

        const updateFromScroll = () => {
            animationFrameRef.current = null

            const element = wrapperRef.current
            if (!element) return

            const rect = element.getBoundingClientRect()
            const visibilityBuffer = visualHeight * 1.5
            const isNearViewport =
                rect.bottom > -visibilityBuffer &&
                rect.top < window.innerHeight + visibilityBuffer

            const currentScroll = window.scrollY
            const scrollDelta = currentScroll - previousScrollRef.current
            previousScrollRef.current = currentScroll

            if (!isNearViewport) {
                clearTimers()
                smoothedVelocityRef.current = 0
                impulse.set(0)
                return
            }

            if (scrollDelta === 0) return

            lastDirectionRef.current = Math.sign(scrollDelta) || 1

            const rawVelocity = (scrollDelta / 42) * settings.sensitivity
            smoothedVelocityRef.current = mix(
                smoothedVelocityRef.current,
                rawVelocity,
                clamp(settings.smoothing, 0.02, 1)
            )

            let nextImpulse = clamp(smoothedVelocityRef.current, -1, 1)
            if (prefersReducedMotion) nextImpulse *= 0.18

            impulse.set(nextImpulse)
            scheduleSettle()
        }

        const requestScrollUpdate = () => {
            if (animationFrameRef.current !== null) return
            animationFrameRef.current =
                window.requestAnimationFrame(updateFromScroll)
        }

        const handleResize = () => {
            previousScrollRef.current = window.scrollY
            smoothedVelocityRef.current = 0
            clearTimers()
            impulse.set(0)
        }

        window.addEventListener("scroll", requestScrollUpdate, {
            passive: true,
        })
        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("scroll", requestScrollUpdate)
            window.removeEventListener("resize", handleResize)
            clearTimers()

            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        isStatic,
        visualHeight,
        settleDelay,
        prefersReducedMotion,
        settings,
        impulse,
        spring,
    ])

    const svgWidth = 1000
    const signedAmount = morphAmount * (reverseMorph ? -1 : 1)
    const signedDepth = signedAmount * curveDepth

    // Move only the divider geometry, never the entire SVG. Translating the
    // SVG creates fractional-pixel compositing seams in Chromium while scrolling.
    const dividerShift = signedAmount * settings.verticalShift
    const centerY = visualHeight / 2 + dividerShift
    const curveY = centerY + signedDepth

    const normalizedCurveWidth = clamp(curveWidth, 10, 100) / 100
    const normalizedTension = clamp(edgeTension, 0, 100) / 100
    const baseInset = normalizedCurveWidth * 500
    const tensionAdjustment = mix(130, 20, normalizedTension)
    const handleInset = clamp(baseInset + tensionAdjustment, 40, 475)
    const edgeLift = signedDepth * mix(0.18, 0.03, normalizedTension)
    const edgeY = centerY + edgeLift

    // Shared curve tail. The fill path starts above the viewBox so the top
    // color always bleeds past the overscan area; the highlight path starts at
    // 0 so its gradient keeps the same proportions as before.
    const curveTail = `V ${edgeY} C ${svgWidth - handleInset} ${curveY}, ${handleInset} ${curveY}, 0 ${edgeY} Z`
    const pathData = `M 0 -40 H ${svgWidth} ${curveTail}`
    const highlightPathData = `M 0 0 H ${svgWidth} ${curveTail}`

    const highlightOpacity = clamp(highlightStrength, 0, 0.4)
    const id = React.useId().replace(/:/g, "")

    const edgeMask = `linear-gradient(to bottom, transparent 0px, #000 ${OVERSCAN}px, #000 calc(100% - ${OVERSCAN}px), transparent 100%)`

    const bleedStyles: React.CSSProperties = fullBleed
        ? {
              position: "relative",
              left: "50%",
              width: "100vw",
              minWidth: "100vw",
              maxWidth: "100vw",
              marginLeft: "-50vw",
          }
        : {
              position: "relative",
              width: "100%",
              minWidth: "100%",
              maxWidth: "100%",
          }

    return (
        <div
            ref={wrapperRef}
            style={{
                ...style,
                ...bleedStyles,
                // Overlap adjacent sections slightly. Chromium/Framer can expose
                // a one-pixel compositing boundary while the page is scrolling.
                marginTop: -OVERSCAN,
                marginBottom: -OVERSCAN,
                height: visualHeight + OVERSCAN * 2,
                minHeight: visualHeight + OVERSCAN * 2,
                overflow: "hidden",
                pointerEvents: "none",
                boxSizing: "border-box",
                // Hard split fallback: top half top color, bottom half bottom
                // color. Nothing dark sits under the bottom edge, so a
                // sub-pixel gap can never show a line.
                background: `linear-gradient(to bottom, ${topColor} 50%, ${bottomColor} 50%)`,
                isolation: "isolate",
                // Fade the outer overscan rows so the top and bottom edge rows
                // never blend with whatever is behind them while scrolling.
                WebkitMaskImage: edgeMask,
                maskImage: edgeMask,
                visibility: isReady ? "visible" : "hidden",
                opacity: isReady ? 1 : 0,
            }}
        >
            <svg
                viewBox={`0 ${-OVERSCAN} ${svgWidth} ${visualHeight + OVERSCAN * 2}`}
                preserveAspectRatio="none"
                shapeRendering="geometricPrecision"
                aria-hidden="true"
                focusable="false"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}
            >
                <defs>
                    <linearGradient
                        id={`${id}-highlight`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                        <stop
                            offset="85%"
                            stopColor="#FFFFFF"
                            stopOpacity={highlightOpacity}
                        />
                        <stop
                            offset="100%"
                            stopColor="#FFFFFF"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                <rect
                    x="0"
                    y="-40"
                    width={svgWidth}
                    height={visualHeight + 80}
                    fill={bottomColor}
                />

                {/* Do not use an SVG drop shadow here. When the animated curve
                    approaches flat, feDropShadow collapses into a horizontal line. */}
                <path d={pathData} fill={topColor} />

                {highlightStrength > 0 && (
                    <path
                        d={highlightPathData}
                        fill={`url(#${id}-highlight)`}
                    />
                )}
            </svg>
        </div>
    )
}

SectionMorph.defaultProps = {
    topColor: "#111111",
    bottomColor: "#F4F1E8",
    visualHeight: 340,
    curveDepth: 165,
    curveWidth: 72,
    responseMode: "cinematic",
    sensitivity: 1.1,
    velocitySmoothing: 0.18,
    stiffness: 95,
    damping: 24,
    mass: 1,
    overshoot: 0.1,
    settleDelay: 70,
    verticalShift: 10,
    edgeTension: 78,
    highlightStrength: 0.08,
    reverseMorph: false,
    fullBleed: true,
    reducedMotion: true,
}

addPropertyControls(SectionMorph, {
    topColor: {
        type: ControlType.Color,
        title: "Top Color",
        defaultValue: "#111111",
    },
    bottomColor: {
        type: ControlType.Color,
        title: "Bottom Color",
        defaultValue: "#F4F1E8",
    },
    visualHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 340,
        min: 160,
        max: 700,
        step: 10,
        unit: "px",
    },
    curveDepth: {
        type: ControlType.Number,
        title: "Curve Depth",
        defaultValue: 165,
        min: 0,
        max: 350,
        step: 5,
        unit: "px",
    },
    curveWidth: {
        type: ControlType.Number,
        title: "Curve Width",
        defaultValue: 72,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
    },
    responseMode: {
        type: ControlType.Enum,
        title: "Response",
        options: ["smooth", "elastic", "cinematic", "custom"],
        optionTitles: ["Smooth", "Elastic", "Cinematic", "Custom"],
        defaultValue: "cinematic",
        displaySegmentedControl: true,
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        defaultValue: 1.1,
        min: 0.2,
        max: 4,
        step: 0.05,
        hidden: (props) => props.responseMode !== "custom",
    },
    velocitySmoothing: {
        type: ControlType.Number,
        title: "Velocity Smooth",
        defaultValue: 0.18,
        min: 0.02,
        max: 1,
        step: 0.01,
        hidden: (props) => props.responseMode !== "custom",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Spring Force",
        defaultValue: 95,
        min: 20,
        max: 300,
        step: 5,
        hidden: (props) => props.responseMode !== "custom",
    },
    damping: {
        type: ControlType.Number,
        title: "Spring Smooth",
        defaultValue: 24,
        min: 5,
        max: 60,
        step: 1,
        hidden: (props) => props.responseMode !== "custom",
    },
    mass: {
        type: ControlType.Number,
        title: "Spring Weight",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        hidden: (props) => props.responseMode !== "custom",
    },
    overshoot: {
        type: ControlType.Number,
        title: "Overshoot",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.01,
        hidden: (props) => props.responseMode !== "custom",
    },
    settleDelay: {
        type: ControlType.Number,
        title: "Settle Delay",
        defaultValue: 70,
        min: 0,
        max: 300,
        step: 10,
        unit: "ms",
    },
    verticalShift: {
        type: ControlType.Number,
        title: "Vertical Shift",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (props) => props.responseMode !== "custom",
    },
    edgeTension: {
        type: ControlType.Number,
        title: "Edge Tension",
        defaultValue: 78,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    highlightStrength: {
        type: ControlType.Number,
        title: "Highlight",
        defaultValue: 0.08,
        min: 0,
        max: 0.4,
        step: 0.01,
    },
    reverseMorph: {
        type: ControlType.Boolean,
        title: "Reverse Morph",
        defaultValue: false,
        enabledTitle: "Reverse",
        disabledTitle: "Normal",
    },
    fullBleed: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: true,
        enabledTitle: "Viewport",
        disabledTitle: "Parent",
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
})
