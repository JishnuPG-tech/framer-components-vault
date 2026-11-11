import type { CSSProperties } from "react"
import { useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

type BadgePreset = "green" | "orange" | "red"
type BadgeType = "activity" | "custom"
type BadgeAnimation = "circle" | "shake" | "glow"

type FramerFont = any

interface ActivityBadgeProps {
    type: BadgeType
    preset: BadgePreset
    customColor: string

    animation: BadgeAnimation
    transition: any
    minOpacity: number
    scaleAmount: number
    rings: 1 | 2 | 3

    blurAmount: number

    radius: string

    glow: boolean
    glowSize: number
    glowOpacity: number

    label: string
    style?: CSSProperties
}

const PRESET_COLORS: Record<BadgePreset, string> = {
    green: "#31EE33",
    orange: "#FFBB00",
    red: "#FF0000",
}

/**
 * @framerIntrinsicWidth 12
 * @framerIntrinsicHeight 12
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ActivityBadge(props: ActivityBadgeProps) {
    const {
        type = "activity",
        preset = "green",
        customColor = "#1B82CC",
        animation = "circle",
        transition: transitionProp = {
            duration: 0.9,
            ease: "easeOut",
            delay: 0.4,
        },
        minOpacity = 0.75,
        scaleAmount = 1.3,
        rings = 1,
        blurAmount = 3,
        radius = "999px",
        glow = true,
        glowSize = 10,
        glowOpacity = 0.28,
        label = "Activity status",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { amount: 0.2, margin: "0px" })

    const color = useMemo(() => {
        if (type === "custom") return customColor
        return PRESET_COLORS[preset]
    }, [type, preset, customColor])

    const shouldAnimate = !isStatic && inView

    const containerStyle: CSSProperties = useMemo(() => {
        return {
            position: "relative",
            width: style?.width ?? "100%",
            height: style?.height ?? "100%",
            display: "block",
            lineHeight: 0,
            fontSize: 0,
            ...style,
        }
    }, [style])

    const dotStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: color,
            transformOrigin: "50% 50%",
            boxShadow: "none",
        }),
        [color, radius]
    )

    const glowStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: color,
            filter: "none",
            opacity: 0,
            transformOrigin: "50% 50%",
            pointerEvents: "none",
        }),
        [color, radius]
    )

    const blurStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: color,
            filter: `blur(${Math.max(0, blurAmount)}px)`,
            opacity: 0,
            transformOrigin: "50% 50%",
            pointerEvents: "none",
        }),
        [color, radius, blurAmount]
    )

    const loopBaseTransition = useMemo(() => {
        if (!shouldAnimate) return undefined
        const base = (
            transitionProp && typeof transitionProp === "object"
                ? transitionProp
                : {}
        ) as any
        const repeatDelay = Math.max(0, Number(base.delay) || 0)
        const { delay, ...rest } = base
        return {
            ...rest,
            repeat: Infinity,
            repeatDelay,
        }
    }, [shouldAnimate, transitionProp])

    const circleTransition = useMemo(() => {
        if (!loopBaseTransition) return undefined
        return {
            ...loopBaseTransition,
            times: [0, 0.02, 0.8, 1],
        }
    }, [loopBaseTransition])

    const animateDot = useMemo(() => {
        if (!shouldAnimate) return undefined

        if (animation === "shake") {
            return {
                x: [0, -1.5, 1.5, -1.5, 1.5, 0],
            }
        }

        if (animation === "glow") {
            return undefined
        }

        return undefined
    }, [shouldAnimate, animation])

    const dotTransition = useMemo(() => {
        if (!loopBaseTransition) return undefined

        if (animation === "shake") {
            return {
                ...loopBaseTransition,
                times: [0, 0.18, 0.36, 0.54, 0.72, 1],
            }
        }

        if (animation === "glow") {
            return undefined
        }

        return loopBaseTransition
    }, [loopBaseTransition, animation])

    const animateGlow = useMemo(() => {
        if (!shouldAnimate) return undefined
        if (animation !== "circle") return undefined

        const start = Math.max(0, Math.min(1, minOpacity))
        const endScale = Math.max(1, scaleAmount)

        return {
            opacity: [0, start, 0, 0],
            scale: [1, 1, endScale, 1],
        }
    }, [shouldAnimate, animation, minOpacity, scaleAmount])

    const animateBlurGlow = useMemo(() => {
        if (!shouldAnimate) return undefined
        if (animation !== "glow") return undefined

        const start = Math.max(0, Math.min(1, minOpacity))
        const endScale = Math.max(1, scaleAmount)

        return {
            opacity: [0, start, 0],
            scale: [0, endScale, 0],
        }
    }, [shouldAnimate, animation, minOpacity, scaleAmount])

    const blurTransition = useMemo(() => {
        if (!loopBaseTransition) return undefined
        if (animation !== "glow") return undefined

        return {
            ...loopBaseTransition,
            times: [0, 0.6, 1],
        }
    }, [loopBaseTransition, animation])

    const glowTransitions = useMemo(() => {
        if (!shouldAnimate) return []
        if (animation !== "circle") return []
        if (!circleTransition) return []

        const base = (
            transitionProp && typeof transitionProp === "object"
                ? transitionProp
                : {}
        ) as any
        const duration = Math.max(0.01, Number(base.duration) || 0.7)
        const ringCount = Math.max(1, Math.min(3, Number(rings) || 1))
        const ringStagger = duration / (ringCount + 1)
        const baseDelay = Math.max(0, Number(base.delay) || 0)

        return Array.from({ length: ringCount }).map((_, i) => {
            return {
                ...circleTransition,
                delay: baseDelay + i * ringStagger,
            }
        })
    }, [shouldAnimate, animation, transitionProp, rings, circleTransition])

    return (
        <div
            ref={ref}
            style={containerStyle}
            role="img"
            aria-label={label}
            title={label}
        >
            {animation === "circle" &&
                (glowTransitions.length
                    ? glowTransitions
                    : [circleTransition]
                ).map((t, i) => (
                    <motion.div
                        key={i}
                        style={glowStyle}
                        animate={animateGlow ?? { opacity: 0, scale: 1 }}
                        transition={t}
                        aria-hidden="true"
                    />
                ))}
            {animation === "glow" && (
                <motion.div
                    style={blurStyle}
                    animate={animateBlurGlow ?? { opacity: 0, scale: 0 }}
                    transition={blurTransition}
                    aria-hidden="true"
                />
            )}
            <motion.div
                style={dotStyle}
                animate={animateDot}
                transition={dotTransition}
            />
        </div>
    )
}

addPropertyControls(ActivityBadge, {
    type: {
        type: ControlType.Enum,
        title: "Type",
        description:
            "Note: Parent Stacks/Frames must have Overflow set to Visible, otherwise the expanding ring animation will be clipped.",
        options: ["activity", "custom"],
        optionTitles: ["Activity", "Custom"],
        defaultValue: "activity",
        displaySegmentedControl: true,
    },
    preset: {
        type: ControlType.Enum,
        title: "Activity",
        options: ["green", "orange", "red"],
        optionTitles: ["Green", "Orange", "Red"],
        defaultValue: "green",
        displaySegmentedControl: true,
        hidden: (p) => p.type !== "activity",
    },
    customColor: {
        type: ControlType.Color,
        title: "Custom Color",
        defaultValue: "#1B82CC",
        hidden: (p) => p.type !== "custom",
    },

    animation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["circle", "shake", "glow"],
        optionTitles: ["Pulse", "Shake", "Glow"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },

    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { duration: 0.9, ease: "easeOut", delay: 0.4 },
    },

    rings: {
        type: ControlType.Enum,
        title: "Rings",
        options: [1, 2, 3],
        optionTitles: ["1", "2", "3"],
        defaultValue: 1,
        displaySegmentedControl: true,
        hidden: (p) => p.animation !== "circle",
    },

    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "999px",
    },

    minOpacity: {
        type: ControlType.Number,
        title: "Peak Opacity",
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => p.animation !== "circle" && p.animation !== "glow",
    },

    scaleAmount: {
        type: ControlType.Number,
        title: "End Scale",
        defaultValue: 1.3,
        min: 1,
        max: 4,
        step: 0.05,
        hidden: (p) => p.animation !== "circle" && p.animation !== "glow",
    },

    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 3,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p) => p.animation !== "glow",
    },

    glow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: () => true,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: () => true,
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 0.28,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: () => true,
    },

    label: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "Activity status",
    },
})

ActivityBadge.displayName = "Activity Badge"
