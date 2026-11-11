import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function AdvancedHeroSwapper(props) {
    const {
        prefix,
        rotatingWords,
        wordSpacing, // NEW: Controls the gap
        staticColor,
        activeColor,
        font,
        textTransform,
        intervalTime,
        animationStyle,
    } = props

    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % rotatingWords.length)
        }, intervalTime * 1000)
        return () => clearInterval(timer)
    }, [rotatingWords, intervalTime])

    // Shared typography mapped to your Framer Font Picker
    const typographyStyle = {
        margin: 0,
        fontFamily: font.fontFamily || "Inter, sans-serif",
        fontSize: font.fontSize,
        fontWeight: font.fontWeight || 600,
        lineHeight: font.lineHeight,
        letterSpacing: font.letterSpacing,
        textTransform: textTransform,
        whiteSpace: "nowrap",
    }

    // --- THE 6 ANIMATION VARIANTS ---
    const getVariants = () => {
        switch (animationStyle) {
            case "3dRoll":
                return {
                    initial: { opacity: 0, rotateX: -90, y: 40, z: -50 },
                    animate: { opacity: 1, rotateX: 0, y: 0, z: 0 },
                    exit: { opacity: 0, rotateX: 90, y: -40, z: -50 },
                }
            case "softBlur":
                return {
                    initial: { opacity: 0, filter: "blur(12px)", y: 10 },
                    animate: { opacity: 1, filter: "blur(0px)", y: 0 },
                    exit: { opacity: 0, filter: "blur(12px)", y: -10 },
                }
            case "springSlide":
                return {
                    initial: { opacity: 0, y: "100%" },
                    animate: { opacity: 1, y: "0%" },
                    exit: { opacity: 0, y: "-100%" },
                }
            case "flipCard":
                return {
                    initial: { opacity: 0, rotateY: 90, scale: 0.9 },
                    animate: { opacity: 1, rotateY: 0, scale: 1 },
                    exit: { opacity: 0, rotateY: -90, scale: 0.9 },
                }
            case "scalePop":
                return {
                    initial: { opacity: 0, scale: 0.5 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 1.2 },
                }
            case "elasticDrop":
                return {
                    initial: { opacity: 0, y: -60, scaleY: 1.5 },
                    animate: { opacity: 1, y: 0, scaleY: 1 },
                    exit: { opacity: 0, y: 60, scaleY: 0.5 },
                }
            default:
                return {
                    initial: { opacity: 0, rotateX: -90, y: 40 },
                    animate: { opacity: 1, rotateX: 0, y: 0 },
                    exit: { opacity: 0, rotateX: 90, y: -40 },
                }
        }
    }

    // Find the longest word to keep the container width perfectly stable
    const longestWord = rotatingWords.reduce(
        (a, b) => (a.length > b.length ? a : b),
        ""
    )

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                justifyContent: font.textAlign || "center",
                alignItems: "center",
                // Dynamically applying the spacing property here
                gap: `${wordSpacing}em`,
                perspective: 1200,
            }}
        >
            {/* The Static Prefix (e.g., "We build") */}
            {prefix && (
                <div style={{ ...typographyStyle, color: staticColor }}>
                    {prefix}
                </div>
            )}

            {/* The Animated Word Container */}
            <div
                style={{
                    position: "relative",
                    display: "inline-flex",
                    transformStyle: "preserve-3d",
                }}
            >
                <AnimatePresence>
                    <motion.div
                        key={index}
                        variants={getVariants()}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 16,
                            mass: 0.8,
                        }}
                        style={{
                            ...typographyStyle,
                            color: activeColor,
                            transformOrigin: "center center",
                            position: "absolute",
                            left: 0,
                            top: 0,
                        }}
                    >
                        {rotatingWords[index]}
                    </motion.div>
                </AnimatePresence>

                {/* Invisible spacer */}
                <div
                    style={{
                        ...typographyStyle,
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                >
                    {longestWord}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(AdvancedHeroSwapper, {
    prefix: {
        type: ControlType.String,
        defaultValue: "We engineer",
        title: "Static Prefix",
    },
    rotatingWords: {
        type: ControlType.Array,
        control: { type: ControlType.String },
        defaultValue: ["Experiences", "Systems", "Interfaces", "Platforms"],
        title: "Rotating Words",
    },

    // --- NEW SPACING CONTROL ---
    wordSpacing: {
        type: ControlType.Number,
        defaultValue: 0.25,
        min: 0,
        max: 2,
        step: 0.05,
        title: "Spacing (em)",
    },

    animationStyle: {
        type: ControlType.Enum,
        options: [
            "3dRoll",
            "softBlur",
            "springSlide",
            "flipCard",
            "scalePop",
            "elasticDrop",
        ],
        optionTitles: [
            "1. True 3D Roll",
            "2. Soft Blur Crossfade",
            "3. Spring Slide",
            "4. Perspective Flip",
            "5. Scale & Pop",
            "6. Elastic Drop",
        ],
        defaultValue: "3dRoll",
        title: "Animation",
    },

    intervalTime: {
        type: ControlType.Number,
        defaultValue: 2.5,
        min: 1,
        max: 10,
        step: 0.1,
        title: "Swap Time (s)",
    },
    staticColor: {
        type: ControlType.Color,
        defaultValue: "#A1A1AA",
        title: "Static Color",
    },
    activeColor: {
        type: ControlType.Color,
        defaultValue: "#18181B",
        title: "Active Color",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontSize: 72,
            lineHeight: "1.1em",
            letterSpacing: "-2px",
            textAlign: "center",
        },
    },
    textTransform: {
        type: ControlType.Enum,
        options: ["none", "uppercase", "lowercase"],
        optionTitles: ["Normal", "UPPERCASE", "lowercase"],
        defaultValue: "none",
        title: "Transform",
    },
})
