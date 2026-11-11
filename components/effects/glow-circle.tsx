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


type Props = {
    mode: "solid" | "gradient"
    color: string
    gradientColor1: string
    gradientColor2: string
    gradientType: "linear" | "radial"
    blur: number
    pulseSpeed: number
    pulseScale: boolean
    width?: number
    height?: number
}

export default function GlowCircle({
    mode,
    color,
    gradientColor1,
    gradientColor2,
    gradientType,
    blur,
    pulseSpeed,
    pulseScale,
    width = 200,
    height = 200,
}: Props) {
    const background =
        mode === "solid"
            ? color
            : gradientType === "linear"
              ? `linear-gradient(135deg, ${gradientColor1}, ${gradientColor2})`
              : `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                minWidth: width,
                minHeight: height,
                background,
                borderRadius: "50%",
                filter: `blur(${blur}px)`,
            }}
            animate={{
                opacity: [1, 0.3, 1],
                scale: pulseScale ? [1, 1.1, 1] : 1,
            }}
            transition={{
                duration: pulseSpeed,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    )
}

addPropertyControls(GlowCircle, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["solid", "gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "solid",
    },
    color: {
        type: ControlType.Color,
        defaultValue: "rgba(16,185,129,0.4)",
        title: "Solid Color",
        hidden: (props) => props.mode !== "solid",
    },
    gradientColor1: {
        type: ControlType.Color,
        defaultValue: "rgba(16,185,129,0.4)",
        title: "Color 1",
        hidden: (props) => props.mode !== "gradient",
    },
    gradientColor2: {
        type: ControlType.Color,
        defaultValue: "rgba(59,130,246,0.4)",
        title: "Color 2",
        hidden: (props) => props.mode !== "gradient",
    },
    gradientType: {
        type: ControlType.Enum,
        title: "Gradient Type",
        options: ["linear", "radial"],
        optionTitles: ["Linear", "Radial"],
        defaultValue: "radial",
        hidden: (props) => props.mode !== "gradient",
    },
    blur: {
        type: ControlType.Number,
        defaultValue: 125,
        min: 1,
        max: 200,
        title: "Blur",
    },
    pulseSpeed: {
        type: ControlType.Number,
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        title: "Pulse Speed (s)",
    },
    pulseScale: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Pulse Scale",
    },
})

GlowCircle.defaultProps = {
    width: 200,
    height: 200,
}
