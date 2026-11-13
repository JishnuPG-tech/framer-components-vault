// Blur-to-Focus Button Component for Framer
// Text starts slightly blurred and snaps into sharp focus on hover with background color transition

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, type CSSProperties } from "react"

interface BlurToFocusButtonProps {
    text: string
    link: string
    defaultBackgroundColor: string
    hoverBackgroundColor: string
    defaultTextColor: string
    hoverTextColor: string
    font: CSSProperties
    verticalPadding: number
    horizontalPadding: number
    borderRadius: number
    defaultBlurIntensity: number
    focusTransitionDuration: number
    colorTransitionDuration: number
    enableScale: boolean
    scaleAmount: number
    enableHoverBackground: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function BlurToFocusButton(props: BlurToFocusButtonProps) {
    const {
        text,
        link,
        defaultBackgroundColor,
        hoverBackgroundColor,
        defaultTextColor,
        hoverTextColor,
        font,
        verticalPadding,
        horizontalPadding,
        borderRadius,
        defaultBlurIntensity,
        focusTransitionDuration,
        colorTransitionDuration,
        enableScale,
        scaleAmount,
        enableHoverBackground,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const buttonStyle: CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding,
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        borderRadius,
        backgroundColor: enableHoverBackground && isHovered ? hoverBackgroundColor : defaultBackgroundColor,
        transition: `background-color ${colorTransitionDuration}s ease-out`,
        cursor: "pointer",
        border: "none",
        outline: "none",
        overflow: "hidden",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
    }

    const textStyle: CSSProperties = {
        ...font,
        color: isHovered ? hoverTextColor : defaultTextColor,
        filter: `blur(${isHovered ? 0 : defaultBlurIntensity}px)`,
        transform: enableScale && isHovered ? `scale(${scaleAmount})` : "scale(1)",
        transition: `
            filter ${focusTransitionDuration}s ease-out,
            color ${colorTransitionDuration}s ease-out,
            transform ${focusTransitionDuration}s ease-out
        `,
        willChange: "filter",
        margin: 0,
        padding: 0,
        whiteSpace: "nowrap",
    }

    return (
        <a
            href={link}
            style={{ textDecoration: "none", display: "inline-block" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={buttonStyle}>
                <span style={textStyle}>{text}</span>
            </div>
        </a>
    )
}

addPropertyControls(BlurToFocusButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover to Focus",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    defaultBackgroundColor: {
        type: ControlType.Color,
        title: "Default BG",
        defaultValue: "#000000",
    },
    enableHoverBackground: {
        type: ControlType.Boolean,
        title: "Hover BG Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#0099FF",
        hidden: ({ enableHoverBackground }) => !enableHoverBackground,
    },
    defaultTextColor: {
        type: ControlType.Color,
        title: "Default Text",
        defaultValue: "#FFFFFF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "Vertical Padding",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Horizontal Padding",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    defaultBlurIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 2,
        min: 0,
        max: 5,
        step: 0.5,
        unit: "px",
        displayStepper: true,
    },
    focusTransitionDuration: {
        type: ControlType.Number,
        title: "Focus Duration",
        defaultValue: 0.4,
        min: 0.2,
        max: 0.8,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    colorTransitionDuration: {
        type: ControlType.Number,
        title: "Color Duration",
        defaultValue: 0.3,
        min: 0.3,
        max: 0.6,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    enableScale: {
        type: ControlType.Boolean,
        title: "Scale Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scaleAmount: {
        type: ControlType.Number,
        title: "Scale Amount",
        defaultValue: 1.02,
        min: 1,
        max: 1.1,
        step: 0.01,
        displayStepper: true,
        hidden: ({ enableScale }) => !enableScale,
    },
})