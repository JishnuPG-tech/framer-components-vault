import { useEffect, useRef, useState } from "react"
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
    motion,
    useScroll,
    useVelocity,
    useSpring,
    useTransform,
    useInView,
} from "framer-motion"

type Axis = "y" | "x"

interface ScrollSkewProps {
    children?: React.ReactNode
    maxSkew: number
    maxStretch: number
    sensitivity: number
    smoothing: number
    bounce: number
    axis: Axis
    disableOnMobile: boolean
}

/**
 * Scroll Skew - leans and stretches a layer by how fast the page is scrolling,
 * settling back to rest the moment it stops.
 *
 * This reads scroll *velocity*, which is a derivative of position and so is not
 * something Framer's own scroll transforms can express. Work is gated on the
 * layer being in view, and skipped entirely on touch where scroll velocity is
 * too jerky to read well.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollSkew(props: ScrollSkewProps) {
    const {
        children,
        maxSkew,
        maxStretch,
        sensitivity,
        smoothing,
        bounce,
        axis,
        disableOnMobile,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { margin: "120px" })
    const [coarse, setCoarse] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        setCoarse(window.matchMedia("(pointer: coarse)").matches)
    }, [])

    // One "bounce" value drives the spring: ratio 1 settles flat.
    const stiffness = 400 / (1 + smoothing)
    const ratio = 1 - Math.min(Math.max(bounce, 0), 0.95)
    const damping = 2 * ratio * Math.sqrt(stiffness)

    const { scrollY } = useScroll()
    const velocity = useVelocity(scrollY)
    const smooth = useSpring(velocity, { stiffness, damping, mass: 1 })

    const reach = Math.max(sensitivity, 1)

    // Scrolling down leans one way, up the other.
    const skew = useTransform(
        smooth,
        [-reach, 0, reach],
        [maxSkew, 0, -maxSkew],
        { clamp: true }
    )
    // Stretch is symmetric, so both directions elongate.
    const stretch = useTransform(
        smooth,
        [-reach, 0, reach],
        [1 + maxStretch, 1, 1 + maxStretch],
        { clamp: true }
    )

    const active = !isStatic && inView && !(coarse && disableOnMobile)

    const style = {
        width: "100%",
        height: "100%",
        transformOrigin: "center center",
        willChange: active ? "transform" : undefined,
        ...(axis === "y"
            ? { skewY: active ? skew : 0, scaleY: active ? stretch : 1 }
            : { skewX: active ? skew : 0, scaleX: active ? stretch : 1 }),
    } as any

    return (
        <div
            ref={ref}
            style={{ position: "relative", width: "100%", height: "100%" }}
        >
            <motion.div style={style}>{children}</motion.div>
        </div>
    )
}

ScrollSkew.displayName = "Scroll Skew"

addPropertyControls(ScrollSkew, {
    children: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
    },
    maxSkew: {
        type: ControlType.Number,
        title: "Skew",
        description: "How far it leans at full scroll speed.",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 0.5,
    },
    maxStretch: {
        type: ControlType.Number,
        title: "Stretch",
        description: "How much it elongates at full scroll speed.",
        defaultValue: 0.06,
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Full At",
        description:
            "Scroll speed that reaches the maximum, in pixels per second. Lower values react sooner.",
        defaultValue: 1500,
        min: 200,
        max: 6000,
        step: 100,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        description: "0 reacts instantly. Higher values ease in and out.",
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 0.5,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        description: "Overshoot as it returns to rest. 0 settles flat.",
        defaultValue: 0.2,
        min: 0,
        max: 0.9,
        step: 0.05,
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        defaultValue: "y",
        options: ["y", "x"],
        optionTitles: ["Vertical", "Horizontal"],
        displaySegmentedControl: true,
    },
    disableOnMobile: {
        type: ControlType.Boolean,
        title: "Skip On Touch",
        description:
            "Touch scrolling is too abrupt for this to read well. Leave on.",
        defaultValue: true,
    },
})
