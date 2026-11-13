import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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

/**
 * Focus Frame Text
 * Words are blurred and dimmed; one word at a time is sharp and wrapped
 * in a glowing corner-bracket frame that glides from word to word.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 200
 */

type EaseType = "spring" | "ease" | "linear"

interface Props {
    text: string
    typography: {
        font: React.CSSProperties
        textColor: string
        align: "left" | "center" | "right"
        wordGap: number
    }
    effect: {
        blur: number
        inactiveOpacity: number
        type: EaseType
        duration: number
        stiffness: number
        damping: number
    }
    frame: {
        color: string
        thickness: number
        cornerSize: number
        cornerRadius: number
        padding: string
        glow: boolean
        glowAmount: number
    }
    playback: {
        autoPlay: boolean
        startIndex: number
        holdTime: number
        loop: boolean
        pauseOnHover: boolean
        hoverToFocus: boolean
    }
    style?: React.CSSProperties
}

/* ---------- Safe value helpers (no raw user strings reach CSS) ---------- */

const num = (v: unknown, min: number, max: number, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

// Colors come from Framer's color control (hex, rgba, or a token var()).
// Reject anything that could escape the declaration it is placed in.
const safeColor = (v: unknown, fallback: string) =>
    typeof v === "string" &&
    v.length < 200 &&
    !/[;{}<>\\"'`]|\/\*|url\s*\(|expression\s*\(/i.test(v)
        ? v
        : fallback

// Parses the Framer Padding control value ("16px" or "1px 2px 3px 4px").
const parsePadding = (v: unknown, fallback = 16) => {
    const p = String(v ?? "")
        .trim()
        .split(/\s+/)
        .map((s) => parseFloat(s))
        .filter((n) => Number.isFinite(n))
        .map((n) => num(n, 0, 400, fallback))
    if (p.length === 0) p.push(fallback)
    if (p.length === 1) return { t: p[0], r: p[0], b: p[0], l: p[0] }
    if (p.length === 2) return { t: p[0], r: p[1], b: p[0], l: p[1] }
    if (p.length === 3) return { t: p[0], r: p[1], b: p[2], l: p[1] }
    return { t: p[0], r: p[1], b: p[2], l: p[3] }
}

export default function FocusRevealText(props: Props) {
    const isStatic = useIsStaticRenderer()

    const { text, style } = props
    const { font, textColor, align, wordGap: rawGap } = props.typography
    const {
        blur: rawBlur,
        inactiveOpacity: rawDim,
        type: transitionType,
        duration: rawDuration,
        stiffness: rawStiffness,
        damping: rawDamping,
    } = props.effect
    const {
        color: rawFrameColor,
        thickness: rawThickness,
        cornerSize: rawCorner,
        cornerRadius: rawRadius,
        padding,
        glow,
        glowAmount: rawGlow,
    } = props.frame
    const {
        autoPlay,
        startIndex,
        holdTime: rawHold,
        loop,
        pauseOnHover,
        hoverToFocus,
    } = props.playback

    // Constrain every configurable value before it is used in styles.
    const color = safeColor(textColor, "#FFFFFF")
    const frameColor = safeColor(rawFrameColor, "#FB531C")
    const wordGap = num(rawGap, 0, 400, 24)
    const blur = num(rawBlur, 0, 60, 9)
    const inactiveOpacity = num(rawDim, 0, 1, 0.6)
    const duration = num(rawDuration, 0.05, 5, 0.6)
    const stiffness = num(rawStiffness, 1, 2000, 220)
    const damping = num(rawDamping, 1, 200, 28)
    const frameThickness = num(rawThickness, 0, 40, 6)
    const cornerSize = num(rawCorner, 0, 400, 24)
    const cornerRadius = num(rawRadius, 0, 200, 0)
    const glowAmount = num(rawGlow, 0, 100, 12)
    const holdTime = num(rawHold, 0.2, 60, 0.9)
    const pad = useMemo(() => parsePadding(padding), [padding])
    const alignSafe = align === "left" || align === "right" ? align : "center"

    const words = useMemo(
        () => (text || "").split(/\s+/).filter(Boolean),
        [text]
    )
    const count = words.length

    const clamp = (i: number) =>
        count === 0 ? 0 : Math.min(Math.max(Math.round(i) || 0, 0), count - 1)

    const [index, setIndex] = useState(clamp(startIndex))
    const [hovering, setHovering] = useState(false)
    // Index of the word that has keyboard (:focus-visible) focus, if any.
    const [focusVisibleIndex, setFocusVisibleIndex] = useState<number | null>(
        null
    )
    const [rect, setRect] = useState<{
        x: number
        y: number
        w: number
        h: number
    } | null>(null)
    const [ready, setReady] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([])

    // Keep in sync with the "Focus Word" control (also drives the static view).
    useEffect(() => {
        setIndex(clamp(startIndex))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIndex, count])

    // Auto-advance (disabled for static renderers)
    useEffect(() => {
        if (isStatic || !autoPlay || count < 2) return
        if (pauseOnHover && hovering) return
        const id = window.setTimeout(() => {
            setIndex((i) => {
                if (i >= count - 1) return loop ? 0 : i
                return i + 1
            })
        }, holdTime * 1000)
        return () => window.clearTimeout(id)
    }, [
        index,
        isStatic,
        autoPlay,
        count,
        holdTime,
        loop,
        pauseOnHover,
        hovering,
    ])

    // Measure the active word
    const measure = () => {
        const el = wordRefs.current[index]
        if (!el) return
        setRect({
            x: el.offsetLeft,
            y: el.offsetTop,
            w: el.offsetWidth,
            h: el.offsetHeight,
        })
    }

    useLayoutEffect(() => {
        measure()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, text, font, wordGap, alignSafe, pad])

    // Re-measure on resize and after fonts load
    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        const ro = new ResizeObserver(() => measure())
        ro.observe(node)
        const fonts = (document as any).fonts
        if (fonts?.ready) fonts.ready.then(() => measure())
        return () => ro.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index])

    useEffect(() => {
        if (rect && !ready) {
            const id = requestAnimationFrame(() => setReady(true))
            return () => cancelAnimationFrame(id)
        }
    }, [rect, ready])

    // No motion at all in static renderers (canvas, thumbnails, exports).
    const animate = ready && !isStatic

    const motionTransition: any = !animate
        ? { duration: 0 }
        : transitionType === "spring"
          ? { type: "spring", stiffness, damping, mass: 1 }
          : transitionType === "linear"
            ? { type: "tween", ease: "linear", duration }
            : { type: "tween", ease: [0.65, 0, 0.35, 1], duration }

    const cssDuration = transitionType === "spring" ? 0.5 : duration
    const cssEase =
        transitionType === "linear" ? "linear" : "cubic-bezier(0.65,0,0.35,1)"

    const jc =
        alignSafe === "left"
            ? "flex-start"
            : alignSafe === "right"
              ? "flex-end"
              : "center"

    const corner = (pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: "absolute",
            width: cornerSize,
            height: cornerSize,
            boxSizing: "border-box",
            borderColor: frameColor,
            borderStyle: "solid",
            borderWidth: 0,
        }
        const t = frameThickness
        const r = Math.min(cornerRadius, cornerSize)
        if (pos === "tl")
            return {
                ...base,
                top: 0,
                left: 0,
                borderTopWidth: t,
                borderLeftWidth: t,
                borderTopLeftRadius: r,
            }
        if (pos === "tr")
            return {
                ...base,
                top: 0,
                right: 0,
                borderTopWidth: t,
                borderRightWidth: t,
                borderTopRightRadius: r,
            }
        if (pos === "bl")
            return {
                ...base,
                bottom: 0,
                left: 0,
                borderBottomWidth: t,
                borderLeftWidth: t,
                borderBottomLeftRadius: r,
            }
        return {
            ...base,
            bottom: 0,
            right: 0,
            borderBottomWidth: t,
            borderRightWidth: t,
            borderBottomRightRadius: r,
        }
    }

    const interactive = hoverToFocus && !isStatic

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                boxSizing: "border-box",
            }}
            onMouseEnter={isStatic ? undefined : () => setHovering(true)}
            onMouseLeave={isStatic ? undefined : () => setHovering(false)}
        >
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: jc,
                    alignItems: "center",
                    columnGap: wordGap,
                    rowGap: pad.t + pad.b,
                    maxWidth: "100%",
                    padding: `${pad.t}px ${pad.r}px ${pad.b}px ${pad.l}px`,
                    boxSizing: "border-box",
                    color,
                    userSelect: "none",
                    ...font,
                }}
            >
                {words.map((word, i) => {
                    const active = i === index
                    return (
                        <span
                            key={`${word}-${i}`}
                            ref={(el) => {
                                wordRefs.current[i] = el
                            }}
                            // Hover and keyboard focus both move the frame.
                            tabIndex={interactive ? 0 : undefined}
                            aria-current={active ? "true" : undefined}
                            onMouseEnter={
                                interactive ? () => setIndex(i) : undefined
                            }
                            onFocus={
                                interactive
                                    ? (e) => {
                                          setIndex(i)
                                          // Only show the ring for keyboard focus,
                                          // matching native :focus-visible behavior.
                                          let visible = true
                                          try {
                                              visible =
                                                  e.currentTarget.matches(
                                                      ":focus-visible"
                                                  )
                                          } catch (_) {}
                                          setFocusVisibleIndex(
                                              visible ? i : null
                                          )
                                      }
                                    : undefined
                            }
                            onBlur={
                                interactive
                                    ? () => setFocusVisibleIndex(null)
                                    : undefined
                            }
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                opacity: active ? 1 : inactiveOpacity,
                                filter: `blur(${active ? 0 : blur}px)`,
                                transition: animate
                                    ? `filter ${cssDuration}s ${cssEase}, opacity ${cssDuration}s ${cssEase}`
                                    : "none",
                                cursor: interactive ? "pointer" : "inherit",
                                // Clear ring for keyboard users (:focus-visible);
                                // hidden for mouse focus.
                                outline:
                                    focusVisibleIndex === i
                                        ? `2px solid ${frameColor}`
                                        : "none",
                                outlineOffset: 6,
                            }}
                        >
                            {word}
                        </span>
                    )
                })}

                {rect && count > 0 && (
                    <motion.div
                        aria-hidden
                        initial={false}
                        animate={{
                            x: rect.x - pad.l,
                            y: rect.y - pad.t,
                            width: rect.w + pad.l + pad.r,
                            height: rect.h + pad.t + pad.b,
                        }}
                        transition={motionTransition}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            pointerEvents: "none",
                            filter: glow
                                ? `drop-shadow(0 0 ${glowAmount}px ${frameColor})`
                                : "none",
                        }}
                    >
                        <span style={corner("tl")} />
                        <span style={corner("tr")} />
                        <span style={corner("bl")} />
                        <span style={corner("br")} />
                    </motion.div>
                )}
            </div>
        </div>
    )
}

FocusRevealText.defaultProps = {
    text: "Built by Russet Supply, Free for you",
}

addPropertyControls(FocusRevealText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Built by Russet Supply, Free for you",
        displayTextArea: true,
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "serif",
                defaultFontSize: "56px",
                defaultValue: {
                    fontFamily: "Instrument Serif, Georgia, serif",
                    fontSize: 56,
                    fontWeight: 400,
                    lineHeight: "1.1em",
                    letterSpacing: "-0.01em",
                },
            },
            textColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: "center",
            },
            wordGap: {
                type: ControlType.Number,
                title: "Word Gap",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 24,
            },
        },
    },

    effect: {
        type: ControlType.Object,
        title: "Focus & Motion",
        controls: {
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 30,
                step: 0.5,
                unit: "px",
                defaultValue: 9,
            },
            inactiveOpacity: {
                type: ControlType.Number,
                title: "Dim",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.6,
            },
            type: {
                type: ControlType.Enum,
                title: "Motion",
                options: ["spring", "ease", "linear"],
                optionTitles: ["Spring", "Ease", "Linear"],
                displaySegmentedControl: true,
                defaultValue: "spring",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.05,
                max: 3,
                step: 0.05,
                unit: "s",
                defaultValue: 0.6,
                hidden: (p: any) => p?.type === "spring",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                min: 20,
                max: 1000,
                step: 10,
                defaultValue: 220,
                hidden: (p: any) => p?.type !== "spring",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 1,
                max: 100,
                step: 1,
                defaultValue: 28,
                hidden: (p: any) => p?.type !== "spring",
            },
        },
    },

    frame: {
        type: ControlType.Object,
        title: "Frame",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FB531C",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 1,
                max: 12,
                step: 0.5,
                unit: "px",
                defaultValue: 6,
            },
            cornerSize: {
                type: ControlType.Number,
                title: "Corner Size",
                min: 2,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 24,
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "16px",
            },
            glow: {
                type: ControlType.Boolean,
                title: "Glow",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
            glowAmount: {
                type: ControlType.Number,
                title: "Glow Size",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 12,
                hidden: (p: any) => !p?.glow,
            },
        },
    },

    playback: {
        type: ControlType.Object,
        title: "Playback",
        controls: {
            autoPlay: {
                type: ControlType.Boolean,
                title: "Auto Play",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
            startIndex: {
                type: ControlType.Number,
                title: "Focus Word",
                min: 0,
                max: 50,
                step: 1,
                displayStepper: true,
                defaultValue: 0,
            },
            holdTime: {
                type: ControlType.Number,
                title: "Hold",
                min: 0.2,
                max: 10,
                step: 0.1,
                unit: "s",
                defaultValue: 0.9,
                hidden: (p: any) => !p?.autoPlay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                hidden: (p: any) => !p?.autoPlay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
                hidden: (p: any) => !p?.autoPlay,
            },
            hoverToFocus: {
                type: ControlType.Boolean,
                title: "Hover Focus",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
        },
    },
})
