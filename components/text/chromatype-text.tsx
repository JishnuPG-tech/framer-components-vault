// ChromaType — Framer code component
// Typewriter heading with a chroma reveal: the static prefix sits in muted
// color, then words cycle — typed letter-by-letter, each letter flashing in
// with an animated rainbow chroma and settling to solid color once the word
// completes. Optional soft glow while typing, optional blinking cursor.
// Loops forever.
//
// Static rendering (canvas render / export): all timers and animations are
// disabled via useIsStaticRenderer() and the first full word is shown as a
// settled static fallback. Live behavior is unchanged.
//
// e.g.  prefix: "I build"   words: "websites in Framer, brands in Figma"

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { Fragment, useEffect, useState } from "react"

type ChromaTypeProps = {
    prefix: string
    words: string
    typeSpeed: number
    deleteSpeed: number
    holdMs: number
    chroma: boolean
    hueSpread: number
    glow: boolean
    popIn: boolean
    cursor: boolean
    cursorColor: string
    prefixColor: string
    textColor: string
    fontSize: number
    fontWeight: number
    letterSpacing: number
    fontFamily: string
    align: "left" | "center" | "right"
    [key: string]: any
}

export default function ChromaType({
    prefix,
    words,
    typeSpeed,
    deleteSpeed,
    holdMs,
    chroma,
    hueSpread,
    glow,
    popIn,
    cursor,
    cursorColor,
    prefixColor,
    textColor,
    fontSize,
    fontWeight,
    letterSpacing,
    fontFamily,
    align,
    ...rest
}: ChromaTypeProps) {
    const isStatic = useIsStaticRenderer()

    const list = (words || "")
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean)
    const [wordIndex, setWordIndex] = useState(0)
    const [len, setLen] = useState(0)
    const [phase, setPhase] = useState<"typing" | "hold" | "deleting">("typing")
    const [hue, setHue] = useState(0)

    const word = list[wordIndex] ?? ""
    const safeLen = Math.min(len, word.length)
    const typed = word.slice(0, safeLen)

    // ---- typing / deleting state machine (live only) ----
    useEffect(() => {
        if (isStatic || list.length === 0) return
        let t: ReturnType<typeof setTimeout>
        if (phase === "typing") {
            if (safeLen < word.length) {
                t = setTimeout(() => setLen((l) => l + 1), typeSpeed)
            } else {
                t = setTimeout(() => setPhase("hold"), 120)
            }
        } else if (phase === "hold") {
            t = setTimeout(() => setPhase("deleting"), holdMs)
        } else {
            if (safeLen > 0) {
                t = setTimeout(() => setLen((l) => l - 1), deleteSpeed)
            } else {
                t = setTimeout(() => {
                    setWordIndex((i) => (i + 1) % list.length)
                    setPhase("typing")
                }, 180)
            }
        }
        return () => clearTimeout(t)
    }, [
        isStatic,
        safeLen,
        phase,
        wordIndex,
        word,
        typeSpeed,
        deleteSpeed,
        holdMs,
        list.length,
    ])

    // ---- hue animation (drives the chroma gradient, live only) ----
    useEffect(() => {
        if (isStatic || !chroma) return
        const id = setInterval(() => setHue((h) => (h + 4) % 360), 50)
        return () => clearInterval(id)
    }, [isStatic, chroma])

    const letterStyle = (i: number): React.CSSProperties => {
        const active = chroma && phase === "typing"
        const h = (i * hueSpread + hue) % 360
        return {
            color: active ? `hsl(${h} 95% 66%)` : textColor,
            textShadow:
                active && glow ? `0 0 28px hsla(${h}, 95%, 60%, 0.4)` : "none",
            transition: "color 0.7s ease, text-shadow 0.7s ease",
            whiteSpace: "pre",
            display: "inline-block",
        }
    }

    const pop = popIn
        ? {
              initial: { opacity: 0, y: "0.35em", filter: "blur(6px)" },
              animate: { opacity: 1, y: "0em", filter: "blur(0px)" },
              transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
          }
        : {}

    // static fallback: first full word, settled colors
    const shown = isStatic ? (list[0] ?? "") : typed

    return (
        <div
            {...rest}
            style={{
                display: "block",
                textAlign: align,
                width: "100%",
                height: "auto",
                fontSize,
                fontWeight,
                lineHeight: 1.15,
                letterSpacing: `${letterSpacing}em`,
                fontFamily: fontFamily || "inherit",
                color: textColor,
            }}
        >
            {prefix ? (
                <span style={{ color: prefixColor, whiteSpace: "pre-wrap" }}>
                    {prefix}{" "}
                </span>
            ) : null}

            {/* letters grouped into word-level nowrap spans, so the line
                breaks BETWEEN words, never mid-word */}
            <span style={{ display: "inline" }}>
                {shown.split(" ").map((chunk, ci) => {
                    if (chunk === "") return null
                    // global letter index (for chroma hue continuity)
                    const startGi = shown
                        .split(" ")
                        .slice(0, ci)
                        .reduce((a, c) => a + c.length + 1, 0)
                    return (
                        <Fragment key={`${wordIndex}-${ci}`}>
                            {ci > 0 ? " " : null}
                            <span
                                style={{
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {chunk.split("").map((ch, i) => {
                                    const gi = startGi + i
                                    if (isStatic) {
                                        return (
                                            <span
                                                key={`${wordIndex}-${gi}`}
                                                style={{
                                                    color: textColor,
                                                    whiteSpace: "pre",
                                                    display: "inline-block",
                                                }}
                                            >
                                                {ch}
                                            </span>
                                        )
                                    }
                                    return popIn ? (
                                        <motion.span
                                            key={`${wordIndex}-${gi}`}
                                            {...pop}
                                            style={letterStyle(gi)}
                                        >
                                            {ch}
                                        </motion.span>
                                    ) : (
                                        <span
                                            key={`${wordIndex}-${gi}`}
                                            style={letterStyle(gi)}
                                        >
                                            {ch}
                                        </span>
                                    )
                                })}
                            </span>
                        </Fragment>
                    )
                })}
            </span>

            {cursor && !isStatic ? (
                <motion.span
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{
                        duration: 1.1,
                        times: [0, 0.55, 0.55, 1],
                        repeat: Infinity,
                    }}
                    style={{
                        color: cursorColor,
                        display: "inline-block",
                        marginLeft: "0.06em",
                        transform: "translateY(0.04em)",
                        whiteSpace: "pre",
                    }}
                >
                    |
                </motion.span>
            ) : null}
        </div>
    )
}

addPropertyControls(ChromaType, {
    prefix: { type: ControlType.String, defaultValue: "I build" },
    words: {
        type: ControlType.String,
        title: "Words (comma separated)",
        defaultValue:
            "websites in Framer, brands in Figma, pages that convert, automations that scale",
        displayTextArea: true,
    },
    typeSpeed: {
        type: ControlType.Number,
        title: "Type speed (ms)",
        defaultValue: 75,
        min: 20,
        max: 300,
        step: 5,
    },
    deleteSpeed: {
        type: ControlType.Number,
        title: "Delete speed (ms)",
        defaultValue: 35,
        min: 10,
        max: 200,
        step: 5,
    },
    holdMs: {
        type: ControlType.Number,
        title: "Hold before delete (ms)",
        defaultValue: 1700,
        min: 200,
        max: 6000,
        step: 100,
    },
    chroma: {
        type: ControlType.Boolean,
        title: "Chroma colors",
        defaultValue: true,
    },
    hueSpread: {
        type: ControlType.Number,
        title: "Hue spread",
        defaultValue: 36,
        min: 5,
        max: 120,
        step: 1,
        helperText: "Degrees of hue between letters — lower = tighter gradient",
    },
    glow: {
        type: ControlType.Boolean,
        title: "Chroma glow",
        defaultValue: true,
        helperText: "Soft colored glow trailing letters while typing",
    },
    popIn: {
        type: ControlType.Boolean,
        title: "Letter pop-in",
        defaultValue: true,
        helperText: "Letters rise + unblur as they land (premium feel)",
    },
    cursor: { type: ControlType.Boolean, defaultValue: true },
    cursorColor: { type: ControlType.Color, defaultValue: "#D6FF4B" },
    prefixColor: { type: ControlType.Color, defaultValue: "#6E6E73" },
    textColor: { type: ControlType.Color, defaultValue: "#F4F3EF" },
    fontSize: {
        type: ControlType.Number,
        defaultValue: 72,
        min: 16,
        max: 240,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Number,
        defaultValue: 700,
        min: 300,
        max: 900,
        step: 100,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter spacing",
        defaultValue: -0.01,
        min: -0.05,
        max: 0.2,
        step: 0.005,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font (optional)",
        defaultValue: "",
        helperText: "e.g. 'JetBrains Mono', monospace — leave empty to inherit",
    },
    align: {
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
})
