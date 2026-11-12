// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState } from "react"

/**
 * SCROLL REVEAL TEXT
 *
 * Reveals text on scroll, word- or letter-by-letter
 * (fade-up / mask / blur / scale).
 *
 * - Type directly into the Text field.
 * - Font, size, line-height, letter-spacing, text alignment, and variants come
 *   from Framer's native Font control.
 * - Color accepts Framer color styles & variables.
 * - Animation is suppressed on the canvas, during export, and for
 *   prefers-reduced-motion.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 120
 */

const EASING = "cubic-bezier(0.23, 1, 0.32, 1)"

type AnimationStyle = "fade-up" | "mask" | "blur" | "scale"
type SplitMode = "word" | "letter"
type TextAlign = "left" | "center" | "right" | "justify"

type ScrollRevealTextProps = {
    text?: string
    splitMode?: SplitMode
    animationStyle?: AnimationStyle
    triggerOnce?: boolean
    staggerMs?: number
    animDuration?: number
    startDelay?: number
    threshold?: number
    font?: Record<string, any>
    textColor?: any
    textAlign?: TextAlign
    style?: Record<string, any>
}

const MOTION_PROPS: Record<AnimationStyle, string[]> = {
    "fade-up": ["transform", "opacity"],
    mask: ["transform"],
    blur: ["opacity", "filter"],
    scale: ["transform", "opacity"],
}

const DEFAULT_FONT = {
    fontSize: 48,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    textAlign: "left",
    variant: "Semibold",
}

// Framer can pass connected styles/variables as { value: "..." }.
const parseToken = (value: any) =>
    value && typeof value === "object" && "value" in value ? value.value : value

const normalizeStyleObject = (style: Record<string, any> = {}) => {
    const next = { ...style }
    for (const key in next) next[key] = parseToken(next[key])
    return next
}

const getReducedMotion = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function ScrollRevealText(props: ScrollRevealTextProps) {
    const {
        text = "We make brands look better,\ncommunicate better,\nand sell better online.",
        splitMode = "word",
        animationStyle = "mask",
        triggerOnce = true,
        staggerMs = 60,
        animDuration = 800,
        startDelay = 0,
        threshold = 25,
        font = DEFAULT_FONT,
        textColor = "#0A0A0A",
        textAlign = "left",
        style,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false

    const rootRef = useRef<HTMLDivElement | null>(null)
    const [reducedMotion, setReducedMotion] = useState(getReducedMotion)
    const [isRevealed, setIsRevealed] = useState(
        () => isStatic || getReducedMotion()
    )

    const noMotion = isStatic || reducedMotion

    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        )
            return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    useEffect(() => {
        if (noMotion) {
            setIsRevealed(true)
            return
        }
        if (!rootRef.current || typeof IntersectionObserver === "undefined") {
            setIsRevealed(true)
            return
        }
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsRevealed(true)
                        if (triggerOnce) obs.disconnect()
                    } else if (!triggerOnce) {
                        setIsRevealed(false)
                    }
                })
            },
            { threshold: Math.max(0, Math.min(1, threshold / 100)) }
        )
        obs.observe(rootRef.current)
        return () => obs.disconnect()
    }, [noMotion, triggerOnce, threshold])

    const framerStyle = normalizeStyleObject(style)
    const fontStyle = normalizeStyleObject(font)
    const resolvedTextAlign =
        fontStyle.textAlign || framerStyle.textAlign || textAlign || "left"
    const content = String(text ?? "")
    const lines = content.split("\n")

    const getInnerStyle = (index: number) => {
        if (noMotion) {
            return {
                display: "inline-block",
                transition: "none",
                willChange: "auto",
            }
        }

        const delay = startDelay + index * staggerMs
        const animProps = MOTION_PROPS[animationStyle] || []
        const transition = animProps
            .map(
                (p) =>
                    `${p} ${animDuration}ms ${
                        p === "transform" ? EASING : "ease"
                    } ${delay}ms`
            )
            .join(", ")

        const base = {
            display: "inline-block",
            transition,
            willChange: animProps.length ? animProps.join(", ") : "auto",
        }

        switch (animationStyle) {
            case "fade-up":
                return {
                    ...base,
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed
                        ? "translateY(0)"
                        : "translateY(0.4em)",
                }
            case "mask":
                return {
                    ...base,
                    transform: isRevealed
                        ? "translateY(0)"
                        : "translateY(110%)",
                }
            case "blur":
                return {
                    ...base,
                    opacity: isRevealed ? 1 : 0,
                    filter: isRevealed ? "blur(0px)" : "blur(10px)",
                }
            case "scale":
                return {
                    ...base,
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed ? "scale(1)" : "scale(0.8)",
                    transformOrigin: "center bottom",
                }
            default:
                return base
        }
    }

    const getOuterStyle = () => {
        if (animationStyle !== "mask") {
            return { display: "inline-block", verticalAlign: "top" } as const
        }
        return {
            display: "inline-block",
            verticalAlign: "top",
            overflow: "hidden",
            paddingBottom: "0.15em",
            marginBottom: "-0.15em",
        } as const
    }

    let tokenIndex = 0
    const renderWord = (word: string, wordKey: string) => {
        if (splitMode === "letter") {
            const letters = Array.from(word) as string[]
            return (
                <span
                    key={wordKey}
                    style={{
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        verticalAlign: "top",
                    }}
                >
                    {letters.map((ch: string, li: number) => {
                        const idx = tokenIndex++
                        return (
                            <span
                                key={`${wordKey}-${li}`}
                                style={getOuterStyle()}
                            >
                                <span style={getInnerStyle(idx) as any}>
                                    {ch}
                                </span>
                            </span>
                        )
                    })}
                </span>
            )
        }

        const idx = tokenIndex++
        return (
            <span key={wordKey} style={getOuterStyle()}>
                <span style={getInnerStyle(idx) as any}>{word}</span>
            </span>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...framerStyle,
                ...fontStyle,
                color: parseToken(textColor) || fontStyle.color,
                textAlign: resolvedTextAlign as any,
                width: "100%",
                margin: 0,
            }}
        >
            {lines.map((line, lineIdx) => {
                const parts = line.split(/(\s+)/).filter((p) => p !== "")
                return (
                    <span key={`line-${lineIdx}`} style={{ display: "block" }}>
                        {parts.map((part, partIdx) => {
                            if (/^\s+$/.test(part)) {
                                return (
                                    <span
                                        key={`sp-${lineIdx}-${partIdx}`}
                                        style={{ whiteSpace: "pre" }}
                                    >
                                        {part}
                                    </span>
                                )
                            }
                            return renderWord(part, `w-${lineIdx}-${partIdx}`)
                        })}
                    </span>
                )
            })}
        </div>
    )
}

;(ScrollRevealText as any).defaultProps = {
    text: "We make brands look better,\ncommunicate better,\nand sell better online.",
    splitMode: "word",
    animationStyle: "mask",
    triggerOnce: true,
    staggerMs: 60,
    animDuration: 800,
    startDelay: 0,
    threshold: 25,
    textColor: "#0A0A0A",
    textAlign: "left",
    font: DEFAULT_FONT,
}

addPropertyControls(ScrollRevealText, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "We make brands look better,\ncommunicate better,\nand sell better online.",
        description: "Use line breaks for explicit new lines.",
    },
    splitMode: {
        type: ControlType.Enum,
        title: "Split",
        options: ["word", "letter"],
        optionTitles: ["By Word", "By Letter"],
        defaultValue: "word",
        displaySegmentedControl: true,
        description:
            "Letter mode is dramatic but heavier - use on short headlines.",
    },
    animationStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["fade-up", "mask", "blur", "scale"],
        optionTitles: ["Fade Up", "Mask", "Blur", "Scale"],
        defaultValue: "mask",
    },
    font: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Text Style",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultFontType: "sans-serif",
        defaultFontSize: "48px",
        defaultValue: DEFAULT_FONT,
    } as any,
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0A0A0A",
    },
    triggerOnce: {
        type: ControlType.Boolean,
        title: "Trigger",
        defaultValue: true,
        enabledTitle: "Once",
        disabledTitle: "Replay",
        description: "Replay on every viewport entry, or fire once.",
    },
    threshold: {
        type: ControlType.Number,
        title: "Trigger At",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 25,
        unit: "%",
        description: "% of element visible before the reveal fires.",
    },
    staggerMs: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 300,
        step: 5,
        defaultValue: 60,
        unit: "ms",
        description: "Delay between each word/letter.",
    },
    animDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 200,
        max: 2000,
        step: 50,
        defaultValue: 800,
        unit: "ms",
    },
    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 2000,
        step: 50,
        defaultValue: 0,
        unit: "ms",
        description: "Pause before the first token reveals.",
    },
})
