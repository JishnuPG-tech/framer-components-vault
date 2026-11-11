import * as React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Unit = "Words" | "Letters" | "Lines"
type AlignY = "Top" | "Center" | "Bottom"
type CanvasPreview = "Full" | "Custom" | "Off"

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n))
}

function normalizeFont(font: any): React.CSSProperties {
    if (!font) return {}
    const s: any = {}

    if (font.fontFamily) s.fontFamily = font.fontFamily
    if (font.family) s.fontFamily = font.family

    if (font.fontSize != null) s.fontSize = font.fontSize
    if (font.size != null) s.fontSize = font.size

    if (font.fontWeight != null) s.fontWeight = font.fontWeight
    if (font.weight != null) s.fontWeight = font.weight

    if (font.lineHeight != null) s.lineHeight = font.lineHeight
    if (font.letterSpacing != null) s.letterSpacing = font.letterSpacing

    // Native alignment from Font control (varies by Framer version)
    if (font.textAlign) s.textAlign = font.textAlign
    if (font.align) s.textAlign = font.align
    if (font.alignment) s.textAlign = font.alignment

    return s
}

type Token =
    | { kind: "token"; value: string; animIndex: number | null }
    | { kind: "br" }
type LineToken = { kind: "line"; value: string; animIndex: number }

function tokenizeWordsOrLetters(
    raw: string,
    unit: "Words" | "Letters"
): Token[] {
    const lines = (raw ?? "").split("\n")
    const out: Token[] = []
    let animIndex = 0

    for (let li = 0; li < lines.length; li++) {
        const line = lines[li]

        if (unit === "Words") {
            const words = line.trim() ? line.trim().split(/\s+/) : []
            for (let i = 0; i < words.length; i++) {
                // animated word
                out.push({ kind: "token", value: words[i], animIndex })
                animIndex++

                // IMPORTANT: add a real space token so wrapping works
                if (i !== words.length - 1) {
                    out.push({ kind: "token", value: " ", animIndex: null })
                }
            }
            if (!words.length)
                out.push({ kind: "token", value: "\u00A0", animIndex: null })
        } else {
            for (const ch of line) {
                if (ch === " ") {
                    out.push({ kind: "token", value: ch, animIndex: null })
                } else {
                    out.push({ kind: "token", value: ch, animIndex })
                    animIndex++
                }
            }
            if (!line.length)
                out.push({ kind: "token", value: "\u00A0", animIndex: null })
        }

        if (li !== lines.length - 1) out.push({ kind: "br" })
    }

    return out
}

function tokenizeLines(raw: string): LineToken[] {
    const lines = (raw ?? "").split("\n")
    return lines.map((line, idx) => ({
        kind: "line",
        value: line,
        animIndex: idx,
    }))
}

function RevealToken({
    value,
    animIndex,
    totalAnimated,
    progress,
    unit,
}: {
    value: string
    animIndex: number | null
    totalAnimated: number
    progress: any
    unit: "Words" | "Letters"
}) {
    // non-animated tokens (spaces / nbsp)
    if (animIndex === null || totalAnimated <= 0) {
        if (unit === "Letters") {
            return <span>{value === " " ? "\u00A0" : value}</span>
        }
        // Words: keep REAL spaces so wrapping works
        return <span>{value}</span>
    }

    const start = animIndex / totalAnimated
    const end = start + 1 / totalAnimated
    const opacity = useTransform(progress, [start, end], [0, 1])

    return unit === "Letters" ? (
        <motion.span style={{ opacity, display: "inline-block" }}>
            {value === " " ? "\u00A0" : value}
        </motion.span>
    ) : (
        <motion.span style={{ opacity, display: "inline" }}>
            {value}
        </motion.span>
    )
}

function RevealLine({
    line,
    animIndex,
    totalLines,
    progress,
}: {
    line: string
    animIndex: number
    totalLines: number
    progress: any
}) {
    const denom = Math.max(1, totalLines)
    const start = animIndex / denom
    const end = start + 1 / denom
    const opacity = useTransform(progress, [start, end], [0, 1])

    return (
        <motion.div style={{ opacity, display: "block" }}>
            {line.length ? line : "\u00A0"}
        </motion.div>
    )
}

/** Ghost (fully revealed) layer */
function GhostLayer({
    raw,
    unit,
    textColor,
    ghostColor,
    ghostOpacity,
    textAlign,
}: {
    raw: string
    unit: Unit
    textColor: string
    ghostColor: string
    ghostOpacity: number
    textAlign: React.CSSProperties["textAlign"]
}) {
    const color = ghostColor || textColor

    const content =
        unit === "Lines"
            ? raw
                  .split("\n")
                  .map((line, i) => (
                      <div key={`g-l-${i}`}>
                          {line.length ? line : "\u00A0"}
                      </div>
                  ))
            : raw.split("\n").map((line, li) => {
                  const safeLine =
                      unit === "Words"
                          ? line.trim()
                              ? line.trim().split(/\s+/).join(" ")
                              : "\u00A0"
                          : line.length
                            ? line
                            : "\u00A0"

                  return (
                      <React.Fragment key={`g-ln-${li}`}>
                          {li > 0 && <br />}
                          {unit === "Letters"
                              ? [...safeLine].map((ch, i) => (
                                    <span key={`g-c-${li}-${i}`}>
                                        {ch === " " ? "\u00A0" : ch}
                                    </span>
                                ))
                              : safeLine}
                      </React.Fragment>
                  )
              })

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%", // ✅ always match the main text box width
                pointerEvents: "none",
                opacity: ghostOpacity,
                color,
                whiteSpace: "pre-wrap",
                textAlign,
            }}
        >
            {content}
        </div>
    )
}

export default function StickyScrollRevealText(props: any) {
    const {
        text,
        unit,
        font,
        textColor,
        sectionHeightVh,
        speed,
        alignY,
        stickyOffsetPx,
        maxWidth,
        paddingVw,
        wordGapEm,

        canvasPreview,
        canvasPreviewProgress,

        ghostEnabled,
        ghostOpacity,
        ghostColor,
    } = props

    const raw = typeof text === "string" ? text : ""
    const containerRef = React.useRef<HTMLElement | null>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    const baseProgress = useTransform(scrollYProgress, (v: number) =>
        clamp01(v * (typeof speed === "number" ? speed : 1))
    )

    let isCanvas = false
    try {
        isCanvas = RenderTarget.current() === RenderTarget.canvas
    } catch (e) {}

    const progress = useTransform(baseProgress, (v: number) => {
        if (!isCanvas) return v
        if (canvasPreview === "Off") return v
        if (canvasPreview === "Custom") return clamp01(canvasPreviewProgress)
        return 1
    })

    const fontStyles = React.useMemo(() => normalizeFont(font), [font])
    const resolvedTextAlign: React.CSSProperties["textAlign"] =
        (fontStyles as any).textAlign || "center"

    const justifyContent =
        resolvedTextAlign === "left"
            ? "flex-start"
            : resolvedTextAlign === "right"
              ? "flex-end"
              : "center"

    const top =
        alignY === "Top"
            ? `${stickyOffsetPx}px`
            : alignY === "Bottom"
              ? `calc(100vh - ${stickyOffsetPx}px)`
              : `calc(50vh + ${stickyOffsetPx}px)`

    const transform =
        alignY === "Top"
            ? "translateY(0)"
            : alignY === "Bottom"
              ? "translateY(-100%)"
              : "translateY(-50%)"

    const wordOrLetterTokens = React.useMemo(() => {
        if (unit === "Words" || unit === "Letters")
            return tokenizeWordsOrLetters(raw, unit)
        return []
    }, [raw, unit])

    const totalAnimated = React.useMemo(() => {
        let max = -1
        for (const t of wordOrLetterTokens) {
            if (t.kind === "token" && t.animIndex !== null)
                max = Math.max(max, t.animIndex)
        }
        return max + 1
    }, [wordOrLetterTokens])

    const lineTokens = React.useMemo(() => {
        if (unit === "Lines") return tokenizeLines(raw)
        return []
    }, [raw, unit])

    return (
        <section
            ref={containerRef as any}
            style={{
                position: "relative",
                height: `${sectionHeightVh}vh`,
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top,
                    transform,
                    padding: `0 ${paddingVw}vw`,
                    display: "flex",
                    justifyContent,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        maxWidth,
                        width: "100%",
                        color: textColor,
                        whiteSpace: "pre-wrap",
                        textAlign: resolvedTextAlign,
                        ...(unit === "Words"
                            ? { wordSpacing: `${wordGapEm}em` } // ✅ shared by ghost + animated
                            : null),
                        ...fontStyles,
                    }}
                >
                    {ghostEnabled && (
                        <GhostLayer
                            raw={raw}
                            unit={unit}
                            textColor={textColor}
                            ghostColor={ghostColor}
                            ghostOpacity={ghostOpacity}
                            textAlign={resolvedTextAlign}
                        />
                    )}

                    <div style={{ position: "relative" }}>
                        {unit === "Lines"
                            ? lineTokens.map((t, i) => (
                                  <RevealLine
                                      key={`l-${i}`}
                                      line={t.value}
                                      animIndex={t.animIndex}
                                      totalLines={lineTokens.length}
                                      progress={progress}
                                  />
                              ))
                            : wordOrLetterTokens.map((t, i) =>
                                  t.kind === "br" ? (
                                      <br key={`br-${i}`} />
                                  ) : (
                                      <RevealToken
                                          key={`t-${i}`}
                                          value={t.value}
                                          animIndex={t.animIndex}
                                          totalAnimated={totalAnimated}
                                          progress={progress}
                                          unit={unit as any}
                                      />
                                  )
                              )}
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(StickyScrollRevealText, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: `Scroll-synced text reveal.
Words, letters, or lines.
Sticky layout + alignment.
Native fonts, canvas preview, ghost layer.`,
    },
    unit: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["Words", "Letters", "Lines"],
        defaultValue: "Words",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },

    sectionHeightVh: {
        type: ControlType.Number,
        title: "Section Height (vh)",
        defaultValue: 300,
        min: 100,
        max: 800,
        step: 10,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.05,
    },

    alignY: {
        type: ControlType.Enum,
        title: "V Align",
        options: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "Center",
    },
    stickyOffsetPx: {
        type: ControlType.Number,
        title: "Sticky Offset (px)",
        defaultValue: 0,
        min: 0,
        max: 300,
        step: 1,
    },

    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 900,
        min: 320,
        max: 1600,
        step: 10,
    },
    paddingVw: {
        type: ControlType.Number,
        title: "Side Padding (vw)",
        defaultValue: 5,
        min: 0,
        max: 12,
        step: 0.5,
    },

    wordGapEm: {
        type: ControlType.Number,
        title: "Word Gap (em)",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        hidden(props) {
            return props.unit !== "Words"
        },
    },

    canvasPreview: {
        type: ControlType.Enum,
        title: "Canvas Preview",
        options: ["Full", "Custom", "Off"],
        defaultValue: "Full",
    },
    canvasPreviewProgress: {
        type: ControlType.Number,
        title: "Preview Progress",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        hidden(props) {
            return props.canvasPreview !== "Custom"
        },
    },

    ghostEnabled: {
        type: ControlType.Boolean,
        title: "Ghost",
        defaultValue: false,
    },
    ghostOpacity: {
        type: ControlType.Number,
        title: "Ghost Opacity",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        hidden(props) {
            return !props.ghostEnabled
        },
    },
    ghostColor: {
        type: ControlType.Color,
        title: "Ghost Color",
        defaultValue: "rgba(0,0,0,0.35)",
        hidden(props) {
            return !props.ghostEnabled
        },
    },
})
