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


interface LayerDef {
    blur: string
    gradient: string
}

const computeDirection = (dir: string) => {
    switch (dir) {
        case "toTop":
            return "to top"
        case "toLeft":
            return "to left"
        case "toRight":
            return "to right"
        case "toBottom":
        default:
            return "to bottom"
    }
}

// Code component provided by Eleveight Supply™. All rights reserved 2024.

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

export default function ProgressiveBlur(props) {
    const {
        blur,
        blurDirection,
        allCorners,
        radius,
        topLeft,
        topRight,
        bottomRight,
        bottomLeft,
    } = props

    const layers: LayerDef[] = []
    const base = blur
    const dir = computeDirection(blurDirection)
    for (let i = 0; i < 8; i++) {
        const b = base / 2 ** (8 - i)
        const start = (i * 12.5).toFixed(1)
        const mid1 = (+start + 12.5).toFixed(1)
        const mid2 = (+start + 25).toFixed(1)
        const end = (+start + 37.5).toFixed(1)
        layers.push({
            blur: `${b}px`,
            gradient: [
                `rgba(0,0,0,0) ${start}%`,
                `rgba(0,0,0,1) ${mid1}%`,
                `rgba(0,0,0,1) ${mid2}%`,
                `rgba(0,0,0,0) ${end}%`,
            ].join(", "),
        })
    }

    const cornerRadius = allCorners
        ? `${radius}px`
        : `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: cornerRadius,
                overflow: "hidden",
                background: "none",
            }}
        >
            {layers.map((layer, idx) => (
                <div
                    key={idx}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: idx + 1,
                        pointerEvents: "none",
                        backdropFilter: `blur(${layer.blur})`,
                        WebkitBackdropFilter: `blur(${layer.blur})`,
                        maskImage: `linear-gradient(${dir}, ${layer.gradient})`,
                        WebkitMaskImage: `linear-gradient(${dir}, ${layer.gradient})`,
                        borderRadius: cornerRadius,
                    }}
                />
            ))}
        </div>
    )
}

ProgressiveBlur.defaultProps = {
    blur: 10,
    blurDirection: "toBottom",
    allCorners: true,
    radius: 0,
    topLeft: 0,
    topRight: 0,
    bottomRight: 0,
    bottomLeft: 0,
}

addPropertyControls(ProgressiveBlur, {
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
    },
    blurDirection: {
        type: ControlType.SegmentedEnum,
        title: "Direction",
        options: ["toBottom", "toTop", "toLeft", "toRight"],
        optionTitles: ["↓", "↑", "←", "→"],
        defaultValue: "toBottom",
    },
    cornerRadius: {
        type: ControlType.FusedNumber,
        title: "Radius",
        toggleKey: "allCorners",
        toggleTitles: ["All", "Individual"],
        valueKeys: ["topLeft", "topRight", "bottomRight", "bottomLeft"],
        valueLabels: ["TL", "TR", "BR", "BL"],
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        description:
            "If you need rounded corners, apply them here—don’t put them on the parent container or the blur will break.",
    },
})
