import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, animate } from "framer-motion"

interface CursorSpotlightProps {
    base?: React.ReactNode
    reveal?: React.ReactNode
    radius: number
    softness: number
    followSpeed: number
    bounce: number
    fade: number
    invert: boolean
    idleReveal: boolean
}

/**
 * Cursor Spotlight - a soft circular window that follows the cursor, showing a
 * second layer only where the light falls.
 *
 * Pointer handling is on the element itself, so nothing listens while the cursor
 * is elsewhere. The spotlight centre travels as two CSS custom properties driven
 * by springs, so moving it never re-renders React.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorSpotlight(props: CursorSpotlightProps) {
    const {
        base,
        reveal,
        radius,
        softness,
        followSpeed,
        bounce,
        fade,
        invert,
        idleReveal,
    } = props

    const isStatic = useIsStaticRenderer()
    const rectRef = useRef<DOMRect | null>(null)

    // One "bounce" value drives the spring: ratio 1 settles flat.
    const stiffness = 40 * followSpeed
    const ratio = 1 - Math.min(Math.max(bounce, 0), 0.95)
    const damping = 2 * ratio * Math.sqrt(stiffness)

    const rawX = useMotionValue(0)
    const rawY = useMotionValue(0)
    const x = useSpring(rawX, { stiffness, damping, mass: 1 })
    const y = useSpring(rawY, { stiffness, damping, mass: 1 })
    const lit = useMotionValue(idleReveal ? 1 : 0)

    // Softness is where the light starts falling off, as a share of the radius.
    const inner = Math.min(Math.max(100 - softness, 0), 100)

    const centre = isStatic
        ? "50% 50%"
        : "calc(var(--sx) * 1px) calc(var(--sy) * 1px)"

    const stops = invert
        ? `transparent ${inner}%, #000 100%`
        : `#000 ${inner}%, transparent 100%`

    const mask = `radial-gradient(circle ${radius}px at ${centre}, ${stops})`

    // Touch devices have no cursor to follow, so light the reveal layer
    // permanently rather than leaving a visitor on the dimmed base.
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (window.matchMedia("(pointer: coarse)").matches) lit.set(1)
    }, [isStatic, lit])

    const onEnter = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.pointerType !== "mouse") return
        const rect = event.currentTarget.getBoundingClientRect()
        rectRef.current = rect
        // Jump to the entry point so the light does not sweep in from a corner.
        rawX.jump(event.clientX - rect.left)
        rawY.jump(event.clientY - rect.top)
        animate(lit, 1, { duration: fade, ease: "easeOut" })
    }

    const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.pointerType !== "mouse") return
        const rect =
            rectRef.current ||
            (rectRef.current = event.currentTarget.getBoundingClientRect())
        rawX.set(event.clientX - rect.left)
        rawY.set(event.clientY - rect.top)
    }

    const onLeave = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.pointerType !== "mouse") return
        rectRef.current = null
        animate(lit, idleReveal ? 1 : 0, { duration: fade, ease: "easeOut" })
    }

    const revealStyle = {
        position: "absolute",
        inset: 0,
        opacity: isStatic ? 1 : lit,
        maskImage: mask,
        WebkitMaskImage: mask,
        "--sx": x,
        "--sy": y,
    } as unknown as React.CSSProperties

    return (
        <div
            onPointerEnter={onEnter}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <div style={{ position: "absolute", inset: 0 }}>{base}</div>
            <motion.div style={revealStyle}>{reveal}</motion.div>
        </div>
    )
}

CursorSpotlight.displayName = "Mask Spotlight"

addPropertyControls(CursorSpotlight, {
    base: {
        type: ControlType.Slot,
        title: "Base",
        description: "The layer that is always visible.",
        maxCount: 1,
    },
    reveal: {
        type: ControlType.Slot,
        title: "Reveal",
        description: "The layer shown only where the light falls.",
        maxCount: 1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 180,
        min: 20,
        max: 900,
        step: 10,
        unit: "px",
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        description: "0 is a hard edge, 100 fades the whole way in.",
        defaultValue: 45,
        min: 0,
        max: 100,
        step: 1,
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        description: "Lower values trail further behind the cursor.",
        defaultValue: 7,
        min: 1,
        max: 10,
        step: 0.5,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        description: "Overshoot as the light catches up. 0 settles flat.",
        defaultValue: 0,
        min: 0,
        max: 0.9,
        step: 0.05,
    },
    fade: {
        type: ControlType.Number,
        title: "Fade",
        description: "How long the light takes to appear and disappear.",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert",
        description: "Reveal everywhere except under the cursor.",
        defaultValue: false,
    },
    idleReveal: {
        type: ControlType.Boolean,
        title: "Idle Reveal",
        description:
            "Keep the reveal layer visible when nothing is hovering. Touch devices always show it.",
        defaultValue: false,
    },
})
