/**
 * Motion Hamburger with a still initial render, configurable hover growth, and a 2.5px default stroke.
 */
import {
    useCallback,
    useEffect,
    useMemo,
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


interface MotionHamburgerProps {
    strokeColor: string
    ringColor: string
    showRing: boolean
    ringWidth: number
    strokeWidth: number
    size: number
    defaultOpen: boolean
    hoverGrow: boolean
    onToggle?: (checked: boolean) => void
    style?: CSSProperties
}

interface PathMetrics {
    topLength: number
    bottomLength: number
    ringLength: number
}

const TOP_PATH_D =
    "M5 10 L27 10 C29.5 10 30.4 7.2 27.9 5.2 C25.6 3.4 20.2 3.6 16 6 L16 26"
const BOTTOM_PATH_D =
    "M5 22 L27 22 C29.7 22 30.2 24.8 27.8 26.8 C24.6 29.4 13.2 29.2 6 16 L26 16"
const MIDDLE_PATH_D = "M5 16 L27 16"
const RING_PATH_D = "M16 1.5 A14.5 14.5 0 1 1 15.999 1.5"
// Safari can rasterize the next curved segment when a dash ends exactly on the bend.
// Keep the end visually identical while moving it clear of that segment boundary.
const CLOSED_RUN_LENGTH = 21.9
const OPEN_TOP_RUN_LENGTH = 20
const OPEN_BOTTOM_RUN_LENGTH = 20

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MotionHamburger(props: MotionHamburgerProps) {
    const {
        strokeColor = "#FFFFFF",
        ringColor = "rgba(255,255,255,0.35)",
        showRing = false,
        ringWidth = 1.25,
        strokeWidth = 2.5,
        size = 48,
        defaultOpen = false,
        hoverGrow = true,
        onToggle,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [isHovered, setIsHovered] = useState(false)
    const [transitionsReady, setTransitionsReady] = useState(false)
    const [metrics, setMetrics] = useState<PathMetrics>({
        topLength: 52,
        bottomLength: 58,
        ringLength: 91.1,
    })

    const topPathRef = useRef<SVGPathElement | null>(null)
    const bottomPathRef = useRef<SVGPathElement | null>(null)
    const middlePathRef = useRef<SVGPathElement | null>(null)
    const ringPathRef = useRef<SVGPathElement | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return

        const nextMetrics: PathMetrics = {
            topLength: topPathRef.current?.getTotalLength() ?? 52,
            bottomLength: bottomPathRef.current?.getTotalLength() ?? 58,
            ringLength: ringPathRef.current?.getTotalLength() ?? 91.1,
        }
        startTransition(() => {
            setMetrics(nextMetrics)
        })

        let secondFrame: number | undefined
        const firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(() => {
                startTransition(() => {
                    setTransitionsReady(true)
                })
            })
        })

        return () => {
            window.cancelAnimationFrame(firstFrame)
            if (secondFrame !== undefined) {
                window.cancelAnimationFrame(secondFrame)
            }
        }
    }, [])

    useEffect(() => {
        startTransition(() => {
            setIsOpen(defaultOpen)
        })
    }, [defaultOpen])

    const toggle = useCallback(() => {
        const next = !isOpen
        startTransition(() => {
            setIsOpen(next)
        })
        if (onToggle) onToggle(next)
    }, [isOpen, onToggle])

    const setHover = useCallback((hovered: boolean) => {
        startTransition(() => {
            setIsHovered(hovered)
        })
    }, [])

    const iconTransform = useMemo(() => {
        const baseRotation = isOpen ? 45 : 0
        const hoverScale = hoverGrow && isHovered && !isStatic ? 1.08 : 1
        return `rotate(${baseRotation}deg) scale(${hoverScale})`
    }, [hoverGrow, isHovered, isOpen, isStatic])

    const topSegmentLength = isOpen ? OPEN_TOP_RUN_LENGTH : CLOSED_RUN_LENGTH
    const bottomSegmentLength = isOpen ? OPEN_BOTTOM_RUN_LENGTH : CLOSED_RUN_LENGTH
    const topClosedOffset = 0
    const bottomClosedOffset = 0
    const topOpenOffset = useMemo(
        () => -(metrics.topLength - OPEN_TOP_RUN_LENGTH),
        [metrics.topLength]
    )
    const bottomOpenOffset = useMemo(
        () => -(metrics.bottomLength - OPEN_BOTTOM_RUN_LENGTH),
        [metrics.bottomLength]
    )

    const dashEase = "cubic-bezier(0.33, 1, 0.68, 1)"
    const springyEase = "cubic-bezier(0.68, -0.2, 0.265, 1.25)"
    const ringEaseOut = "cubic-bezier(0.16, 1, 0.3, 1)"
    const motionDuration = 620

    const transitionEnabled = !isStatic && transitionsReady

    return (
        <button
            type="button"
            onClick={toggle}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            style={{
                position: "relative",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: size,
                height: size,
                border: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                appearance: "none",
                WebkitAppearance: "none",
                ...style,
            }}
        >
            <svg
                viewBox="0 0 32 32"
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    transform: iconTransform,
                    transformOrigin: "50% 50%",
                    transition: transitionEnabled
                        ? `transform ${motionDuration}ms ${springyEase}`
                        : "none",
                }}
            >
                {showRing && (
                    <path
                        ref={ringPathRef}
                        d={RING_PATH_D}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth={ringWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={`${metrics.ringLength} ${metrics.ringLength}`}
                        strokeDashoffset={isOpen ? 0 : metrics.ringLength}
                        style={{
                            transition: transitionEnabled
                                ? isOpen
                                    ? `stroke-dashoffset 700ms ${ringEaseOut} 80ms, transform 700ms ${ringEaseOut} 80ms, opacity 220ms ${ringEaseOut} 80ms`
                                    : `stroke-dashoffset 350ms ${ringEaseOut}, transform 350ms ${ringEaseOut}, opacity 180ms ease-out`
                                : "none",
                            transformBox: "fill-box",
                            transformOrigin: "50% 50%",
                            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                            opacity: isOpen ? 1 : 0,
                        }}
                    />
                )}

                <path
                    ref={topPathRef}
                    d={TOP_PATH_D}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${topSegmentLength} ${metrics.topLength}`}
                    strokeDashoffset={isOpen ? topOpenOffset : topClosedOffset}
                    style={{
                        transition: transitionEnabled
                            ? `stroke-dashoffset ${motionDuration}ms ${dashEase}, stroke-dasharray ${motionDuration}ms ${dashEase}`
                            : "none",
                    }}
                />

                <path
                    ref={bottomPathRef}
                    d={BOTTOM_PATH_D}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${bottomSegmentLength} ${metrics.bottomLength}`}
                    strokeDashoffset={isOpen ? bottomOpenOffset : bottomClosedOffset}
                    style={{
                        transition: transitionEnabled
                            ? `stroke-dashoffset ${motionDuration}ms ${dashEase}, stroke-dasharray ${motionDuration}ms ${dashEase}`
                            : "none",
                    }}
                />

                <path
                    ref={middlePathRef}
                    d={MIDDLE_PATH_D}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "50% 50%",
                        transform: isOpen ? "scaleX(0)" : "scaleX(1)",
                        transition: transitionEnabled
                            ? `transform 520ms ${dashEase}, opacity 420ms ease`
                            : "none",
                        opacity: isOpen ? 0 : 1,
                    }}
                />
            </svg>
        </button>
    )
}

addPropertyControls(MotionHamburger, {
    defaultOpen: {
        type: ControlType.Boolean,
        title: "State",
        defaultValue: false,
        enabledTitle: "Open",
        disabledTitle: "Closed",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 48,
        min: 24,
        max: 500,
        step: 4,
        unit: "px",
    },
    hoverGrow: {
        type: ControlType.Boolean,
        title: "Hover Grow",
        defaultValue: true,
        description: "Scale the icon up on hover and focus.",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 2.5,
        min: 1,
        max: 6,
        step: 0.5,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    showRing: {
        type: ControlType.Boolean,
        title: "Ring",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ringColor: {
        type: ControlType.Color,
        title: "Ring Color",
        defaultValue: "rgba(255,255,255,0.35)",
    },
    ringWidth: {
        type: ControlType.Number,
        title: "Ring Thickness",
        defaultValue: 1.25,
        min: 0.5,
        max: 4,
        step: 0.25,
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
    },
    onToggle: {
        type: ControlType.EventHandler,
        title: "On Toggle",
    },
})