// Word Search Grid: hover, tap, links, captions, auto-cycle, responsive, accessible
import {
    useState,
    useEffect,
    useMemo,
    useRef,
    useId,
    startTransition,
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

import {
    motion,
    AnimatePresence,
    useInView,
    useReducedMotion,
} from "framer-motion"

type WordItem = { text: string; caption?: string; link?: string }

type Placed = { index: number; text: string; row: number; col: number }

type GridData = {
    rows: number
    cols: number
    letters: string[][]
    cellOwner: number[][]
    placed: Placed[]
    dropped: string[]
}

interface WordSearchProps {
    words: WordItem[]
    rows: number
    cols: number
    mobileRows: number
    mobileCols: number
    mobileBreakpoint: number
    cellSize: number
    seed: number
    font: CSSProperties
    textColor: string
    highlightTextColor: string
    highlightWeight: number
    backgroundColor: string
    highlightColor: string
    highlightStrokeWidth: number
    dimMode: "hover" | "always" | "off"
    dimOpacity: number
    autoPlay: boolean
    groupSize: number
    autoHighlightInterval: number
    staggerDelay: number
    drawDuration: number
    openInNewTab: boolean
    showCaption: boolean
    captionFont: CSSProperties
    captionColor: string
    captionGap: number
    accessibleLabel: string
    style?: CSSProperties
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const DEFAULT_WORDS: WordItem[] = [
    {
        text: "REELS",
        caption: "Scroll-stopping reels built for reach.",
        link: "",
    },
    {
        text: "SHORTS",
        caption: "YouTube Shorts that feed your channel.",
        link: "",
    },
    {
        text: "PODCASTS",
        caption: "Full episodes, clips and thumbnails.",
        link: "",
    },
    {
        text: "TESTIMONIALS",
        caption: "Customer stories that close deals.",
        link: "",
    },
    {
        text: "EXPLAINERS",
        caption: "Your product, explained in 60 seconds.",
        link: "",
    },
    {
        text: "DOCUMENTARIES",
        caption: "Long-form brand films with depth.",
        link: "",
    },
    { text: "TRAILERS", caption: "Launch trailers that build hype.", link: "" },
    {
        text: "VLOGS",
        caption: "Founder and team vlogs, edited for retention.",
        link: "",
    },
]

// Deterministic random so server and client render the same grid (no flash, no reshuffle)
function hashString(str: string): number {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

function mulberry32(seed: number) {
    let a = seed
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function buildGrid(
    texts: string[],
    rows: number,
    cols: number,
    seed: number
): GridData {
    const rand = mulberry32(
        hashString(`${seed}|${rows}|${cols}|${texts.join(",")}`)
    )

    const letters = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ALPHABET[Math.floor(rand() * 26)])
    )
    const cellOwner = Array.from({ length: rows }, () =>
        new Array(cols).fill(-1)
    )
    const rowCount = new Array(rows).fill(0)
    const placed: Placed[] = []
    const dropped: string[] = []

    // Longest words first so they always find room
    const order = texts
        .map((_, i) => i)
        .filter((i) => texts[i].length > 0)
        .sort((a, b) => texts[b].length - texts[a].length || a - b)

    for (const idx of order) {
        const word = texts[idx]
        const len = word.length
        let best: [number, number][] = []
        let bestCount = Infinity

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c + len <= cols; c++) {
                // Keep at least one empty cell between words on the same row
                let ok = true
                for (let k = c - 1; k <= c + len; k++) {
                    if (k >= 0 && k < cols && cellOwner[r][k] !== -1) {
                        ok = false
                        break
                    }
                }
                if (!ok) continue
                // Prefer the emptiest rows so words spread out
                if (rowCount[r] < bestCount) {
                    best = [[r, c]]
                    bestCount = rowCount[r]
                } else if (rowCount[r] === bestCount) {
                    best.push([r, c])
                }
            }
        }

        if (best.length === 0) {
            dropped.push(word)
            continue
        }

        const [row, col] = best[Math.floor(rand() * best.length)]
        for (let i = 0; i < len; i++) {
            letters[row][col + i] = word[i]
            cellOwner[row][col + i] = idx
        }
        rowCount[row]++
        placed.push({ index: idx, text: word, row, col })
    }

    placed.sort((a, b) => a.index - b.index)
    return { rows, cols, letters, cellOwner, placed, dropped }
}

function pixelRectPath(x: number, y: number, w: number, h: number, p: number) {
    return `M ${x + p} ${y} L ${x + w - p} ${y} L ${x + w - p} ${y + p} L ${x + w} ${y + p} L ${x + w} ${y + h - p} L ${x + w - p} ${y + h - p} L ${x + w - p} ${y + h} L ${x + p} ${y + h} L ${x + p} ${y + h - p} L ${x} ${y + h - p} L ${x} ${y + p} L ${x + p} ${y + p} Z`
}

const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

/**
 * Word Search Grid
 *
 * Hidden-word grid with hover, tap, links, captions and auto-cycling highlights.
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function WordSearch(props: WordSearchProps) {
    const {
        words = DEFAULT_WORDS,
        rows = 10,
        cols = 20,
        mobileRows = 14,
        mobileCols = 14,
        mobileBreakpoint = 700,
        cellSize = 50,
        seed = 1,
        font = {},
        textColor = "#0B5E4A",
        highlightTextColor = "#00805F",
        highlightWeight = 700,
        backgroundColor = "#E6FAF4",
        highlightColor = "#00805F",
        highlightStrokeWidth = 3,
        dimMode = "hover",
        dimOpacity = 0.35,
        autoPlay = true,
        groupSize = 3,
        autoHighlightInterval = 1600,
        staggerDelay = 400,
        drawDuration = 0.6,
        openInNewTab = false,
        showCaption = true,
        captionFont = {},
        captionColor = "#0B5E4A",
        captionGap = 16,
        accessibleLabel = "Our services",
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const pointerTypeRef = useRef<string>("mouse")
    const groupIndexRef = useRef(0)

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion() === true
    const inView = useInView(containerRef, { amount: 0.3 })
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const [active, setActive] = useState<number | null>(null)
    const [autoWords, setAutoWords] = useState<number[]>([])

    const scopeClass = "ws" + useId().replace(/[^a-zA-Z0-9]/g, "")

    // Clean words once; stable key so the grid never reshuffles on re-render
    const texts = useMemo(
        () =>
            (words || []).map((w) =>
                (w?.text || "").toUpperCase().replace(/[^A-Z]/g, "")
            ),
        [words]
    )
    const textsKey = texts.join("|")

    const desktopGrid = useMemo(
        () => buildGrid(texts, rows, cols, seed),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [textsKey, rows, cols, seed]
    )

    const hasMobile = mobileCols > 0 && mobileRows > 0
    const mobileGrid = useMemo(
        () =>
            hasMobile ? buildGrid(texts, mobileRows, mobileCols, seed) : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [textsKey, mobileRows, mobileCols, seed, hasMobile]
    )

    // Split placed words into clean groups (no wrap-around duplicates)
    const groups = useMemo(() => {
        const size = Math.max(1, Math.floor(groupSize))
        const ids = desktopGrid.placed.map((p) => p.index)
        const out: number[][] = []
        for (let i = 0; i < ids.length; i += size) {
            out.push(ids.slice(i, i + size))
        }
        return out
    }, [desktopGrid, groupSize])

    const canCycle =
        autoPlay &&
        !isStatic &&
        !reduceMotion &&
        inView &&
        active === null &&
        groups.length > 0

    // Auto-cycle: draw group with stagger, hold, fade out, next group
    useEffect(() => {
        if (!canCycle) return
        const timers: ReturnType<typeof setTimeout>[] = []
        const later = (fn: () => void, ms: number) =>
            timers.push(setTimeout(fn, ms))

        const runGroup = () => {
            const group = groups[groupIndexRef.current % groups.length]
            groupIndexRef.current++

            startTransition(() => setAutoWords([]))
            group.forEach((wordIndex, i) => {
                later(() => {
                    startTransition(() =>
                        setAutoWords((prev) => [...prev, wordIndex])
                    )
                }, i * staggerDelay)
            })

            const drawEnd =
                (group.length - 1) * staggerDelay + drawDuration * 1000
            later(
                () => startTransition(() => setAutoWords([])),
                drawEnd + autoHighlightInterval
            )
            later(runGroup, drawEnd + autoHighlightInterval + 400)
        }

        later(runGroup, 300)
        return () => timers.forEach(clearTimeout)
    }, [canCycle, groups, staggerDelay, drawDuration, autoHighlightInterval])

    // What is highlighted right now
    const staticGroup =
        (isStatic || reduceMotion) && autoPlay && groups.length > 0
            ? groups[0]
            : []
    const highlighted: number[] =
        active !== null
            ? [active]
            : isStatic || reduceMotion
              ? staticGroup
              : autoWords

    const captionIndex =
        active !== null
            ? active
            : highlighted.length > 0
              ? highlighted[highlighted.length - 1]
              : null

    const dimActive =
        dimMode === "always"
            ? highlighted.length > 0
            : dimMode === "hover"
              ? active !== null
              : false

    const handleWordClick = (index: number) => {
        const isTouch = pointerTypeRef.current !== "mouse"
        // First tap on touch highlights, second tap follows the link
        if (isTouch && active !== index) {
            startTransition(() => setActive(index))
            return
        }
        const link = words[index]?.link
        if (!link || isCanvas || typeof window === "undefined") return
        if (openInNewTab) {
            window.open(link, "_blank", "noopener,noreferrer")
        } else {
            window.location.href = link
        }
    }

    const drawDur = reduceMotion ? 0 : drawDuration
    const fadeDur = reduceMotion ? 0 : 0.3

    const renderGrid = (grid: GridData, variantClass: string) => {
        const pad = cellSize * 0.1
        const pixel = cellSize * 0.08

        return (
            <svg
                className={variantClass}
                viewBox={`0 0 ${grid.cols * cellSize} ${grid.rows * cellSize}`}
                aria-hidden="true"
                focusable="false"
                style={{ width: "100%", height: "auto", overflow: "visible" }}
            >
                {grid.letters.map((row, r) =>
                    row.map((letter, c) => {
                        const owner = grid.cellOwner[r][c]
                        const isLit =
                            owner !== -1 && highlighted.includes(owner)
                        return (
                            <text
                                key={`${r}-${c}`}
                                x={c * cellSize + cellSize / 2}
                                y={r * cellSize + cellSize / 2}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                    userSelect: "none",
                                    ...font,
                                    // Set after the font spread so they are never overridden
                                    fill: isLit
                                        ? highlightTextColor
                                        : textColor,
                                    fontWeight: isLit
                                        ? highlightWeight
                                        : (font as any)?.fontWeight,
                                    opacity:
                                        dimActive && !isLit ? dimOpacity : 1,
                                    transition:
                                        "fill 0.25s ease, opacity 0.25s ease",
                                    pointerEvents: "none",
                                }}
                            >
                                {letter}
                            </text>
                        )
                    })
                )}

                {grid.placed.map((word) => {
                    const x = word.col * cellSize
                    const y = word.row * cellSize
                    const w = word.text.length * cellSize
                    const shown = highlighted.includes(word.index)
                    const hasLink = !!words[word.index]?.link

                    return (
                        <g key={word.index}>
                            <motion.path
                                d={pixelRectPath(
                                    x + pad,
                                    y + pad,
                                    w - pad * 2,
                                    cellSize - pad * 2,
                                    pixel
                                )}
                                stroke={highlightColor}
                                strokeWidth={highlightStrokeWidth}
                                fill="none"
                                strokeLinecap="square"
                                strokeLinejoin="miter"
                                initial={false}
                                animate={shown ? "show" : "hide"}
                                variants={{
                                    show: {
                                        pathLength: 1,
                                        opacity: 1,
                                        transition: {
                                            pathLength: {
                                                duration: drawDur,
                                                ease: "linear",
                                            },
                                            opacity: { duration: 0.1 },
                                        },
                                    },
                                    hide: {
                                        pathLength: 0,
                                        opacity: 0,
                                        transition: {
                                            opacity: { duration: fadeDur },
                                            pathLength: {
                                                duration: 0,
                                                delay: fadeDur,
                                            },
                                        },
                                    },
                                }}
                                style={{ pointerEvents: "none" }}
                            />
                            {/* One hit area per word: no flicker between letters */}
                            <rect
                                data-ws-word=""
                                x={x}
                                y={y}
                                width={w}
                                height={cellSize}
                                fill="transparent"
                                style={{
                                    cursor: hasLink ? "pointer" : "default",
                                }}
                                onPointerDown={(e) => {
                                    pointerTypeRef.current = e.pointerType
                                }}
                                onPointerEnter={(e) => {
                                    if (e.pointerType !== "mouse") return
                                    startTransition(() => setActive(word.index))
                                }}
                                onPointerLeave={(e) => {
                                    if (e.pointerType !== "mouse") return
                                    startTransition(() => setActive(null))
                                }}
                                onClick={() => handleWordClick(word.index)}
                            />
                        </g>
                    )
                })}
            </svg>
        )
    }

    const breakpointCss = hasMobile
        ? `.${scopeClass}{container-type:inline-size;}
.${scopeClass} .${scopeClass}-d{display:block;}
.${scopeClass} .${scopeClass}-m{display:none;}
@container (max-width: ${mobileBreakpoint}px){
.${scopeClass} .${scopeClass}-d{display:none;}
.${scopeClass} .${scopeClass}-m{display:block;}
}`
        : `.${scopeClass} .${scopeClass}-d{display:block;}`

    const warnings: string[] = []
    if (desktopGrid.dropped.length)
        warnings.push(`Desktop: ${desktopGrid.dropped.join(", ")} did not fit`)
    if (mobileGrid && mobileGrid.dropped.length)
        warnings.push(`Mobile: ${mobileGrid.dropped.join(", ")} did not fit`)

    return (
        <div
            ref={containerRef}
            className={scopeClass}
            onPointerDown={(e) => {
                // Tap outside a word on touch clears the highlight
                if (e.pointerType === "mouse") return
                const target = e.target as Element
                if (!target.closest?.("[data-ws-word]")) {
                    startTransition(() => setActive(null))
                }
            }}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: showCaption ? captionGap : 0,
                backgroundColor,
                ...style,
            }}
        >
            <style>{breakpointCss}</style>

            <div style={{ width: "100%" }}>
                {renderGrid(desktopGrid, `${scopeClass}-d`)}
                {mobileGrid && renderGrid(mobileGrid, `${scopeClass}-m`)}
            </div>

            {showCaption && (
                <div
                    aria-hidden="true"
                    style={{
                        ...captionFont,
                        color: captionColor,
                        minHeight: "1.5em",
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {captionIndex !== null &&
                            words[captionIndex]?.caption && (
                                <motion.div
                                    key={captionIndex}
                                    initial={{
                                        opacity: 0,
                                        y: reduceMotion ? 0 : 6,
                                    }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                        opacity: 0,
                                        y: reduceMotion ? 0 : -6,
                                    }}
                                    transition={{ duration: fadeDur || 0.01 }}
                                >
                                    {words[captionIndex].caption}
                                </motion.div>
                            )}
                    </AnimatePresence>
                </div>
            )}

            {/* Real list for screen readers and keyboard users */}
            <nav aria-label={accessibleLabel} style={srOnly}>
                <ul>
                    {words.map((w, i) =>
                        texts[i] ? (
                            <li key={i}>
                                {w.link ? (
                                    <a
                                        href={w.link}
                                        target={
                                            openInNewTab ? "_blank" : undefined
                                        }
                                        rel={
                                            openInNewTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        onFocus={() => setActive(i)}
                                        onBlur={() => setActive(null)}
                                    >
                                        {w.text}
                                        {w.caption ? `: ${w.caption}` : ""}
                                    </a>
                                ) : (
                                    <span>
                                        {w.text}
                                        {w.caption ? `: ${w.caption}` : ""}
                                    </span>
                                )}
                            </li>
                        ) : null
                    )}
                </ul>
            </nav>

            {isCanvas && warnings.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "rgba(220, 38, 38, 0.9)",
                        color: "#fff",
                        fontSize: 12,
                        fontFamily: "sans-serif",
                        lineHeight: 1.4,
                        pointerEvents: "none",
                    }}
                >
                    {warnings.map((w) => (
                        <div key={w}>{w}. Add columns or shorten the word.</div>
                    ))}
                </div>
            )}
        </div>
    )
}

WordSearch.defaultProps = {
    words: DEFAULT_WORDS,
    rows: 10,
    cols: 20,
    mobileRows: 14,
    mobileCols: 14,
    mobileBreakpoint: 700,
    cellSize: 50,
    seed: 1,
    textColor: "#0B5E4A",
    highlightTextColor: "#00805F",
    highlightWeight: 700,
    backgroundColor: "#E6FAF4",
    highlightColor: "#00805F",
    highlightStrokeWidth: 3,
    dimMode: "hover",
    dimOpacity: 0.35,
    autoPlay: true,
    groupSize: 3,
    autoHighlightInterval: 1600,
    staggerDelay: 400,
    drawDuration: 0.6,
    openInNewTab: false,
    showCaption: true,
    captionColor: "#0B5E4A",
    captionGap: 16,
    accessibleLabel: "Our services",
}

addPropertyControls(WordSearch, {
    words: {
        type: ControlType.Array,
        title: "Words",
        maxCount: 16,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Word",
                    defaultValue: "WORD",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                    displayTextArea: true,
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_WORDS,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 10,
        min: 4,
        max: 24,
        step: 1,
    },
    cols: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 20,
        min: 6,
        max: 30,
        step: 1,
    },
    mobileRows: {
        type: ControlType.Number,
        title: "Mobile Rows",
        defaultValue: 14,
        min: 0,
        max: 30,
        step: 1,
        description:
            "Set Mobile Rows or Columns to 0 to use one grid everywhere.",
    },
    mobileCols: {
        type: ControlType.Number,
        title: "Mobile Cols",
        defaultValue: 14,
        min: 0,
        max: 20,
        step: 1,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        defaultValue: 700,
        min: 300,
        max: 1200,
        step: 10,
        unit: "px",
        hidden: (p: any) => !p.mobileCols || !p.mobileRows,
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        defaultValue: 50,
        min: 20,
        max: 100,
        step: 1,
    },
    seed: {
        type: ControlType.Number,
        title: "Shuffle",
        defaultValue: 1,
        min: 1,
        max: 999,
        step: 1,
        displayStepper: true,
        description: "Change to get a new letter layout.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Medium",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0B5E4A",
    },
    highlightTextColor: {
        type: ControlType.Color,
        title: "Found Text",
        defaultValue: "#00805F",
    },
    highlightWeight: {
        type: ControlType.Number,
        title: "Found Weight",
        defaultValue: 700,
        min: 100,
        max: 900,
        step: 100,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E6FAF4",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Box Color",
        defaultValue: "#00805F",
    },
    highlightStrokeWidth: {
        type: ControlType.Number,
        title: "Box Stroke",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    dimMode: {
        type: ControlType.Enum,
        title: "Dim Others",
        defaultValue: "hover",
        options: ["hover", "always", "off"],
        optionTitles: ["On Hover", "Always", "Off"],
        displaySegmentedControl: true,
    },
    dimOpacity: {
        type: ControlType.Number,
        title: "Dim Opacity",
        defaultValue: 0.35,
        min: 0.05,
        max: 1,
        step: 0.05,
        hidden: (p: any) => p.dimMode === "off",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
    },
    groupSize: {
        type: ControlType.Number,
        title: "Group Size",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        hidden: (p: any) => !p.autoPlay,
    },
    autoHighlightInterval: {
        type: ControlType.Number,
        title: "Hold Time",
        defaultValue: 1600,
        min: 300,
        max: 6000,
        step: 100,
        unit: "ms",
        hidden: (p: any) => !p.autoPlay,
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 400,
        min: 0,
        max: 1500,
        step: 50,
        unit: "ms",
        hidden: (p: any) => !p.autoPlay,
    },
    drawDuration: {
        type: ControlType.Number,
        title: "Draw Speed",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Regular",
            lineHeight: "1.4em",
        },
        hidden: (p: any) => !p.showCaption,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#0B5E4A",
        hidden: (p: any) => !p.showCaption,
    },
    captionGap: {
        type: ControlType.Number,
        title: "Caption Gap",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showCaption,
    },
    accessibleLabel: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "Our services",
        description: "Read by screen readers instead of the letter grid.",
    },
})
