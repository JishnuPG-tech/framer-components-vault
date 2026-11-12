// Parallax Card that reacts to pointer movement with smooth spring animation and adjustable intensity
import { useRef, useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring } from "framer-motion"

interface ParallaxCardProps {
    children?: React.ReactNode
    background: string
    borderRadius: number
    shadow: boolean
    intensity: number
    moveY: boolean
    moveX: boolean
    style?: CSSProperties
}

/**
 * Parallax Card
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ParallaxCard(props: ParallaxCardProps) {
    const {
        children,
        background,
        borderRadius,
        shadow,
        intensity,
        moveY,
        moveX,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const cardRef = useRef<HTMLDivElement>(null)
    const [cardRect, setCardRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

    // Motion values for X and Y
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, { stiffness: 120, damping: 18 })
    const springY = useSpring(y, { stiffness: 120, damping: 18 })

    // Update card rect on mount and resize
    useEffect(() => {
        function updateRect() {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect()
                setCardRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
            }
        }
        updateRect()
        window.addEventListener("resize", updateRect)
        return () => window.removeEventListener("resize", updateRect)
    }, [])

    // Pointer move handler
    useEffect(() => {
        if (isStatic) return
        function handlePointerMove(e: PointerEvent) {
            if (!cardRect) return
            const centerX = cardRect.left + cardRect.width / 2
            const centerY = cardRect.top + cardRect.height / 2
            const dx = e.clientX - centerX
            const dy = e.clientY - centerY
            // Move in opposite direction, scaled by intensity
            const moveAmountX = moveX ? -dx / (cardRect.width / 2) * (intensity * 2.2) : 0
            const moveAmountY = moveY ? -dy / (cardRect.height / 2) * (intensity * 6) : 0
            startTransition(() => {
                x.set(moveAmountX)
                y.set(moveAmountY)
            })
        }
        function handlePointerLeave() {
            startTransition(() => {
                x.set(0)
                y.set(0)
            })
        }
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerleave", handlePointerLeave)
        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerleave", handlePointerLeave)
        }
    }, [cardRect, intensity, moveX, moveY, isStatic])

    // Static preview fallback
    if (isStatic) {
        return (
            <div
                ref={cardRef}
                style={{
                    ...style,
                    background,
                    borderRadius,
                    boxShadow: shadow ? "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)" : "none",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
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
            ref={cardRef}
            style={{
                ...style,
                background,
                borderRadius,
                boxShadow: shadow ? "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)" : "none",
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                x: springX,
                y: springY,
                willChange: "transform",
            }}
            tabIndex={0}
            aria-label="Parallax Card"
        >
            {children}
        </motion.div>
    )
}

addPropertyControls(ParallaxCard, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 64,
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 12,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
    },
    moveY: {
        type: ControlType.Boolean,
        title: "Move Y",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    moveX: {
        type: ControlType.Boolean,
        title: "Move X",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    children: {
        type: ControlType.Slot,
        title: "Content",
    },
})
