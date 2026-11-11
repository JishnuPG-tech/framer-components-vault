import React from "react"
const { addPropertyControls, ControlType } =
    typeof window !== "undefined" && (window as any).Framer
        ? (window as any).Framer
        : { addPropertyControls: () => {}, ControlType: {} }

import { motion } from "framer-motion"

/**
 * AMBIENT BACKGROUND
 *
 * A port of the SwiftUI ambient gradient effect.
 * It features three moving blobs that infinitely loop back and forth.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AmbientBackground(props) {
    const {
        baseColor,
        color1,
        color2,
        color3,
        blurAmount,
        speedMultiplier,
        overlayOpacity,
        colorDuration,
    } = props

    return (
        <div
            style={{
                ...containerStyle,
                backgroundColor: baseColor,
            }}
        >
            {/* BLOB 1 (Teal/Blue Equivalent) */}
            <motion.div
                style={{
                    ...blobStyle,
                    backgroundColor: color1,
                    width: "80%",
                    height: "80%",
                    top: "10%",
                    left: "10%",
                }}
                animate={{
                    x: [-30, 30],
                    y: [-30, 30],
                    scale: [1, 1.1],
                    backgroundColor: [color1, color2, color3],
                }}
                transition={{
                    default: {
                        duration: 7 * speedMultiplier,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    },
                    backgroundColor: {
                        duration: colorDuration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    },
                }}
            />

            {/* BLOB 2 (Purple/Pink Equivalent) */}
            <motion.div
                style={{
                    ...blobStyle,
                    backgroundColor: color2,
                    width: "70%",
                    height: "70%",
                    top: "15%",
                    right: "15%",
                }}
                animate={{
                    x: [50, -50],
                    y: [100, -20],
                    backgroundColor: [color2, color3, color1],
                }}
                transition={{
                    default: {
                        duration: 5 * speedMultiplier,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    },
                    backgroundColor: {
                        duration: colorDuration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    },
                }}
            />

            {/* BLOB 3 (Cyan Equivalent) */}
            <motion.div
                style={{
                    ...blobStyle,
                    backgroundColor: color3,
                    width: "60%",
                    height: "60%",
                    bottom: "10%",
                    left: "20%",
                }}
                animate={{
                    x: [-20, 80],
                    y: [100, 50],
                    backgroundColor: [color3, color1, color2],
                }}
                transition={{
                    default: {
                        duration: 6 * speedMultiplier,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    },
                    backgroundColor: {
                        duration: colorDuration,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    },
                }}
            />

            {/* BLUR LAYER - Applies the blur to the blobs behind it using backdrop-filter */}
            <div
                style={{
                    ...overlayStyle,
                    backdropFilter: `blur(${blurAmount}px)`,
                    WebkitBackdropFilter: `blur(${blurAmount}px)`, // Safari support
                    pointerEvents: "none",
                }}
            />

            {/* GLASS OVERLAY (Texture/Tint) - Adds a subtle white tint for the 'material' look */}
            <div
                style={{
                    ...overlayStyle,
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    opacity: overlayOpacity,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// STYLES
const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    isolation: "isolate",
}

const blobStyle: React.CSSProperties = {
    position: "absolute",
    borderRadius: "50%",
    opacity: 0.6, // Base opacity for blending
}

const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 10,
}

// DEFAULT PROPS
AmbientBackground.defaultProps = {
    baseColor: "#ffffff",
    color1: "rgba(0, 122, 255, 0.4)", // Blue
    color2: "rgba(175, 82, 222, 0.3)", // Purple
    color3: "rgba(50, 173, 230, 0.3)", // Cyan
    blurAmount: 60,
    speedMultiplier: 1,
    overlayOpacity: 0.1,
    colorDuration: 10,
}

// PROPERTY CONTROLS
addPropertyControls(AmbientBackground, {
    baseColor: {
        type: ControlType.Color,
        title: "Base",
    },
    color1: {
        type: ControlType.Color,
        title: "Blob 1",
    },
    color2: {
        type: ControlType.Color,
        title: "Blob 2",
    },
    color3: {
        type: ControlType.Color,
        title: "Blob 3",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Radius",
        defaultValue: 60,
        displayStepper: false,
        description: "Max recommended: 100",
    },
    speedMultiplier: {
        type: ControlType.Number,
        title: "Speed Multiplier",
        defaultValue: 1,
        displayStepper: false,
        description: "Multiplier (e.g. 1.0)",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: false,
        description: "Opacity (0 - 1)",
    },
    colorDuration: {
        type: ControlType.Number,
        title: "Color Cycle",
        defaultValue: 10,
        displayStepper: false,
        description: "Duration in seconds",
    },
})
