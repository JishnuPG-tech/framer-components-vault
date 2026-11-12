/**
 * Waffle Chart — Framer code component.
 * Ported from Arc (https://uiarc.dev/components/waffle-chart) by Elia Kuratli, MIT License.
 *
 * A unit chart: every cell is one share of the whole, so parts of a total read as countable squares.
 * Cells pop in column by column from the bottom-left on first view; when data changes, cells travel between categories instead of repainting.
 * Hover or arrow keys read a cell; the legend pins a category and its shares roll to new values.
 */
import * as React from "react"
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react"
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react"
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
    useInView,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion"

/* ------------------------------------------------------------------ Motion tokens (inlined from Arc) */

const motionTokens = {
    duration: {
        instant: 0.12,
        fast: 0.16,
        exit: 0.18,
        standard: 0.24,
        considered: 0.48,
    },
    ease: {
        enter: [0.16, 1, 0.3, 1],
        exit: [0.7, 0, 0.84, 0],
        standard: [0.22, 1, 0.36, 1],
        inOut: [0.65, 0, 0.35, 1],
    },
    spring: {
        snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
        smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
        morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
    },
} as const

/** Layout effects on the client, plain effects during Framer's server render (no SSR warning). */
const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/* ------------------------------------------------------------------ Styles */

const P = "arc-waffle-chart"
const CSS = `
.arc-waffle-chart-root{color-scheme:light;--background:oklch(100% 0 0);--surface:oklch(100% 0 0);--surface-raised:oklch(100% 0 0);--surface-muted:oklch(97.8% 0 0);--foreground:oklch(15% 0 0);--text-secondary:oklch(46% 0 0);--text-muted:oklch(59% 0 0);--border:oklch(93.5% 0 0);--border-subtle:oklch(96.5% 0 0);--border-strong:oklch(82% 0 0);--accent:oklch(33% 0 0);--accent-strong:oklch(24% 0 0);--success:oklch(49% .19 150);--warning:oklch(58% .18 75);--danger:oklch(54% .21 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .035);--shadow-raised:0 6px 18px oklch(0% 0 0 / .065), 0 1px 3px oklch(0% 0 0 / .035);--shadow-floating:0 20px 48px oklch(0% 0 0 / .105), 0 3px 10px oklch(0% 0 0 / .045);--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--font-display:inherit;--font-body:inherit;--text-xs:.75rem;--text-sm:.875rem;--text-base:1rem;--text-lg:1.125rem;--text-xl:1.375rem;--text-2xl:1.75rem;--text-3xl:2.25rem;--text-4xl:3.25rem;--tracking-display:-.03em;--tracking-body:-.01em;--leading-display:1.1;--leading-body:1.4;--ease-enter:cubic-bezier(.16,1,.3,1);--ease-standard:cubic-bezier(.22,1,.36,1);--ease-exit:cubic-bezier(.7,0,.84,0);--ease-in-out:cubic-bezier(.65,0,.35,1);--duration-instant:120ms;--duration-fast:160ms;--duration-standard:240ms;--duration-considered:480ms;--duration-spring:580ms;}
.arc-waffle-chart-root[data-theme="dark"]{color-scheme:dark;--background:oklch(19% 0 0);--surface:oklch(21.5% 0 0);--surface-raised:oklch(24% 0 0);--surface-muted:oklch(26% 0 0);--foreground:oklch(96% 0 0);--text-secondary:oklch(77% 0 0);--text-muted:oklch(64% 0 0);--border:oklch(29% 0 0);--border-subtle:oklch(25% 0 0);--border-strong:oklch(40% 0 0);--accent:oklch(80% 0 0);--accent-strong:oklch(91% 0 0);--success:oklch(78% .18 150);--warning:oklch(83% .17 80);--danger:oklch(76% .2 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .18);--shadow-raised:0 8px 22px oklch(0% 0 0 / .22);--shadow-floating:0 22px 55px oklch(0% 0 0 / .34);}
.arc-waffle-chart-root, .arc-waffle-chart-root *, .arc-waffle-chart-root *::before, .arc-waffle-chart-root *::after{box-sizing:border-box}
.arc-waffle-chart-root :focus:not(:focus-visible){outline:none}
.arc-waffle-chart-root :focus-visible{outline:2px solid color-mix(in oklab, var(--accent-strong) 72%, transparent);outline-offset:2px}
.${P}-root { display: flex; width: 100%; align-items: center; justify-content: center; }
.${P}-figure { position: relative; width: 100%; min-width: 0; margin: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); container-type: inline-size; }
.${P}-body { display: grid; min-width: 0; grid-template-columns: minmax(0, 1fr); align-items: center; gap: var(--space-6); }
@container (min-width: 420px) { .${P}-figure[data-legend] .${P}-body { grid-template-columns: minmax(0, 232px) minmax(0, 1fr); gap: var(--space-6); } }
.${P}-board { min-width: 0; }
.${P}-grid { position: relative; width: 100%; max-width: var(--waffle-max, 300px); margin-inline: auto; outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: default; }
/* Each cell is one unit. Its colour changes mid-flight with the same stagger as its travel. */
.${P}-cell { --inner: 0 0 0 0 transparent; --outer: 0 0 0 0 transparent; position: absolute; top: 0; left: 0; border-radius: var(--waffle-radius, 22%); background: var(--cell); box-shadow: var(--inner), var(--outer); will-change: transform; transition: background-color var(--duration-considered) var(--ease-standard) var(--delay, 0s), border-radius var(--duration-considered) var(--ease-standard) var(--delay, 0s), box-shadow var(--duration-considered) var(--ease-standard) var(--delay, 0s), opacity var(--duration-fast) var(--ease-standard); }
.${P}-grid[data-active] .${P}-cell:not([data-on]) { opacity: .26 !important; transition: background-color var(--duration-considered) var(--ease-standard) var(--delay, 0s), border-radius var(--duration-considered) var(--ease-standard) var(--delay, 0s), opacity var(--duration-standard) var(--ease-standard); }
.${P}-cell[data-cursor] { --outer: 0 0 0 2px var(--surface), 0 0 0 3.5px color-mix(in oklab, var(--foreground) 55%, transparent); }
.${P}-grid:focus-visible { outline: 2px solid color-mix(in oklab, var(--accent-strong) 72%, transparent); outline-offset: 4px; border-radius: 6px; }
/* Shape is the colour-free second channel: a cell morphs between these as it changes category. */
.${P}-cell[data-shape="round"], .${P}-swatch[data-shape="round"], .${P}-tipSwatch[data-shape="round"] { border-radius: 50%; }
.${P}-cell[data-shape="framed"] { --inner: inset 0 0 0 2.5px var(--cell), inset 0 0 0 3.25px var(--surface); }
.${P}-swatch[data-shape="framed"], .${P}-tipSwatch[data-shape="framed"] { box-shadow: inset 0 0 0 2px var(--cell), inset 0 0 0 3px var(--surface); }
.${P}-tooltip { position: absolute; top: 0; left: 0; z-index: 2; display: grid; min-width: 150px; max-width: min(240px, 100%); gap: 2px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-raised); box-shadow: var(--shadow-floating); opacity: 0; pointer-events: none; scale: .96; transition: opacity var(--duration-fast) var(--ease-standard), scale var(--duration-fast) var(--ease-standard); }
.${P}-tooltip[data-shown] { opacity: 1; scale: 1; }
.${P}-tipRow { display: flex; min-width: 0; align-items: center; gap: 8px; margin: 0; font-size: var(--text-sm); line-height: 1.3; }
.${P}-tipSwatch { width: 10px; height: 10px; flex: none; border-radius: 3px; background: var(--cell); transition: background-color var(--duration-fast) var(--ease-standard); }
.${P}-tipName { min-width: 0; flex: 1; overflow: hidden; color: var(--text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.${P}-tipValue { flex: none; margin-left: 8px; font-weight: 500; font-variant-numeric: tabular-nums; }
.${P}-tipMeta { margin: 0 0 0 18px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; white-space: nowrap; }
.${P}-message { display: grid; min-height: 160px; place-items: center; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
/* The legend doubles as the reading: each share rolls to its new value. */
.${P}-legend { display: grid; min-width: 0; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 2px var(--space-2); margin: 0; padding: 0; list-style: none; }
@container (min-width: 420px) { .${P}-figure[data-legend] .${P}-legend { grid-template-columns: minmax(0, 1fr); } }
@container (max-width: 419px) { .${P}-legend { grid-template-columns: minmax(0, 1fr); margin-inline: max(-10px, calc((100% - 320px) / 2)); } }
.${P}-item { display: grid; width: 100%; min-height: 36px; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 4px 10px; border: 0; border-radius: 12px; background: transparent; color: var(--text-secondary); cursor: pointer; font: inherit; font-size: var(--text-sm); line-height: var(--leading-body); text-align: left; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.${P}-item:active { transform: scale(.98); }
.${P}-item[data-on] { color: var(--foreground); background: color-mix(in oklab, var(--foreground) 5%, transparent); }
.${P}-item[data-dim] { opacity: .5; }
.${P}-item[aria-pressed="true"] { color: var(--foreground); }
@media (hover: hover) and (pointer: fine) { .${P}-item:hover { color: var(--foreground); } }
.${P}-swatch { width: 10px; height: 10px; border-radius: 3px; background: var(--cell); }
.${P}-itemLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.${P}-itemShare { color: var(--foreground); font-size: var(--text-base); font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; min-width: 3.2em; }
.${P}-srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .${P}-cell, .${P}-grid[data-active] .${P}-cell:not([data-on]), .${P}-tooltip, .${P}-tipSwatch, .${P}-item { transition: none; } }
`
const c = (name: string) => `${P}-${name}`

/* ------------------------------------------------------------------ Types and helpers */

interface WaffleCategory {
    key: string
    label: string
    value: number
    color?: string
}
type Cell = { id: number; key: string | null; slot: number }
type Pointer = { key: string; slot: number } | null

const { spring } = motionTokens
const GAP = 3
/** accentKey takes the first series and the next three categories the supporting series. Anything past that falls back to neutral steps that alternate in lightness. */
const SHADES = [40, 20, 30, 14]
/** A second, colour-free channel: neutral categories cycle through square, round, and framed cells. */
const SHAPES = ["square", "round", "framed"] as const
const clamp = (value: number, low: number, high: number) =>
    Math.min(high, Math.max(low, value))
const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

const subscribeNothing = () => () => {}
function useReducedMotionSafe() {
    const hydrated = useSyncExternalStore(
        subscribeNothing,
        () => true,
        () => false
    )
    return !!useReducedMotion() && hydrated
}

/** Whole cells per category by largest remainder, so the counts always add up to the grid. */
function allocate(
    data: WaffleCategory[],
    total: number,
    cells: number
): number[] {
    if (total <= 0) return data.map(() => 0)
    const exact = data.map((item) => (Math.max(0, item.value) / total) * cells)
    const counts = exact.map(Math.floor)
    let left = cells - counts.reduce((sum, count) => sum + count, 0)
    const order = exact
        .map((value, index) => ({ index, rest: value - Math.floor(value) }))
        .sort((a, b) => b.rest - a.rest)
    for (let k = 0; left > 0 && k < order.length; k++, left--)
        counts[order[k]!.index]!++
    return counts
}

/** Hands cells to categories while moving as few as possible: each category keeps the cells it already had, surplus cells join the categories that grew. */
function reassign(
    previous: Cell[],
    data: WaffleCategory[],
    counts: number[]
): Cell[] {
    const bySlot = [...previous].sort((a, b) => a.slot - b.slot)
    const kept = new Map<string, Cell[]>()
    const pool: Cell[] = []
    const want = new Map(data.map((item, index) => [item.key, counts[index]]))
    for (const cell of bySlot) {
        const list = cell.key !== null ? (kept.get(cell.key) ?? []) : []
        if (cell.key !== null && list.length < (want.get(cell.key) ?? 0)) {
            list.push(cell)
            kept.set(cell.key, list)
        } else pool.push(cell)
    }
    const next: Cell[] = []
    let slot = 0
    data.forEach((item, index) => {
        const own = kept.get(item.key) ?? []
        while (own.length < counts[index]! && pool.length)
            own.push(pool.shift()!)
        own.sort((a, b) => a.slot - b.slot).forEach((cell) =>
            next.push({ id: cell.id, key: item.key, slot: slot++ })
        )
    })
    pool.forEach((cell) => next.push({ id: cell.id, key: null, slot: slot++ }))
    return next.sort((a, b) => a.id - b.id)
}

/** A share that rolls to its new value on a spring and holds its width with tabular figures. */
function Rolling({
    value,
    decimals,
    reduced,
}: {
    value: number
    decimals: number
    reduced: boolean
}) {
    const shown = useMotionValue(value)
    const text = useTransform(
        shown,
        (current) => `${current.toFixed(decimals)}%`
    )
    useEffect(() => {
        if (reduced) {
            shown.jump(value)
            return
        }
        const controls = animate(shown, value, spring.smooth as any)
        return () => controls.stop()
    }, [reduced, shown, value])
    return <motion.span>{text}</motion.span>
}

/* ------------------------------------------------------------------ Waffle chart (faithful port) */

function Waffle({
    data,
    label,
    unit = "",
    rows = 10,
    columns = 10,
    accentKey,
    onActiveChange,
    legend = true,
    decimals = 0,
    emptyLabel = "No data",
    revealNow = false,
}: {
    data: WaffleCategory[]
    label: string
    unit?: string
    rows?: number
    columns?: number
    accentKey?: string | null
    onActiveChange?: (key: string | null) => void
    legend?: boolean
    decimals?: number
    emptyLabel?: string
    revealNow?: boolean
}) {
    const reduced = useReducedMotionSafe()
    const figure = useRef<HTMLElement>(null)
    const grid = useRef<HTMLDivElement>(null)
    const tip = useRef<HTMLDivElement>(null)
    const seenView = useInView(figure, { once: true, amount: 0.35 })
    // The Framer canvas never scrolls, so the chart shows itself there without waiting to be seen.
    const inView = seenView || revealNow
    const count = Math.max(1, rows * columns)
    const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0)
    const empty = !data.length || total <= 0
    const accent = accentKey === undefined ? (data[0]?.key ?? null) : accentKey

    // Cells are persistent objects; each data change reassigns them so they travel instead of repainting.
    const signature = `${count}|${data.map((item) => `${item.key}:${item.value}`).join(",")}`
    const counts = useMemo(() => allocate(data, total, count), [signature]) // eslint-disable-line react-hooks/exhaustive-deps
    const [layout, setLayout] = useState(() => ({
        cells: reassign(
            Array.from({ length: count }, (_, id) => ({
                id,
                key: null,
                slot: id,
            })),
            data,
            counts
        ),
        moved: new Set<number>(),
        version: 0,
    }))
    const [seen, setSeen] = useState(signature)
    if (seen !== signature) {
        setSeen(signature)
        const base = Array.from({ length: count }, (_, id) => {
            const prev = layout.cells[id]
            return prev && prev.slot < count
                ? prev
                : { id, key: null, slot: id }
        })
        // A resized grid can leave two cells on one slot; renumber slots so every cell has its own.
        const order = [...base].sort((a, b) => a.slot - b.slot || a.id - b.id)
        order.forEach((cell, slot) => {
            base[cell.id] = { ...cell, slot }
        })
        const before = layout.cells
        const next = reassign(base, data, counts)
        setLayout({
            cells: next,
            moved: new Set(
                next
                    .filter(
                        (cell) =>
                            !before[cell.id] ||
                            before[cell.id]!.slot !== cell.slot ||
                            before[cell.id]!.key !== cell.key
                    )
                    .map((cell) => cell.id)
            ),
            version: layout.version + 1,
        })
    }
    const { cells, moved, version } = layout

    const [pinned, setOwnActive] = useState<string | null>(null)
    const setPinned = (key: string | null) => {
        setOwnActive(key)
        onActiveChange?.(key)
    }
    const [pointer, setPointer] = useState<Pointer>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const focusKey = pointer?.key ?? preview ?? pinned
    const active =
        focusKey && data.some((item) => item.key === focusKey) ? focusKey : null

    const [side, setSide] = useState(0)
    useIsoLayoutEffect(() => {
        const node = grid.current
        if (!node) return
        const read = () => setSide(node.clientWidth)
        read()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(read)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])
    const size = side ? Math.max(0, (side - GAP * (columns - 1)) / columns) : 0
    const height = size ? size * rows + GAP * (rows - 1) : 0
    // Column by column from the bottom-left corner, like a glass filling up.
    const place = (slot: number) => ({
        x: Math.floor(slot / rows) * (size + GAP),
        y: (rows - 1 - (slot % rows)) * (size + GAP),
    })

    const colorOf = (key: string | null) => {
        if (key === null) return "transparent"
        const item = data.find((entry) => entry.key === key)
        if (!item) return "transparent"
        if (item.color) return item.color
        if (key === accent) return "var(--series-1)"
        const rank = data
            .filter((entry) => entry.key !== accent)
            .findIndex((entry) => entry.key === key)
        return rank < 3
            ? `var(--series-${rank + 2})`
            : `color-mix(in oklab, var(--foreground) ${SHADES[(rank - 3) % SHADES.length]}%, var(--surface))`
    }
    const shapeOf = (key: string | null) => {
        if (key === null || key === accent) return "square"
        const rank = data
            .filter((entry) => entry.key !== accent)
            .findIndex((entry) => entry.key === key)
        return rank < 0 ? "square" : SHAPES[rank % SHAPES.length]
    }

    // The tooltip glides between cells on its own spring and stays inside the figure.
    const tipX = useMotionValue(0),
        tipY = useMotionValue(0)
    const follow = { stiffness: 520, damping: 44, restDelta: 0.01 }
    const glideX = useSpring(tipX, follow),
        glideY = useSpring(tipY, follow)
    const wasShown = useRef(false)
    useIsoLayoutEffect(() => {
        const bubble = tip.current,
            host = figure.current,
            board = grid.current
        if (!pointer || !bubble || !host || !board || !size) {
            wasShown.current = false
            return
        }
        const hostBox = host.getBoundingClientRect(),
            boardBox = board.getBoundingClientRect()
        // Framer may scale the canvas; convert screen pixels back to layout pixels.
        const scale = host.offsetWidth ? hostBox.width / host.offsetWidth : 1
        const { x, y } = place(pointer.slot)
        const cx = (boardBox.left - hostBox.left) / scale + x + size / 2,
            cy = (boardBox.top - hostBox.top) / scale + y
        const tw = bubble.offsetWidth,
            th = bubble.offsetHeight
        let top = cy - th - 10
        if (top < 0) top = cy + size + 10
        const left = clamp(cx - tw / 2, 0, Math.max(0, host.offsetWidth - tw))
        tipX.set(left)
        tipY.set(clamp(top, 0, Math.max(0, host.offsetHeight - th)))
        if (!wasShown.current || reduced) {
            glideX.jump(tipX.get())
            glideY.jump(tipY.get())
        }
        wasShown.current = true
    })

    const slotAt = (clientX: number, clientY: number) => {
        const node = grid.current
        const box = node?.getBoundingClientRect()
        if (!node || !box || !size) return null
        const scale = node.offsetWidth ? box.width / node.offsetWidth : 1
        const col = clamp(
            Math.floor((clientX - box.left) / scale / (size + GAP)),
            0,
            columns - 1
        )
        const row = clamp(
            Math.floor((clientY - box.top) / scale / (size + GAP)),
            0,
            rows - 1
        )
        return col * rows + (rows - 1 - row)
    }
    const pointAt = (slot: number | null): Pointer => {
        if (slot === null) return null
        const cell = cells.find((item) => item.slot === slot)
        return cell?.key ? { key: cell.key, slot } : null
    }
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" || event.buttons)
            setPointer(pointAt(slotAt(event.clientX, event.clientY)))
    }
    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse")
            event.currentTarget.setPointerCapture?.(event.pointerId)
        setPointer(pointAt(slotAt(event.clientX, event.clientY)))
    }

    // Arrows walk the grid cell by cell; Page keys jump between categories.
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (empty) return
        if (event.key === "Escape" && pointer) {
            event.preventDefault()
            setPointer(null)
            return
        }
        const filled = cells.filter((cell) => cell.key !== null).length
        const at = pointer?.slot ?? 0
        const col = Math.floor(at / rows),
            row = at % rows
        const blocks = counts
            .map((n, index) => ({
                start: counts
                    .slice(0, index)
                    .reduce((sum, value) => sum + value, 0),
                size: n,
            }))
            .filter((block) => block.size > 0)
        const block = Math.max(
            0,
            blocks.findIndex(
                (item) => at >= item.start && at < item.start + item.size
            )
        )
        const moves: Record<string, () => number> = {
            ArrowUp: () => col * rows + Math.min(rows - 1, row + 1),
            ArrowDown: () => col * rows + Math.max(0, row - 1),
            ArrowRight: () => Math.min(columns - 1, col + 1) * rows + row,
            ArrowLeft: () => Math.max(0, col - 1) * rows + row,
            PageDown: () =>
                blocks[Math.min(blocks.length - 1, block + 1)]!.start,
            PageUp: () =>
                at > blocks[block]!.start
                    ? blocks[block]!.start
                    : blocks[Math.max(0, block - 1)]!.start,
            Home: () => 0,
            End: () => filled - 1,
        }
        const move = moves[event.key]
        if (!move) return
        event.preventDefault()
        setPointer(
            pointAt(clamp(pointer ? move() : 0, 0, Math.max(0, filled - 1)))
        )
    }

    const format = (value: number) =>
        `${grouped.format(value)}${unit ? ` ${unit}` : ""}`
    const share = (item: WaffleCategory) =>
        total > 0 ? (Math.max(0, item.value) / total) * 100 : 0
    const reading = pointer
        ? (data.find((item) => item.key === pointer.key) ?? null)
        : null
    const announce = reading
        ? `${reading.label}, ${share(reading).toFixed(decimals)}%, ${format(reading.value)}`
        : ""
    const summary = empty
        ? `${label}. ${emptyLabel}.`
        : `${label}. ${data.map((item) => `${item.label} ${share(item).toFixed(decimals)}%`).join(", ")}.`
    const shownX = reduced ? tipX : glideX,
        shownY = reduced ? tipY : glideY
    const settle: any = reduced ? { duration: 0 } : spring.morph

    return (
        <figure
            ref={figure}
            className={c("figure")}
            aria-label={label}
            data-legend={legend || undefined}
        >
            <div className={c("body")}>
                <div className={c("board")}>
                    <div
                        ref={grid}
                        className={c("grid")}
                        style={{
                            height: height || undefined,
                            aspectRatio: height
                                ? undefined
                                : `${columns} / ${rows}`,
                        }}
                        data-active={active ? true : undefined}
                        role="group"
                        tabIndex={empty ? -1 : 0}
                        aria-roledescription="waffle chart"
                        aria-label={`${label}. ${count} cells. Use arrow keys to move between cells, Page Up and Page Down to jump between categories.`}
                        onPointerMove={onPointerMove}
                        onPointerDown={onPointerDown}
                        onPointerUp={(event) => {
                            if (event.pointerType !== "mouse") setPointer(null)
                        }}
                        onPointerCancel={() => setPointer(null)}
                        onPointerLeave={(event) => {
                            if (event.pointerType === "mouse") setPointer(null)
                        }}
                        onKeyDown={onKeyDown}
                        onBlur={() => setPointer(null)}
                        onFocus={(event) => {
                            if (
                                event.currentTarget.matches(":focus-visible") &&
                                !empty
                            )
                                setPointer((current) => current ?? pointAt(0))
                        }}
                    >
                        {size > 0 &&
                            cells.map((cell) => {
                                const { x, y } = place(cell.slot)
                                const travel = moved.has(cell.id) && !reduced
                                const delay = reduced
                                    ? 0
                                    : (cell.slot / count) * 0.32
                                const on =
                                    cell.key !== null && cell.key === active
                                const shown = inView || reduced
                                // A travelling cell dips while it flies, so the flow reads as cells lifting out of one block and landing in another.
                                const dip = travel
                                    ? [1, 0.62 + (version % 2) * 0.001, 1]
                                    : 1
                                return (
                                    <motion.span
                                        key={cell.id}
                                        className={c("cell")}
                                        aria-hidden="true"
                                        data-on={on || undefined}
                                        data-cursor={
                                            pointer?.slot === cell.slot ||
                                            undefined
                                        }
                                        data-empty={
                                            cell.key === null || undefined
                                        }
                                        data-shape={shapeOf(cell.key)}
                                        style={
                                            {
                                                width: size,
                                                height: size,
                                                "--cell": colorOf(cell.key),
                                                "--delay": `${delay}s`,
                                            } as any
                                        }
                                        initial={
                                            reduced || revealNow
                                                ? false
                                                : {
                                                      x,
                                                      y,
                                                      scale: 0.4,
                                                      opacity: 0,
                                                  }
                                        }
                                        animate={
                                            shown
                                                ? {
                                                      x,
                                                      y,
                                                      scale: dip,
                                                      opacity:
                                                          cell.key === null
                                                              ? 0
                                                              : 1,
                                                  }
                                                : {
                                                      x,
                                                      y,
                                                      scale: 0.4,
                                                      opacity: 0,
                                                  }
                                        }
                                        transition={
                                            reduced || revealNow
                                                ? { duration: 0 }
                                                : ({
                                                      x: { ...settle, delay },
                                                      y: { ...settle, delay },
                                                      scale: travel
                                                          ? {
                                                                duration: 0.62,
                                                                times: [
                                                                    0, 0.42, 1,
                                                                ],
                                                                ease: [
                                                                    ...motionTokens
                                                                        .ease
                                                                        .inOut,
                                                                ],
                                                                delay,
                                                            }
                                                          : {
                                                                ...spring.snappy,
                                                                delay:
                                                                    delay * 0.6,
                                                            },
                                                      opacity: {
                                                          duration:
                                                              motionTokens
                                                                  .duration
                                                                  .standard,
                                                          ease: [
                                                              ...motionTokens
                                                                  .ease
                                                                  .standard,
                                                          ],
                                                          delay: delay * 0.6,
                                                      },
                                                  } as any)
                                        }
                                    />
                                )
                            })}
                    </div>
                    {!empty && (
                        <motion.div
                            ref={tip}
                            className={c("tooltip")}
                            data-shown={pointer ? true : undefined}
                            style={{ x: shownX, y: shownY }}
                            aria-hidden="true"
                        >
                            <p className={c("tipRow")}>
                                <span
                                    className={c("tipSwatch")}
                                    data-shape={shapeOf(reading?.key ?? null)}
                                    style={
                                        {
                                            "--cell": colorOf(
                                                reading?.key ?? null
                                            ),
                                        } as CSSProperties
                                    }
                                />
                                <span className={c("tipName")}>
                                    {reading?.label ?? ""}
                                </span>
                                <span className={c("tipValue")}>
                                    {reading
                                        ? `${share(reading).toFixed(decimals)}%`
                                        : ""}
                                </span>
                            </p>
                            <p className={c("tipMeta")}>
                                {reading ? format(reading.value) : ""}
                            </p>
                        </motion.div>
                    )}
                    {empty && <p className={c("message")}>{emptyLabel}</p>}
                </div>
                {legend && !empty && (
                    <ul
                        className={c("legend")}
                        aria-label={`${label} categories`}
                        onPointerLeave={() => setPreview(null)}
                    >
                        {data.map((item) => (
                            <li key={item.key}>
                                <button
                                    type="button"
                                    className={c("item")}
                                    aria-pressed={pinned === item.key}
                                    data-on={active === item.key || undefined}
                                    data-dim={
                                        (active !== null &&
                                            active !== item.key) ||
                                        undefined
                                    }
                                    onClick={() =>
                                        setPinned(
                                            pinned === item.key
                                                ? null
                                                : item.key
                                        )
                                    }
                                    onPointerEnter={(event) => {
                                        if (event.pointerType === "mouse")
                                            setPreview(item.key)
                                    }}
                                    onFocus={(event) => {
                                        if (
                                            event.currentTarget.matches(
                                                ":focus-visible"
                                            )
                                        )
                                            setPreview(item.key)
                                    }}
                                    onBlur={() => setPreview(null)}
                                >
                                    <span
                                        className={c("swatch")}
                                        data-shape={shapeOf(item.key)}
                                        style={
                                            {
                                                "--cell": colorOf(item.key),
                                            } as CSSProperties
                                        }
                                        aria-hidden="true"
                                    />
                                    <span className={c("itemLabel")}>
                                        {item.label}
                                    </span>
                                    <span className={c("itemShare")}>
                                        <Rolling
                                            value={share(item)}
                                            decimals={decimals}
                                            reduced={reduced}
                                        />
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <p className={c("srOnly")} aria-live="polite" aria-atomic="true">
                {announce}
            </p>
            <p className={c("srOnly")}>{summary}</p>
            {!empty && (
                <div className={c("srOnly")}>
                    <table>
                        <caption>{label}</caption>
                        <thead>
                            <tr>
                                <th scope="col">Category</th>
                                <th scope="col">Value</th>
                                <th scope="col">Share</th>
                                <th scope="col">Cells</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.key}>
                                    <th scope="row">{item.label}</th>
                                    <td>{format(item.value)}</td>
                                    <td>{share(item).toFixed(decimals)}%</td>
                                    <td>{counts[index]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </figure>
    )
}

/* ------------------------------------------------------------------ Framer wrapper */

type CategoryInput = {
    label?: string
    value?: number
    useColor?: boolean
    color?: string
}
const DEFAULT_DATA: CategoryInput[] = [
    { label: "Rent", value: 1450 },
    { label: "Savings", value: 600 },
    { label: "Groceries", value: 520 },
    { label: "Transport", value: 260 },
    { label: "Going out", value: 220 },
    { label: "Other", value: 150 },
]
/** Arc's fallback series palette per theme. A colour left at its light default switches to the dark-theme step in Dark. */
const SERIES_LIGHT = ["#1F7DCF", "#7128A5", "#E58F00", "#009E84"]
const SERIES_DARK = ["#55ADFF", "#9C37BE", "#E66E00", "#00A861"]
const seriesFor = (value: string, index: number, theme: string) =>
    theme === "Dark" && (!value || value.toUpperCase() === SERIES_LIGHT[index])
        ? SERIES_DARK[index]
        : value || SERIES_LIGHT[index]
const slug = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-") || "item"

/**
 * Use a waffle chart for parts of one whole when the parts should read as countable units, such as 10 × 10 cells for percentages.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function WaffleChart(props: any) {
    const {
        data: dataInput = DEFAULT_DATA,
        label = "Monthly budget",
        unit = "USD",
        rows = 10,
        columns = 10,
        highlightFirst = true,
        legend = true,
        decimals = 0,
        gridMax = 300,
        radius = 22,
        emptyLabel = "No data",
        theme = "Light",
        series1 = "#1F7DCF",
        series2 = "#7128A5",
        series3 = "#E58F00",
        series4 = "#009E84",
        font,
        onActiveChange,
        style,
    } = props

    const data: WaffleCategory[] = useMemo(() => {
        const seen = new Map<string, number>()
        return (dataInput || [])
            .filter((d: CategoryInput) => d && (d.label ?? "").trim())
            .map((d: CategoryInput) => {
                const base = slug(d.label!)
                const n = seen.get(base) ?? 0
                seen.set(base, n + 1)
                return {
                    key: n ? `${base}-${n}` : base,
                    label: d.label!,
                    value: Math.max(0, Number(d.value) || 0),
                    color: d.useColor && d.color ? d.color : undefined,
                }
            })
    }, [dataInput])

    const onCanvas =
        typeof window !== "undefined" &&
        RenderTarget.current() === RenderTarget.canvas
    const r = Math.round(clamp(Number(rows) || 10, 1, 40)),
        cols = Math.round(clamp(Number(columns) || 10, 1, 40))

    const scopeStyle = {
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        ...(font || {}),
        ...style,
        "--series-1": seriesFor(series1, 0, theme),
        "--series-2": seriesFor(series2, 1, theme),
        "--series-3": seriesFor(series3, 2, theme),
        "--series-4": seriesFor(series4, 3, theme),
        "--waffle-max": `${Math.max(80, gridMax)}px`,
        "--waffle-radius": `${clamp(radius, 0, 50)}%`,
    } as CSSProperties

    return (
        <div
            className={`${P}-root`}
            data-theme={theme === "Dark" ? "dark" : "light"}
            style={scopeStyle}
        >
            <style>{CSS}</style>
            <Waffle
                data={data}
                label={label}
                unit={unit}
                rows={r}
                columns={cols}
                accentKey={highlightFirst ? undefined : null}
                legend={legend}
                decimals={clamp(Math.round(decimals), 0, 4)}
                emptyLabel={emptyLabel}
                onActiveChange={onActiveChange}
                revealNow={onCanvas}
            />
        </div>
    )
}

WaffleChart.displayName = "Waffle Chart"

addPropertyControls(WaffleChart, {
    data: {
        type: ControlType.Array,
        title: "Data",
        maxCount: 16,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Category",
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    defaultValue: 100,
                    min: 0,
                    max: 1000000000,
                    step: 1,
                    displayStepper: true,
                },
                useColor: {
                    type: ControlType.Boolean,
                    title: "Custom Color",
                    defaultValue: false,
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#7747FF",
                    hidden: (p: any) => !p.useColor,
                },
            },
        },
        defaultValue: DEFAULT_DATA,
    },
    label: {
        type: ControlType.String,
        title: "Title (A11y)",
        defaultValue: "Monthly budget",
    },
    unit: {
        type: ControlType.String,
        title: "Unit",
        defaultValue: "USD",
        placeholder: "TWh",
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 10,
        min: 1,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 10,
        min: 1,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    highlightFirst: {
        type: ControlType.Boolean,
        title: "Accent First",
        defaultValue: true,
        description: "Off paints every category from the supporting palette.",
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    legend: { type: ControlType.Boolean, title: "Legend", defaultValue: true },
    gridMax: {
        type: ControlType.Number,
        title: "Grid Width",
        defaultValue: 300,
        min: 80,
        max: 1200,
        step: 4,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Cell Radius",
        defaultValue: 22,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
    emptyLabel: {
        type: ControlType.String,
        title: "Empty Label",
        defaultValue: "No data",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    series1: {
        type: ControlType.Color,
        title: "Series 1",
        defaultValue: "#1F7DCF",
    },
    series2: {
        type: ControlType.Color,
        title: "Series 2",
        defaultValue: "#7128A5",
    },
    series3: {
        type: ControlType.Color,
        title: "Series 3",
        defaultValue: "#E58F00",
    },
    series4: {
        type: ControlType.Color,
        title: "Series 4",
        defaultValue: "#009E84",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    onActiveChange: {
        type: ControlType.EventHandler,
        title: "On Active Change",
    },
})
