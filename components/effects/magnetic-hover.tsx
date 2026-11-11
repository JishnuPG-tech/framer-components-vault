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

import { motion, useMotionValue, animate } from "framer-motion"

type EaseName = "easeOut" | "circOut" | "backOut" | "easeInOut" | "linear"

interface MagneticHoverProps {
    children?: React.ReactNode
    strength: number
    radius: number
    followDuration: number
    followEase: EaseName
    releaseBounce: number
    releaseSpeed: number
    hoverScale: number
    tilt: boolean
    tiltAmount: number
    showField: boolean
    fieldColor: string
}

/**
 * Magnetic Hover - wraps any layer and pulls it toward the cursor.
 *
 * The pointer handler only runs while the component is on screen, and the
 * measured rect is cached between moves, so an offscreen instance costs nothing.
 *
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 64
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MagneticHover(props: MagneticHoverProps) {
    const {
        children,
        strength,
        radius,
        followDuration,
        followEase,
        releaseBounce,
        releaseSpeed,
        hoverScale,
        tilt,
        tiltAmount,
        showField,
        fieldColor,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const scale = useMotionValue(1)
    const rotate = useMotionValue(0)

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const root = rootRef.current
        if (!root) return

        const follow = {
            duration: followDuration,
            ease: followEase,
        }

        // Derive a spring from one intuitive "bounce" value: a damping ratio of
        // 1 settles without overshoot, lower ratios overshoot more.
        const stiffness = 40 * releaseSpeed
        const ratio = 1 - Math.min(Math.max(releaseBounce, 0), 0.95)
        const release = {
            type: "spring" as const,
            stiffness,
            damping: 2 * ratio * Math.sqrt(stiffness),
            mass: 1,
        }

        // Cached rect, invalidated on scroll/resize rather than measured on
        // every pointer move.
        let rect: DOMRect | null = null
        const invalidate = () => {
            rect = null
        }

        let active = false

        const settle = () => {
            active = false
            animate(x, 0, release)
            animate(y, 0, release)
            animate(scale, 1, release)
            animate(rotate, 0, release)
        }

        const onMove = (event: PointerEvent) => {
            if (!rect) rect = root.getBoundingClientRect()

            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            // Distance from the cursor to the nearest edge of the layer.
            const edgeX = Math.max(
                0,
                Math.abs(event.clientX - centerX) - rect.width / 2
            )
            const edgeY = Math.max(
                0,
                Math.abs(event.clientY - centerY) - rect.height / 2
            )
            const edgeDistance = Math.sqrt(edgeX * edgeX + edgeY * edgeY)

            if (edgeDistance > radius) {
                if (active) settle()
                return
            }

            active = true

            // Pull falls off to zero as the cursor nears the edge of the field.
            const falloff = radius > 0 ? 1 - edgeDistance / radius : 1
            animate(x, (event.clientX - centerX) * strength * falloff, follow)
            animate(y, (event.clientY - centerY) * strength * falloff, follow)
            animate(scale, hoverScale, follow)
            if (tilt) {
                const offsetX = (event.clientX - centerX) * strength * falloff
                animate(
                    rotate,
                    (offsetX / (rect.width / 2 || 1)) * tiltAmount,
                    follow
                )
            }
        }

        let listening = false
        const listen = () => {
            if (listening) return
            listening = true
            rect = null
            window.addEventListener("pointermove", onMove, { passive: true })
            window.addEventListener("scroll", invalidate, { passive: true })
            window.addEventListener("resize", invalidate)
            document.addEventListener("pointerleave", settle)
        }
        const stopListening = () => {
            if (!listening) return
            listening = false
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("scroll", invalidate)
            window.removeEventListener("resize", invalidate)
            document.removeEventListener("pointerleave", settle)
            settle()
        }

        // Only do any work while the component is actually on screen.
        let observer: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) listen()
                        else stopListening()
                    }
                },
                { rootMargin: "120px" }
            )
            observer.observe(root)
        } else {
            listen()
        }

        return () => {
            if (observer) observer.disconnect()
            stopListening()
            x.set(0)
            y.set(0)
            scale.set(1)
            rotate.set(0)
        }
    }, [
        isStatic,
        strength,
        radius,
        followDuration,
        followEase,
        releaseBounce,
        releaseSpeed,
        hoverScale,
        tilt,
        tiltAmount,
    ])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {showField && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: `calc(100% + ${radius * 2}px)`,
                        aspectRatio: "1 / 1",
                        transform: "translate(-50%, -50%)",
                        border: `1px dashed ${fieldColor}`,
                        borderRadius: "50%",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    x,
                    y,
                    scale,
                    rotate,
                }}
            >
                {children}
            </motion.div>
        </div>
    )
}

MagneticHover.displayName = "Magnetic Hover"

const EASE_OPTIONS: EaseName[] = [
    "easeOut",
    "circOut",
    "backOut",
    "easeInOut",
    "linear",
]

addPropertyControls(MagneticHover, {
    children: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        description: "How far the layer travels toward the cursor.",
        defaultValue: 0.45,
        min: 0,
        max: 1.5,
        step: 0.05,
    },
    radius: {
        type: ControlType.Number,
        title: "Field",
        description: "How far outside the layer the pull starts.",
        defaultValue: 80,
        min: 0,
        max: 600,
        step: 10,
        unit: "px",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1.06,
        min: 0.5,
        max: 2,
        step: 0.01,
    },
    followDuration: {
        type: ControlType.Number,
        title: "Follow",
        defaultValue: 0.5,
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    followEase: {
        type: ControlType.Enum,
        title: "Follow Ease",
        defaultValue: "easeOut",
        options: EASE_OPTIONS,
        optionTitles: ["Ease Out", "Circ Out", "Back Out", "Ease In Out", "Linear"],
    },
    releaseBounce: {
        type: ControlType.Number,
        title: "Bounce",
        description: "Overshoot as the layer springs back. 0 settles flat.",
        defaultValue: 0.35,
        min: 0,
        max: 0.9,
        step: 0.05,
    },
    releaseSpeed: {
        type: ControlType.Number,
        title: "Release Speed",
        description: "How quickly it springs back.",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 0.5,
    },
    tilt: {
        type: ControlType.Boolean,
        title: "Tilt",
        defaultValue: false,
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "Tilt Amount",
        defaultValue: 8,
        min: 0,
        max: 45,
        step: 1,
        hidden: (props: Partial<MagneticHoverProps>) => !props.tilt,
    },
    showField: {
        type: ControlType.Boolean,
        title: "Show Field",
        description: "Draws the dashed circle marking the magnetic radius.",
        defaultValue: false,
    },
    fieldColor: {
        type: ControlType.Color,
        title: "Field Color",
        defaultValue: "rgba(255, 255, 255, 0.18)",
        hidden: (props: Partial<MagneticHoverProps>) => !props.showField,
    },
})
