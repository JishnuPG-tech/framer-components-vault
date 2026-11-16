// Luminous Button
import { motion } from "framer-motion"
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

interface LuminousButtonProps {
    label: string
    link: string
    backgroundColor: string
    textColor: string
    glowColor: string
    glowIntensity: number
    borderRadius: number
    font: CSSProperties
    onClick?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LuminousButton(props: LuminousButtonProps) {
    const {
        label,
        link,
        backgroundColor,
        textColor,
        glowColor,
        glowIntensity,
        borderRadius,
        font,
        onClick,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    return (
        <motion.button
            style={{
                ...style,
                position: "relative",
                backgroundColor,
                color: textColor,
                border: "none",
                borderRadius,
                padding: "16px 32px",
                cursor: "pointer",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...font,
                ...(isFixedWidth ? {} : { width: "max-content" }),
                ...(isFixedHeight ? {} : { height: "max-content" }),
                boxShadow: `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${glowColor}`,
            }}
            onClick={() => {
                if (link && typeof window !== "undefined") {
                    window.open(link, "_blank")
                }
                onClick?.()
            }}
            whileHover={
                isStatic
                    ? undefined
                    : {
                          scale: 1.05,
                          boxShadow: `0 0 ${glowIntensity * 1.5}px ${glowColor}, 0 0 ${glowIntensity * 3}px ${glowColor}`,
                      }
            }
            whileTap={
                isStatic
                    ? undefined
                    : {
                          scale: 0.95,
                      }
            }
            transition={{
                duration: 0.2,
            }}
        >
            <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
        </motion.button>
    )
}

addPropertyControls(LuminousButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Click Me",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#0099FF",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    onClick: {
        type: ControlType.EventHandler,
    },
})
