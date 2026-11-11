/**
 * FuseReveal by InterFuse
 * Copyright © 2026 InterFuse
 *
 * Licensed for use under the applicable Framer Marketplace license.
 * Redistribution, resale, republication, and claiming authorship are prohibited.
 */

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"

/**
 * Cinematic Text Reveal
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type HtmlTag = "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
type SplitMode = "characters" | "words"
type Direction = "forward" | "reverse"
type EndAnchor = "end" | "start"

type ColorSettings = {
    base: string
    highlight: string
    final: string
}

type EffectSettings = {
    startBlur: number
    blurClear: number
    trail: number
    highlightStart: number
    highlightPeak: number
    smoothing: number
    direction: Direction
}

type ScrollSettings = {
    start: number
    end: number
    endAnchor: EndAnchor
    preview: number
}

type Props = {
    text: string
    tag: HtmlTag
    split: SplitMode
    font: React.CSSProperties
    colors: ColorSettings
    effect: EffectSettings
    scroll: ScrollSettings
    style?: React.CSSProperties
}

type Rgba = {
    r: number
    g: number
    b: number
    a: number
}

type Unit = {
    id: number
    text: string
}

type Token =
    | { type: "word"; key: string; units: Unit[] }
    | { type: "space"; key: string; text: string }
    | { type: "break"; key: string }

const DEFAULT_COLORS: ColorSettings = {
    base: "rgba(255, 255, 255, 0.06)",
    highlight: "#0099FF",
    final: "#FFFFFF",
}

const DEFAULT_EFFECT: EffectSettings = {
    startBlur: 10,
    blurClear: 30,
    trail: 28,
    highlightStart: 12,
    highlightPeak: 30,
    smoothing: 110,
    direction: "forward",
}

const DEFAULT_SCROLL: ScrollSettings = {
    start: 80,
    end: 40,
    endAnchor: "end",
    preview: 52,
}

const DEFAULT_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "44px",
    fontWeight: 500,
    letterSpacing: "-0.05em",
    lineHeight: "1.1em",
    textAlign: "left",
}

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value))
}

function smoothstep(value: number) {
    const t = clamp(value)
    return t * t * (3 - 2 * t)
}

function parseColor(input: string | undefined, fallback: Rgba): Rgba {
    if (!input) return fallback

    const value = input.trim()

    if (value.startsWith("#")) {
        const hex = value.slice(1)

        if (hex.length === 3 || hex.length === 4) {
            const r = parseInt(hex[0] + hex[0], 16)
            const g = parseInt(hex[1] + hex[1], 16)
            const b = parseInt(hex[2] + hex[2], 16)
            const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1
            return { r, g, b, a }
        }

        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
            return { r, g, b, a }
        }
    }

    const rgbMatch = value.match(
        /^rgba?\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)(?:\s*,\s*(-?\d*\.?\d+))?\s*\)$/i
    )

    if (rgbMatch) {
        return {
            r: clamp(Number(rgbMatch[1]), 0, 255),
            g: clamp(Number(rgbMatch[2]), 0, 255),
            b: clamp(Number(rgbMatch[3]), 0, 255),
            a: clamp(rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4])),
        }
    }

    return fallback
}

function mixColor(from: Rgba, to: Rgba, progress: number): Rgba {
    const t = clamp(progress)
    return {
        r: from.r + (to.r - from.r) * t,
        g: from.g + (to.g - from.g) * t,
        b: from.b + (to.b - from.b) * t,
        a: from.a + (to.a - from.a) * t,
    }
}

function rgbaToCss(color: Rgba) {
    const r = Math.round(clamp(color.r, 0, 255))
    const g = Math.round(clamp(color.g, 0, 255))
    const b = Math.round(clamp(color.b, 0, 255))
    const a = Math.round(clamp(color.a) * 1000) / 1000
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

function segmentGraphemes(value: string): string[] {
    try {
        const Segmenter = (Intl as any).Segmenter
        if (Segmenter) {
            const segmenter = new Segmenter(undefined, {
                granularity: "grapheme",
            })
            return Array.from(
                segmenter.segment(value),
                (part: any) => part.segment
            )
        }
    } catch {
        // Array.from is a safe fallback for most Unicode characters.
    }

    return Array.from(value)
}

function tokenize(text: string, split: SplitMode) {
    const rawTokens = text.split(/(\r\n|\n|\r|[\t ]+)/)
    const tokens: Token[] = []
    let unitId = 0

    rawTokens.forEach((part, tokenIndex) => {
        if (!part) return

        if (/^(\r\n|\n|\r)$/.test(part)) {
            tokens.push({ type: "break", key: `break-${tokenIndex}` })
            return
        }

        if (/^[\t ]+$/.test(part)) {
            tokens.push({
                type: "space",
                key: `space-${tokenIndex}`,
                text: part,
            })
            return
        }

        const values = split === "words" ? [part] : segmentGraphemes(part)
        const units = values.map((value) => ({ id: unitId++, text: value }))
        tokens.push({ type: "word", key: `word-${tokenIndex}`, units })
    })

    return { tokens, unitCount: unitId }
}

/**
 * @framerDisableUnlink
 */

export default function FuseReveal(props: Props) {
    const {
        text = "A cinematic text reveal built natively for Framer.",
        tag = "p",
        split = "characters",
        font = DEFAULT_FONT,
        style,
    } = props

    const colors = { ...DEFAULT_COLORS, ...(props.colors || {}) }
    const effect = { ...DEFAULT_EFFECT, ...(props.effect || {}) }
    const scroll = { ...DEFAULT_SCROLL, ...(props.scroll || {}) }

    const rootRef = React.useRef<HTMLDivElement>(null)
    const unitRefs = React.useRef<Array<HTMLSpanElement | null>>([])
    const frameRef = React.useRef<number | null>(null)
    const targetProgressRef = React.useRef(0)
    const renderedProgressRef = React.useRef(0)
    const previousFrameTimeRef = React.useRef<number | null>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()

    const { tokens, unitCount } = React.useMemo(
        () => tokenize(text, split),
        [text, split]
    )

    const offset = React.useMemo(
        () =>
            [
                `start ${scroll.start}%`,
                `${scroll.endAnchor} ${scroll.end}%`,
            ] as any,
        [scroll.start, scroll.end, scroll.endAnchor]
    )

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset,
    })

    const palette = React.useMemo(() => {
        const base = parseColor(colors.base, {
            r: 255,
            g: 255,
            b: 255,
            a: 0.06,
        })
        const highlight = parseColor(colors.highlight, {
            r: 0,
            g: 153,
            b: 255,
            a: 1,
        })
        const final = parseColor(colors.final, { r: 255, g: 255, b: 255, a: 1 })

        // Recreates the original low-opacity accent stop without adding another color control.
        const dimHighlight = {
            ...highlight,
            a: Math.min(base.a, highlight.a),
        }

        return { base, dimHighlight, highlight, final }
    }, [colors.base, colors.highlight, colors.final])

    const applyProgress = React.useCallback(
        (rawProgress: number) => {
            const progress = clamp(rawProgress)
            const total = Math.max(unitCount, 1)
            const trail = Math.max(effect.trail / 100, 0.005)
            const highlightStart = clamp(effect.highlightStart / 100, 0, 0.97)
            const highlightPeak = clamp(
                Math.max(effect.highlightPeak / 100, highlightStart + 0.01),
                0.01,
                0.99
            )
            const blurClear = clamp(effect.blurClear / 100, 0.01, 1)
            const startBlur = Math.max(effect.startBlur, 0)

            for (let index = 0; index < total; index++) {
                const node = unitRefs.current[index]
                if (!node) continue

                const naturalPosition = total === 1 ? 0 : index / (total - 1)
                const position =
                    effect.direction === "reverse"
                        ? 1 - naturalPosition
                        : naturalPosition

                // The wave begins before each unit and leaves the final color behind it.
                const local = clamp((progress * (1 + trail) - position) / trail)

                let color: Rgba

                if (local <= highlightStart) {
                    const section =
                        highlightStart <= 0
                            ? 1
                            : smoothstep(local / highlightStart)
                    color = mixColor(
                        palette.base,
                        palette.dimHighlight,
                        section
                    )
                } else if (local <= highlightPeak) {
                    const section = smoothstep(
                        (local - highlightStart) /
                            Math.max(highlightPeak - highlightStart, 0.001)
                    )
                    color = mixColor(
                        palette.dimHighlight,
                        palette.highlight,
                        section
                    )
                } else {
                    const section = smoothstep(
                        (local - highlightPeak) /
                            Math.max(1 - highlightPeak, 0.001)
                    )
                    color = mixColor(palette.highlight, palette.final, section)
                }

                const blurProgress = smoothstep(local / blurClear)
                const blur = startBlur * (1 - blurProgress)

                const colorCss = rgbaToCss(color)
                const filterCss =
                    blur > 0.04 ? `blur(${blur.toFixed(2)}px)` : "none"

                if (node.style.color !== colorCss) node.style.color = colorCss
                if (node.style.filter !== filterCss)
                    node.style.filter = filterCss
            }
        },
        [
            unitCount,
            effect.trail,
            effect.highlightStart,
            effect.highlightPeak,
            effect.blurClear,
            effect.startBlur,
            effect.direction,
            palette,
        ]
    )

    const tick = React.useCallback(
        function animateFrame(now: number) {
            frameRef.current = null

            const target = targetProgressRef.current
            const current = renderedProgressRef.current
            const previousTime = previousFrameTimeRef.current ?? now - 16.67
            const elapsed = Math.min(Math.max(now - previousTime, 1), 64)
            previousFrameTimeRef.current = now

            const smoothing = Math.max(effect.smoothing, 0)
            const alpha =
                smoothing <= 0 ? 1 : 1 - Math.exp(-elapsed / smoothing)
            const next = current + (target - current) * alpha

            renderedProgressRef.current = next
            applyProgress(next)

            if (Math.abs(target - next) > 0.00035) {
                frameRef.current = requestAnimationFrame(animateFrame)
            } else {
                renderedProgressRef.current = target
                previousFrameTimeRef.current = null
                applyProgress(target)
            }
        },
        [applyProgress, effect.smoothing]
    )

    const queueProgress = React.useCallback(
        (progress: number) => {
            targetProgressRef.current = clamp(progress)

            if (
                frameRef.current === null &&
                typeof requestAnimationFrame !== "undefined"
            ) {
                previousFrameTimeRef.current = null
                frameRef.current = requestAnimationFrame(tick)
            }
        },
        [tick]
    )

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (isStaticRenderer || prefersReducedMotion) return
        queueProgress(latest)
    })

    React.useLayoutEffect(() => {
        unitRefs.current.length = unitCount

        const initialProgress = prefersReducedMotion
            ? 1
            : isStaticRenderer
              ? clamp(scroll.preview / 100)
              : clamp(scrollYProgress.get())

        targetProgressRef.current = initialProgress
        renderedProgressRef.current = initialProgress
        previousFrameTimeRef.current = null
        applyProgress(initialProgress)
    }, [
        unitCount,
        isStaticRenderer,
        prefersReducedMotion,
        scroll.preview,
        scrollYProgress,
        applyProgress,
    ])

    React.useEffect(() => {
        return () => {
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
        }
    }, [tick])

    const Tag = tag as React.ElementType

    const rootStyle: React.CSSProperties = {
        ...style,
        width: "100%",
        position: "relative",
        overflow: "visible",
    }

    // Give every animated unit extra paint space so CSS blur is not
    // cropped by the character/word box. Negative margins preserve
    // the original typography metrics and line wrapping.
    const blurBleed =
        effect.startBlur > 0
            ? Math.min(Math.ceil(effect.startBlur * 1.5 + 2), 64)
            : 0

    const textStyle: React.CSSProperties = {
        ...DEFAULT_FONT,
        ...font,
        position: "relative",
        display: "block",
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        whiteSpace: "pre-wrap",
        overflowWrap: "normal",
        wordBreak: "normal",
        overflow: "visible",
    }

    const visualStyle: React.CSSProperties = {
        display: "block",
        width: "100%",
        whiteSpace: "pre-wrap",
        overflow: "visible",
    }

    const wordStyle: React.CSSProperties = {
        display: "inline-block",
        whiteSpace: "nowrap",
        wordBreak: "keep-all",
        overflowWrap: "normal",
        overflow: "visible",
    }

    const unitStyle: React.CSSProperties = {
        display: "inline-block",
        boxSizing: "content-box",
        color: colors.base,
        filter: effect.startBlur > 0 ? `blur(${effect.startBlur}px)` : "none",
        padding: blurBleed,
        margin: -blurBleed,
        overflow: "visible",
        willChange: "color, filter",
    }

    return (
        <div ref={rootRef} style={rootStyle}>
            <Tag style={textStyle}>
                {/* One intact semantic copy for assistive technology and crawlers. */}
                <span style={SR_ONLY}>{text}</span>

                {/* The animated copy is visual-only, so screen readers never spell it character by character. */}
                <span aria-hidden="true" data-nosnippet style={visualStyle}>
                    {tokens.map((token) => {
                        if (token.type === "break") {
                            return <br key={token.key} />
                        }

                        if (token.type === "space") {
                            return (
                                <React.Fragment key={token.key}>
                                    {token.text}
                                </React.Fragment>
                            )
                        }

                        return (
                            <span key={token.key} style={wordStyle}>
                                {token.units.map((unit) => (
                                    <span
                                        key={unit.id}
                                        ref={(node) => {
                                            unitRefs.current[unit.id] = node
                                        }}
                                        style={unitStyle}
                                    >
                                        {unit.text}
                                    </span>
                                ))}
                            </span>
                        )
                    })}
                </span>
            </Tag>
        </div>
    )
}

FuseReveal.defaultProps = {
    text: "A cinematic text reveal built natively for Framer.",
    tag: "p",
    split: "characters",
    font: DEFAULT_FONT,
    colors: DEFAULT_COLORS,
    effect: DEFAULT_EFFECT,
    scroll: DEFAULT_SCROLL,
}

addPropertyControls(FuseReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "A cinematic text reveal built natively for Framer.",
        displayTextArea: true,
    },
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        defaultValue: "p",
        options: ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6"],
        optionTitles: ["Div", "Paragraph", "H1", "H2", "H3", "H4", "H5", "H6"],
    },
    split: {
        type: ControlType.Enum,
        title: "Split",
        defaultValue: "characters",
        options: ["characters", "words"],
        optionTitles: ["Characters", "Words"],
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        defaultFontType: "sans-serif",
        defaultFontSize: "44px",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
        defaultValue: {
            fontSize: "44px",
            lineHeight: "1.1em",
            letterSpacing: "-0.05em",
            textAlign: "left",
            variant: "Medium",
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        defaultValue: DEFAULT_COLORS,
        controls: {
            base: {
                type: ControlType.Color,
                title: "Base",
                defaultValue: DEFAULT_COLORS.base,
            },
            highlight: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: DEFAULT_COLORS.highlight,
            },
            final: {
                type: ControlType.Color,
                title: "Final",
                defaultValue: DEFAULT_COLORS.final,
            },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Reveal",
        icon: "effect",
        defaultValue: DEFAULT_EFFECT,
        controls: {
            startBlur: {
                type: ControlType.Number,
                title: "Start Blur",
                defaultValue: DEFAULT_EFFECT.startBlur,
                min: 0,
                max: 40,
                step: 0.5,
                unit: "px",
            },
            blurClear: {
                type: ControlType.Number,
                title: "Blur Clear",
                defaultValue: DEFAULT_EFFECT.blurClear,
                min: 1,
                max: 100,
                step: 1,
                unit: "%",
            },
            trail: {
                type: ControlType.Number,
                title: "Trail",
                defaultValue: DEFAULT_EFFECT.trail,
                min: 2,
                max: 100,
                step: 1,
                unit: "%",
            },
            highlightStart: {
                type: ControlType.Number,
                title: "Accent Start",
                defaultValue: DEFAULT_EFFECT.highlightStart,
                min: 0,
                max: 90,
                step: 1,
                unit: "%",
            },
            highlightPeak: {
                type: ControlType.Number,
                title: "Accent Peak",
                defaultValue: DEFAULT_EFFECT.highlightPeak,
                min: 1,
                max: 99,
                step: 1,
                unit: "%",
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                defaultValue: DEFAULT_EFFECT.smoothing,
                min: 0,
                max: 500,
                step: 10,
                unit: "ms",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                defaultValue: DEFAULT_EFFECT.direction,
                options: ["forward", "reverse"],
                optionTitles: ["Forward", "Reverse"],
                displaySegmentedControl: true,
            },
        },
    },
    scroll: {
        type: ControlType.Object,
        title: "Scroll",
        icon: "interact",
        defaultValue: DEFAULT_SCROLL,
        controls: {
            start: {
                type: ControlType.Number,
                title: "Start At",
                defaultValue: DEFAULT_SCROLL.start,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Viewport position where the top of the component starts revealing.",
            },
            end: {
                type: ControlType.Number,
                title: "End At",
                defaultValue: DEFAULT_SCROLL.end,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Viewport position where the selected component anchor finishes revealing.",
            },
            endAnchor: {
                type: ControlType.Enum,
                title: "End Anchor",
                defaultValue: DEFAULT_SCROLL.endAnchor,
                options: ["end", "start"],
                optionTitles: ["Bottom", "Top"],
                displaySegmentedControl: true,
            },
            preview: {
                type: ControlType.Number,
                title: "Canvas Preview",
                defaultValue: DEFAULT_SCROLL.preview,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Static reveal position shown on the Framer canvas and in exports.",
            },
        },
    },
})
