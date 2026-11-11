// ═══════════════════════════════════════════════════════════════════════════
// TEXT HOVER EFFECTS — PER-CHARACTER INTERACTIVE TEXT ANIMATION
// ═══════════════════════════════════════════════════════════════════════════
//
// WHAT THIS COMPONENT DOES:
// Splits text into individual characters and applies one of five distinct
// hover animations. Each effect is neighbor-aware: adjacent letters react
// with a graduated falloff, creating organic ripple behavior.
//
// WHY CODE IS REQUIRED:
// - Per-character text splitting with global flat indices for neighbor lookup.
// - Signed delta (not just distance) needed for directional effects (Magnetic).
// - Imperative Framer Motion animate() on DOM refs — zero React re-renders
//   on hover (no useState, no motion.span, no virtual DOM diffing on input).
// - Diff of prevAffected ↔ newAffected sets: only the minimum DOM nodes are
//   touched per hover event instead of all characters every time.
// - Spring vs ease transition swapped dynamically per preset.
// - Color interpolation via animate() for Color Ripple layer.
//
// PRESETS:
// - Bounce   — scaleY + spring physics (bouncy overshoot)
// - Scale    — scaleY stretch, neighbor wave (original GSAP effect)
// - Jelly    — scaleY stretch + scaleX squish (rubber band / elastic)
// - Tilt     — skewX italic lean, neighbors tilt less
// - Magnetic — neighbors pulled toward hovered letter (translateX)
//
// COLOR RIPPLE (optional layer on any preset):
// - Hovered letter transitions to accent color via Framer Motion interpolation
//
// ═══════════════════════════════════════════════════════════════════════════
// Created by AliThemes.com
// Powered by Framer
// ═══════════════════════════════════════════════════════════════════════════

import * as React from "react"
import { useRef, useMemo, useCallback, useEffect } from "react"
import { animate } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Types ──────────────────────────────────────────────────────────────────

type CharToken = { char: string; index: number }
type SpaceGroup = { isSpace: true; key: string }
type WordGroup = { isSpace: false; key: string; chars: CharToken[] }
type TokenGroup = SpaceGroup | WordGroup

type Preset = "Scale" | "Jelly" | "Tilt" | "Magnetic" | "Bounce"

type AnimState = {
    scaleY: number
    scaleX: number
    skewX: number
    x: number
    y: number
    color?: string
}

interface Props {
    text?: string
    font?: Record<string, unknown>
    color?: string
    preset?: Preset
    centerScaleY?: number
    neighborScaleY?: number
    tiltAngle?: number
    magnetStrength?: number
    neighborDistance?: number
    duration?: number
    colorRipple?: boolean
    accentColor?: string
    htmlTag?: string
    style?: React.CSSProperties
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_TEXT = "TOUCH ME TO FLEX"
const SINE_EASE: [number, number, number, number] = [0.37, 0, 0.63, 1]
const BASE_ANIM: AnimState = { scaleY: 1, scaleX: 1, skewX: 0, x: 0, y: 0 }

// ── Component ──────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TextHoverEffects(props: Props) {
    const {
        text = DEFAULT_TEXT,
        font,
        color = "#1a1a1a",
        preset = "Bounce",
        centerScaleY = 1.6,
        neighborScaleY = 1.3,
        tiltAngle = 15,
        magnetStrength = 12,
        neighborDistance = 1,
        duration = 0.4,
        colorRipple = false,
        accentColor = "#6d28d9",
        htmlTag = "div",
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    // Refs to every letter DOM element (indexed by flat global letter index)
    const letterEls = useRef<(HTMLElement | null)[]>([])
    // Tracks which index is currently hovered — no setState, no re-renders
    const hoveredRef = useRef<number | null>(null)

    // ── Text splitting ─────────────────────────────────────────────────────

    const wordGroups = useMemo<TokenGroup[]>(() => {
        const tokens = String(text).split(/(\s+)/)
        let letterIndex = 0
        return tokens.map((token, gi): TokenGroup => {
            if (/^\s+$/.test(token)) {
                return { isSpace: true, key: `space-${gi}` }
            }
            const chars: CharToken[] = Array.from(token).map((char) => ({
                char,
                index: letterIndex++,
            }))
            return { isSpace: false, key: `word-${gi}`, chars }
        })
    }, [text])

    const totalLetters = useMemo(() => {
        let count = 0
        wordGroups.forEach((g) => {
            if (!g.isSpace) count += (g as WordGroup).chars.length
        })
        return count
    }, [wordGroups])

    // ── Animation helpers ──────────────────────────────────────────────────

    // Returns the set of letter indices affected by hovering at `center`
    const getAffectedIndices = useCallback(
        (center: number | null): Set<number> => {
            if (center === null) return new Set()
            const result = new Set<number>()
            for (let d = 0; d <= neighborDistance; d++) {
                const left = center - d
                const right = center + d
                if (left >= 0) result.add(left)
                if (d > 0 && right < totalLetters) result.add(right)
            }
            return result
        },
        [neighborDistance, totalLetters]
    )

    // Computes the target AnimState for a letter given the current hover center
    const computeLetterState = useCallback(
        (index: number, hoveredIndex: number): AnimState => {
            const delta = index - hoveredIndex
            const distance = Math.abs(delta)
            const direction = Math.sign(delta)
            const t = distance === 0 ? 1 : 1 - (distance - 1) / neighborDistance

            let state: AnimState = { ...BASE_ANIM }

            if (distance === 0) {
                switch (preset) {
                    case "Scale":
                        state = { ...BASE_ANIM, scaleY: centerScaleY }
                        break
                    case "Jelly":
                        state = {
                            ...BASE_ANIM,
                            scaleY: centerScaleY,
                            scaleX: Math.max(
                                0.5,
                                1 - (centerScaleY - 1) * 0.45
                            ),
                        }
                        break
                    case "Tilt":
                        state = {
                            ...BASE_ANIM,
                            skewX: -tiltAngle,
                            scaleY: 1.08,
                        }
                        break
                    case "Magnetic":
                        state = { ...BASE_ANIM, scaleY: 1.2, y: -8 }
                        break
                    case "Bounce":
                        state = { ...BASE_ANIM, scaleY: centerScaleY }
                        break
                }
                if (colorRipple) state.color = accentColor
            } else {
                switch (preset) {
                    case "Scale":
                    case "Bounce": {
                        const s = 1 + (neighborScaleY - 1) * t
                        state = { ...BASE_ANIM, scaleY: s }
                        break
                    }
                    case "Jelly": {
                        const s = 1 + (neighborScaleY - 1) * t
                        state = {
                            ...BASE_ANIM,
                            scaleY: s,
                            scaleX: Math.max(0.85, 1 - (s - 1) * 0.25),
                        }
                        break
                    }
                    case "Tilt":
                        state = { ...BASE_ANIM, skewX: -tiltAngle * t * 0.5 }
                        break
                    case "Magnetic":
                        state = {
                            ...BASE_ANIM,
                            x: -direction * magnetStrength * t,
                        }
                        break
                }
                if (colorRipple) state.color = color
            }

            return state
        },
        [
            preset,
            centerScaleY,
            neighborScaleY,
            tiltAngle,
            magnetStrength,
            neighborDistance,
            colorRipple,
            accentColor,
            color,
        ]
    )

    // Imperatively animates a single DOM element to the given state
    const animateTo = useCallback(
        (el: HTMLElement, state: AnimState) => {
            if (isStatic) return
            const { color: stateColor, ...transforms } = state
            const target: Record<string, unknown> = { ...transforms }
            if (colorRipple && stateColor !== undefined)
                target.color = stateColor

            const opts =
                preset === "Bounce"
                    ? {
                          type: "spring" as const,
                          stiffness: 360,
                          damping: 14,
                          mass: 0.8,
                      }
                    : { duration, ease: SINE_EASE }

            animate(el, target, opts)
        },
        [preset, duration, colorRipple, isStatic]
    )

    // ── Event handlers (no setState — zero re-renders) ─────────────────────

    const baseState = useMemo(
        () => (colorRipple ? { ...BASE_ANIM, color } : BASE_ANIM),
        [colorRipple, color]
    )

    const handleMouseEnter = useCallback(
        (index: number) => {
            const prev = hoveredRef.current
            hoveredRef.current = index

            const prevSet = getAffectedIndices(prev)
            const nextSet = getAffectedIndices(index)

            // Reset only letters leaving the ripple zone (not re-entering it)
            prevSet.forEach((i) => {
                if (!nextSet.has(i)) {
                    const el = letterEls.current[i]
                    if (el) animateTo(el, baseState)
                }
            })

            // Animate letters entering or staying in the ripple zone
            nextSet.forEach((i) => {
                const el = letterEls.current[i]
                if (el) animateTo(el, computeLetterState(i, index))
            })
        },
        [getAffectedIndices, animateTo, computeLetterState, baseState]
    )

    const handleMouseLeave = useCallback(() => {
        const prev = hoveredRef.current
        hoveredRef.current = null
        getAffectedIndices(prev).forEach((i) => {
            const el = letterEls.current[i]
            if (el) animateTo(el, baseState)
        })
    }, [getAffectedIndices, animateTo, baseState])

    // ── Cleanup effects ────────────────────────────────────────────────────

    // When preset or animation params change in the Framer canvas, instantly
    // reset all letters so stale transform values don't linger on screen
    useEffect(() => {
        if (isStatic) return
        hoveredRef.current = null
        letterEls.current.forEach((el) => {
            if (el) animate(el, baseState, { duration: 0 })
        })
    }, [
        preset,
        centerScaleY,
        neighborScaleY,
        tiltAngle,
        magnetStrength,
        neighborDistance,
        colorRipple,
        accentColor,
        color,
    ])

    // When text changes, clear the hover ref (old indices are now stale)
    useEffect(() => {
        hoveredRef.current = null
    }, [text])

    // ── Render ─────────────────────────────────────────────────────────────

    const transformOrigin =
        preset === "Tilt" || preset === "Magnetic"
            ? "center center"
            : "center bottom"

    const Tag = (htmlTag || "div") as React.ElementType
    const containerStyle: React.CSSProperties = {
        display: "inline-block",
        ...(font as React.CSSProperties),
        color,
        ...style,
    }

    return (
        // @ts-ignore — dynamic HTML tag
        <Tag style={containerStyle} onMouseLeave={handleMouseLeave}>
            {wordGroups.map((group) => {
                if (group.isSpace) {
                    return (
                        <span
                            key={group.key}
                            style={{ display: "inline-block" }}
                        >
                            {"\u00A0"}
                        </span>
                    )
                }

                return (
                    <span
                        key={group.key}
                        style={{ whiteSpace: "nowrap", display: "inline" }}
                    >
                        {group.chars.map(({ char, index }) => (
                            <span
                                key={index}
                                ref={(el) => {
                                    letterEls.current[index] = el
                                }}
                                onMouseEnter={() => handleMouseEnter(index)}
                                style={{
                                    display: "inline-block",
                                    transformOrigin,
                                    cursor: "default",
                                    willChange: "transform",
                                    // Set initial color on the element when colorRipple
                                    // is active so Framer Motion has a starting value
                                    ...(colorRipple ? { color } : {}),
                                }}
                            >
                                {char}
                            </span>
                        ))}
                    </span>
                )
            })}
        </Tag>
    )
}

// ── Defaults ───────────────────────────────────────────────────────────────

TextHoverEffects.defaultProps = {
    text: DEFAULT_TEXT,
    font: {
        fontFamily: "Inter",
        fontWeight: 900,
        fontSize: 80,
        lineHeight: "1em",
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
    },
    color: "#1a1a1a",
    preset: "Bounce",
    centerScaleY: 1.6,
    neighborScaleY: 1.3,
    tiltAngle: 15,
    magnetStrength: 12,
    neighborDistance: 1,
    duration: 0.4,
    colorRipple: false,
    accentColor: "#6d28d9",
    htmlTag: "div",
}

// ── Property Controls ──────────────────────────────────────────────────────

const isScale = (p: Props) =>
    p.preset === "Scale" || p.preset === "Bounce" || p.preset === "Jelly"
const isTilt = (p: Props) => p.preset === "Tilt"
const isMagnetic = (p: Props) => p.preset === "Magnetic"
const notBounce = (p: Props) => p.preset !== "Bounce"

addPropertyControls(TextHoverEffects, {
    // ── Content ────────────────────────────────────────────────────────────
    text: {
        type: ControlType.String,
        title: "Content",
        defaultValue: DEFAULT_TEXT,
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 900,
            fontSize: "80px",
            lineHeight: "1em",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#1a1a1a",
    },
    htmlTag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        defaultValue: "div",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "P", "DIV", "SPAN"],
    },

    // ── Effect ─────────────────────────────────────────────────────────────
    preset: {
        type: ControlType.Enum,
        title: "Effect",
        defaultValue: "Bounce",
        options: ["Bounce", "Scale", "Jelly", "Tilt", "Magnetic"],
        displaySegmentedControl: false,
        description:
            "Bounce — spring physics  •  Scale — scaleY wave  •  Jelly — stretch + squish  •  Tilt — italic skew  •  Magnetic — letters pull together",
    },

    // ── Scale / Jelly / Bounce ─────────────────────────────────────────────
    centerScaleY: {
        type: ControlType.Number,
        title: "Center Scale",
        defaultValue: 1.6,
        min: 1,
        max: 3,
        step: 0.05,
        description: "ScaleY of the hovered letter",
        hidden: (p) => !isScale(p),
    },
    neighborScaleY: {
        type: ControlType.Number,
        title: "Neighbor Scale",
        defaultValue: 1.3,
        min: 1,
        max: 3,
        step: 0.05,
        description: "ScaleY of adjacent letters",
        hidden: (p) => !isScale(p),
    },

    // ── Tilt ───────────────────────────────────────────────────────────────
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: 15,
        min: 1,
        max: 45,
        step: 1,
        unit: "°",
        description: "skewX angle in degrees",
        hidden: (p) => !isTilt(p),
    },

    // ── Magnetic ───────────────────────────────────────────────────────────
    magnetStrength: {
        type: ControlType.Number,
        title: "Pull Strength",
        defaultValue: 12,
        min: 1,
        max: 60,
        step: 1,
        unit: "px",
        description: "How far neighbors shift toward the hovered letter",
        hidden: (p) => !isMagnetic(p),
    },

    // ── Shared ─────────────────────────────────────────────────────────────
    neighborDistance: {
        type: ControlType.Number,
        title: "Ripple Width",
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 1,
        description: "How many neighbors are affected",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "Not used by Bounce (spring physics)",
        hidden: (p) => !notBounce(p),
    },

    // ── Color Ripple ───────────────────────────────────────────────────────
    colorRipple: {
        type: ControlType.Boolean,
        title: "Color Ripple",
        defaultValue: false,
        description: "Hovered letter switches to accent color",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#6d28d9",
        hidden: (p) => !p.colorRipple,
    },
})
