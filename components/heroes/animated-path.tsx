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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Props = {
    lineColor: string
    dotColor: string
    strokeWidth: number
    dashLength: number
    gapLength: number
    dotSize: number
    speed: number
    trailLength: number
    startDelay: number
    startOnView: boolean
    showBase: boolean
    baseOpacity: number
}

const VIEW_WIDTH = 927
const VIEW_HEIGHT = 400

/*
 * One uninterrupted path:
 * Collect → Analyze → Predict → Optimize
 */
const PROCESS_PATH = `
    M 77 54
    C 132 2 244 8 297 118
    C 350 70 461 75 507 185
    C 571 124 698 136 757 271
`

const points = [
    { x: 77, y: 54 },
    { x: 297, y: 118 },
    { x: 507, y: 185 },
    { x: 757, y: 271 },
]

export default function AnimatedPath(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()

    const {
        lineColor,
        dotColor,
        strokeWidth,
        dashLength,
        gapLength,
        dotSize,
        speed,
        trailLength,
        startDelay,
        startOnView,
        showBase,
        baseOpacity,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const measurementPathRef = React.useRef<SVGPathElement>(null)

    const [started, setStarted] = React.useState(!startOnView)
    const [pathLength, setPathLength] = React.useState(800)

    const uniqueId = React.useId().replace(/:/g, "")

    const animationName = `smooth-process-flow-${uniqueId}`
    const animationClass = `smooth-process-path-${uniqueId}`

    /*
     * Measure the real curve so the Speed control stays consistent.
     */
    React.useLayoutEffect(() => {
        if (isStaticRenderer) return

        const path = measurementPathRef.current

        if (!path) return

        const measuredLength = path.getTotalLength()

        if (measuredLength > 0) {
            setPathLength(measuredLength)
        }
    }, [isStaticRenderer])

    /*
     * Optional viewport start.
     */
    React.useEffect(() => {
        if (isStaticRenderer) return

        if (!startOnView) {
            setStarted(true)
            return
        }

        const element = containerRef.current

        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setStarted(entry.isIntersecting)
            },
            {
                threshold: 0.15,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [startOnView, isStaticRenderer])

    /*
     * Higher Speed value = faster movement.
     */
    const animationDuration = Math.max(pathLength / Math.max(speed, 1), 0.4)

    /*
     * Trail can now reach 1.
     *
     * Internally, a microscopic gap is preserved so the SVG
     * dash pattern can continue looping correctly.
     */
    const normalizedTrail = Math.max(0.01, Math.min(trailLength, 0.9999))

    const normalizedGap = 1 - normalizedTrail

    const animationStyles = isStaticRenderer
        ? ""
        : `
            @keyframes ${animationName} {
                from {
                    stroke-dashoffset: 0;
                }

                to {
                    stroke-dashoffset: -1;
                }
            }

            .${animationClass} {
                animation-name: ${animationName};
                animation-duration: ${animationDuration}s;
                animation-delay: ${Math.max(startDelay, 0)}s;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                animation-fill-mode: both;
                will-change: stroke-dashoffset;
            }

            @media (prefers-reduced-motion: reduce) {
                .${animationClass} {
                    animation: none !important;
                    stroke-dashoffset: 0 !important;
                }
            }
        `

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                pointerEvents: "none",
            }}
        >
            <style>{animationStyles}</style>

            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    overflow: "visible",
                }}
            >
                {/* Hidden path used only to measure the curve */}
                <path
                    ref={measurementPathRef}
                    d={PROCESS_PATH}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={1}
                    pointerEvents="none"
                />

                <defs>
                    {/*
                     * The white stroke is one long moving window.
                     * Its pattern length is exactly 1 complete path,
                     * making the loop seamless.
                     */}
                    <mask
                        id={`moving-trail-mask-${uniqueId}`}
                        maskUnits="userSpaceOnUse"
                        maskContentUnits="userSpaceOnUse"
                        x={-100}
                        y={-100}
                        width={VIEW_WIDTH + 200}
                        height={VIEW_HEIGHT + 200}
                    >
                        <path
                            d={PROCESS_PATH}
                            pathLength={1}
                            fill="none"
                            stroke="white"
                            strokeWidth={Math.max(strokeWidth + 14, 18)}
                            strokeLinecap="round"
                            strokeDasharray={`${normalizedTrail} ${normalizedGap}`}
                            strokeDashoffset={0}
                            className={
                                !isStaticRenderer && started
                                    ? animationClass
                                    : undefined
                            }
                        />
                    </mask>
                </defs>

                {/* Faint full dashed path */}
                {showBase && (
                    <path
                        d={PROCESS_PATH}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLength} ${gapLength}`}
                        strokeLinecap="round"
                        opacity={baseOpacity}
                        vectorEffect="non-scaling-stroke"
                    />
                )}

                {/* Animated trail / static renderer fallback */}
                {isStaticRenderer ? (
                    <path
                        d={PROCESS_PATH}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLength} ${gapLength}`}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                ) : (
                    <path
                        d={PROCESS_PATH}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLength} ${gapLength}`}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        mask={`url(#moving-trail-mask-${uniqueId})`}
                    />
                )}

                {/* Dots with an independent color */}
                {points.map((point, index) => (
                    <circle
                        key={`dot-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={dotSize / 2}
                        fill={dotColor}
                    />
                ))}
            </svg>
        </div>
    )
}

AnimatedPath.defaultProps = {
    lineColor: "#111111",
    dotColor: "#111111",
    strokeWidth: 1,
    dashLength: 7,
    gapLength: 7,
    dotSize: 11,
    speed: 130,
    trailLength: 0.3,
    startDelay: 0,
    startOnView: false,
    showBase: true,
    baseOpacity: 0.16,
}

addPropertyControls(AnimatedPath, {
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#111111",
    },

    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#111111",
    },

    strokeWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 0.5,
        max: 4,
        step: 0.1,
        defaultValue: 1,
    },

    dashLength: {
        type: ControlType.Number,
        title: "Dash",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 7,
    },

    gapLength: {
        type: ControlType.Number,
        title: "Gap",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 7,
    },

    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 4,
        max: 30,
        step: 1,
        defaultValue: 11,
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 20,
        max: 400,
        step: 5,
        defaultValue: 130,
        displayStepper: true,
    },

    trailLength: {
        type: ControlType.Number,
        title: "Trail",
        min: 0.05,
        max: 1,
        step: 0.01,
        defaultValue: 0.3,
        displayStepper: true,
    },

    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0,
        unit: "s",
    },

    startOnView: {
        type: ControlType.Boolean,
        title: "On View",
        defaultValue: false,
    },

    showBase: {
        type: ControlType.Boolean,
        title: "Base Path",
        defaultValue: true,
    },

    baseOpacity: {
        type: ControlType.Number,
        title: "Base Opacity",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.16,
        hidden: (props) => !props.showBase,
    },
})
