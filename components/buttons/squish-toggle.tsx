import {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SquishToggleProps {
    isOn: boolean
    onToggle?: (isOn: boolean) => void
    activeColor: string
    inactiveColor: string
    thumbColor: string
    duration: number
    style?: CSSProperties
}

const PADDING_PX = 4
const BASE_WIDTH_PX = 112
const BASE_HEIGHT_PX = 64

/**
 * Squish Toggle
 *
 * A toggle switch with a playful squish animation.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SquishToggle(props: SquishToggleProps) {
    const {
        isOn: initialIsOn = false,
        onToggle,
        activeColor = "#427AFF",
        inactiveColor = "#e8e8e8",
        thumbColor = "#ffffff",
        duration = 0.4,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const clampedDuration = Math.max(0, Math.min(0.8, duration))

    const trackColorDuration = Math.max(0, Math.min(0.8, clampedDuration * 0.5))

    const [isOn, setIsOn] = useState(initialIsOn)
    const [toggleCount, setToggleCount] = useState(0)
    const [hasToggled, setHasToggled] = useState(false)
    const prevPropIsOn = useRef(initialIsOn)
    const outerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const paddingPx = PADDING_PX

    const initialTravelX = useMemo(() => {
        const thumbSize = Math.max(0, BASE_HEIGHT_PX - paddingPx * 2)
        return Math.max(0, BASE_WIDTH_PX - paddingPx * 2 - thumbSize)
    }, [paddingPx])

    const [travelX, setTravelX] = useState(initialTravelX)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!outerRef.current) return

        const el = outerRef.current

        const measure = () => {
            const rect = el.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            const next = Math.max(0, Math.min(rect.width / BASE_WIDTH_PX, rect.height / BASE_HEIGHT_PX))
            startTransition(() => setScale(Number.isFinite(next) && next > 0 ? next : 1))
        }

        const raf1 = window.requestAnimationFrame(measure)
        const t1 = window.setTimeout(measure, 0)

        const ro = new ResizeObserver(measure)
        ro.observe(el)

        return () => {
            window.cancelAnimationFrame(raf1)
            window.clearTimeout(t1)
            ro.disconnect()
        }
    }, [])

    useEffect(() => {
        startTransition(() => setTravelX(initialTravelX))
    }, [initialTravelX])

    useEffect(() => {
        if (prevPropIsOn.current === initialIsOn) return
        prevPropIsOn.current = initialIsOn
        startTransition(() => {
            setHasToggled(true)
            setIsOn(initialIsOn)
            setToggleCount((c) => c + 1)
        })
    }, [initialIsOn])

    const handleToggle = useCallback(() => {
        const newState = !isOn
        startTransition(() => {
            setHasToggled(true)
            setIsOn(newState)
            setToggleCount((c) => c + 1)
        })
        if (onToggle) onToggle(newState)
    }, [isOn, onToggle])

    // Migrate legacy published instances that still carry the previous default green
    const resolvedActiveColor = useMemo(() => {
        const c = (activeColor || "").trim().toLowerCase()
        if (c === "#4ccf59") return "#427AFF"
        return activeColor
    }, [activeColor])

    return (
        <div
            ref={outerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                overflow: "visible",
                border: "none",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: BASE_WIDTH_PX,
                    height: BASE_HEIGHT_PX,
                    aspectRatio: `${BASE_WIDTH_PX} / ${BASE_HEIGHT_PX}`,
                    transform: `scale(${scale})`,
                    transformOrigin: "50% 50%",
                    cursor: "pointer",
                }}
                onClick={handleToggle}
                role="switch"
                aria-checked={isOn}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                        e.preventDefault()
                        handleToggle()
                    }
                }}
            >
                <motion.div
                    initial={false}
                    animate={{
                        backgroundColor: isOn ? resolvedActiveColor : inactiveColor,
                    }}
                    transition={hasToggled ? { duration: trackColorDuration } : { duration: 0 }}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 999,
                        position: "relative",
                        padding: "4px",
                        boxSizing: "border-box",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                    }}
                    ref={trackRef}
                >
                    <motion.div
                        key={toggleCount}
                        transition={
                            hasToggled
                                ? {
                                      duration: clampedDuration,
                                      x: {
                                          duration: clampedDuration,
                                          times: [0, 0.5, 1],
                                          ease: [
                                              [0.75, 0, 1, 1],
                                              [0, 0, 0.3, 1.15],
                                          ],
                                      },
                                      scaleX: {
                                          duration: clampedDuration,
                                          times: [0, 0.5, 1],
                                          ease: [
                                              [0.75, 0, 1, 1],
                                              [0, 0, 0.3, 1.15],
                                          ],
                                      },
                                      scaleY: {
                                          duration: clampedDuration,
                                          times: [0, 0.5, 1],
                                          ease: [
                                              [0.75, 0, 1, 1],
                                              [0, 0, 0.3, 1.15],
                                          ],
                                      },
                                      borderRadius: {
                                          duration: clampedDuration,
                                          times: [0, 0.5, 1],
                                          ease: [
                                              [0.75, 0, 1, 1],
                                              [0, 0, 0.3, 1.15],
                                          ],
                                      },
                                  }
                                : { duration: 0 }
                        }
                        initial={false}
                        animate={
                            isStatic
                                ? {
                                      x: 0,
                                      originX: isOn ? 0 : 1,
                                      scaleX: 1,
                                      scaleY: 1,
                                      borderRadius: "50%",
                                  }
                                : hasToggled
                                ? {
                                      x: isOn
                                          ? [0, Math.min(8, travelX), travelX]
                                          : [travelX, Math.max(0, travelX - 8), 0],
                                      originX: isOn ? 0 : 1,
                                      scaleX: [1, 1.22, 1],
                                      scaleY: [1, 0.7, 1],
                                      borderRadius: ["50%", "70%", "50%"],
                                  }
                                : {
                                      x: isOn ? travelX : 0,
                                      originX: isOn ? 0 : 1,
                                      scaleX: 1,
                                      scaleY: 1,
                                      borderRadius: "50%",
                                  }
                        }
                        style={{
                            height: `calc(100% - ${paddingPx * 2}px)`,
                            aspectRatio: "1 / 1",
                            backgroundColor: thumbColor,
                            borderRadius: "50%",
                            position: "absolute",
                            top: `${paddingPx}px`,
                            left: isStatic ? (isOn ? undefined : `${paddingPx}px`) : `${paddingPx}px`,
                            right: isStatic ? (isOn ? `${paddingPx}px` : undefined) : undefined,
                            boxShadow:
                                "0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)",
                        }}
                    />
                </motion.div>
            </div>
        </div>
    )
}

addPropertyControls(SquishToggle, {
    isOn: {
        type: ControlType.Boolean,
        title: "State",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#427AFF",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "#e8e8e8",
    },
    thumbColor: {
        type: ControlType.Color,
        title: "Thumb",
        defaultValue: "#ffffff",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0.1,
        max: 0.8,
        step: 0.1,
        displayStepper: false,
    },
    onToggle: {
        type: ControlType.EventHandler,
    },
})

SquishToggle.displayName = "Squish Toggle"
