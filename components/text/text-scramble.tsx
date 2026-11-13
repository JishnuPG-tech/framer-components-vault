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
type TextAlign = "left" | "center" | "right"
type Preset = "custom" | "terminal" | "cipher" | "gold" | "frost"
type HoverEffect = "none" | "lift" | "scale" | "glow"
type CharPool =
    | "mixed"
    | "letters"
    | "numbers"
    | "binary"
    | "symbols"
    | "custom"

interface ColorsConfig {
    textColor: string
    scrambleColor: string
    glowColor: string
}

interface GlowConfig {
    enabled: boolean
    intensity: number
}

interface AnimationConfig {
    trigger: TriggerMode
    scrambleSpeed: number
    staggerDelay: number
    loopPause: number
    charPool: CharPool
    customChars: string
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
    glow: GlowConfig
    animation: AnimationConfig
    hoverEffect: HoverEffect
    style?: React.CSSProperties
}

// =============================================================================
// PRESET DEFINITIONS
// =============================================================================

interface PresetValues {
    textColor: string
    scrambleColor: string
    glowColor: string
    glowEnabled: boolean
    glowIntensity: number
}

const PRESETS: Record<Exclude<Preset, "custom">, PresetValues> = {
    terminal: {
        textColor: "#00FF41",
        scrambleColor: "#00CC33",
        glowColor: "#00FF41",
        glowEnabled: true,
        glowIntensity: 10,
    },
    cipher: {
        textColor: "#00FFFF",
        scrambleColor: "#0088AA",
        glowColor: "#00FFFF",
        glowEnabled: true,
        glowIntensity: 14,
    },
    gold: {
        textColor: "#FFD700",
        scrambleColor: "#CC9900",
        glowColor: "#FFAA00",
        glowEnabled: true,
        glowIntensity: 10,
    },
    frost: {
        textColor: "#E0EEFF",
        scrambleColor: "#8AB4E0",
        glowColor: "#A0C8FF",
        glowEnabled: true,
        glowIntensity: 8,
    },
}

// =============================================================================
// CHARACTER POOLS
// =============================================================================

const CHAR_POOLS: Record<Exclude<CharPool, "custom">, string> = {
    mixed: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&※░▒▓█◆◇○●",
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    binary: "01",
    symbols: "@#$%&※░▒▓█◆◇○●□■△▲▽▼◁◀▷▶★☆",
}

function getRandomChar(pool: string): string {
    return pool[Math.floor(Math.random() * pool.length)]
}

function shuffleIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
}

// =============================================================================
// CHARACTER COMPONENT — State-based rendering (no direct DOM manipulation)
// =============================================================================

interface CharProps {
    char: string
    resolved: boolean
    active: boolean
    scrambleColor: string
    textColor: string
    glowEnabled: boolean
    glowColor: string
    glowIntensity: number
    fontFamily: string
    fontWeight: number | string
    fontSize: number
    isSpace: boolean
    scramblePool: string
    scrambleSpeed: number
}

const ScrambleChar: React.FC<CharProps> = React.memo(
    ({
        char,
        resolved,
        active,
        scrambleColor,
        textColor,
        glowEnabled,
        glowColor,
        glowIntensity,
        fontFamily,
        fontWeight,
        fontSize,
        isSpace,
        scramblePool,
        scrambleSpeed,
    }) => {
        const [displayChar, setDisplayChar] = useState(char)
        const [charPhase, setCharPhase] = useState<
            "inactive" | "scrambling" | "settling" | "resolved"
        >("inactive")
        const [glowPhase, setGlowPhase] = useState<"none" | "flash" | "steady">(
            "none"
        )

        const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
        const settleChain = useRef<ReturnType<typeof setTimeout>[]>([])
        const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

        const clearAll = useCallback(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            settleChain.current.forEach(clearTimeout)
            settleChain.current = []
            if (glowTimer.current) {
                clearTimeout(glowTimer.current)
                glowTimer.current = null
            }
        }, [])

        useEffect(() => {
            if (isSpace) return
            clearAll()

            if (resolved) {
                // ── DECELERATION SETTLE ──────────────────────────────
                setCharPhase("settling")
                setGlowPhase("none")

                const maxSteps = 5 + Math.floor(Math.random() * 3)
                let step = 0

                const runSettle = () => {
                    step++
                    if (step > maxSteps) {
                        // Lock in final character
                        setCharPhase("resolved")
                        setDisplayChar(char)

                        // Glow flash → steady
                        if (glowEnabled) {
                            setGlowPhase("flash")
                            glowTimer.current = setTimeout(
                                () => setGlowPhase("steady"),
                                300
                            )
                        }
                        return
                    }

                    // Decelerating scramble
                    setDisplayChar(getRandomChar(scramblePool))
                    const delay = 35 + step * step * 10
                    const t = setTimeout(runSettle, delay)
                    settleChain.current.push(t)
                }

                const start = setTimeout(runSettle, 20)
                settleChain.current.push(start)
            } else if (active) {
                // ── SCRAMBLING ────────────────────────────────────────
                setCharPhase("scrambling")
                setGlowPhase("none")

                const ms = Math.max(30, 80 - scrambleSpeed * 6)
                setDisplayChar(getRandomChar(scramblePool))

                intervalRef.current = setInterval(() => {
                    setDisplayChar(getRandomChar(scramblePool))
                }, ms)
            } else {
                // ── INACTIVE ─────────────────────────────────────────
                setCharPhase("inactive")
                setGlowPhase("none")
                setDisplayChar(char)
            }

            return clearAll
        }, [
            resolved,
            active,
            char,
            isSpace,
            scramblePool,
            scrambleSpeed,
            glowEnabled,
            clearAll,
        ])

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

        // ── Derive visual properties from phase ──────────────────────
        const color = charPhase === "resolved" ? textColor : scrambleColor

        const opacity =
            charPhase === "inactive"
                ? 0
                : charPhase === "scrambling"
                  ? 0.55
                  : charPhase === "settling"
                    ? 0.75
                    : 1

        const blur =
            charPhase === "scrambling"
                ? "blur(0.6px)"
                : charPhase === "settling"
                  ? "blur(0.3px)"
                  : "none"

        let textShadow = "none"
        if (glowEnabled && glowPhase === "flash") {
            const fi = glowIntensity * 3
            textShadow = `0 0 ${fi}px ${glowColor}, 0 0 ${fi * 2}px ${glowColor}80, 0 0 ${fi * 3.5}px ${glowColor}30`
        } else if (glowEnabled && glowPhase === "steady") {
            textShadow = `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2.5}px ${glowColor}50`
        }

        return (
            <motion.span
                style={{
                    display: "inline-block",
                    fontFamily,
                    fontWeight: fontWeight as React.CSSProperties["fontWeight"],
                    fontSize,
                    lineHeight: 1.2,
                    letterSpacing: "0.02em",
                    whiteSpace: "pre",
                    color,
                    opacity,
                    filter: blur,
                    textShadow,
                    willChange: "transform, opacity, filter",
                    minWidth: fontSize * 0.15,
                    textAlign: "center" as const,
                    transition:
                        "color 0.15s ease-out, opacity 0.15s ease-out, filter 0.25s ease-out, text-shadow 0.15s ease-out",
                }}
                animate={
                    charPhase === "resolved"
                        ? {
                              y: [6, -3, 1, 0],
                              scale: [0.88, 1.15, 0.97, 1],
                          }
                        : charPhase === "scrambling"
                          ? { y: [0, -1, 1, 0] }
                          : { y: 0, scale: 1 }
                }
                transition={
                    charPhase === "resolved"
                        ? {
                              y: {
                                  duration: 0.5,
                                  ease: [0.175, 0.885, 0.32, 1.275],
                              },
                              scale: {
                                  duration: 0.55,
                                  ease: [0.175, 0.885, 0.32, 1.275],
                              },
                          }
                        : charPhase === "scrambling"
                          ? {
                                y: {
                                    duration: 1.5 + Math.random() * 0.5,
                                    repeat: Infinity,
                                    repeatType: "reverse" as const,
                                    ease: "easeInOut",
                                },
                            }
                          : { duration: 0.2 }
                }
            >
                {displayChar}
            </motion.span>
        )
    }
)

// =============================================================================
// CURSOR SWEEP
// =============================================================================

interface CursorSweepProps {
    progress: number
    active: boolean
    color: string
    glowColor: string
    glowEnabled: boolean
    glowIntensity: number
    fontSize: number
    containerWidth: number
}

const CursorSweep: React.FC<CursorSweepProps> = React.memo(
    ({
        progress,
        active,
        color,
        glowColor,
        glowEnabled,
        glowIntensity,
        fontSize,
        containerWidth,
    }) => {
        if (!active || progress >= 1) return null

        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0.5, 1, 0.5],
                        left: progress * containerWidth,
                    }}
                    transition={{
                        left: { duration: 0.06, ease: "linear" },
                        opacity: {
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        },
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 2,
                        height: fontSize * 1.2,
                        borderRadius: 1,
                        backgroundColor: color,
                        boxShadow: glowEnabled
                            ? `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2.5}px ${glowColor}50`
                            : "none",
                        zIndex: 10,
                    }}
                />
            </div>
        )
    }
)

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Text Scramble
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TextScramble(props: Props) {
    const {
        text = "Hello World",
        fontFamily: fontFamilyProp,
        fontSize = 64,
        textAlign = "center",
        preset = "frost",
        colors = {} as ColorsConfig,
        glow = {} as GlowConfig,
        animation = {} as AnimationConfig,
        hoverEffect = "glow",
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    // ── Resolve preset vs custom ─────────────────────────────────────
    const pv = preset !== "custom" ? PRESETS[preset] : null

    const textColor = pv?.textColor ?? colors.textColor ?? "#FFFFFF"
    const scrambleColor =
        pv?.scrambleColor ?? colors.scrambleColor ?? "rgba(255,255,255,0.4)"
    const glowColor = pv?.glowColor ?? colors.glowColor ?? "#FFFFFF"
    const glowEnabled = pv?.glowEnabled ?? glow.enabled ?? false
    const glowIntensity = pv?.glowIntensity ?? glow.intensity ?? 8

    // Animation values
    const trigger = animation.trigger ?? "loop"
    const scrambleSpeed = animation.scrambleSpeed ?? 8
    const staggerDelay = animation.staggerDelay ?? 0.06
    const loopPause = animation.loopPause ?? 4
    const charPool = animation.charPool ?? "mixed"
    const customChars = animation.customChars ?? "@#$%&"

    const scramblePool =
        charPool === "custom" ? customChars : CHAR_POOLS[charPool]

    // ── Font ──────────────────────────────────────────────────────────
    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        : "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
    const fontWeight = fontFamilyProp?.fontWeight || 600

    // ── Refs & state ─────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.4 })
    const [isHovered, setIsHovered] = useState(false)
    const [resolvedSet, setResolvedSet] = useState<Set<number>>(new Set())
    const [animationKey, setAnimationKey] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const [containerWidth, setContainerWidth] = useState(0)
    const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

    const characters = useMemo(() => text.split(""), [text])

    const nonSpaceIndices = useMemo(
        () =>
            characters
                .map((c, i) => (c === " " ? -1 : i))
                .filter((i) => i !== -1),
        [characters]
    )

    // Always LTR stagger — animationKey excluded since it doesn't affect the order
    const staggerOrder = useMemo(() => [...nonSpaceIndices], [nonSpaceIndices])

    const resolveProgress = useMemo(() => {
        if (nonSpaceIndices.length === 0) return 0
        return resolvedSet.size / nonSpaceIndices.length
    }, [resolvedSet.size, nonSpaceIndices.length])

    // ── Measure container ────────────────────────────────────────────
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new ResizeObserver(() => setContainerWidth(el.offsetWidth))
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    // ── Timer management ─────────────────────────────────────────────
    const clearTimers = useCallback(() => {
        timerRefs.current.forEach(clearTimeout)
        timerRefs.current = []
    }, [])

    // ── Run resolve sequence ─────────────────────────────────────────
    const runResolveSequence = useCallback(() => {
        clearTimers()
        setResolvedSet(new Set())
        setIsActive(true)

        staggerOrder.forEach((charIndex, orderIndex) => {
            const delay = orderIndex * staggerDelay * 1000
            const timer = setTimeout(() => {
                setResolvedSet((prev) => {
                    const next = new Set(prev)
                    next.add(charIndex)
                    return next
                })
            }, delay)
            timerRefs.current.push(timer)
        })

        return staggerOrder.length * staggerDelay * 1000 + 500
    }, [staggerOrder, staggerDelay, clearTimers])

    const resetAnimation = useCallback(() => {
        clearTimers()
        setResolvedSet(new Set())
        setIsActive(false)
    }, [clearTimers])

    // ── Triggers ─────────────────────────────────────────────────
    // All triggers are gated by both isStatic and isInView so that
    // animations/timers are paused when offscreen or in static contexts.
    useEffect(() => {
        if (isStatic || trigger !== "onView") return
        if (isInView) runResolveSequence()
        else resetAnimation()
        return clearTimers
    }, [
        isInView,
        trigger,
        isStatic,
        runResolveSequence,
        resetAnimation,
        clearTimers,
    ])

    useEffect(() => {
        if (isStatic || trigger !== "onHover") return
        if (!isInView) {
            resetAnimation()
            return
        }
        if (isHovered) runResolveSequence()
        else resetAnimation()
        return clearTimers
    }, [
        isHovered,
        isInView,
        trigger,
        isStatic,
        runResolveSequence,
        resetAnimation,
        clearTimers,
    ])

    useEffect(() => {
        if (isStatic || trigger !== "loop") return
        if (!isInView) {
            resetAnimation()
            return clearTimers
        }
        let cancelled = false

        const loopCycle = () => {
            if (cancelled) return
            const totalDuration = runResolveSequence()
            const waitTimer = setTimeout(
                () => {
                    if (cancelled) return
                    resetAnimation()
                    const restartTimer = setTimeout(() => {
                        if (cancelled) return
                        setAnimationKey((k) => k + 1)
                        loopCycle()
                    }, 600)
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
        isInView,
        isStatic,
        runResolveSequence,
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

    // ── Hover effect ─────────────────────────────────────────────────
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

    // Glow hover CSS
    const glowHoverStyle = useMemo(() => {
        if (hoverEffect !== "glow" || !isHovered) return {}
        const gc = pv?.glowColor ?? glowColor
        return {
            filter: `drop-shadow(0 0 12px ${gc}80) drop-shadow(0 0 24px ${gc}40)`,
            transition: "filter 0.35s ease",
        }
    }, [hoverEffect, isHovered, glowColor, pv])

    // ── Static / canvas preview ──────────────────────────────────────
    if (isStatic) {
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
                    const isResolved = i < halfCount
                    const displayChar = isResolved
                        ? char
                        : getRandomChar(scramblePool)
                    return (
                        <span
                            key={i}
                            style={{
                                display: "inline-block",
                                fontFamily,
                                fontWeight:
                                    fontWeight as React.CSSProperties["fontWeight"],
                                fontSize,
                                lineHeight: 1.2,
                                letterSpacing: "0.02em",
                                whiteSpace: "pre",
                                color: isResolved ? textColor : scrambleColor,
                                opacity: isResolved ? 1 : 0.45,
                                filter: isResolved ? "none" : "blur(0.6px)",
                                textShadow:
                                    isResolved && glowEnabled
                                        ? `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2.5}px ${glowColor}50`
                                        : "none",
                                minWidth: fontSize * 0.15,
                                textAlign: "center" as const,
                            }}
                        >
                            {displayChar}
                        </span>
                    )
                })}
                {/* Static cursor at resolve boundary */}
                <span
                    style={{
                        position: "absolute",
                        left: "55%",
                        top: "50%",
                        width: 2,
                        height: fontSize * 1.2,
                        borderRadius: 1,
                        backgroundColor: textColor,
                        transform: "translateY(-50%)",
                        opacity: 0.7,
                        boxShadow: glowEnabled
                            ? `0 0 ${glowIntensity}px ${glowColor}`
                            : "none",
                    }}
                />
            </div>
        )
    }

    // ── Live render ──────────────────────────────────────────────────
    return (
        <motion.div
            ref={containerRef}
            onMouseEnter={() => {
                if (trigger === "onHover") setIsHovered(true)
                if (hoverEffect === "glow") setIsHovered(true)
            }}
            onMouseLeave={() => {
                if (trigger === "onHover") setIsHovered(false)
                if (hoverEffect === "glow") setIsHovered(false)
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
                ...glowHoverStyle,
            }}
        >
            {characters.map((char, i) => {
                const isSpace = char === " "
                return (
                    <ScrambleChar
                        key={`${animationKey}-${i}`}
                        char={char}
                        resolved={resolvedSet.has(i)}
                        active={isActive}
                        scrambleColor={scrambleColor}
                        textColor={textColor}
                        glowEnabled={glowEnabled}
                        glowColor={glowColor}
                        glowIntensity={glowIntensity}
                        fontFamily={fontFamily}
                        fontWeight={fontWeight}
                        fontSize={fontSize}
                        isSpace={isSpace}
                        scramblePool={scramblePool}
                        scrambleSpeed={scrambleSpeed}
                    />
                )
            })}

            {/* Cursor sweep */}
            <CursorSweep
                progress={resolveProgress}
                active={isActive && resolveProgress < 1}
                color={textColor}
                glowColor={glowColor}
                glowEnabled={glowEnabled}
                glowIntensity={glowIntensity}
                fontSize={fontSize}
                containerWidth={containerWidth}
            />
        </motion.div>
    )
}

TextScramble.displayName = "Text Scramble"

// =============================================================================
// DEFAULT PROPS
// =============================================================================

TextScramble.defaultProps = {
    text: "Hello World",
    fontSize: 64,
    textAlign: "center",
    preset: "frost",
    colors: {
        textColor: "#FFFFFF",
        scrambleColor: "rgba(255,255,255,0.4)",
        glowColor: "#FFFFFF",
    },
    glow: {
        enabled: false,
        intensity: 8,
    },
    animation: {
        trigger: "loop",
        scrambleSpeed: 8,
        staggerDelay: 0.06,
        loopPause: 4,
        charPool: "mixed",
        customChars: "@#$%&",
    },
    hoverEffect: "glow",
}

// =============================================================================
// PROPERTY CONTROLS
// =============================================================================

addPropertyControls(TextScramble, {
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
        options: ["custom", "terminal", "cipher", "gold", "frost"],
        optionTitles: [
            "Custom",
            "💻 Terminal",
            "🔐 Cipher",
            "🥇 Gold",
            "❄️ Frost",
        ],
        defaultValue: "frost",
        description: "Choose a preset or customize below",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            scrambleColor: {
                type: ControlType.Color,
                title: "Scramble",
                defaultValue: "rgba(255,255,255,0.4)",
            },
            glowColor: {
                type: ControlType.Color,
                title: "Glow",
                defaultValue: "#FFFFFF",
            },
        },
        hidden: (props: Props) => props.preset !== "custom",
    },
    glow: {
        type: ControlType.Object,
        title: "Glow",
        icon: "effect",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 8,
                min: 2,
                max: 40,
                step: 1,
                unit: "px",
                description: "Radius of the glow effect",
            },
        },
        hidden: (props: Props) => props.preset !== "custom",
        description: " ",
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
                defaultValue: "loop",
                description: "When to start the scramble animation",
            },
            scrambleSpeed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 8,
                min: 1,
                max: 10,
                step: 1,
                description: "How fast characters cycle",
            },
            staggerDelay: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 0.06,
                min: 0.02,
                max: 0.3,
                step: 0.01,
                unit: "s",
                description: "Delay between each letter resolving",
            },
            loopPause: {
                type: ControlType.Number,
                title: "Loop Pause",
                defaultValue: 4,
                min: 0.5,
                max: 10,
                step: 0.5,
                unit: "s",
                displayStepper: true,
                hidden: (props: AnimationConfig) => props.trigger !== "loop",
                description: "Pause between loop cycles",
            },
            charPool: {
                type: ControlType.Enum,
                title: "Characters",
                options: [
                    "mixed",
                    "letters",
                    "numbers",
                    "binary",
                    "symbols",
                    "custom",
                ],
                optionTitles: [
                    "Mixed",
                    "Letters",
                    "Numbers",
                    "Binary",
                    "Symbols",
                    "Custom",
                ],
                defaultValue: "mixed",
                description: "Which characters appear during scramble",
            },
            customChars: {
                type: ControlType.String,
                title: "Custom Chars",
                defaultValue: "@#$%&",
                hidden: (props: AnimationConfig) => props.charPool !== "custom",
                description: "Your own characters to cycle through",
            },
        },
        description: " ",
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["none", "glow", "lift", "scale"],
        optionTitles: ["None", "Glow", "Lift", "Scale"],
        defaultValue: "glow",
    },
})
