/**
 * Morph Headline — rotating words inside a static sentence ("We build ___").
 * Two transition styles (blur, slide), load / in-view triggers,
 * loop / once / N-times, per-word colour or gradient, wrap / fit overflow, LTR / RTL,
 * screen-reader friendly (one static sentence or aria-live) and prefers-reduced-motion aware.
 */
import * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type MorphStyle = "blur" | "slide"
type Accent = "inherit" | "solid"
type WidthMode = "smart" | "animate" | "widest"
type Overflow = "wrap" | "fit"
type Direction = "auto" | "ltr" | "rtl"
type SlotStyle = MorphStyle | "fade"

export interface MorphTextLiteProps {
    prefix?: string
    words?: string[]
    suffix?: string
    morphStyle?: MorphStyle
    trigger?: "load" | "inView"
    repeat?: "loop" | "once" | "count"
    loops?: number
    startDelay?: number
    hold?: number
    duration?: number
    blur?: number
    slideDirection?: "up" | "down"
    font?: React.CSSProperties
    color?: string
    accent?: Accent
    accentColor?: string
    wordWeight?: string
    tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span"
    widthMode?: WidthMode
    overflow?: Overflow
    direction?: Direction
    pauseOnHover?: boolean
    selectable?: boolean
    screenReader?: "live" | "static"
    reducedMotion?: "fade" | "static"
    style?: React.CSSProperties
}

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    border: 0,
}

const ease = [0.22, 1, 0.36, 1] as const
const easeIO = [0.45, 0, 0.55, 1] as const
const PUNCT_START = /^[.,!?;:…)\]»”’]/
const RTL_CHARS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/
const DEFAULT_WORDS = ["websites", "brands", "products", "experiences"]


function joinSentence(prefix: string, word: string, suffix: string) {
    return [prefix, word, suffix]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+([.,!?;:…])/g, "$1")
}

function listSentence(words: string[]) {
    if (words.length < 2) return words[0] ?? ""
    return words.slice(0, -1).join(", ") + " and " + words[words.length - 1]
}

function toPx(v: React.CSSProperties["fontSize"], fallback: number): number {
    if (typeof v === "number") return v
    const n = parseFloat(String(v ?? ""))
    return Number.isFinite(n) && /px$|^\d+(\.\d+)?$/.test(String(v).trim()) ? n : fallback
}

function isKeyboardFocus(el: Element): boolean {
    try {
        return el.matches(":focus-visible")
    } catch {
        return true
    }
}

/** A word's colour / gradient styling. */
function wordPaint(p: MorphTextLiteProps): React.CSSProperties {
    const weight: React.CSSProperties =
        p.wordWeight && p.wordWeight !== "inherit" ? { fontWeight: Number(p.wordWeight) as React.CSSProperties["fontWeight"] } : {}
    const accent: Accent = p.accent ?? "solid"
    switch (accent) {
        case "solid":
            return { color: p.accentColor ?? "#6366f1", ...weight }
        default:
            return weight
    }
}


interface Metrics {
    words: number[]
    prefix: number
    suffix: number
    fontPx: number
    container: number
    centered: boolean
}
const EMPTY_METRICS: Metrics = { words: [], prefix: 0, suffix: 0, fontPx: 48, container: 0, centered: false }
const sameMetrics = (a: Metrics, b: Metrics) =>
    a.words.length === b.words.length &&
    a.words.every((v, i) => Math.abs(v - b.words[i]) < 0.5) &&
    Math.abs(a.prefix - b.prefix) < 0.5 &&
    Math.abs(a.suffix - b.suffix) < 0.5 &&
    Math.abs(a.fontPx - b.fontPx) < 0.1 &&
    Math.abs(a.container - b.container) < 0.5 &&
    a.centered === b.centered

/** Auto-width box centred by its parent (stack / grid / margin auto): its own width change would shift the text. */
function isCentredInParent(el: HTMLElement): boolean {
    // climb through shrink-wrapped wrappers (e.g. Framer's component container)
    let node: HTMLElement = el
    for (let i = 0; i < 4 && node.parentElement; i++) {
        const pw = node.parentElement.getBoundingClientRect().width
        if (Math.abs(pw - node.getBoundingClientRect().width) > 1) break
        node = node.parentElement
    }
    el = node
    const parent = el.parentElement
    if (!parent) return false
    const pr = parent.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const left = r.left - pr.left
    const right = pr.right - r.right
    return left > 2 && right > 2 && Math.abs(left - right) < 2
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * Morph Headline
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 */
export default function MorphTextLite(props: MorphTextLiteProps) {
    const {
        prefix = "We build",
        suffix = "",
       morphStyle = "blur",
        trigger = "load",
        repeat = "loop",
        loops = 2,
        startDelay = 0.4,
        hold = 1.8,
        duration = 0.8,
        blur = 1,
        slideDirection = "up",
        font,
        color = "#111111",
        tag = "h2",
        widthMode = "smart",
        overflow = "wrap",
        direction = "auto",
        pauseOnHover = true,
        selectable = false,
        screenReader = "static",
        reducedMotion = "fade",
        style,
    } = props
    const cleaned = (props.words ?? []).map((w) => (w ?? "").trim()).filter(Boolean)
    const words = cleaned.length ? cleaned : DEFAULT_WORDS
    const wordsKey = words.join("\u0000")

    const rootRef = useRef<HTMLElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)

    // Canvas, export and thumbnails render statically: first word, no timers or side effects.
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion() ?? false
    const staticMode = isStatic || (prefersReduced && reducedMotion === "static") || words.length < 2
    const effStyle: SlotStyle = prefersReduced ? "fade" : morphStyle
    // Reduced motion: opacity-only crossfade, slowed down (no slide / blur / morph movement).
    const effDuration = prefersReduced ? Math.max(duration, 1.2) : duration
    const dir: "ltr" | "rtl" = direction === "auto" ? (RTL_CHARS.test(prefix + wordsKey + suffix) ? "rtl" : "ltr") : direction
    const constrained = style?.width !== undefined && style.width !== "auto" && style.width !== "fit-content"

    // In-view gate: no IntersectionObserver in static/canvas renders (staticMode), and the start and
    // rotation timers below only run while at least 40% of the headline is on screen.
    const [inView, setInView] = useState(false)
    useEffect(() => {
        if (staticMode) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 })
        io.observe(el)
        return () => io.disconnect()
    }, [staticMode])
    const [started, setStarted] = useState(false)
    const [index, setIndex] = useState(0)
    const [prevIndex, setPrevIndex] = useState<number | null>(null)
    const [hovered, setHovered] = useState(false)
    // Keyboard / AT pause: focus inside the headline pauses (WCAG 2.2.2) unless the user pressed Play.
    const [focusWithin, setFocusWithin] = useState(false)
    // Pause button visibility: shown on mouse hover over the headline or keyboard focus within it.
    // On touch-only screens (no hover) it stays faintly visible so it can still be found and tapped.
    const [rootHover, setRootHover] = useState(false)
    const [canHover, setCanHover] = useState(true)
    // Short grace period on leave so the pointer can travel from the words down to the button.
    const hoverTimer = useRef<number | undefined>(undefined)
    useEffect(() => () => window.clearTimeout(hoverTimer.current), [])
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(hover: hover)")
        const sync = () => setCanHover(mq.matches)
        sync()
        mq.addEventListener?.("change", sync)
        return () => mq.removeEventListener?.("change", sync)
    }, [])
    const [userChoice, setUserChoice] = useState<"paused" | "playing" | null>(null)
    const [finished, setFinished] = useState(false)
    const cycles = useRef(0)

    // ----- start trigger -----
    useEffect(() => {
        if (staticMode || started) return
        if (trigger === "inView" && !inView) return
        const t = window.setTimeout(() => setStarted(true), Math.max(0, startDelay) * 1000)
        return () => window.clearTimeout(t)
    }, [staticMode, started, trigger, inView, startDelay])

    // Reset when the word list changes (editing in Framer).
    useEffect(() => {
        setIndex(0)
        setPrevIndex(null)
        setFinished(false)
        cycles.current = 0
    }, [wordsKey])

    // ----- scheduler -----
    const userPaused = userChoice === "paused" || (focusWithin && userChoice !== "playing")
    const paused = !started || finished || staticMode || userPaused || (pauseOnHover && hovered) || !inView
    const safeIndex = Math.min(index, words.length - 1)
    // Time the transition *into the current word* takes, so the hold starts once it has settled.
    const transitionMs =
        prevIndex === null
            ? 0
                : effDuration * 1000
    useEffect(() => {
        if (paused) return
        const t = window.setTimeout(
            () => {
                const next = (safeIndex + 1) % words.length
                if (next === 0) {
                    cycles.current += 1
                    if (repeat === "once" || (repeat === "count" && cycles.current >= Math.max(1, loops))) {
                        setFinished(true)
                        return
                    }
                }
                setPrevIndex(safeIndex)
                setIndex(next)
            },
            Math.max(200, hold * 1000 + transitionMs)
        )
        return () => window.clearTimeout(t)
    }, [paused, safeIndex, hold, transitionMs, words.length, repeat, loops])

    // ----- measurement (word widths, prefix/suffix, font size, container) -----
    const [m, setM] = useState<Metrics>(EMPTY_METRICS)
    const measure = useCallback(() => {
        const root = rootRef.current
        const el = measureRef.current
        if (!root || !el) return
        const kids = Array.from(el.children) as HTMLElement[]
        const w = kids.map((c) => c.getBoundingClientRect().width)
        const cs = getComputedStyle(root)
        const next: Metrics = {
            prefix: w[0] ?? 0,
            suffix: w[w.length - 1] ?? 0,
            words: w.slice(1, -1),
            fontPx: parseFloat(cs.fontSize) || 48,
            container: root.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0),
            centered: cs.textAlign === "center" || isCentredInParent(root),
        }
        setM((prev) => (sameMetrics(prev, next) ? prev : next))
    }, [])
    useIsoLayoutEffect(() => {
        measure()
    }, [measure, wordsKey, prefix, suffix, JSON.stringify(font), props.wordWeight, style?.width])
    useEffect(() => {
        const el = measureRef.current
        const root = rootRef.current
        if (!el || !root || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        ro.observe(root)
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
        fonts?.ready.then(measure).catch(() => {})
        fonts?.addEventListener?.("loadingdone", measure)
        return () => {
            ro.disconnect()
            fonts?.removeEventListener?.("loadingdone", measure)
        }
    }, [measure])

    // ----- overflow: fit scales the font so the widest sentence fits one line -----
    const baseFont = toPx(font?.fontSize, 48)
    const [fitScale, setFitScale] = useState(1)
    const maxWidth = m.words.length ? Math.max(...m.words) : undefined
    useEffect(() => {
        if (overflow !== "fit" || !constrained || maxWidth === undefined || m.container <= 0) {
            if (fitScale !== 1) setFitScale(1)
            return
        }
        const line = m.prefix + maxWidth + m.suffix
        if (line <= 0) return
        // widths were measured at m.fontPx, so scale from that (not from the current state) — converges in one step
        const want = Math.max(0.25, Math.min(1, (m.fontPx / baseFont) * (m.container / line) * 0.995))
        if (Math.abs(want - fitScale) > 0.004) setFitScale(want)
    }, [overflow, constrained, m, maxWidth, fitScale, baseFont])

    const effWidth: "animate" | "widest" =
        isStatic || widthMode === "widest" || (widthMode === "smart" && m.centered) ? "widest" : "animate"
    const rawSlot = effWidth === "widest" ? maxWidth : m.words[safeIndex]
    const cap = constrained && m.container > 0 ? m.container : undefined
    const slotWidth = rawSlot !== undefined && cap !== undefined ? Math.min(rawSlot, cap) : rawSlot
    const wraps = overflow === "wrap" && cap !== undefined && (m.words[safeIndex] ?? 0) > cap + 0.5

    const current = words[safeIndex] ?? ""
    const sentence = joinSentence(prefix, current, suffix)
    const staticSentence = joinSentence(prefix, listSentence(words), suffix)
    const suffixGap = suffix && !PUNCT_START.test(suffix) ? " " : ""
    // Punctuation suffix with a reserved (widest) slot: draw it inside the slot right after the current word,
    // so "." hugs short words while the slot + suffix width stays constant (centred lines never shift).
    const hugSuffix =
        !!suffix && suffixGap === "" && !wraps && m.words.length === words.length
    // The word box tweens its width to the current word and clips at its end edge;
    // the period follows the box in normal flow, so it glides with the words and can never sit on a visible glyph.
    const hugOuter = hugSuffix
    const wordW = Math.min(m.words[safeIndex] ?? 0, slotWidth ?? Infinity)
    const endClip = dir === "rtl" ? "inset(-0.6em -0.6em -0.6em 0)" : "inset(-0.6em 0 -0.6em -0.6em)"

    const Tag = tag as React.ElementType
    const btnShown = focusWithin || rootHover
    const blurPx = Math.max(0, blur) * m.fontPx * 0.16
    const noSelect: React.CSSProperties = selectable ? {} : { userSelect: "none", WebkitUserSelect: "none" }

    return (
        <Tag
            ref={rootRef}
            dir={dir}
            // Keyboard focus only (:focus-visible): a mouse click on the button must toggle, not first auto-pause.
            onFocus={(e: React.FocusEvent) => setFocusWithin(isKeyboardFocus(e.target))}
            onPointerEnter={(e: React.PointerEvent) => {
                if (e.pointerType !== "mouse") return
                window.clearTimeout(hoverTimer.current)
                setRootHover(true)
            }}
            onPointerLeave={(e: React.PointerEvent) => {
                if (e.pointerType !== "mouse") return
                window.clearTimeout(hoverTimer.current)
                hoverTimer.current = window.setTimeout(() => setRootHover(false), 600)
            }}
            onBlur={(e: React.FocusEvent) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false)
            }}
            style={{
                margin: 0,
                color,
                fontSize: 48,
                lineHeight: 1.15,
                position: "relative",
                textAlign: "start",
                ...font,
                ...style,
                ...(overflow === "fit" && fitScale < 1 ? { fontSize: baseFont * fitScale } : null),
            }}
        >
            {/* Screen readers: one clean sentence. Visual layer is hidden from AT. */}
            {screenReader === "static" || staticMode ? (
                <span style={SR_ONLY}>{staticSentence}</span>
            ) : (
                <span style={SR_ONLY} aria-live="polite" aria-atomic="true">
                    {sentence}
                </span>
            )}
            <span
                aria-hidden="true"
                data-morph-visual=""
                // Hover only over the text itself. Mouse only: touch taps emit compat mouseenter without a
                // matching leave, which would leave the rotation paused on phones.
                onPointerEnter={(e: React.PointerEvent) => {
                    if (e.pointerType === "mouse") setHovered(true)
                }}
                onPointerLeave={(e: React.PointerEvent) => {
                    if (e.pointerType === "mouse") setHovered(false)
                }}
                style={{ ...noSelect, whiteSpace: overflow === "fit" && constrained ? "nowrap" : undefined }}
            >
                {prefix ? <>{prefix} </> : null}
                {hugOuter ? (
                <span style={{ display: "inline-block", whiteSpace: "nowrap", textAlign: "start", minWidth: effWidth === "widest" && slotWidth !== undefined ? slotWidth + m.suffix : undefined }}>
                <WordSlot
                    clip={endClip}
                    words={words}
                    index={safeIndex}
                    animate={!staticMode && started}
                    morphStyle={effStyle}
                    duration={effDuration}
                    blurPx={blurPx}
                    slideDirection={slideDirection}
                    width={wordW}
                    wraps={wraps}
                    paint={() => wordPaint(props)}
                />
                {suffix}
                </span>
                ) : (
                <WordSlot
                    words={words}
                    index={safeIndex}
                    animate={!staticMode && started}
                    morphStyle={effStyle}
                    duration={effDuration}
                    blurPx={blurPx}
                    slideDirection={slideDirection}
                    width={slotWidth}
                    wraps={wraps}
                    paint={() => wordPaint(props)}
                />
                )}
                {suffix && !hugSuffix ? (
                    <>
                        {suffixGap}
                        {suffix}
                    </>
                ) : null}
            </span>
            {/* Pause / play for keyboard and AT users: out of flow (no dead space), shown on hover / focus, placed just below the start of the line so it never covers the words or the period. */}
            {!staticMode ? (
                <button
                    type="button"
                    // Label names the action (no aria-pressed, which would contradict a changing label).
                    aria-label={userPaused ? "Play rotating headline" : "Pause rotating headline"}
                    onClick={() => setUserChoice(userPaused ? "playing" : "paused")}
                    style={{
                        position: "absolute",
                        top: "100%",
                        // anchored at the line start: stays put while the word width animates
                        insetInlineStart: 0,
                        width: 24,
                        height: 30,
                        padding: 0,
                        boxSizing: "border-box",
                        // transparent top border: a gap below descenders that still counts as part of the button
                        border: "none",
                        borderTop: "6px solid transparent",
                        backgroundClip: "padding-box",
                        borderRadius: 12,
                        background: "rgba(127,127,127,0.18)",
                        color: "currentColor",
                        font: "inherit",
                        fontSize: 12,
                        lineHeight: 1,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        opacity: btnShown ? 1 : canHover ? 0 : 0.4,
                        pointerEvents: btnShown || !canHover ? "auto" : "none",
                        outline: focusWithin ? "2px solid currentColor" : "none",
                        outlineOffset: 2,
                        transition: "opacity 0.15s",
                        zIndex: 1,
                    }}
                >
                    <svg aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        {userPaused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}
                    </svg>
                </button>
            ) : null}
            {/* Off-screen measurer (same font): [prefix+space, ...words, space+suffix]. */}
            <span
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    insetInlineStart: 0,
                    top: 0,
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "pre",
                    height: 0,
                    overflow: "hidden",
                }}
            >
                <span style={{ display: "inline-block" }}>{prefix ? prefix + " " : ""}</span>
                {words.map((w, i) => (
                    <span key={i} style={{ display: "inline-block", ...wordPaint(props) }}>
                        {w}
                    </span>
                ))}
                <span style={{ display: "inline-block" }}>{suffix ? suffixGap + suffix : ""}</span>
            </span>
        </Tag>
    )
}

interface SlotProps {
    words: string[]
    index: number
    animate: boolean
    morphStyle: SlotStyle
    duration: number
    blurPx: number
    slideDirection: "up" | "down"
    width?: number
    wraps: boolean
    paint: (i: number) => React.CSSProperties
    clip?: string
}


/** Text inside a slot: single line unless the word is wider than the container (Overflow → Wrap). */
const wordText = (wraps: boolean): React.CSSProperties =>
    wraps ? { whiteSpace: "normal", overflowWrap: "anywhere" } : { whiteSpace: "nowrap" }

const slotBase: React.CSSProperties = {
    display: "inline-grid",
    // baseline (not bottom): padding on gradient / slide boxes must never lift the word off the prefix's baseline
    verticalAlign: "baseline",
    position: "relative",
    justifyItems: "start",
    textAlign: "start",
    unicodeBidi: "isolate",
    maxWidth: "100%",
}

function WordSlot(p: SlotProps) {
    const { words, index, morphStyle, duration } = p
    const word = words[index] ?? ""


    // blur / slide / fade — overlapping enter/exit in a single grid cell
    const dir = p.slideDirection === "down" ? -1 : 1
    const variants =
        morphStyle === "slide"
            ? {
                  initial: { y: `${110 * dir}%`, opacity: 0 },
                  animate: { y: "0%", opacity: 1 },
                  exit: { y: `${-110 * dir}%`, opacity: 0 },
              }
            : morphStyle === "blur"
              ? {
                    initial: { opacity: 0, filter: `blur(${p.blurPx}px)`, scale: 0.96 },
                    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
                    exit: { opacity: 0, filter: `blur(${p.blurPx}px)`, scale: 1.04 },
                }
              : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }

    return (
        <motion.span
            style={{
                ...slotBase,
                overflow: morphStyle === "slide" ? "hidden" : "visible",
                clipPath: p.clip,
                paddingBlock: morphStyle === "slide" ? "0.12em" : 0,
                marginBlock: morphStyle === "slide" ? "-0.12em" : 0,
            }}
            initial={false}
            animate={{ width: p.width ?? "auto" }}
            transition={{ duration: p.animate ? duration * 0.9 : 0, ease: p.clip ? easeIO : ease }}
        >
            <AnimatePresence initial={false}>
                <motion.span
                    key={index}
                    style={{ gridArea: "1 / 1", display: "inline-block", willChange: "transform, opacity", ...wordText(p.wraps), ...p.paint(index) }}
                    variants={variants}
                    initial={p.animate ? "initial" : false}
                    animate="animate"
                    exit="exit"
                    transition={{ duration: morphStyle === "fade" ? Math.max(0.4, duration) : duration, ease }}
                >
                    {word}
                </motion.span>
            </AnimatePresence>
        </motion.span>
    )
}


MorphTextLite.displayName = "Morph Headline Lite"

addPropertyControls(MorphTextLite, {
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "We build", placeholder: "Static text before" },
    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String },
        defaultValue: DEFAULT_WORDS,
        description: "Add 2+ words to animate. Empty entries are skipped.",
    },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: "Static text after" },
    morphStyle: {
        type: ControlType.Enum,
        title: "Style",
       options: ["blur", "slide"],
       optionTitles: ["Blur", "Slide"],
       displaySegmentedControl: true,
       defaultValue: "blur",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        description: "Scales with font size.",
        hidden: (p: MorphTextLiteProps) => p.morphStyle === "slide",
    },
    slideDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        displaySegmentedControl: true,
        defaultValue: "up",
        hidden: (p: MorphTextLiteProps) => p.morphStyle !== "slide",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Start",
        options: ["load", "inView"],
        optionTitles: ["On Load", "In View"],
        displaySegmentedControl: true,
        defaultValue: "load",
    },
    repeat: {
        type: ControlType.Enum,
        title: "Repeat",
        options: ["loop", "once", "count"],
        optionTitles: ["Loop", "Once", "Count"],
        displaySegmentedControl: true,
        defaultValue: "loop",
    },
    loops: {
        type: ControlType.Number,
        title: "Loops",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 2,
        displayStepper: true,
        hidden: (p: MorphTextLiteProps) => p.repeat !== "count",
    },
    startDelay: { type: ControlType.Number, title: "Delay", min: 0, max: 10, step: 0.1, unit: "s", defaultValue: 0.4 },
    hold: { type: ControlType.Number, title: "Hold", min: 0.2, max: 10, step: 0.1, unit: "s", defaultValue: 1.8 },
    duration: {
        type: ControlType.Number,
        title: "Transition",
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
        defaultValue: 0.8,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 48, lineHeight: "1.15em", letterSpacing: "-0.02em" },
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#111111" },
    accent: {
        type: ControlType.Enum,
        title: "Word Color",
       options: ["inherit", "solid"],
       optionTitles: ["Same", "Accent"],
       displaySegmentedControl: true,
        defaultValue: "solid",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#6366f1",
        hidden: (p: MorphTextLiteProps) => (p.accent ?? "solid") !== "solid",
    },
    wordWeight: {
        type: ControlType.Enum,
        title: "Word Weight",
        options: ["inherit", "300", "400", "500", "600", "700", "800", "900"],
        optionTitles: ["Same", "Light", "Regular", "Medium", "Semibold", "Bold", "Extrabold", "Black"],
        defaultValue: "inherit",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "h4", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "H4", "Paragraph", "Span"],
        defaultValue: "h2",
    },
    widthMode: {
        type: ControlType.Enum,
        title: "Width",
        options: ["smart", "animate", "widest"],
        optionTitles: ["Smart", "Animate", "Widest"],
        displaySegmentedControl: true,
        defaultValue: "smart",
        description: "Smart animates the width, but reserves the widest word for centred text so nothing shifts sideways. With a Fixed or Fill width the word box never grows past the frame; with Fit Content it sizes to the words.",
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["wrap", "fit"],
        optionTitles: ["Wrap", "Fit"],
        displaySegmentedControl: true,
        defaultValue: "wrap",
        description: "Only applies with a Fixed or Fill width (with Fit Content the line grows instead). Wrap breaks words wider than the frame onto new lines; Fit shrinks the font so the longest sentence stays on one line.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Text Direction",
        options: ["auto", "ltr", "rtl"],
        optionTitles: ["Auto", "LTR", "RTL"],
        displaySegmentedControl: true,
        defaultValue: "auto",
    },
    pauseOnHover: { type: ControlType.Boolean, title: "Pause on Hover", defaultValue: true },
    selectable: { type: ControlType.Boolean, title: "Selectable", defaultValue: false, description: "Off keeps drags from highlighting the moving text." },
    screenReader: {
        type: ControlType.Enum,
        title: "Screen Reader",
        options: ["static", "live"],
        optionTitles: ["Static sentence", "Live (polite)"],
        defaultValue: "static",
        description: "Static reads one sentence listing all words. Live announces each change.",
    },
    reducedMotion: {
        type: ControlType.Enum,
        title: "Reduced Motion",
        options: ["fade", "static"],
        optionTitles: ["Crossfade", "First word only"],
        defaultValue: "fade",
    },
})
