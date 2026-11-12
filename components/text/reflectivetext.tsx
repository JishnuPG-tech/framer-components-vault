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


/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ReflectiveText(props) {
    const {
        text,
        font,
        color,
        reflectionOpacity,
        reflectionGap,
        reflectionLength,
        style,
    } = props

    const containerStyle: React.CSSProperties = {
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible", // Critical to show the reflection
    }

    const textStyle: React.CSSProperties = {
        ...font,
        color: color,
        margin: 0,
        padding: 0,
        lineHeight: "1em",
        whiteSpace: "pre",
        // The magic reflection property
        WebkitBoxReflect: `below ${reflectionGap}px linear-gradient(transparent, rgba(0,0,0,${reflectionOpacity * 0.1}) ${reflectionLength}%)`,
    }

    return (
        <div style={containerStyle}>
            <h1 style={textStyle}>{text}</h1>
        </div>
    )
}

ReflectiveText.defaultProps = {
    text: "Nature",
    color: "#FFFFFF",
    reflectionOpacity: 5,
    reflectionGap: -10,
    reflectionLength: 80,
    font: {
        family: "Inter",
        size: 80,
        weight: 700,
        letterSpacing: "-0.02em",
    },
}

addPropertyControls(ReflectiveText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Nature",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        title: "Typography",
    },
    reflectionGap: {
        type: ControlType.Number,
        title: "Gap",
        min: -100,
        max: 100,
        displayStepper: true,
        defaultValue: -10,
    },
    reflectionOpacity: {
        type: ControlType.Number,
        title: "Reflection",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 5,
    },
    reflectionLength: {
        type: ControlType.Number,
        title: "Length",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 80,
    },
})
