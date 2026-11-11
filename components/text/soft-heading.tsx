import { createElement, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useReducedMotion } from "framer-motion"

// Same easing as the rest of the site: cubic-bezier(.16,1,.3,1)
const EASE = [0.16, 1, 0.3, 1] as const

interface Props {
    text: string
    muted: string
    tag: "h1" | "h2" | "h3" | "p"
    split: "letter" | "word"
    trigger: "load" | "view"
    rise: number
    blur: number
    duration: number
    stagger: number
    delay: number
    color: string
    mutedColor: string
    align: "left" | "center" | "right"
    font: CSSProperties
    style?: CSSProperties
}

// Single source of truth for defaults, used by both defaultProps and the property controls
const DEFAULTS = {
    text: "Make every heading",
    muted: "feel considered",
    tag: "h1",
    split: "letter",
    trigger: "load",
    rise: 24,
    blur: 0,
    duration: 0.9,
    stagger: 0.018,
    delay: 0.1,
    color: "#111111",
    mutedColor: "#6a6a66",
    align: "left",
} as const

/**
- Soft Heading: a heading that fades and rises in, letter by letter or word by word.
- Connect Text to a CMS field; line breaks in the field are kept.
 */
export default function SoftHeading(props: Props) {
    const {
        text,
        muted,
        tag,
        split,
        trigger,
        rise,
        blur,
        duration,
        stagger,
        delay,
        color,
        mutedColor,
        align,
        font,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduceMotion = useReducedMotion()
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true, amount: 0.4 })

    const mainText = (text || "").trim()
    const mutedText = (muted || "").trim()
    if (!mainText && !mutedText) return null

    // On the canvas and for reduced motion, the heading is simply there
    const still = isCanvas || !!reduceMotion
    const shown = still || trigger === "load" || inView
    const hidden = {
        opacity: 0,
        y: rise,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
    }
    const visible = {
        opacity: 1,
        y: 0,
        filter: blur > 0 ? "blur(0px)" : "none",
    }

    // Every piece gets its place in the sequence, across lines and words
    let n = 0
    const piece = (content: string, key: string, isMuted: boolean) => {
        const i = n++
        return (
            <motion.span
                key={key}
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color: isMuted ? mutedColor : color,
                }}
                initial={still ? false : hidden}
                animate={shown ? visible : hidden}
                transition={{
                    duration,
                    delay: delay + i * stagger,
                    ease: EASE,
                }}
            >
                {content}
            </motion.span>
        )
    }

    // Build unified lines data so muted text attaches to the end of the main text line
    const linesData: { text: string; isMuted: boolean }[][] = []
    const mLines = mainText ? mainText.split(/\r?\n/) : []

    if (mLines.length > 0) {
        mLines.forEach((lineStr, lineIdx) => {
            const words = lineStr.split(/\s+/).filter(Boolean)
            const lineSegments = words.map((w) => ({ text: w, isMuted: false }))

            // If this is the last line of mainText, append the first line of mutedText to it
            if (lineIdx === mLines.length - 1 && mutedText) {
                const mutedLines = mutedText.split(/\r?\n/)
                const firstMutedWords = mutedLines[0]
                    .split(/\s+/)
                    .filter(Boolean)
                firstMutedWords.forEach((w) =>
                    lineSegments.push({ text: w, isMuted: true })
                )

                linesData.push(lineSegments)

                // Add any subsequent lines of mutedText as new lines
                for (let i = 1; i < mutedLines.length; i++) {
                    const subWords = mutedLines[i].split(/\s+/).filter(Boolean)
                    linesData.push(
                        subWords.map((w) => ({ text: w, isMuted: true }))
                    )
                }
            } else {
                linesData.push(lineSegments)
            }
        })
    } else if (mutedText) {
        // If mainText is empty, just render mutedText lines
        const mutedLines = mutedText.split(/\r?\n/)
        mutedLines.forEach((lineStr) => {
            const words = lineStr.split(/\s+/).filter(Boolean)
            linesData.push(words.map((w) => ({ text: w, isMuted: true })))
        })
    }

    return createElement(
        tag,
        {
            ref,
            "aria-label": `${mainText} ${mutedText}`.trim(),
            style: {
                margin: 0,
                textAlign: align,
                fontSize: 56,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                textWrap: "balance",
                ...font,
                ...style,
            },
        },
        <span aria-hidden>
            {linesData.map((lineWords, l) => (
                <span key={`line-${l}`} style={{ display: "block" }}>
                    {lineWords.map((wordObj, w) => (
                        <span key={`word-${w}`}>
                            <span
                                style={{
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {split === "word"
                                    ? piece(
                                          wordObj.text,
                                          `w-${l}-${w}`,
                                          wordObj.isMuted
                                      )
                                    : Array.from(wordObj.text).map((ch, c) =>
                                          piece(
                                              ch,
                                              `c-${l}-${w}-${c}`,
                                              wordObj.isMuted
                                          )
                                      )}
                            </span>
                            {w < lineWords.length - 1 ? " " : null}
                        </span>
                    ))}
                </span>
            ))}
        </span>
    )
}

SoftHeading.defaultProps = { ...DEFAULTS }

addPropertyControls(SoftHeading, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULTS.text,
        displayTextArea: true,
        description: "Connect to a CMS field. Line breaks are kept.",
    },
    muted: {
        type: ControlType.String,
        title: "Muted",
        defaultValue: DEFAULTS.muted,
        displayTextArea: true,
        description: "The grey part after the headline. Leave empty for none.",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        defaultValue: DEFAULTS.tag,
        options: ["h1", "h2", "h3", "p"],
        optionTitles: ["H1", "H2", "H3", "P"],
        displaySegmentedControl: true,
        description: "H1 for the page title, H2 for section titles.",
    },
    split: {
        type: ControlType.Enum,
        title: "Split",
        defaultValue: DEFAULTS.split,
        options: ["letter", "word"],
        optionTitles: ["Letters", "Words"],
        displaySegmentedControl: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Start",
        defaultValue: DEFAULTS.trigger,
        options: ["load", "view"],
        optionTitles: ["On load", "In view"],
        displaySegmentedControl: true,
        description:
            "On load for the top of the page, In view for headings further down.",
    },
    rise: {
        type: ControlType.Number,
        title: "Rise",
        defaultValue: DEFAULTS.rise,
        min: 0,
        max: 80,
        unit: "px",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: DEFAULTS.blur,
        min: 0,
        max: 16,
        unit: "px",
        description: "Optional: letters come into focus as they rise.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: DEFAULTS.duration,
        min: 0.2,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "How long each letter takes.",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: DEFAULTS.stagger,
        min: 0,
        max: 0.2,
        step: 0.002,
        unit: "s",
        description: "Gap between letters. Try 0.06 with Words.",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: DEFAULTS.delay,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: DEFAULTS.color,
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: DEFAULTS.mutedColor,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: DEFAULTS.align,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 56,
            fontWeight: 600,
            lineHeight: "1.05em",
            letterSpacing: "-0.03em",
        },
    },
})
