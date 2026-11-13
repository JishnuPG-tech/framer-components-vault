// User instructions:
// - Make default text “Scrambly text.”
// - Change color setting to be named just “Color”
// - Keep the font styling, but use the native Framer font selector in the props
// - Make it so that multiple lines of text entered appear one after the other in the same spot, looping.
// Inquiry: Clarifying scramble positions vs text length behavior across fonts.

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


// Create a safe wrapper for startTransition to avoid runtime errors if unavailable
const { useState, useEffect, useMemo } = React
const safeStartTransition: typeof React.startTransition =
    typeof React.startTransition === "function"
        ? React.startTransition
        : (callback: () => void) => {
              callback()
          }

// Bounce keyframes for the entire text block
const bounceInKeyframes = `
@keyframes bounceIn {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes wipeBg {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
`

// Scramble characters
const scrambleChars = "!<>-_\\/[]{}—=+*^?#________"

// Helper to create a semi-transparent glow color from the base text color
function getGlowColor(color: string): string {
    const hexMatch = color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    if (hexMatch) {
        let hex = hexMatch[1]
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((ch) => ch + ch)
                .join("")
        }

        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)

        // Subtle but clearly visible glow with low opacity
        return `rgba(${r}, ${g}, ${b}, 0.04)`
    }

    // Support rgb/rgba() strings with a similarly subtle alpha
    const rgbMatch = color.match(
        /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)$/
    )
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10)
        const g = parseInt(rgbMatch[2], 10)
        const b = parseInt(rgbMatch[3], 10)
        return `rgba(${r}, ${g}, ${b}, 0.04)`
    }

    // Fallback to a very low-opacity white glow if we can't parse the color
    return "rgba(255, 255, 255, 0.04)"
}

interface TextScrambleProps {
    text: any
    font?: any
    fontFamily: string
    fontSize: number
    fontWeight: number | string
    letterSpacing: number
    lineHeight: number
    verticalAlign: "top" | "center" | "bottom"
    scrambleDuration: number
    lineDelay: number
    style?: React.CSSProperties
    showBackgroundColor: boolean
    bounceEnabled: boolean
    loopEnabled: boolean
}

/**
 * Scrambling text that cycles through multiple lines in sequence.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 150
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerDisableUnlink
 */
export default function ScramblyText(props: Partial<TextScrambleProps>) {
    const {
        text = "Scrambly text.",
        font,
        fontFamily = "",
        fontSize = 32,
        fontWeight = 700,
        letterSpacing = -0.02,
        lineHeight = 1.2,
        verticalAlign = "center",
        scrambleDuration = 0.5,
        lineDelay = 1.5,
        style,
        showBackgroundColor = true,
        bounceEnabled = true,
        loopEnabled = true,
    } = props

    const { normalizedText, lines, lineColors, lineBgColors } = useMemo(() => {
        const resultLines: string[] = []
        const resultColors: (string | undefined)[] = []
        const resultBgColors: (string | undefined)[] = []

        if (Array.isArray(text)) {
            for (const item of text as any[]) {
                if (typeof item === "string") {
                    resultLines.push(item)
                    resultColors.push(undefined)
                    resultBgColors.push(undefined)
                } else if (item && typeof item === "object") {
                    const lineText =
                        typeof item.text === "string" ? item.text : ""
                    resultLines.push(lineText)
                    resultColors.push(
                        typeof item.color === "string" ? item.color : undefined
                    )
                    resultBgColors.push(
                        showBackgroundColor &&
                            typeof (item as any).backgroundColor === "string"
                            ? (item as any).backgroundColor
                            : undefined
                    )
                }
            }
        } else if (typeof text === "string") {
            const splitLines = text.split("\n")
            for (const line of splitLines) {
                resultLines.push(line)
                resultColors.push(undefined)
                resultBgColors.push(undefined)
            }
        }

        const joined = resultLines.join("\n")
        return {
            normalizedText: joined,
            lines: resultLines,
            lineColors: resultColors,
            lineBgColors: resultBgColors,
        }
    }, [text, showBackgroundColor])

    // CHANGED: make font size respect both numeric and string values from the font picker
    const resolvedFontSize = (() => {
        const fs = (font as any)?.fontSize
        if (typeof fs === "number") return fs
        if (typeof fs === "string") {
            const parsed = parseFloat(fs)
            return isNaN(parsed) ? fontSize : parsed
        }
        return fontSize
    })()
    const resolvedLineHeight = (() => {
        const lh = (font as any)?.lineHeight
        if (typeof lh === "number") return lh
        if (typeof lh === "string") {
            const parsed = parseFloat(lh)
            return isNaN(parsed) ? lineHeight : parsed
        }
        return lineHeight
    })()
    const resolvedLetterSpacing = (() => {
        const ls = (font as any)?.letterSpacing
        if (typeof ls === "number") return ls
        if (typeof ls === "string") {
            const numeric = parseFloat(ls)
            if (ls.endsWith("em")) return numeric
            if (ls.endsWith("px")) return numeric / 16
            return isNaN(numeric) ? letterSpacing : numeric
        }
        return letterSpacing
    })()
    const resolvedFontFamily = (font as any)?.fontFamily || fontFamily
    const resolvedFontWeight = (font as any)?.fontWeight || fontWeight
    const resolvedTextAlign = (font as any)?.textAlign || "left"

    const [displayHTML, setDisplayHTML] = useState("")
    const [charWidths, setCharWidths] = useState<number[][] | null>(null)
    const [isMeasuring, setIsMeasuring] = useState(false)
    const [scrambleCharMaxWidth, setScrambleCharMaxWidth] = useState(0)
    const [didBounce, setDidBounce] = useState(false)
    const [currentLineIndex, setCurrentLineIndex] = useState(0)
    const [currentBgColor, setCurrentBgColor] = useState("transparent")
    const [bgBaseColor, setBgBaseColor] = useState("transparent")
    const [bgAnimColor, setBgAnimColor] = useState<string | null>(null)
    const [bgAnimating, setBgAnimating] = useState(false)
    const [currentLineColor, setCurrentLineColor] = useState("#FFFFFF")
    const [hasMounted, setHasMounted] = useState(false)

    // Insert bounce keyframes (browser only)
    useEffect(() => {
        if (typeof document === "undefined") return

        const existing = document.querySelector(
            '[data-bounce-in="true"]'
        ) as HTMLStyleElement | null
        if (existing) return

        const styleTag = document.createElement("style")
        styleTag.setAttribute("data-bounce-in", "true")
        styleTag.innerHTML = bounceInKeyframes
        document.head.appendChild(styleTag)

        return () => {
            if (styleTag.parentNode) {
                styleTag.parentNode.removeChild(styleTag)
            }
        }
    }, [])

    // Measure character widths for each line
    useEffect(() => {
        if (!normalizedText) {
            safeStartTransition(() => {
                setCharWidths(null)
                setIsMeasuring(false)
                setScrambleCharMaxWidth(0)
            })
            return
        }
        if (typeof document === "undefined") return

        safeStartTransition(() => setIsMeasuring(true))

        const measureContainer = document.createElement("div")
        measureContainer.style.position = "absolute"
        measureContainer.style.visibility = "hidden"
        measureContainer.style.whiteSpace = "pre"
        measureContainer.style.fontFamily = resolvedFontFamily || ""
        measureContainer.style.fontSize = resolvedFontSize + "px"
        measureContainer.style.fontWeight = String(resolvedFontWeight)
        measureContainer.style.letterSpacing = resolvedLetterSpacing + "em"
        measureContainer.style.lineHeight = String(resolvedLineHeight)
        measureContainer.style.padding = "0"
        measureContainer.style.margin = "0"

        document.body.appendChild(measureContainer)

        const measured: number[][] = []
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex]
            const widths: number[] = []

            if (line.length === 0) {
                measured.push([])
                continue
            }

            for (let i = 0; i < line.length; i++) {
                let char = line[i]
                if (char === " ") {
                    char = "\u00A0"
                }
                measureContainer.textContent = char
                let w = measureContainer.getBoundingClientRect().width
                if (w < 0.1) w = 0.1
                widths.push(w)
            }
            measured.push(widths)
        }

        let maxScrambleWidth = 0
        for (let i = 0; i < scrambleChars.length; i++) {
            const sChar = scrambleChars[i]
            measureContainer.textContent = sChar
            let w = measureContainer.getBoundingClientRect().width
            if (w < 0.1) w = 0.1
            if (w > maxScrambleWidth) maxScrambleWidth = w
        }

        document.body.removeChild(measureContainer)

        safeStartTransition(() => {
            setCharWidths(measured)
            setIsMeasuring(false)
            setScrambleCharMaxWidth(maxScrambleWidth)
        })
    }, [
        normalizedText,
        lines,
        resolvedFontFamily,
        resolvedFontSize,
        resolvedFontWeight,
        resolvedLetterSpacing,
        resolvedLineHeight,
    ])

    // Scramble logic: loop through lines one after another
    useEffect(() => {
        if (!normalizedText) return
        if (!charWidths) return
        if (typeof window === "undefined") return

        let cancelled = false
        let requestId: number | null = null
        let timeoutId: number | null = null

        function randomChar() {
            return scrambleChars[
                Math.floor(Math.random() * scrambleChars.length)
            ]
        }

        function span(
            char: string,
            c: string,
            baseWidthPx: number,
            isRevealed: boolean,
            scrambleWidthPx: number,
            extraStyle: string = ""
        ) {
            const effectiveWidth = baseWidthPx
            const safeChar = char
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
            return `<span style="
                display:inline-block;
                width:${effectiveWidth}px;
                color:${c};
                ${extraStyle}
            ">${safeChar}</span>`
        }

        function scrambleLine(lineIndex: number): Promise<void> {
            return new Promise((resolve) => {
                const line = lines[lineIndex] || ""
                const widthsForLine = charWidths[lineIndex] || []
                const lineColor = lineColors[lineIndex] || "#FFFFFF"
                const lineBgColor = showBackgroundColor
                    ? lineBgColors[lineIndex]
                    : undefined

                if (line.length === 0) {
                    safeStartTransition(() => {
                        setDisplayHTML("")
                        setDidBounce(bounceEnabled)
                        setCurrentLineColor(lineColor)
                    })
                    resolve()
                    return
                }

                const queue: Array<{
                    from: string
                    to: string
                    start: number
                    end: number
                    charIndex: number
                }> = []

                const durationFactor = scrambleDuration || 1
                const baseFrames = 50 * durationFactor

                const centerIndex = (line.length - 1) / 2
                const staggerFrames = 6 * durationFactor

                for (let i = 0; i < line.length; i++) {
                    const from = ""
                    const to = line[i]
                    const distanceFromCenter = Math.abs(i - centerIndex)
                    const start = Math.round(distanceFromCenter * staggerFrames)
                    const randomExtra = Math.floor(Math.random() * baseFrames)
                    const end = start + baseFrames + randomExtra

                    queue.push({
                        from,
                        to,
                        start,
                        end,
                        charIndex: i,
                    })
                }

                let frame = 0
                const firstScrambleFrame = queue.reduce(
                    (min, item) => Math.min(min, item.start),
                    Infinity
                )
                let bgSet = false

                function update() {
                    if (cancelled) {
                        return
                    }

                    if (frame < 0) {
                        frame++
                        requestId = window.requestAnimationFrame(update)
                        return
                    }

                    if (!bgSet && frame >= firstScrambleFrame) {
                        bgSet = true
                        safeStartTransition(() => {
                            const targetColor = lineBgColor || "transparent"
                            setCurrentBgColor(targetColor)
                            setBgAnimColor(targetColor)
                            setBgAnimating(true)
                        })
                    }

                    let complete = 0
                    let lineOutput = ""

                    for (let i = 0; i < line.length; i++) {
                        const item = queue.find((q) => q.charIndex === i)
                        if (!item) continue
                        const { from, to, start, end } = item

                        let displayChar = ""
                        let displayColor = lineColor
                        let extraStyle = ""
                        let isRevealed = false

                        if (frame >= end) {
                            displayChar = to
                            isRevealed = true
                            complete++
                        } else if (frame >= start) {
                            displayChar = randomChar()
                            extraStyle = "opacity:0.32;"
                        } else {
                            displayChar = from
                        }

                        const w = widthsForLine[i] || 0
                        lineOutput += span(
                            displayChar,
                            displayColor,
                            w,
                            isRevealed,
                            scrambleCharMaxWidth,
                            extraStyle
                        )
                    }

                    safeStartTransition(() => setDisplayHTML(lineOutput))

                    if (complete === queue.length) {
                        safeStartTransition(() => {
                            setDidBounce(bounceEnabled)
                        })
                        resolve()
                    } else {
                        frame++
                        requestId = window.requestAnimationFrame(update)
                    }
                }

                safeStartTransition(() => {
                    setDidBounce(false)
                    setCurrentLineIndex(lineIndex)
                    setCurrentLineColor(lineColor)
                })
                update()
            })
        }

        async function loopLines() {
            let index = 0
            const totalLines = Math.max(1, lines.length)

            while (!cancelled) {
                await scrambleLine(index)
                if (cancelled) break

                const isLast = index === totalLines - 1
                if (!loopEnabled && isLast) {
                    break
                }

                await new Promise<void>((res) => {
                    timeoutId = window.setTimeout(
                        () => {
                            if (!cancelled) res()
                        },
                        Math.max(0, (lineDelay || 0) * 1000)
                    )
                })

                if (cancelled) break

                index = (index + 1) % totalLines
            }
        }

        loopLines()

        return () => {
            cancelled = true
            if (requestId !== null) {
                window.cancelAnimationFrame(requestId)
            }
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
            }
        }
    }, [
        normalizedText,
        lines,
        lineColors,
        lineBgColors,
        charWidths,
        scrambleDuration,
        lineDelay,
        scrambleCharMaxWidth,
        bounceEnabled,
        loopEnabled,
    ])

    useEffect(() => {
        safeStartTransition(() => setHasMounted(true))
    }, [])

    const containerStyle: React.CSSProperties = {
        ...(font as any),
        fontFamily: resolvedFontFamily || "",
        fontSize: resolvedFontSize,
        fontWeight: resolvedFontWeight,
        letterSpacing: `${resolvedLetterSpacing}em`,
        lineHeight: resolvedLineHeight,
        whiteSpace: "normal",
        margin: 0,
        padding: 0,
        color: currentLineColor,
        width: "100%",
        maxWidth: "100%",
        textAlign: resolvedTextAlign,
        backgroundColor: "transparent",
    }

    if (didBounce) {
        containerStyle.animation = "bounceIn 0.4s ease forwards"
    }

    const justifyContent =
        verticalAlign === "top"
            ? "flex-start"
            : verticalAlign === "bottom"
              ? "flex-end"
              : "center"

    const wrapperStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        justifyContent,
        margin: 0,
        padding: 0,
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: showBackgroundColor
            ? lineBgColors[currentLineIndex] || "transparent"
            : "transparent",
        minWidth: 5,
        minHeight: 5,
        ...(hasMounted && showBackgroundColor
            ? { transition: "background-color 0.4s ease" }
            : {}),
        // Removed fade transition on background color
        ...style,
    }

    // Always render a visible wrapper with minimum size so the component
    // never collapses to 0 height on the canvas, even while measuring.
    if (isMeasuring || !charWidths) {
        return <div style={wrapperStyle} />
    }

    return (
        <div style={wrapperStyle}>
            {/* Background wipe overlay removed to prevent initial full-opacity flash */}
            <div
                style={containerStyle}
                aria-live="polite"
                aria-atomic="true"
                data-line-index={currentLineIndex}
                dangerouslySetInnerHTML={{ __html: displayHTML }}
            />
        </div>
    )
}

addPropertyControls<TextScrambleProps>(ScramblyText, {
    text: {
        title: "Lines",
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Scrambly text.",
                    placeholder: "Enter line…",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FFFFFF",
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#000000",
                },
            },
        },
        defaultValue: [
            {
                text: "Scrambly text.",
                color: "#9CEB75",
                backgroundColor: "#041200",
            },
            {
                text: "Multiple lines.",
                color: "#FFF185",
                backgroundColor: "#171200",
            },
            {
                text: "Choose any color.",
                color: "#96FFFD",
                backgroundColor: "#000808",
            },
            {
                text: "Customize everything.",
                color: "#FFD9F0",
                backgroundColor: "#140101",
            },
        ],
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        defaultValue: {
            fontSize: 40,
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
        controls: "extended",
        defaultFontType: "monospace",
    },
    verticalAlign: {
        title: "Vertical Align",
        type: ControlType.Enum,
        defaultValue: "center",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
    },
    scrambleDuration: {
        title: "Speed",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    lineDelay: {
        title: "Delay",
        type: ControlType.Number,
        defaultValue: 1.5,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    showBackgroundColor: {
        title: "Background",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    bounceEnabled: {
        title: "Bounce",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loopEnabled: {
        title: "Loop",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "More components at [gustavwf.supply](https://gustavwf.supply/)",
    },
})
