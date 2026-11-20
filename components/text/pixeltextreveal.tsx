import { useRef, useEffect, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"

const FALLBACK_FONT = "sans-serif"

// Visually hidden but readable by screen readers and search engines
const srOnlyStyle: React.CSSProperties = {
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

function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function noise(x: number, y: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + 43.3) * 43758.5453
    return n - Math.floor(n)
}

function resolveCanvasColor(color: string): string {
    if (typeof window === "undefined") return color
    if (!color) return "#000000"
    const el = document.createElement("div")
    el.style.color = color
    document.body.appendChild(el)
    const resolved = window.getComputedStyle(el).color
    document.body.removeChild(el)
    return resolved || color
}

interface Block {
    bx: number
    by: number
    bw: number
    bh: number
    sweepAt: number
    hasText: boolean
}

type SizeUnit = "px" | "rem" | "fit"
type SemanticTag =
    | "div"
    | "span"
    | "p"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"

export default function PixelTextReveal({
    text = "WORK THAT\nSPEAKS",
    fontSize = 30,
    fontSizeUnit = "px",
    remBase = 16,
    lineHeight = 1,
    baselineOffset = 0.85,
    startDelay = 0,
    font,
    color = "#000000",
    blockSize = 10,
    irregularity = 0.5,
    textDelaySec = 0.12,
    duration = 0.8,
    triggerOnce = true,
    threshold = 0.3,
    wrapWords = false,
    balanceLines = true,
    textAlign = "left",
    tag = "div",
    style,
    ...props
}: {
    text?: string
    fontSize?: number
    fontSizeUnit?: SizeUnit
    remBase?: number
    lineHeight?: number
    baselineOffset?: number
    startDelay?: number
    font?: React.CSSProperties
    color?: string
    blockSize?: number
    irregularity?: number
    textDelaySec?: number
    duration?: number
    triggerOnce?: boolean
    threshold?: number
    wrapWords?: boolean
    balanceLines?: boolean
    textAlign?: "left" | "center" | "right"
    tag?: SemanticTag
    style?: React.CSSProperties
    [key: string]: any
}) {
    // Fonts come from Framer's Font control, so Framer loads the selected
    // font itself; the canvas then draws with the real family name.
    const fontFamily = font?.fontFamily
        ? `${font.fontFamily}, ${FALLBACK_FONT}`
        : FALLBACK_FONT
    const fontPrefix = `${font?.fontStyle || "normal"} ${font?.fontWeight || 700}`
    const reduceMotion = useReducedMotion() === true
    const isStatic = useIsStaticRenderer()
    // Static renders (canvas thumbnails, previews) and reduced motion show
    // the finished text instead of the animation.
    const showFinal = isStatic || reduceMotion

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const blockGridRef = useRef<Block[]>([])
    const elapsedRef = useRef(0)
    const rafRef = useRef(0)
    const timeoutRef = useRef<number | null>(null)
    const hasTriggered = useRef(false)
    const actualFontSizeRef = useRef(fontSize)
    const textLayerRef = useRef<HTMLCanvasElement | null>(null)
    const resolvedColorRef = useRef(color)
    const resizeRafRef = useRef(0)
    const lastObservedWidthRef = useRef(0)
    const previousTagRef = useRef<SemanticTag>(tag)
    // Stores the final lines after word-wrap processing
    const effectiveLinesRef = useRef<string[]>(
        text.replace(/\\n/g, "\n").split("\n")
    )

    const rawLines = useMemo(
        () => text.replace(/\\n/g, "\n").split("\n"),
        [text]
    )
    const FIT_MIN = 1
    const FIT_MAX = 400

    // Large animated headings do not benefit visually from an unlimited DPR,
    // but memory use and per-frame drawing cost grow very quickly above 2x.
    const getDpr = useCallback(() => {
        if (typeof window === "undefined") return 1
        return Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    }, [])

    const measureTextVisualWidth = useCallback(
        (ctx: CanvasRenderingContext2D, line: string) => {
            const metrics = ctx.measureText(line)
            const visualRight =
                typeof metrics.actualBoundingBoxRight === "number"
                    ? metrics.actualBoundingBoxRight
                    : metrics.width
            return Math.max(visualRight, 1)
        },
        []
    )

    // Wrap text to the available width. When Balance is enabled, a small
    // dynamic-programming pass redistributes words across the same number of
    // lines and strongly discourages a one-word final line.
    const computeWrappedLines = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            maxWidth: number,
            sourceLines: string[]
        ): string[] => {
            if (!wrapWords || maxWidth <= 0) return sourceLines

            const wrapGreedy = (words: string[]) => {
                const lines: string[] = []
                let current = ""

                for (const word of words) {
                    const test = current ? `${current} ${word}` : word
                    if (
                        measureTextVisualWidth(ctx, test) > maxWidth &&
                        current
                    ) {
                        lines.push(current)
                        current = word
                    } else {
                        current = test
                    }
                }

                if (current) lines.push(current)
                return lines
            }

            const balanceParagraph = (words: string[], lineCount: number) => {
                if (!balanceLines || lineCount <= 1 || words.length <= 2) {
                    return wrapGreedy(words)
                }

                const wordCount = words.length
                const fullWidth = measureTextVisualWidth(ctx, words.join(" "))
                const idealWidth = Math.min(maxWidth, fullWidth / lineCount)
                const costs = Array.from({ length: lineCount + 1 }, () =>
                    Array(wordCount + 1).fill(Number.POSITIVE_INFINITY)
                )
                const previous = Array.from({ length: lineCount + 1 }, () =>
                    Array(wordCount + 1).fill(-1)
                )

                costs[0][0] = 0

                for (let lineIndex = 1; lineIndex <= lineCount; lineIndex++) {
                    for (let end = lineIndex; end <= wordCount; end++) {
                        for (let start = lineIndex - 1; start < end; start++) {
                            if (!Number.isFinite(costs[lineIndex - 1][start])) {
                                continue
                            }

                            const phrase = words.slice(start, end).join(" ")
                            const width = measureTextVisualWidth(ctx, phrase)
                            const isSingleWord = end - start === 1

                            if (width > maxWidth && !isSingleWord) continue

                            const difference =
                                (width - idealWidth) / Math.max(1, maxWidth)
                            let penalty = difference * difference

                            // Avoid an orphan on the final line whenever a
                            // valid alternative distribution is available.
                            if (isSingleWord && words.length > lineCount) {
                                penalty += lineIndex === lineCount ? 4 : 0.35
                            }

                            const nextCost =
                                costs[lineIndex - 1][start] + penalty

                            if (nextCost < costs[lineIndex][end]) {
                                costs[lineIndex][end] = nextCost
                                previous[lineIndex][end] = start
                            }
                        }
                    }
                }

                if (!Number.isFinite(costs[lineCount][wordCount])) {
                    return wrapGreedy(words)
                }

                const balanced: string[] = []
                let end = wordCount

                for (let lineIndex = lineCount; lineIndex > 0; lineIndex--) {
                    const start = previous[lineIndex][end]
                    if (start < 0) return wrapGreedy(words)
                    balanced.unshift(words.slice(start, end).join(" "))
                    end = start
                }

                return balanced
            }

            const result: string[] = []

            for (const line of sourceLines) {
                const trimmed = line.trim()

                if (!trimmed) {
                    result.push("")
                    continue
                }

                const words = trimmed.split(/\s+/)
                const greedyLines = wrapGreedy(words)
                result.push(...balanceParagraph(words, greedyLines.length))
            }

            return result.length > 0 ? result : sourceLines
        },
        [wrapWords, balanceLines, measureTextVisualWidth]
    )

    const getActualFontSize = useCallback(() => {
        if (typeof window === "undefined") return fontSize
        if (fontSizeUnit === "rem") return fontSize * remBase
        if (fontSizeUnit === "fit") {
            const availableWidth = wrapperRef.current?.clientWidth || 0
            if (!availableWidth) return fontSize
            const tempCanvas = document.createElement("canvas")
            const ctx = tempCanvas.getContext("2d")
            if (!ctx) return fontSize
            ctx.font = `${fontPrefix} 100px ${fontFamily}`
            // Always calculate Fit from the source lines. Using wrapped lines
            // left by a previous pass can produce a different font size during
            // the same refresh and make the canvas height too small.
            const linesToMeasure = rawLines
            let maxTextWidth = 0
            linesToMeasure.forEach((line) => {
                const metrics = ctx.measureText(line)
                maxTextWidth = Math.max(maxTextWidth, metrics.width)
            })
            if (!maxTextWidth) return fontSize
            const calculated = (availableWidth / maxTextWidth) * 100
            return Math.min(FIT_MAX, Math.max(FIT_MIN, calculated))
        }
        return fontSize
    }, [fontSize, fontSizeUnit, remBase, fontPrefix, fontFamily, rawLines])

    const getFont = useCallback(() => {
        const actualFontSize = getActualFontSize()
        actualFontSizeRef.current = actualFontSize
        return `${fontPrefix} ${actualFontSize}px ${fontFamily}`
    }, [getActualFontSize, fontPrefix, fontFamily])

    const getLineHeight = useCallback(() => {
        return actualFontSizeRef.current * lineHeight
    }, [lineHeight])

    const getTextY = useCallback(
        (index: number) => {
            const actualFontSize = actualFontSizeRef.current
            const LINE_HEIGHT = getLineHeight()
            return index * LINE_HEIGHT + actualFontSize * baselineOffset
        },
        [getLineHeight, baselineOffset]
    )

    const buildGrid = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = getDpr()
        const W = canvas.width / dpr
        const H = canvas.height / dpr
        const bs = blockSize
        const cols = Math.ceil(W / bs)
        const rows = Math.ceil(H / bs)
        // resizeCanvas() has already resolved Fit for this refresh. Reuse that
        // exact size instead of calculating Fit a second time.
        const FONT = `${fontPrefix} ${actualFontSizeRef.current}px ${fontFamily}`
        const resolvedColor = resolveCanvasColor(color)
        resolvedColorRef.current = resolvedColor

        const off = document.createElement("canvas")
        off.width = canvas.width
        off.height = canvas.height
        const oc = off.getContext("2d")!
        oc.setTransform(dpr, 0, 0, dpr, 0, 0)
        oc.fillStyle = resolvedColor
        oc.font = FONT
        // Always measure with "left" so actualBoundingBoxRight = full width
        oc.textAlign = "left"

        const textX =
            textAlign === "center" ? W / 2 : textAlign === "right" ? W : 0

        // ── WORD WRAP: use canvas width (= container width when wrapWords is on) ──
        const lines = wrapWords
            ? computeWrappedLines(oc, W, rawLines)
            : effectiveLinesRef.current

        // Now switch to actual alignment for drawing
        oc.textAlign = textAlign
        lines.forEach((line, i) => {
            oc.fillText(line, textX, getTextY(i))
        })
        textLayerRef.current = off

        const imgData = oc.getImageData(0, 0, off.width, off.height).data
        const grid: Block[] = []

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const bx = col * bs
                const by = row * bs
                const bw = Math.min(bs, W - bx)
                const bh = Math.min(bs, H - by)
                let hasText = false
                outer: for (let py = by; py < by + bh; py++) {
                    for (let px = bx; px < bx + bw; px++) {
                        const idx =
                            (Math.round(py * dpr) * off.width +
                                Math.round(px * dpr)) *
                            4
                        if (imgData[idx + 3] > 30) {
                            hasText = true
                            break outer
                        }
                    }
                }
                const baseNorm = col / Math.max(1, cols - 1)
                const nv = noise(col * 0.4, row * 0.4)
                const norm =
                    baseNorm * (1 - irregularity * 0.65) +
                    nv * irregularity * 0.65
                const sweepAt = norm * duration
                grid.push({ bx, by, bw, bh, sweepAt, hasText })
            }
        }
        blockGridRef.current = grid
    }, [
        blockSize,
        irregularity,
        color,
        duration,
        fontPrefix,
        fontFamily,
        getTextY,
        rawLines,
        computeWrappedLines,
        textAlign,
        getDpr,
    ])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const dpr = getDpr()
        const W = canvas.width / dpr
        const H = canvas.height / dpr
        const t = showFinal ? Number.MAX_SAFE_INTEGER : elapsedRef.current
        const resolvedColor = resolvedColorRef.current
        const textLayer = textLayerRef.current

        const PIX_FADE_IN = Math.min(0.04, duration * 0.08)
        const PIX_FADE_OUT = Math.min(0.09, duration * 0.12)
        const TXT_FADE_IN = Math.min(0.1, duration * 0.15)
        const textX =
            textAlign === "center" ? W / 2 : textAlign === "right" ? W : 0

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)

        blockGridRef.current.forEach(({ bx, by, bw, bh, sweepAt, hasText }) => {
            if (!hasText) return
            const dPix = t - sweepAt
            const dTxt = t - (sweepAt + textDelaySec)
            let pixAlpha = 0
            if (dPix > 0 && dPix < PIX_FADE_IN) {
                pixAlpha = easeInOut(dPix / PIX_FADE_IN)
            } else if (dPix >= PIX_FADE_IN && dTxt < 0) {
                pixAlpha = 1
            } else if (dTxt >= 0 && dTxt < PIX_FADE_OUT) {
                pixAlpha = easeInOut(1 - dTxt / PIX_FADE_OUT)
            }
            if (pixAlpha > 0) {
                ctx.fillStyle = resolvedColor
                ctx.globalAlpha = pixAlpha
                ctx.fillRect(bx, by, bw, bh)
            }
        })

        ctx.globalAlpha = 1
        if (textLayer) {
            ctx.save()
            ctx.beginPath()
            blockGridRef.current.forEach(
                ({ bx, by, bw, bh, sweepAt, hasText }) => {
                    if (!hasText) return
                    if (t - (sweepAt + textDelaySec) >= TXT_FADE_IN) {
                        ctx.rect(bx, by, bw, bh)
                    }
                }
            )
            ctx.clip()
            ctx.drawImage(
                textLayer,
                0,
                0,
                textLayer.width,
                textLayer.height,
                0,
                0,
                W,
                H
            )
            ctx.restore()
        }

        blockGridRef.current.forEach(({ bx, by, bw, bh, sweepAt, hasText }) => {
            if (!hasText) return
            const dTxt = t - (sweepAt + textDelaySec)
            if (textLayer && dTxt > 0 && dTxt < TXT_FADE_IN) {
                ctx.save()
                ctx.beginPath()
                ctx.rect(bx, by, bw, bh)
                ctx.clip()
                ctx.globalAlpha = easeInOut(dTxt / TXT_FADE_IN)
                ctx.drawImage(
                    textLayer,
                    0,
                    0,
                    textLayer.width,
                    textLayer.height,
                    0,
                    0,
                    W,
                    H
                )
                ctx.globalAlpha = 1
                ctx.restore()
            }
        })
    }, [duration, textDelaySec, getDpr, showFinal])

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = getDpr()
        const ctx = canvas.getContext("2d")!
        const FONT = getFont()
        const LINE_HEIGHT = getLineHeight()
        ctx.font = FONT
        ctx.textAlign = "left" // always measure with left to get correct full width

        // Always use container width as wrap boundary when wrapWords is on
        const containerWidth = wrapperRef.current?.clientWidth || 0

        const wrappedLines =
            wrapWords && containerWidth > 0
                ? computeWrappedLines(ctx, containerWidth, rawLines)
                : rawLines
        effectiveLinesRef.current = wrappedLines

        let maxW = 0
        wrappedLines.forEach((line) => {
            maxW = Math.max(maxW, measureTextVisualWidth(ctx, line))
        })

        // When wrapping: canvas fills container width
        // When fit mode: canvas fills container width
        // When px/rem without wrap: canvas fits text
        const W =
            wrapWords && containerWidth > 0
                ? containerWidth
                : fontSizeUnit === "fit"
                  ? containerWidth || Math.ceil(maxW)
                  : Math.ceil(maxW) + 20

        const H = Math.ceil(wrappedLines.length * LINE_HEIGHT)

        canvas.width = Math.max(1, Math.round(W * dpr))
        canvas.height = Math.max(1, Math.round(H * dpr))
        canvas.style.width = W + "px"
        canvas.style.height = H + "px"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }, [
        getFont,
        getLineHeight,
        rawLines,
        fontSizeUnit,
        wrapWords,
        computeWrappedLines,
        measureTextVisualWidth,
        getDpr,
    ])

    const playAnimation = useCallback(() => {
        if (showFinal) {
            render()
            return
        }
        elapsedRef.current = 0
        const TXT_FADE_IN = Math.min(0.1, duration * 0.15)
        const totalTime = duration + textDelaySec + TXT_FADE_IN
        const startTime = performance.now()
        const step = (now: number) => {
            const elapsed = (now - startTime) / 1000
            elapsedRef.current = elapsed
            render()
            if (elapsed < totalTime)
                rafRef.current = requestAnimationFrame(step)
        }
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(step)
    }, [render, duration, textDelaySec, showFinal])

    const playWithDelay = useCallback(() => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        if (startDelay <= 0) {
            playAnimation()
            return
        }
        timeoutRef.current = window.setTimeout(() => {
            playAnimation()
            timeoutRef.current = null
        }, startDelay * 1000)
    }, [playAnimation, startDelay])

    const refresh = useCallback(() => {
        resizeCanvas()
        buildGrid()
        render()
    }, [resizeCanvas, buildGrid, render])

    useEffect(() => {
        let cancelled = false

        /**
         * Build synchronously first so IntersectionObserver can never consume
         * a trigger while the Canvas is empty. When the real web font becomes
         * available, rebuild once using the final metrics without gating play.
         */
        refresh()

        const refreshAfterFonts = async () => {
            try {
                if (document.fonts) {
                    await document.fonts.load(
                        `${fontPrefix} 100px ${fontFamily}`
                    )
                    await document.fonts.ready
                }
            } catch {
                // Keep the already rendered fallback-font Canvas.
            }

            if (!cancelled) {
                refresh()
            }
        }

        refreshAfterFonts()

        // Framer may inject the selected font's @font-face after mount;
        // rebuild whenever more fonts finish loading.
        const fontSet = typeof document !== "undefined" ? document.fonts : null
        const onFontsLoaded = () => {
            if (!cancelled) refresh()
        }
        fontSet?.addEventListener?.("loadingdone", onFontsLoaded)

        return () => {
            cancelled = true
            fontSet?.removeEventListener?.("loadingdone", onFontsLoaded)
        }
    }, [fontFamily, fontPrefix, refresh])

    useEffect(() => {
        if (previousTagRef.current === tag) return

        previousTagRef.current = tag
        hasTriggered.current = false
        elapsedRef.current = 0
        lastObservedWidthRef.current = 0

        cancelAnimationFrame(rafRef.current)
        cancelAnimationFrame(resizeRafRef.current)

        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        // Changing the semantic tag replaces the wrapper and canvas DOM nodes.
        // Rebuild the new canvas; the observer will then replay the animation.
        resizeRafRef.current = requestAnimationFrame(refresh)
    }, [tag, refresh])

    useEffect(() => {
        const el = wrapperRef.current
        if (!el) return
        const observer = new ResizeObserver(([entry]) => {
            const nextWidth = entry.contentRect.width

            if (Math.abs(nextWidth - lastObservedWidthRef.current) < 0.5) {
                return
            }

            lastObservedWidthRef.current = nextWidth
            cancelAnimationFrame(resizeRafRef.current)
            resizeRafRef.current = requestAnimationFrame(refresh)
        })
        observer.observe(el)
        return () => {
            observer.disconnect()
            cancelAnimationFrame(resizeRafRef.current)
        }
    }, [refresh, tag])

    useEffect(() => {
        const el = wrapperRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (triggerOnce && hasTriggered.current) return

                    hasTriggered.current = true
                    playWithDelay()
                } else {
                    if (!triggerOnce) {
                        hasTriggered.current = false
                        elapsedRef.current = 0
                        if (timeoutRef.current !== null) {
                            window.clearTimeout(timeoutRef.current)
                            timeoutRef.current = null
                        }
                        cancelAnimationFrame(rafRef.current)
                        render()
                    }
                }
            },
            { threshold }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [triggerOnce, threshold, playWithDelay, render, tag])

    useEffect(() => {
        return () => {
            cancelAnimationFrame(rafRef.current)
            cancelAnimationFrame(resizeRafRef.current)
            if (timeoutRef.current !== null)
                window.clearTimeout(timeoutRef.current)
        }
    }, [])

    const WrapperTag = tag as any
    const accessibleText = rawLines.join(" ").replace(/\s+/g, " ").trim()
    // Only forward safe DOM attributes; Framer passes extra props that
    // should not land on the DOM element.
    const domProps = Object.fromEntries(
        Object.entries(props).filter(
            ([key]) =>
                key === "id" ||
                key === "className" ||
                key.startsWith("data-") ||
                key.startsWith("aria-")
        )
    )

    return (
        <WrapperTag
            ref={wrapperRef}
            style={{
                display:
                    fontSizeUnit === "fit" || wrapWords
                        ? "block"
                        : "inline-block",
                width: fontSizeUnit === "fit" || wrapWords ? "100%" : undefined,
                position: "relative",
                margin: 0,
                padding: 0,
                ...style,
            }}
            {...domProps}
        >
            <span style={srOnlyStyle}>{accessibleText}</span>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{ display: "block" }}
            />
        </WrapperTag>
    )
}

addPropertyControls(PixelTextReveal, {
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        defaultValue: "div",
        options: ["div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6"],
        optionTitles: ["Div", "Span", "P", "H1", "H2", "H3", "H4", "H5", "H6"],
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "WORK THAT\nSPEAKS",
        displayTextArea: true,
        description: "Use a new line or \\n for line breaks",
    },
    wrapWords: {
        type: ControlType.Boolean,
        title: "Word Wrap",
        defaultValue: false,
        enabledTitle: "Auto",
        disabledTitle: "Manual",
        description: "Auto-wrap long lines to fit container width",
    },
    balanceLines: {
        type: ControlType.Boolean,
        title: "Balance",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Balance wrapped lines and avoid a one-word last line",
        hidden(props) {
            return !props.wrapWords
        },
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#000000" },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        min: 0,
        max: 240,
        step: 1,
        defaultValue: 30,
        hidden(props) {
            return props.fontSizeUnit === "fit"
        },
    },
    fontSizeUnit: {
        type: ControlType.Enum,
        title: "Unit",
        description: "Fit scales the text to fill the container width",
        options: ["px", "rem", "fit"],
        optionTitles: ["Px", "Rem", "Fit"],
        defaultValue: "px",
    },
    remBase: {
        type: ControlType.Number,
        title: "Rem Base",
        min: 8,
        max: 24,
        step: 1,
        defaultValue: 16,
        hidden(props) {
            return props.fontSizeUnit !== "rem"
        },
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        description: "Line spacing, relative to font size",
        min: 0.8,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    baselineOffset: {
        type: ControlType.Number,
        title: "Baseline",
        min: 0.7,
        max: 1,
        step: 0.01,
        defaultValue: 0.85,
        description: "Adjust if letters look clipped at the top or bottom",
    },
    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0,
        description: "Delay before animation starts, in seconds",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "monospace",
    },
    blockSize: {
        type: ControlType.Number,
        title: "Block Size",
        description: "Size of each pixel block in px. Smaller = finer detail",
        min: 2,
        max: 40,
        step: 2,
        defaultValue: 10,
    },
    irregularity: {
        type: ControlType.Number,
        title: "Irregularity",
        description: "0 = clean left-to-right sweep, 1 = scattered reveal",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    textDelaySec: {
        type: ControlType.Number,
        title: "Text Delay",
        description: "How long each block stays solid before the letters appear",
        min: 0.02,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.12,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        description: "Time for the sweep to cross the whole text, in seconds",
        min: 0.3,
        max: 5,
        step: 0.1,
        defaultValue: 0.8,
    },
    threshold: {
        type: ControlType.Number,
        title: "Trigger %",
        description: "How much of the text must be visible before it plays",
        min: 0.05,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.3,
    },
    triggerOnce: {
        type: ControlType.Boolean,
        title: "Trigger Once",
        description: "Off replays the animation each time it scrolls into view",
        defaultValue: true,
    },
})
