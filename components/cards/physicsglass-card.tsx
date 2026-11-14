import React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * PHYSICGLASS CARD
 * Optimized for full-bleed images and padded text content.
 */

export default function PhysicGlassCard(props) {
    const {
        title,
        subtitle,
        backgroundImage,
        overlayColor,
        overlayOpacity,
        glassBlur,
        edgeIntensity,
        lightIntensity,
        titleFont,
        subtitleFont,
        padding,
    } = props

    // Mouse Tracking Logic
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const springConfig = { damping: 35, stiffness: 120, mass: 1 }
    const mouseXSpring = useSpring(x, springConfig)
    const mouseYSpring = useSpring(y, springConfig)

    // Transforms
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [8, -8])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-8, 8])

    const lightX = useTransform(mouseXSpring, [-0.5, 0.5], ["30%", "70%"])
    const lightY = useTransform(mouseYSpring, [-0.5, 0.5], ["30%", "70%"])

    const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], [15, -15])
    const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], [20, -20])

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                x.set(0)
                y.set(0)
            }}
            style={{
                width: "100%",
                height: "100%",
                perspective: 1200,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <motion.div
                style={{
                    width: 320,
                    height: 440,
                    borderRadius: 32,
                    rotateX,
                    rotateY,
                    boxShadow: useTransform(
                        [shadowX, shadowY],
                        (v) => `${v}px ${v}px 50px rgba(0,0,0,0.3)`
                    ),
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end", // Text pinned to bottom
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: `${edgeIntensity}px solid rgba(255, 255, 255, 0.15)`,
                }}
            >
                {/* BACKGROUND LAYERS (No Padding) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backdropFilter: `blur(${glassBlur}px)`,
                        zIndex: 0,
                    }}
                />

                <motion.div
                    style={{
                        position: "absolute",
                        inset: -20, // Negative inset for parallax bleed
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        x: useTransform(mouseXSpring, [-0.5, 0.5], [8, -8]),
                        y: useTransform(mouseYSpring, [-0.5, 0.5], [8, -8]),
                        zIndex: 1,
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: overlayColor,
                        opacity: overlayOpacity,
                        zIndex: 2,
                    }}
                />

                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: useTransform(
                            [lightX, lightY],
                            ([lx, ly]) =>
                                `radial-gradient(circle at ${lx} ${ly}, rgba(255,255,255,${lightIntensity}) 0%, transparent 70%)`
                        ),
                        zIndex: 3,
                        mixBlendMode: "soft-light",
                    }}
                />

                {/* TEXT CONTENT WRAPPER (This is where Padding lives) */}
                <div
                    style={{
                        zIndex: 5,
                        position: "relative",
                        paddingTop: padding?.top ?? 32,
                        paddingRight: padding?.right ?? 32,
                        paddingBottom: padding?.bottom ?? 32,
                        paddingLeft: padding?.left ?? 32,
                    }}
                >
                    <h2 style={{ color: "white", margin: 0, ...titleFont }}>
                        {title}
                    </h2>
                    <p
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            margin: "8px 0 0 0",
                            ...subtitleFont,
                        }}
                    >
                        {subtitle}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}

PhysicGlassCard.defaultProps = {
    title: "Minimal Glass",
    subtitle: "Tactile Design",
    padding: { top: 32, right: 32, bottom: 32, left: 32 },
    backgroundImage: "https://unsplash.com",
    overlayColor: "#000",
    overlayOpacity: 0.5,
    glassBlur: 25,
    edgeIntensity: 1,
    lightIntensity: 0.15,
    titleFont: {
        fontFamily: "Inter",
        fontSize: 28,
        fontWeight: 800,
        lineHeight: "1.2em",
    },
    subtitleFont: {
        fontFamily: "Inter",
        fontSize: 15,
        fontWeight: 400,
        lineHeight: "1.4em",
    },
}

addPropertyControls(PhysicGlassCard, {
    title: { type: ControlType.String, title: "Title Text" },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
    },
    subtitle: { type: ControlType.String, title: "Subtitle Text" },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
    },
    padding: {
        type: ControlType.FusedNumber,
        title: "Text Padding",
        toggle: true,
    },
    backgroundImage: { type: ControlType.Image, title: "Image" },
    overlayColor: { type: ControlType.Color, title: "Overlay Color" },
    overlayOpacity: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.1,
        display: "slider",
    },
    lightIntensity: {
        type: ControlType.Number,
        min: 0,
        max: 0.5,
        step: 0.01,
        display: "slider",
        title: "Reflection",
    },
    glassBlur: { type: ControlType.Number, min: 0, max: 50, title: "Blur" },
    edgeIntensity: {
        type: ControlType.Number,
        min: 0,
        max: 3,
        step: 0.1,
        title: "Bezel",
    },
})
