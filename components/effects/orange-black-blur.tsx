import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Direction = "top" | "bottom" | "left" | "right"

interface Props {
    blur: number
    opacity: number
    direction: Direction
    size: number
    color: string
}

export default function GradualBlur(props: Props) {
    const { blur, opacity, direction, size, color } = props

    const gradientDirectionMap: Record<Direction, string> = {
        top: "to bottom",
        bottom: "to top",
        left: "to right",
        right: "to left",
    }

    const style: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        maskImage: `linear-gradient(${gradientDirectionMap[direction]}, rgba(0,0,0,1) 0%, rgba(0,0,0,0) ${size}%)`,
        WebkitMaskImage: `linear-gradient(${gradientDirectionMap[direction]}, rgba(0,0,0,1) 0%, rgba(0,0,0,0) ${size}%)`,
        background: color,
        opacity: opacity,
    }

    return <div style={style} />
}

GradualBlur.defaultProps = {
    blur: 20,
    opacity: 1,
    direction: "bottom",
    size: 60,
    color: "rgba(255,255,255,0.0)",
}

addPropertyControls(GradualBlur, {
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 100,
        step: 1,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["top", "bottom", "left", "right"],
        optionTitles: ["Top", "Bottom", "Left", "Right"],
    },
    size: {
        type: ControlType.Number,
        title: "Fade Size %",
        min: 0,
        max: 100,
        step: 1,
    },
    color: {
        type: ControlType.Color,
        title: "Overlay Color",
    },
})
