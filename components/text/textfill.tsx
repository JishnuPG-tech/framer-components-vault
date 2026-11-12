// Editorial text component with image or gradient fill effects
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

interface EditorialTextFillProps {
    text: string
    fillType: "Image" | "Gradient"
    image: { src: string; alt: string }
    gradientColor1: string
    gradientColor2: string
    gradientDirection: "To Right" | "To Bottom" | "Diagonal" | "Radial"
    uppercase: boolean
    shadow: boolean
    shadowStrength: number
    stroke: boolean
    strokeColor: string
    strokeWidth: number
    backgroundColor: string
    font: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TextFill(props: EditorialTextFillProps) {
    const {
        text,
        fillType,
        image = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
        gradientColor1,
        gradientColor2,
        gradientDirection,
        uppercase,
        shadow,
        shadowStrength,
        stroke,
        strokeColor,
        strokeWidth,
        backgroundColor,
        font,
        style
    } = props

    const backgroundImage = useMemo(() => {
        if (fillType === "Image") {
            return `url(${image.src})`
        } else {
            const directions = {
                "To Right": "to right",
                "To Bottom": "to bottom", 
                "Diagonal": "45deg",
                "Radial": "radial-gradient(circle"
            }
            
            if (gradientDirection === "Radial") {
                return `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`
            } else {
                return `linear-gradient(${directions[gradientDirection]}, ${gradientColor1}, ${gradientColor2})`
            }
        }
    }, [fillType, image.src, gradientColor1, gradientColor2, gradientDirection])

    const textStyle: CSSProperties = {
        background: backgroundImage,
        backgroundSize: fillType === "Image" ? "cover" : "100% 100%",
        backgroundPosition: "center",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        textTransform: uppercase ? "uppercase" : "none",
        margin: 0,
        padding: 0,
        display: "inline-block",
        width: font?.textAlign === "center" ? "100%" : "max-content",
        textShadow: shadow ? `0 ${shadowStrength}px ${shadowStrength * 2}px rgba(0, 0, 0, 0.3)` : "none",
        WebkitTextStroke: stroke ? `${strokeWidth}px ${strokeColor}` : "0px transparent",
        transition: "all 0.3s ease",
        ...font
    }

    const containerStyle: CSSProperties = {
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: font?.textAlign === "center" ? "center" : font?.textAlign === "right" ? "flex-end" : "flex-start",
        width: "100%",
        minHeight: "100%",
        position: "relative",
        backgroundColor: backgroundColor
    }

    return (
        <div style={containerStyle}>
            <h1 style={textStyle}>
                {text}
            </h1>
        </div>
    )
}

addPropertyControls(TextFill, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Design Beyond Boundaries."
    },
    fillType: {
        type: ControlType.Enum,
        title: "Fill Type",
        options: ["Image", "Gradient"],
        defaultValue: "Gradient",
        displaySegmentedControl: true
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Fill Image",
        hidden: ({ fillType }) => fillType !== "Image"
    },
    gradientColor1: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#FF6B6B",
        hidden: ({ fillType }) => fillType !== "Gradient"
    },
    gradientColor2: {
        type: ControlType.Color,
        title: "Gradient End", 
        defaultValue: "#4ECDC4",
        hidden: ({ fillType }) => fillType !== "Gradient"
    },
    gradientDirection: {
        type: ControlType.Enum,
        title: "Gradient Direction",
        options: ["To Right", "To Bottom", "Diagonal", "Radial"],
        defaultValue: "To Right",
        hidden: ({ fillType }) => fillType !== "Gradient"
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Text Shadow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow Strength",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        hidden: ({ shadow }) => !shadow
    },
    stroke: {
        type: ControlType.Boolean,
        title: "Text Stroke",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
        hidden: ({ stroke }) => !stroke
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 1,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "px",
        hidden: ({ stroke }) => !stroke
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "rgba(255, 255, 255, 0)",
        optional: true
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "72px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    }
})