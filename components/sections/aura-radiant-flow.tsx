import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent,
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


interface AuraRadiantFlowProps {
    backgroundColor: string
    lineColor: string
    dotColor: string
    centerColor: string
    pointCount: number
    lineOpacity: number
    lineWidth: number
    dotSize: number
    centerGlow: number
    rotationSpeed: number
    rotationDirection: "clockwise" | "counterclockwise"
    mouseStrength: number
    flowSmoothing: number
    curveChaos: number
    radiusScale: number
    shimmer: boolean
    showLabels: boolean
    topLabelText: string
    bottomLabelText: string
    labelColor: string
    labelFont: any
    labelSize: number
    labelLetterSpacing: number
    labelOpacity: number
    labelTextTransform: "none" | "uppercase" | "lowercase" | "capitalize"
    labelAlignment: "start" | "middle" | "end"
    topLabelX: number
    topLabelY: number
    bottomLabelX: number
    bottomLabelY: number
    style?: CSSProperties
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AuraRadiantFlow(props: AuraRadiantFlowProps) {
    const {
        backgroundColor = "#054AB2",
        lineColor = "#38BDF8",
        dotColor = "#E0F2FE",
        centerColor = "#BAE6FD",
        pointCount = 100,
        lineOpacity = 0.35,
        lineWidth = 0.8,
        dotSize = 1.5,
        centerGlow = 32,
        rotationSpeed = 6,
        rotationDirection = "clockwise",
        mouseStrength = 0.18,
        flowSmoothing = 0.1,
        curveChaos = 0.3,
        radiusScale = 0.85,
        shimmer = true,
        showLabels = true,
        topLabelText = "AURA // CORE",
        bottomLabelText = "DYNAMIC 0.9",
        labelColor = "rgba(186,230,253,0.8)",
        labelFont,
        labelSize = 2.8,
        labelLetterSpacing = 0.15,
        labelOpacity = 0.8,
        labelTextTransform = "uppercase",
        labelAlignment = "start",
        topLabelX: tX = 10,
        topLabelY: tY = 12,
        bottomLabelX: bX = 70,
        bottomLabelY: bY = 90,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const svgRef = useRef<SVGSVGElement | null>(null)
    const groupRef = useRef<SVGGElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const targetPointer = useRef({ x: 0, y: 0 })
    const smoothPointer = useRef({ x: 0, y: 0 })
    const rotationRef = useRef(0)
    const shimmerRef = useRef(0)
    const isReducedMotion = useRef(false)

    const [pointerState, setPointerState] = useState({ x: 0, y: 0 })
    const [shimmerPhase, setShimmerPhase] = useState(0)

    const safePointCount = clamp(Math.round(pointCount), 20, 200)
    const safeSmoothing = clamp(flowSmoothing, 0.02, 0.4)
    const safeStrength = clamp(mouseStrength, 0, 0.8)
    const safeChaos = clamp(curveChaos, 0, 1)
    const safeRadiusScale = clamp(radiusScale, 0.2, 0.98)

    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            isReducedMotion.current = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        }
    }, [])

    useEffect(() => {
        if (isStatic) return

        let lastTime = performance.now()

        const updateFrame = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.05)
            lastTime = time

            const motionFactor = isReducedMotion.current ? 0.2 : 1
            const dir = rotationDirection === "clockwise" ? 1 : -1

            rotationRef.current =
                (rotationRef.current +
                    dir * rotationSpeed * dt * motionFactor) %
                360

            if (groupRef.current) {
                groupRef.current.setAttribute(
                    "transform",
                    `rotate(${rotationRef.current.toFixed(2)} 50 50)`
                )
            }

            const dx = targetPointer.current.x - smoothPointer.current.x
            const dy = targetPointer.current.y - smoothPointer.current.y
            smoothPointer.current.x += dx * safeSmoothing
            smoothPointer.current.y += dy * safeSmoothing

            if (shimmer) {
                shimmerRef.current += dt * motionFactor
                setShimmerPhase(shimmerRef.current)
            }

            if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                setPointerState({
                    x: smoothPointer.current.x,
                    y: smoothPointer.current.y,
                })
            }

            rafRef.current = requestAnimationFrame(updateFrame)
        }

        rafRef.current = requestAnimationFrame(updateFrame)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [rotationDirection, rotationSpeed, safeSmoothing, shimmer, isStatic])

    const onPointerMove = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            if (isStatic) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width - 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5
            targetPointer.current = {
                x: clamp(x, -0.5, 0.5),
                y: clamp(y, -0.5, 0.5),
            }
        },
        [isStatic]
    )

    const onPointerLeave = useCallback(() => {
        targetPointer.current = { x: 0, y: 0 }
    }, [])

    const strands = useMemo(() => {
        const pMag = Math.hypot(pointerState.x, pointerState.y)
        const boost = 1 + pMag * 1.5

        return Array.from({ length: safePointCount }, (_, i) => {
            const t = i / safePointCount
            const angle = t * Math.PI * 2
            const px = 50 + Math.cos(angle) * (safeRadiusScale * 50)
            const py = 50 + Math.sin(angle) * (safeRadiusScale * 50)

            const mx = 50 + Math.cos(angle) * (safeRadiusScale * 24)
            const my = 50 + Math.sin(angle) * (safeRadiusScale * 24)

            const tX = -Math.sin(angle)
            const tY = Math.cos(angle)

            const wA = Math.sin(angle * 8 + shimmerPhase * 1.5)
            const wB = Math.cos(angle * 6 - shimmerPhase * 1.1)

            const pX = pointerState.x * safeStrength * 70 * boost
            const pY = pointerState.y * safeStrength * 70 * boost
            const chaos = safeChaos * (wA * 3 + wB * 2)

            const bendX = mx + tX * chaos + pX * (0.3 + 0.7 * t)
            const bendY = my + tY * chaos + pY * (0.3 + 0.7 * t)

            const pulse =
                shimmer && !isStatic
                    ? 0.6 +
                      0.4 * (0.5 + 0.5 * Math.sin(shimmerPhase * 2 + angle * 2))
                    : 1

            return {
                id: i,
                path: `M 50 50 Q ${bendX.toFixed(2)} ${bendY.toFixed(2)} ${px.toFixed(2)} ${py.toFixed(2)}`,
                x: px,
                y: py,
                scale: pulse,
            }
        })
    }, [
        pointerState,
        safeChaos,
        safePointCount,
        safeRadiusScale,
        safeStrength,
        shimmer,
        shimmerPhase,
        isStatic,
    ])

    const computedGlowSize =
        shimmer && !isStatic
            ? centerGlow * (0.92 + 0.08 * Math.sin(shimmerPhase * 2))
            : centerGlow

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                ...style,
            }}
        >
            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                role="img"
                aria-label="Aura Radiant Flow Visualization"
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                style={{
                    display: "block",
                    touchAction: "none",
                    cursor: isStatic ? "default" : "crosshair",
                }}
            >
                <defs>
                    <radialGradient
                        id="auraCenterGlow"
                        cx="50%"
                        cy="50%"
                        r="50%"
                    >
                        <stop
                            offset="0%"
                            stopColor={centerColor}
                            stopOpacity={0.9}
                        />
                        <stop
                            offset="50%"
                            stopColor={centerColor}
                            stopOpacity={0.4}
                        />
                        <stop
                            offset="100%"
                            stopColor={centerColor}
                            stopOpacity={0}
                        />
                    </radialGradient>
                </defs>

                <g ref={groupRef}>
                    {strands.map((s) => (
                        <path
                            key={`path-${s.id}`}
                            d={s.path}
                            fill="none"
                            stroke={lineColor}
                            strokeOpacity={lineOpacity}
                            strokeWidth={lineWidth}
                            strokeLinecap="round"
                        />
                    ))}
                    {strands.map((s) => (
                        <circle
                            key={`dot-${s.id}`}
                            cx={s.x}
                            cy={s.y}
                            r={dotSize * s.scale}
                            fill={dotColor}
                            fillOpacity={0.9}
                        />
                    ))}
                </g>

                <circle
                    cx={50}
                    cy={50}
                    r={computedGlowSize}
                    fill="url(#auraCenterGlow)"
                />
                <circle cx={50} cy={50} r={dotSize * 2} fill={centerColor} />

                {showLabels && (
                    <>
                        <text
                            x={tX}
                            y={tY}
                            fill={labelColor}
                            fillOpacity={labelOpacity}
                            fontSize={labelSize}
                            letterSpacing={`${labelLetterSpacing}em`}
                            textAnchor={labelAlignment}
                            {...labelFont}
                            style={{
                                userSelect: "none",
                                textTransform: labelTextTransform,
                                pointerEvents: "none",
                                ...labelFont,
                            }}
                        >
                            {topLabelText}
                        </text>
                        <text
                            x={bX}
                            y={bY}
                            fill={labelColor}
                            fillOpacity={labelOpacity}
                            fontSize={labelSize}
                            letterSpacing={`${labelLetterSpacing}em`}
                            textAnchor={labelAlignment}
                            {...labelFont}
                            style={{
                                userSelect: "none",
                                textTransform: labelTextTransform,
                                pointerEvents: "none",
                                ...labelFont,
                            }}
                        >
                            {bottomLabelText}
                        </text>
                    </>
                )}
            </svg>
        </div>
    )
}

addPropertyControls(AuraRadiantFlow, {
    radiusScale: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0.85,
        min: 0.2,
        max: 0.98,
        step: 0.01,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#054AB2",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: "#DFF1FF",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dots",
        defaultValue: "#FFFFFF",
    },
    centerColor: {
        type: ControlType.Color,
        title: "Center",
        defaultValue: "#BAE6FD",
    },
    pointCount: {
        type: ControlType.Number,
        title: "Points",
        defaultValue: 30,
        min: 10,
        max: 200,
        step: 1,
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.35,
        min: 0.05,
        max: 1,
        step: 0.01,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 0.2,
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 0.5,
        min: 0.5,
        max: 5,
        step: 0.1,
    },
    centerGlow: {
        type: ControlType.Number,
        title: "Center Glow",
        defaultValue: 5,
        min: 5,
        max: 60,
        step: 1,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 6,
        min: 0,
        max: 60,
        step: 0.1,
        unit: "°/s",
    },
    rotationDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter"],
        defaultValue: "clockwise",
    },
    mouseStrength: {
        type: ControlType.Number,
        title: "Mouse Pull",
        defaultValue: 0.18,
        min: 0,
        max: 0.8,
        step: 0.01,
    },
    flowSmoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.1,
        min: 0.02,
        max: 0.4,
        step: 0.01,
    },
    curveChaos: {
        type: ControlType.Number,
        title: "Variation",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
    },
    shimmer: {
        type: ControlType.Boolean,
        title: "Shimmer",
        defaultValue: true,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
    },
    topLabelText: {
        type: ControlType.String,
        title: "Top Label",
        defaultValue: "AURA // CORE",
    },
    bottomLabelText: {
        type: ControlType.String,
        title: "Bottom Label",
        defaultValue: "DYNAMIC 0.9",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "rgba(186,230,253,0.8)",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontStyle: "normal",
        },
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 2.8,
        min: 1,
        max: 8,
        step: 0.1,
    },
    labelLetterSpacing: {
        type: ControlType.Number,
        title: "Letter Space",
        defaultValue: 0.15,
        min: -0.05,
        max: 0.4,
        step: 0.01,
    },
    labelOpacity: {
        type: ControlType.Number,
        title: "Label Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
    },
    labelTextTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Upper", "Lower", "Capitalize"],
        defaultValue: "uppercase",
    },
    labelAlignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["start", "middle", "end"],
        optionTitles: ["Start", "Middle", "End"],
        defaultValue: "start",
    },
    topLabelX: {
        type: ControlType.Number,
        title: "Top X",
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 0.1,
    },
    topLabelY: {
        type: ControlType.Number,
        title: "Top Y",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 0.1,
    },
    bottomLabelX: {
        type: ControlType.Number,
        title: "Bottom X",
        defaultValue: 70,
        min: 0,
        max: 100,
        step: 0.1,
    },
    bottomLabelY: {
        type: ControlType.Number,
        title: "Bottom Y",
        defaultValue: 90,
        min: 0,
        max: 100,
        step: 0.1,
    },
})
