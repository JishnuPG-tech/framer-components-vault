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
import { useState } from "react"

/**
 * 3D Button Component
 * A button with a layered 3D effect and press animation
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 140
 * @framerIntrinsicHeight 60
 */
export default function ThreeDButton(props) {
    const {
        text,
        topColor,
        middleColor,
        shadowColor,
        outlineColor,
        textColor,
        borderRadius,
        font,
        link,
        openInNewTab,
        onTap,
        style,
    } = props

    const [isPressed, setIsPressed] = useState(false)

    const handleClick = () => {
        if (link) {
            if (openInNewTab) {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = link
            }
        }
        onTap?.()
    }

    return (
        <motion.button
            type="button"
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                background: "none",
                outline: "none",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onClick={handleClick}
            onTap={handleClick}
        >
            {/* Shadow layer */}
            <div
                style={{
                    position: "absolute",
                    width: "calc(100% + 2px)",
                    height: "100%",
                    background: shadowColor,
                    top: 14,
                    left: -1,
                    borderRadius: `${borderRadius}px`,
                    outline: `2px solid ${outlineColor}`,
                    zIndex: -1,
                }}
            />

            {/* Middle layer (bottom visible) */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    background: middleColor,
                    top: 10,
                    left: 0,
                    borderRadius: `${borderRadius}px`,
                    outline: `2px solid ${outlineColor}`,
                    zIndex: 0,
                }}
            >
                {/* Left line decoration */}
                <div
                    style={{
                        position: "absolute",
                        width: 2,
                        height: 9,
                        background: outlineColor,
                        bottom: 0,
                        left: "15%",
                    }}
                />
                {/* Right line decoration */}
                <div
                    style={{
                        position: "absolute",
                        width: 2,
                        height: 9,
                        background: outlineColor,
                        bottom: 0,
                        left: "85%",
                    }}
                />
            </div>

            {/* Top layer (button face) */}
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    background: topColor,
                    color: textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: `${borderRadius}px`,
                    outline: `2px solid ${outlineColor}`,
                    position: "relative",
                    overflow: "hidden",
                    zIndex: 1,
                    paddingTop: "12px",
                    paddingRight: "20px",
                    paddingBottom: "12px",
                    paddingLeft: "20px",
                    // Spread all font properties from the Font control
                    ...font,
                }}
                animate={{
                    y: isPressed ? 10 : 0,
                }}
                transition={{ duration: 0.2 }}
            >
                {/* Shine effect */}
                <motion.div
                    style={{
                        position: "absolute",
                        width: 15,
                        height: "100%",
                        background: "rgba(0, 0, 0, 0.1)",
                        transform: "skewX(30deg)",
                        zIndex: 2,
                    }}
                    animate={{
                        left: isPressed ? "calc(100% + 20px)" : -20,
                    }}
                    transition={{ duration: 0.25 }}
                />
                <span style={{ position: "relative", zIndex: 3 }}>{text}</span>
            </motion.div>
        </motion.button>
    )
}

ThreeDButton.defaultProps = {
    text: "Click Me!",
    topColor: "#FF3838",
    middleColor: "#F06262",
    shadowColor: "#8C8C8C",
    outlineColor: "#000000",
    textColor: "#FFFFFF",
    borderRadius: 32,
    link: "",
    openInNewTab: true,
    font: {
        family: "DM Mono",
        size: 24,
        weight: "Regular",
        lineHeight: "1.5em",
        letterSpacing: "0em",
        textAlign: "center",
    },
}

addPropertyControls(ThreeDButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Click Me!",
    },
    link: {
        type: ControlType.String,
        title: "Link",
        placeholder: "https://example.com",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    topColor: {
        type: ControlType.Color,
        title: "Top Color",
        defaultValue: "#FF3838",
    },
    middleColor: {
        type: ControlType.Color,
        title: "Middle Color",
        defaultValue: "#F06262",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#8C8C8C",
    },
    outlineColor: {
        type: ControlType.Color,
        title: "Outline Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 32,
        step: 1,
        defaultValue: 32,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: ThreeDButton.defaultProps.font,
    },
    onTap: {
        type: ControlType.EventHandler,
    },
    bottomEdgeColor: {
        type: ControlType.Color,
        title: "Bottom Edge Color",
        defaultValue: "#141001",
        description:
            "Follow [Rayan Yasser](https://x.com/rayanyasserouan) for more components",
    },
})
