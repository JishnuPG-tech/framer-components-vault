// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface RotatingBorderProps {
    width?: number
    height?: number
    borderColor?: string
    animationDuration?: number
    blurRadius?: number
    borderRadius?: number
    backgroundColor?: string
    overlayBorderColor?: string
    overlayMargin?: number
    text?: string
    textColor?: string
    fontSize?: number
    fontWeight?: number
    fontFamily?: string
    letterSpacing?: number
    children?: React.ReactNode
}

export default function ConicGradientAnimation({
    width,
    height,
    borderColor = "#ff00ff",
    animationDuration = 6,
    blurRadius = 2,
    borderRadius = 0,
    backgroundColor = "rgba(255, 255, 255, 0.1)",
    overlayBorderColor = "#ff00ff",
    overlayMargin = 1,
    text = "Rotating Border",
    textColor = "#000000",
    fontSize = 16,
    fontWeight = 400,
    fontFamily = "Inter",
    letterSpacing = 0,
    children,
}: RotatingBorderProps) {
    return (
        <div
            style={{
                width: width || "100%",
                height: height || "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
                minWidth: "12px",
                minHeight: "12px",
            }}
        >
            {/* Rotating border using simplified Framer Motion with infinite height */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "-450%",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "1000%",
                    background: `conic-gradient(transparent 200deg, ${borderColor})`,
                    borderRadius: `${borderRadius}px`,
                    zIndex: 1,
                }}
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: animationDuration,
                    ease: "linear",
                    repeat: Infinity,
                    repeatDelay: 0,
                }}
            />

            {/* Combined blurred overlay with border */}
            <div
                style={{
                    position: "absolute",
                    top: `${overlayMargin}px`,
                    left: `${overlayMargin}px`,
                    right: `${overlayMargin}px`,
                    bottom: `${overlayMargin}px`,
                    backdropFilter: `blur(${blurRadius}px)`,
                    backgroundColor: backgroundColor,
                    border: `1px solid ${overlayBorderColor}`,
                    borderRadius: `${Math.max(0, borderRadius - overlayMargin)}px`,
                    zIndex: 2,
                    pointerEvents: "none",
                }}
            />

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 3,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                }}
            >
                <div
                    style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        fontWeight: fontWeight,
                        fontFamily: fontFamily,
                        letterSpacing: `${letterSpacing}px`,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        userSelect: "none",
                    }}
                >
                    {text}
                </div>
                {children}
            </div>
        </div>
    )
}

// Property controls for Framer
addPropertyControls(ConicGradientAnimation, {
    // Animation Controls
    borderColor: {
        type: ControlType.Color,
        title: "Conic Color",
        defaultValue: "#ff00ff",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration (seconds)",
        defaultValue: 6,
        min: 0.5,
        max: 20,
        step: 0.1,
    },
    overlayMargin: {
        type: ControlType.Number,
        title: "Animation Margin",
        defaultValue: 1,
        min: 1,
        max: 4,
        step: 1,
    },

    // Visual Effects
    blurRadius: {
        type: ControlType.Number,
        title: "Blur Radius",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    overlayBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#ff00ff",
    },

    // Content
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Rotating Border",
    },

    // Typography
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 8,
        max: 72,
        step: 1,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 400,
        min: 100,
        max: 900,
        step: 100,
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font Family",
        defaultValue: "Inter",
        options: [
            "Inter",
            "Arial",
            "Helvetica",
            "Times New Roman",
            "Georgia",
            "Verdana",
            "Roboto",
            "Open Sans",
            "Lato",
            "Poppins",
            "Montserrat",
            "Source Sans Pro",
        ],
        optionTitles: [
            "Inter",
            "Arial",
            "Helvetica",
            "Times New Roman",
            "Georgia",
            "Verdana",
            "Roboto",
            "Open Sans",
            "Lato",
            "Poppins",
            "Montserrat",
            "Source Sans Pro",
        ],
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -2,
        max: 10,
        step: 0.1,
    },
    children: {
        type: ControlType.ComponentInstance,
        title: "External Content",
        description: "Link to child element when text content isn't used",
    },
})
