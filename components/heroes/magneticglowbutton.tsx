import * as React from "react"
import { useRef, useState } from "react"
import { motion, useMotionValue, useMotionTemplate } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function MagneticGlowButton(props) {
    // 1. REACT REFERENCES: To track the mouse over this specific button
    const buttonRef = useRef(null)
    const [isHovered, setIsHovered] = useState(false)

    // 2. MOTION VALUES: Stores the live X and Y coordinates of the cursor
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // 3. THE TRACKING ENGINE: Updates the coordinates when the mouse moves
    function handlePointerMove(e) {
        if (!buttonRef.current) return
        // Calculates the mouse position relative to the top-left corner of the button
        const rect = buttonRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    return (
        <motion.div
            ref={buttonRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            // Trigger the tracking engine on mouse move
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
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
                boxShadow: props.showOuterGlow
                    ? `${props.glowOffsetX}px ${props.glowOffsetY}px ${props.glowBlur}px ${props.glowSpread}px ${props.outerGlowColor}`
                    : "none",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* ENGINE 1: The original auto-spinning light beam */}
            {props.animationStyle === "spin" && (
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
            )}

            {/* ENGINE 2: The new interactive cursor spotlight! */}
            {props.animationStyle === "spotlight" && (
                <motion.div
                    // Fades the light in only when the mouse enters the button
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        // Redraws the light live based on the mouseX and mouseY coordinates
                        background: useMotionTemplate`radial-gradient(${props.spotlightSize}px circle at ${mouseX}px ${mouseY}px, ${props.glowColor}, transparent 100%)`,
                        zIndex: 0,
                    }}
                />
            )}

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
MagneticGlowButton.defaultProps = {
    text: "Interactive Glow",
    glowColor: "#00F0FF",

    // NEW: Animation Type Defaults
    animationStyle: "spotlight",
    spinSpeed: 3,
    spotlightSize: 150, // How wide the "flashlight" beam is

    // Solid Mode Defaults
    innerColor: "#0D0D0D",

    // Glass Mode Defaults
    enableGlass: false,
    glassColor: "rgba(13, 13, 13, 0.4)",
    blurAmount: 24,

    // Advanced Outer Glow Defaults
    showOuterGlow: true,
    outerGlowColor: "rgba(0, 240, 255, 0.25)",
    glowOffsetX: 0,
    glowOffsetY: 15,
    glowBlur: 35,
    glowSpread: 0,

    textColor: "#FFFFFF",
    borderWidth: 1.5,
    radius: 100,
    paddingX: 32,
    paddingY: 16,

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
addPropertyControls(MagneticGlowButton, {
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

    // NEW: Interactive Animation Engine Switcher
    animationStyle: {
        type: ControlType.Enum,
        title: "Anim Style",
        options: ["spin", "spotlight"],
        optionTitles: ["Auto Spin", "Follow Cursor"],
    },
    glowColor: { type: ControlType.Color, title: "Border Glow" },
    // Hides Spin Speed if Spotlight is selected, hides Spotlight Size if Spin is selected!
    spinSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: 0.5,
        max: 10,
        step: 0.1,
        hidden(props) {
            return props.animationStyle === "spotlight"
        },
    },
    spotlightSize: {
        type: ControlType.Number,
        title: "Light Size",
        min: 50,
        max: 500,
        step: 10,
        hidden(props) {
            return props.animationStyle === "spin"
        },
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 1,
        max: 10,
        step: 0.5,
    },

    // Advanced Outer Glow Controls
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
