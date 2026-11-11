/**
 * Hover Text highlight
 *
 * A text component with animated hover effects such as background wipe or underline animation.
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

import * as React from "react"
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


function HoverTextHighlight(props) {
    const {
        text = "Hover Me",
        color = "#FFFFFF",
        effectColor = "#01A3FF",
        hoverStyle = "Background",
        wipeDirection = "leftToRight",
        font = {
            fontFamily: "Inter",
            fontSize: 64,
            fontWeight: 500,
            fontStyle: "normal",
            letterSpacing: 0,
            lineHeight: 1.2,
        },
        transition = { duration: 0.3, ease: "easeInOut" },
        textAlign = "center",
        underlineThickness = 8,
    } = props

    const isBackground = hoverStyle === "Background"
    const isLeftToRight = wipeDirection === "leftToRight"

    const origins = {
        background: {
            rest: isLeftToRight ? "bottom right" : "bottom left",
            hover: isLeftToRight ? "bottom left" : "bottom right",
        },
        underline: {
            rest: isLeftToRight ? "left center" : "right center",
            hover: isLeftToRight ? "left center" : "right center",
        },
    }

    const wipeVariants = {
        rest: {
            scaleX: 0,
            transformOrigin:
                origins[isBackground ? "background" : "underline"].rest,
            transition,
        },
        hover: {
            scaleX: 1,
            transformOrigin:
                origins[isBackground ? "background" : "underline"].hover,
            transition,
        },
    }

    const wipeStyle = isBackground
        ? {
              position: "absolute",
              inset: 0,
              background: effectColor,
              willChange: "transform",
              zIndex: 0,
          }
        : {
              position: "absolute",
              bottom: 0,
              left: 0,
              height: underlineThickness,
              width: "100%",
              backgroundColor: effectColor,
              willChange: "transform",
              zIndex: 1,
          }

    const textStyle = {
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        cursor: "pointer",
        color,
        textAlign,
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
        letterSpacing: font.letterSpacing,
        lineHeight: font.lineHeight,
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                width: "100%",
                textAlign,
            }}
        >
            <motion.div
                style={textStyle}
                initial="rest"
                animate="rest"
                whileHover="hover"
            >
                <motion.div style={wipeStyle} variants={wipeVariants} />
                <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
            </motion.div>
        </div>
    )
}

addPropertyControls(HoverTextHighlight, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover Me",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 64,
            fontWeight: 500,
            fontStyle: "normal",
            letterSpacing: 0,
            lineHeight: 1.2,
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    effectColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#01A3FF",
    },
    hoverStyle: {
        type: ControlType.Enum,
        title: "Hover Style",
        options: ["Background", "Underline"],
        optionTitles: ["Background", "Underline"],
        defaultValue: "Background",
    },
    wipeDirection: {
        type: ControlType.Enum,
        title: "Wipe Direction",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left → Right", "Right → Left"],
        defaultValue: "leftToRight",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { duration: 0.3, ease: "easeInOut" },
    },
    underlineThickness: {
        type: ControlType.Number,
        title: "Underline Thickness",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.hoverStyle !== "Underline"
        },
    },
})

/**
 * @framerDisableUnlink
 */

export default HoverTextHighlight
