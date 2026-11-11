import * as React from "react"
import { useRef, useEffect, useState } from "react"
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


/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    backgroundColor: string
    gridLineBaseColor: string
    gridSize: number
    lineThickness: number
    blobColor1: string
    blobColor2: string
    blobColor3: string
    blobColor4: string
    blobBaseSize: number
    blobScaleVariance: number
    moveDistance: number
    moveSpeed: number
    pulseSpeed: number
    blurAmount: number
    blobOpacity: number
}

// ─────────────────────────────────────────────────────────────────────────────
//  Static Placeholder — shown in Framer canvas / during export.
//  Lightweight CSS-only preview, zero framer-motion cost.
// ─────────────────────────────────────────────────────────────────────────────
function StaticPlaceholder({
    backgroundColor,
    gridLineBaseColor,
    gridSize,
    lineThickness,
    blobColor1,
    blobColor2,
}: Pick<
    Props,
    | "backgroundColor"
    | "gridLineBaseColor"
    | "gridSize"
    | "lineThickness"
    | "blobColor1"
    | "blobColor2"
>) {
    const maskImage = `
        linear-gradient(to right, black ${lineThickness}px, transparent ${lineThickness}px),
        linear-gradient(to bottom, black ${lineThickness}px, transparent ${lineThickness}px)
    `
    const maskSize = `${gridSize}px ${gridSize}px`

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: gridLineBaseColor,
                    WebkitMaskImage: maskImage,
                    WebkitMaskSize: maskSize,
                    maskImage,
                    maskSize,
                }}
            />
            {/* Static blob hints */}
            <div
                style={{
                    position: "absolute",
                    inset: "-30%",
                    filter: "blur(80px)",
                    opacity: 0.6,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "5%",
                        left: "5%",
                        width: "55%",
                        height: "55%",
                        background: `radial-gradient(circle, ${blobColor1} 0%, transparent 60%)`,
                        borderRadius: "50%",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "5%",
                        right: "5%",
                        width: "60%",
                        height: "60%",
                        background: `radial-gradient(circle, ${blobColor2} 0%, transparent 60%)`,
                        borderRadius: "50%",
                    }}
                />
            </div>
            {/* Label */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                Sticky Grid Gradient
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function StickyGridGradient(props: Props) {
    const {
        backgroundColor,
        gridLineBaseColor,
        gridSize,
        lineThickness,
        blobColor1,
        blobColor2,
        blobColor3,
        blobColor4,
        blobBaseSize,
        blobScaleVariance,
        moveDistance,
        moveSpeed,
        pulseSpeed,
        blurAmount,
        blobOpacity,
    } = props

    const isStatic = useIsStaticRenderer()

    // ── Intersection Observer — freeze animations when off-screen ─────────────
    // framer-motion cannot be paused via cancelAnimationFrame, so we use
    // a boolean flag: when not visible, animate is set to a static snapshot
    // (current position = origin) which tells motion to stop updating.
    const [isVisible, setIsVisible] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [isStatic])

    // ── Static placeholder ────────────────────────────────────────────────────
    if (isStatic) {
        return (
            <StaticPlaceholder
                backgroundColor={backgroundColor}
                gridLineBaseColor={gridLineBaseColor}
                gridSize={gridSize}
                lineThickness={lineThickness}
                blobColor1={blobColor1}
                blobColor2={blobColor2}
            />
        )
    }

    // ── Grid mask ─────────────────────────────────────────────────────────────
    const maskImage = `
        linear-gradient(to right, black ${lineThickness}px, transparent ${lineThickness}px),
        linear-gradient(to bottom, black ${lineThickness}px, transparent ${lineThickness}px)
    `
    const maskSize = `${gridSize}px ${gridSize}px`

    const d = moveDistance
    const s = blobScaleVariance

    // When not visible: animate prop = frozen snapshot (no motion, no RAF cost)
    // When visible:     full keyframe arrays as before
    const blob1Animate = isVisible
        ? {
              x: ["0%", `${d}%`, "10%", `-${d / 4}%`, "0%"],
              y: ["0%", `${d}%`, `-${d / 4}%`, "10%", "0%"],
              scale: [1, 1 + s, 1 - s / 2, 1 + s / 2, 1],
          }
        : { x: "0%", y: "0%", scale: 1 }

    const blob2Animate = isVisible
        ? {
              x: ["0%", `-${d}%`, "-10%", `${d / 4}%`, "0%"],
              y: ["0%", `-${d}%`, `${d / 4}%`, "-10%", "0%"],
              scale: [1, 1 - s / 2, 1 + s, 1 - s / 4, 1],
          }
        : { x: "0%", y: "0%", scale: 1 }

    const blob3Animate = isVisible
        ? {
              x: ["0%", `-${d}%`, "20%", `-${d / 2}%`, "0%"],
              y: ["0%", `${d / 2}%`, `${d}%`, "-10%", "0%"],
              scale: [1, 1 + s, 1 - s, 1 + s / 3, 1],
          }
        : { x: "0%", y: "0%", scale: 1 }

    const blob4Animate = isVisible
        ? {
              x: ["0%", `${d}%`, "-20%", `${d / 2}%`, "0%"],
              y: ["0%", `-${d / 2}%`, `-${d}%`, "10%", "0%"],
              scale: [1, 1 + s / 2, 1 - s, 1 + s / 4, 1],
          }
        : { x: "0%", y: "0%", scale: 1 }

    // Shared transition — repeat:Infinity only when visible
    const mt = (mul = 1) => ({
        x: {
            duration: moveSpeed * mul,
            repeat: isVisible ? Infinity : 0,
            ease: "easeInOut",
        },
        y: {
            duration: moveSpeed * mul * 1.1,
            repeat: isVisible ? Infinity : 0,
            ease: "easeInOut",
        },
        scale: {
            duration: pulseSpeed * mul,
            repeat: isVisible ? Infinity : 0,
            ease: "easeInOut",
        },
    })

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                // FIX: removed minHeight:"100vh" — let Framer frame size control height
            }}
        >
            {/* Grid line layer with CSS mask */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: gridLineBaseColor,
                    WebkitMaskImage: maskImage,
                    WebkitMaskSize: maskSize,
                    maskImage,
                    maskSize,
                    pointerEvents: "none",
                }}
            >
                {/* Sticky container — keeps blobs in view while scrolling */}
                <div
                    style={{
                        position: "sticky",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100vh",
                        overflow: "hidden",
                    }}
                >
                    {/* Blur wrapper — extends beyond viewport to avoid hard edges */}
                    <div
                        style={{
                            position: "absolute",
                            inset: "-50%",
                            filter: `blur(${blurAmount}px)`,
                            opacity: blobOpacity,
                        }}
                    >
                        {/* Blob 1 — top left */}
                        <motion.div
                            animate={blob1Animate}
                            transition={mt(1.0)}
                            style={{
                                position: "absolute",
                                top: "0%",
                                left: "0%",
                                width: `${blobBaseSize}%`,
                                height: `${blobBaseSize}%`,
                                background: `radial-gradient(circle, ${blobColor1} 0%, transparent 60%)`,
                                borderRadius: "50%",
                            }}
                        />

                        {/* Blob 2 — bottom right */}
                        <motion.div
                            animate={blob2Animate}
                            transition={mt(1.2)}
                            style={{
                                position: "absolute",
                                bottom: "0%",
                                right: "0%",
                                width: `${blobBaseSize * 1.1}%`,
                                height: `${blobBaseSize * 1.1}%`,
                                background: `radial-gradient(circle, ${blobColor2} 0%, transparent 60%)`,
                                borderRadius: "50%",
                            }}
                        />

                        {/* Blob 3 — top right */}
                        <motion.div
                            animate={blob3Animate}
                            transition={mt(0.9)}
                            style={{
                                position: "absolute",
                                top: "0%",
                                right: "0%",
                                width: `${blobBaseSize * 0.9}%`,
                                height: `${blobBaseSize * 0.9}%`,
                                background: `radial-gradient(circle, ${blobColor3} 0%, transparent 60%)`,
                                borderRadius: "50%",
                            }}
                        />

                        {/* Blob 4 — bottom left */}
                        <motion.div
                            animate={blob4Animate}
                            transition={mt(1.1)}
                            style={{
                                position: "absolute",
                                bottom: "0%",
                                left: "0%",
                                width: `${blobBaseSize}%`,
                                height: `${blobBaseSize}%`,
                                background: `radial-gradient(circle, ${blobColor4} 0%, transparent 60%)`,
                                borderRadius: "50%",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Property Controls
// ─────────────────────────────────────────────────────────────────────────────
addPropertyControls(StickyGridGradient, {
    // ── Background & Grid ─────────────────────────────────────────────────────
    backgroundColor: {
        type: ControlType.Color,
        title: "Canvas BG",
        defaultValue: "#050505",
        description: "Deepest background color behind the grid.",
    },
    gridLineBaseColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "rgba(255, 255, 255, 0.05)",
        description: "Grid line color when no blob is passing through.",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 60,
        min: 10,
        max: 200,
        step: 1,
        description: "Width and height of each grid cell in pixels.",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        description: "Grid line thickness in pixels.",
    },

    // ── Blob Colors ───────────────────────────────────────────────────────────
    blobColor1: {
        type: ControlType.Color,
        title: "Blob 1",
        defaultValue: "#FF0080",
    },
    blobColor2: {
        type: ControlType.Color,
        title: "Blob 2",
        defaultValue: "#7928CA",
    },
    blobColor3: {
        type: ControlType.Color,
        title: "Blob 3",
        defaultValue: "#0070F3",
    },
    blobColor4: {
        type: ControlType.Color,
        title: "Blob 4",
        defaultValue: "#FF4D4D",
    },

    // ── Blob Shape ────────────────────────────────────────────────────────────
    blobBaseSize: {
        type: ControlType.Number,
        title: "Blob Size",
        defaultValue: 70,
        min: 20,
        max: 150,
        step: 1,
        description: "Initial blob size as a percentage of the container.",
    },
    blobOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Overall transparency of all blobs.",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 120,
        min: 0,
        max: 300,
        step: 1,
        description: "Blur intensity applied to the blob layer.",
    },

    // ── Motion ────────────────────────────────────────────────────────────────
    moveDistance: {
        type: ControlType.Number,
        title: "Move Spread",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        description: "Max travel distance from each blob's corner, in percent.",
    },
    moveSpeed: {
        type: ControlType.Number,
        title: "Move Speed",
        defaultValue: 25,
        min: 1,
        max: 100,
        step: 1,
        description: "Seconds per movement cycle. Higher = slower.",
    },
    pulseSpeed: {
        type: ControlType.Number,
        title: "Pulse Speed",
        defaultValue: 12,
        min: 1,
        max: 100,
        step: 1,
        description: "Seconds per scale pulse cycle. Higher = slower.",
    },
    blobScaleVariance: {
        type: ControlType.Number,
        title: "Pulse Scale",
        defaultValue: 0.4,
        min: 0,
        max: 2,
        step: 0.05,
        description: "How much blobs grow/shrink per pulse. 0.4 = ±40%.",
    },
})
