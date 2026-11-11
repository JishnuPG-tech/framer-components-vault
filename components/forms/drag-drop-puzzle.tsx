import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent, RefObject } from "react"
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
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
} from "framer-motion"

/**
 * Drag & Drop Puzzle
 *
 * Standalone puzzle: drag each piece into its matching outline.
 * Exposes its solved state through `onSolved`, `onReset` (Framer events),
 * `onSolvedChange` (code overrides / other code components) and a
 * `data-puzzle-solved` attribute on the root element.
 *
 * Form validation: when placed inside a Framer form the puzzle renders a
 * required, visually hidden field (`fieldName`). It stays empty until the
 * puzzle is solved, so the form cannot be submitted early. A capture-phase
 * submit guard backed by React state (not the DOM) blocks submit even if
 * someone edits the DOM / removes `required` in DevTools.
 * NOTE: client-side checks can never be fully trusted. For real protection,
 * also check that the `fieldName` value is present on your server/webhook.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 440
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 */

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type PuzzleType = "shape" | "color" | "number"
type ShapeKind =
    | "circle"
    | "square"
    | "triangle"
    | "star"
    | "hexagon"
    | "diamond"
type GlyphRole = "piece" | "target" | "active"

interface Point {
    x: number
    y: number
}

interface Size {
    w: number
    h: number
}

interface Theme {
    primary: string
    target: string
    onPrimary: string
}

interface PieceDef {
    id: string
    kind: ShapeKind
    color: string
    colorName: string
    value: number
    /** Index of the target slot this piece belongs to. */
    targetIndex: number
    /** Column the piece starts in (tray). */
    slot: number
    /** Horizontal offset inside its column, in column widths. */
    jitter: number
    /** Vertical position inside the tray, 0..1. */
    fy: number
}

interface Layout {
    size: number
    pad: number
    trayTop: number
    targets: Point[]
    starts: Point[]
}

interface Stoppable {
    stop: () => void
}

export interface DragDropPuzzleProps {
    title: string
    puzzleType: PuzzleType
    pieceCount: number
    instructionText: string
    successText: string
    showInstructions: boolean
    showProgress: boolean
    showReset: boolean
    randomize: boolean
    primaryColor: string
    targetColor: string
    backgroundColor: string
    textColor: string
    font?: CSSProperties
    objectSize: number
    radius: number
    gap: number
    animationSpeed: number
    requireSolved: boolean
    fieldName: string
    errorText: string
    errorColor: string
    onSolved?: () => void
    onReset?: () => void
    onSolvedChange?: (isSolved: boolean) => void
    style?: CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const MIN_PIECES = 2
const MAX_PIECES = 6
const MIN_OBJECT = 20
const FALLBACK_BOARD: Size = { w: 380, h: 250 }

const SHAPE_KINDS: ShapeKind[] = [
    "circle",
    "square",
    "triangle",
    "star",
    "hexagon",
    "diamond",
]

const SHAPE_NAMES: Record<ShapeKind, string> = {
    circle: "Circle",
    square: "Square",
    triangle: "Triangle",
    star: "Star",
    hexagon: "Hexagon",
    diamond: "Diamond",
}

const COLOR_SWATCHES: ReadonlyArray<{ name: string; value: string }> = [
    { name: "Red", value: "#E5484D" },
    { name: "Blue", value: "#3E63DD" },
    { name: "Green", value: "#30A46C" },
    { name: "Amber", value: "#F5A524" },
    { name: "Purple", value: "#8E4EC6" },
    { name: "Teal", value: "#12A594" },
]

const NUMBER_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const REST_FILTER = "drop-shadow(0px 0px 0px rgba(0, 0, 0, 0))"
const LIFT_FILTER = "drop-shadow(0px 8px 12px rgba(0, 0, 0, 0.16))"

const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? 44 : 19
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(52 + radius * Math.sin(angle)).toFixed(2)}`
}).join(" ")

const HEXAGON_POINTS = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3
    return `${(50 + 42 * Math.cos(angle)).toFixed(2)},${(50 + 42 * Math.sin(angle)).toFixed(2)}`
}).join(" ")

const SR_ONLY: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function makeSeed(): number {
    return Math.floor(Math.random() * 0x7fffffff) + 1
}

/** Small seeded PRNG so a puzzle layout is stable between renders. */
function createRandom(seed: number): () => number {
    let state = seed | 0
    return () => {
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        const tmp = result[i]
        result[i] = result[j]
        result[j] = tmp
    }
    return result
}

function parseColor(input: string): [number, number, number] | null {
    const value = input.trim()
    const hex = /^#([0-9a-f]{3,8})$/i.exec(value)
    if (hex) {
        let digits = hex[1]
        if (digits.length === 3 || digits.length === 4) {
            digits = digits
                .split("")
                .map((c) => c + c)
                .join("")
        }
        if (digits.length !== 6 && digits.length !== 8) return null
        return [
            parseInt(digits.slice(0, 2), 16),
            parseInt(digits.slice(2, 4), 16),
            parseInt(digits.slice(4, 6), 16),
        ]
    }
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value)
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null
}

/** Picks a readable text color for content placed on `color`. */
function readableOn(color: string, fallback: string): string {
    const rgb = parseColor(color)
    if (!rgb) return fallback
    const [r, g, b] = rgb
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return luminance > 0.6 ? "#111111" : "#FFFFFF"
}

/** Small non-cryptographic hash used to build the proof value. */
function hashString(input: string): string {
    let h1 = 0x811c9dc5
    let h2 = 0x9e3779b9
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i)
        h1 = Math.imul(h1 ^ c, 0x01000193)
        h2 = Math.imul(h2 ^ c, 0x85ebca6b)
        h2 ^= h2 >>> 13
    }
    return (
        (h1 >>> 0).toString(16).padStart(8, "0") +
        (h2 >>> 0).toString(16).padStart(8, "0")
    )
}

/** Value submitted with the form once the puzzle is solved (empty until then). */
function makeProof(
    type: PuzzleType,
    total: number,
    seed: number,
    order: string[],
    elapsed: number
): string {
    const hash = hashString(
        [type, total, seed, order.join(","), elapsed].join("|")
    )
    return `puzzle-v1.${hash}.${total}.${elapsed}`
}

function describePiece(type: PuzzleType, piece: PieceDef): string {
    if (type === "shape") return SHAPE_NAMES[piece.kind]
    if (type === "color") return piece.colorName
    return `Number ${piece.value}`
}

/* -------------------------------------------------------------------------- */
/*                              Puzzle generation                             */
/* -------------------------------------------------------------------------- */

function buildPuzzle(
    type: PuzzleType,
    count: number,
    randomize: boolean,
    seed: number
): PieceDef[] {
    const total = clamp(Math.round(count) || MIN_PIECES, MIN_PIECES, MAX_PIECES)
    const shuffled = randomize && seed !== 0
    const random = createRandom(seed || 1)
    const order = <T,>(list: readonly T[]): T[] =>
        shuffled ? shuffle(list, random) : [...list]

    const indexes = Array.from({ length: total }, (_, i) => i)
    const kinds = type === "shape" ? order(SHAPE_KINDS).slice(0, total) : []
    const swatches =
        type === "color" ? order(COLOR_SWATCHES).slice(0, total) : []
    const numbers = type === "number" ? order(NUMBER_POOL).slice(0, total) : []
    const targetOrder = order(indexes)
    const slots = shuffled ? shuffle(indexes, random) : [...indexes].reverse()

    return indexes.map((i) => {
        const slot = slots[i] ?? i
        const swatch = swatches[i]
        return {
            id: `piece-${i}`,
            kind:
                type === "shape"
                    ? (kinds[i] ?? "circle")
                    : type === "color"
                      ? "circle"
                      : "square",
            color: swatch?.value ?? "",
            colorName: swatch?.name ?? "",
            value: numbers[i] ?? 0,
            targetIndex: targetOrder[i] ?? i,
            slot,
            jitter: shuffled ? (random() - 0.5) * 0.16 : 0,
            fy: shuffled
                ? slot % 2 === 0
                    ? random() * 0.42
                    : 0.58 + random() * 0.42
                : 0.5,
        }
    })
}

/** Converts the board size into pixel positions for targets and starting pieces. */
function computeLayout(
    pieces: PieceDef[],
    board: Size,
    objectSize: number
): Layout {
    const count = Math.max(pieces.length, 1)
    const pad = clamp(Math.min(board.w, board.h) * 0.06, 10, 24)
    const columnWidth = Math.max(0, board.w - pad * 2) / count
    const size = Math.round(
        Math.max(
            MIN_OBJECT,
            Math.min(objectSize, columnWidth * 0.8, board.h * 0.24)
        )
    )
    const trayTop = Math.round(board.h * 0.42)
    const targetY = Math.max(trayTop / 2, pad + size / 2)
    const minX = pad + size / 2
    const maxX = Math.max(minX, board.w - pad - size / 2)
    const trayRange = Math.max(0, board.h - trayTop - pad * 2 - size)

    const targets: Point[] = Array.from({ length: count }, (_, i) => ({
        x: clamp(pad + (i + 0.5) * columnWidth, minX, maxX),
        y: targetY,
    }))

    const starts: Point[] = pieces.map((piece) => ({
        x: clamp(
            pad + (piece.slot + 0.5 + piece.jitter) * columnWidth,
            minX,
            maxX
        ),
        y: trayTop + pad + size / 2 + piece.fy * trayRange,
    }))

    return { size, pad, trayTop, targets, starts }
}

/* -------------------------------------------------------------------------- */
/*                               Small UI pieces                              */
/* -------------------------------------------------------------------------- */

function Hairline({
    color,
    opacity = 0.12,
}: {
    color: string
    opacity?: number
}) {
    return (
        <span
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                boxShadow: `inset 0 0 0 1px ${color}`,
                opacity,
                pointerEvents: "none",
            }}
        />
    )
}

function Tint({ color, opacity }: { color: string; opacity: number }) {
    return (
        <span
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: color,
                opacity,
                pointerEvents: "none",
                transition: "opacity 160ms ease",
            }}
        />
    )
}

function ShapeBody({ kind, style }: { kind: ShapeKind; style: CSSProperties }) {
    switch (kind) {
        case "circle":
            return <circle cx={50} cy={50} r={40} style={style} />
        case "square":
            return (
                <rect
                    x={14}
                    y={14}
                    width={72}
                    height={72}
                    rx={14}
                    style={style}
                />
            )
        case "triangle":
            return <polygon points="50,14 88,82 12,82" style={style} />
        case "star":
            return <polygon points={STAR_POINTS} style={style} />
        case "hexagon":
            return <polygon points={HEXAGON_POINTS} style={style} />
        case "diamond":
            return <polygon points="50,10 90,50 50,90 10,50" style={style} />
    }
}

interface GlyphProps {
    type: PuzzleType
    piece: PieceDef
    size: number
    role: GlyphRole
    theme: Theme
}

/** Draws a draggable piece or its dashed target outline. */
function Glyph({ type, piece, size, role, theme }: GlyphProps) {
    const isPiece = role === "piece"
    const isActive = role === "active"
    const accent = type === "color" ? piece.color : theme.primary

    const paint: CSSProperties = isPiece
        ? { fill: accent, fillOpacity: 1, stroke: accent, strokeWidth: 8 }
        : {
              fill: type === "color" ? piece.color : theme.primary,
              fillOpacity: isActive
                  ? type === "color"
                      ? 0.3
                      : 0.12
                  : type === "color"
                    ? 0.14
                    : 0,
              stroke: isActive ? theme.primary : theme.target,
              strokeWidth: 3,
              strokeDasharray: "6 6",
          }

    const style: CSSProperties = {
        ...paint,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        transition: "fill-opacity 160ms ease, stroke 160ms ease",
    }

    const numberFill = isPiece
        ? theme.onPrimary
        : isActive
          ? theme.primary
          : theme.target

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            aria-hidden="true"
            style={{ display: "block", overflow: "visible" }}
        >
            {type === "number" ? (
                <>
                    <rect
                        x={14}
                        y={14}
                        width={72}
                        height={72}
                        rx={24}
                        style={style}
                    />
                    <text
                        x={50}
                        y={51}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                            fontSize: 44,
                            fontWeight: 600,
                            fill: numberFill,
                            stroke: "none",
                            fontFamily: "inherit",
                            fontVariantNumeric: "tabular-nums",
                            transition: "fill 160ms ease",
                        }}
                    >
                        {piece.value}
                    </text>
                </>
            ) : (
                <ShapeBody kind={piece.kind} style={style} />
            )}
        </svg>
    )
}

/* -------------------------------------------------------------------------- */
/*                               Draggable piece                              */
/* -------------------------------------------------------------------------- */

interface PuzzlePieceProps {
    type: PuzzleType
    piece: PieceDef
    size: number
    start: Point
    targetCenters: Point[]
    targetLabels: string[]
    solvedTargets: boolean[]
    solved: boolean
    disabled: boolean
    speed: number
    reduceMotion: boolean
    boardRef: RefObject<HTMLDivElement>
    theme: Theme
    onHover: (targetIndex: number | null) => void
    onSolve: (id: string) => void
    onAnnounce: (message: string) => void
}

function PuzzlePiece({
    type,
    piece,
    size,
    start,
    targetCenters,
    targetLabels,
    solvedTargets,
    solved,
    disabled,
    speed,
    reduceMotion,
    boardRef,
    theme,
    onHover,
    onSolve,
    onAnnounce,
}: PuzzlePieceProps) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const [dragging, setDragging] = useState(false)
    const [armed, setArmed] = useState(false)
    const [focusVisible, setFocusVisible] = useState(false)

    const settled = useRef(false)
    const running = useRef<Stoppable[]>([])
    const lastHover = useRef<number | null>(null)
    const cursor = useRef(-1)

    const canDrag = !solved && !disabled
    const target = targetCenters[piece.targetIndex] ?? start
    const dx = target.x - start.x
    const dy = target.y - start.y
    const label = `${describePiece(type, piece)} piece`

    const stopMotion = useCallback(() => {
        running.current.forEach((a) => a.stop())
        running.current = []
    }, [])

    useEffect(() => stopMotion, [stopMotion])

    // Keep a locked piece glued to its target when the board is resized.
    useEffect(() => {
        if (settled.current) {
            x.set(dx)
            y.set(dy)
        }
    }, [dx, dy, x, y])

    const glide = useCallback(
        (toX: number, toY: number, snap: boolean, onDone?: () => void) => {
            stopMotion()
            if (reduceMotion) {
                x.set(toX)
                y.set(toY)
                onDone?.()
                return
            }
            const spring = snap
                ? {
                      type: "spring" as const,
                      stiffness: 380 * speed * speed,
                      damping: 24 * speed,
                  }
                : {
                      type: "spring" as const,
                      stiffness: 420 * speed * speed,
                      damping: 38 * speed,
                  }
            let pending = 2
            const finish = () => {
                pending -= 1
                if (pending === 0) onDone?.()
            }
            running.current = [
                animate(x, toX, { ...spring, onComplete: finish }),
                animate(y, toY, { ...spring, onComplete: finish }),
            ]
        },
        [reduceMotion, speed, stopMotion, x, y]
    )

    const hitTest = (): number | null => {
        const cx = start.x + x.get()
        const cy = start.y + y.get()
        let best: number | null = null
        let bestDistance = size * 0.6
        for (let i = 0; i < targetCenters.length; i++) {
            const distance = Math.hypot(
                targetCenters[i].x - cx,
                targetCenters[i].y - cy
            )
            if (distance <= bestDistance) {
                best = i
                bestDistance = distance
            }
        }
        return best
    }

    const snapIn = () => {
        settled.current = false
        onSolve(piece.id)
        onHover(null)
        glide(dx, dy, true, () => {
            settled.current = true
        })
    }

    const disarm = () => {
        setArmed(false)
        cursor.current = -1
        onHover(null)
    }

    const handleDragStart = () => {
        stopMotion()
        if (armed) disarm()
        setDragging(true)
    }

    const handleDrag = () => {
        const hit = hitTest()
        if (hit !== lastHover.current) {
            lastHover.current = hit
            onHover(hit !== null && !solvedTargets[hit] ? hit : null)
        }
    }

    const handleDragEnd = () => {
        setDragging(false)
        lastHover.current = null
        onHover(null)
        if (hitTest() === piece.targetIndex) {
            snapIn()
        } else {
            glide(0, 0, false)
        }
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!canDrag) return
        const open = targetCenters
            .map((_, i) => i)
            .filter((i) => !solvedTargets[i])
        const move = (direction: 1 | -1) => {
            if (open.length === 0) return
            const current = open.indexOf(cursor.current)
            const next = open[(current + direction + open.length) % open.length]
            cursor.current = next
            onHover(next)
            onAnnounce(
                `${targetLabels[next]}, target ${next + 1} of ${targetCenters.length}`
            )
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            if (!armed) {
                setArmed(true)
                cursor.current = open[0] ?? -1
                onHover(cursor.current >= 0 ? cursor.current : null)
                onAnnounce(
                    `${label} picked up. Use the arrow keys to choose a target, then press Enter to drop. Escape cancels.`
                )
            } else if (cursor.current === piece.targetIndex) {
                setArmed(false)
                cursor.current = -1
                snapIn()
            } else {
                onAnnounce("That target does not match. Try another one.")
            }
        } else if (
            armed &&
            (event.key === "ArrowRight" || event.key === "ArrowDown")
        ) {
            event.preventDefault()
            move(1)
        } else if (
            armed &&
            (event.key === "ArrowLeft" || event.key === "ArrowUp")
        ) {
            event.preventDefault()
            move(-1)
        } else if (armed && event.key === "Escape") {
            event.preventDefault()
            disarm()
            onAnnounce("Cancelled.")
        }
    }

    const showRing = focusVisible || armed

    return (
        <motion.div
            role="button"
            tabIndex={canDrag ? 0 : -1}
            aria-label={solved ? `${label}, placed` : label}
            aria-pressed={armed}
            aria-disabled={!canDrag}
            drag={canDrag}
            dragConstraints={boardRef}
            dragElastic={0}
            dragMomentum={false}
            whileDrag={{ scale: reduceMotion ? 1 : 1.08, filter: LIFT_FILTER }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onKeyDown={handleKeyDown}
            onFocus={(event) =>
                setFocusVisible(event.currentTarget.matches(":focus-visible"))
            }
            onBlur={() => {
                setFocusVisible(false)
                if (armed) {
                    disarm()
                    onAnnounce("")
                }
            }}
            style={{
                position: "absolute",
                left: start.x - size / 2,
                top: start.y - size / 2,
                width: size,
                height: size,
                x,
                y,
                zIndex: dragging || armed ? 20 : solved ? 1 : 10,
                touchAction: "none",
                cursor: canDrag ? (dragging ? "grabbing" : "grab") : "default",
                filter: REST_FILTER,
                borderRadius: 12,
                outline: showRing ? `2px solid ${theme.primary}` : "none",
                outlineOffset: 4,
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <motion.div
                initial={false}
                animate={
                    solved && !reduceMotion
                        ? { scale: [1, 1.12, 1] }
                        : { scale: armed ? 1.08 : 1 }
                }
                transition={
                    solved
                        ? {
                              duration: 0.42 / speed,
                              delay: 0.12 / speed,
                              ease: "easeOut",
                          }
                        : { duration: 0.16 / speed }
                }
                style={{ width: "100%", height: "100%" }}
            >
                <Glyph
                    type={type}
                    piece={piece}
                    size={size}
                    role="piece"
                    theme={theme}
                />
            </motion.div>
        </motion.div>
    )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export default function DragDropPuzzle({
    title = "Match the pieces",
    puzzleType = "shape",
    pieceCount = 3,
    instructionText = "Drag each piece into its matching outline.",
    successText = "Puzzle solved",
    showInstructions = true,
    showProgress = true,
    showReset = true,
    randomize = true,
    primaryColor = "#2B59FF",
    targetColor = "#B8BECC",
    backgroundColor = "#FFFFFF",
    textColor = "#14161B",
    font,
    objectSize = 60,
    radius = 20,
    gap = 16,
    animationSpeed = 1,
    requireSolved = true,
    fieldName = "puzzle",
    errorText = "Please solve the puzzle before submitting.",
    errorColor = "#E5484D",
    onSolved,
    onReset,
    onSolvedChange,
    style,
}: DragDropPuzzleProps) {
    const isStatic = useIsStaticRenderer()
    const reduceMotion = Boolean(useReducedMotion())
    const speed = clamp(animationSpeed || 1, 0.5, 2)

    const boardRef = useRef<HTMLDivElement>(null)
    const [board, setBoard] = useState<Size>(FALLBACK_BOARD)
    const [mounted, setMounted] = useState(false)
    const [run, setRun] = useState({ id: 0, seed: 0 })
    const [solvedIds, setSolvedIds] = useState<string[]>([])
    const [hoverTarget, setHoverTarget] = useState<number | null>(null)
    const [hint, setHint] = useState("")
    const [resetHover, setResetHover] = useState(false)
    const [resetFocus, setResetFocus] = useState(false)
    const [proof, setProof] = useState("")
    const [showError, setShowError] = useState(false)

    const proofInputRef = useRef<HTMLInputElement>(null)
    const proofRef = useRef("")
    const startedAt = useRef(0)

    const callbacks = useRef({ onSolved, onReset, onSolvedChange })
    useEffect(() => {
        callbacks.current = { onSolved, onReset, onSolvedChange }
    })

    // Randomness only runs on the client, after hydration.
    useEffect(() => {
        if (isStatic) return
        setMounted(true)
        const seed = randomize ? makeSeed() : 0
        setRun((current) =>
            current.seed === seed ? current : { id: current.id, seed }
        )
    }, [isStatic, randomize])

    // Track the board's own size so the puzzle follows the Framer frame.
    useEffect(() => {
        const el = boardRef.current
        if (isStatic || !el) return undefined
        const read = () => {
            const w = Math.round(el.clientWidth)
            const h = Math.round(el.clientHeight)
            if (w > 0 && h > 0) {
                setBoard((current) =>
                    current.w === w && current.h === h ? current : { w, h }
                )
            }
        }
        read()
        if (typeof ResizeObserver === "undefined") return undefined
        const observer = new ResizeObserver(read)
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    const pieces = useMemo(
        () => buildPuzzle(puzzleType, pieceCount, randomize, run.seed),
        [puzzleType, pieceCount, randomize, run.seed]
    )
    const total = pieces.length
    const puzzleKey = `${puzzleType}-${total}-${randomize ? 1 : 0}-${run.id}-${run.seed}`

    // A new puzzle always starts unsolved.
    useEffect(() => {
        setSolvedIds((current) => (current.length ? [] : current))
        setHoverTarget(null)
    }, [puzzleKey])

    const layout = useMemo(
        () => computeLayout(pieces, board, objectSize),
        [pieces, board, objectSize]
    )
    const targetPieces = useMemo(
        () => [...pieces].sort((a, b) => a.targetIndex - b.targetIndex),
        [pieces]
    )

    const solvedCount = solvedIds.length
    const isSolved = total > 0 && solvedCount === total
    const solvedTargets = targetPieces.map((piece) =>
        solvedIds.includes(piece.id)
    )
    const targetLabels = targetPieces.map(
        (piece) => `${describePiece(puzzleType, piece)} outline`
    )

    const onPrimary = readableOn(primaryColor, backgroundColor)
    const theme: Theme = {
        primary: primaryColor,
        target: targetColor,
        onPrimary,
    }

    const lastSolved = useRef(false)
    useEffect(() => {
        if (lastSolved.current === isSolved) return
        lastSolved.current = isSolved
        callbacks.current.onSolvedChange?.(isSolved)
        if (isSolved) callbacks.current.onSolved?.()
    }, [isSolved])

    // Each new puzzle restarts the clock used for the proof value.
    useEffect(() => {
        startedAt.current = Date.now()
    }, [puzzleKey])

    // Proof value: empty until solved, then a non-trivial token that is
    // submitted with the form. Also mirrored in a ref for the submit guard.
    useEffect(() => {
        const next = isSolved
            ? makeProof(
                  puzzleType,
                  total,
                  run.seed,
                  solvedIds,
                  Math.max(0, Date.now() - startedAt.current)
              )
            : ""
        proofRef.current = next
        setProof(next)
        if (next) setShowError(false)
    }, [isSolved, puzzleKey, puzzleType, total, run.seed, solvedIds])

    // Submit guard. Native `required` handles the normal case; this also
    // blocks submit if the field was removed / altered / bypassed in the DOM,
    // because it trusts React state (proofRef), never the DOM.
    useEffect(() => {
        const input = proofInputRef.current
        const form = input ? input.form : null
        if (!requireSolved || isStatic || !input || !form) return undefined

        const harden = () => {
            if (!input.required) input.required = true
            if (input.name !== fieldName) input.name = fieldName
            if (input.disabled) input.disabled = false
            if (input.type !== "text") input.type = "text"
        }

        const onSubmit = (event: Event) => {
            if (proofRef.current === "") {
                event.preventDefault()
                event.stopImmediatePropagation()
                harden()
                input.value = ""
                setShowError(true)
                return
            }
            // Solved: make sure the real value is what gets sent.
            harden()
            if (input.value !== proofRef.current) input.value = proofRef.current
        }

        // form.reset() clears the field; re-sync it with the real state.
        const onFormReset = () => {
            window.setTimeout(() => {
                input.value = proofRef.current
            }, 0)
        }

        const observer =
            typeof MutationObserver === "undefined"
                ? null
                : new MutationObserver(() => {
                      harden()
                  })
        observer?.observe(input, {
            attributes: true,
            attributeFilter: ["required", "name", "disabled", "type"],
        })

        form.addEventListener("submit", onSubmit, true)
        form.addEventListener("reset", onFormReset)
        return () => {
            form.removeEventListener("submit", onSubmit, true)
            form.removeEventListener("reset", onFormReset)
            observer?.disconnect()
        }
    }, [requireSolved, isStatic, fieldName])

    const handlePieceSolved = useCallback((id: string) => {
        setHint("")
        setSolvedIds((current) =>
            current.includes(id) ? current : [...current, id]
        )
    }, [])

    const handleReset = useCallback(() => {
        setSolvedIds([])
        setHoverTarget(null)
        setHint("")
        setShowError(false)
        setRun((current) => ({
            id: current.id + 1,
            seed: randomize ? makeSeed() : 0,
        }))
        callbacks.current.onReset?.()
    }, [randomize])

    const ready = isStatic || mounted
    const padding = Math.round(gap * 1.25)
    const boardRadius = Math.max(8, Math.round(radius * 0.7))
    const summary = `${solvedCount} of ${total} solved${isSolved ? `. ${successText}` : ""}`

    const rootStyle: CSSProperties = {
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: 14,
        lineHeight: 1.4,
        ...style,
        ...font,
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap,
        padding,
        overflow: "hidden",
        background: backgroundColor,
        color: textColor,
        borderRadius: radius,
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    const hasHeadingBlock = Boolean(title) || showInstructions

    return (
        <div
            role="group"
            aria-label={title || "Drag and drop puzzle"}
            data-puzzle-solved={isSolved ? "true" : "false"}
            style={rootStyle}
        >
            <Hairline color={textColor} opacity={0.12} />

            {(hasHeadingBlock || showProgress || showReset) && (
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: gap * 0.75,
                    }}
                >
                    {hasHeadingBlock && (
                        <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                            {title && (
                                <h3
                                    style={{
                                        margin: 0,
                                        font: "inherit",
                                        fontSize: "1.15em",
                                        fontWeight: 600,
                                        letterSpacing: "-0.01em",
                                        lineHeight: 1.25,
                                        color: "inherit",
                                    }}
                                >
                                    {title}
                                </h3>
                            )}
                            {showInstructions && instructionText && (
                                <p
                                    style={{
                                        margin: title ? "4px 0 0" : 0,
                                        fontSize: "0.93em",
                                        opacity: 0.6,
                                    }}
                                >
                                    {instructionText}
                                </p>
                            )}
                        </div>
                    )}

                    {(showProgress || showReset) && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {showProgress && (
                                <div
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        fontSize: "0.86em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <Hairline
                                        color={textColor}
                                        opacity={0.14}
                                    />
                                    <span
                                        aria-hidden="true"
                                        style={{ display: "flex", gap: 4 }}
                                    >
                                        {Array.from(
                                            { length: total },
                                            (_, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        background:
                                                            i < solvedCount
                                                                ? primaryColor
                                                                : "transparent",
                                                        boxShadow: `inset 0 0 0 1.5px ${
                                                            i < solvedCount
                                                                ? primaryColor
                                                                : targetColor
                                                        }`,
                                                        transition:
                                                            "background 200ms ease, box-shadow 200ms ease",
                                                    }}
                                                />
                                            )
                                        )}
                                    </span>
                                    <span
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {solvedCount} / {total} solved
                                    </span>
                                </div>
                            )}

                            {showReset && (
                                <motion.button
                                    type="button"
                                    aria-label="Reset puzzle"
                                    onClick={handleReset}
                                    onPointerEnter={() => setResetHover(true)}
                                    onPointerLeave={() => setResetHover(false)}
                                    onFocus={(event) =>
                                        setResetFocus(
                                            event.currentTarget.matches(
                                                ":focus-visible"
                                            )
                                        )
                                    }
                                    onBlur={() => setResetFocus(false)}
                                    whileTap={
                                        reduceMotion
                                            ? undefined
                                            : { scale: 0.96 }
                                    }
                                    style={{
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        margin: 0,
                                        padding: "6px 10px",
                                        border: "none",
                                        borderRadius: 999,
                                        background: "transparent",
                                        color: "inherit",
                                        font: "inherit",
                                        fontSize: "0.86em",
                                        cursor: "pointer",
                                        outline: resetFocus
                                            ? `2px solid ${primaryColor}`
                                            : "none",
                                        outlineOffset: 2,
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                >
                                    <Tint
                                        color={textColor}
                                        opacity={resetHover ? 0.06 : 0}
                                    />
                                    <Hairline
                                        color={textColor}
                                        opacity={0.18}
                                    />
                                    <svg
                                        width={13}
                                        height={13}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2.2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                        style={{ position: "relative" }}
                                    >
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                    </svg>
                                    <span style={{ position: "relative" }}>
                                        Reset
                                    </span>
                                </motion.button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Board */}
            <div
                ref={boardRef}
                style={{
                    position: "relative",
                    flex: "1 1 0",
                    minHeight: 160,
                    borderRadius: boardRadius,
                    overflow: "hidden",
                    touchAction: "manipulation",
                }}
            >
                <Tint color={textColor} opacity={0.035} />
                <Hairline color={textColor} opacity={0.1} />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: ready ? 1 : 0,
                        transition: "opacity 240ms ease",
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: layout.pad,
                            right: layout.pad,
                            top: layout.trayTop,
                            height: 1,
                            background: textColor,
                            opacity: 0.1,
                        }}
                    />

                    {targetPieces.map((piece, index) => {
                        const center = layout.targets[index]
                        if (!center) return null
                        const locked = solvedTargets[index]
                        const active = hoverTarget === index && !locked
                        const accent =
                            puzzleType === "color" ? piece.color : primaryColor
                        return (
                            <div
                                key={`${puzzleKey}-target-${piece.id}`}
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    left: center.x - layout.size / 2,
                                    top: center.y - layout.size / 2,
                                    width: layout.size,
                                    height: layout.size,
                                }}
                            >
                                <Glyph
                                    type={puzzleType}
                                    piece={piece}
                                    size={layout.size}
                                    role={active ? "active" : "target"}
                                    theme={theme}
                                />
                                {locked && !reduceMotion && (
                                    <motion.span
                                        initial={{ scale: 1, opacity: 0.45 }}
                                        animate={{ scale: 1.7, opacity: 0 }}
                                        transition={{
                                            duration: 0.6 / speed,
                                            delay: 0.1 / speed,
                                            ease: "easeOut",
                                        }}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "50%",
                                            border: `2px solid ${accent}`,
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}

                    {pieces.map((piece, index) => (
                        <PuzzlePiece
                            key={`${puzzleKey}-${piece.id}`}
                            type={puzzleType}
                            piece={piece}
                            size={layout.size}
                            start={layout.starts[index]}
                            targetCenters={layout.targets}
                            targetLabels={targetLabels}
                            solvedTargets={solvedTargets}
                            solved={solvedIds.includes(piece.id)}
                            disabled={isStatic}
                            speed={speed}
                            reduceMotion={reduceMotion}
                            boardRef={boardRef}
                            theme={theme}
                            onHover={setHoverTarget}
                            onSolve={handlePieceSolved}
                            onAnnounce={setHint}
                        />
                    ))}

                    {isSolved && (
                        <motion.div
                            initial={
                                reduceMotion ? false : { opacity: 0, y: 8 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.35 / speed,
                                delay: reduceMotion ? 0 : 0.25 / speed,
                                ease: "easeOut",
                            }}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: layout.trayTop,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                padding: layout.pad,
                                textAlign: "center",
                                fontWeight: 600,
                                pointerEvents: "none",
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    background: primaryColor,
                                    color: onPrimary,
                                    flex: "none",
                                }}
                            >
                                <svg
                                    width={12}
                                    height={12}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </span>
                            <span>{successText}</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {requireSolved && showError && !isSolved && (
                <div
                    role="alert"
                    style={{
                        position: "relative",
                        color: errorColor,
                        fontSize: "0.86em",
                        fontWeight: 500,
                    }}
                >
                    {errorText}
                </div>
            )}

            {requireSolved && (
                <input
                    ref={proofInputRef}
                    type="text"
                    name={fieldName}
                    value={proof}
                    required
                    onChange={() => {}}
                    onInvalid={() => setShowError(true)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-label="Puzzle verification"
                    aria-invalid={!isSolved}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    data-bwignore="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        bottom: 0,
                        width: 1,
                        height: 1,
                        margin: 0,
                        padding: 0,
                        border: 0,
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                />
            )}

            <div role="status" aria-live="polite" style={SR_ONLY}>
                {hint || summary}
            </div>
        </div>
    )
}

DragDropPuzzle.displayName = "Drag & Drop Puzzle"

/* -------------------------------------------------------------------------- */
/*                              Property controls                             */
/* -------------------------------------------------------------------------- */

addPropertyControls(DragDropPuzzle, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Match the pieces",
    },
    puzzleType: {
        type: ControlType.Enum,
        title: "Puzzle Type",
        options: ["shape", "color", "number"],
        optionTitles: ["Shape Match", "Color Match", "Number Match"],
        defaultValue: "shape",
    },
    pieceCount: {
        type: ControlType.Number,
        title: "Pieces",
        min: MIN_PIECES,
        max: MAX_PIECES,
        step: 1,
        displayStepper: true,
        defaultValue: 3,
    },
    randomize: {
        type: ControlType.Boolean,
        title: "Randomize",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    showInstructions: {
        type: ControlType.Boolean,
        title: "Instructions",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    instructionText: {
        type: ControlType.String,
        title: "Instruction",
        defaultValue: "Drag each piece into its matching outline.",
        displayTextArea: true,
        hidden: (props: DragDropPuzzleProps) => !props.showInstructions,
    },
    successText: {
        type: ControlType.String,
        title: "Success",
        defaultValue: "Puzzle solved",
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showReset: {
        type: ControlType.Boolean,
        title: "Reset",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#2B59FF",
    },
    targetColor: {
        type: ControlType.Color,
        title: "Target",
        defaultValue: "#B8BECC",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#14161B",
    },
    font: {
        // @ts-ignore Framer font control typing
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "14px",
    },
    objectSize: {
        type: ControlType.Number,
        title: "Object Size",
        min: 32,
        max: 96,
        step: 2,
        unit: "px",
        defaultValue: 60,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 20,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 8,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        min: 0.5,
        max: 2,
        step: 0.1,
        unit: "x",
        defaultValue: 1,
    },
    requireSolved: {
        type: ControlType.Boolean,
        title: "Validate",
        enabledTitle: "Required",
        disabledTitle: "Off",
        defaultValue: true,
    },
    fieldName: {
        type: ControlType.String,
        title: "Field Name",
        defaultValue: "puzzle",
        hidden: (props: DragDropPuzzleProps) => !props.requireSolved,
    },
    errorText: {
        type: ControlType.String,
        title: "Error",
        defaultValue: "Please solve the puzzle before submitting.",
        hidden: (props: DragDropPuzzleProps) => !props.requireSolved,
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error Color",
        defaultValue: "#E5484D",
        hidden: (props: DragDropPuzzleProps) => !props.requireSolved,
    },
    onSolved: { type: ControlType.EventHandler },
    onReset: { type: ControlType.EventHandler },
})
