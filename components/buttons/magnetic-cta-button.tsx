"use client"

/**
 * MagneticGlassButton — Framer Code Component
 * ─────────────────────────────────────────────
 * ✅ Button is always compact & centered — never stretches to fill frame
 * ✅ Proper padding around text — always looks like a button
 * ✅ Pill shape works correctly
 * ✅ Resizable frame — the button stays centered, frame gives magnetic room
 * ✅ Built-in dark background with ambient glow
 * ✅ All controls in right panel
 *
 * HOW TO USE
 * ──────────
 * 1. Assets → Code → "+" → MagneticGlassButton → paste → Save
 * 2. Drag onto canvas — make the frame bigger to give more magnetic range
 * 3. The button inside stays the right size — only the frame grows
 * 4. Control button size with "Btn Width" and "Btn Height" in right panel
 */

import { useRef, useState, useCallback } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    style?: React.CSSProperties
    // Frame size (Framer canvas handles) — gives magnetic movement room
    width?: number
    height?: number
    // Button inner size — controlled via right panel
    btnWidth?: number
    btnHeight?: number
    label?: string
    sublabel?: string
    magnetStrength?: number
    glowColor?: string
    borderOpacity?: number
    blurAmount?: number
    pillShape?: boolean
    fontSize?: number
    showBackground?: boolean
    bgColor?: string
    onClick?: () => void
}

const SPRING_MAIN = { stiffness: 200, damping: 22, mass: 0.8 }
const SPRING_GLOW = { stiffness: 100, damping: 16, mass: 1.1 }
const SPRING_SCALE = { stiffness: 260, damping: 20, mass: 0.8 }

export default function MagneticGlassButton({
    style,
    width = 1920,
    height = 1080,
    btnWidth = 560,
    btnHeight = 150,
    label = "Get started",
    sublabel = "",
    magnetStrength = 0.55,
    glowColor = "#a78bfa",
    borderOpacity = 0.28,
    blurAmount = 20,
    pillShape = true,
    fontSize = 40,
    showBackground = true,
    bgColor = "#0f0c1a",
    onClick,
}: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)
    const isStaticRenderer = useIsStaticRenderer()
    const x = useSpring(0, SPRING_MAIN)
    const y = useSpring(0, SPRING_MAIN)
    const glowX = useSpring(50, SPRING_GLOW)
    const glowY = useSpring(50, SPRING_GLOW)
    const scale = useSpring(1, SPRING_SCALE)

    const rotateX = useTransform(y, (v) => -v * 0.18)
    const rotateY = useTransform(x, (v) => v * 0.18)

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isStaticRenderer) return

            const el = ref.current
            if (!el) return

            const rect = el.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / rect.width - 0.5
            const ny = (e.clientY - rect.top) / rect.height - 0.5
            const pull = magnetStrength * Math.min(rect.width, rect.height)

            x.set(nx * pull * 2)
            y.set(ny * pull * 2)
            glowX.set((nx + 0.5) * 100)
            glowY.set((ny + 0.5) * 100)
        },
        [isStaticRenderer, magnetStrength, x, y, glowX, glowY]
    )

    const handleMouseEnter = () => {
        if (isStaticRenderer) return

        setHovered(true)
        scale.set(1.06)
    }
    const handleMouseLeave = () => {
        if (isStaticRenderer) return

        setHovered(false)
        x.set(0)
        y.set(0)
        glowX.set(50)
        glowY.set(50)
        scale.set(1)
    }
    const handleMouseDown = () => {
        if (isStaticRenderer) return

        scale.set(0.97)
    }
    const handleMouseUp = () => {
        if (isStaticRenderer) return

        scale.set(hovered ? 1.06 : 1)
    }

    // Pill uses half of btn height for perfect radius; rounded uses fixed 16px
    const radius = pillShape ? btnHeight / 2 : 16
    const glowLeft = useTransform(glowX, (v) => `${v - 100}%`)
    const glowTop = useTransform(glowY, (v) => `${v - 100}%`)

    return (
        // OUTER FRAME — fills Framer canvas frame, transparent or bg
        // This is the area the button magnetically moves within
        <div
            style={{
                ...style,
                width,
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 0,
                boxSizing: "border-box",
                position: "relative",
                overflow: "visible",
                borderRadius: 24,
                background: showBackground ? bgColor : "transparent",
            }}
        >
            {/* Ambient glow blobs — only when bg is on */}
            {showBackground && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            width: "120%",
                            height: "180%",
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${glowColor}1a 0%, transparent 70%)`,
                            top: "-30%",
                            left: "-10%",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "160%",
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle, #38bdf81a 0%, transparent 70%)",
                            bottom: "-30%",
                            right: "-5%",
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            {/* THE BUTTON — fixed size, centered, never stretches */}
            <motion.div
                ref={ref}
                role="button"
                tabIndex={0}
                aria-label={label}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onClick={onClick}
                onKeyDown={(e) => e.key === "Enter" && onClick?.()}
                style={{
                    // Magnetic motion applied here
                    x,
                    y,
                    scale,
                    rotateX,
                    rotateY,
                    transformPerspective: 900,

                    // Fixed button dimensions — NOT 100% width/height
                    width: btnWidth,
                    height: btnHeight,
                    flexShrink: 0,
                    borderRadius: radius,

                    // Glass surface
                    background: hovered
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(255,255,255,0.08)",
                    backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
                    WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
                    border: `1px solid rgba(255,255,255,${borderOpacity})`,
                    boxShadow: hovered
                        ? `0 8px 32px rgba(0,0,0,0.4),
                           0 1px 0 rgba(255,255,255,0.22) inset,
                           0 0 60px ${glowColor}30`
                        : `0 2px 16px rgba(0,0,0,0.35),
                           0 1px 0 rgba(255,255,255,0.12) inset`,

                    // Layout
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    overflow: "hidden",
                    cursor: "pointer",
                    userSelect: "none",
                    position: "relative",
                    transition: "background 0.25s ease, box-shadow 0.25s ease",
                    willChange: "transform",
                }}
            >
                {/* Aurora glow orb — chases cursor */}
                <motion.div
                    style={{
                        position: "absolute",
                        width: "200%",
                        height: "200%",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${glowColor}55 0%, transparent 55%)`,
                        left: glowLeft,
                        top: glowTop,
                        opacity: hovered ? 1 : 0,
                        pointerEvents: "none",
                        mixBlendMode: "screen",
                        transition: "opacity 0.3s ease",
                    }}
                />

                {/* Top shimmer line */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "15%",
                        width: "70%",
                        height: 1,
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                        opacity: hovered ? 1 : 0.45,
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                    }}
                />

                {/* Noise grain */}
                <svg
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0.04,
                        pointerEvents: "none",
                    }}
                >
                    <filter id="mgb-noise">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.72"
                            numOctaves="4"
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#mgb-noise)" />
                </svg>

                {/* Label */}
                <span
                    style={{
                        position: "relative",
                        zIndex: 1,
                        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
                        fontSize,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: "rgba(255,255,255,0.95)",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        textShadow: hovered
                            ? `0 0 28px ${glowColor}aa`
                            : "none",
                        transition: "text-shadow 0.3s ease",
                        pointerEvents: "none",
                    }}
                >
                    {label}
                </span>

                {/* Sublabel */}
                {sublabel ? (
                    <span
                        style={{
                            position: "relative",
                            zIndex: 1,
                            fontFamily:
                                "'DM Sans', 'Helvetica Neue', sans-serif",
                            fontSize: Math.max(9, fontSize * 0.58),
                            fontWeight: 400,
                            letterSpacing: "0.09em",
                            textTransform: "uppercase",
                            color: `${glowColor}cc`,
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            opacity: hovered ? 1 : 0.55,
                            transition: "opacity 0.3s ease",
                            pointerEvents: "none",
                        }}
                    >
                        {sublabel}
                    </span>
                ) : null}
            </motion.div>
        </div>
    )
}

addPropertyControls(MagneticGlassButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
    },
    sublabel: {
        type: ControlType.String,
        title: "Sublabel",
        defaultValue: "",
        placeholder: "optional tagline",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font size",
        min: 10,
        max: 80,
        step: 1,
        defaultValue: 40,
        displayStepper: true,
    },
    btnWidth: {
        type: ControlType.Number,
        title: "Btn width",
        min: 80,
        max: 900,
        step: 4,
        defaultValue: 560,
        displayStepper: true,
    },
    btnHeight: {
        type: ControlType.Number,
        title: "Btn height",
        min: 32,
        max: 300,
        step: 2,
        defaultValue: 150,
        displayStepper: true,
    },
    pillShape: {
        type: ControlType.Boolean,
        title: "Shape",
        defaultValue: true,
        enabledTitle: "Pill",
        disabledTitle: "Rounded",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow color",
        defaultValue: "#a78bfa",
    },
    magnetStrength: {
        type: ControlType.Number,
        title: "Magnet",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        displayStepper: true,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur (px)",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 20,
        displayStepper: true,
    },
    borderOpacity: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.28,
        displayStepper: true,
    },
    showBackground: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: true,
        enabledTitle: "Built-in",
        disabledTitle: "Transparent",
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG color",
        defaultValue: "#0f0c1a",
    },
    onClick: {
        type: ControlType.EventHandler,
        title: "On Click",
    },
})
