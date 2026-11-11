/*
MIT License
Copyright (c) 2024 Lost Coast Labs, Inc. (Paper Design)
*/

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

import { Heatmap } from "@paper-design/shaders-react"

interface HeatmapShaderProps {
    colors?: string[]
    angle: number
    noise: number
    innerGlow: number
    outerGlow: number
    contour: number
    speed: number
    scale: number
    image?: any
    frame: number
    pauseInCanvas: boolean
    stopAnimationInCanvas: boolean
}

const defaultColors = [
    "#FF4C00",
    "#FF991E",
    "#FFE679",
    "#6BD7FF",
    "#2F63E7",
    "#1F3BA2",
    "#11206A",
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicHeight 500
 * @framerIntrinsicWidth 500
 * @framerDisableUnlink
 */
export default function HeatmapShader({
    colors = defaultColors,
    angle = 0,
    noise = 0,
    innerGlow = 0.5,
    outerGlow = 0.5,
    contour = 0.5,
    speed = 100,
    scale = 75,
    image,
    frame = 0,
    pauseInCanvas = false,
    stopAnimationInCanvas = false,
}: HeatmapShaderProps) {
    // Recommended Framer hook for animated/static rendering contexts like Canvas/export.
    const isStaticRenderer = useIsStaticRenderer()

    // Fully pause the shader in Canvas/static contexts by rendering a lightweight placeholder.
    // Preview and published site continue to render the shader normally.
    if (isStaticRenderer && pauseInCanvas) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#DDDDDD",
                    fontSize: 15,
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.02em",
                    userSelect: "none",
                    flexDirection: "column",
                    textAlign: "center",
                    padding: "4px 10px",
                }}
            >
                Pause in Canvas is enabled. The shader will still render in
                Preview and on the published site.
            </div>
        )
    }

    // Ensure the shader always receives exactly 7 colors.
    const filledColors = [...colors]
    while (filledColors.length < 7) {
        filledColors.push("#000000")
    }

    // Reverse for the shader's expected display order.
    const shaderColors = [
        filledColors[6],
        filledColors[5],
        filledColors[4],
        filledColors[3],
        filledColors[2],
        filledColors[1],
        filledColors[0],
    ]

    // Convert editor percentages to shader decimals.
    const scaleDecimal = scale / 100
    const speedDecimal = speed / 100

    // Stop animation only in Canvas/static renderer by forcing speed to 0.
    // Preview and published site keep using the normal configured speed.
    const shaderSpeed =
        isStaticRenderer && stopAnimationInCanvas ? 0 : speedDecimal

    // Support both ResponsiveImage objects and direct URL strings.
    const imageUrl =
        image?.src ||
        image ||
        "https://framerusercontent.com/images/FGGGajHla0WnjjtcGnGW7goBjk.svg?width=800&height=800"

    return (
        <Heatmap
            colors={shaderColors}
            colorBack="rgba(0,0,0,0)"
            speed={shaderSpeed}
            contour={contour}
            angle={angle}
            noise={noise}
            innerGlow={innerGlow}
            outerGlow={outerGlow}
            scale={scaleDecimal}
            image={imageUrl}
            frame={frame}
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    )
}

HeatmapShader.displayName = "Heatmap Effect"

addPropertyControls(HeatmapShader, {
    colors: {
        type: ControlType.Array,
        title: "Color Palette",
        control: {
            type: ControlType.Color,
        },
        defaultValue: defaultColors,
        maxCount: 10,
        description: "Define the color gradient for the heatmap effect",
    },

    scale: {
        type: ControlType.Number,
        defaultValue: 75,
        min: 10,
        max: 200,
        step: 1,
        unit: "%",
        title: "Scale",
        description: "Controls the overall size of the heatmap pattern",
    },
    angle: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        title: "Rotation",
        description: "Rotates the heatmap pattern in degrees",
    },

    speed: {
        type: ControlType.Number,
        defaultValue: 100,
        min: 0,
        max: 500,
        step: 1,
        unit: "%",
        title: "Animation Speed",
        description: "Controls how fast the heatmap animates (0 = static)",
    },
    frame: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        title: "Animation Offset",
        description: "Manually control the animation frame position",
    },

    contour: {
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        title: "Contour Intensity",
        description: "Adjusts the sharpness of color boundaries",
    },
    innerGlow: {
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        title: "Inner Glow",
        description: "Controls the intensity of inner glow effects",
    },
    outerGlow: {
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        title: "Outer Glow",
        description: "Controls the intensity of outer glow effects",
    },
    noise: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        title: "Noise Amount",
        description: "Adds random texture variation to the heatmap",
    },

    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description:
            "Upload an image to blend with the heatmap pattern (the image should be black, with a white or transparent background).",
    },

    pauseInCanvas: {
        type: ControlType.Boolean,
        title: "Pause in Canvas",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Pauses the shader in Framer Canvas only. It will still render in Preview and on the published site.",
    },

    stopAnimationInCanvas: {
        type: ControlType.Boolean,
        title: "Stop Animation",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => props.pauseInCanvas === true,
        description:
            "Stops animation in Framer Canvas only. It will still animate in Preview and on the published site.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
    },
})
