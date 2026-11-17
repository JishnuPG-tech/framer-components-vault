// Framer Code Component: set the component width to Fill. Scroll length controls its page height.
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

import {
    motion,
    useScroll,
    useTransform,
    type MotionValue,
} from "framer-motion"

type Props = {
    text?: string
    eyebrow?: string
    backgroundColor?: string
    inactiveColor?: string
    activeColor?: string
    accentColor?: string
    fontFamily?: string
    fontSize?: number
    maxWidth?: number
    scrollLength?: number
    alignment?: "left" | "center"
    showProgress?: boolean
    style?: React.CSSProperties
}

type WordProps = {
    word: string
    index: number
    count: number
    progress: MotionValue<number>
    inactiveColor: string
    activeColor: string
}

function ScrollWord({
    word,
    index,
    count,
    progress,
    inactiveColor,
    activeColor,
}: WordProps) {
    const start = 0.08 + (index / count) * 0.84
    const end = 0.08 + ((index + 1) / count) * 0.84
    const color = useTransform(
        progress,
        [start, end],
        [inactiveColor, activeColor]
    )

    return <motion.span style={{ color }}>{word}</motion.span>
}

function ScrollColorReveal(props: Props) {
    const {
        text = "The best ideas don’t shout for attention. They stay with you long enough to change the way you see.",
        eyebrow = "A WORD AT A TIME",
        backgroundColor = "#08090B",
        inactiveColor = "#55575D",
        activeColor = "#F3F0E9",
        accentColor = "#C8AE82",
        fontFamily = "Inter, sans-serif",
        fontSize = 72,
        maxWidth = 1080,
        scrollLength = 240,
        alignment = "center",
        showProgress = true,
        style,
    } = props

    const sectionRef = React.useRef<HTMLElement | null>(null)
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    })
    const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1])

    const tokens = text.match(/\S+|\s+/g) ?? []
    const wordCount = text.match(/\S+/g)?.length ?? 1
    const safeScrollLength = Math.max(160, scrollLength)
    const textAlign = alignment

    let wordIndex = 0

    return (
        <section
            ref={sectionRef}
            aria-label={eyebrow || "Scroll color reveal"}
            style={{
                ...style,
                position: "relative",
                width: style?.width ?? "100%",
                height: `${safeScrollLength}vh`,
                backgroundColor,
                color: activeColor,
                fontFamily,
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    minHeight: "min(100vh, 520px)",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "clamp(28px, 7vw, 112px)",
                }}
            >
                <div style={{ width: "100%", maxWidth: `${maxWidth}px` }}>
                    {eyebrow && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    textAlign === "center"
                                        ? "center"
                                        : "flex-start",
                                gap: 10,
                                marginBottom: "clamp(24px, 4vh, 38px)",
                                color: accentColor,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.18em",
                                lineHeight: 1.2,
                                textTransform: "uppercase",
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    backgroundColor: accentColor,
                                }}
                            />
                            {eyebrow}
                        </div>
                    )}

                    <p
                        style={{
                            margin: 0,
                            color: inactiveColor,
                            textAlign,
                            fontFamily,
                            fontSize: `clamp(${Math.round(fontSize * 0.48)}px, ${fontSize / 14.4}vw, ${fontSize}px)`,
                            fontWeight: 500,
                            lineHeight: 1.08,
                            letterSpacing: "-0.045em",
                        }}
                    >
                        {tokens.map((token, tokenIndex) => {
                            if (/^\s+$/.test(token)) {
                                return (
                                    <React.Fragment key={`space-${tokenIndex}`}>
                                        {token}
                                    </React.Fragment>
                                )
                            }

                            const currentIndex = wordIndex++
                            return (
                                <ScrollWord
                                    key={`word-${tokenIndex}`}
                                    word={token}
                                    index={currentIndex}
                                    count={wordCount}
                                    progress={scrollYProgress}
                                    inactiveColor={inactiveColor}
                                    activeColor={activeColor}
                                />
                            )
                        })}
                    </p>

                    {showProgress && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    textAlign === "center"
                                        ? "center"
                                        : "flex-start",
                                gap: 12,
                                marginTop: "clamp(32px, 6vh, 54px)",
                                color: "rgba(255,255,255,0.52)",
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                            }}
                        >
                            <span>Scroll to reveal</span>
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "relative",
                                    display: "block",
                                    width: 72,
                                    height: 1,
                                    overflow: "hidden",
                                    backgroundColor: "rgba(255,255,255,0.22)",
                                }}
                            >
                                <motion.span
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "block",
                                        backgroundColor: accentColor,
                                        scaleX: progressScale,
                                        transformOrigin: "0% 50%",
                                    }}
                                />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

addPropertyControls(ScrollColorReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "The best ideas don’t shout for attention. They stay with you long enough to change the way you see.",
        displayTextArea: true,
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "A WORD AT A TIME",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#08090B",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Before",
        defaultValue: "#55575D",
    },
    activeColor: {
        type: ControlType.Color,
        title: "After",
        defaultValue: "#F3F0E9",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#C8AE82",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, sans-serif",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 72,
        min: 36,
        max: 120,
        step: 1,
        unit: "px",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Text width",
        defaultValue: 1080,
        min: 320,
        max: 1440,
        step: 10,
        unit: "px",
    },
    scrollLength: {
        type: ControlType.Number,
        title: "Scroll length",
        defaultValue: 240,
        min: 160,
        max: 500,
        step: 10,
        unit: "vh",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["center", "left"],
        optionTitles: ["Center", "Left"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress cue",
        defaultValue: true,
    },
})

export default ScrollColorReveal
