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


export default function PremiumGlowButton(props) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
                position: "relative",
                padding: props.borderWidth,
                borderRadius: props.radius,
                overflow: "hidden",
                cursor: "pointer",
                width: "max-content",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                // THE UPGRADE: Fully dynamic shadow engine powered by the new props
                boxShadow: props.showOuterGlow
                    ? `${props.glowOffsetX}px ${props.glowOffsetY}px ${props.glowBlur}px ${props.glowSpread}px ${props.outerGlowColor}`
                    : "none",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* THE ENGINE: Centered spinning gradient */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    duration: props.spinSpeed,
                    ease: "linear",
                }}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    x: "-50%",
                    y: "-50%",
                    width: 2000,
                    height: 2000,
                    background: `conic-gradient(from 0deg, transparent 0%, ${props.glowColor} 20%, transparent 50%)`,
                    zIndex: 0,
                }}
            />

            {/* THE CORE: Glassmorphism and Solid Logic */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    background: props.enableGlass
                        ? props.glassColor
                        : props.innerColor,
                    backdropFilter: props.enableGlass
                        ? `blur(${props.blurAmount}px)`
                        : "none",
                    WebkitBackdropFilter: props.enableGlass
                        ? `blur(${props.blurAmount}px)`
                        : "none",
                    borderRadius: props.radius - props.borderWidth,
                    padding: `${props.paddingY}px ${props.paddingX}px`,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        ...props.font,
                        color: props.textColor,
                        whiteSpace: "nowrap",
                    }}
                >
                    {props.text}
                </span>
            </div>
        </motion.div>
    )
}

// Default States
PremiumGlowButton.defaultProps = {
    text: "Timeless Design",
    glowColor: "#00F0FF",
    spinSpeed: 3,

    // Solid Mode Defaults
    innerColor: "#0D0D0D",

    // Glass Mode Defaults
    enableGlass: false,
    glassColor: "rgba(13, 13, 13, 0.4)",
    blurAmount: 24,

    // NEW: Advanced Outer Glow Defaults
    showOuterGlow: true,
    outerGlowColor: "rgba(0, 240, 255, 0.25)", // Cyan with 25% opacity
    glowOffsetX: 0,
    glowOffsetY: 15, // Casts the light downwards
    glowBlur: 35, // Wide, soft spread
    glowSpread: 0,

    textColor: "#FFFFFF",
    borderWidth: 1.5,
    radius: 100,
    paddingX: 32,
    paddingY: 16,

    // Native Font Defaults
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: 0,
        lineHeight: "1.5em",
        textAlign: "center",
    },
}

// The UI Settings Panel
addPropertyControls(PremiumGlowButton, {
    text: { type: ControlType.String, title: "Text" },
    font: { type: ControlType.Font, controls: "extended", title: "Typography" },
    textColor: { type: ControlType.Color, title: "Text Color" },

    // Inner Button Styling
    enableGlass: { type: ControlType.Boolean, title: "Use Glass" },
    innerColor: {
        type: ControlType.Color,
        title: "Solid Fill",
        hidden(props) {
            return props.enableGlass === true
        },
    },
    glassColor: {
        type: ControlType.Color,
        title: "Glass Fill",
        hidden(props) {
            return props.enableGlass === false
        },
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Glass Blur",
        min: 0,
        max: 100,
        hidden(props) {
            return props.enableGlass === false
        },
    },

    // Border Glow Engine
    glowColor: { type: ControlType.Color, title: "Border Glow" },
    spinSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: 0.5,
        max: 10,
        step: 0.1,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 1,
        max: 10,
        step: 0.5,
    },

    // NEW: Advanced Outer Glow Controls
    showOuterGlow: { type: ControlType.Boolean, title: "Outer Glow" },
    outerGlowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        hidden(props) {
            return props.showOuterGlow === false
        },
    },
    glowOffsetX: {
        type: ControlType.Number,
        title: "Offset X",
        min: -50,
        max: 50,
        hidden(props) {
            return props.showOuterGlow === false
        },
    },
    glowOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        min: -50,
        max: 50,
        hidden(props) {
            return props.showOuterGlow === false
        },
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 100,
        hidden(props) {
            return props.showOuterGlow === false
        },
    },
    glowSpread: {
        type: ControlType.Number,
        title: "Spread",
        min: -50,
        max: 50,
        hidden(props) {
            return props.showOuterGlow === false
        },
    },

    // Structure
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 100 },
    paddingX: { type: ControlType.Number, title: "Pad X", min: 0, max: 100 },
    paddingY: { type: ControlType.Number, title: "Pad Y", min: 0, max: 100 },
})
