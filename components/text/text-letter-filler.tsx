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
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"

// =============================================================================
// TYPES
// =============================================================================

type TriggerMode = "onView" | "onHover" | "loop"
type FillDirection = "ltr" | "rtl" | "random"
type TextAlign = "left" | "center" | "right"
type Preset = "custom" | "minimal" | "neon" | "gold" | "frost"
type HoverEffect = "none" | "glow" | "lift" | "scale"

interface ColorsConfig {
    fillColor: string
    outlineColor: string
    glowColor: string
}

interface StrokeGlowConfig {
    strokeWidth: number
    glow: boolean
    glowIntensity: number
}

interface AnimationConfig {
    trigger: TriggerMode
    direction: FillDirection
    staggerDelay: number
    fillDuration: number
    loopPause: number
}

interface Props {
    text: string
    fontFamily?: {
        fontFamily?: string
        fontWeight?: number | string
    }
    fontSize: number
    textAlign: TextAlign
    preset: Preset
    colors: ColorsConfig
    strokeGlow: StrokeGlowConfig
    animation: AnimationConfig
    glowRadius: number
    hoverEffect: HoverEffect
    style?: React.CSSProperties
}

// =============================================================================
// PRESET DEFINITIONS
// =============================================================================

interface PresetValues {
    fillColor: string
    outlineColor: string
    glowColor: string
    strokeWidth: number
    glow: boolean
    glowIntensity: number
}

const PRESETS: Record<Exclude<Preset, "custom">, PresetValues> = {
    minimal: {
        fillColor: "#FFFFFF",
        outlineColor: "rgba(255,255,255,0.25)",
        glowColor: "#FFFFFF",
        strokeWidth: 1,
        glow: false,
        glowIntensity: 8,
    },
    neon: {
        fillColor: "#00FFFF",
        outlineColor: "rgba(0,255,255,0.4)",
        glowColor: "#00FFFF",
        strokeWidth: 1.5,
        glow: true,
        glowIntensity: 18,
    },
    gold: {
        fillColor: "#FFD700",
        outlineColor: "rgba(255,200,100,0.35)",
        glowColor: "#FFAA00",
        strokeWidth: 1.5,
        glow: true,
        glowIntensity: 14,
    },
    frost: {
        fillColor: "#E0EEFF",
        outlineColor: "rgba(180,210,255,0.3)",
        glowColor: "#A0C8FF",
        strokeWidth: 1,
        glow: true,
        glowIntensity: 10,
    },
}

// =============================================================================
// SHUFFLE UTILITY
// =============================================================================

function shuffleIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
}

// =============================================================================
// LETTER COMPONENT — Dual-layer clip-path + separate glow layer
// =============================================================================

interface LetterProps {
    char: string
    filled: boolean
    fillColor: string
    outlineColor: string
    strokeWidth: number
    fillDuration: number
    glow: boolean
    glowColor: string
    glowIntensity: number
    fontFamily: string
    fontWeight: number | string
    fontSize: number
    isSpace: boolean
}

const Letter: React.FC<LetterProps> = React.memo(
    ({
        char,
        filled,
        fillColor,
        outlineColor,
        strokeWidth,
        fillDuration,
        glow,
        glowColor,
        glowIntensity,
        fontFamily,
        fontWeight,
        fontSize,
        isSpace,
    }) => {
        if (isSpace) {
            return (
                <span
                    style={{
                        display: "inline-block",
                        width: fontSize * 0.3,
                    }}
                />
            )
        }

        const typoStyle: React.CSSProperties = {
            fontFamily,
            fontWeight: fontWeight as any,
            fontSize,
            lineHeight: 1.2,
            letterSpacing: "0.02em",
            whiteSpace: "pre",
        }

        return (
            <motion.span
                style={{
                    display: "inline-block",
                    position: "relative",
                    overflow: "visible",
                }}
                animate={{
                    y: filled ? [0, -3, 0] : 0,
                    scale: filled ? [1, 1.05, 1] : 1,
                }}
                transition={{
                    y: {
                        duration: fillDuration * 0.7,
                        ease: [0.22, 1, 0.36, 1],
                    },
                    scale: {
                        duration: fillDuration * 0.8,
                        ease: [0.22, 1, 0.36, 1],
                    },
                }}
            >
                {/* Layer 1: Outline — always visible */}
                <span
                    style={{
                        ...typoStyle,
                        display: "inline-block",
                        color: "transparent",
                        WebkitTextStroke: `${strokeWidth}px ${outlineColor}`,
                    }}
                >
                    {char}
                </span>

                {/* Layer 2: Fill — clip-path reveal bottom→top (no shadow here) */}
                <motion.span
                    aria-hidden="true"
                    initial={{ clipPath: "inset(100% 0 0 0)" }}
                    animate={{
                        clipPath: filled
                            ? "inset(0% 0 0 0)"
                            : "inset(100% 0 0 0)",
                    }}
                    transition={{
                        clipPath: {
                            duration: fillDuration,
                            ease: [0.22, 1, 0.36, 1],
                        },
                    }}
                    style={{
                        ...typoStyle,
                        display: "inline-block",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        color: fillColor,
                        WebkitTextStroke: `${strokeWidth}px ${fillColor}`,
                        willChange: "clip-path",
                    }}
                >
                    {char}
                </motion.span>

                {/* Layer 3: Glow — opacity fade-in (NOT clip-pathed = no sharp edges) */}
                {glow && (
                    <motion.span
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: filled ? 1 : 0 }}
                        transition={{
                            opacity: {
                                duration: fillDuration * 0.8,
                                delay: filled ? fillDuration * 0.25 : 0,
                                ease: "easeOut",
                            },
                        }}
                        style={{
                            ...typoStyle,
                            display: "inline-block",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            color: glowColor,
                            WebkitTextStroke: `0.5px ${glowColor}`,
                            textShadow: `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${glowColor}, 0 0 ${glowIntensity * 3.5}px ${glowColor}`,
                            pointerEvents: "none",
                            zIndex: -1,
                            willChange: "opacity",
                        }}
                    >
                        {char}
                    </motion.span>
                )}
            </motion.span>
        )
    }
)

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Text Letter Filler
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TextLetterFiller(props: Props) {
    const {
        text = "Hello World",
        fontFamily: fontFamilyProp,
        fontSize = 64,
        textAlign = "center",
        preset = "custom",
        colors = {} as ColorsConfig,
        strokeGlow = {} as StrokeGlowConfig,
        animation = {} as AnimationConfig,
        glowRadius = 8,
        hoverEffect = "none",
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ── Resolve preset vs custom ─────────────────────────────────────
    const pv = preset !== "custom" ? PRESETS[preset] : null

    const fillColor = pv?.fillColor ?? colors.fillColor ?? "#FFFFFF"
    const outlineColor =
        pv?.outlineColor ?? colors.outlineColor ?? "rgba(255,255,255,0.35)"
    const glowColor = pv?.glowColor ?? colors.glowColor ?? "#FFFFFF"
    const strokeWidth = pv?.strokeWidth ?? strokeGlow.strokeWidth ?? 1.5
    const glow = pv?.glow ?? strokeGlow.glow ?? false
    const glowIntensity = glowRadius

    // Animation values
    const trigger = animation.trigger ?? "onView"
    const direction = animation.direction ?? "ltr"
    const staggerDelay = animation.staggerDelay ?? 0.07
    const fillDuration = animation.fillDuration ?? 0.6
    const loopPause = animation.loopPause ?? 2

    // ── Font ──────────────────────────────────────────────────────────
    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        : "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
    const fontWeight = fontFamilyProp?.fontWeight || 600

    // ── Refs & state ─────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.4 })
    const [isHovered, setIsHovered] = useState(false)
    const [filledSet, setFilledSet] = useState<Set<number>>(new Set())
    const [animationKey, setAnimationKey] = useState(0)
    const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

    const characters = useMemo(() => text.split(""), [text])

    const staggerOrder = useMemo(() => {
        const len = characters.length
        switch (direction) {
            case "rtl":
                return Array.from({ length: len }, (_, i) => len - 1 - i)
            case "random":
                return shuffleIndices(len)
            default:
                return Array.from({ length: len }, (_, i) => i)
        }
    }, [characters.length, direction, animationKey])

    // ── Timer management ─────────────────────────────────────────────
    const clearTimers = useCallback(() => {
        timerRefs.current.forEach(clearTimeout)
        timerRefs.current = []
    }, [])

    // ── Run fill sequence ────────────────────────────────────────────
    const runFillSequence = useCallback(() => {
        clearTimers()
        setFilledSet(new Set())

        staggerOrder.forEach((charIndex, orderIndex) => {
            const delay = orderIndex * staggerDelay * 1000
            const timer = setTimeout(() => {
                setFilledSet((prev) => {
                    const next = new Set(prev)
                    next.add(charIndex)
                    return next
                })
            }, delay)
            timerRefs.current.push(timer)
        })

        return staggerOrder.length * staggerDelay * 1000 + fillDuration * 1000
    }, [staggerOrder, staggerDelay, fillDuration, clearTimers])

    const resetAnimation = useCallback(() => {
        clearTimers()
        setFilledSet(new Set())
    }, [clearTimers])

    // ── Triggers ─────────────────────────────────────────────────────
    useEffect(() => {
        if (isCanvas || trigger !== "onView") return
        if (isInView) runFillSequence()
        else resetAnimation()
        return clearTimers
    }, [
        isInView,
        trigger,
        isCanvas,
        runFillSequence,
        resetAnimation,
        clearTimers,
    ])

    useEffect(() => {
        if (isCanvas || trigger !== "onHover") return
        if (isHovered) runFillSequence()
        else resetAnimation()
        return clearTimers
    }, [
        isHovered,
        trigger,
        isCanvas,
        runFillSequence,
        resetAnimation,
        clearTimers,
    ])

    useEffect(() => {
        if (isCanvas || trigger !== "loop") return
        let cancelled = false

        const loopCycle = () => {
            if (cancelled) return
            const totalDuration = runFillSequence()

            const waitTimer = setTimeout(
                () => {
                    if (cancelled) return
                    resetAnimation()
                    const restartTimer = setTimeout(() => {
                        if (cancelled) return
                        setAnimationKey((k) => k + 1)
                        loopCycle()
                    }, 500)
                    timerRefs.current.push(restartTimer)
                },
                totalDuration + loopPause * 1000
            )
            timerRefs.current.push(waitTimer)
        }

        loopCycle()
        return () => {
            cancelled = true
            clearTimers()
        }
    }, [
        trigger,
        loopPause,
        isCanvas,
        runFillSequence,
        resetAnimation,
        clearTimers,
        animationKey,
    ])

    // ── Alignment ────────────────────────────────────────────────────
    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    // ── Hover effect variants ────────────────────────────────────────
    const hoverVariants = useMemo(() => {
        switch (hoverEffect) {
            case "glow":
                return {
                    filter: `drop-shadow(0 0 ${Math.max(glowIntensity, 10)}px ${glowColor}80) drop-shadow(0 0 ${Math.max(glowIntensity * 2, 20)}px ${glowColor}30)`,
                }
            case "lift":
                return { y: -4 }
            case "scale":
                return { scale: 1.05 }
            default:
                return {}
        }
    }, [hoverEffect, glowIntensity, glowColor])

    // ── Canvas preview ───────────────────────────────────────────────
    if (isCanvas) {
        const halfCount = Math.ceil(characters.length * 0.55)
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent,
                    alignItems: "center",
                    width: "100%",
                    position: "relative",
                    overflow: "visible",
                }}
            >
                {characters.map((char, i) => {
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

                    const filled = i < halfCount
                    const isTransitioning = i === halfCount - 1

                    return (
                        <span
                            key={i}
                            style={{
                                display: "inline-block",
                                position: "relative",
                                overflow: "visible",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    color: "transparent",
                                    WebkitTextStroke: `${strokeWidth}px ${outlineColor}`,
                                    fontFamily,
                                    fontWeight: fontWeight as any,
                                    fontSize,
                                    lineHeight: 1.2,
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {char}
                            </span>

                            {filled && (
                                <span
                                    style={{
                                        display: "inline-block",
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        color: fillColor,
                                        WebkitTextStroke: `${strokeWidth}px ${fillColor}`,
                                        fontFamily,
                                        fontWeight: fontWeight as any,
                                        fontSize,
                                        lineHeight: 1.2,
                                        letterSpacing: "0.02em",
                                        clipPath: isTransitioning
                                            ? "inset(45% 0 0 0)"
                                            : "inset(0% 0 0 0)",
                                    }}
                                >
                                    {char}
                                </span>
                            )}

                            {glow && filled && !isTransitioning && (
                                <span
                                    style={{
                                        display: "inline-block",
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        color: glowColor,
                                        WebkitTextStroke: `0.5px ${glowColor}`,
                                        fontFamily,
                                        fontWeight: fontWeight as any,
                                        fontSize,
                                        lineHeight: 1.2,
                                        letterSpacing: "0.02em",
                                        textShadow: `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${glowColor}`,
                                        pointerEvents: "none",
                                        zIndex: -1,
                                    }}
                                >
                                    {char}
                                </span>
                            )}
                        </span>
                    )
                })}
            </div>
        )
    }

    // ── Live render ──────────────────────────────────────────────────
    return (
        <motion.div
            ref={containerRef}
            onMouseEnter={() => {
                if (trigger === "onHover") setIsHovered(true)
            }}
            onMouseLeave={() => {
                if (trigger === "onHover") setIsHovered(false)
            }}
            whileHover={hoverEffect !== "none" ? hoverVariants : undefined}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
                ...style,
                display: "flex",
                flexWrap: "wrap",
                justifyContent,
                alignItems: "center",
                width: "100%",
                cursor:
                    trigger === "onHover" || hoverEffect !== "none"
                        ? "pointer"
                        : "default",
                isolation: "isolate",
                position: "relative",
                overflow: "visible",
            }}
        >
            {characters.map((char, i) => {
                const isSpace = char === " "
                return (
                    <Letter
                        key={`${animationKey}-${i}`}
                        char={char}
                        filled={filledSet.has(i)}
                        fillColor={fillColor}
                        outlineColor={outlineColor}
                        strokeWidth={strokeWidth}
                        fillDuration={fillDuration}
                        glow={glow}
                        glowColor={glowColor}
                        glowIntensity={glowIntensity}
                        fontFamily={fontFamily}
                        fontWeight={fontWeight}
                        fontSize={fontSize}
                        isSpace={isSpace}
                    />
                )
            })}
        </motion.div>
    )
}

TextLetterFiller.displayName = "Text Letter Filler"

// =============================================================================
// DEFAULT PROPS
// =============================================================================

TextLetterFiller.defaultProps = {
    text: "Hello World",
    fontSize: 64,
    textAlign: "center",
    preset: "custom",
    colors: {
        fillColor: "#FFFFFF",
        outlineColor: "rgba(255,255,255,0.35)",
        glowColor: "#FFFFFF",
    },
    strokeGlow: {
        strokeWidth: 1.5,
        glow: false,
    },
    animation: {
        trigger: "onView",
        direction: "ltr",
        staggerDelay: 0.07,
        fillDuration: 0.6,
        loopPause: 2,
    },
    glowRadius: 8,
    hoverEffect: "none",
}

// =============================================================================
// PROPERTY CONTROLS
// =============================================================================

addPropertyControls(TextLetterFiller, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello World",
        displayTextArea: true,
    },

    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 64,
        min: 16,
        max: 200,
        step: 2,
        unit: "px",
        displayStepper: true,
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

    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["custom", "minimal", "neon", "gold", "frost"],
        optionTitles: ["Custom", "Minimal", "✨ Neon", "🥇 Gold", "❄️ Frost"],
        defaultValue: "custom",
        description: "Choose a preset or customize below",
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            fillColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline",
                defaultValue: "rgba(255,255,255,0.35)",
            },
            glowColor: {
                type: ControlType.Color,
                title: "Glow",
                defaultValue: "#FFFFFF",
            },
        },
        hidden: (props: Props) => props.preset !== "custom",
    },

    strokeGlow: {
        type: ControlType.Object,
        title: "Stroke & Glow",
        icon: "effect",
        controls: {
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                defaultValue: 1.5,
                min: 0.5,
                max: 6,
                step: 0.5,
                unit: "px",
            },
            glow: {
                type: ControlType.Boolean,
                title: "Glow",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        hidden: (props: Props) => props.preset !== "custom",
        description: " ",
    },

    glowRadius: {
        type: ControlType.Number,
        title: "Glow Radius",
        defaultValue: 8,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
        description: "Size of the glow effect around letters",
        hidden: (props: Props) => {
            if (props.preset === "custom")
                return !(props.strokeGlow as any)?.glow
            const pv = PRESETS[props.preset as Exclude<Preset, "custom">]
            return !pv?.glow
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Animation",
        icon: "effect",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Trigger",
                options: ["onView", "onHover", "loop"],
                optionTitles: ["On View", "On Hover", "Loop"],
                defaultValue: "onView",
                description: "When to start the fill animation",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["ltr", "rtl", "random"],
                optionTitles: ["Left → Right", "Right → Left", "Random"],
                defaultValue: "ltr",
            },
            staggerDelay: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 0.07,
                min: 0.02,
                max: 0.5,
                step: 0.01,
                unit: "s",
                description: "Delay between each letter",
            },
            fillDuration: {
                type: ControlType.Number,
                title: "Fill Speed",
                defaultValue: 0.6,
                min: 0.1,
                max: 2,
                step: 0.05,
                unit: "s",
                description: "How long each letter takes to fill",
            },
            loopPause: {
                type: ControlType.Number,
                title: "Loop Pause",
                defaultValue: 2,
                min: 0.5,
                max: 10,
                step: 0.5,
                unit: "s",
                displayStepper: true,
                description: "Pause before the animation restarts",
                hidden: (animProps: AnimationConfig) =>
                    animProps.trigger !== "loop",
            },
        },
        description: " ",
    },

    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["none", "glow", "lift", "scale"],
        optionTitles: ["None", "Glow", "Lift", "Scale"],
        defaultValue: "none",
        description: "Visual effect when hovering the text",
    },
})
