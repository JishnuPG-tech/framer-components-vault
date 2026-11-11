// Gradient border box component with customizable border width, radius, gradient, and background
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useMemo } from "react"

interface GradientStop {
    color: string
    position: number
}

interface GradientBorderBoxProps {
    children?: React.ReactNode
    borderWidth: number
    borderRadius: number
    gradientStops: GradientStop[]
    gradientAngle: number
    background: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GradientBorderBox(props: GradientBorderBoxProps) {
    const {
        children,
        borderWidth,
        borderRadius,
        gradientStops,
        gradientAngle,
        background,
        style
    } = props

    const gradient = useMemo(() => {
        const sortedStops = [...gradientStops].sort((a, b) => a.position - b.position)
        const colorStops = sortedStops.map(stop => `${stop.color} ${stop.position}%`)
        return `linear-gradient(${gradientAngle}deg, ${colorStops.join(", ")})`
    }, [gradientStops, gradientAngle])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                background: gradient,
                borderRadius: borderRadius,
                padding: borderWidth,
                width: "100%",
                height: "100%",
                boxSizing: "border-box"
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: background,
                    borderRadius: Math.max(0, borderRadius - borderWidth),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                }}
            >
                {children}
            </div>
        </div>
    )
}

addPropertyControls(GradientBorderBox, {
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        unit: "px"
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 9999,
        step: 1,
        unit: "px"
    },
    gradientStops: {
        type: ControlType.Array,
        title: "Gradient Stops",
        control: {
            type: ControlType.Object,
            controls: {
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#ff6b6b"
                },
                position: {
                    type: ControlType.Number,
                    title: "Position",
                    defaultValue: 0,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%"
                }
            }
        },
        defaultValue: [
            { color: "#ff6b6b", position: 0 },
            { color: "#4ecdc4", position: 50 },
            { color: "#45b7d1", position: 100 }
        ]
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 45,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg"
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF"
    }
})