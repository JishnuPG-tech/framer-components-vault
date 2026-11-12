// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, type CSSProperties } from "react"

/**
 * GRAIN
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function NoiseGrain(props) {
    const {
        opacity,
        blendMode,
        size = 4,
        type = "standard",
        contrast = 100,
        brightness = 100,
    } = props

    const [noiseUrl, setNoiseUrl] = useState("")

    useEffect(() => {
        const canvas = document.createElement("canvas")
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const imageData = ctx.createImageData(128, 128)
        const data = imageData.data

        let currentSeed = 1
        const random = () => {
            const x = Math.sin(currentSeed++) * 10000
            return x - Math.floor(x)
        }

        for (let i = 0; i < data.length; i += 4) {
            if (type === "color") {
                data[i] = random() * 255
                data[i + 1] = random() * 255
                data[i + 2] = random() * 255
            } else if (type === "rough") {
                const val = random() > 0.5 ? 255 : 0
                data[i] = val
                data[i + 1] = val
                data[i + 2] = val
            } else if (type === "film") {
                const u = 1 - random()
                const v = random()
                const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
                let val = 128 + z * 64
                val = Math.max(0, Math.min(255, val))
                data[i] = val
                data[i + 1] = val
                data[i + 2] = val
            } else if (type === "digital") {
                const levels = 4
                const val = Math.floor(random() * levels) * (255 / (levels - 1))
                data[i] = val
                data[i + 1] = val
                data[i + 2] = val
            } else {
                const val = random() * 255
                data[i] = val
                data[i + 1] = val
                data[i + 2] = val
            }
            data[i + 3] = 255
        }

        ctx.putImageData(imageData, 0, 0)
        setNoiseUrl(canvas.toDataURL())
    }, [type])

    const commonStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: "repeat",
        imageRendering: "pixelated",
        filter: `contrast(${contrast}%) brightness(${brightness}%)`,
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                overflow: "hidden",
                zIndex: 10,
                opacity: opacity,
                mixBlendMode: blendMode,
            }}
        >
            <div
                style={{
                    ...commonStyle,
                    backgroundSize: `${128 * size}px`,
                }}
            />
        </div>
    )
}

addPropertyControls(NoiseGrain, {
    type: {
        type: ControlType.Enum,
        title: "Type",
        options: ["standard", "rough", "color", "film", "digital"],
        optionTitles: ["Standard", "Rough", "Color", "Film", "Digital"],
        defaultValue: "standard",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
        defaultValue: "overlay",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 0.1,
        max: 20,
        step: 0.1,
        defaultValue: 4,
        displayStepper: true,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0,
        max: 200,
        defaultValue: 100,
        unit: "%",
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: 0,
        max: 200,
        defaultValue: 100,
        unit: "%",
    },
})