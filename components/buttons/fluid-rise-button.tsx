// Liquid fill button
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

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition, type CSSProperties } from "react"

interface LiquidFillButtonProps {
    text: string
    link: string
    backgroundColor: string
    fillColor: string
    textColor: string
    fillTextColor: string
    borderRadius: number
    borderWidth: number
    borderColor: string
    font: CSSProperties
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LiquidFillButton(props: LiquidFillButtonProps) {
    const {
        text,
        link,
        backgroundColor,
        fillColor,
        textColor,
        fillTextColor,
        borderRadius,
        borderWidth,
        borderColor,
        font,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const isPreview = RenderTarget.current() === RenderTarget.preview
    const isActive = isPreview && isHovered

    const staticRender =
        RenderTarget.current() === RenderTarget.canvas ||
        RenderTarget.current() === RenderTarget.thumbnail

    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    return (
        <a
            href={link}
            style={{
                textDecoration: "none",
                display: "inline-block",
                ...(isFixedWidth ? { width: "100%" } : {}),
                ...(isFixedHeight ? { height: "100%" } : {}),
            }}
        >
            <motion.button
                style={{
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor,
                    border: `${borderWidth}px solid ${borderColor}`,
                    cursor: "pointer",
                    padding: "16px 32px",
                    borderRadius,
                    color: textColor,
                    ...font,
                    ...(isFixedWidth
                        ? { width: "100%" }
                        : { minWidth: "max-content" }),
                    ...(isFixedHeight ? { height: "100%" } : {}),
                }}
                animate={{
                    color: isActive ? fillTextColor : textColor,
                    backgroundColor: staticRender
                        ? backgroundColor
                        : backgroundColor,
                    borderColor: staticRender ? borderColor : borderColor,
                }}
                transition={
                    staticRender
                        ? { duration: 0 }
                        : {
                              color: {
                                  duration: 0.3,
                                  delay: 0.2,
                                  ease: "easeInOut",
                              },
                              backgroundColor: {
                                  duration: 0.3,
                                  ease: "easeInOut",
                              },
                              borderColor: { duration: 0.3, ease: "easeInOut" },
                          }
                }
                onMouseEnter={() => startTransition(() => setIsHovered(true))}
                onMouseLeave={() => startTransition(() => setIsHovered(false))}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: fillColor,
                        zIndex: 0,
                    }}
                    initial={{ height: "0%" }}
                    animate={{ height: isActive ? "100%" : "0%" }}
                    transition={{
                        duration: staticRender ? 0 : 0.6,
                        ease: [0.43, 0.13, 0.23, 0.96],
                    }}
                />
                <motion.span
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "block",
                    }}
                    animate={{
                        color: staticRender
                            ? textColor
                            : isActive
                              ? fillTextColor
                              : textColor,
                    }}
                    transition={
                        staticRender
                            ? { duration: 0 }
                            : { duration: 0.3, ease: "easeInOut" }
                    }
                >
                    {text}
                </motion.span>
            </motion.button>
        </a>
    )
}

addPropertyControls(LiquidFillButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover Me",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    fillTextColor: {
        type: ControlType.Color,
        title: "Fill Text Color",
        defaultValue: "#FFFFFF",
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
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
