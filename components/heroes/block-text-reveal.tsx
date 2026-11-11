// Text reveal on scroll component - reveals text word by word as user scrolls
import {
    useEffect,
    useRef,
    useState,
    useMemo,
    startTransition,
    memo,
    type CSSProperties,
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


const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smoothstep = (t: number) => {
    const x = clamp01(t)
    // smootherstep for extra-smooth transitions
    return x * x * x * (x * (x * 6 - 15) + 10)
}
const easeOutCubic = (t: number) => {
    const x = clamp01(t)
    return 1 - Math.pow(1 - x, 3)
}
// Avoid integer rounding to prevent shaky/jittery shrinking animations (sub-pixel precision is smoother)
const px = (n: number) => {
    if (!Number.isFinite(n)) return 0
    return Math.round(n * 1000) / 1000
}

interface WordItem {
    text: string
    isSpace?: boolean
    lineIndex?: number
    letters?: WordItem[]
    linkData?: any
}

interface TextRevealScrollProps {
    text: string
    revealType: "fade" | "blocks" | "lines"
    viewport: "top" | "center" | "bottom"
    direction: "ltr" | "rtl"

    font: CSSProperties
    textColor: string
    highlightColor: string
    blurMax: number

    highlighted: {
        items: Array<{
            text: string
            block: boolean
            radius: string
            color: string
            textColor: string
            font: CSSProperties
        }>
    }

    // Smooth scroll
    scrollSpeed: number
    easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"

    revealSpeed: number
    delay: number

    revealMode: "letter" | "word" | "line"
    htmlTag: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span"
    radius: string
    style?: CSSProperties
}

/**
 * Block Text Reveal on Scroll
 *
 * @framerIntrinsicWidth 850
 * @framerIntrinsicHeight 200
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function BlockTextRevealOnScroll(props: TextRevealScrollProps) {
    const {
        text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
        revealType = "lines",
        viewport = "center",
        direction = "ltr",
        revealSpeed = 1,
        delay = 0,
        revealMode = "letter",
        htmlTag = "p",
        font,
        textColor = "#696969",
        highlightColor = "#696969",
        blurMax = 0,
        radius = "0px",
        highlighted = {
            items: [
                {
                    text: "",
                    block: true,
                    radius: "0px",
                    textColor: "#000000",
                    color: "#5C6FFF",
                    font: {
                        fontSize: "32px",
                        variant: "Light",
                        letterSpacing: "-0.03em",
                        lineHeight: "1.3em",
                    },
                },
            ],
        },
    } = props

    const radiusForLines = useMemo(() => {
        return revealType === "lines" ? "0px" : radius
    }, [revealType, radius])

    const effectiveRevealMode = useMemo<"letter" | "word" | "line">(() => {
        return revealMode
    }, [revealMode])

    const effectiveRevealSpeed = useMemo(
        () => (revealSpeed || 1) * 2,
        [revealSpeed]
    )

    const needsLineMeasurement =
        revealMode === "line" ||
        revealType === "fade" ||
        revealType === "blocks" ||
        revealType === "lines"

    const Tag = htmlTag as any

    const containerRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)
    const isStatic = useIsStaticRenderer()
    const [words, setWords] = useState<WordItem[]>([])
    const [lineCount, setLineCount] = useState(1)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [linesMeasured, setLinesMeasured] = useState(false)
    const stickyStartScrollRef = useRef<number | null>(null)
    const stickyContextRef = useRef<HTMLElement | null>(null)
    const stickyContextScrollRangeRef = useRef<number>(1)
    const rafIdRef = useRef<number | null>(null)
    const lastScrollProgressRef = useRef(-1)
    const [isInView, setIsInView] = useState(false)
    const [wordRects, setWordRects] = useState<
        Array<{
            x: number
            y: number
            w: number
            h: number
            yText?: number
            hText?: number
        }>
    >([])

    const highlightedWordMap = useMemo(() => {
        const items = (highlighted?.items ?? []).filter(Boolean)
        if (items.length === 0) return new Map<number, (typeof items)[number]>()

        const hay = words.map((w) => w.text)
        const map = new Map<number, (typeof items)[number]>()

        for (const item of items) {
            const entry = (item?.text ?? "").trim()
            if (!entry) continue
            const tokens = entry.split(/\s+/).filter(Boolean)
            if (tokens.length === 0) continue

            for (let i = 0; i <= hay.length - tokens.length; i++) {
                let ok = true
                for (let j = 0; j < tokens.length; j++) {
                    if (hay[i + j] !== tokens[j]) {
                        ok = false
                        break
                    }
                }
                if (ok) {
                    for (let j = 0; j < tokens.length; j++) map.set(i + j, item)
                }
            }
        }

        return map
    }, [highlighted?.items, words])

    const wordsLetterData = useMemo(() => {
        if (effectiveRevealMode !== "letter") return null
        const units = words.map(
            (token) => token.letters?.length ?? token.text.length
        )
        const totalUnits = units.reduce((a, b) => a + b, 0)
        return { units, totalUnits }
    }, [words, effectiveRevealMode])

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
            const textWords = text.split(" ")
            const nextWords: WordItem[] = textWords.map((word) => ({
                text: word,
                letters: word.split("").map((char) => ({ text: char })),
            }))
            setWords(nextWords)
        })
    }, [text])

    // Measure lines after words are set
    useEffect(() => {
        if (!needsLineMeasurement || words.length === 0 || linesMeasured) return
        if (typeof window === "undefined") return

        const rafId: number = window.requestAnimationFrame(() => {
            if (!measureRef.current) return

            const spans =
                measureRef.current.querySelectorAll("[data-word-index]")
            const lineMap = new Map<number, number>()
            let currentLine = 0
            let lastTop = -1

            spans.forEach((span, idx) => {
                const top = (span as HTMLElement).offsetTop

                if (lastTop !== -1 && top !== lastTop) {
                    currentLine++
                }
                lineMap.set(idx, currentLine)
                lastTop = top
            })

            const nextRects: Array<{
                x: number
                y: number
                w: number
                h: number
                yText?: number
                hText?: number
            }> = []
            spans.forEach((span, idx) => {
                const el = span as HTMLElement
                const cs = window.getComputedStyle(el)
                const fontSizePx = parseFloat(cs.fontSize)
                const lineHeightPx = parseFloat(cs.lineHeight)

                // Approximate the visible glyph box to keep blocks independent from the chosen line-height
                const safeFontSize =
                    Number.isFinite(fontSizePx) && fontSizePx > 0
                        ? fontSizePx
                        : el.offsetHeight
                const safeLineHeight =
                    Number.isFinite(lineHeightPx) && lineHeightPx > 0
                        ? lineHeightPx
                        : el.offsetHeight
                const yText =
                    el.offsetTop +
                    Math.max(0, (safeLineHeight - safeFontSize) / 2)

                nextRects[idx] = {
                    x: el.offsetLeft,
                    y: el.offsetTop,
                    w: el.offsetWidth,
                    h: el.offsetHeight,
                    yText,
                    hText: safeFontSize,
                }
            })

            startTransition(() => {
                setLineCount(currentLine + 1)
                setWords((prevWords) =>
                    prevWords.map((word, idx) => ({
                        ...word,
                        lineIndex: lineMap.get(idx) || 0,
                    }))
                )
                setWordRects(nextRects)
                setLinesMeasured(true)
            })
        })

        return () => window.cancelAnimationFrame(rafId)
    }, [words.length, needsLineMeasurement, font, linesMeasured])

    // Reset line measurement when text changes
    useEffect(() => {
        startTransition(() => setLinesMeasured(false))
    }, [text, font, needsLineMeasurement])

    // IntersectionObserver to only enable scroll updates when in/near viewport
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const target = containerRef.current
        if (!target) return

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

        observer.observe(target)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    // Viewport-triggered auto reveal for "Blocks" and "Lines" types
    const blocksTriggeredRef = useRef(false)
    const blocksRafRef = useRef<number | null>(null)

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (revealType !== "blocks" && revealType !== "lines") return

        blocksTriggeredRef.current = false
        if (blocksRafRef.current != null) {
            window.cancelAnimationFrame(blocksRafRef.current)
            blocksRafRef.current = null
        }
        lastScrollProgressRef.current = -1
        startTransition(() => setScrollProgress(0))

        const checkTrigger = () => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const vh = window.innerHeight || 0
            const triggerY =
                viewport === "top" ? 0 : viewport === "bottom" ? vh : vh / 2
            const inside = rect.top <= triggerY && rect.bottom >= triggerY
            if (inside) {
                blocksTriggeredRef.current = true
                window.removeEventListener("scroll", checkTrigger)
                window.removeEventListener("resize", checkTrigger)
                startAnimation()
            }
        }

        const startAnimation = () => {
            const baseDurationMs = 2200 / Math.max(0.1, effectiveRevealSpeed)
            const perLineSpan = 0.85
            const delayStep = 0.06
            const linesTimeline =
                perLineSpan + delayStep * Math.max(0, lineCount - 1)
            const durationMs =
                revealType === "lines"
                    ? baseDurationMs * (linesTimeline / perLineSpan)
                    : baseDurationMs
            const startTime = performance.now()

            const tick = (now: number) => {
                const t = Math.max(
                    0,
                    Math.min(1, (now - startTime) / Math.max(1, durationMs))
                )
                const last = lastScrollProgressRef.current
                if (Math.abs(last - t) >= 0.0005) {
                    lastScrollProgressRef.current = t
                    startTransition(() => setScrollProgress(t))
                }
                if (t < 1) {
                    blocksRafRef.current = window.requestAnimationFrame(tick)
                } else {
                    blocksRafRef.current = null
                }
            }

            blocksRafRef.current = window.requestAnimationFrame(tick)
        }

        checkTrigger()
        window.addEventListener("scroll", checkTrigger, { passive: true })
        window.addEventListener("resize", checkTrigger)

        return () => {
            window.removeEventListener("scroll", checkTrigger)
            window.removeEventListener("resize", checkTrigger)
            if (blocksRafRef.current != null) {
                window.cancelAnimationFrame(blocksRafRef.current)
                blocksRafRef.current = null
            }
        }
    }, [isStatic, revealType, viewport, effectiveRevealSpeed, lineCount])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!isInView) return
        if (revealType === "blocks" || revealType === "lines") return

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

            if (rect.top <= 0 && stickyStartScrollRef.current === null) {
                stickyStartScrollRef.current = currentScroll
            }

            if (rect.top > 0) {
                stickyStartScrollRef.current = null
            }

            const scrollSinceSticky =
                currentScroll - (stickyStartScrollRef.current ?? currentScroll)
            const availableRange = stickyContextScrollRangeRef.current || 1
            const denom = Math.max(
                1,
                availableRange / Math.max(0.05, effectiveRevealSpeed)
            )

            const delayPx = (Math.max(0, delay) / 100) * window.innerHeight
            const adjustedScroll = Math.max(0, scrollSinceSticky - delayPx)

            const t = Math.max(0, Math.min(1, adjustedScroll / denom))
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
    }, [isStatic, effectiveRevealSpeed, isInView, delay, revealType])

    const fadeBand = useMemo(() => {
        if (revealType !== "fade") return null

        const fillPhase = 0.35
        const p = Math.max(0, Math.min(1, scrollProgress))
        const fillT = Math.max(0, Math.min(1, p / Math.max(0.00001, fillPhase)))

        const moveT =
            p <= fillPhase
                ? 0
                : Math.max(0, Math.min(1, (p - fillPhase) / (1 - fillPhase)))

        // The block band is always 3 lines tall
        const bandLines = 5
        const bandStartLine = moveT * (lineCount + bandLines)
        const bandEndLine = bandStartLine + bandLines
        const bandBaseLine = Math.max(0, Math.floor(bandStartLine))

        return {
            fillT,
            bandStartLine,
            bandEndLine,
            bandLines,
            fillPhase,
            bandBaseLine,
        }
    }, [revealType, scrollProgress, lineCount])

    const blocksBand = useMemo(() => {
        if (revealType !== "blocks") return null

        const fillPhase = 0.35
        const p = Math.max(0, Math.min(1, scrollProgress))
        const fillT = Math.max(0, Math.min(1, p / Math.max(0.00001, fillPhase)))

        const moveT =
            p <= fillPhase
                ? 0
                : Math.max(0, Math.min(1, (p - fillPhase) / (1 - fillPhase)))

        // The block band is always 3 lines tall
        const bandLines = 5
        const bandStartLine = moveT * (lineCount + bandLines)
        const bandEndLine = bandStartLine + bandLines
        const bandBaseLine = Math.max(0, Math.floor(bandStartLine))

        return {
            fillT,
            bandStartLine,
            bandEndLine,
            bandLines,
            fillPhase,
            bandBaseLine,
        }
    }, [revealType, scrollProgress, lineCount])

    const lineXRanges = useMemo(() => {
        if (!linesMeasured) return null

        const map = new Map<number, { minX: number; maxX: number }>()

        for (let li = 0; li < lineCount; li++) {
            let minX = Number.POSITIVE_INFINITY
            let maxX = Number.NEGATIVE_INFINITY
            let has = false

            for (let i = 0; i < words.length; i++) {
                const w = words[i]
                if ((w.lineIndex ?? 0) !== li) continue
                const r = wordRects[i]
                if (!r) continue
                has = true
                minX = Math.min(minX, r.x)
                maxX = Math.max(maxX, r.x + r.w)
            }

            if (has && Number.isFinite(minX) && Number.isFinite(maxX)) {
                map.set(li, { minX, maxX })
            }
        }

        return map
    }, [linesMeasured, lineCount, words, wordRects])

    const fadeFillData = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const { bandLines } = fadeBand
        const indices = words
            .map((w, i) => ({ w, i, r: wordRects[i] }))
            .filter((x) => (x.w.lineIndex ?? 0) < bandLines && x.r)
            .sort((a, b) => {
                if (a.r.y !== b.r.y) return a.r.y - b.r.y
                return a.r.x - b.r.x
            })

        const rankByIndex = new Map<number, number>()
        indices.forEach((item, rank) => rankByIndex.set(item.i, rank))

        return { count: indices.length, rankByIndex }
    }, [revealType, fadeBand, words, wordRects, linesMeasured])

    const blocksFillData = useMemo(() => {
        if (revealType !== "blocks" || !blocksBand) return null
        if (!linesMeasured) return null

        const { bandLines } = blocksBand
        const indices = words
            .map((w, i) => ({ w, i, r: wordRects[i] }))
            .filter((x) => (x.w.lineIndex ?? 0) < bandLines && x.r)
            .sort((a, b) => {
                if (a.r.y !== b.r.y) return a.r.y - b.r.y
                return a.r.x - b.r.x
            })

        const rankByIndex = new Map<number, number>()
        indices.forEach((item, rank) => rankByIndex.set(item.i, rank))

        return { count: indices.length, rankByIndex }
    }, [revealType, blocksBand, words, wordRects, linesMeasured])

    const fadeTopLineRange = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(fadeBand.bandStartLine)
        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== topLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { topLineIndex, minX, maxX }
    }, [revealType, fadeBand, linesMeasured, words, wordRects])

    const fadeBottomLineRange = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const bottomLineIndex = Math.floor(fadeBand.bandEndLine - 0.000001)
        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== bottomLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { bottomLineIndex, minX, maxX }
    }, [revealType, fadeBand, linesMeasured, words, wordRects])

    const fadeAboveLineRange = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(fadeBand.bandStartLine)
        const aboveLineIndex = topLineIndex - 1
        if (aboveLineIndex < 0) return null

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== aboveLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { aboveLineIndex, minX, maxX }
    }, [revealType, fadeBand, linesMeasured, words, wordRects])

    const fadeAboveBlocksLineRange = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(fadeBand.bandStartLine)
        const aboveBlocksLineIndex = topLineIndex - 1
        if (aboveBlocksLineIndex < 0) return null

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== aboveBlocksLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { aboveBlocksLineIndex, minX, maxX }
    }, [revealType, fadeBand, linesMeasured, words, wordRects])

    const fadeBelowBlocksLineRange = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const bottomLineIndex = Math.floor(fadeBand.bandEndLine - 0.000001)
        const belowBlocksLineIndex = bottomLineIndex + 1

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== belowBlocksLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { belowBlocksLineIndex, minX, maxX }
    }, [revealType, fadeBand, linesMeasured, words, wordRects])

    const fadeAbovePrevLineRange = useMemo(() => {
        if (revealType !== "fade" || !fadeBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(fadeBand.bandStartLine)
        const prevLineIndex = topLineIndex - 2
        if (prevLineIndex < 0) return null

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== prevLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { prevLineIndex, minX, maxX }
    }, [revealType, fadeBand, linesMeasured, words, wordRects])

    const blocksTopLineRange = useMemo(() => {
        if (revealType !== "blocks" || !blocksBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(blocksBand.bandStartLine)
        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== topLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { topLineIndex, minX, maxX }
    }, [revealType, blocksBand, linesMeasured, words, wordRects])

    const blocksBottomLineRange = useMemo(() => {
        if (revealType !== "blocks" || !blocksBand) return null
        if (!linesMeasured) return null

        const bottomLineIndex = Math.floor(blocksBand.bandEndLine - 0.000001)
        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== bottomLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { bottomLineIndex, minX, maxX }
    }, [revealType, blocksBand, linesMeasured, words, wordRects])

    const blocksAboveLineRange = useMemo(() => {
        if (revealType !== "blocks" || !blocksBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(blocksBand.bandStartLine)
        const aboveLineIndex = topLineIndex - 1
        if (aboveLineIndex < 0) return null

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== aboveLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { aboveLineIndex, minX, maxX }
    }, [revealType, blocksBand, linesMeasured, words, wordRects])

    const blocksAbovePrevLineRange = useMemo(() => {
        if (revealType !== "blocks" || !blocksBand) return null
        if (!linesMeasured) return null

        const topLineIndex = Math.ceil(blocksBand.bandStartLine)
        const prevLineIndex = topLineIndex - 2
        if (prevLineIndex < 0) return null

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== prevLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { prevLineIndex, minX, maxX }
    }, [revealType, blocksBand, linesMeasured, words, wordRects])

    const blocksBelowBlocksLineRange = useMemo(() => {
        if (revealType !== "blocks" || !blocksBand) return null
        if (!linesMeasured) return null

        const bottomLineIndex = Math.floor(blocksBand.bandEndLine - 0.000001)
        const belowBlocksLineIndex = bottomLineIndex + 1

        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            const r = wordRects[i]
            if (!r) continue
            if ((w.lineIndex ?? 0) !== belowBlocksLineIndex) continue

            minX = Math.min(minX, r.x)
            maxX = Math.max(maxX, r.x + r.w)
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null
        return { belowBlocksLineIndex, minX, maxX }
    }, [revealType, blocksBand, linesMeasured, words, wordRects])

    const linesRanges = useMemo(() => {
        if (revealType !== "lines") return null
        if (!linesMeasured) return null

        const ranges: Array<{
            lineIndex: number
            minX: number
            maxX: number
            yText: number
            hText: number
        }> = []

        for (let li = 0; li < lineCount; li++) {
            let minX = Number.POSITIVE_INFINITY
            let maxX = Number.NEGATIVE_INFINITY
            let yText = 0
            let hText = 0
            let has = false

            for (let i = 0; i < words.length; i++) {
                const w = words[i]
                if ((w.lineIndex ?? 0) !== li) continue
                const r = wordRects[i]
                if (!r) continue

                has = true
                minX = Math.min(minX, r.x)
                maxX = Math.max(maxX, r.x + r.w)
                yText = r.yText ?? r.y + Math.max(0, (r.hText ?? r.h) * 0.08)
                hText = r.hText ?? r.h
            }

            if (has && Number.isFinite(minX) && Number.isFinite(maxX)) {
                ranges.push({ lineIndex: li, minX, maxX, yText, hText })
            }
        }

        return ranges
    }, [revealType, linesMeasured, lineCount, words, wordRects])

    const content = (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0px",
                overflow: "visible",
                cursor: "default",
                position: "relative",
            }}
        >
            <Tag
                style={{
                    margin: 0,
                    color: textColor,
                    whiteSpace: "pre-wrap",
                    position: "relative",
                    ...font,
                }}
            >
                {/* Hidden measurement layer for line/word rects (required for Blocks/Lines overlays) */}
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        visibility: "hidden",
                        pointerEvents: "none",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {words.map((w, i) => (
                        <span
                            key={`m-${i}`}
                            data-word-index={i}
                            style={{
                                display: "inline-block",
                                marginRight: "0.25em",
                                lineHeight: "inherit",
                                verticalAlign: "baseline",
                            }}
                        >
                            {w.text}
                        </span>
                    ))}
                </span>

                {revealType === "lines" && linesMeasured && linesRanges && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 2,
                            overflow: "hidden",
                        }}
                    >
                        {linesRanges.map((lr) => {
                            // Each line uses the same cover/shrink speed; only the start time is delayed per line.
                            const perLineSpan = 0.85
                            const delayStep = 0.06
                            const timeline =
                                perLineSpan +
                                delayStep * Math.max(0, lineCount - 1)
                            const localStart = lr.lineIndex * delayStep
                            const localBase = clamp01(
                                (scrollProgress * timeline - localStart) /
                                    Math.max(0.0001, perLineSpan)
                            )

                            // Local timeline phases: enter (grow cover), optional hold, then exit (shrink cover)
                            const enterEnd = 0.42
                            const holdEnd = enterEnd
                            const shrinkDelay = 0
                            const exitDuration = Math.max(0.00001, 1 - holdEnd)
                            const exitStart = holdEnd + shrinkDelay

                            const local = localBase

                            // Keep text hidden until the line-block has fully covered the line.
                            // Then reveal instantly.
                            const textOpacity = local >= exitStart ? 1 : 0

                            const expandX = 2
                            const minX = lr.minX - expandX
                            const maxX = lr.maxX + expandX
                            const w = Math.max(0, maxX - minX)
                            const isEntering = local < enterEnd
                            const isHolding =
                                local >= enterEnd && local < exitStart

                            const enterT = easeOutCubic(
                                local / Math.max(0.00001, enterEnd)
                            )
                            const exitT = easeOutCubic(
                                (local - exitStart) / exitDuration
                            )

                            // Use a fixed box and animate only with transforms to avoid sub-pixel jitter and
                            // leftover pixels at the end of the animation.
                            const baseLeft = minX
                            const baseWidth = w

                            let sx = 0
                            let tx = 0

                            const origin =
                                direction === "rtl"
                                    ? isEntering || isHolding
                                        ? "100% 50%"
                                        : "0% 50%"
                                    : "0% 50%"

                            if (isEntering) {
                                sx = enterT
                                tx = 0
                            } else if (isHolding) {
                                sx = 1
                                tx = 0
                            } else {
                                sx = Math.max(0, 1 - exitT)
                                // LTR: shrink left -> right (keep right edge fixed)
                                // RTL: shrink right -> left (keep left edge fixed)
                                tx = direction === "rtl" ? 0 : baseWidth * exitT
                            }

                            // Hide tiny remnants at the end of the shrink (prevents a small block in the bottom-right).
                            if (baseWidth * sx <= 1) return null

                            return (
                                <span
                                    key={`ln-${lr.lineIndex}`}
                                    style={{
                                        position: "absolute",
                                        left: px(baseLeft),
                                        top: px(lr.yText - lr.hText * 0.08),
                                        width: px(baseWidth),
                                        height: px(lr.hText * 1.18),
                                        background: highlightColor,
                                        borderRadius: radiusForLines,
                                        opacity: 1,
                                        transition: "none",
                                        transform: `translate3d(${px(tx)}px, 0, 0) scaleX(${sx})`,
                                        transformOrigin: origin,
                                        willChange: "transform",
                                        backfaceVisibility: "hidden",
                                    }}
                                />
                            )
                        })}
                    </span>
                )}

                {revealType === "fade" &&
                    fadeBand &&
                    linesMeasured &&
                    fadeAboveBlocksLineRange &&
                    fadeBand.bandLines === 3 && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 2,
                            }}
                        >
                            {words.map((w, i) => {
                                const r = wordRects[i]
                                if (!r) return null

                                const li = w.lineIndex ?? 0
                                if (
                                    li !==
                                    fadeAboveBlocksLineRange.aboveBlocksLineIndex
                                )
                                    return null

                                // Only show this extra line when the band has moved below it
                                if (li >= fadeBand.bandStartLine) return null

                                const denom = Math.max(
                                    1,
                                    fadeAboveBlocksLineRange.maxX -
                                        fadeAboveBlocksLineRange.minX
                                )
                                const t = Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        (r.x - fadeAboveBlocksLineRange.minX) /
                                            denom
                                    )
                                )

                                // Opacity 40% -> 5% from right to left (i.e. 5% on left, 40% on right)
                                const blockOpacity = 0.05 + 0.35 * t

                                return (
                                    <span
                                        key={`ab-${i}`}
                                        style={{
                                            position: "absolute",
                                            left: px(r.x - r.w * 0.01),
                                            top: px(
                                                (r.yText ?? r.y) -
                                                    (r.hText ?? r.h) * 0.08
                                            ),
                                            width: px(r.w * 1.02),
                                            height: px((r.hText ?? r.h) * 1.18),
                                            background: highlightColor,
                                            borderRadius: radius,
                                            transition:
                                                "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                                            opacity: blockOpacity,
                                        }}
                                    />
                                )
                            })}
                        </span>
                    )}

                {revealType === "blocks" &&
                    blocksBand &&
                    linesMeasured &&
                    blocksAboveLineRange &&
                    blocksBand.bandLines === 3 && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 2,
                            }}
                        >
                            {words.map((w, i) => {
                                const r = wordRects[i]
                                if (!r) return null

                                const li = w.lineIndex ?? 0
                                if (li !== blocksAboveLineRange.aboveLineIndex)
                                    return null

                                // Only show this extra line when the band has moved below it
                                if (li >= blocksBand.bandStartLine) return null

                                const denom = Math.max(
                                    1,
                                    blocksAboveLineRange.maxX -
                                        blocksAboveLineRange.minX
                                )
                                const t = Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        (r.x - blocksAboveLineRange.minX) /
                                            denom
                                    )
                                )

                                // Opacity 40% -> 5% from right to left (i.e. 5% on left, 40% on right)
                                const blockOpacity = 0.05 + 0.35 * t

                                return (
                                    <span
                                        key={`ab-${i}`}
                                        style={{
                                            position: "absolute",
                                            left: px(r.x - r.w * 0.01),
                                            top: px(
                                                (r.yText ?? r.y) -
                                                    (r.hText ?? r.h) * 0.08
                                            ),
                                            width: px(r.w * 1.02),
                                            height: px((r.hText ?? r.h) * 1.18),
                                            background: highlightColor,
                                            borderRadius: radius,
                                            transition:
                                                "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                                            opacity: blockOpacity,
                                        }}
                                    />
                                )
                            })}
                        </span>
                    )}

                {revealType === "fade" &&
                    fadeBand &&
                    linesMeasured &&
                    fadeBelowBlocksLineRange &&
                    scrollProgress > fadeBand.fillPhase &&
                    fadeBand.bandLines === 3 && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 2,
                            }}
                        >
                            {words.map((w, i) => {
                                const r = wordRects[i]
                                if (!r) return null

                                const li = w.lineIndex ?? 0
                                if (
                                    li !==
                                    fadeBelowBlocksLineRange.belowBlocksLineIndex
                                )
                                    return null

                                const denom = Math.max(
                                    1,
                                    fadeBelowBlocksLineRange.maxX -
                                        fadeBelowBlocksLineRange.minX
                                )
                                const t = Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        (r.x - fadeBelowBlocksLineRange.minX) /
                                            denom
                                    )
                                )

                                // Opacity 40% -> 5% from left to right
                                const blockOpacity = 0.4 - 0.35 * t

                                return (
                                    <span
                                        key={`bb-${i}`}
                                        style={{
                                            position: "absolute",
                                            left: px(r.x),
                                            top: px(
                                                (r.yText ?? r.y) -
                                                    (r.hText ?? r.h) * 0.05
                                            ),
                                            width: px(r.w),
                                            height: px((r.hText ?? r.h) * 1.1),
                                            background: highlightColor,
                                            borderRadius: radius,
                                            transition:
                                                "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                                            opacity: blockOpacity,
                                        }}
                                    />
                                )
                            })}
                        </span>
                    )}

                {revealType === "blocks" &&
                    blocksBand &&
                    linesMeasured &&
                    blocksBelowBlocksLineRange &&
                    scrollProgress > blocksBand.fillPhase &&
                    blocksBand.bandLines === 3 && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                zIndex: 2,
                            }}
                        >
                            {words.map((w, i) => {
                                const r = wordRects[i]
                                if (!r) return null

                                const li = w.lineIndex ?? 0
                                if (
                                    li !==
                                    blocksBelowBlocksLineRange.belowBlocksLineIndex
                                )
                                    return null

                                const denom = Math.max(
                                    1,
                                    blocksBelowBlocksLineRange.maxX -
                                        blocksBelowBlocksLineRange.minX
                                )
                                const t = Math.max(
                                    0,
                                    Math.min(
                                        1,
                                        (r.x -
                                            blocksBelowBlocksLineRange.minX) /
                                            denom
                                    )
                                )

                                // Opacity 40% -> 5% from left to right
                                const blockOpacity = 0.4 - 0.35 * t

                                return (
                                    <span
                                        key={`bb-${i}`}
                                        style={{
                                            position: "absolute",
                                            left: px(r.x - r.w * 0.01),
                                            top: px(
                                                (r.yText ?? r.y) -
                                                    (r.hText ?? r.h) * 0.05
                                            ),
                                            width: px(r.w * 1.02),
                                            height: px((r.hText ?? r.h) * 1.1),
                                            background: highlightColor,
                                            borderRadius: radius,
                                            transition:
                                                "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                                            opacity: blockOpacity,
                                        }}
                                    />
                                )
                            })}
                        </span>
                    )}

                {revealType === "fade" && fadeBand && linesMeasured && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    >
                        {words.map((w, i) => {
                            const r = wordRects[i]
                            if (!r) return null

                            const li = w.lineIndex ?? 0
                            const isInBand =
                                li >= fadeBand.bandBaseLine &&
                                li < fadeBand.bandBaseLine + fadeBand.bandLines

                            let visibility = 0
                            // During fill phase, fade blocks in sequentially (top-left -> right, then next lines)
                            if (scrollProgress <= fadeBand.fillPhase) {
                                const count = fadeFillData?.count ?? 0
                                const rank = fadeFillData?.rankByIndex.get(i)
                                if (rank == null || count <= 0) {
                                    return null
                                }

                                const fillT = fadeBand.fillT
                                const cursor = fillT * count
                                visibility = smoothstep(cursor - rank)
                            } else {
                                if (!isInBand) {
                                    return null
                                }

                                // After the initial fill, keep all 5 lines fully visible while the band moves down.
                                visibility = 1
                            }

                            if (visibility <= 0.001) {
                                return null
                            }

                            const centerLine = fadeBand.bandBaseLine + 2
                            const above1 = centerLine - 1
                            const above2 = centerLine - 2
                            const below1 = centerLine + 1
                            const below2 = centerLine + 2

                            let blockOpacity = 1
                            if (lineXRanges) {
                                const range = lineXRanges.get(li)
                                if (range) {
                                    const denom = Math.max(
                                        1,
                                        range.maxX - range.minX
                                    )
                                    const t = Math.max(
                                        0,
                                        Math.min(1, (r.x - range.minX) / denom)
                                    )

                                    if (li === above1) {
                                        // 100% -> 50% from right to left (left=0.5, right=1)
                                        blockOpacity = 0.5 + 0.5 * t
                                    } else if (li === above2) {
                                        // 40% -> 5% from right to left (left=0.05, right=0.4)
                                        blockOpacity = 0.05 + 0.35 * t
                                    } else if (li === below1) {
                                        // 100% -> 50% from left to right (left=1, right=0.5)
                                        blockOpacity = 1 - 0.5 * t
                                    } else if (li === below2) {
                                        // 40% -> 5% from left to right (left=0.4, right=0.05)
                                        blockOpacity = 0.4 - 0.35 * t
                                    } else {
                                        // center line
                                        blockOpacity = 1
                                    }
                                }
                            }

                            return (
                                <span
                                    key={`b-${i}`}
                                    style={{
                                        position: "absolute",
                                        left: px(r.x),
                                        top: px(
                                            (r.yText ?? r.y) -
                                                (r.hText ?? r.h) * 0.05
                                        ),
                                        width: px(r.w),
                                        height: px((r.hText ?? r.h) * 1.1),
                                        background: highlightColor,
                                        borderRadius: radius,
                                        transition:
                                            "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                                        opacity: blockOpacity * visibility,
                                        transform: `scaleY(${0.94 + 0.06 * visibility})`,
                                        transformOrigin: "50% 50%",
                                    }}
                                />
                            )
                        })}
                    </span>
                )}

                {revealType === "blocks" && blocksBand && linesMeasured && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    >
                        {words.map((w, i) => {
                            const r = wordRects[i]
                            if (!r) return null

                            const li = w.lineIndex ?? 0
                            const isInBand =
                                li >= blocksBand.bandBaseLine &&
                                li <
                                    blocksBand.bandBaseLine +
                                        blocksBand.bandLines

                            let visibility = 0
                            // During fill phase, fade blocks in sequentially (top-left -> right, then next lines)
                            if (scrollProgress <= blocksBand.fillPhase) {
                                const count = blocksFillData?.count ?? 0
                                const rank = blocksFillData?.rankByIndex.get(i)
                                if (rank == null || count <= 0) {
                                    return null
                                }

                                const fillT = blocksBand.fillT
                                const cursor = fillT * count
                                visibility = smoothstep(cursor - rank)
                            } else {
                                if (!isInBand) {
                                    return null
                                }

                                // After the initial fill, keep all 5 lines fully visible while the band moves down.
                                visibility = 1
                            }

                            if (visibility <= 0.001) {
                                return null
                            }

                            const centerLine = blocksBand.bandBaseLine + 2
                            const above1 = centerLine - 1
                            const above2 = centerLine - 2
                            const below1 = centerLine + 1
                            const below2 = centerLine + 2

                            let blockOpacity = 1
                            if (lineXRanges) {
                                const range = lineXRanges.get(li)
                                if (range) {
                                    const denom = Math.max(
                                        1,
                                        range.maxX - range.minX
                                    )
                                    const t = Math.max(
                                        0,
                                        Math.min(1, (r.x - range.minX) / denom)
                                    )

                                    if (li === above1) {
                                        blockOpacity = 0.5 + 0.5 * t
                                    } else if (li === above2) {
                                        blockOpacity = 0.05 + 0.35 * t
                                    } else if (li === below1) {
                                        blockOpacity = 1 - 0.5 * t
                                    } else if (li === below2) {
                                        blockOpacity = 0.4 - 0.35 * t
                                    } else {
                                        blockOpacity = 1
                                    }
                                }
                            }

                            return (
                                <span
                                    key={`b-${i}`}
                                    style={{
                                        position: "absolute",
                                        left: px(r.x - r.w * 0.01),
                                        top: px(
                                            (r.yText ?? r.y) -
                                                (r.hText ?? r.h) * 0.05
                                        ),
                                        width: px(r.w * 1.02),
                                        height: px((r.hText ?? r.h) * 1.1),
                                        background: highlightColor,
                                        borderRadius: radius,
                                        transition:
                                            "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                                        opacity: blockOpacity * visibility,
                                        transform: `scaleY(${0.94 + 0.06 * visibility})`,
                                        transformOrigin: "50% 50%",
                                    }}
                                />
                            )
                        })}
                    </span>
                )}

                {(() => {
                    if (revealType === "lines" && linesMeasured) {
                        // Each line uses the same cover/shrink speed; only the start time is delayed per line.
                        const perLineSpan = 0.85
                        const delayStep = 0.06
                        const timeline =
                            perLineSpan + delayStep * Math.max(0, lineCount - 1)
                        const enterEnd = 0.42
                        const holdEnd = enterEnd
                        const shrinkDelay = 0
                        const exitDuration = 1 - holdEnd
                        const exitStart = holdEnd + shrinkDelay

                        // Start shrinking slightly before the cover reaches 100%
                        const preShrinkWindow = 0

                        return words.map((word, index) => {
                            const li = word.lineIndex ?? 0
                            const localStart = li * delayStep
                            const localBase = clamp01(
                                (scrollProgress * timeline - localStart) /
                                    Math.max(0.0001, perLineSpan)
                            )
                            const local = localBase

                            // Keep text hidden until the line-block has fully covered the line.
                            // Then reveal instantly.
                            const textOpacity = local >= exitStart ? 1 : 0

                            const highlightedItem =
                                highlightedWordMap.get(index)
                            const isHighlightedWord = Boolean(highlightedItem)
                            const effectiveTextColor = isHighlightedWord
                                ? highlightedItem!.textColor
                                : textColor

                            return (
                                <span
                                    key={`ln-t-${index}`}
                                    style={{
                                        marginRight: "0.25em",
                                        display: "inline-block",
                                        verticalAlign: "baseline",
                                        lineHeight: "inherit",
                                        opacity: textOpacity,
                                        transition: "none",
                                        position: "relative",
                                        zIndex: isHighlightedWord ? 4 : 1,
                                        color: effectiveTextColor,
                                        ...(isHighlightedWord
                                            ? highlightedItem!.font
                                            : null),
                                    }}
                                >
                                    {isHighlightedWord &&
                                        textOpacity > 0 &&
                                        highlightedItem!.block && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    left: "-0.16em",
                                                    right: "-0.16em",
                                                    top: "-0.06em",
                                                    bottom: "-0.06em",
                                                    background:
                                                        highlightedItem!.color,
                                                    borderRadius:
                                                        highlightedItem!.radius,
                                                    zIndex: -1,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}
                                    {word.text}
                                </span>
                            )
                        })
                    }

                    if (revealType === "fade" && fadeBand && linesMeasured) {
                        // Fade only (Blocks Sticky)

                        return words.map((word, index) => {
                            const li = word.lineIndex ?? 0
                            const revealed = li < fadeBand.bandBaseLine
                            const covered =
                                li >= fadeBand.bandBaseLine &&
                                li < fadeBand.bandBaseLine + fadeBand.bandLines

                            let textOpacity = revealed && !covered ? 1 : 0

                            const highlightedItem =
                                highlightedWordMap.get(index)
                            const isHighlightedWord = Boolean(highlightedItem)
                            const effectiveTextColor = isHighlightedWord
                                ? highlightedItem!.textColor
                                : textColor

                            // Extra blocks line above the 3-line band: hide text under the RIGHT half of this blocks line
                            if (
                                textOpacity > 0 &&
                                fadeAboveBlocksLineRange &&
                                li ===
                                    fadeAboveBlocksLineRange.aboveBlocksLineIndex &&
                                li < fadeBand.bandBaseLine
                            ) {
                                const r = wordRects[index]
                                if (r) {
                                    const midX =
                                        fadeAboveBlocksLineRange.minX +
                                        (fadeAboveBlocksLineRange.maxX -
                                            fadeAboveBlocksLineRange.minX) *
                                            0.5
                                    if (r.x >= midX) textOpacity = 0
                                }
                            }

                            // Immediate text line above the 3 lines of blocks: fade 100% -> 0% from left to right
                            if (
                                textOpacity > 0 &&
                                fadeAboveLineRange &&
                                li === fadeAboveLineRange.aboveLineIndex
                            ) {
                                const r = wordRects[index]
                                if (r) {
                                    const denom = Math.max(
                                        1,
                                        fadeAboveLineRange.maxX -
                                            fadeAboveLineRange.minX
                                    )
                                    const t = Math.max(
                                        0,
                                        Math.min(
                                            1,
                                            (r.x - fadeAboveLineRange.minX) /
                                                denom
                                        )
                                    )
                                    textOpacity = 1 - t
                                }
                            }

                            // Start the fade earlier: previous line's right half fades 100% -> 0% (right half only)
                            if (
                                textOpacity > 0 &&
                                fadeAbovePrevLineRange &&
                                li === fadeAbovePrevLineRange.prevLineIndex
                            ) {
                                const r = wordRects[index]
                                if (r) {
                                    const range = Math.max(
                                        1,
                                        fadeAbovePrevLineRange.maxX -
                                            fadeAbovePrevLineRange.minX
                                    )
                                    const startX =
                                        fadeAbovePrevLineRange.minX +
                                        range * 0.5
                                    const denom = Math.max(
                                        1,
                                        fadeAbovePrevLineRange.maxX - startX
                                    )
                                    const t = Math.max(
                                        0,
                                        Math.min(1, (r.x - startX) / denom)
                                    )
                                    textOpacity = 1 - t
                                }
                            }

                            return (
                                <span
                                    key={index}
                                    style={{
                                        marginRight: "0.25em",
                                        display: "inline-block",
                                        verticalAlign: "baseline",
                                        lineHeight: "inherit",
                                        opacity: textOpacity,
                                        transition:
                                            "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                                        position: "relative",
                                        zIndex: isHighlightedWord ? 4 : 1,
                                        color: effectiveTextColor,
                                        ...(isHighlightedWord
                                            ? highlightedItem!.font
                                            : null),
                                    }}
                                >
                                    {isHighlightedWord &&
                                        textOpacity > 0 &&
                                        highlightedItem!.block && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    left: "-0.16em",
                                                    right: "-0.16em",
                                                    top: "-0.06em",
                                                    bottom: "-0.06em",
                                                    background:
                                                        highlightedItem!.color,
                                                    borderRadius:
                                                        highlightedItem!.radius,
                                                    zIndex: -1,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}
                                    {word.text}
                                </span>
                            )
                        })
                    }

                    if (
                        revealType === "blocks" &&
                        blocksBand &&
                        linesMeasured
                    ) {
                        return words.map((word, index) => {
                            const li = word.lineIndex ?? 0
                            const revealed = li < blocksBand.bandBaseLine
                            const covered =
                                li >= blocksBand.bandBaseLine &&
                                li <
                                    blocksBand.bandBaseLine +
                                        blocksBand.bandLines

                            let textOpacity = revealed && !covered ? 1 : 0

                            const highlightedItem =
                                highlightedWordMap.get(index)
                            const isHighlightedWord = Boolean(highlightedItem)
                            const effectiveTextColor = isHighlightedWord
                                ? highlightedItem!.textColor
                                : textColor

                            // Extra blocks line above the 3-line band: hide text under the RIGHT half of this blocks line
                            if (
                                textOpacity > 0 &&
                                blocksAboveLineRange &&
                                li === blocksAboveLineRange.aboveLineIndex &&
                                li < blocksBand.bandBaseLine
                            ) {
                                const r = wordRects[index]
                                if (r) {
                                    const midX =
                                        blocksAboveLineRange.minX +
                                        (blocksAboveLineRange.maxX -
                                            blocksAboveLineRange.minX) *
                                            0.5
                                    if (r.x >= midX) textOpacity = 0
                                }
                            }

                            // Immediate text line above the 3 lines of blocks: fade 100% -> 0% from left to right
                            if (
                                textOpacity > 0 &&
                                blocksAboveLineRange &&
                                li === blocksAboveLineRange.aboveLineIndex
                            ) {
                                const r = wordRects[index]
                                if (r) {
                                    const denom = Math.max(
                                        1,
                                        blocksAboveLineRange.maxX -
                                            blocksAboveLineRange.minX
                                    )
                                    const t = Math.max(
                                        0,
                                        Math.min(
                                            1,
                                            (r.x - blocksAboveLineRange.minX) /
                                                denom
                                        )
                                    )
                                    textOpacity = 1 - t
                                }
                            }

                            // Start the fade earlier: previous line's right half fades 100% -> 0% (right half only)
                            if (
                                textOpacity > 0 &&
                                blocksAbovePrevLineRange &&
                                li === blocksAbovePrevLineRange.prevLineIndex
                            ) {
                                const r = wordRects[index]
                                if (r) {
                                    const range = Math.max(
                                        1,
                                        blocksAbovePrevLineRange.maxX -
                                            blocksAbovePrevLineRange.minX
                                    )
                                    const startX =
                                        blocksAbovePrevLineRange.minX +
                                        range * 0.5
                                    const denom = Math.max(
                                        1,
                                        blocksAbovePrevLineRange.maxX - startX
                                    )
                                    const t = Math.max(
                                        0,
                                        Math.min(1, (r.x - startX) / denom)
                                    )
                                    textOpacity = 1 - t
                                }
                            }

                            return (
                                <span
                                    key={index}
                                    style={{
                                        marginRight: "0.25em",
                                        display: "inline-block",
                                        verticalAlign: "baseline",
                                        lineHeight: "inherit",
                                        opacity: textOpacity,
                                        transition:
                                            "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
                                        position: "relative",
                                        zIndex: isHighlightedWord ? 4 : 1,
                                        color: effectiveTextColor,
                                        ...(isHighlightedWord
                                            ? highlightedItem!.font
                                            : null),
                                    }}
                                >
                                    {isHighlightedWord &&
                                        textOpacity > 0 &&
                                        highlightedItem!.block && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    left: "-0.16em",
                                                    right: "-0.16em",
                                                    top: "-0.06em",
                                                    bottom: "-0.06em",
                                                    background:
                                                        highlightedItem!.color,
                                                    borderRadius:
                                                        highlightedItem!.radius,
                                                    zIndex: -1,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}
                                    {word.text}
                                </span>
                            )
                        })
                    }

                    if (effectiveRevealMode === "letter") {
                        const totalUnits = wordsLetterData?.totalUnits ?? 0
                        let globalIndex = 0

                        return words.map((token, tokenIndex) => {
                            const letters = token.letters || []

                            return (
                                <span
                                    key={`word-${tokenIndex}`}
                                    style={{
                                        display: "inline-block",
                                        whiteSpace: "nowrap",
                                        verticalAlign: "baseline",
                                        lineHeight: "inherit",
                                        marginRight: 0,
                                    }}
                                >
                                    {letters.map((letter, letterIndex) => {
                                        const letterStart =
                                            globalIndex /
                                            Math.max(1, totalUnits)
                                        const letterEnd =
                                            (globalIndex + 1) /
                                            Math.max(1, totalUnits)
                                        globalIndex += 1

                                        return (
                                            <Word
                                                key={`l-${tokenIndex}-${letterIndex}`}
                                                word={letter as any}
                                                progress={scrollProgress}
                                                range={[letterStart, letterEnd]}
                                                unitMode="letter"
                                                revealType={revealType}
                                                textColor={textColor}
                                                highlightColor={highlightColor}
                                                blurMax={blurMax}
                                                revealSpeed={
                                                    effectiveRevealSpeed
                                                }
                                                isLastInWord={
                                                    letterIndex ===
                                                    letters.length - 1
                                                }
                                            />
                                        )
                                    })}
                                </span>
                            )
                        })
                    }

                    if (effectiveRevealMode === "line" && !linesMeasured) {
                        return null
                    }

                    return words.map((word, index) => {
                        let start: number
                        let end: number

                        if (revealMode === "line") {
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
                                range={[start, end]}
                                unitMode={revealMode}
                                revealType={revealType}
                                textColor={textColor}
                                highlightColor={highlightColor}
                                blurMax={blurMax}
                                revealSpeed={effectiveRevealSpeed}
                            />
                        )
                    })
                })()}
            </Tag>
        </div>
    )

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0px",
                    overflow: "visible",
                    position: "relative",
                }}
            >
                <Tag
                    style={{
                        margin: 0,
                        color: textColor,
                        ...font,
                    }}
                >
                    {text}
                </Tag>
            </div>
        )
    }

    return content
}

interface WordProps {
    word: WordItem
    progress: number
    range: [number, number]
    unitMode: "letter" | "word" | "line"
    revealType: "fade" | "blocks" | "lines"
    textColor: string
    highlightColor: string
    blurMax: number
    revealSpeed: number
    isLastInWord?: boolean
}

const Word = memo(function Word(props: WordProps) {
    const {
        word,
        progress,
        range,
        unitMode,
        revealType,
        textColor,
        highlightColor,
        blurMax,
        revealSpeed,
        isLastInWord,
    } = props

    const [start, end] = range

    const denom = Math.max(0.000001, end - start)
    const effectiveProgress = Math.max(
        0,
        Math.min(1, (progress - start) / denom)
    )

    const blurFactor = 1 - effectiveProgress
    const blurPx = blurMax <= 0 ? 0 : Math.max(0, blurMax * blurFactor)

    const safeSpeed = Math.max(0.1, revealSpeed || 1)
    const blurTransitionSeconds = Math.max(
        0.05,
        Math.min(1.5, 0.25 / safeSpeed)
    )
    const blurTransition = `filter ${blurTransitionSeconds}s ease-out`

    const isFadeLike =
        revealType === "fade" ||
        revealType === "blocks" ||
        revealType === "lines"

    const marginRight =
        unitMode === "letter" ? (isLastInWord ? "0.25em" : "0") : "0.25em"

    const content = isFadeLike ? (
        <span
            style={{
                display: "inline-block",
                opacity: effectiveProgress,
                transition: `opacity 0.1s ease-out, ${blurTransition}`,
                filter: `blur(${blurPx}px)`,
                color: textColor,
                lineHeight: "inherit",
                whiteSpace: word.isSpace ? "pre" : undefined,
            }}
        >
            {word.text}
        </span>
    ) : null

    return (
        <span
            style={{
                marginRight,
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "baseline",
                lineHeight: "inherit",
            }}
        >
            {content}
        </span>
    )
})

addPropertyControls(BlockTextRevealOnScroll, {
    revealType: {
        type: ControlType.Enum,
        title: "Reveal Type",
        options: ["blocks", "lines", "fade"],
        optionTitles: ["Blocks", "Lines", "Blocks Sticky"],
        defaultValue: "lines",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["ltr", "rtl"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "ltr",
        hidden: ({ revealType }) => revealType !== "lines",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
        hidden: ({ revealType }) => revealType === "lines",
    },
    highlighted: {
        type: ControlType.Object,
        title: "Highlighted Text",
        icon: "effect",
        buttonTitle: "Word(s)",
        controls: {
            items: {
                type: ControlType.Array,
                title: "Add Text",
                maxCount: 20,
                defaultValue: [
                    {
                        text: "",
                        block: true,
                        radius: "0px",
                        textColor: "#000000",
                        color: "#5C6FFF",
                        font: {
                            fontSize: "32px",
                            variant: "Light",
                            letterSpacing: "-0.03em",
                            lineHeight: "1.3em",
                        },
                    },
                ],
                control: {
                    type: ControlType.Object,
                    title: "",
                    controls: {
                        text: {
                            type: ControlType.String,
                            title: "Text",
                            defaultValue: "",
                        },
                        block: {
                            type: ControlType.Boolean,
                            title: "Block",
                            defaultValue: true,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                        },
                        radius: {
                            type: ControlType.BorderRadius,
                            title: "Radius",
                            defaultValue: "0px",
                            hidden: ({ block }) => !block,
                        },
                        textColor: {
                            type: ControlType.Color,
                            title: "Text Color",
                            defaultValue: "#000000",
                        },
                        color: {
                            type: ControlType.Color,
                            title: "Block Color",
                            defaultValue: "#5C6FFF",
                            hidden: ({ block }) => !block,
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
                    },
                },
            },
        },
        defaultValue: {
            items: [
                {
                    text: "",
                    block: true,
                    radius: "0px",
                    textColor: "#000000",
                    color: "#5C6FFF",
                    font: {
                        fontSize: "32px",
                        variant: "Light",
                        letterSpacing: "-0.03em",
                        lineHeight: "1.3em",
                    },
                },
            ],
        },
        hidden: ({ revealType }) =>
            revealType !== "fade" &&
            revealType !== "blocks" &&
            revealType !== "lines",
    },
    revealSpeed: {
        type: ControlType.Number,
        title: "Reveal Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
    viewport: {
        type: ControlType.Enum,
        title: "Viewport",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: ({ revealType }) =>
            revealType !== "blocks" && revealType !== "lines",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#696969",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Block Color",
        defaultValue: "#696969",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
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
    htmlTag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "span"],
        optionTitles: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "span"],
        defaultValue: "p",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: () => true,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "ease", "ease-in", "ease-out", "ease-in-out"],
        optionTitles: ["Linear", "Ease", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "ease",
        displaySegmentedControl: false,
        hidden: () => true,
    },
})

// Ensure Framer detects the component name reliably
// Note: Framer uses the displayName to identify modules; keeping it unique avoids
// "module with same type/name already exists" errors when duplicating components.
BlockTextRevealOnScroll.displayName = "BlockTextRevealOnScroll"
