// Text reveal on scroll component - reveals text word by word as user scrolls
import {
    useEffect,
    useRef,
    useState,
    useMemo,
    startTransition,
    memo,
    type CSSProperties,
    type ReactNode,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface WordItem {
    text: string
    isSpace?: boolean
    lineIndex?: number
    letters?: WordItem[]
    linkData?: any
}

interface LinkItem {
    word: string
    link: string
    linkColor: string
    hoverColor: string
}

interface TextRevealScrollProps {
    text: string
    revealType: "mask" | "highlight" | "fade"
    maskDirection?: "top" | "bottom" | "left" | "right"
    maskDirectionLine?: "top" | "bottom"
    directionDisappear?: "top" | "bottom" | "left" | "right"
    directionDisappearLine?: "top" | "bottom"

    font: CSSProperties
    textColor: string
    highlightColor: string
    blurMax: number

    viewport?: "top" | "center" | "bottom"

    // Smooth scroll
    scrollSpeed: number
    easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"

    delay: number
    duration: number
    disappear: boolean
    delayDisappear: number
    disappearType: "mask" | "highlight" | "fade"
    disappearTypeNonHighlight?: "mask" | "fade"
    disappearMode: "letter" | "word" | "line"
    disappearModeMaskSide: "letter" | "word"
    durationDisappear: number

    revealMode: "letter" | "word" | "line"
    revealModeMaskSide: "letter" | "word"
    htmlTag: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span"

    // Optional link mapping for specific words
    links?: LinkItem[]

    style?: CSSProperties
}

/**
 * Sticky Text Reveal on Scroll
 *
 * @framerIntrinsicWidth 530
 * @framerIntrinsicHeight 200
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function StickyTextRevealOnScroll(props: TextRevealScrollProps) {
    const {
        text = "This placeholder text will reveal word by word as you scroll down the page",
        revealType = "highlight",
        maskDirection = "bottom",
        maskDirectionLine = "bottom",
        viewport = "top",
        delay = 0,
        duration = 100,
        disappear = false,
        delayDisappear = 0,
        disappearType = "highlight",
        disappearTypeNonHighlight = "mask",
        directionDisappear = "bottom",
        directionDisappearLine = "bottom",
        disappearMode = "letter",
        disappearModeMaskSide = "letter",
        durationDisappear = 100,
        revealMode = "letter",
        revealModeMaskSide = "letter",
        htmlTag = "p",
        font,
        textColor = "#696969",
        highlightColor = "#ffffff",
        blurMax = 0,
        links = [],
    } = props

    const resolvedDisappearType = useMemo<"mask" | "highlight" | "fade">(() => {
        if (revealType === "highlight") return disappearType
        return disappearTypeNonHighlight
    }, [disappearType, disappearTypeNonHighlight, revealType])

    const resolvedMaskDirection = useMemo(() => {
        if (revealType === "mask" && revealMode === "line")
            return maskDirectionLine
        return maskDirection
    }, [maskDirection, maskDirectionLine, revealMode, revealType])

    const resolvedDirectionDisappear = useMemo(() => {
        if (resolvedDisappearType === "mask" && disappearMode === "line")
            return directionDisappearLine
        return directionDisappear
    }, [
        directionDisappear,
        directionDisappearLine,
        disappearMode,
        resolvedDisappearType,
    ])

    const effectiveRevealMode = useMemo(() => {
        if (revealType !== "mask") return revealMode
        if (
            resolvedMaskDirection === "left" ||
            resolvedMaskDirection === "right"
        ) {
            return revealModeMaskSide
        }
        return revealMode
    }, [resolvedMaskDirection, revealMode, revealModeMaskSide, revealType])

    const effectiveDisappearMode = useMemo(() => {
        if (resolvedDisappearType !== "mask") return disappearMode

        const dir = resolvedDirectionDisappear || resolvedMaskDirection
        if (dir === "left" || dir === "right") {
            return disappearModeMaskSide
        }
        return disappearMode
    }, [
        disappearMode,
        disappearModeMaskSide,
        resolvedDisappearType,
        resolvedDirectionDisappear,
        resolvedMaskDirection,
    ])

    const needsLineMeasurement =
        effectiveRevealMode === "line" || effectiveDisappearMode === "line"

    const needsLetterMeasurement =
        effectiveRevealMode === "letter" ||
        (disappear && effectiveDisappearMode === "letter")

    const Tag = htmlTag as any

    const containerRef = useRef<HTMLDivElement>(null)
    const tagRef = useRef<HTMLElement | null>(null)
    const measureRef = useRef<HTMLSpanElement>(null)
    const plainTextRef = useRef<HTMLSpanElement>(null)
    const isStatic = useIsStaticRenderer()
    const [words, setWords] = useState<WordItem[]>([])
    const [lineCount, setLineCount] = useState(1)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [linesMeasured, setLinesMeasured] = useState(false)
    const [charRects, setCharRects] = useState<
        Array<{ x: number; y: number; width: number; height: number }>
    >([])
    const [measuredLineHeightPx, setMeasuredLineHeightPx] = useState<number>(0)
    const stickyStartScrollRef = useRef<number | null>(null)
    const stickyContextRef = useRef<HTMLElement | null>(null)
    const stickyContextScrollRangeRef = useRef<number>(1)
    const rafIdRef = useRef<number | null>(null)
    const lastScrollProgressRef = useRef(-1)
    const [isInView, setIsInView] = useState(false)

    const currentPhaseMode = useMemo<"letter" | "word" | "line">(() => {
        const isDisappearPhase = disappear && scrollProgress > 1
        return isDisappearPhase ? effectiveDisappearMode : effectiveRevealMode
    }, [disappear, scrollProgress, effectiveDisappearMode, effectiveRevealMode])

    const wordsLetterData = useMemo(() => {
        const needsLetterMode =
            effectiveRevealMode === "letter" ||
            (disappear && effectiveDisappearMode === "letter")
        if (!needsLetterMode) return null
        const units = words.map(
            (token) => token.letters?.length ?? token.text.length
        )
        const totalUnits = units.reduce((a, b) => a + b, 0)
        return { units, totalUnits }
    }, [words, effectiveRevealMode, effectiveDisappearMode, disappear])

    // Find nearest sticky ancestor (used as scroll context)
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        let node: HTMLElement | null = containerRef.current
        let stickyNode: HTMLElement | null = null

        while (node && node !== document.body) {
            const style = window.getComputedStyle(node)
            if (style.position === "sticky") {
                stickyNode = node
                break
            }
            node = node.parentElement
        }

        stickyContextRef.current = stickyNode || containerRef.current

        const updateScrollRange = () => {
            const context = stickyContextRef.current
            if (!context) return

            const contextRect = context.getBoundingClientRect()
            const parent = context.parentElement
            if (!parent) {
                stickyContextScrollRangeRef.current = 1
                return
            }

            const parentRect = parent.getBoundingClientRect()
            const range = Math.max(1, parentRect.height - contextRect.height)
            stickyContextScrollRangeRef.current = Number.isFinite(range)
                ? range
                : 1
        }

        updateScrollRange()
        window.addEventListener("resize", updateScrollRange)
        return () => window.removeEventListener("resize", updateScrollRange)
    }, [])

    // Parse words and measure lines
    useEffect(() => {
        startTransition(() => {
            const linkMap = new Map<string, LinkItem>()
            for (const item of links) {
                if (!item?.word) continue
                linkMap.set(item.word, item)
            }

            // Preserve all whitespace (spaces, tabs, newlines) so line breaks match the original text
            const parts = text.split(/(\s+)/)
            const nextWords: WordItem[] = parts
                .filter((p) => p.length > 0)
                .map((part) => {
                    const isSpace = /^\s+$/.test(part)
                    const linkData = !isSpace ? linkMap.get(part) : undefined
                    return {
                        text: part,
                        isSpace,
                        linkData,
                        letters: isSpace
                            ? part
                                  .split("")
                                  .map((char) => ({
                                      text: char,
                                      isSpace: true,
                                  }))
                            : part
                                  .split("")
                                  .map((char) => ({ text: char, linkData })),
                    }
                })
            setWords(nextWords)
        })
    }, [text, links])

    // Measure lines after words are set
    useEffect(() => {
        if (!needsLineMeasurement || words.length === 0 || linesMeasured) return
        if (typeof window === "undefined") return

        const rafId: number = window.requestAnimationFrame(() => {
            if (!measureRef.current) return

            const spans = measureRef.current.querySelectorAll(
                "[data-measure-index]"
            )
            const lineMap = new Map<number, number>()
            let currentLine = 0
            let lastTop = -1

            spans.forEach((span, idx) => {
                const rect = (span as HTMLElement).getClientRects?.()?.[0]
                const top = rect ? rect.top : (span as HTMLElement).offsetTop

                if (lastTop !== -1 && Math.abs(top - lastTop) > 0.5) {
                    currentLine++
                }
                lineMap.set(idx, currentLine)
                lastTop = top
            })

            startTransition(() => {
                setLineCount(currentLine + 1)
                setWords((prevWords) => {
                    let measureIndex = 0
                    return prevWords.map((w) => {
                        if (w.isSpace) return { ...w, lineIndex: undefined }
                        const next = {
                            ...w,
                            lineIndex: lineMap.get(measureIndex) || 0,
                        }
                        measureIndex += 1
                        return next
                    })
                })
                setLinesMeasured(true)
            })
        })

        return () => window.cancelAnimationFrame(rafId)
    }, [words.length, needsLineMeasurement, font, linesMeasured])

    // Reset line measurement when text changes
    useEffect(() => {
        startTransition(() => setLinesMeasured(false))
    }, [text, font, needsLineMeasurement])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!needsLetterMeasurement) return
        const host = plainTextRef.current
        if (!host) return

        const computed = window.getComputedStyle(host)
        const fontSizePx = parseFloat(computed.fontSize || "0") || 0
        let lineHeightPx = parseFloat(computed.lineHeight || "0")
        if (!Number.isFinite(lineHeightPx) || lineHeightPx <= 0) {
            // Fallback for "normal" or unparsable values
            lineHeightPx = fontSizePx > 0 ? fontSizePx * 1.2 : 0
        }
        if (lineHeightPx > 0) {
            startTransition(() => setMeasuredLineHeightPx(lineHeightPx))
        }

        const textNode = host.firstChild
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return

        const raf = window.requestAnimationFrame(() => {
            const base = host.getBoundingClientRect()
            const range = document.createRange()
            const nextRects: Array<{
                x: number
                y: number
                width: number
                height: number
            }> = []

            for (let i = 0; i < text.length; i++) {
                range.setStart(textNode, i)
                range.setEnd(textNode, i + 1)
                const rect = range.getClientRects()?.[0]
                if (!rect) {
                    nextRects.push({ x: 0, y: 0, width: 0, height: 0 })
                    continue
                }

                const rawH = rect.height
                const extraY =
                    lineHeightPx > 0
                        ? Math.max(0, (lineHeightPx - rawH) / 2)
                        : 0

                nextRects.push({
                    x: rect.left - base.left,
                    y: rect.top - base.top - extraY,
                    width: rect.width + 4,
                    height: rect.height + extraY * 2,
                })
            }

            startTransition(() => setCharRects(nextRects))
        })

        return () => window.cancelAnimationFrame(raf)
    }, [
        text,
        font,
        htmlTag,
        effectiveRevealMode,
        effectiveDisappearMode,
        disappear,
        needsLetterMeasurement,
        currentPhaseMode,
    ])

    // IntersectionObserver to only enable scroll updates when in/near viewport
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                startTransition(() => setIsInView(entry.isIntersecting))
            },
            {
                root: null,
                rootMargin: "100px",
                threshold: 0,
            }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!isInView) return

        const commitIfChanged = (nextScrollProgress: number) => {
            const last = lastScrollProgressRef.current
            if (Math.abs(last - nextScrollProgress) < 0.0005) {
                return
            }

            lastScrollProgressRef.current = nextScrollProgress

            startTransition(() => {
                setScrollProgress(nextScrollProgress)
            })
        }

        const computeAndCommit = () => {
            rafIdRef.current = null
            if (!containerRef.current) return

            const contextEl = stickyContextRef.current || containerRef.current
            if (!contextEl) return

            const rect = contextEl.getBoundingClientRect()
            const currentScroll = window.scrollY

            const viewportThresholdPx =
                viewport === "center"
                    ? window.innerHeight / 2
                    : viewport === "bottom"
                      ? window.innerHeight
                      : 0

            if (
                rect.top <= viewportThresholdPx &&
                stickyStartScrollRef.current === null
            ) {
                stickyStartScrollRef.current = currentScroll
            }

            if (rect.top > viewportThresholdPx) {
                stickyStartScrollRef.current = null
            }

            const scrollSinceSticky =
                currentScroll - (stickyStartScrollRef.current ?? currentScroll)
            const availableRange = stickyContextScrollRangeRef.current || 1

            const delayPx = (Math.max(0, delay) / 100) * window.innerHeight
            const durationRevealPx =
                (Math.max(1, duration) / 100) * window.innerHeight
            const delayDisappearPx =
                (Math.max(0, delayDisappear) / 100) * window.innerHeight
            const durationDisappearPx =
                (Math.max(1, durationDisappear) / 100) * window.innerHeight

            const denomReveal = Math.max(
                1,
                Math.min(availableRange, durationRevealPx)
            )
            const denomDisappear = Math.max(
                1,
                Math.min(availableRange, durationDisappearPx)
            )

            const adjustedScroll = Math.max(0, scrollSinceSticky - delayPx)

            let t = adjustedScroll / denomReveal

            if (disappear) {
                const disappearStart = denomReveal + delayDisappearPx
                if (adjustedScroll > disappearStart) {
                    const extra =
                        (adjustedScroll - disappearStart) / denomDisappear
                    t = 1 + extra
                } else if (adjustedScroll > denomReveal) {
                    t = 1
                }
                t = Math.max(0, Math.min(2, t))
            } else {
                t = Math.max(0, Math.min(1, t))
            }

            commitIfChanged(t)
        }

        const onScroll = () => {
            if (rafIdRef.current != null) return
            rafIdRef.current = window.requestAnimationFrame(computeAndCommit)
        }

        computeAndCommit()
        window.addEventListener("scroll", onScroll, { passive: true })

        return () => {
            window.removeEventListener("scroll", onScroll)
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current)
                rafIdRef.current = null
            }
        }
    }, [
        isStatic,
        isInView,
        viewport,
        delay,
        duration,
        disappear,
        delayDisappear,
        durationDisappear,
    ])

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "0px",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <Tag
                    style={{
                        margin: 0,
                        width: "100%",
                        color:
                            revealType === "highlight"
                                ? highlightColor
                                : textColor,
                        ...font,
                    }}
                >
                    {text}
                </Tag>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "0px",
                overflow: "hidden",
                cursor: "default",
                position: "relative",
            }}
        >
            <Tag
                ref={tagRef as any}
                style={{
                    margin: 0,
                    color: textColor,
                    whiteSpace: "pre-wrap",
                    width: "100%",
                    position: "relative",
                    ...font,
                }}
            >
                {needsLetterMeasurement && (
                    <span
                        ref={plainTextRef}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            visibility: "hidden",
                            whiteSpace: "pre-wrap",
                            pointerEvents: "none",
                        }}
                    >
                        {text}
                    </span>
                )}
                {needsLetterMeasurement &&
                    currentPhaseMode === "letter" &&
                    !(needsLineMeasurement && !linesMeasured) && (
                        <span
                            aria-hidden="true"
                            style={{
                                color: "transparent",
                                display: "inline",
                                whiteSpace: "pre-wrap",
                                pointerEvents: "none",
                            }}
                        >
                            {text}
                        </span>
                    )}
                {needsLineMeasurement && !linesMeasured && (
                    <span
                        ref={measureRef}
                        style={{
                            visibility: "hidden",
                            display: "inline",
                        }}
                    >
                        {(() => {
                            let measureIndex = 0
                            return words.map((word, index) => {
                                if (word.isSpace) {
                                    return (
                                        <span
                                            key={`space-${index}`}
                                            style={{
                                                display: "inline",
                                                whiteSpace: "pre-wrap",
                                                lineHeight: "inherit",
                                            }}
                                        >
                                            {word.text}
                                        </span>
                                    )
                                }

                                const currentMeasureIndex = measureIndex
                                measureIndex += 1

                                return (
                                    <span
                                        key={index}
                                        data-measure-index={currentMeasureIndex}
                                        style={{
                                            display: "inline",
                                            whiteSpace: "pre-wrap",
                                            lineHeight: "inherit",
                                        }}
                                    >
                                        {word.text}
                                    </span>
                                )
                            })
                        })()}
                    </span>
                )}
                {(() => {
                    const isDisappearPhase = disappear && scrollProgress > 1

                    const phaseType = isDisappearPhase
                        ? resolvedDisappearType
                        : revealType
                    const phaseMode = isDisappearPhase
                        ? effectiveDisappearMode
                        : effectiveRevealMode

                    const phaseDirection = isDisappearPhase
                        ? resolvedDirectionDisappear || resolvedMaskDirection
                        : resolvedMaskDirection

                    const phaseTextColor =
                        isDisappearPhase &&
                        revealType === "highlight" &&
                        (phaseType === "mask" || phaseType === "fade")
                            ? highlightColor
                            : textColor

                    if (phaseMode === "letter") {
                        return (() => {
                            const totalUnits = wordsLetterData?.totalUnits ?? 0
                            let globalIndex = 0

                            return (
                                <>
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {words.map((token, tokenIndex) => {
                                            const letters = token.letters || [
                                                {
                                                    text: token.text,
                                                    isSpace: token.isSpace,
                                                },
                                            ]

                                            // If this word has link data, render all letters together as one interactive group
                                            if (
                                                token.linkData &&
                                                !token.isSpace
                                            ) {
                                                const wordLetters = letters
                                                    .map(
                                                        (
                                                            letter,
                                                            letterIndex
                                                        ) => {
                                                            const letterStart =
                                                                globalIndex /
                                                                Math.max(
                                                                    1,
                                                                    totalUnits
                                                                )
                                                            const letterEnd =
                                                                (globalIndex +
                                                                    1) /
                                                                Math.max(
                                                                    1,
                                                                    totalUnits
                                                                )
                                                            const rect =
                                                                charRects[
                                                                    globalIndex
                                                                ]
                                                            globalIndex += 1

                                                            if (
                                                                letter.text ===
                                                                    "\n" ||
                                                                letter.text ===
                                                                    "\r"
                                                            )
                                                                return null
                                                            if (!rect)
                                                                return null

                                                            return {
                                                                letter,
                                                                letterIndex,
                                                                range: [
                                                                    letterStart,
                                                                    letterEnd,
                                                                ] as [
                                                                    number,
                                                                    number,
                                                                ],
                                                                rect,
                                                            }
                                                        }
                                                    )
                                                    .filter(
                                                        (
                                                            item
                                                        ): item is {
                                                            letter: WordItem
                                                            letterIndex: number
                                                            range: [
                                                                number,
                                                                number,
                                                            ]
                                                            rect: {
                                                                x: number
                                                                y: number
                                                                width: number
                                                                height: number
                                                            }
                                                        } => Boolean(item)
                                                    )

                                                return (
                                                    <LinkedWord
                                                        key={`linked-word-${tokenIndex}`}
                                                        wordData={token}
                                                        letters={wordLetters}
                                                        progress={
                                                            scrollProgress
                                                        }
                                                        disappear={disappear}
                                                        revealType={phaseType}
                                                        maskDirection={
                                                            phaseDirection
                                                        }
                                                        textColor={
                                                            phaseTextColor
                                                        }
                                                        highlightColor={
                                                            highlightColor
                                                        }
                                                        blurMax={blurMax}
                                                        lineHeightPx={
                                                            measuredLineHeightPx
                                                        }
                                                    />
                                                )
                                            }

                                            return letters.map(
                                                (letter, letterIndex) => {
                                                    const letterStart =
                                                        globalIndex /
                                                        Math.max(1, totalUnits)
                                                    const letterEnd =
                                                        (globalIndex + 1) /
                                                        Math.max(1, totalUnits)
                                                    const letterGlobalIndex =
                                                        globalIndex
                                                    const rect =
                                                        charRects[globalIndex]
                                                    globalIndex += 1

                                                    // Newlines have no glyph box; skip drawing.
                                                    if (
                                                        letter.text === "\n" ||
                                                        letter.text === "\r"
                                                    )
                                                        return null

                                                    return (
                                                        <Word
                                                            key={`l-${tokenIndex}-${letterIndex}`}
                                                            word={letter as any}
                                                            progress={
                                                                scrollProgress
                                                            }
                                                            disappear={
                                                                disappear
                                                            }
                                                            range={[
                                                                letterStart,
                                                                letterEnd,
                                                            ]}
                                                            unitMode="letter"
                                                            revealType={
                                                                phaseType
                                                            }
                                                            maskDirection={
                                                                phaseDirection
                                                            }
                                                            textColor={
                                                                phaseTextColor
                                                            }
                                                            highlightColor={
                                                                highlightColor
                                                            }
                                                            blurMax={blurMax}
                                                            lineHeightPx={
                                                                measuredLineHeightPx
                                                            }
                                                            isLetter={true}
                                                            rect={rect}
                                                            letterGlobalIndex={
                                                                letterGlobalIndex
                                                            }
                                                            totalLetterUnits={
                                                                totalUnits
                                                            }
                                                        />
                                                    )
                                                }
                                            )
                                        })}
                                    </span>
                                </>
                            )
                        })()
                    }

                    if (phaseMode === "line" && !linesMeasured) return null

                    return words.map((word, index) => {
                        if (word.isSpace) {
                            return (
                                <span
                                    key={`space-${index}`}
                                    style={{
                                        display: "inline",
                                        whiteSpace: "pre-wrap",
                                        lineHeight: "inherit",
                                    }}
                                >
                                    {word.text}
                                </span>
                            )
                        }

                        let start: number
                        let end: number

                        if (phaseMode === "line") {
                            const lineIdx = word.lineIndex || 0
                            start = lineIdx / Math.max(1, lineCount)
                            end = (lineIdx + 1) / Math.max(1, lineCount)
                        } else {
                            start = index / Math.max(1, words.length)
                            end = (index + 1) / Math.max(1, words.length)
                        }

                        return (
                            <Word
                                key={index}
                                word={word}
                                progress={scrollProgress}
                                disappear={disappear}
                                range={[start, end]}
                                unitMode={phaseMode}
                                revealType={phaseType}
                                maskDirection={phaseDirection}
                                textColor={phaseTextColor}
                                highlightColor={highlightColor}
                                blurMax={blurMax}
                                lineHeightPx={measuredLineHeightPx}
                            />
                        )
                    })
                })()}
            </Tag>
        </div>
    )
}

function clamp01(v: number) {
    return Math.max(0, Math.min(1, v))
}

function getMaskTransform(
    maskDirection: "top" | "bottom" | "left" | "right",
    rect: { width: number; height: number } | undefined,
    blurFactor: number,
    seamPx: number
) {
    const xPx = rect?.width ?? 0
    const yPx = rect?.height ?? 0
    const t = blurFactor
    if (maskDirection === "left")
        return `translateX(calc(-${t * xPx}px - ${seamPx}px))`
    if (maskDirection === "right")
        return `translateX(calc(${t * xPx}px + ${seamPx}px))`
    if (maskDirection === "top")
        return `translateY(calc(-${t * yPx}px - ${seamPx}px))`
    return `translateY(calc(${t * yPx}px + ${seamPx}px))`
}

interface LinkedWordProps {
    wordData: WordItem
    letters: Array<{
        letter: WordItem
        letterIndex: number
        range: [number, number]
        rect: { x: number; y: number; width: number; height: number }
    }>
    progress: number
    disappear: boolean
    revealType: "mask" | "highlight" | "fade"
    maskDirection: "top" | "bottom" | "left" | "right"
    textColor: string
    highlightColor: string
    blurMax: number
    lineHeightPx?: number
}

const LinkedWord = memo(function LinkedWord(props: LinkedWordProps) {
    const {
        wordData,
        letters,
        progress,
        disappear,
        revealType,
        maskDirection,
        textColor,
        highlightColor,
        blurMax,
        lineHeightPx,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const link = wordData.linkData as LinkItem | undefined
    const linkBaseColor = link?.linkColor
    const linkHoverColor = link?.hoverColor
    const linkColor = link
        ? isHovered
            ? linkHoverColor
            : linkBaseColor
        : undefined

    if (!link?.link) return null

    // Calculate bounding box for the entire word
    const wordRect = useMemo(() => {
        if (letters.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
        const firstRect = letters[0].rect
        const lastRect = letters[letters.length - 1].rect
        return {
            x: firstRect.x,
            y: firstRect.y,
            width: lastRect.x + lastRect.width - firstRect.x,
            height: Math.max(...letters.map((l) => l.rect.height)),
        }
    }, [letters])

    return (
        <a
            href={link.link}
            style={{
                position: "absolute",
                left: wordRect.x,
                top: wordRect.y,
                width: wordRect.width,
                height: wordRect.height,
                display: "inline-flex",
                alignItems: "baseline",
                textDecoration: "none",
                cursor: "pointer",
                pointerEvents: "auto",
            }}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
        >
            {letters.map(({ letter, letterIndex, range, rect }) => {
                const [start, end] = range
                const denom = Math.max(0.000001, end - start)
                const baseProgress = clamp01((progress - start) / denom)
                const disappearProgress = clamp01(
                    (progress - 1 - start) / denom
                )
                const effectiveProgress =
                    progress <= 1
                        ? baseProgress
                        : disappear
                          ? 1 - disappearProgress
                          : 1

                const blurFactor = 1 - effectiveProgress
                const blurPx =
                    blurMax <= 0 ? 0 : Math.max(0, blurMax * blurFactor)

                const safeSpeed = 1.6
                const blurTransitionSeconds = Math.max(
                    0.05,
                    Math.min(1.5, 0.25 / safeSpeed)
                )
                const blurTransition = `filter ${blurTransitionSeconds}s ease-out`

                const seamPx = Math.max(0, Math.min(1, blurFactor * 3000))

                const isHighlighted =
                    revealType === "highlight" && effectiveProgress > 0
                const highlightOpacity =
                    effectiveProgress > 0
                        ? Math.max(
                              0,
                              Math.min(1, (effectiveProgress - 0.01) / 0.75)
                          )
                        : 0

                const maskTransform = getMaskTransform(
                    maskDirection,
                    rect,
                    blurFactor,
                    seamPx
                )

                const resolvedTextColor = linkColor ?? textColor

                const content =
                    revealType === "fade" ? (
                        <span
                            style={{
                                display: "inline",
                                opacity: effectiveProgress,
                                transition: `opacity 0.1s ease-out, ${blurTransition}`,
                                filter: `blur(${blurPx}px)`,
                                color: resolvedTextColor,
                                lineHeight: "inherit",
                            }}
                        >
                            {letter.text}
                        </span>
                    ) : revealType === "highlight" ? (
                        <span
                            style={{
                                position: "relative",
                                display: "inline",
                                filter: `blur(${blurPx}px)`,
                                transition: blurTransition,
                                lineHeight: "inherit",
                            }}
                        >
                            <span style={{ color: textColor }}>
                                {letter.text}
                            </span>
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    color: linkColor,
                                    opacity: isHighlighted
                                        ? highlightOpacity
                                        : 0,
                                    transition:
                                        "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                                    pointerEvents: "none",
                                }}
                            >
                                {letter.text}
                            </span>
                        </span>
                    ) : (
                        <span
                            style={{
                                display: "inline",
                                transform: maskTransform,
                                transition: `transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), ${blurTransition}`,
                                filter: `blur(${blurPx}px)`,
                                color: resolvedTextColor,
                                lineHeight: "inherit",
                                willChange: "transform, filter",
                            }}
                        >
                            {letter.text}
                        </span>
                    )

                return (
                    <span
                        key={letterIndex}
                        style={{
                            position: "absolute",
                            left: rect.x - wordRect.x,
                            top: rect.y - wordRect.y,
                            width: rect.width,
                            height: rect.height,
                            display: "inline-flex",
                            alignItems: "baseline",
                            overflow:
                                revealType === "mask" ? "hidden" : "visible",
                            verticalAlign: "baseline",
                            lineHeight: "inherit",
                        }}
                    >
                        {content}
                    </span>
                )
            })}
        </a>
    )
})

interface WordProps {
    word: WordItem
    progress: number
    disappear: boolean
    range: [number, number]
    unitMode: "letter" | "word" | "line"
    revealType: "mask" | "highlight" | "fade"
    maskDirection: "top" | "bottom" | "left" | "right"
    textColor: string
    highlightColor: string
    blurMax: number
    isLetter?: boolean
    rect?: { x: number; y: number; width: number; height: number }
    letterGlobalIndex?: number
    totalLetterUnits?: number
    lineHeightPx?: number
}

const Word = memo(function Word(props: WordProps) {
    const {
        word,
        progress,
        disappear,
        range,
        unitMode,
        revealType,
        maskDirection,
        textColor,
        highlightColor,
        blurMax,
        isLetter,
        rect,
        letterGlobalIndex,
        totalLetterUnits,
        lineHeightPx,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const link = word.linkData as LinkItem | undefined
    const linkBaseColor = link?.linkColor
    const linkHoverColor = link?.hoverColor
    const linkColor = link
        ? isHovered
            ? linkHoverColor
            : linkBaseColor
        : undefined

    if (word.isSpace) {
        return (
            <span
                style={{
                    position: isLetter ? "absolute" : "static",
                    left: rect?.x,
                    top: rect?.y,
                    width: rect?.width,
                    height: rect?.height,
                    display: "inline-block",
                    overflow: revealType === "mask" ? "hidden" : "visible",
                    verticalAlign: "baseline",
                    lineHeight: "inherit",
                }}
            >
                {word.text}
            </span>
        )
    }

    const [start, end] = range

    const denom = Math.max(0.000001, end - start)
    const baseProgress = Math.max(0, Math.min(1, (progress - start) / denom))
    const disappearProgress = Math.max(
        0,
        Math.min(1, (progress - 1 - start) / denom)
    )

    const effectiveProgress =
        progress <= 1 ? baseProgress : disappear ? 1 - disappearProgress : 1

    const blurFactor = 1 - effectiveProgress
    const blurPx = blurMax <= 0 ? 0 : Math.max(0, blurMax * blurFactor)

    const safeSpeed = 1.6
    const blurTransitionSeconds = Math.max(
        0.05,
        Math.min(1.5, 0.25 / safeSpeed)
    )
    const blurTransition = `filter ${blurTransitionSeconds}s ease-out`

    const translate = Math.max(0, blurFactor * 100)
    const seamPx = Math.max(0, Math.min(1, blurFactor * 2000))

    const isHighlighted = revealType === "highlight" && effectiveProgress > 0

    const highlightOpacity = useMemo(() => {
        if (revealType !== "highlight") return 0

        // Reveal Mode = Letter only: trailing 5-letter gradient (right -> left) at the reveal edge
        // Only applies when the highlight overlay is the highlightColor (not embedded link color)
        if (
            isLetter &&
            !link &&
            progress <= 1 &&
            typeof letterGlobalIndex === "number" &&
            typeof totalLetterUnits === "number" &&
            totalLetterUnits > 0
        ) {
            // Once reveal is complete, ensure all letters end at 100% opacity.
            if (progress >= 0.999999) return 1
            const revealPos = Math.max(
                0,
                Math.min(totalLetterUnits, progress * totalLetterUnits)
            )
            const tRaw = Math.max(
                0,
                Math.min(1, (revealPos - letterGlobalIndex) / 5)
            )
            return tRaw * tRaw * (3 - 2 * tRaw)
        }

        const t = Math.max(0, Math.min(1, (effectiveProgress - 0.01) / 0.75))
        return t * t * (3 - 2 * t)
    }, [
        effectiveProgress,
        revealType,
        isLetter,
        link,
        progress,
        letterGlobalIndex,
        totalLetterUnits,
    ])

    // For letters, use inline display to avoid spacing issues
    const displayStyle = isLetter ? "inline" : "inline-block"

    // Always use calc() for consistent CSS value structure
    // NOTE: In letter mode, the overflow wrapper uses rect.width/height which can differ from the
    // transformed content width; using % transforms can leak a few pixels. Use px-based transforms.
    const maskTransform = useMemo(() => {
        const xPx = rect?.width ?? 0
        const yPx = rect?.height ?? 0

        if (isLetter && revealType === "mask" && rect) {
            const t = blurFactor
            const seam = seamPx
            if (maskDirection === "left")
                return `translateX(calc(-${t * xPx}px - ${seam}px))`
            if (maskDirection === "right")
                return `translateX(calc(${t * xPx}px + ${seam}px))`
            if (maskDirection === "top")
                return `translateY(calc(-${t * yPx}px - ${seam}px))`
            return `translateY(calc(${t * yPx}px + ${seam}px))`
        }

        // Default: % based (works well for word/line)
        if (maskDirection === "left")
            return `translateX(calc(-${translate}% - ${seamPx}px))`
        if (maskDirection === "right")
            return `translateX(calc(${translate}% + ${seamPx}px))`
        if (maskDirection === "top")
            return `translateY(calc(-${translate}% - ${seamPx}px))`
        return `translateY(calc(${translate}% + ${seamPx}px))`
    }, [blurFactor, rect, seamPx, translate])

    const resolvedTextColor = linkColor ?? textColor

    const content =
        revealType === "fade" ? (
            <span
                style={{
                    display: displayStyle,
                    opacity: effectiveProgress,
                    transition: `opacity 0.1s ease-out, ${blurTransition}`,
                    filter: `blur(${blurPx}px)`,
                    color: resolvedTextColor,
                    lineHeight: "inherit",
                }}
            >
                {word.text}
            </span>
        ) : revealType === "highlight" ? (
            <span
                style={{
                    position: "relative",
                    display: displayStyle,
                    filter: `blur(${blurPx}px)`,
                    transition: blurTransition,
                    lineHeight: "inherit",
                }}
            >
                <span style={{ color: textColor }}>{word.text}</span>
                {link && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            color: linkColor,
                            opacity: isHighlighted ? highlightOpacity : 0,
                            transition:
                                "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                            pointerEvents: "none",
                        }}
                    >
                        {word.text}
                    </span>
                )}
                {!link && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            color: highlightColor,
                            opacity: isHighlighted ? highlightOpacity : 0,
                            transition:
                                "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                            pointerEvents: "none",
                        }}
                    >
                        {word.text}
                    </span>
                )}
            </span>
        ) : (
            // Mask: text moves from behind an overflow-hidden wrapper in the given direction
            <span
                style={{
                    display: displayStyle,
                    transform: maskTransform,
                    transition: `transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), ${blurTransition}`,
                    filter: `blur(${blurPx}px)`,
                    color: resolvedTextColor,
                    lineHeight: "inherit",
                    willChange: "transform, filter",
                }}
            >
                {word.text}
            </span>
        )

    const wrapWithLink = (node: ReactNode, wrapperStyle: CSSProperties) => {
        if (!link?.link) return <span style={wrapperStyle}>{node}</span>
        return (
            <a
                href={link.link}
                style={{
                    ...wrapperStyle,
                    color: resolvedTextColor,
                    textDecoration: "none",
                    cursor: "pointer",
                }}
                onMouseEnter={() => startTransition(() => setIsHovered(true))}
                onMouseLeave={() => startTransition(() => setIsHovered(false))}
            >
                {node}
            </a>
        )
    }

    // For letters, don't wrap in extra span - just return content
    if (isLetter) {
        const adjustedRect = useMemo(() => {
            if (!rect) return rect
            if (revealType !== "mask") return rect
            if (!lineHeightPx || lineHeightPx <= 0) return rect
            const extraY = Math.max(0, (lineHeightPx - rect.height) / 2)
            if (extraY <= 0.01) return rect
            return {
                ...rect,
                y: rect.y - extraY,
                height: rect.height + extraY * 2,
            }
        }, [lineHeightPx, rect, revealType])

        return wrapWithLink(content, {
            position: "absolute",
            left: adjustedRect?.x,
            top: adjustedRect?.y,
            width: adjustedRect?.width,
            height: adjustedRect?.height,
            display: "inline-flex",
            alignItems: "baseline",
            overflow: revealType === "mask" ? "hidden" : "visible",
            verticalAlign: "baseline",
            lineHeight: "inherit",
        })
    }

    return wrapWithLink(content, {
        display: revealType === "mask" ? "inline-flex" : "inline",
        alignItems: revealType === "mask" ? "baseline" : undefined,
        overflow: revealType === "mask" ? "hidden" : "visible",
        verticalAlign: "baseline",
        lineHeight: "inherit",
    })
})

addPropertyControls(StickyTextRevealOnScroll, {
    viewport: {
        type: ControlType.Enum,
        title: "Viewport",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "top",
        displaySegmentedControl: true,
    },
    revealType: {
        type: ControlType.Enum,
        title: "Reveal Type",
        options: ["highlight", "mask", "fade"],
        optionTitles: ["Highlight", "Mask", "Fade In"],
        defaultValue: "highlight",
    },
    maskDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["top", "bottom", "left", "right"],
        optionTitles: ["Top", "Bottom", "Left", "Right"],
        defaultValue: "bottom",
        hidden: ({ revealType, revealMode }) =>
            revealType !== "mask" || revealMode === "line",
    },
    maskDirectionLine: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        hidden: ({ revealType, revealMode }) =>
            revealType !== "mask" || revealMode !== "line",
    },
    revealMode: {
        type: ControlType.Enum,
        title: "Reveal Mode",
        options: ["letter", "word", "line"],
        optionTitles: ["Letter", "Word", "Line"],
        defaultValue: "letter",
        displaySegmentedControl: true,
        hidden: ({ revealType, maskDirection }) =>
            revealType === "mask" &&
            (maskDirection === "left" || maskDirection === "right"),
    },
    revealModeMaskSide: {
        type: ControlType.Enum,
        title: "Reveal Mode",
        options: ["letter", "word"],
        optionTitles: ["Letter", "Word"],
        defaultValue: "letter",
        displaySegmentedControl: true,
        hidden: ({ revealType, maskDirection }) =>
            !(
                revealType === "mask" &&
                (maskDirection === "left" || maskDirection === "right")
            ),
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 3000,
        step: 1,
        unit: "vh",
        displayStepper: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 100,
        min: 1,
        max: 3000,
        step: 1,
        unit: "vh",
        displayStepper: true,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "This placeholder text will reveal word by word as you scroll down the page",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Light",
            letterSpacing: "-0.03em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#696969",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#ffffff",
        hidden: ({ revealType }) => revealType !== "highlight",
    },
    blurMax: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    htmlTag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "span"],
        optionTitles: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "span"],
        defaultValue: "p",
    },
    links: {
        type: ControlType.Array,
        title: "Link",
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                word: {
                    type: ControlType.String,
                    title: "Word",
                    defaultValue: "Framer",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "https://framer.com",
                },
                linkColor: {
                    type: ControlType.Color,
                    title: "Link Color",
                    defaultValue: "#000000",
                },
                hoverColor: {
                    type: ControlType.Color,
                    title: "Hover Color",
                    defaultValue: "#CCCCCC",
                },
            },
        },
    },
    disappear: {
        type: ControlType.Boolean,
        title: "Disappear",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    disappearType: {
        type: ControlType.Enum,
        title: "Disappear Type",
        options: ["highlight", "mask", "fade"],
        optionTitles: ["Highlight", "Mask", "Fade In"],
        defaultValue: "highlight",
        hidden: ({ disappear, revealType }) =>
            !disappear || revealType !== "highlight",
    },
    disappearTypeNonHighlight: {
        type: ControlType.Enum,
        title: "Disappear Type",
        options: ["mask", "fade"],
        optionTitles: ["Mask", "Fade In"],
        defaultValue: "mask",
        hidden: ({ disappear, revealType }) =>
            !disappear || revealType === "highlight",
    },
    directionDisappear: {
        type: ControlType.Enum,
        title: "Direction Disappear",
        options: ["top", "bottom", "left", "right"],
        optionTitles: ["Top", "Bottom", "Left", "Right"],
        defaultValue: "bottom",
        hidden: ({
            disappear,
            revealType,
            disappearType,
            disappearTypeNonHighlight,
            disappearMode,
        }) =>
            !disappear ||
            (revealType === "highlight"
                ? disappearType !== "mask"
                : disappearTypeNonHighlight !== "mask") ||
            disappearMode === "line",
    },
    directionDisappearLine: {
        type: ControlType.Enum,
        title: "Direction Disappear",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        hidden: ({
            disappear,
            revealType,
            disappearType,
            disappearTypeNonHighlight,
            disappearMode,
        }) =>
            !disappear ||
            (revealType === "highlight"
                ? disappearType !== "mask"
                : disappearTypeNonHighlight !== "mask") ||
            disappearMode !== "line",
    },
    disappearMode: {
        type: ControlType.Enum,
        title: "Disappear Mode",
        options: ["letter", "word", "line"],
        optionTitles: ["Letter", "Word", "Line"],
        defaultValue: "letter",
        displaySegmentedControl: true,
        hidden: ({ disappear, disappearType, directionDisappear }) =>
            !disappear ||
            (disappearType === "mask" &&
                (directionDisappear === "left" ||
                    directionDisappear === "right")),
    },
    disappearModeMaskSide: {
        type: ControlType.Enum,
        title: "Disappear Mode",
        options: ["letter", "word"],
        optionTitles: ["Letter", "Word"],
        defaultValue: "letter",
        displaySegmentedControl: true,
        hidden: ({ disappear, disappearType, directionDisappear }) =>
            !(
                disappear &&
                disappearType === "mask" &&
                (directionDisappear === "left" ||
                    directionDisappear === "right")
            ),
    },
    delayDisappear: {
        type: ControlType.Number,
        title: "Delay Disappear",
        defaultValue: 0,
        min: 0,
        max: 3000,
        step: 1,
        unit: "vh",
        displayStepper: true,
        hidden: ({ disappear }) => !disappear,
    },
    durationDisappear: {
        type: ControlType.Number,
        title: "Duration Disappear",
        defaultValue: 100,
        min: 1,
        max: 3000,
        step: 1,
        unit: "vh",
        displayStepper: true,
        hidden: ({ disappear }) => !disappear,
    },
})

// Ensure Framer detects the component name reliably
StickyTextRevealOnScroll.displayName = "StickyTextRevealOnScroll"
