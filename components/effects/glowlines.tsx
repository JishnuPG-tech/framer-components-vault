// Glow Lines: Responsive horizontal bar of glowing vertical lines with full Framer property controls
import { useMemo, useRef, useEffect, useState, startTransition } from "react"
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
 * Glow Lines
 *
 * Responsive horizontal bar of glowing vertical lines, customizable color, thickness, spacing, height, glow, alignment, and animation.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function GlowLines(props) {
    const {
        lineCount,
        lineColor,
        gradientMode,
        gradientFrom,
        gradientTo,
        thickness,
        spacing,
        lineHeight,
        glowIntensity,
        glowOpacity,
        animation,
        animationSpeed,
        customGlowColor,
        fade,
        fadeAmount,
        gradientAngle,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [animState, setAnimState] = useState(0)
    const rafRef = useRef<number | undefined>(undefined)

    // Animation loop
    useEffect(() => {
        if (isStatic || animation === "none") return
        let frame = 0
        let running = true
        function animate() {
            if (!running) return
            startTransition(() => setAnimState(frame))
            frame++
            rafRef.current = requestAnimationFrame(animate)
        }
        rafRef.current = requestAnimationFrame(animate)
        return () => {
            running = false
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isStatic, animation])

    // Gradient
    const getLineColor = (i) => {
        if (!gradientMode) return lineColor
        // Linear interpolation between gradientFrom and gradientTo
        const lerp = (a, b, t) => a + (b - a) * t
        // Parse hex to rgb
        function hexToRgb(hex) {
            let c = hex.replace("#", "")
            if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
            const num = parseInt(c, 16)
            return [num >> 16, (num >> 8) & 255, num & 255]
        }
        const from = hexToRgb(gradientFrom)
        const to = hexToRgb(gradientTo)
        const t = lineCount <= 1 ? 0 : i / (lineCount - 1)
        const rgb = [
            Math.round(lerp(from[0], to[0], t)),
            Math.round(lerp(from[1], to[1], t)),
            Math.round(lerp(from[2], to[2], t)),
        ]
        return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
    }

    // Animation per line
    function getAnim(lineIdx) {
        if (animation === "none") return 1
        const t = animState / 60 // ~60fps
        if (animation === "breathe") {
            return 0.7 + 0.3 * Math.sin(t * animationSpeed * 0.7)
        }
        if (animation === "flash") {
            return (Math.floor(t * animationSpeed) % 2) === 0 ? 1 : 0.2
        }
        if (animation === "sequence-ltr") {
            // Wave from left to right
            const phase = (t * animationSpeed - lineIdx * 0.12) % (2 * Math.PI)
            return 0.7 + 0.3 * Math.max(0, Math.sin(phase))
        }
        if (animation === "sequence-rtl") {
            // Wave from right to left
            const phase = (t * animationSpeed - (lineCount - 1 - lineIdx) * 0.12) % (2 * Math.PI)
            return 0.7 + 0.3 * Math.max(0, Math.sin(phase))
        }
        return 1
    }

    // Fade logic for wave animations
    function getFade(lineIdx) {
        if (!fade) return 1
        if (animation === "sequence-rtl") {
            // Fade left side (low idx)
            const t = lineIdx / (lineCount - 1)
            return 1 - fadeAmount * t
        }
        if (animation === "sequence-ltr") {
            // Fade right side (high idx)
            const t = 1 - lineIdx / (lineCount - 1)
            return 1 - fadeAmount * t
        }
        return 1
    }

    // Responsive line height
    const containerHeight = style?.height && typeof style.height === "number" ? style.height : 60
    const lineH = `${lineHeight}%`

    // Render lines
    const lines = useMemo(() => {
        // Calculate total width for all lines and spacing
        const totalSpacing = spacing * (lineCount - 1)
        const totalThickness = thickness * lineCount
        // Prevent negative or zero available space
        const availableWidth = Math.max(1, totalThickness + totalSpacing)
        return Array.from({ length: lineCount }).map((_, i) => {
            const color = getLineColor(i)
            const anim = getAnim(i)
            let fadeVal = 1
            if (fade && (animation === "sequence-ltr" || animation === "sequence-rtl")) {
                fadeVal = getFade(i)
            }
            // Use background as a gradient if gradientMode is on
            let background = color
            if (gradientMode) {
                // For each line, calculate the start and end positions for the gradient so the angle is correct
                // Each line gets a slice of the gradient along the bar
                const t = lineCount <= 1 ? 0 : i / (lineCount - 1)
                const from = gradientFrom
                const to = gradientTo
                // The gradient is positioned so that each line gets its own color at the correct angle
                background = `linear-gradient(${gradientAngle}deg, ${from} 0%, ${to} 100%)`
            }
            // If glowIntensity is 0, show only the lines (no glow div)
            const showGlow = glowIntensity > 0
            return (
                <div
                    key={i}
                    style={{
                        width: thickness,
                        height: lineH,
                        marginLeft: i === 0 ? 0 : spacing,
                        borderRadius: thickness,
                        background: "none",
                        position: "relative",
                        flex: `0 0 ${thickness}px`,
                        minWidth: thickness,
                        maxWidth: thickness,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    aria-hidden="true"
                >
                    {showGlow && (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: thickness,
                                background: background,
                                boxShadow: `0 0 ${glowIntensity * 2}px ${customGlowColor || color}`,
                                opacity: anim * glowOpacity * fadeVal,
                                filter: `blur(${glowIntensity * 0.3}px)`,
                                transition: "opacity 0.18s, filter 0.18s, background 0.18s",
                                willChange: "opacity, filter, background",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 0,
                            }}
                        />
                    )}
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: thickness,
                            background: gradientMode
                                ? (() => {
                                    // For gradient, use a slice of the gradient for each line
                                    // Use background: linear-gradient with backgroundPosition
                                    const t = lineCount <= 1 ? 0 : i / (lineCount - 1)
                                    // Use a 1px wide gradient, then stretch it
                                    return `linear-gradient(${gradientAngle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)`;
                                })()
                                : background,
                            opacity: anim * fadeVal,
                            position: "relative",
                            zIndex: 1,
                        }}
                    />
                </div>
            )
        })
    }, [lineCount, thickness, spacing, lineH, gradientMode, lineColor, gradientFrom, gradientTo, glowIntensity, glowOpacity, animState, animation, animationSpeed, customGlowColor, fade, fadeAmount, gradientAngle])

    // Container style
    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 1,
                background: "none",
                overflow: "visible",
            }}
            aria-hidden="true"
        >
            {lines}
        </div>
    )
}

addPropertyControls(GlowLines, {
    lineCount: {
        type: ControlType.Number,
        title: "Lines",
        defaultValue: 32,
        min: 2,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 4,
        min: 1,
        max: 16,
        step: 1,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Height %",
        defaultValue: 80,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
    },
    gradientMode: {
        type: ControlType.Boolean,
        title: "Gradient",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 180,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
        hidden: ({ gradientMode }) => !gradientMode,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#4CFF6A",
        hidden: ({ gradientMode }) => !!gradientMode,
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "From",
        defaultValue: "#4CFF6A",
        hidden: ({ gradientMode }) => !gradientMode,
    },
    gradientTo: {
        type: ControlType.Color,
        title: "To",
        defaultValue: "#00E0FF",
        hidden: ({ gradientMode }) => !gradientMode,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 0.85,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    animation: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["none", "breathe", "flash", "sequence-ltr", "sequence-rtl"],
        optionTitles: ["None", "Breathe", "Flash", "Wave L→R", "Wave R→L"],
        defaultValue: "none",
        displaySegmentedControl: false,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        defaultValue: 2.5,
        min: 0.5,
        max: 8,
        step: 0.1,
        hidden: ({ animation }) => animation === "none",
    },
    customGlowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "",
        optional: true,
        hidden: ({ gradientMode, customGlowColor }) => !customGlowColor,
    },
    fade: {
        type: ControlType.Boolean,
        title: "Fade",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ animation }) => !(animation === "sequence-ltr" || animation === "sequence-rtl"),
    },
    fadeAmount: {
        type: ControlType.Number,
        title: "Fade Amount",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ fade, animation }) => !fade || !(animation === "sequence-ltr" || animation === "sequence-rtl"),
    },
})

export default GlowLines
