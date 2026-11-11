// Elastic line component that can be dragged vertically to create a spring effect
import { useRef, startTransition } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ElasticLineProps {
    lineColor: string
    strokeWidth: number
    tension: number
    friction: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ElasticLine(props: ElasticLineProps) {
    const {
        lineColor = "#FF0055",
        strokeWidth = 2,
        tension = 400,
        friction = 15,
        style,
    } = props

    const INTERNAL_WIDTH = 1000
    const safeHeight = typeof style?.height === "number" && style.height > 0 
        ? style.height 
        : parseFloat(String(style?.height)) || 50
    const centerY = safeHeight / 2

    const isDragging = useRef(false)
    const dragStartY = useRef(0)

    const bendY = useMotionValue(0)
    const springConfig = { stiffness: tension, damping: friction }
    const animatedBendY = useSpring(bendY, springConfig)

    const path = useTransform(animatedBendY, (currentBend) => {
        const safeBend = isNaN(currentBend) ? 0 : currentBend
        return `M 0 ${centerY} Q ${INTERNAL_WIDTH / 2} ${centerY + safeBend} ${INTERNAL_WIDTH} ${centerY}`
    })

    const startDrag = (event: React.PointerEvent) => {
        startTransition(() => {
            isDragging.current = true
        })
        animatedBendY.stop()
        dragStartY.current = event.clientY
        bendY.set(animatedBendY.get())
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const onDrag = (event: React.PointerEvent) => {
        if (!isDragging.current) return
        const delta = event.clientY - dragStartY.current
        bendY.set(delta * 0.8)
    }

    const stopDrag = (event: React.PointerEvent) => {
        startTransition(() => {
            isDragging.current = false
        })
        event.currentTarget.releasePointerCapture(event.pointerId)
        bendY.set(0)
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                overflow: "visible",
                position: "relative",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${INTERNAL_WIDTH} ${safeHeight}`}
                preserveAspectRatio="none"
                style={{
                    overflow: "visible",
                    display: "block",
                }}
            >
                <motion.path
                    d={path}
                    stroke={lineColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    style={{ pointerEvents: "none" }}
                />

                <motion.path
                    d={path}
                    stroke="transparent"
                    strokeWidth={Math.max(40, safeHeight)}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    onPointerDown={startDrag}
                    onPointerMove={onDrag}
                    onPointerUp={stopDrag}
                    onPointerLeave={stopDrag}
                    style={{
                        cursor: "grab",
                        pointerEvents: "auto",
                    }}
                    whileTap={{ cursor: "grabbing" }}
                />
            </svg>
        </div>
    )
}

addPropertyControls(ElasticLine, {
    lineColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FF0055",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 2,
        min: 1,
        max: 10,
    },
    tension: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 400,
        min: 100,
        max: 1000,
    },
    friction: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 15,
        min: 5,
        max: 50,
    },
})