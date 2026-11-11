// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"
import React, { useRef, useMemo, useState, CSSProperties } from "react"

// =============================================================================
// TYPES
// =============================================================================

type TextAlign = "left" | "center" | "right"
type HoverEffect = "none" | "lift" | "scale" | "glow"
type Preset =
    | "custom"
    | "borealis"
    | "sunset"
    | "ocean"
    | "iridescent"
    | "ember"
    | "mono"

interface ColorsConfig {
    colorA: string
    colorB: string
    colorC: string
}

interface Props {
    text: string
    fontFamily?: {
        fontFamily?: string
        fontWeight?: number | string
    }
    fontSize: number
    letterSpacing: number
    lineHeight: number
    textAlign: TextAlign
    preset: Preset
    colors: ColorsConfig
    speed: number
    angle: number
    glow: boolean
    glowIntensity: number
    breathing: boolean
    showLines: boolean
    lineThickness: number
    hoverEffect: HoverEffect
    style?: CSSProperties
}

// =============================================================================
// PRESET DEFINITIONS
// =============================================================================

interface PresetValues {
    colorA: string
    colorB: string
    colorC: string
}

const PRESETS: Record<Exclude<Preset, "custom">, PresetValues> = {
    borealis: {
        colorA: "#00FF88",
        colorB: "#8B5CF6",
        colorC: "#06B6D4",
    },
    sunset: {
        colorA: "#F97316",
        colorB: "#EC4899",
        colorC: "#8B5CF6",
    },
    ocean: {
        colorA: "#06B6D4",
        colorB: "#3B82F6",
        colorC: "#8B5CF6",
    },
    iridescent: {
        colorA: "#FF6B6B",
        colorB: "#4ECDC4",
        colorC: "#FFE66D",
    },
    ember: {
        colorA: "#FF4400",
        colorB: "#FF8800",
        colorC: "#FFCC00",
    },
    mono: {
        colorA: "#FFFFFF",
        colorB: "#A0A0A0",
        colorC: "#E0E0E0",
    },
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_FONT =
    "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"

// =============================================================================
// COLOR UTILITIES
// =============================================================================

function parseColor(color: string): { r: number; g: number; b: number } | null {
    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i)
    if (hexMatch) {
        let hex = hexMatch[1]
        if (hex.length === 3)
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
        }
    }
    const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
        }
    }
    return null
}

function colorWithAlpha(color: string, alpha: number): string {
    const c = parseColor(color)
    if (c) return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`
    return color
}

function lerpColor(a: string, b: string, t: number): string {
    const ca = parseColor(a) || { r: 255, g: 255, b: 255 }
    const cb = parseColor(b) || { r: 200, g: 200, b: 200 }
    const cl = Math.max(0, Math.min(1, t))
    const r = Math.round(ca.r + (cb.r - ca.r) * cl)
    const g = Math.round(ca.g + (cb.g - ca.g) * cl)
    const bl = Math.round(ca.b + (cb.b - ca.b) * cl)
    return `rgb(${r}, ${g}, ${bl})`
}

function interpolateTriColor(
    cA: string,
    cB: string,
    cC: string,
    t: number
): string {
    if (t < 0.5) return lerpColor(cA, cB, t * 2)
    return lerpColor(cB, cC, (t - 0.5) * 2)
}

// =============================================================================
// CSS KEYFRAME GENERATION
// =============================================================================

function generateKeyframes(
    id: string,
    colorA: string,
    colorB: string,
    colorC: string,
    glowEnabled: boolean,
    glowIntensity: number,
    breathingEnabled: boolean
): string {
    let css = ""

    // ── Main aurora flow ─────────────────────────────────────────────
    css += `
@keyframes af-${id} {
  0%, 100% {
    background-position: 0% 0%, 100% 100%, 50% 0%, 0% 50%;
  }
  12% {
    background-position: 100% 20%, 0% 50%, 0% 100%, 30% 0%;
  }
  25% {
    background-position: 50% 100%, 80% 0%, 100% 50%, 70% 100%;
  }
  37% {
    background-position: 0% 50%, 50% 100%, 20% 0%, 100% 50%;
  }
  50% {
    background-position: 100% 100%, 0% 0%, 80% 100%, 50% 0%;
  }
  62% {
    background-position: 30% 0%, 100% 80%, 0% 50%, 0% 80%;
  }
  75% {
    background-position: 80% 80%, 20% 20%, 100% 0%, 80% 30%;
  }
  87% {
    background-position: 20% 30%, 60% 70%, 50% 80%, 40% 70%;
  }
}`

    // ── Glow color cycling ───────────────────────────────────────────
    if (glowEnabled) {
        const r = glowIntensity
        const r2 = r * 2
        const cA = colorWithAlpha(colorA, 0.5)
        const cA2 = colorWithAlpha(colorA, 0.2)
        const cB = colorWithAlpha(colorB, 0.5)
        const cB2 = colorWithAlpha(colorB, 0.2)
        const cC = colorWithAlpha(colorC, 0.5)
        const cC2 = colorWithAlpha(colorC, 0.2)
        css += `
@keyframes ag-${id} {
  0%, 100% {
    text-shadow: 0 0 ${r}px ${cA}, 0 0 ${r2}px ${cA2};
  }
  33% {
    text-shadow: 0 0 ${r}px ${cB}, 0 0 ${r2}px ${cB2};
  }
  66% {
    text-shadow: 0 0 ${r}px ${cC}, 0 0 ${r2}px ${cC2};
  }
}`
    }

    // ── Breathing ────────────────────────────────────────────────────
    if (breathingEnabled) {
        css += `
@keyframes ab-${id} {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.012); }
}`
    }

    // ── Accent underline ──────────────────────────────────────────────
    // Draws from center outward, holds, then retracts. Dead simple.
    css += `
@keyframes al-${id} {
  0%, 8% { transform: scaleX(0); opacity: 0; }
  12% { opacity: 1; }
  30%, 70% { transform: scaleX(1); opacity: 1; }
  88% { opacity: 1; }
  92%, 100% { transform: scaleX(0); opacity: 0; }
}`

    return css
}

// =============================================================================
// CANVAS / STATIC PREVIEW
// =============================================================================

function StaticPreview({
    text,
    fontFamily,
    fontWeight,
    fontSize,
    letterSpacing,
    lineHeight,
    textAlign,
    justifyContent,
    colorA,
    colorB,
    colorC,
    glowEnabled,
    glowIntensity,
    showLines,
    lineThickness,
    style,
}: {
    text: string
    fontFamily: string
    fontWeight: number | string
    fontSize: number
    letterSpacing: number
    lineHeight: number
    textAlign: TextAlign
    justifyContent: string
    colorA: string
    colorB: string
    colorC: string
    glowEnabled: boolean
    glowIntensity: number
    showLines: boolean
    lineThickness: number
    style?: CSSProperties
}) {
    const lines = text.split("\n")
    const allChars: string[] = []
    lines.forEach((line, li) => {
        line.split("").forEach((c) => allChars.push(c))
        if (li < lines.length - 1) allChars.push("\n")
    })
    const totalVisible = allChars.filter((c) => c !== " " && c !== "\n").length

    let visibleIdx = 0

    return (
        <div
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems:
                    justifyContent === "center"
                        ? "center"
                        : justifyContent === "flex-end"
                          ? "flex-end"
                          : "flex-start",
                position: "relative",
                overflow: "visible",
            }}
        >
            {lines.map((line, lineIdx) => (
                <div
                    key={lineIdx}
                    style={{
                        display: "flex",
                        justifyContent,
                        alignItems: "baseline",
                        lineHeight,
                    }}
                >
                    {line.split("").map((char, i) => {
                        const isSpace = char === " "
                        if (isSpace) {
                            return (
                                <span
                                    key={i}
                                    style={{
                                        display: "inline-block",
                                        width: fontSize * 0.3,
                                    }}
                                />
                            )
                        }

                        const t =
                            totalVisible > 1
                                ? visibleIdx / (totalVisible - 1)
                                : 0.5
                        visibleIdx++
                        const charColor = interpolateTriColor(
                            colorA,
                            colorB,
                            colorC,
                            t
                        )

                        return (
                            <span
                                key={i}
                                style={{
                                    display: "inline-block",
                                    fontFamily,
                                    fontWeight: fontWeight as any,
                                    fontSize,
                                    letterSpacing: `${letterSpacing}px`,
                                    lineHeight,
                                    whiteSpace: "pre",
                                    color: charColor,
                                    textShadow: glowEnabled
                                        ? `0 0 ${glowIntensity}px ${colorWithAlpha(charColor, 0.4)}`
                                        : "none",
                                }}
                            >
                                {char}
                            </span>
                        )
                    })}
                </div>
            ))}

            {/* Static underline hint */}
            {showLines && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 2,
                        left: "10%",
                        right: "10%",
                        height: lineThickness,
                        borderRadius: lineThickness / 2,
                        background: `linear-gradient(90deg, ${colorA}, ${colorB}, ${colorC})`,
                        opacity: 0.6,
                        transform: "scaleX(0.7)",
                    }}
                />
            )}
        </div>
    )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Text Aurora
 *
 * Premium flowing aurora gradient text animation.
 * Multiple gradient layers flow through the text shape at different speeds,
 * creating an organic, mesmerizing light effect. Animated shimmer lines
 * sweep below and above the text for added depth.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TextAurora(props: Props) {
    const {
        text = "AURORA",
        fontFamily: fontFamilyProp,
        fontSize = 96,
        letterSpacing = -2,
        lineHeight = 1.1,
        textAlign = "center",
        preset = "borealis",
        colors = {} as ColorsConfig,
        speed = 1,
        angle = 45,
        glow = true,
        glowIntensity = 12,
        breathing = false,
        showLines = true,
        lineThickness = 3,
        hoverEffect = "glow",
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    // ── Refs & viewport ──────────────────────────────────────────────
    const idRef = useRef(`a${Math.random().toString(36).substr(2, 8)}`)
    const id = idRef.current
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.2 })

    // ── Resolve preset vs custom ─────────────────────────────────────
    const pv = preset !== "custom" ? PRESETS[preset] : null
    const colorA = pv?.colorA ?? colors.colorA ?? "#00FF88"
    const colorB = pv?.colorB ?? colors.colorB ?? "#8B5CF6"
    const colorC = pv?.colorC ?? colors.colorC ?? "#06B6D4"

    // ── Font ─────────────────────────────────────────────────────────
    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        : DEFAULT_FONT
    const fontWeight = fontFamilyProp?.fontWeight || 800

    // ── Durations ────────────────────────────────────────────────────
    const clampedSpeed = Math.max(0.2, speed)
    const flowDuration = 12 / clampedSpeed
    const glowDuration = 8 / clampedSpeed
    const breatheDuration = 5
    const lineDuration = 6 / clampedSpeed

    // ── Animation play state (viewport gating) ───────────────────────
    const playState: "running" | "paused" = isInView ? "running" : "paused"

    // ── Alignment ────────────────────────────────────────────────────
    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    // ── Effect padding (prevents clipping in Framer preview) ─────────
    // Framer's parent wrappers use overflow:hidden in preview/publish.
    // Padding on the text span expands its measured size so effects
    // (glow, letter edges) fit within bounds.
    const glowPad = glow ? Math.ceil(glowIntensity * 0.6) : 0
    const sidePad = Math.max(8, glowPad + 4, Math.ceil(fontSize * 0.1))
    const topPad = Math.max(6, glowPad)
    const bottomPad = showLines ? Math.max(topPad, lineThickness + 12) : topPad

    // ── Gradient composition ─────────────────────────────────────────
    const gradientBackground = [
        `radial-gradient(ellipse at 50% 50%, ${colorWithAlpha(colorA, 0.9)} 0%, transparent 55%)`,
        `radial-gradient(ellipse at 50% 50%, ${colorWithAlpha(colorB, 0.85)} 0%, transparent 55%)`,
        `radial-gradient(ellipse at 50% 50%, ${colorWithAlpha(colorC, 0.9)} 0%, transparent 55%)`,
        `linear-gradient(${angle}deg, ${colorA}, ${colorB} 50%, ${colorC})`,
    ].join(", ")

    const backgroundSize = "250% 250%, 250% 250%, 250% 250%, 300% 300%"

    // ── Build CSS animation string ───────────────────────────────────
    const animationParts: string[] = []
    animationParts.push(`af-${id} ${flowDuration}s ease-in-out infinite`)
    if (glow) {
        animationParts.push(`ag-${id} ${glowDuration}s ease-in-out infinite`)
    }
    if (breathing) {
        animationParts.push(`ab-${id} ${breatheDuration}s ease-in-out infinite`)
    }

    // ── Generate scoped CSS keyframes ────────────────────────────────
    const keyframeCSS = useMemo(
        () =>
            generateKeyframes(
                id,
                colorA,
                colorB,
                colorC,
                glow,
                glowIntensity,
                breathing
            ),
        [id, colorA, colorB, colorC, glow, glowIntensity, breathing]
    )

    // ── Hover ────────────────────────────────────────────────────────
    const [isHovered, setIsHovered] = useState(false)

    const hoverVariants = useMemo(() => {
        switch (hoverEffect) {
            case "lift":
                return { y: -4 }
            case "scale":
                return { scale: 1.05 }
            case "glow":
                return { scale: 1 }
            default:
                return {}
        }
    }, [hoverEffect])

    const glowHoverFilter = useMemo((): string => {
        if (hoverEffect !== "glow") return "none"
        if (!isHovered) {
            return `drop-shadow(0 0 0px ${colorWithAlpha(colorA, 0)}) drop-shadow(0 0 0px ${colorWithAlpha(colorB, 0)})`
        }
        return `drop-shadow(0 0 10px ${colorWithAlpha(colorA, 0.18)}) drop-shadow(0 0 20px ${colorWithAlpha(colorB, 0.1)})`
    }, [hoverEffect, isHovered, colorA, colorB])

    // ── Static / canvas preview ──────────────────────────────────────
    if (isStatic) {
        return (
            <StaticPreview
                text={text}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                fontSize={fontSize}
                letterSpacing={letterSpacing}
                lineHeight={lineHeight}
                textAlign={textAlign}
                justifyContent={justifyContent}
                colorA={colorA}
                colorB={colorB}
                colorC={colorC}
                glowEnabled={glow}
                glowIntensity={glowIntensity}
                showLines={showLines}
                lineThickness={lineThickness}
                style={style}
            />
        )
    }

    // ── willChange ───────────────────────────────────────────────────
    const willChangeValues: string[] = ["background-position"]
    if (glow) willChangeValues.push("text-shadow")
    if (breathing) willChangeValues.push("transform")

    // ── Live render ──────────────────────────────────────────────────
    return (
        <motion.div
            ref={containerRef}
            whileHover={hoverEffect !== "none" ? hoverVariants : undefined}
            onMouseEnter={() => {
                if (hoverEffect === "glow") setIsHovered(true)
            }}
            onMouseLeave={() => {
                if (hoverEffect === "glow") setIsHovered(false)
            }}
            transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
            }}
            style={{
                ...style,
                display: "flex",
                justifyContent,
                alignItems: "center",
                width: "100%",
                isolation: "isolate",
                zIndex: 0,
                cursor: hoverEffect !== "none" ? "pointer" : "default",
                position: "relative",
                filter: glowHoverFilter,
                transition: "filter 1s cubic-bezier(0.16, 1, 0.3, 1)",
                overflow: "visible",
                clipPath: "none",
            }}
        >
            <style>{keyframeCSS}</style>

            {/* Aurora gradient text */}
            <span
                style={{
                    fontFamily,
                    fontWeight: fontWeight as any,
                    fontSize,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight,
                    textAlign,
                    whiteSpace: "pre-wrap",
                    padding: `${topPad}px ${sidePad}px ${bottomPad}px`,
                    display: "inline-block",
                    background: gradientBackground,
                    backgroundSize,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: animationParts.join(", "),
                    animationPlayState: playState,
                    willChange: willChangeValues.join(", "),
                    overflow: "visible",
                }}
            >
                {text}
            </span>

            {/* Accent underline — draws from center, holds, retracts */}
            {showLines && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 2,
                        left: "10%",
                        right: "10%",
                        height: lineThickness,
                        borderRadius: lineThickness / 2,
                        pointerEvents: "none",
                        background: `linear-gradient(90deg, ${colorA}, ${colorB}, ${colorC})`,
                        transformOrigin: "center",
                        animation: `al-${id} ${lineDuration}s ease-in-out infinite`,
                        animationPlayState: playState,
                    }}
                />
            )}
        </motion.div>
    )
}

TextAurora.displayName = "Text Aurora"

// =============================================================================
// DEFAULT PROPS
// =============================================================================

TextAurora.defaultProps = {
    text: "AURORA",
    fontSize: 96,
    letterSpacing: -2,
    lineHeight: 1.1,
    textAlign: "center",
    preset: "borealis",
    colors: {
        colorA: "#00FF88",
        colorB: "#8B5CF6",
        colorC: "#06B6D4",
    },
    speed: 1,
    angle: 45,
    glow: true,
    glowIntensity: 12,
    breathing: false,
    showLines: true,
    lineThickness: 3,
    hoverEffect: "glow",
}

// =============================================================================
// PROPERTY CONTROLS
// =============================================================================

addPropertyControls(TextAurora, {
    // ═════════════════════════════════════════════════════════════════════
    // ESSENTIAL CONTROLS
    // ═════════════════════════════════════════════════════════════════════
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "AURORA",
        displayTextArea: true,
        description: "Supports line breaks for multi-line text",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 96,
        min: 20,
        max: 300,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -2,
        min: -10,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.1,
        min: 0.7,
        max: 2,
        step: 0.05,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description: " ",
    },

    // ═════════════════════════════════════════════════════════════════════
    // THEME
    // ═════════════════════════════════════════════════════════════════════
    preset: {
        type: ControlType.Enum,
        title: "Theme",
        options: [
            "custom",
            "borealis",
            "sunset",
            "ocean",
            "iridescent",
            "ember",
            "mono",
        ],
        optionTitles: [
            "Custom",
            "🌌 Borealis",
            "🌅 Sunset",
            "🌊 Ocean",
            "✨ Iridescent",
            "🔥 Ember",
            "◻️ Mono",
        ],
        defaultValue: "borealis",
        description: "Choose a theme or customize colors below",
    },

    // ═════════════════════════════════════════════════════════════════════
    // COLORS (hidden when preset ≠ custom)
    // ═════════════════════════════════════════════════════════════════════
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            colorA: {
                type: ControlType.Color,
                title: "Color A",
                defaultValue: "#00FF88",
            },
            colorB: {
                type: ControlType.Color,
                title: "Color B",
                defaultValue: "#8B5CF6",
            },
            colorC: {
                type: ControlType.Color,
                title: "Color C",
                defaultValue: "#06B6D4",
            },
        },
        hidden: (props: Props) => props.preset !== "custom",
        description: " ",
    },

    // ═════════════════════════════════════════════════════════════════════
    // ANIMATION
    // ═════════════════════════════════════════════════════════════════════
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
        description: "Animation speed multiplier",
    },
    angle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 45,
        min: 0,
        max: 360,
        step: 5,
        unit: "°",
        description: "Direction of the base gradient flow",
    },

    // ═════════════════════════════════════════════════════════════════════
    // GLOW
    // ═════════════════════════════════════════════════════════════════════
    glow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 12,
        min: 2,
        max: 30,
        step: 1,
        unit: "px",
        hidden: (props: Props) => !props.glow,
        description: "Radius of the color-cycling glow",
    },

    // ═════════════════════════════════════════════════════════════════════
    // EXTRAS
    // ═════════════════════════════════════════════════════════════════════
    breathing: {
        type: ControlType.Boolean,
        title: "Breathing",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Subtle scale pulse that makes text feel alive",
    },
    showLines: {
        type: ControlType.Boolean,
        title: "Accent Line",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Animated underline that draws from center",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 0.5,
        unit: "px",
        hidden: (props: Props) => !props.showLines,
        description: "Thickness of the accent underline",
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["none", "glow", "lift", "scale"],
        optionTitles: ["None", "Glow", "Lift", "Scale"],
        defaultValue: "glow",
    },
})
