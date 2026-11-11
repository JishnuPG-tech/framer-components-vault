import * as React from "react"
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

export default function NeonCard(props) {
    // 1. SAFE DEFAULTS
    const beam = {
        speed: 3,
        thickness: 3,
        glow: 20,
        ...(props.beamOptions || {}),
    }

    const colors = {
        beamColor: "#00FF00",
        cardColor: "#111111",
        ...(props.colorOptions || {}),
    }

    const layout = {
        radius: 24,
        padding: 40,
        ...(props.layoutOptions || {}),
    }

    // 2. CHECK IF CONTENT IS CONNECTED
    // We check if props.children has any items
    const isEmpty = React.Children.count(props.children) === 0

    return (
        <div
            style={{
                position: "relative",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                isolation: "isolate",
                borderRadius: layout.radius,
                minWidth: isEmpty ? 300 : "auto",
                minHeight: isEmpty ? 200 : "auto",
                backgroundColor: colors.cardColor,
            }}
        >
            {/* --- BEAM LAYER --- */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: layout.radius,
                    overflow: "hidden",
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        width: "250%",
                        height: "250%",
                        top: "-75%",
                        left: "-75%",
                        background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, ${colors.beamColor} 100%)`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: beam.speed,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {beam.glow > 0 && (
                    <motion.div
                        style={{
                            position: "absolute",
                            width: "250%",
                            height: "250%",
                            top: "-75%",
                            left: "-75%",
                            background: `conic-gradient(from 0deg, transparent 0%, transparent 60%, ${colors.beamColor} 100%)`,
                            filter: `blur(${beam.glow}px)`,
                            opacity: 0.6,
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: beam.speed,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                )}
            </div>

            {/* --- CONTENT LAYER --- */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    margin: beam.thickness,
                    backgroundColor: colors.cardColor,
                    borderRadius: layout.radius - 2,
                    padding: layout.padding,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexGrow: 1,
                    width: `calc(100% - ${beam.thickness * 2}px)`,
                    height: `calc(100% - ${beam.thickness * 2}px)`,
                }}
            >
                {isEmpty ? (
                    <div
                        style={{
                            color: "#888",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                            border: "2px dashed #333",
                            padding: "20px 40px",
                            borderRadius: 12,
                            pointerEvents: "none",
                        }}
                    >
                        Connect Content Layer
                    </div>
                ) : (
                    props.children
                )}
            </div>
        </div>
    )
}

addPropertyControls(NeonCard, {
    // 3. THIS BRINGS THE PURPLE DOT BACK
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },

    beamOptions: {
        type: ControlType.Object,
        title: "Beam Engine",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed (s)",
                defaultValue: 3,
                min: 0.5,
                max: 10,
                step: 0.1,
            },
            thickness: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 3,
                min: 1,
                max: 20,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow Blur",
                defaultValue: 20,
                min: 0,
                max: 100,
            },
        },
    },

    colorOptions: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            beamColor: {
                type: ControlType.Color,
                title: "Laser Color",
                defaultValue: "#00FF00",
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card Bg",
                defaultValue: "#111111",
            },
        },
    },

    layoutOptions: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 24,
                min: 0,
            },
            padding: {
                type: ControlType.Number,
                title: "Inner Pad",
                defaultValue: 40,
                min: 0,
            },
        },
    },
})
