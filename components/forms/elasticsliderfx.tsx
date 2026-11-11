// Elastic slider with overflow animation and customizable icons

import {
    useEffect,
    useRef,
    useState,
    startTransition,
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

import {
    animate,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useTransform,
} from "framer-motion"

const MAX_OVERFLOW = 50

interface ElasticSliderProps {
    defaultValue: number
    startingValue: number
    maxValue: number
    isStepped: boolean
    stepSize: number
    trackColor: string
    fillColor: string
    textColor: string
    style?: CSSProperties
}

/**
 * Elastic Slider
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ElasticSlider(props: ElasticSliderProps) {
    const {
        defaultValue,
        startingValue,
        maxValue,
        isStepped,
        stepSize,
        trackColor,
        fillColor,
        textColor,
    } = props

    const [value, setValue] = useState<number>(defaultValue)
    const sliderRef = useRef<HTMLDivElement>(null)
    const [region, setRegion] = useState<"left" | "middle" | "right">("middle")
    const clientX = useMotionValue(0)
    const overflow = useMotionValue(0)
    const scale = useMotionValue(1)

    useEffect(() => {
        startTransition(() => setValue(defaultValue))
    }, [defaultValue])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                const step = isStepped ? stepSize : 1
                const newValue = Math.max(startingValue, value - step)
                startTransition(() => setValue(newValue))
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                const step = isStepped ? stepSize : 1
                const newValue = Math.min(maxValue, value + step)
                startTransition(() => setValue(newValue))
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            return () => {
                window.removeEventListener("keydown", handleKeyDown)
            }
        }
    }, [value, isStepped, stepSize, startingValue, maxValue])

    useMotionValueEvent(clientX, "change", (latest: number) => {
        if (sliderRef.current) {
            const { left, right } = sliderRef.current.getBoundingClientRect()
            let newValue: number
            if (latest < left) {
                startTransition(() => setRegion("left"))
                newValue = left - latest
            } else if (latest > right) {
                startTransition(() => setRegion("right"))
                newValue = latest - right
            } else {
                startTransition(() => setRegion("middle"))
                newValue = 0
            }
            overflow.jump(decay(newValue, MAX_OVERFLOW))
        }
    })

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.buttons > 0 && sliderRef.current) {
            const { left, width } = sliderRef.current.getBoundingClientRect()
            let newValue =
                startingValue +
                ((e.clientX - left) / width) * (maxValue - startingValue)
            if (isStepped) {
                newValue = Math.round(newValue / stepSize) * stepSize
            }
            newValue = Math.min(Math.max(newValue, startingValue), maxValue)
            startTransition(() => setValue(newValue))
            clientX.jump(e.clientX)
        }
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        handlePointerMove(e)
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerUp = () => {
        animate(overflow, 0, { type: "spring", bounce: 0.5 })
    }

    const getRangePercentage = (): number => {
        const totalRange = maxValue - startingValue
        if (totalRange === 0) return 0
        return ((value - startingValue) / totalRange) * 100
    }

    const handleLeftClick = () => {
        const step = isStepped ? stepSize : 1
        const newValue = Math.max(startingValue, value - step)
        startTransition(() => setValue(newValue))
    }

    const handleRightClick = () => {
        const step = isStepped ? stepSize : 1
        const newValue = Math.min(maxValue, value + step)
        startTransition(() => setValue(newValue))
    }

    return (
        <div
            style={{
                ...props.style,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                position: "relative",
                outline: "none",
            }}
            tabIndex={0}
        >
            <motion.div
                onHoverStart={() => animate(scale, 1.2)}
                onHoverEnd={() => animate(scale, 1)}
                onTouchStart={() => animate(scale, 1.2)}
                onTouchEnd={() => animate(scale, 1)}
                style={{
                    scale,
                    opacity: useTransform(scale, [1, 1.2], [0.7, 1]),
                    display: "flex",
                    width: "100%",
                    touchAction: "none",
                    userSelect: "none",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                }}
            >
                {/* Minus Icon */}
                <motion.div
                    animate={{
                        scale: region === "left" ? [1, 1.4, 1] : 1,
                        transition: { duration: 0.25 },
                    }}
                    style={{
                        x: useTransform(() =>
                            region === "left"
                                ? -overflow.get() / scale.get()
                                : 0
                        ),
                        cursor: "pointer",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={handleLeftClick}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={textColor}
                        width="24"
                        height="24"
                    >
                        <path d="M5 11h14v2H5z" />
                    </svg>
                </motion.div>

                {/* Slider Track */}
                <div
                    ref={sliderRef}
                    style={{
                        position: "relative",
                        display: "flex",
                        width: "100%",
                        maxWidth: 384,
                        flexGrow: 1,
                        cursor: "grab",
                        touchAction: "none",
                        userSelect: "none",
                        alignItems: "center",
                        paddingTop: 16,
                        paddingBottom: 16,
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    <motion.div
                        style={{
                            scaleX: useTransform(() => {
                                if (sliderRef.current) {
                                    const { width } =
                                        sliderRef.current.getBoundingClientRect()
                                    return 1 + overflow.get() / width
                                }
                                return 1
                            }),
                            scaleY: useTransform(
                                overflow,
                                [0, MAX_OVERFLOW],
                                [1, 0.8]
                            ),
                            transformOrigin: useTransform(() => {
                                if (sliderRef.current) {
                                    const { left, width } =
                                        sliderRef.current.getBoundingClientRect()
                                    return clientX.get() < left + width / 2
                                        ? "right"
                                        : "left"
                                }
                                return "center"
                            }),
                            height: useTransform(scale, [1, 1.2], [6, 12]),
                            marginTop: useTransform(scale, [1, 1.2], [0, -3]),
                            marginBottom: useTransform(
                                scale,
                                [1, 1.2],
                                [0, -3]
                            ),
                            display: "flex",
                            flexGrow: 1,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                height: "100%",
                                flexGrow: 1,
                                overflow: "hidden",
                                borderRadius: 9999,
                                backgroundColor: trackColor,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    height: "100%",
                                    backgroundColor: fillColor,
                                    borderRadius: 9999,
                                    width: `${getRangePercentage()}%`,
                                }}
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Plus Icon */}
                <motion.div
                    animate={{
                        scale: region === "right" ? [1, 1.4, 1] : 1,
                        transition: { duration: 0.25 },
                    }}
                    style={{
                        x: useTransform(() =>
                            region === "right"
                                ? overflow.get() / scale.get()
                                : 0
                        ),
                        cursor: "pointer",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={handleRightClick}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={textColor}
                        width="24"
                        height="24"
                    >
                        <path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6z" />
                    </svg>
                </motion.div>
            </motion.div>

            <p
                style={{
                    position: "absolute",
                    color: textColor,
                    transform: "translateY(-16px)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    margin: 0,
                }}
            >
                {Math.round(value)}
            </p>
        </div>
    )
}

function decay(value: number, max: number): number {
    if (max === 0) return 0
    const entry = value / max
    const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5)
    return sigmoid * max
}

addPropertyControls(ElasticSlider, {
    defaultValue: {
        type: ControlType.Number,
        title: "Default Value",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
    },
    startingValue: {
        type: ControlType.Number,
        title: "Starting Value",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
    },
    maxValue: {
        type: ControlType.Number,
        title: "Max Value",
        defaultValue: 100,
        min: 0,
        max: 1000,
        step: 1,
    },
    isStepped: {
        type: ControlType.Boolean,
        title: "Stepped",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    stepSize: {
        type: ControlType.Number,
        title: "Step Size",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ isStepped }) => !isStepped,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "#CCCCCC",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#CCCCCC",
    },
})
