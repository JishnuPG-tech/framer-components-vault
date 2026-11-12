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


const { useState, useRef, useEffect, useCallback, useMemo } = React

type Img = { src?: string; srcSet?: string; alt?: string }
type Scene = { image?: Img; name?: string }
type Level = 3 | 4 | 5

interface PuzzleGameProps {
    scenes?: Scene[]
    difficulty?: Level
    title?: string
    hint?: string
    show?: Partial<Record<
        "difficulty" | "random" | "shuffle" | "preview" | "scenes" | "hint" | "moves" | "confetti",
        boolean
    >>
    colors?: { accent?: string; background?: string; text?: string }
    labels?: Partial<Record<
        | "difficulty" | "easy" | "medium" | "hard" | "random" | "shuffle"
        | "preview" | "scenes" | "moves" | "solved" | "playAgain",
        string
    >>
    board?: { gap?: number; pieceRadius?: number; maxWidth?: number }
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    padding?: string
    radius?: string
    onSolved?: () => void
    style?: React.CSSProperties
}

const UNSPLASH = (id: string) =>
    `https://images.unsplash.com/photo-${id}?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200`

const DEFAULT_SCENES: { src: string; name: string }[] = [
    { src: UNSPLASH("1604430466284-e3a33823187e"), name: "Forest Lake" },
    { src: UNSPLASH("1611862301382-fdf70949ab6d"), name: "Star Canyon" },
    { src: UNSPLASH("1764364645033-373263167490"), name: "Sunset Valley" },
    { src: UNSPLASH("1785156364519-91d27b228808"), name: "Seabird Cliff" },
    { src: UNSPLASH("1773553756473-1c4e0b878968"), name: "Ocean Jump" },
    { src: UNSPLASH("1724454216479-340fff563a19"), name: "Balloon" },
    { src: UNSPLASH("1778552923014-84306d649cc1"), name: "Poppy Field" },
    { src: UNSPLASH("1783372336974-ac389ca71e26"), name: "Desert Tree" },
]

// Deterministic PRNG so the first render matches between server and client.
function mulberry32(seed: number) {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function shuffled(count: number, rand: () => number): number[] {
    const order = Array.from({ length: count }, (_, i) => i)
    do {
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1))
            ;[order[i], order[j]] = [order[j], order[i]]
        }
    } while (order.every((v, i) => v === i))
    return order
}

const isSolved = (order: number[]) => order.every((v, i) => v === i)

const withAlpha = (color: string, alpha: number) =>
    `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
    left: (i * 53) % 100,
    top: 20 + ((i * 37) % 60),
    delay: (i % 6) * 0.08,
    size: 6 + (i % 3) * 2,
    round: i % 2 === 0,
}))

/**
 * Puzzle Game — drag-to-swap image puzzle.
 *
 * @framerIntrinsicWidth 540
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PuzzleGame(props: PuzzleGameProps) {
    const {
        scenes = [],
        difficulty = 3,
        title = "Puzzle Game",
        hint = "Drag pieces to swap · Hold Preview to reveal the original",
        show = {},
        colors = {},
        labels = {},
        board = {},
        titleFont,
        bodyFont,
        padding = 0,
        radius = 0,
        onSolved,
        style,
    } = props

    const visible = {
        difficulty: true,
        random: true,
        shuffle: true,
        preview: true,
        scenes: true,
        hint: true,
        moves: true,
        confetti: true,
        ...show,
    }
    const accent = colors.accent ?? "#00E5A0"
    const background = colors.background ?? "#0C0C14"
    const text = colors.text ?? "#FFFFFF"
    const gap = board.gap ?? 3
    const pieceRadius = board.pieceRadius ?? 4
    const maxWidth = board.maxWidth ?? 540
    const t = {
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        random: "Random",
        shuffle: "Shuffle",
        preview: "Preview",
        scenes: "Choose a scene",
        moves: "Moves",
        solved: "Solved!",
        playAgain: "Play again",
        ...labels,
    }

    const sceneList = useMemo(() => {
        const custom = (scenes as Scene[])
            .filter((s) => s?.image?.src)
            .map((s, i) => ({
                src: s.image!.src!,
                name: s.name || s.image!.alt || `Scene ${i + 1}`,
            }))
        return custom.length ? custom : DEFAULT_SCENES
    }, [scenes])

    const titleStyle: React.CSSProperties = {
        fontFamily: "Oxanium, Inter, -apple-system, sans-serif",
        fontWeight: 700,
        ...pickFont(titleFont),
    }
    const bodyStyle: React.CSSProperties = {
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 600,
        ...pickFont(bodyFont),
    }

    // Canvas, export and thumbnails render a static frame: skip animations there.
    const isStatic = useIsStaticRenderer()

    // ---- Game state ----
    const randRef = useRef<() => number>(mulberry32(7))
    const [level, setLevel] = useState<Level>(difficulty)
    const [sceneIndex, setSceneIndex] = useState(0)
    const [order, setOrder] = useState(() => shuffled(difficulty * difficulty, randRef.current))
    const [moves, setMoves] = useState(0)
    const [solved, setSolved] = useState(false)
    const [selected, setSelected] = useState<number | null>(null)
    const [peeking, setPeeking] = useState(false)
    const [snapped, setSnapped] = useState<number[]>([])
    const [drag, setDrag] = useState<{
        from: number
        dx: number
        dy: number
        over: number | null
    } | null>(null)

    const scene = sceneList[Math.min(sceneIndex, sceneList.length - 1)]

    const restart = useCallback((nextLevel: Level) => {
        randRef.current = Math.random
        setOrder(shuffled(nextLevel * nextLevel, randRef.current))
        setMoves(0)
        setSolved(false)
        setSelected(null)
        setDrag(null)
    }, [])

    // Follow the Difficulty control while editing on the canvas.
    useEffect(() => {
        if (difficulty !== level) {
            setLevel(difficulty)
            restart(difficulty)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty])

    useEffect(() => {
        if (sceneIndex >= sceneList.length) setSceneIndex(0)
    }, [sceneList.length, sceneIndex])

    const chooseLevel = (next: Level) => {
        setLevel(next)
        restart(next)
    }

    const chooseScene = (index: number) => {
        setSceneIndex(index)
        restart(level)
    }

    const randomScene = () => {
        if (sceneList.length < 2) return restart(level)
        let next = sceneIndex
        while (next === sceneIndex) next = Math.floor(Math.random() * sceneList.length)
        chooseScene(next)
    }

    const swap = (a: number, b: number) => {
        if (a === b || solved) return
        const next = order.slice()
        ;[next[a], next[b]] = [next[b], next[a]]
        setOrder(next)
        setMoves((m) => m + 1)
        setSnapped([a, b])
        if (isSolved(next)) {
            setSolved(true)
            onSolved?.()
        }
    }

    useEffect(() => {
        if (!snapped.length) return
        const id = setTimeout(() => setSnapped([]), 400)
        return () => clearTimeout(id)
    }, [snapped])

    // ---- Dragging ----
    const boardRef = useRef<HTMLDivElement>(null)
    const dragStart = useRef<{ x: number; y: number; from: number; moved: boolean } | null>(
        null
    )

    const cellAt = (x: number, y: number) => {
        const rect = boardRef.current?.getBoundingClientRect()
        if (!rect) return null
        const col = Math.floor(((x - rect.left) / rect.width) * level)
        const row = Math.floor(((y - rect.top) / rect.height) * level)
        if (col < 0 || row < 0 || col >= level || row >= level) return null
        return row * level + col
    }

    const onPiecePointerDown = (index: number) => (e: React.PointerEvent) => {
        if (solved || e.button !== 0) return
        e.preventDefault()
        dragStart.current = { x: e.clientX, y: e.clientY, from: index, moved: false }
    }

    useEffect(() => {
        const move = (e: PointerEvent) => {
            const start = dragStart.current
            if (!start) return
            const dx = e.clientX - start.x
            const dy = e.clientY - start.y
            if (!start.moved && Math.hypot(dx, dy) < 6) return
            start.moved = true
            setSelected(null)
            setDrag({ from: start.from, dx, dy, over: cellAt(e.clientX, e.clientY) })
        }
        const up = (e: PointerEvent) => {
            const start = dragStart.current
            dragStart.current = null
            if (!start) return
            if (start.moved) {
                const target = cellAt(e.clientX, e.clientY)
                setDrag(null)
                if (target !== null) swap(start.from, target)
            } else {
                tap(start.from)
            }
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
        return () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
        }
    })

    // Tap one piece, then another, to swap them (also used for keyboard).
    const tap = (index: number) => {
        if (solved) return
        if (selected === null) setSelected(index)
        else if (selected === index) setSelected(null)
        else {
            swap(selected, index)
            setSelected(null)
        }
    }

    // ---- Layout ----
    const rootRef = useRef<HTMLDivElement>(null)
    const [narrow, setNarrow] = useState(false)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([entry]) =>
            setNarrow(entry.contentRect.width < 480)
        )
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const smallLabel: React.CSSProperties = {
        ...bodyStyle,
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: withAlpha(text, 0.4),
        textAlign: "center",
    }
    const iconButton: React.CSSProperties = {
        width: 44,
        height: 44,
        borderRadius: 10,
        border: `1px solid ${withAlpha(text, 0.14)}`,
        background: withAlpha(text, 0.08),
        color: text,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontSize: 18,
        lineHeight: 1,
    }

    const levels: [Level, string][] = [
        [3, t.easy],
        [4, t.medium],
        [5, t.hard],
    ]
    const showControls =
        visible.difficulty || visible.random || visible.shuffle || visible.preview

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                padding,
                borderRadius: radius,
                overflow: "hidden",
                background,
                color: text,
                boxSizing: "border-box",
                width: "100%",
            }}
        >
            <style>{keyframes}</style>

            {title && (
                <div
                    style={{
                        ...titleStyle,
                        fontSize: 12,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: accent,
                        textAlign: "center",
                    }}
                >
                    {title}
                </div>
            )}

            {showControls && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        gap: narrow ? 14 : 20,
                    }}
                >
                    {visible.difficulty && (
                        <Group label={t.difficulty} labelStyle={smallLabel}>
                            <div
                                role="radiogroup"
                                aria-label={t.difficulty}
                                style={{ display: "flex", gap: 6, height: 44, alignItems: "center" }}
                            >
                                {levels.map(([n, name]) => {
                                    const active = level === n
                                    return (
                                        <button
                                            key={n}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            onClick={() => chooseLevel(n)}
                                            style={{
                                                ...bodyStyle,
                                                fontSize: 12,
                                                padding: narrow ? "8px 11px" : "8px 16px",
                                                borderRadius: 100,
                                                border: `1px solid ${
                                                    active ? withAlpha(accent, 0.5) : withAlpha(text, 0.1)
                                                }`,
                                                background: active
                                                    ? withAlpha(accent, 0.15)
                                                    : withAlpha(text, 0.05),
                                                color: active ? accent : withAlpha(text, 0.6),
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                transition: "all 160ms ease",
                                            }}
                                        >
                                            {name} {n}×{n}
                                        </button>
                                    )
                                })}
                            </div>
                        </Group>
                    )}

                    {visible.random && (
                        <Group label={t.random} labelStyle={smallLabel}>
                            <button
                                type="button"
                                aria-label="Pick a random scene"
                                onClick={randomScene}
                                style={iconButton}
                            >
                                <DiceIcon color={text} />
                            </button>
                        </Group>
                    )}

                    {visible.shuffle && (
                        <Group label={t.shuffle} labelStyle={smallLabel}>
                            <button
                                type="button"
                                aria-label="Shuffle pieces"
                                onClick={() => restart(level)}
                                style={iconButton}
                            >
                                ↺
                            </button>
                        </Group>
                    )}

                    {visible.preview && (
                        <Group label={t.preview} labelStyle={smallLabel}>
                            <button
                                type="button"
                                aria-label="Hold to preview the original image"
                                onPointerDown={() => setPeeking(true)}
                                onPointerUp={() => setPeeking(false)}
                                onPointerLeave={() => setPeeking(false)}
                                onPointerCancel={() => setPeeking(false)}
                                onKeyDown={(e) => {
                                    if (e.key === " " || e.key === "Enter") setPeeking(true)
                                }}
                                onKeyUp={() => setPeeking(false)}
                                onBlur={() => setPeeking(false)}
                                onContextMenu={(e) => e.preventDefault()}
                                style={{
                                    ...iconButton,
                                    borderRadius: 8,
                                    backgroundImage: `url(${scene.src})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    border: `2px solid ${withAlpha(accent, peeking ? 1 : 0.35)}`,
                                    touchAction: "none",
                                    WebkitTouchCallout: "none",
                                }}
                            />
                        </Group>
                    )}
                </div>
            )}

            {visible.scenes && sceneList.length > 1 && (
                <div
                    style={{
                        width: "100%",
                        maxWidth,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    <div style={smallLabel}>{t.scenes}</div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${
                                narrow ? Math.min(4, sceneList.length) : Math.min(8, sceneList.length)
                            }, minmax(0, 1fr))`,
                            gap: 8,
                        }}
                    >
                        {sceneList.map((s, i) => {
                            const active = i === sceneIndex
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Choose ${s.name} scene`}
                                    aria-pressed={active}
                                    title={s.name}
                                    onClick={() => chooseScene(i)}
                                    style={{
                                        height: narrow ? 54 : 58,
                                        borderRadius: 8,
                                        padding: 0,
                                        cursor: "pointer",
                                        border: active
                                            ? `2px solid ${accent}`
                                            : `1px solid ${withAlpha(text, 0.15)}`,
                                        boxShadow: active ? `0 0 0 1px ${withAlpha(accent, 0.25)}` : "none",
                                        backgroundImage: `url(${s.src})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        transition: "border-color 160ms ease, box-shadow 160ms ease",
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>
            )}

            {visible.hint && hint && (
                <div
                    style={{
                        ...bodyStyle,
                        fontWeight: 500,
                        fontSize: 12,
                        lineHeight: 1.35,
                        textAlign: "center",
                        color: withAlpha(text, 0.58),
                        padding: "8px 14px",
                        borderRadius: 100,
                        background: withAlpha(text, 0.04),
                        border: `1px solid ${withAlpha(text, 0.08)}`,
                    }}
                >
                    {hint}
                </div>
            )}

            {/* Board */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth,
                    aspectRatio: "1 / 1",
                    animation: solved && !isStatic ? "pgSolvedPulse 600ms ease" : "none",
                }}
            >
                <div
                    ref={boardRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        gridTemplateColumns: `repeat(${level}, 1fr)`,
                        gridTemplateRows: `repeat(${level}, 1fr)`,
                        gap,
                    }}
                >
                    {order.map((piece, slot) => {
                        const col = piece % level
                        const row = Math.floor(piece / level)
                        const dragging = drag?.from === slot
                        const target = drag && drag.over === slot && drag.from !== slot
                        const isSelected = selected === slot
                        const highlight = dragging || target || isSelected
                        return (
                            <button
                                key={`${level}-${piece}`}
                                type="button"
                                aria-label={`Puzzle piece ${piece + 1}, position ${slot + 1}`}
                                aria-pressed={isSelected}
                                onPointerDown={onPiecePointerDown(slot)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        tap(slot)
                                    }
                                }}
                                style={{
                                    position: "relative",
                                    padding: 0,
                                    overflow: "hidden",
                                    borderRadius: pieceRadius,
                                    border: `1px solid ${
                                        highlight ? accent : withAlpha(text, 0.1)
                                    }`,
                                    boxShadow: highlight
                                        ? `0 0 0 2px ${withAlpha(accent, 0.6)}`
                                        : "none",
                                    background: withAlpha(text, 0.05),
                                    cursor: solved ? "default" : dragging ? "grabbing" : "grab",
                                    userSelect: "none",
                                    touchAction: "none",
                                    outline: "none",
                                    zIndex: dragging ? 20 : 1,
                                    transform: dragging
                                        ? `translate(${drag!.dx}px, ${drag!.dy}px) scale(1.06)`
                                        : "none",
                                    transition: dragging
                                        ? "none"
                                        : "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
                                    opacity: target ? 0.75 : 1,
                                    animation: snapped.includes(slot) && !isStatic
                                        ? "pgSnap 380ms ease"
                                        : "none",
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        width: `${level * 100}%`,
                                        height: `${level * 100}%`,
                                        left: `${-col * 100}%`,
                                        top: `${-row * 100}%`,
                                        backgroundImage: `url(${scene.src})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        pointerEvents: "none",
                                    }}
                                />
                            </button>
                        )
                    })}
                </div>

                {visible.moves && (
                    <div
                        aria-live="polite"
                        style={{
                            ...titleStyle,
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 25,
                            padding: "6px 10px",
                            borderRadius: 100,
                            background: "rgba(0,0,0,0.45)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#FFFFFF",
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            pointerEvents: "none",
                        }}
                    >
                        {moves} {t.moves}
                    </div>
                )}

                {/* Preview overlay */}
                <div
                    aria-hidden={!peeking}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 30,
                        borderRadius: pieceRadius,
                        backgroundImage: `url(${scene.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: peeking ? 1 : 0,
                        pointerEvents: "none",
                        transition: "opacity 120ms ease",
                    }}
                >
                    <div
                        style={{
                            ...titleStyle,
                            position: "absolute",
                            top: 8,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(0,0,0,0.5)",
                            color: "#FFFFFF",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            padding: "4px 10px",
                            borderRadius: 100,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {t.preview}
                    </div>
                </div>

                {/* Solved overlay */}
                {solved && (
                    <div
                        role="status"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 40,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 14,
                            borderRadius: pieceRadius,
                            background: "rgba(0,0,0,0.55)",
                            backdropFilter: "blur(2px)",
                            WebkitBackdropFilter: "blur(2px)",
                            animation: isStatic ? "none" : "pgOverlayIn 320ms ease both",
                            overflow: "hidden",
                        }}
                    >
                        {visible.confetti &&
                            CONFETTI.map((c, i) => (
                                <span
                                    key={i}
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        left: `${c.left}%`,
                                        top: `${c.top}%`,
                                        width: c.size,
                                        height: c.round ? c.size : c.size * 0.5,
                                        borderRadius: c.round ? "50%" : 2,
                                        background: i % 3 === 0 ? "#FFFFFF" : accent,
                                        opacity: isStatic ? 0.9 : 0,
                                        animation: isStatic
                                            ? "none"
                                            : `pgConfetti 1.6s ease-out ${c.delay}s infinite`,
                                    }}
                                />
                            ))}
                        <div
                            style={{
                                ...titleStyle,
                                fontSize: 32,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                color: accent,
                            }}
                        >
                            {t.solved}
                        </div>
                        <div style={{ ...bodyStyle, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                            {moves} {t.moves.toLowerCase()}
                        </div>
                        <button
                            type="button"
                            onClick={() => restart(level)}
                            style={{
                                ...bodyStyle,
                                fontSize: 13,
                                padding: "10px 20px",
                                borderRadius: 100,
                                border: "none",
                                background: accent,
                                color: "#0C0C14",
                                cursor: "pointer",
                            }}
                        >
                            {t.playAgain}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function Group({
    label,
    labelStyle,
    children,
}: {
    label: string
    labelStyle: React.CSSProperties
    children: React.ReactNode
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={labelStyle}>{label}</div>
            {children}
        </div>
    )
}

function DiceIcon({ color }: { color: string }) {
    return (
        <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" fill={color} fillOpacity="0.12" />
            <circle cx="9" cy="9" r="1.6" fill={color} />
            <circle cx="15" cy="9" r="1.6" fill={color} />
            <circle cx="9" cy="15" r="1.6" fill={color} />
            <circle cx="15" cy="15" r="1.6" fill={color} />
        </svg>
    )
}

function pickFont(font?: React.CSSProperties): React.CSSProperties {
    if (!font) return {}
    const { fontFamily, fontWeight, fontStyle } = font
    return {
        ...(fontFamily && { fontFamily }),
        ...(fontWeight && { fontWeight }),
        ...(fontStyle && { fontStyle }),
    }
}

const keyframes = `
@keyframes pgOverlayIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
@keyframes pgSolvedPulse { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
@keyframes pgSnap { 0% { transform: scale(1.08); } 60% { transform: scale(0.98); } 100% { transform: scale(1); } }
@keyframes pgConfetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  15% { opacity: 1; }
  45% { transform: translateY(-14px) rotate(70deg); opacity: 1; }
  100% { transform: translateY(24px) rotate(160deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [style*="pgConfetti"], [style*="pgSnap"], [style*="pgSolvedPulse"] { animation: none !important; }
}
`

PuzzleGame.displayName = "Puzzle Game"

addPropertyControls(PuzzleGame, {
    scenes: {
        type: ControlType.Array,
        title: "Scenes",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                name: { type: ControlType.String, title: "Name", defaultValue: "" },
            },
        },
        description: "Leave empty to use the 8 built-in scenes.",
    },
    difficulty: {
        type: ControlType.Enum,
        title: "Difficulty",
        options: [3, 4, 5],
        optionTitles: ["3×3", "4×4", "5×5"],
        defaultValue: 3,
        displaySegmentedControl: true,
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Puzzle Game" },
    hint: {
        type: ControlType.String,
        title: "Hint",
        defaultValue: "Drag pieces to swap · Hold Preview to reveal the original",
        displayTextArea: true,
    },
    show: {
        type: ControlType.Object,
        title: "Show",
        controls: {
            difficulty: { type: ControlType.Boolean, title: "Difficulty", defaultValue: true },
            random: { type: ControlType.Boolean, title: "Random", defaultValue: true },
            shuffle: { type: ControlType.Boolean, title: "Shuffle", defaultValue: true },
            preview: { type: ControlType.Boolean, title: "Preview", defaultValue: true },
            scenes: { type: ControlType.Boolean, title: "Scenes", defaultValue: true },
            hint: { type: ControlType.Boolean, title: "Hint", defaultValue: true },
            moves: { type: ControlType.Boolean, title: "Moves", defaultValue: true },
            confetti: { type: ControlType.Boolean, title: "Confetti", defaultValue: true },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            accent: { type: ControlType.Color, title: "Accent", defaultValue: "#00E5A0" },
            background: { type: ControlType.Color, title: "Background", defaultValue: "#0C0C14" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    board: {
        type: ControlType.Object,
        title: "Board",
        controls: {
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 540,
                min: 200,
                max: 1200,
                step: 10,
                unit: "px",
            },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 3, min: 0, max: 16, unit: "px" },
            pieceRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 4,
                min: 0,
                max: 24,
                unit: "px",
            },
        },
    },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "0px" },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "0px" },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            difficulty: { type: ControlType.String, defaultValue: "Difficulty" },
            easy: { type: ControlType.String, defaultValue: "Easy" },
            medium: { type: ControlType.String, defaultValue: "Medium" },
            hard: { type: ControlType.String, defaultValue: "Hard" },
            random: { type: ControlType.String, defaultValue: "Random" },
            shuffle: { type: ControlType.String, defaultValue: "Shuffle" },
            preview: { type: ControlType.String, defaultValue: "Preview" },
            scenes: { type: ControlType.String, title: "Scenes", defaultValue: "Choose a scene" },
            moves: { type: ControlType.String, defaultValue: "Moves" },
            solved: { type: ControlType.String, defaultValue: "Solved!" },
            playAgain: { type: ControlType.String, title: "Play Again", defaultValue: "Play again" },
        },
    },
    onSolved: { type: ControlType.EventHandler, title: "On Solved" },
})
