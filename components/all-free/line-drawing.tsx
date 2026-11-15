// Mouse move line drawing component that creates a trailing line effect following the cursor
import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MouseMoveLineDrawingProps {
    children: React.ReactNode
    maxPoints: number
    strokeColor: string
    strokeWidth: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MouseMoveLineDrawing(props: MouseMoveLineDrawingProps) {
    const {
        children,
        maxPoints = 30,
        strokeColor = "#000000",
        strokeWidth = 4,
        style,
    } = props

    const [points, setPoints] = useState<string[]>([])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
            }}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top

                startTransition(() => {
                    setPoints((pv) => {
                        const pointBuffer = [...pv, `${x} ${y}`]

                        if (pointBuffer.length > maxPoints) {
                            pointBuffer.shift()
                        }

                        return pointBuffer
                    })
                })
            }}
        >
            {children}
            <svg
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                }}
                viewBox="0 0 100% 100%"
            >
                <polyline
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray="0"
                    strokeLinecap="round"
                    points={points.join(", ")}
                />
            </svg>
        </div>
    )
}

addPropertyControls(MouseMoveLineDrawing, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    maxPoints: {
        type: ControlType.Number,
        title: "Max Points",
        defaultValue: 30,
        min: 5,
        max: 100,
        step: 1,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
})