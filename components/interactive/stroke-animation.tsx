import { useRef, useEffect, useState } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FillEffectProps {
    fillColor: string
    animate: boolean
    transition: any
    useIndexStagger: boolean
    stagger: number
    index: number
    backgroundColor: string
    direction: "left" | "right" | "top" | "bottom"
    animationType: "once" | "repeat" | "mirror" | "continuous"
    trigger: "onLoad" | "onView" | "onScroll"
    replay: boolean
    loop: boolean
    loopCount: number
    scrollStart: number
    scrollEnd: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 1
 */
export default function FillEffect(props: FillEffectProps) {
    const {
        fillColor = "#000000",
        animate = true,
        transition = { duration: 2, ease: "linear" },
        useIndexStagger = false,
        stagger = 0,
        index = 1,
        backgroundColor = "transparent",
        direction = "right",
        animationType = "once",
        trigger = "onView",
        replay = false,
        loop = true,
        loopCount = 0,
        scrollStart = 0,
        scrollEnd = 1,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.1 })
    const wasInView = useRef(false)
    const [hasPlayed, setHasPlayed] = useState(false)
    const [key, setKey] = useState(0)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const isHorizontal = direction === "left" || direction === "right"
    const shouldAnimate = animate && !isStatic

    const effectiveStagger = useIndexStagger ? stagger * index : stagger

    useEffect(() => {
        if (
            !shouldAnimate ||
            trigger === "onLoad" ||
            trigger === "onScroll" ||
            !replay
        )
            return

        if (wasInView.current && !isInView) {
            setHasPlayed(false)
            setKey((prev) => prev + 1)
        }
        wasInView.current = isInView
    }, [isInView, trigger, replay, shouldAnimate])

    const isTriggered =
        trigger === "onLoad" ||
        (trigger === "onView" && isInView) ||
        (trigger === "onScroll" && isInView)

    useEffect(() => {
        if (isTriggered && !hasPlayed && trigger !== "onScroll") {
            setHasPlayed(true)
        }
    }, [isTriggered, hasPlayed, trigger])

    const getRepeatCount = () => {
        if (animationType === "once") return 0
        if (!loop) return 0
        return loopCount > 0 ? loopCount - 1 : Infinity
    }

    const scrollWidth = useTransform(
        scrollYProgress,
        [scrollStart, scrollEnd],
        ["0%", "100%"]
    )
    const scrollHeight = useTransform(
        scrollYProgress,
        [scrollStart, scrollEnd],
        ["0%", "100%"]
    )

    const getAnimationProps = () => {
        const duration = transition?.duration ?? 2
        const ease = transition?.ease ?? "linear"
        const delay = (transition?.delay ?? 0) + effectiveStagger
        const repeatCount = getRepeatCount()

        if (trigger === "onScroll") {
            return {
                initial: {},
                animate: {},
            }
        }

        if (animationType === "once" && hasPlayed && !replay) {
            return {
                initial: isHorizontal ? { width: "100%" } : { height: "100%" },
                animate: isHorizontal ? { width: "100%" } : { height: "100%" },
            }
        }

        if (!isTriggered && !hasPlayed) {
            return {
                initial: isHorizontal ? { width: "0%" } : { height: "0%" },
                animate: isHorizontal ? { width: "0%" } : { height: "0%" },
            }
        }

        if (animationType === "continuous") {
            const side =
                direction === "right"
                    ? "left"
                    : direction === "left"
                      ? "right"
                      : direction === "bottom"
                        ? "top"
                        : "bottom"

            const size = isHorizontal ? "width" : "height"

            return {
                initial: { [side]: "0%", [size]: "0%" },
                animate: {
                    [side]: ["0%", "0%", "100%"],
                    [size]: ["0%", "100%", "0%"],
                },
                transition: {
                    duration: duration * 2,
                    ease,
                    delay,
                    repeat: repeatCount,
                    repeatDelay: 0,
                },
            }
        }

        const sizeProp = isHorizontal ? "width" : "height"
        return {
            initial: { [sizeProp]: "0%" },
            animate: { [sizeProp]: "100%" },
            transition: {
                duration,
                ease,
                delay,
                repeat: repeatCount,
                repeatType:
                    animationType === "mirror"
                        ? ("mirror" as const)
                        : ("loop" as const),
            },
        }
    }

    const animationProps = getAnimationProps()

    const getBaseStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            backgroundColor: fillColor,
            position: "absolute",
        }

        if (trigger === "onScroll") {
            if (direction === "right")
                return {
                    ...base,
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: scrollWidth,
                }
            if (direction === "left")
                return {
                    ...base,
                    top: 0,
                    right: 0,
                    height: "100%",
                    width: scrollWidth,
                }
            if (direction === "bottom")
                return {
                    ...base,
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: scrollHeight,
                }
            if (direction === "top")
                return {
                    ...base,
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: scrollHeight,
                }
        }

        if (direction === "right")
            return { ...base, top: 0, left: 0, height: "100%" }
        if (direction === "left")
            return { ...base, top: 0, right: 0, height: "100%" }
        if (direction === "bottom")
            return { ...base, top: 0, left: 0, width: "100%" }
        if (direction === "top")
            return { ...base, bottom: 0, left: 0, width: "100%" }
        return base
    }

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    overflow: "hidden",
                    ...style,
                }}
            >
                <div
                    style={{
                        ...getBaseStyles(),
                        width: "100%",
                        height: "100%",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: 1,
                backgroundColor,
                overflow: "hidden",
                ...style,
            }}
        >
            <motion.div
                key={key}
                style={getBaseStyles()}
                initial={animationProps.initial}
                animate={animationProps.animate}
                transition={animationProps.transition}
            />
        </div>
    )
}

FillEffect.displayName = "Stroke Animation"

addPropertyControls(FillEffect, {
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#000000",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "right",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        optionIcons: [
            "direction-left",
            "direction-right",
            "direction-up",
            "direction-down",
        ],
        displaySegmentedControl: true,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Type",
        options: ["once", "repeat", "mirror", "continuous"],
        optionTitles: ["Once", "Repeat", "Mirror", "Continuous"],
        defaultValue: "once",
        hidden: (props) => props.trigger === "onScroll",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["onLoad", "onView", "onScroll"],
        optionTitles: ["On Load", "On View", "On Scroll"],
        defaultValue: "onView",
    },
    scrollStart: {
        type: ControlType.Number,
        title: "Scroll Start",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description: "When animation starts (0 = top, 1 = bottom)",
        hidden: (props) => props.trigger !== "onScroll",
    },
    scrollEnd: {
        type: ControlType.Number,
        title: "Scroll End",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description: "When animation completes (0 = top, 1 = bottom)",
        hidden: (props) => props.trigger !== "onScroll",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (props) =>
            props.animationType === "once" || props.trigger === "onScroll",
    },
    loopCount: {
        type: ControlType.Number,
        title: "Loop Count",
        defaultValue: 0,
        min: 0,
        description: "0: Infinity | 1+: Specific number of loops",
        hidden: (props) =>
            props.animationType === "once" ||
            !props.loop ||
            props.trigger === "onScroll",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
        hidden: (props) =>
            props.trigger === "onLoad" || props.trigger === "onScroll",
    },
    useIndexStagger: {
        type: ControlType.Boolean,
        title: "Index Stagger",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.trigger === "onScroll",
        description: "On = Index × Stagger.",
    },
    index: {
        type: ControlType.Number,
        title: "Index",
        defaultValue: 1,
        min: 1,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) =>
            props.trigger === "onScroll" || !props.useIndexStagger,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.05,
        unit: "s",
        displayStepper: true,
        hidden: (props) => props.trigger === "onScroll",
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        hidden: (props) => props.trigger === "onScroll",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
        description:
            "See more component from [Iklil Najma M](https://dub.sh/artevo)",
    },
})
