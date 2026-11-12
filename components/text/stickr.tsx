// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface StickerTextProps {
    text: string
    textColor: string
    shadowColor: string
    strokeColor: string
    strokeWidth: number
    shadowDistance: number
    shadowAngle: number
    rotation: number
    font: CSSProperties
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
function StickerText(props: StickerTextProps) {
    const {
        text,
        textColor,
        shadowColor,
        strokeColor,
        strokeWidth,
        shadowDistance,
        shadowAngle,
        rotation,
        font,
        style,
    } = props

    const rad = (shadowAngle * Math.PI) / 180
    const offsetX = Math.sin(rad) * shadowDistance
    const offsetY = -Math.cos(rad) * shadowDistance

    return (
        <div
            style={{
                ...style,
                display: "inline-block",
                containerType: "inline-size",
            }}
        >
            <p
                style={{
                    margin: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    textAlign: "center",
                    color: textColor,
                    paintOrder: "stroke fill",
                    WebkitTextStroke: `${strokeWidth}em ${strokeColor}`,
                    filter: `drop-shadow(${offsetX}em ${offsetY}em 0 ${shadowColor})`,
                    lineHeight: 1,
                    rotate: `${rotation}deg`,
                    ...font,
                }}
            >
                {text}
            </p>
        </div>
    )
}

addPropertyControls(StickerText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Neat!",
    },
    textColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#29ABE2",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: "#5B4FCF",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#FFFFFF",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 0.125,
        min: 0,
        max: 0.5,
        step: 0.0125,
        displayStepper: true,
    },
    shadowDistance: {
        type: ControlType.Number,
        title: "Shadow Dist.",
        defaultValue: 0.1237,
        min: 0,
        max: 0.5,
        step: 0.0125,
        displayStepper: true,
    },
    shadowAngle: {
        type: ControlType.Number,
        title: "Shadow Angle",
        defaultValue: 225,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: -7.5,
        min: -45,
        max: 45,
        step: 0.5,
        unit: "°",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Black",
            letterSpacing: "-0.03125em",
            lineHeight: "1em",
        },
        description:
            "[Component by Tanjir i.](https://www.linkedin.com/in/tanjir-i-5ab6b6373/)",
    },
})

export default StickerText
