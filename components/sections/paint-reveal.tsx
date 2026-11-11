/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 150
 * @framerIntrinsicHeight 150
 */

import React, { useState, useRef, useMemo } from "react"
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


/**
 * PAINT REVEAL COMPONENT
 * Interactive paint-to-reveal effect with custom brush strokes that fade away.
 * Mobile: Double-tap to toggle paint mode, allows scrolling when inactive.
 */
export default function Paint_Reveal(props) {
    const {
        baseImage,
        revealImage,
        brushTexture,
        brushSize,
        fadeDuration,
        maxStamps,
        showIndicator,
        indicatorText,
        indicatorColor,
        borderRadius,
    } = props

    const [stamps, setStamps] = useState([])
    const [isPaintMode, setIsPaintMode] = useState(false)
    const containerRef = useRef(null)
    const idCounter = useRef(0)
    const lastTapRef = useRef(0)
    const maskId = useMemo(
        () => "paint-mask-" + Math.random().toString(36).substr(2, 9),
        []
    )

    // Calculate responsive brush size based on container width
    const getResponsiveBrushSize = () => {
        if (!containerRef.current) return brushSize
        const containerWidth = containerRef.current.offsetWidth

        // Scale brush size proportionally on smaller screens
        if (containerWidth < 768) {
            return brushSize * 0.6 // 60% size on mobile
        } else if (containerWidth < 1024) {
            return brushSize * 0.8 // 80% size on tablet
        }
        return brushSize
    }

    // Handle double-tap detection for mobile
    const handleDoubleTap = (e) => {
        const now = Date.now()
        const timeSince = now - lastTapRef.current

        if (timeSince < 300 && timeSince > 0) {
            // Double tap detected - toggle paint mode
            setIsPaintMode((prev) => !prev)
            e.preventDefault()
        }
        lastTapRef.current = now
    }

    // Add paint stamp at pointer/touch location
    const addStamp = (e) => {
        if (!containerRef.current) return

        // On mobile, only paint if paint mode is active
        if (e.type.includes("touch") && !isPaintMode) {
            return
        }

        // Prevent scrolling when in paint mode
        if (e.type.includes("touch") && isPaintMode) {
            e.preventDefault()
        }

        const rect = containerRef.current.getBoundingClientRect()
        const responsiveBrushSize = getResponsiveBrushSize()

        // Handle both touch and mouse events
        let clientX, clientY
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const x = clientX - rect.left - responsiveBrushSize / 2
        const y = clientY - rect.top - responsiveBrushSize / 2

        const newStamp = {
            id: idCounter.current++,
            x,
            y,
            size: responsiveBrushSize,
        }

        setStamps((prev) => {
            const next = [...prev, newStamp]
            return next.length > maxStamps
                ? next.slice(next.length - maxStamps)
                : next
        })
    }

    // Remove stamp after fade animation completes
    const removeStamp = (id) => {
        setStamps((prev) => prev.filter((s) => s.id !== id))
    }

    return (
        <div
            ref={containerRef}
            onPointerMove={(e) => e.buttons > 0 && addStamp(e)}
            onPointerDown={(e) =>
                !e.pointerType.includes("touch") && addStamp(e)
            }
            onTouchStart={(e) => {
                handleDoubleTap(e)
                if (isPaintMode) addStamp(e)
            }}
            onTouchMove={(e) => isPaintMode && addStamp(e)}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 150,
                minHeight: 150,
                position: "relative",
                overflow: "hidden",
                touchAction: isPaintMode ? "none" : "auto",
                WebkitUserSelect: "none",
                userSelect: "none",
                cursor: "crosshair",
                borderRadius: borderRadius,
            }}
        >
            {/* Show placeholder if no images are provided */}
            {!baseImage && !revealImage ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        minWidth: 150,
                        minHeight: 150,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#F3EEFF",
                        gap: "8px",
                        padding: "40px",
                        position: "absolute",
                        inset: 0,
                    }}
                >
                    <div
                        style={{
                            textAlign: "center",
                            color: "#9966FF",
                            maxWidth: "180px",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                margin: "0 0 4px 0",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            Paint Reveal
                        </h3>
                        <p
                            style={{
                                fontSize: "12px",
                                fontWeight: "400",
                                margin: 0,
                                fontFamily: "Inter, system-ui, sans-serif",
                                color: "#B38FFF",
                            }}
                        >
                            Add images to see paint reveal effect
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Mobile Paint Mode Indicator */}
                    {isPaintMode && showIndicator && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                position: "absolute",
                                top: "16px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: indicatorColor,
                                color: "#fff",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "500",
                                zIndex: 10,
                                pointerEvents: "none",
                                backdropFilter: "blur(8px)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                        >
                            {indicatorText}
                        </motion.div>
                    )}

                    {/* Base Image Layer (always visible) */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${baseImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />

                    {/* Reveal Image Layer (masked by paint strokes) */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${revealImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            WebkitMask: `url(#${maskId})`,
                            mask: `url(#${maskId})`,
                        }}
                    />

                    {/* SVG Mask for paint strokes */}
                    <svg style={{ position: "absolute", width: 0, height: 0 }}>
                        <defs>
                            <mask id={maskId}>
                                <rect width="100%" height="100%" fill="black" />
                                <AnimatePresence>
                                    {stamps.map((s) => (
                                        <motion.image
                                            key={s.id}
                                            href={brushTexture}
                                            x={s.x}
                                            y={s.y}
                                            width={s.size}
                                            height={s.size}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{
                                                duration: fadeDuration,
                                                ease: "linear",
                                            }}
                                            onAnimationComplete={() =>
                                                removeStamp(s.id)
                                            }
                                        />
                                    ))}
                                </AnimatePresence>
                            </mask>
                        </defs>
                    </svg>
                </>
            )}
        </div>
    )
}

addPropertyControls(Paint_Reveal, {
    baseImage: {
        type: ControlType.Image,
        title: "Base Image",
        description: "Always visible background",
    },
    revealImage: {
        type: ControlType.Image,
        title: "Reveal Image",
        description: "Hidden until painted",
    },
    brushTexture: {
        type: ControlType.Image,
        title: "Brush Texture",
        description: "Use white stroke on transparent PNG",
    },
    brushSize: {
        type: ControlType.Number,
        min: 20,
        max: 1000,
        defaultValue: 150,
        title: "Brush Size",
        description: "Auto-scales: 60% mobile, 80% tablet",
    },
    fadeDuration: {
        type: ControlType.Number,
        min: 0.5,
        max: 10,
        defaultValue: 3,
        title: "Fade Duration",
        unit: "s",
    },
    maxStamps: {
        type: ControlType.Number,
        min: 1,
        max: 200,
        defaultValue: 50,
        title: "Max Stamps",
    },
    showIndicator: {
        type: ControlType.Boolean,
        title: "Show Mobile Indicator",
        defaultValue: true,
    },
    indicatorText: {
        type: ControlType.String,
        title: "Indicator Text",
        defaultValue: "Paint Mode • Double tap to exit",
        hidden: (props) => !props.showIndicator,
    },
    indicatorColor: {
        type: ControlType.Color,
        title: "Indicator Color",
        defaultValue: "rgba(0, 0, 0, 0.7)",
        hidden: (props) => !props.showIndicator,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 500,
        defaultValue: 0,
        unit: "px",
        displayStepper: true,
    },
})
