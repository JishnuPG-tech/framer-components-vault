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
    useInView,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
} from "framer-motion"
import React, {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from "react"

type Tag = "h1" | "h2" | "h3" | "p" | "div"
type Mode = "radius" | "whole" | "reveal" | "scrub"
type TouchFallback = "same" | "reveal" | "scrub"

export interface FontWeightHoverProps {
    text: string
    tag: Tag
    font?: {
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number | string
        lineHeight?: number | string
        letterSpacing?: number | string
        textAlign?: "left" | "center" | "right" | "justify"
        fontStyle?: string
    }
    mode: Mode
    touchFallback: TouchFallback
    baseWeight: number
    hoverWeight: number
    radius: number
    falloff: "smooth" | "linear" | "gaussian" | "sharp"
    transitionDuration: number
    hoverInDuration: number
    hoverOutDuration: number
    hoverEasing: "expo" | "inOut" | "ease" | "linear"
    stagger: number
    revealOffset: number
    revealReplay: boolean
    scrubStart: number
    scrubEnd: number
    scrubStyle: "uniform" | "sweep"
    scrubShape: "rise" | "peak"
    sweepWidth: number
    color: string
    enableHoverColor: boolean
    hoverColor: string
    colorBlend: "smooth" | "solid"
    highlightDot: boolean
    dotColor: string
    dotChars: string
    enableScale: boolean
    maxScale: number
    // Explicit integration point: set from a parent component's variant
    // (e.g. its Hover variant) to turn the Whole Text effect on
    active: boolean
    verticalAlign: "top" | "center" | "bottom"
    stableLines: boolean
    padding: string
    style?: React.CSSProperties
    className?: string
}

interface CharData {
    char: string
    isDot: boolean
    key: string
}

interface WordData {
    key: string
    chars: CharData[]
    hasTrailingSpace: boolean
}

// Group a source line's words into visual lines at the given break indexes
function splitIntoVisualLines(
    words: WordData[],
    breaks: number[] | undefined
): WordData[][] {
    if (!breaks || breaks.length === 0) return [words]
    const groups: WordData[][] = []
    let start = 0
    for (const b of breaks) {
        groups.push(words.slice(start, b))
        start = b
    }
    groups.push(words.slice(start))
    return groups
}

const EASINGS: Record<FontWeightHoverProps["hoverEasing"], string> = {
    expo: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    ease: "ease",
    linear: "linear",
}

// Short linear smoothing so scroll-scrubbed weights don't step
const SCRUB_SMOOTHING = 0.15

function buildTransition(duration: number, easing: string, delay = 0): string {
    return ["font-weight", "font-variation-settings", "transform", "color"]
        .map((prop) => `${prop} ${duration}s ${easing} ${delay}s`)
        .join(", ")
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// 1 at d = 0, easing down to 0 at d = 1
const bell = (d: number) => (d >= 1 ? 0 : 0.5 * (1 + Math.cos(Math.PI * d)))

// Minimal typing for Intl.Segmenter, which Framer's TypeScript lib
// doesn't declare
interface GraphemeSegmenter {
    segment(input: string): Iterable<{ segment: string }>
}
type GraphemeSegmenterConstructor = new (
    locales?: string,
    options?: { granularity: "grapheme" }
) => GraphemeSegmenter

function isSegmenterConstructor(
    value: unknown
): value is GraphemeSegmenterConstructor {
    return typeof value === "function"
}

// Typed feature check: Intl.Segmenter only exists in newer browsers
function createGraphemeSegmenter(): GraphemeSegmenter | null {
    if (typeof Intl === "undefined") return null
    const intl: object = Intl
    if (!("Segmenter" in intl)) return null
    const Segmenter = intl.Segmenter
    return isSegmenterConstructor(Segmenter)
        ? new Segmenter(undefined, { granularity: "grapheme" })
        : null
}

let graphemeSegmenter: GraphemeSegmenter | null | undefined

// Split into user-perceived characters so emoji and accented letters
// stay whole
function splitGraphemes(str: string): string[] {
    if (graphemeSegmenter === undefined) {
        graphemeSegmenter = createGraphemeSegmenter()
    }
    if (graphemeSegmenter) {
        return Array.from(graphemeSegmenter.segment(str), (s) => s.segment)
    }
    return Array.from(str)
}

// Read-only media query. Only used to know whether the device can hover,
// which nothing in Framer or Framer Motion exposes; it doesn't touch or
// listen to anything outside the component.
function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const list = window.matchMedia(query)
        const update = () => setMatches(list.matches)
        update()
        list.addEventListener("change", update)
        return () => list.removeEventListener("change", update)
    }, [query])
    return matches
}

// Which effect actually runs: hover modes hand over to their touch
// fallback on devices without hover
function resolveMode(
    mode: Mode,
    touchFallback: TouchFallback | undefined,
    isTouch: boolean
): Mode {
    const fallback = touchFallback ?? "reveal"
    if ((mode === "radius" || mode === "whole") && isTouch && fallback !== "same")
        return fallback
    return mode
}

// Control visibility helpers (props can be partial in the panel)
const isHoverMode = (p: Partial<FontWeightHoverProps>) =>
    (p.mode ?? "radius") === "radius" || p.mode === "whole"
const usesReveal = (p: Partial<FontWeightHoverProps>) =>
    p.mode === "reveal" || (isHoverMode(p) && (p.touchFallback ?? "reveal") === "reveal")
const usesScrub = (p: Partial<FontWeightHoverProps>) =>
    p.mode === "scrub" || (isHoverMode(p) && p.touchFallback === "scrub")
const usesWholeTiming = (p: Partial<FontWeightHoverProps>) =>
    p.mode === "whole" || usesReveal(p)

// Measure layout before paint on the client, fall back quietly on the server
const useIsomorphicLayoutEffect =
    typeof document !== "undefined" ? useLayoutEffect : useEffect

// Per source line, the word indexes that start a new visual line
type LineBreaks = number[][]

// Greedy wrap using word widths measured at the heaviest weight
function computeLineBreaks(
    wordWidths: number[][],
    spaceWidth: number,
    available: number
): LineBreaks {
    return wordWidths.map((widths) => {
        const breaks: number[] = []
        let lineWidth = 0
        widths.forEach((width, i) => {
            if (i === 0) {
                lineWidth = width
                return
            }
            const next = lineWidth + spaceWidth + width
            if (next > available + 0.5) {
                breaks.push(i)
                lineWidth = width
            } else {
                lineWidth = next
            }
        })
        return breaks
    })
}

const sameBreaks = (a: LineBreaks | null, b: LineBreaks | null) =>
    JSON.stringify(a) === JSON.stringify(b)

// Hidden copy used to measure word widths at the heaviest weight
const measurerStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    visibility: "hidden",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    WebkitUserSelect: "none",
}

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
    // Keep this copy out of selections so copied text isn't doubled
    userSelect: "none",
    WebkitUserSelect: "none",
}

/**
 * Font Weight Hover
 *
 * Variable-font headline whose letters get heavier on hover or scroll.
 * Cursor Radius thickens letters near the cursor; Whole Text animates every
 * letter together on hover; Scroll Reveal animates when the text scrolls
 * into view; Scroll Scrub ties the weight to the scroll position. Hover
 * modes can switch to a scroll mode on touch devices. Needs a variable
 * font for smooth weight changes.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function FontWeightHover(props: FontWeightHoverProps) {
    const {
        text = "We make\nimpressions\nthat don't\nwash off.",
        tag = "h2",
        font,
        mode = "radius",
        touchFallback = "reveal",
        baseWeight = 200,
        hoverWeight = 900,
        radius = 180,
        falloff = "smooth",
        transitionDuration = 0.25,
        hoverInDuration = 0.5,
        hoverOutDuration = 0.5,
        hoverEasing = "expo",
        stagger = 0,
        revealOffset = 20,
        revealReplay = false,
        scrubStart = 90,
        scrubEnd = 40,
        scrubStyle = "uniform",
        scrubShape = "rise",
        sweepWidth = 0.4,
        color = "#111111",
        enableHoverColor = true,
        hoverColor = "#FF2A55",
        colorBlend = "smooth",
        highlightDot = true,
        dotColor = "#FF2A55",
        dotChars = ".!?",
        enableScale = false,
        maxScale = 1.08,
        active = false,
        verticalAlign = "center",
        stableLines = true,
        padding = "0px",
        style,
        className,
    } = props

    const containerRef = useRef<HTMLElement>(null)
    const charRefs = useRef<(HTMLSpanElement | null)[]>([])
    const cachedPositions = useRef<{ x: number; y: number }[]>([])
    const positionsDirty = useRef(true)
    const lastPointer = useRef<{ x: number; y: number } | null>(null)
    const isHovering = useRef(false)
    const isWholeActive = useRef(false)
    // Pointer state for Whole Text, combined with the Active prop
    const isPointerActive = useRef(false)
    // First application, or re-applying an unchanged state, is instant
    const hasAppliedWhole = useRef(false)
    // Keep Line Breaks: locked visual lines. Regrouping recreates the
    // letter elements, so the current state is re-applied when it changes.
    const [lineBreaks, setLineBreaks] = useState<LineBreaks | null>(null)
    const measuredWidths = useRef<{ words: number[][]; space: number } | null>(
        null
    )
    const rafId = useRef<number | null>(null)

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion() ?? false
    const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)")
    const activeMode = resolveMode(mode, touchFallback, isTouch)

    // Break text into lines, words, and characters. Accent dots are the
    // last character of a line when it is one of the Dot Symbols.
    const parsedLines = useMemo(() => {
        if (!text) return [] as WordData[][]
        let globalIndex = 0

        return text.split("\n").map((lineStr, lineIdx) => {
            const words = lineStr.split(" ")
            const lineWords: WordData[] = words.map((wordStr, wordIdx) => ({
                key: `word-${lineIdx}-${wordIdx}`,
                chars: splitGraphemes(wordStr).map((ch, i) => ({
                    char: ch,
                    isDot: false,
                    key: `char-${lineIdx}-${wordIdx}-${i}-${globalIndex++}`,
                })),
                hasTrailingSpace: wordIdx < words.length - 1,
            }))

            if (highlightDot && dotChars) {
                const lastWord = [...lineWords]
                    .reverse()
                    .find((w) => w.chars.length > 0)
                const lastChar = lastWord?.chars[lastWord.chars.length - 1]
                if (lastChar && dotChars.includes(lastChar.char)) {
                    lastChar.isDot = true
                }
            }
            return lineWords
        })
    }, [text, highlightDot, dotChars])

    const totalChars = useMemo(
        () =>
            parsedLines.reduce(
                (sum, line) =>
                    sum + line.reduce((n, w) => n + w.chars.length, 0),
                0
            ),
        [parsedLines]
    )

    // Measure character centers relative to the component itself, so page
    // scrolling never invalidates them
    const updatePositions = useCallback(() => {
        const root = containerRef.current
        if (!root) return
        const origin = root.getBoundingClientRect()
        cachedPositions.current = charRefs.current.map((span) => {
            if (!span) return { x: -9999, y: -9999 }
            const rect = span.getBoundingClientRect()
            return {
                x: rect.left + rect.width / 2 - origin.left,
                y: rect.top + rect.height / 2 - origin.top,
            }
        })
        positionsDirty.current = false
    }, [])

    // Compute falloff factor given normalized distance t in [0, 1]
    const calculateFactor = useCallback(
        (t: number) => {
            if (t >= 1) return 0
            if (t <= 0) return 1

            switch (falloff) {
                case "linear":
                    return 1 - t
                case "gaussian":
                    return Math.exp(-3.5 * t * t)
                case "sharp":
                    return Math.pow(1 - t, 3)
                case "smooth":
                default:
                    // Cosine smooth bell-curve
                    return 0.5 * (1 + Math.cos(Math.PI * t))
            }
        },
        [falloff]
    )

    const scaleEnabled = enableScale && !reducedMotion

    // Style one letter for an effect strength between 0 (base) and 1
    // (active). Solid color switches over at solidThreshold.
    const paintLetter = useCallback(
        (span: HTMLSpanElement, factor: number, solidThreshold: number) => {
            const weight = Math.round(
                baseWeight + (hoverWeight - baseWeight) * factor
            )
            span.style.fontWeight = `${weight}`
            span.style.fontVariationSettings = `'wght' ${weight}`

            const scale =
                scaleEnabled && maxScale > 1 ? 1 + (maxScale - 1) * factor : 1
            span.style.transform =
                scale !== 1 ? `scale(${scale.toFixed(3)})` : "none"

            // Accent dots keep their own color
            if (span.getAttribute("data-dot") === "true") return
            let letterColor = color
            if (enableHoverColor && factor > 0) {
                if (colorBlend === "smooth") {
                    letterColor = `color-mix(in srgb, ${hoverColor} ${Math.round(factor * 100)}%, ${color})`
                } else if (factor >= solidThreshold) {
                    letterColor = hoverColor
                }
            }
            span.style.color = letterColor
        },
        [
            baseWeight,
            hoverWeight,
            scaleEnabled,
            maxScale,
            color,
            enableHoverColor,
            colorBlend,
            hoverColor,
        ]
    )

    // Cursor Radius mode: weights by distance to the cursor
    const applyWeights = useCallback(
        (cursorX: number, cursorY: number, active: boolean) => {
            const positions = cachedPositions.current
            const spans = charRefs.current

            for (let i = 0; i < spans.length; i++) {
                const span = spans[i]
                if (!span) continue

                let factor = 0
                if (active && positions[i]) {
                    const dx = positions[i].x - cursorX
                    const dy = positions[i].y - cursorY
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < radius) factor = calculateFactor(dist / radius)
                }
                // Solid color applies to every letter inside the ring
                paintLetter(span, factor, Number.MIN_VALUE)
            }
        },
        [radius, calculateFactor, paintLetter]
    )

    const resetWeights = useCallback(() => {
        applyWeights(0, 0, false)
    }, [applyWeights])

    // Coalesce pointer moves into one update per frame. The pointer is
    // converted to the component's own coordinates each frame.
    const scheduleApply = useCallback(() => {
        if (rafId.current !== null) return
        rafId.current = requestAnimationFrame(() => {
            rafId.current = null
            const pointer = lastPointer.current
            const root = containerRef.current
            if (!isHovering.current || !pointer || !root) return
            if (positionsDirty.current) updatePositions()
            const origin = root.getBoundingClientRect()
            applyWeights(pointer.x - origin.left, pointer.y - origin.top, true)
        })
    }, [updatePositions, applyWeights])

    // Whole Text and Scroll Reveal: every letter animates to the same
    // target together, optionally staggered
    const applyWhole = useCallback(
        (active: boolean) => {
            const instant =
                reducedMotion ||
                !hasAppliedWhole.current ||
                active === isWholeActive.current
            hasAppliedWhole.current = true
            isWholeActive.current = active
            const spans = charRefs.current
            const easing = EASINGS[hoverEasing] || EASINGS.expo
            const duration = instant
                ? 0
                : active
                  ? hoverInDuration
                  : hoverOutDuration
            const letterDelay = instant ? 0 : stagger

            for (let i = 0; i < spans.length; i++) {
                const span = spans[i]
                if (!span) continue
                span.style.transition = buildTransition(
                    duration,
                    easing,
                    letterDelay * i
                )
                paintLetter(span, active ? 1 : 0, 1)
            }
        },
        [
            hoverEasing,
            reducedMotion,
            hoverInDuration,
            hoverOutDuration,
            stagger,
            paintLetter,
        ]
    )

    // Scroll Scrub: strength per letter from scroll progress (0 → 1)
    const applyScrub = useCallback(
        (progress: number) => {
            const spans = charRefs.current
            const n = spans.length
            const shape = (x: number) =>
                scrubShape === "peak" ? Math.sin(Math.PI * clamp01(x)) : clamp01(x)
            const width = Math.max(0.05, sweepWidth)

            for (let i = 0; i < n; i++) {
                const span = spans[i]
                if (!span) continue
                let factor: number
                if (reducedMotion) {
                    factor = 1
                } else if (scrubStyle === "sweep") {
                    const t = n > 1 ? i / (n - 1) : 0
                    if (scrubShape === "peak") {
                        // A bold band travels across the letters
                        const center = -width + progress * (1 + 2 * width)
                        factor = bell(Math.abs(t - center) / width)
                    } else {
                        // Letters fill in one after another
                        factor = clamp01((progress * (1 + width) - t) / width)
                    }
                } else {
                    factor = shape(progress)
                }
                paintLetter(span, factor, 0.5)
            }
        },
        [scrubShape, scrubStyle, sweepWidth, reducedMotion, paintLetter]
    )

    const restingTransition = reducedMotion
        ? "none"
        : activeMode === "whole" || activeMode === "reveal"
          ? buildTransition(
                hoverOutDuration,
                EASINGS[hoverEasing] || EASINGS.expo
            )
          : activeMode === "scrub"
            ? buildTransition(SCRUB_SMOOTHING, "linear")
            : buildTransition(transitionDuration, EASINGS.expo)

    // Re-apply when props or mode change so edits show up immediately
    useEffect(() => {
        if (activeMode === "whole") {
            applyWhole(isPointerActive.current || active)
            return
        }
        if (activeMode === "reveal") {
            applyWhole(isWholeActive.current)
            return
        }
        isWholeActive.current = false
        // Clear any per-letter transitions left by Whole Text / Reveal
        charRefs.current.forEach((span) => {
            if (span) span.style.transition = restingTransition
        })
        if (activeMode === "radius") {
            if (isHovering.current) {
                positionsDirty.current = true
                scheduleApply()
            } else {
                resetWeights()
            }
        }
    }, [
        activeMode,
        active,
        applyWhole,
        resetWeights,
        scheduleApply,
        restingTransition,
        parsedLines,
        lineBreaks,
    ])

    // Letter positions go stale when the component itself resizes
    useEffect(() => {
        const root = containerRef.current
        if (!root || activeMode !== "radius") return
        positionsDirty.current = true
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => {
            positionsDirty.current = true
            if (isHovering.current) scheduleApply()
        })
        observer.observe(root)
        return () => observer.disconnect()
    }, [activeMode, scheduleApply, parsedLines, lineBreaks])

    const handlePointerMove = useCallback(
        (e: { clientX: number; clientY: number }) => {
            lastPointer.current = { x: e.clientX, y: e.clientY }
            // Re-measure at the start of every hover
            if (!isHovering.current) positionsDirty.current = true
            isHovering.current = true
            scheduleApply()
        },
        [scheduleApply]
    )

    const handlePointerLeave = useCallback(() => {
        isHovering.current = false
        lastPointer.current = null
        if (rafId.current !== null) {
            cancelAnimationFrame(rafId.current)
            rafId.current = null
        }
        resetWeights()
    }, [resetWeights])

    // Hover modes listen on the component's own element only. To trigger
    // from a larger area, stretch the component over it, or drive the
    // Active prop from a parent component's variant.
    useEffect(() => {
        const el = containerRef.current
        if (!el || isStatic) return

        if (activeMode === "whole") {
            const sync = () => applyWhole(isPointerActive.current || active)
            const onEnter = (e: PointerEvent) => {
                if (e.pointerType === "touch") return
                isPointerActive.current = true
                sync()
            }
            const onLeave = (e: PointerEvent) => {
                if (e.pointerType === "touch") return
                isPointerActive.current = false
                sync()
            }
            // Touch has no hover: a tap on the text toggles it
            const onPointerDown = (e: PointerEvent) => {
                if (e.pointerType !== "touch") return
                isPointerActive.current = !isPointerActive.current
                sync()
            }
            el.addEventListener("pointerenter", onEnter)
            el.addEventListener("pointerleave", onLeave)
            el.addEventListener("pointerdown", onPointerDown)
            return () => {
                el.removeEventListener("pointerenter", onEnter)
                el.removeEventListener("pointerleave", onLeave)
                el.removeEventListener("pointerdown", onPointerDown)
            }
        }

        if (activeMode !== "radius") return

        const onMove = (e: PointerEvent) => handlePointerMove(e)
        const onLeave = () => handlePointerLeave()
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) handlePointerMove(e.touches[0])
        }

        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerleave", onLeave)
        el.addEventListener("touchmove", onTouchMove, { passive: true })
        el.addEventListener("touchend", onLeave)
        return () => {
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerleave", onLeave)
            el.removeEventListener("touchmove", onTouchMove)
            el.removeEventListener("touchend", onLeave)
        }
    }, [
        isStatic,
        active,
        activeMode,
        applyWhole,
        handlePointerMove,
        handlePointerLeave,
    ])

    // Scroll Reveal: Framer Motion's useInView on the component itself
    const revealInset = Math.max(0, Math.min(95, revealOffset))
    const isInView = useInView(containerRef, {
        once: !revealReplay,
        // Negative bottom inset: reveal once the text passes the trigger line
        margin: `0px 0px ${-revealInset}% 0px`,
    })
    useEffect(() => {
        if (isStatic || activeMode !== "reveal") return
        applyWhole(isInView)
    }, [isStatic, activeMode, isInView, applyWhole])

    // Scroll Scrub: Framer Motion's useScroll tracks the component itself.
    // Offsets run from the lower screen position to the higher one; the
    // progress is flipped if Start is set above End.
    const scrubFrom = Math.max(scrubStart, scrubEnd)
    const scrubTo = Math.min(scrubStart, scrubEnd)
    const scrubFlipped = scrubStart < scrubEnd
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: [`center ${scrubFrom}%`, `center ${scrubTo}%`],
    })
    const scrubProgress = useCallback(
        (value: number) => {
            if (scrubFrom === scrubTo) return value > 0 ? 1 : 0
            return scrubFlipped ? 1 - value : value
        },
        [scrubFrom, scrubTo, scrubFlipped]
    )
    useMotionValueEvent(scrollYProgress, "change", (value) => {
        if (isStatic || activeMode !== "scrub") return
        applyScrub(scrubProgress(value))
    })
    useEffect(() => {
        if (isStatic || activeMode !== "scrub") return
        applyScrub(scrubProgress(scrollYProgress.get()))
    }, [
        isStatic,
        activeMode,
        applyScrub,
        scrubProgress,
        scrollYProgress,
        parsedLines,
        lineBreaks,
    ])

    // Cancel a pending frame on unmount
    useEffect(() => {
        return () => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current)
        }
    }, [])

    // Keep Line Breaks: wrap as if every letter were at its heaviest weight
    // so lines never re-wrap while the weight animates (state declared above)

    // A hidden copy of the text at the heaviest weight, rendered inside the
    // component (see measurer below) and read through refs
    const measurerRef = useRef<HTMLSpanElement>(null)
    const measureWordRefs = useRef<(HTMLSpanElement | null)[][]>([])
    const measureSpaceRef = useRef<HTMLSpanElement>(null)
    const heaviestWeight = Math.max(baseWeight, hoverWeight)

    useIsomorphicLayoutEffect(() => {
        const root = containerRef.current
        const measurer = measurerRef.current
        if (!root || !measurer || !stableLines) {
            measuredWidths.current = null
            setLineBreaks(null)
            return
        }

        const measure = () => {
            measuredWidths.current = {
                words: parsedLines.map((words, lineIdx) =>
                    words.map(
                        (_, wordIdx) =>
                            measureWordRefs.current[lineIdx]?.[
                                wordIdx
                            ]?.getBoundingClientRect().width ?? 0
                    )
                ),
                space:
                    measureSpaceRef.current?.getBoundingClientRect().width ?? 0,
            }
        }

        const relayout = () => {
            const widths = measuredWidths.current
            if (!widths) return
            const cs = getComputedStyle(root)
            const available =
                root.clientWidth -
                parseFloat(cs.paddingLeft) -
                parseFloat(cs.paddingRight)
            if (available <= 0) return
            const next = computeLineBreaks(widths.words, widths.space, available)
            setLineBreaks((prev) => (sameBreaks(prev, next) ? prev : next))
        }

        measure()
        relayout()

        if (typeof ResizeObserver === "undefined") return
        // The component's width sets where lines break. The hidden copy
        // changes size when the web font finishes loading.
        let lastWidth = root.clientWidth
        const observer = new ResizeObserver((entries) => {
            if (entries.some((entry) => entry.target === measurer)) {
                measure()
                relayout()
            } else if (root.clientWidth !== lastWidth) {
                lastWidth = root.clientWidth
                relayout()
            }
        })
        observer.observe(root)
        observer.observe(measurer)
        return () => observer.disconnect()
    }, [
        stableLines,
        parsedLines,
        heaviestWeight,
        font?.fontFamily,
        font?.fontSize,
        font?.fontStyle,
        font?.letterSpacing,
        padding,
    ])

    const textAlign = font?.textAlign || "left"

    // Drop stale refs when the text gets shorter
    charRefs.current.length = totalChars
    measureWordRefs.current.length = parsedLines.length

    const Tag = tag
    let charGlobalIdx = 0

    const renderLetter = (charObj: CharData) => {
        const currentIdx = charGlobalIdx++
        return (
            <span
                key={charObj.key}
                ref={(el) => {
                    charRefs.current[currentIdx] = el
                }}
                data-dot={charObj.isDot ? "true" : undefined}
                style={{
                    display: "inline-block",
                    fontWeight: baseWeight,
                    fontVariationSettings: `'wght' ${baseWeight}`,
                    color: charObj.isDot ? dotColor : color,
                    transition: restingTransition,
                    willChange:
                        "font-weight, font-variation-settings, transform, color",
                    transformOrigin: "center baseline",
                }}
            >
                {charObj.char}
            </span>
        )
    }

    return (
        <Tag
            ref={containerRef as React.Ref<any>}
            className={className}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent:
                    verticalAlign === "top"
                        ? "flex-start"
                        : verticalAlign === "bottom"
                          ? "flex-end"
                          : "center",
                width: "100%",
                margin: 0,
                padding,
                boxSizing: "border-box",
                fontFamily: font?.fontFamily,
                fontStyle: font?.fontStyle,
                fontSize: font?.fontSize ?? 72,
                lineHeight: font?.lineHeight ?? 1.08,
                letterSpacing: font?.letterSpacing ?? "-0.03em",
                fontWeight: baseWeight,
                textAlign,
                color,
                ...style,
            }}
        >
            <span style={srOnlyStyle}>{text.replace(/\n+/g, " ")}</span>
            {stableLines && (
                <span
                    ref={measurerRef}
                    aria-hidden="true"
                    style={measurerStyle}
                >
                    {parsedLines.map((words, lineIdx) =>
                        words.map((wordObj, wordIdx) => (
                            <span
                                key={`m-${wordObj.key}`}
                                ref={(el) => {
                                    const rows = measureWordRefs.current
                                    if (!rows[lineIdx]) rows[lineIdx] = []
                                    rows[lineIdx][wordIdx] = el
                                }}
                                style={{
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {wordObj.chars.map((charObj) => (
                                    <span
                                        key={charObj.key}
                                        style={{
                                            display: "inline-block",
                                            fontWeight: heaviestWeight,
                                            fontVariationSettings: `'wght' ${heaviestWeight}`,
                                        }}
                                    >
                                        {charObj.char}
                                    </span>
                                ))}
                            </span>
                        ))
                    )}
                    <span
                        ref={measureSpaceRef}
                        style={{
                            whiteSpace: "pre",
                            fontWeight: heaviestWeight,
                            fontVariationSettings: `'wght' ${heaviestWeight}`,
                        }}
                    >
                        {" "}
                    </span>
                </span>
            )}
            {parsedLines.map((words, lineIdx) => (
                <span
                    key={`line-${lineIdx}`}
                    aria-hidden="true"
                    style={{ display: "block", width: "100%" }}
                >
                    {words.every((w) => w.chars.length === 0)
                        ? "\u00A0"
                        : splitIntoVisualLines(
                              words,
                              lineBreaks?.[lineIdx]
                          ).map((group, groupIdx, groups) => {
                              const content = group.map((wordObj, i) => (
                                  <React.Fragment key={wordObj.key}>
                                      <span
                                          style={{
                                              display: "inline-block",
                                              whiteSpace: "nowrap",
                                          }}
                                      >
                                          {wordObj.chars.map(renderLetter)}
                                      </span>
                                      {i < group.length - 1 ||
                                      (!lineBreaks && wordObj.hasTrailingSpace)
                                          ? " "
                                          : null}
                                  </React.Fragment>
                              ))
                              if (!lineBreaks) return content
                              // Locked visual line: never re-wraps
                              const isLastOfLine = groupIdx === groups.length - 1
                              return (
                                  <span
                                      key={`group-${groupIdx}`}
                                      style={{
                                          display: "block",
                                          whiteSpace: "nowrap",
                                          textAlignLast:
                                              textAlign === "justify" &&
                                              !isLastOfLine
                                                  ? "justify"
                                                  : undefined,
                                      }}
                                  >
                                      {content}
                                  </span>
                              )
                          })}
                </span>
            ))}
        </Tag>
    )
}

FontWeightHover.displayName = "Font Weight Hover"

addPropertyControls(FontWeightHover, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "We make\nimpressions\nthat don't\nwash off.",
        displayTextArea: true,
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        description: "HTML element, for SEO and screen readers",
        options: ["h1", "h2", "h3", "p", "div"],
        optionTitles: ["H1", "H2", "H3", "P", "Div"],
        defaultValue: "h2",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        description:
            "Pick a font with a Variable variant (e.g. Inter Variable) for smooth weight animation",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 72,
            variant: "Variable",
            lineHeight: "1.08em",
            letterSpacing: "-0.03em",
            textAlign: "left",
        },
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        description:
            "Hover: Cursor Radius or Whole Text. Scroll: Reveal when in view, or Scrub with the scroll position.",
        options: ["radius", "whole", "reveal", "scrub"],
        optionTitles: [
            "Cursor Radius",
            "Whole Text",
            "Scroll Reveal",
            "Scroll Scrub",
        ],
        defaultValue: "radius",
    },
    touchFallback: {
        type: ControlType.Enum,
        title: "On Touch Devices",
        description: "Phones and tablets can't hover, so use a scroll mode there",
        options: ["same", "reveal", "scrub"],
        optionTitles: ["Same as Desktop", "Scroll Reveal", "Scroll Scrub"],
        defaultValue: "reveal",
        hidden: (props) => !isHoverMode(props),
    },
    active: {
        type: ControlType.Boolean,
        title: "Active",
        description:
            "Turns the effect on. Set it in a parent component's Hover variant to trigger the text from the whole component.",
        defaultValue: false,
        hidden: (props) => props.mode !== "whole",
    },
    baseWeight: {
        type: ControlType.Number,
        title: "Base Weight",
        description: "Resting font weight",
        defaultValue: 200,
        min: 100,
        max: 900,
        step: 50,
    },
    hoverWeight: {
        type: ControlType.Number,
        title: "Active Weight",
        description: "Font weight at full effect (under the cursor or revealed)",
        defaultValue: 900,
        min: 100,
        max: 900,
        step: 50,
    },
    radius: {
        type: ControlType.Number,
        title: "Hover Radius",
        description: "Area around the cursor that affects letters",
        defaultValue: 180,
        min: 40,
        max: 600,
        step: 10,
        unit: "px",
        hidden: (props) => (props.mode ?? "radius") !== "radius",
    },
    falloff: {
        type: ControlType.Enum,
        title: "Falloff Curve",
        options: ["smooth", "linear", "gaussian", "sharp"],
        optionTitles: [
            "Smooth (Cosine)",
            "Linear",
            "Gaussian (Natural)",
            "Sharp (Focused)",
        ],
        defaultValue: "smooth",
        hidden: (props) => (props.mode ?? "radius") !== "radius",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        description:
            "How long letters take to follow the cursor and settle back. Higher is softer.",
        defaultValue: 0.25,
        min: 0.05,
        max: 1.0,
        step: 0.05,
        unit: "s",
        hidden: (props) => (props.mode ?? "radius") !== "radius",
    },
    hoverInDuration: {
        type: ControlType.Number,
        title: "Animate In",
        description: "Duration to reach Active Weight",
        defaultValue: 0.5,
        min: 0.05,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: (props) => !usesWholeTiming(props),
    },
    hoverOutDuration: {
        type: ControlType.Number,
        title: "Animate Out",
        description: "Duration to return to Base Weight",
        defaultValue: 0.5,
        min: 0.05,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: (props) => !usesWholeTiming(props),
    },
    hoverEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["expo", "inOut", "ease", "linear"],
        optionTitles: ["Expo Out", "Ease In Out", "Ease", "Linear"],
        defaultValue: "expo",
        hidden: (props) => !usesWholeTiming(props),
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Delay between letters, for a wave across the text",
        defaultValue: 0,
        min: 0,
        max: 0.1,
        step: 0.005,
        unit: "s",
        hidden: (props) => !usesWholeTiming(props),
    },
    revealOffset: {
        type: ControlType.Number,
        title: "Trigger Point",
        description:
            "Reveal when the text is this far up from the bottom of the screen",
        defaultValue: 20,
        min: 0,
        max: 90,
        step: 5,
        unit: "%",
        hidden: (props) => !usesReveal(props),
    },
    revealReplay: {
        type: ControlType.Boolean,
        title: "Replay",
        description: "Animate again every time the text scrolls back into view",
        defaultValue: false,
        hidden: (props) => !usesReveal(props),
    },
    scrubStart: {
        type: ControlType.Number,
        title: "Start Point",
        description:
            "Screen position (% from the top) of the text's center where the effect starts",
        defaultValue: 90,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        hidden: (props) => !usesScrub(props),
    },
    scrubEnd: {
        type: ControlType.Number,
        title: "End Point",
        description:
            "Screen position (% from the top) of the text's center where the effect ends",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        hidden: (props) => !usesScrub(props),
    },
    scrubShape: {
        type: ControlType.Enum,
        title: "Scrub Shape",
        description:
            "One Way: light to bold. Peak: light, bold at the middle, light again.",
        options: ["rise", "peak"],
        optionTitles: ["One Way", "Peak"],
        defaultValue: "rise",
        displaySegmentedControl: true,
        hidden: (props) => !usesScrub(props),
    },
    scrubStyle: {
        type: ControlType.Enum,
        title: "Scrub Style",
        description:
            "Uniform: all letters together. Sweep: the weight travels across the letters.",
        options: ["uniform", "sweep"],
        optionTitles: ["Uniform", "Sweep"],
        defaultValue: "uniform",
        displaySegmentedControl: true,
        hidden: (props) => !usesScrub(props),
    },
    sweepWidth: {
        type: ControlType.Number,
        title: "Sweep Width",
        description: "How much of the text the moving weight covers",
        defaultValue: 0.4,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: (props) => !usesScrub(props) || props.scrubStyle !== "sweep",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        description: "Resting text color",
        defaultValue: "#111111",
    },
    enableHoverColor: {
        type: ControlType.Boolean,
        title: "Active Color",
        description: "Change the text color with the effect",
        defaultValue: true,
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Active Tint",
        description: "Text color at full effect",
        defaultValue: "#FF2A55",
        hidden: (props) => !props.enableHoverColor,
    },
    colorBlend: {
        type: ControlType.Enum,
        title: "Color Blend",
        options: ["smooth", "solid"],
        optionTitles: ["Smooth", "Solid"],
        defaultValue: "smooth",
        displaySegmentedControl: true,
        hidden: (props) =>
            !props.enableHoverColor ||
            ((props.mode ?? "radius") !== "radius" && !usesScrub(props)),
    },
    highlightDot: {
        type: ControlType.Boolean,
        title: "Accent Dot",
        description: "Color the punctuation that ends each line",
        defaultValue: true,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FF2A55",
        hidden: (props) => !props.highlightDot,
    },
    dotChars: {
        type: ControlType.String,
        title: "Dot Symbols",
        description: "Characters to accent when they end a line",
        defaultValue: ".!?",
        hidden: (props) => !props.highlightDot,
    },
    enableScale: {
        type: ControlType.Boolean,
        title: "Letter Scale",
        description: "Subtly scale letters up as they get heavier",
        defaultValue: false,
    },
    maxScale: {
        type: ControlType.Number,
        title: "Max Scale",
        defaultValue: 1.08,
        min: 1.0,
        max: 1.3,
        step: 0.01,
        hidden: (props) => !props.enableScale,
    },
    stableLines: {
        type: ControlType.Boolean,
        title: "Keep Line Breaks",
        description:
            "Wrap lines as if the text were at Active Weight, so words don't jump to the next line as letters thicken.",
        defaultValue: true,
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical Align",
        description:
            "Where the text sits when the component is taller than it. Stretch the component over a card to make the whole card the hover area.",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
})
