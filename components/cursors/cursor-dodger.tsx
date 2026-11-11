// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

/**
 * CURSOR DODGER
 * Drop this component in, then assign your Button (or any layer) to the
 * "Content" property. As long as it's the content of this wrapper, it will
 * physically move away whenever the cursor gets close — impossible to
 * hover or click.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CursorDodger(props) {
    const {
        children,
        radius,
        strength,
        maxOffset,
        randomness,
        returnSpeed,
        speed,
    } = props

    const isStatic = useIsStaticRenderer()

    const wrapperRef = useRef<HTMLDivElement>(null)
    const offset = useRef({ x: 0, y: 0 })
    const rafId = useRef<number | null>(null)

    const springConfig =
        speed === "Fast"
            ? { stiffness: 500, damping: 25 }
            : speed === "Slow"
              ? { stiffness: 150, damping: 20 }
              : { stiffness: 300, damping: 22 }

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, springConfig)
    const springY = useSpring(y, springConfig)

    useEffect(() => {
        // Canvas / export: no listeners, no motion, no continuous effects.
        if (isStatic) return

        function update(clientX: number, clientY: number) {
            const el = wrapperRef.current
            if (!el) return

            const rect = el.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const dx = centerX - clientX
            const dy = centerY - clientY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < radius) {
                const baseAngle = Math.atan2(dy, dx)
                const jitter = (Math.random() - 0.5) * Math.PI * randomness
                const angle = baseAngle + jitter
                const push = strength * (1 - dist / radius)

                let nx = offset.current.x + Math.cos(angle) * push
                let ny = offset.current.y + Math.sin(angle) * push

                const mag = Math.sqrt(nx * nx + ny * ny)
                if (mag > maxOffset) {
                    nx = (nx / mag) * maxOffset
                    ny = (ny / mag) * maxOffset
                }

                offset.current = { x: nx, y: ny }
            } else {
                offset.current = {
                    x: offset.current.x * (1 - returnSpeed),
                    y: offset.current.y * (1 - returnSpeed),
                }
            }

            x.set(offset.current.x)
            y.set(offset.current.y)
        }

        function handlePointerMove(e: PointerEvent) {
            if (rafId.current) return
            rafId.current = requestAnimationFrame(() => {
                update(e.clientX, e.clientY)
                rafId.current = null
            })
        }

        window.addEventListener("pointermove", handlePointerMove)
        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [isStatic, radius, strength, maxOffset, randomness, returnSpeed])

    // Static context (canvas / export): plain, motionless layout so the
    // editor stays responsive and exports don't capture a mid-dodge frame.
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {children}
            </div>
        )
    }

    return (
        <motion.div
            ref={wrapperRef}
            style={{
                x: springX,
                y: springY,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
            }}
        >
            {children}
        </motion.div>
    )
}

CursorDodger.defaultProps = {
    radius: 140,
    strength: 70,
    maxOffset: 160,
    randomness: 0.5,
    returnSpeed: 0.08,
    speed: "Medium",
}

addPropertyControls(CursorDodger, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    radius: {
        type: ControlType.Number,
        title: "Detect Radius",
        min: 20,
        max: 500,
        step: 5,
        defaultValue: 140,
    },
    strength: {
        type: ControlType.Number,
        title: "Dodge Force",
        min: 5,
        max: 300,
        step: 5,
        defaultValue: 70,
    },
    maxOffset: {
        type: ControlType.Number,
        title: "Max Travel",
        min: 20,
        max: 600,
        step: 10,
        defaultValue: 160,
    },
    randomness: {
        type: ControlType.Number,
        title: "Randomness",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.08,
    },
    speed: {
        type: ControlType.Enum,
        title: "Motion Speed",
        options: ["Slow", "Medium", "Fast"],
        defaultValue: "Medium",
    },
})
