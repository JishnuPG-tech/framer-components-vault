import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, type Transition } from "framer-motion"

type AnimationMode = "forward" | "pingPong"
type StaggerOrigin = "first" | "last" | "center" | "custom"

type LetterSwapProps = {
    style?: CSSProperties
    label: string
    mode: AnimationMode
    reverse: boolean
    staggerDuration: number
    staggerFrom: StaggerOrigin
    staggerIndex: number
    transition: Transition
    textColor: string
    backgroundColor: string
    padding: string
    radius: string
    cursor: CSSProperties["cursor"]
    font: CSSProperties
    onTap?: () => void
}

const defaultFont: CSSProperties = {
    fontSize: 32,
    lineHeight: 1.2,
    fontWeight: 500,
    letterSpacing: 0,
    textAlign: "center",
}

const defaultTransition: Transition = {
    type: "spring",
    duration: 0.7,
    bounce: 0,
}

const defaultProps = {
    label: "Hover me!",
    mode: "forward" as AnimationMode,
    reverse: true,
    staggerDuration: 0.03,
    staggerFrom: "first" as StaggerOrigin,
    staggerIndex: 0,
    transition: defaultTransition,
    textColor: "#000000",
    backgroundColor: "rgba(255,255,255,0)",
    padding: "0px",
    radius: "0px",
    cursor: "pointer" as CSSProperties["cursor"],
    font: defaultFont,
}

const visuallyHiddenStyle: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function getStaggerOrder(
    index: number,
    count: number,
    from: StaggerOrigin,
    customIndex: number
) {
    if (count <= 1) return 0

    if (from === "last") return count - 1 - index
    if (from === "custom") {
        return Math.abs(index - clamp(Math.round(customIndex), 0, count - 1))
    }
    if (from === "center") {
        const center = (count - 1) / 2
        const centerOffset = count % 2 === 0 ? 0.5 : 0

        return Math.abs(index - center) - centerOffset
    }

    return index
}

function getTransitionDuration(transition: Transition) {
    return typeof transition?.duration === "number" ? transition.duration : 0.7
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 56
 */
export default function LetterSwap(props: Partial<LetterSwapProps>) {
    const {
        style = {},
        label = defaultProps.label,
        mode = defaultProps.mode,
        reverse = defaultProps.reverse,
        staggerDuration = defaultProps.staggerDuration,
        staggerFrom = defaultProps.staggerFrom,
        staggerIndex = defaultProps.staggerIndex,
        transition = defaultProps.transition,
        textColor = defaultProps.textColor,
        backgroundColor = defaultProps.backgroundColor,
        padding = defaultProps.padding,
        radius = defaultProps.radius,
        cursor = defaultProps.cursor,
        font = defaultProps.font,
        onTap,
    } = props

    const [active, setActive] = useState(false)
    const [resetImmediately, setResetImmediately] = useState(false)
    const blockedRef = useRef(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const frameRef = useRef<number | null>(null)

    const letters = useMemo(() => String(label).split(""), [label])

    const staggerDelays = useMemo(
        () =>
            letters.map((_, index) => {
                const order = getStaggerOrder(
                    index,
                    letters.length,
                    staggerFrom,
                    staggerIndex
                )

                return Math.max(0, order * staggerDuration)
            }),
        [letters, staggerDuration, staggerFrom, staggerIndex]
    )

    const longestDelay = Math.max(0, ...staggerDelays)
    const primaryTravel = reverse ? "100%" : "-100%"
    const secondaryRest = reverse ? "-100%" : "100%"

    const clearTimers = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)

        timeoutRef.current = null
        frameRef.current = null
    }

    useEffect(() => {
        return clearTimers
    }, [])

    useEffect(() => {
        clearTimers()
        blockedRef.current = false
        setActive(false)
        setResetImmediately(false)
    }, [label, mode])

    const startForwardAnimation = () => {
        if (blockedRef.current) return

        blockedRef.current = true
        setResetImmediately(false)
        setActive(true)

        const totalDuration =
            (getTransitionDuration(transition) + longestDelay) * 1000 + 80

        timeoutRef.current = setTimeout(() => {
            setResetImmediately(true)
            setActive(false)

            frameRef.current = requestAnimationFrame(() => {
                setResetImmediately(false)
                blockedRef.current = false
            })
        }, totalDuration)
    }

    const handleHoverStart = () => {
        if (mode === "forward") {
            startForwardAnimation()
            return
        }

        setResetImmediately(false)
        setActive(true)
    }

    const handleHoverEnd = () => {
        if (mode === "pingPong") setActive(false)
    }

    const handleTap = () => {
        onTap?.()
    }

    return (
        <motion.span
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
            onTap={handleTap}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxSizing: "border-box",
                color: textColor,
                backgroundColor,
                borderRadius: radius,
                padding,
                cursor,
                userSelect: "none",
                verticalAlign: "top",
                whiteSpace: "pre",
                ...font,
                ...style,
            }}
        >
            <span style={visuallyHiddenStyle}>{label}</span>

            {letters.map((letter, index) => {
                const letterTransition: Transition = resetImmediately
                    ? { duration: 0, delay: 0 }
                    : {
                          ...transition,
                          delay: staggerDelays[index],
                      }

                return (
                    <span
                        key={`${letter}-${index}`}
                        aria-hidden="true"
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            overflow: "hidden",
                            whiteSpace: "pre",
                            lineHeight: "inherit",
                        }}
                    >
                        <motion.span
                            initial={false}
                            animate={{ y: active ? primaryTravel : "0%" }}
                            transition={letterTransition}
                            style={{
                                display: "inline-block",
                                willChange: "transform",
                            }}
                        >
                            {letter}
                        </motion.span>
                        <motion.span
                            initial={false}
                            animate={{ y: active ? "0%" : secondaryRest }}
                            transition={letterTransition}
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "inline-block",
                                willChange: "transform",
                            }}
                        >
                            {letter}
                        </motion.span>
                    </span>
                )
            })}
        </motion.span>
    )
}

LetterSwap.defaultProps = defaultProps

addPropertyControls(LetterSwap, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: defaultProps.label,
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["forward", "pingPong"],
        optionTitles: ["Forward", "Ping Pong"],
        defaultValue: defaultProps.mode,
        displaySegmentedControl: true,
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: defaultProps.reverse,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    staggerDuration: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: defaultProps.staggerDuration,
        min: 0,
        max: 0.2,
        step: 0.005,
        unit: "s",
    },
    staggerFrom: {
        type: ControlType.Enum,
        title: "From",
        options: ["first", "center", "last", "custom"],
        optionTitles: ["First", "Center", "Last", "Custom"],
        defaultValue: defaultProps.staggerFrom,
    },
    staggerIndex: {
        type: ControlType.Number,
        title: "Index",
        defaultValue: defaultProps.staggerIndex,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden(props) {
            return props.staggerFrom !== "custom"
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: defaultProps.transition,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: defaultProps.font,
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: defaultProps.textColor,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaultProps.backgroundColor,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: defaultProps.padding,
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: defaultProps.radius,
    },
    cursor: {
        type: ControlType.Cursor,
        title: "Cursor",
        defaultValue: defaultProps.cursor,
    },
    onTap: {
        type: ControlType.EventHandler,
    },
})
