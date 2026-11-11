import * as React from "react"
import { useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

/**
 * @framerDisableUnlink
 */
export default function GlassPanel(props) {
    const {
        children,
        baseFrequency,
        numOctaves,
        stdDeviation,
        scale,
        background,
    } = props
    const id = useId()
    const svgId = `svgFilter-${id}`
    return (
        <div style={containerStyle}>
            {/* Glass Panel */}
            <div
                style={{
                    ...panelStyle,
                    background: background,
                    backdropFilter: `url(#${svgId})`,
                    WebkitBackdropFilter: `url(#${svgId})`,
                }}
            >
                {children}
            </div>

            {/* SVG FILTER - GIỮ NGUYÊN STRUCTURE */}
            <svg style={{ position: "absolute", width: 0, height: 0 }}>
                <filter
                    id={svgId}
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                    primitiveUnits="objectBoundingBox"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency={baseFrequency}
                        numOctaves={numOctaves}
                        seed="7"
                        result="map"
                    />
                    <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation={stdDeviation}
                        result="blur"
                    />
                    <feDisplacementMap
                        in="blur"
                        in2="map"
                        scale={scale}
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </svg>
        </div>
    )
}

// ✅ Container
const containerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    background: "transparent",
}

// ✅ Panel base
const panelStyle = {
    width: "100%",
    height: "100%",
    minWidth: "400px",
    minHeight: "300px",
    position: "relative",
    outline: "none",

    transition: "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
}

// 🎛 Property Controls
addPropertyControls(GlassPanel, {
    baseFrequency: {
        type: ControlType.Number,
        title: "Frequency",
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 0.8,
    },
    numOctaves: {
        type: ControlType.Number,
        title: "Layers",
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 1,
    },
    stdDeviation: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 0.1,
        step: 0.01,
        defaultValue: 0.1,
    },
    scale: {
        type: ControlType.Number,
        title: "Distortion",
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 0.8,
    },
    background: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "rgba(255,255,255,0.1)",
    },
})
