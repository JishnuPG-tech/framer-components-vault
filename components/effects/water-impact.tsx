import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useId,
    startTransition,
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


interface Drop {
    id: number
    x: number
    y: number
    time: number
}

interface WaterImpactProps {
    color1: string
    color2: string
    ringCount: number
    maxRadius: number
    ringWidth: number
    duration: number
    frequency: number
    ringShape: "circle" | "rectangle"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WaterImpact(props: WaterImpactProps) {
    const {
        color1 = "#0099FF",
        color2 = "#00FFFF",
        ringCount = 5,
        maxRadius = 150,
        ringWidth = 2,
        duration = 2000,
        frequency = 800,
        ringShape = "circle",
    } = props

    const [drops, setDrops] = useState<Drop[]>([])
    const canvasRef = useRef<HTMLDivElement>(null)
    const dropIdRef = useRef(0)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        const interval = setInterval(() => {
            if (!canvasRef.current) return

            const rect = canvasRef.current.getBoundingClientRect()
            const x = Math.random() * rect.width
            const y = Math.random() * rect.height

            const newDrop: Drop = {
                id: dropIdRef.current++,
                x,
                y,
                time: Date.now(),
            }

            startTransition(() => {
                setDrops((prev) => [...prev, newDrop])
            })

            setTimeout(() => {
                startTransition(() => {
                    setDrops((prev) => prev.filter((d) => d.id !== newDrop.id))
                })
            }, duration)
        }, frequency)

        return () => clearInterval(interval)
    }, [frequency, duration, isStatic])

    const previewDrops = useMemo(() => {
        return isStatic ? [{ id: -1, x: "50%", y: "50%", time: 0 }] : drops
    }, [isStatic, drops])

    return (
        <div
            ref={canvasRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "transparent",
                ...props.style,
            }}
        >
            {previewDrops.map((drop) => (
                <RippleEffect
                    key={drop.id}
                    x={drop.x}
                    y={drop.y}
                    color1={color1}
                    color2={color2}
                    ringCount={ringCount}
                    maxRadius={maxRadius}
                    ringWidth={ringWidth}
                    duration={duration}
                    ringShape={ringShape}
                    staticPreview={isStatic}
                />
            ))}
        </div>
    )
}

interface RippleEffectProps {
    x: number | string
    y: number | string
    color1: string
    color2: string
    ringCount: number
    maxRadius: number
    ringWidth: number
    duration: number
    ringShape: "circle" | "rectangle"
    staticPreview?: boolean
}

function RippleEffect({
    x,
    y,
    color1,
    color2,
    ringCount,
    maxRadius,
    ringWidth,
    duration,
    ringShape,
    staticPreview,
}: RippleEffectProps) {
    const isCircle = ringShape === "circle"
    const uid = useId()
    const gradientId = useMemo(
        () => `gradient-${uid.replace(/[:]/g, "")}`,
        [uid]
    )

    return (
        <>
            {isCircle ? (
                <svg
                    style={{
                        position: "absolute",
                        left: x,
                        top: y,
                        width: maxRadius * 2,
                        height: maxRadius * 2,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        overflow: "visible",
                    }}
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor={color1} />
                            <stop offset="100%" stopColor={color2} />
                        </linearGradient>
                    </defs>
                    {Array.from({ length: ringCount }).map((_, i) => {
                        const delay = (i / ringCount) * (duration * 0.3)
                        const ringDuration = duration - delay
                        const progress = (i + 1) / ringCount
                        const previewR = progress * maxRadius
                        const previewOpacity = Math.max(0, 1 - progress * 0.9)

                        return (
                            <circle
                                key={i}
                                cx={maxRadius}
                                cy={maxRadius}
                                r={staticPreview ? previewR : 0}
                                fill="none"
                                stroke={`url(#${gradientId})`}
                                strokeWidth={ringWidth}
                                style={{
                                    ...(staticPreview
                                        ? { opacity: previewOpacity }
                                        : {
                                              animation: `ripple-circle ${ringDuration}ms ease-out ${delay}ms forwards`,
                                          }),
                                }}
                            />
                        )
                    })}
                </svg>
            ) : (
                Array.from({ length: ringCount }).map((_, i) => {
                    const delay = (i / ringCount) * (duration * 0.3)
                    const ringDuration = duration - delay
                    const progress = (i + 1) / ringCount
                    const previewSize = progress * maxRadius * 2
                    const previewOpacity = Math.max(0, 1 - progress * 0.9)

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: x,
                                top: y,
                                width: staticPreview ? previewSize : 0,
                                height: staticPreview ? previewSize : 0,
                                borderRadius: "8px",
                                border: `${ringWidth}px solid`,
                                borderImage: `linear-gradient(135deg, ${color1}, ${color2}) 1`,
                                transform: "translate(-50%, -50%)",
                                pointerEvents: "none",
                                ...(staticPreview
                                    ? { opacity: previewOpacity }
                                    : {
                                          animation: `ripple-rectangle ${ringDuration}ms ease-out ${delay}ms forwards`,
                                      }),
                            }}
                        />
                    )
                })
            )}
            {!staticPreview && (
                <style>
                    {`
                        @keyframes ripple-circle {
                            0% {
                                r: 0;
                                opacity: 1;
                            }
                            100% {
                                r: ${maxRadius}px;
                                opacity: 0;
                            }
                        }
                        @keyframes ripple-rectangle {
                            0% {
                                width: 0;
                                height: 0;
                                opacity: 1;
                            }
                            100% {
                                width: ${maxRadius * 2}px;
                                height: ${maxRadius * 2}px;
                                opacity: 0;
                            }
                        }
                    `}
                </style>
            )}
        </>
    )
}

addPropertyControls(WaterImpact, {
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#0099FF",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#00FFFF",
    },
    ringCount: {
        type: ControlType.Number,
        title: "Ring Count",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
    },
    maxRadius: {
        type: ControlType.Number,
        title: "Max Radius",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    ringWidth: {
        type: ControlType.Number,
        title: "Ring Width",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2000,
        min: 500,
        max: 5000,
        step: 100,
        unit: "ms",
    },
    frequency: {
        type: ControlType.Number,
        title: "Drop Frequency",
        defaultValue: 800,
        min: 200,
        max: 3000,
        step: 100,
        unit: "ms",
    },
    ringShape: {
        type: ControlType.Enum,
        title: "Ring Shape",
        options: ["circle", "rectangle"],
        optionTitles: ["Circle", "Rectangle"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
})
