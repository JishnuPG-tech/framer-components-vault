// Unit Story: a stats section that shows numbers as countable figures (1 figure = N)
// and regroups them from statement to statement in up to six steps.
// Step 1 is complete in the static HTML as an SVG with one <use> per figure. Figures recolor in a wave or move
// on a canvas, which keeps the last frame after a transition, so later transitions never switch between the two.

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
import { startTransition, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

// ------------------------------------------------------------------ types

type Shape = "bust" | "dot" | "square" | "person" | "house" | "drop" | "tree" | "meal" | "book" | "custom"
type Glyph = Exclude<Shape, "custom">
type Arrange = "together" | "apart"
type Mode = "auto" | "tap" | "prop"
type Rep = "plain" | "compact" | "percent"
type Source = "auto" | "user" | "prop"

interface StepInput {
    text?: string
    data?: string
    arrange?: Arrange
}

interface Props {
    steps?: StepInput[]
    step?: number
    playback?: { mode?: Mode; interval?: number; grow?: boolean }
    figures?: { shape?: Shape; file?: string; scale?: string }
    layout?: { direction?: "side" | "stacked"; showNumber?: boolean }
    colors?: { groups?: string[]; base?: string; text?: string }
    fonts?: { number?: CSSProperties; text?: CSSProperties }
    look?: { radius?: string; gap?: string }
    labels?: {
        unitOne?: string
        unitMany?: string
        ofTotal?: string
        stepOf?: string
        previous?: string
        next?: string
        replay?: string
        caption?: string
        steps?: string
    }
    onFinish?: () => void
    /** Set by Framer (size and position of the instance), passed to the root unchanged. Not a design option. */
    style?: CSSProperties
}

// ------------------------------------------------------------------ defaults

// Demo story of a made-up town: 100 people, one figure for each.
const DEFAULT_STEPS: StepInput[] = [
    {
        text: "people in our town knew CPR.",
        data: "Knew CPR: 18 of 100\nDid not: rest",
        arrange: "together",
    },
    {
        text: "do now, after a year of free courses.",
        data: "Know CPR: 64 of 100\nNot yet: rest",
        arrange: "together",
    },
    {
        text: "of them saved a life last winter.",
        data: "Saved a life: 3 of 100\nOthers: rest",
        arrange: "together",
    },
]
// Highlight, second part, then four more for longer stories.
const DEFAULT_PALETTE = ["rgb(46, 85, 230)", "rgb(159, 180, 242)", "rgb(23, 42, 122)", "rgb(224, 149, 46)", "rgb(32, 150, 136)", "rgb(214, 86, 110)"]
const DEFAULT_BASE = "rgb(217, 219, 223)"
const DEFAULT_TEXT = "rgb(21, 23, 28)"
const NUMBER_SIZE = 136
const TEXT_SIZE = 26

const MAX_STEPS = 6
const MAX_GROUPS = 6
const AUTO_FIGURES = 100
const MAX_FIGURES = 1500
const GAP_FIVE = 0.4
const GAP_BLOCK = 1.2
const MAX_CELL_PX = 44
const EMPTY_ALPHA = 0.6
// From a million on, a step shows all its values compact with the same precision ("2.45M", "2.55M", "of 5M").
const COMPACT_FROM = 1e6
const COMPACT_DIGITS = 2

// Motion (ms)
const FLY_MS = 720
const FLY_STAGGER_MS = 480
// Recolor wave in reading order from the top left: 5 ms per figure, the whole wave at most TINT_WAVE_MS.
const TINT_MS = 450
const TINT_STEP_MS = 5
const TINT_WAVE_MS = 600
const IN_MS = 260
const OUT_MS = 240
const COUNT_MS = 650
// First appearance: figures fade and rise in row by row, the whole wave takes at most REVEAL_SPREAD_MS.
const REVEAL_MS = 500
const REVEAL_ROW_MS = 45
const REVEAL_COL_MS = 12
const REVEAL_SPREAD_MS = 900
// A custom figure that has not loaded by then counts as broken: dots instead of waiting on empty masks.
const IMAGE_TIMEOUT_MS = 6000
// Number and diagram stand side by side from this width of the component on.
const SIDE_FROM = 600
// Side by side the content is at most this wide (the draft's card), centered in wider frames.
const MAX_WIDTH = 1120
const DEFAULT_RADIUS = "12px"
// Gap control: space between the blocks, then the largest space between text and chart.
const DEFAULT_GAP = "28px 96px"

// ------------------------------------------------------------------ glyphs
// Own drawings on a 24 grid, content inside 2..22, filled areas only (mask and sprite stay identical).

const GLYPHS: Record<Glyph, string> = {
    // Head and shoulders, drawn on 16 x 22 and fitted into the 20 x 20 box (rows are taller, see ROW_PITCH).
    bust: "M12 2.364a3.545 3.545 0 1 1 0 7.091a3.545 3.545 0 1 1 0-7.091Z" + "M6.182 22v-6a5.818 5.818 0 0 1 11.636 0V22Z",
    dot: "M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20Z",
    square: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z",
    person:
        "M12 2a3.3 3.3 0 1 1 0 6.6a3.3 3.3 0 1 1 0-6.6Z" +
        "M8.7 9.6h6.6A2.7 2.7 0 0 1 18 12.3V17h-2.3v5h-3.1v-5.4h-1.2V22H8.3v-5H6v-4.7A2.7 2.7 0 0 1 8.7 9.6Z",
    house: "M12 2.5L22 10.8H19.4V22H14.2V15.8H9.8V22H4.6V10.8H2Z",
    drop: "M12 2.2C14.8 6.2 19.4 10.4 19.4 14.6A7.4 7.4 0 0 1 4.6 14.6C4.6 10.4 9.2 6.2 12 2.2Z",
    tree: "M10.6 22L10.9 16.3C7.3 16.5 4.2 14.7 3.9 11.6C3.6 8.8 5.5 6.6 7.9 6.2C8.6 3.9 10.4 2.4 12.6 2.4C15.1 2.4 16.9 4.1 17.3 6.4C19.4 7.1 20.6 9.1 20.3 11.6C19.9 14.8 17 16.5 13.1 16.3L13.4 22Z",
    meal:
        "M6.2 9.2A5.8 5 0 0 1 17.8 9.2Z" +
        "M3 10.4h18a1 1 0 0 1 1 1v.4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-.4a1 1 0 0 1 1-1Z" +
        "M3.6 12.4h16.8A8.4 7.6 0 0 1 12 20A8.4 7.6 0 0 1 3.6 12.4Z" +
        "M9 19.2h6V22H9Z",
    book:
        "M2.5 5.2C5.8 4.6 9 5.3 11.2 7v15C9 20.3 5.8 19.7 2.5 20.4Z" +
        "M21.5 5.2C18.2 4.6 15 5.3 12.8 7v15c2.2-1.7 5.4-2.3 8.7-1.6Z",
}

// Shapes drawn in a few slightly different forms, picked per figure position (same on the server and the canvas).
const VARIANTS: Partial<Record<Glyph, string[]>> = {
    tree: [
        GLYPHS.tree,
        "M13.4 22L13.1 16.3C16.7 16.5 19.8 14.7 20.1 11.6C20.4 8.8 18.5 6.6 16.1 6.2C15.4 3.9 13.6 2.4 11.4 2.4C8.9 2.4 7.1 4.1 6.7 6.4C4.6 7.1 3.4 9.1 3.7 11.6C4.1 14.8 7 16.5 10.9 16.3L10.6 22Z",
        "M10.6 22L10.9 15.9C7.2 15.8 4.4 13.6 4.4 10.3C4.4 6.1 7.8 2.5 12 2.5C16.2 2.5 19.6 6.1 19.6 10.3C19.6 13.6 16.8 15.8 13.1 15.9L13.4 22Z",
    ],
}

// Row pitch per cell width: Bust sits in 26 x 32 cells with 16 x 22 figures (equal gaps both ways).
const BUST_PITCH = 32 / 26
const BUST_SIZE = 22 / 26

/** Form of the figure at index i of a pack: a fixed pattern, so the server, the client and the canvas agree. */
function variantOf(i: number, n: number): number {
    return n > 1 ? (Math.imul(i + 1, 2654435761) >>> 16) % n : 0
}

// ------------------------------------------------------------------ parsing

interface Num {
    value: number
    decimals: number
}

interface Line {
    no: number
    label: string
    rest: boolean
    percent: boolean
    num: Num
}

interface RawStep {
    lines: Line[]
    total: Num | null
    skipped: number
}

const ZERO: Num = { value: 0, decimals: 0 }
// Group separators: comma, point, apostrophes, space, no-break space, thin space, narrow no-break space.
const SEP = "[.,'\u2019\u00a0\u2009\u202f ]"
const NUM_SRC = `\\d+(?:${SEP}\\d+)*(?:\\s?[kmb](?![a-z]))?`
const OF_SRC = "(?:out\\s+of|of|von|\\/)"
const VALUE_RE = new RegExp(`^(${NUM_SRC})\\s*(%)?(?:\\s*${OF_SRC}\\s*(${NUM_SRC}))?$`, "i")
const TOTAL_RE = new RegExp(`^${OF_SRC}\\s*(${NUM_SRC})$`, "i")
const NUMBER_RE = new RegExp(`^(\\d+)((?:${SEP}\\d+)*)\\s?([kmb])?$`, "i")
const GROUP_RE = new RegExp(`${SEP}\\d+`, "g")
const NEGATIVE_RE = /^[-\u2212]\s*\d/

function decimalsOf(v: number): number {
    for (let d = 0; d < 2; d++) {
        const f = 10 ** d
        if (Math.abs(Math.round(v * f) - v * f) < 1e-6 * Math.max(1, Math.abs(v * f))) return d
    }
    return 2
}

function round2(v: number): number {
    return Math.round(v * 100) / 100
}

/** "1,000", "1.000", "1 000", "1'000", "1,5", "2.4k". A separator before exactly three digits groups thousands. */
function parseNumber(token: string): Num | null {
    const m = NUMBER_RE.exec(token.trim())
    if (!m) return null
    let whole = m[1]
    let frac = ""
    const parts = m[2].match(GROUP_RE) ?? []
    for (let i = 0; i < parts.length; i++) {
        const sep = parts[i][0]
        const digits = parts[i].slice(1)
        if (digits.length === 3) whole += digits
        else if (i === parts.length - 1 && (sep === "." || sep === ",") && digits.length <= 2) frac = digits
        else return null
    }
    const suffix = (m[3] ?? "").toLowerCase()
    const mult = suffix === "k" ? 1e3 : suffix === "m" ? 1e6 : suffix === "b" ? 1e9 : 1
    const value = Number(frac ? `${whole}.${frac}` : whole) * mult
    if (!Number.isFinite(value) || value > 1e15) return null
    return { value: suffix ? round2(value) : value, decimals: suffix ? decimalsOf(value) : frac.length }
}

function clip(s: string): string {
    return s.length > 28 ? `${s.slice(0, 26)}...` : s
}

function parseStep(data: string, si: number, hints: string[]): RawStep {
    const lines: Line[] = []
    let total: Num | null = null
    let skipped = 0
    let hasRest = false
    const setTotal = (t: Num, where: string) => {
        if (total && total.value !== t.value) hints.push(`${where}: a second total is ignored.`)
        else total = t
    }
    data.split(/\r\n|\r|\n/).forEach((row, r) => {
        const raw = row.trim()
        if (!raw) return
        const no = r + 1
        const where = `Step ${si + 1}, line ${no}`
        const colon = raw.lastIndexOf(":")
        const label = colon >= 0 ? raw.slice(0, colon).trim() : ""
        const body = (colon >= 0 ? raw.slice(colon + 1) : raw).trim()
        const rest = /^rest$/i.test(body)
        if (rest && hasRest) {
            hints.push(`${where}: only one "rest" line is used.`)
            return
        }
        const onlyTotal = rest ? null : TOTAL_RE.exec(body)
        if (onlyTotal) {
            const t = parseNumber(onlyTotal[1])
            if (t) setTotal(t, where)
            else hints.push(`${where}: "${clip(onlyTotal[1])}" is not a number.`)
            return
        }
        const m = rest ? null : VALUE_RE.exec(body)
        const v = m ? parseNumber(m[1]) : null
        const t = m && m[3] ? parseNumber(m[3]) : null
        if (!rest && (!m || !v || (m[3] && !t))) {
            if (NEGATIVE_RE.test(body)) hints.push(`${where}: negative values are skipped.`)
            else if (!body) hints.push(`${where}: add a number after the colon.`)
            else hints.push(`${where}: "${clip(m && v ? m[3] ?? "" : m ? m[1] : body)}" is not a number.`)
            return
        }
        if (lines.length >= MAX_GROUPS) {
            skipped++
            return
        }
        if (rest || !m || !v) {
            hasRest = true
            lines.push({ no, label, rest: true, percent: false, num: ZERO })
            return
        }
        let num = v
        if (t) {
            setTotal(t, where)
            if (m[2]) {
                const abs = round2((v.value / 100) * t.value)
                num = { value: abs, decimals: decimalsOf(abs) }
            }
        }
        lines.push({ no, label, rest: false, percent: !!m[2] && !t, num })
    })
    return { lines, total, skipped }
}

// ------------------------------------------------------------------ scale and rounding

function nextInSeries(n: number): number {
    const p = 10 ** Math.floor(Math.log10(n) + 1e-9)
    const m = Math.round(n / p)
    return m === 1 ? 2 * p : m === 2 ? 5 * p : 10 * p
}

/** One N for all steps. Auto: smallest 1, 2, 5 x 10^k with at most 100 figures. Fixed: raised above 1,500 figures. */
function chooseScale(maxTotal: number, key: string, fmt: (v: number) => string): { n: number; note: string | null; none: boolean } {
    if (Math.round(maxTotal) < 1) return { n: 1, note: "Totals below 0.5 cannot be drawn as figures.", none: true }
    let n = 1
    while (Math.round(maxTotal / n) > AUTO_FIGURES) n = nextInSeries(n)
    const fixed = Number(key)
    if (key === "auto" || !Number.isFinite(fixed) || fixed < 1) return { n, note: null, none: false }
    if (Math.round(maxTotal / fixed) < 1) return { n, note: "Per Figure is larger than every total, so Auto is used.", none: false }
    n = fixed
    while (Math.round(maxTotal / n) > MAX_FIGURES) n = nextInSeries(n)
    const note = n !== fixed ? `Per Figure is raised to ${fmt(n)} to stay at ${fmt(MAX_FIGURES)} figures or fewer.` : null
    return { n, note, none: false }
}

/** Whole figures whose sum always matches: floor, then the largest remainders (ties: earlier group). */
function largestRemainder(values: number[], n: number, figures: number): number[] {
    const quotas = values.map((v) => v / n)
    const out = quotas.map((q) => Math.floor(q + 1e-9))
    let left = figures - out.reduce((a, b) => a + b, 0)
    const order = quotas.map((q, i) => ({ i, r: q - Math.floor(q + 1e-9) })).sort((a, b) => b.r - a.r || a.i - b.i)
    for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length, left--) out[order[k].i]++
    for (let i = 0; left < 0 && i < out.length; i++) {
        while (left < 0 && out[i] > 0) {
            out[i]--
            left++
        }
    }
    return out
}

// ------------------------------------------------------------------ packing (in cell units)

interface Pack {
    w: number
    h: number
    xs: number[]
    ys: number[]
}

interface ApartPack {
    wa: number
    scale: number
    bands: Pack[]
}

/** Position of column i with a counting gap after every fifth. */
function gapped(i: number): number {
    return i + Math.floor(i / 5) * GAP_FIVE
}

function spanOf(count: number): number {
    return count <= 0 ? 0 : gapped(count - 1) + 1
}

/** Position of row i: rows are ar cells high (taller for Bust), the counting gap stays the same. */
function rowAt(i: number, ar: number): number {
    return i * ar + Math.floor(i / 5) * GAP_FIVE
}

function rowSpan(count: number, ar: number): number {
    return count <= 0 ? 0 : rowAt(count - 1, ar) + ar
}

function blockColumns(n: number): number {
    return n > 100 ? Math.min(5, Math.ceil(Math.sqrt(Math.ceil(n / 100)))) : 1
}

/** Rows of ten, from 101 figures blocks of a hundred side by side. Depends on the count only, never on width. */
function packTogether(n: number, ar: number): Pack {
    const xs: number[] = []
    const ys: number[] = []
    const cols = blockColumns(n)
    const blockW = spanOf(10) + GAP_BLOCK
    const blockH = rowSpan(10, ar) + GAP_BLOCK
    let w = n > 10 && n <= 100 ? spanOf(10) : 1
    let h = ar
    for (let i = 0; i < n; i++) {
        const j = n > 100 ? i % 100 : i
        const b = n > 100 ? Math.floor(i / 100) : 0
        const x = (b % cols) * blockW + gapped(n <= 10 ? j : j % 10)
        const y = Math.floor(b / cols) * blockH + (n <= 10 ? 0 : rowAt(Math.floor(j / 10), ar))
        xs.push(x)
        ys.push(y)
        w = Math.max(w, x + 1)
        h = Math.max(h, y + ar)
    }
    return { w, h, xs, ys }
}

function packRows(count: number, cols: number, ar: number): Pack {
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i < count; i++) {
        xs.push(gapped(i % cols))
        ys.push(rowAt(Math.floor(i / cols), ar))
    }
    return { w: spanOf(cols), h: rowSpan(Math.ceil(count / cols), ar), xs, ys }
}

/** Apart: one band per group in rows of C_a, cell scale s* so bands never grow wider than the box. */
function packApart(counts: number[], box: Pack, boxFigures: number, ar: number): ApartPack {
    const c0 = boxFigures <= 10 ? Math.max(1, boxFigures) : blockColumns(boxFigures) * 10
    let best = c0
    let bestS = -1
    for (let c = c0; c <= (c0 < 10 ? c0 : c0 * 2); c += 10) {
        // Band rows plus gaps, one cell per label, half a cell between bands (approximation for the choice only).
        const ha = counts.reduce((a, k, i) => a + rowSpan(Math.ceil(k / c), ar) + 1 + (i > 0 ? 0.5 : 0), 0)
        const s = Math.min(1, box.w / spanOf(c), box.h / Math.max(ha, 0.001))
        if (s > bestS + 1e-9) {
            bestS = s
            best = c
        }
    }
    const wa = spanOf(best)
    return { wa, scale: Math.min(1, box.w / wa, Math.max(bestS, 0.6)), bands: counts.map((k) => packRows(k, best, ar)) }
}

// ------------------------------------------------------------------ number formatting

type Formatter = (v: number, decimals: number, compactDigits: number, rep: Rep) => string

function makeFormatter(locale: string): { format: Formatter; fraction: (v: number) => number } {
    const cache = new Map<string, Intl.NumberFormat>()
    const get = (opts: Intl.NumberFormatOptions) => {
        const key = JSON.stringify(opts)
        let f = cache.get(key)
        if (!f) {
            try {
                f = new Intl.NumberFormat(locale, opts)
            } catch {
                f = new Intl.NumberFormat("en-US", opts)
            }
            cache.set(key, f)
        }
        return f
    }
    const compact = (digits: number) => get({ notation: "compact", maximumFractionDigits: Math.max(0, Math.min(2, digits)) })
    return {
        format: (v, decimals, compactDigits, rep) => {
            const d = Math.max(0, Math.min(2, decimals))
            if (rep === "compact") return compact(compactDigits).format(v)
            return get({ style: rep === "percent" ? "percent" : "decimal", minimumFractionDigits: d, maximumFractionDigits: d }).format(rep === "percent" ? v / 100 : v)
        },
        // Fraction digits a compact value shows ("2.45M": 2, "5M": 0), so counting never shows more than its two ends.
        fraction: (v) => compact(COMPACT_DIGITS).formatToParts(v).find((p) => p.type === "fraction")?.value.length ?? 0,
    }
}

function repOf(v: number, percent: boolean): Rep {
    return percent ? "percent" : Math.abs(v) >= COMPACT_FROM ? "compact" : "plain"
}

// ------------------------------------------------------------------ model

type StepKind = "ok" | "zero" | "empty"

interface GroupView {
    key: string
    label: string
    valueText: string
    color: number
    figures: number
    rest: boolean
}

interface NumberView {
    value: number
    text: string
    decimals: number
    compactDigits: number
    rep: Rep
}

interface StepView {
    kind: StepKind
    text: string
    groups: GroupView[]
    seq: number[]
    pack: Pack | null
    apart: ApartPack | null
    number: NumberView | null
    ofText: string | null
    /** Group whose value is the big number: the band label shows it without the value. */
    bigKey: string | null
    /** Color index of the big number (its group's color), null for the text color. */
    numColor: number | null
    summary: string
}

interface Model {
    empty: boolean
    steps: StepView[]
    box: Pack
    colorList: string[]
    caption: string
    hints: string[]
    maxChars: number
    format: Formatter
}

interface ModelInput {
    steps: StepInput[]
    scaleKey: string
    palette: string[]
    base: string
    locale: string
    unitOne: string
    unitMany: string
    ofTotal: string
    caption: string
    /** Row pitch in cell widths (see ROW_PITCH). */
    ar: number
}

interface Draft {
    ok: boolean
    groups: { key: string; label: string; num: Num; rest: boolean }[]
    total: Num
    named: boolean
    first: Num | null
}

function str(v: unknown, fallback: string): string {
    return typeof v === "string" ? v : fallback
}

function buildModel(input: ModelInput): Model {
    const hints: string[] = []
    const { format, fraction } = makeFormatter(input.locale)
    const list = input.steps.slice(0, MAX_STEPS)
    const raws = list.map((s, i) => parseStep(str(s?.data, ""), i, hints))
    const where = (i: number) => `Step ${i + 1}`

    // Percent without "of" next to counts in one step is invalid.
    const pctStep = raws.map((r, i) => {
        const valued = r.lines.filter((l) => !l.rest)
        const pct = valued.filter((l) => l.percent)
        if (pct.length > 0 && (pct.length < valued.length || r.total)) {
            for (const l of pct) hints.push(`${where(i)}, line ${l.no}: write "37% of 1,000" when other lines use counts.`)
            r.lines = r.lines.filter((l) => !l.percent)
            return false
        }
        return pct.length > 0
    })
    const hasData = (r: RawStep) => r.lines.some((l) => !l.rest) || !!r.total
    // A percent story: every step with data is a percent step.
    const percent = raws.some(hasData) && raws.every((r, i) => !hasData(r) || pctStep[i])
    if (!percent) {
        raws.forEach((r, i) => {
            if (!pctStep[i]) return
            hints.push(`${where(i)}: percentages need a total ("37% of 1,000") when other steps use counts.`)
            r.lines = r.lines.filter((l) => !l.percent)
        })
    }
    const plainFmt = (v: number) => format(v, decimalsOf(v), COMPACT_DIGITS, repOf(v, false))
    const sumOf = (ls: Line[]) => round2(ls.reduce((a, l) => a + (l.rest ? 0 : l.num.value), 0))

    const drafts: Draft[] = raws.map((r, i) => {
        let lines = r.lines
        let skipped = r.skipped
        const restLine = lines.some((l) => l.rest)
        // The implicit rest counts toward the six groups: the last value line makes room and its value joins the rest.
        if (!restLine && lines.length >= MAX_GROUPS && round2((r.total ? r.total.value : percent ? 100 : 0) - sumOf(lines)) > 0) {
            skipped += lines.length - (MAX_GROUPS - 1)
            lines = lines.slice(0, MAX_GROUPS - 1)
        }
        const valued = lines.filter((l) => !l.rest)
        const sum = sumOf(valued)
        const dec = Math.max(0, ...valued.map((l) => l.num.decimals), r.total?.decimals ?? 0)
        let total: Num = r.total ?? { value: percent ? 100 : sum, decimals: percent ? 0 : dec }
        if (sum > total.value + 1e-9) {
            if (percent) hints.push(`${where(i)}: percentages add up to ${format(sum, decimalsOf(sum), COMPACT_DIGITS, "percent")}.`)
            else if (r.total) hints.push(`${where(i)}: the groups add up to more than the total, so the total is ${plainFmt(sum)}.`)
            total = { value: sum, decimals: dec }
        }
        const restNum: Num = { value: round2(Math.max(0, total.value - sum)), decimals: Math.min(2, dec) }
        const groups = lines.map((l) => ({
            key: l.label ? `l:${l.label.toLowerCase()}` : l.rest ? "rest" : "u",
            label: l.label,
            num: l.rest ? restNum : l.num,
            rest: l.rest,
        }))
        if (!restLine && restNum.value > 0) groups.push({ key: "rest", label: "", num: restNum, rest: true })
        if (skipped > 0) {
            const withRest = groups.some((g) => g.rest) ? " (rest included)" : ""
            hints.push(`${where(i)}: only ${MAX_GROUPS} groups are drawn${withRest}, ${skipped} more skipped.`)
        }
        const first = valued.length ? valued[0].num : null
        return { ok: hasData(r) && total.value > 0, groups, total, named: !!r.total && !percent, first }
    })

    // Colors follow the group name: a named group keeps its color in every step. A new name takes the lowest color
    // no group it shares a step with holds, so a new highlight is blue again. Groups without a name take the free
    // colors by place, the rest takes the base.
    const palette = input.palette.length > 0 ? input.palette : DEFAULT_PALETTE
    const slots = palette.length
    const nameColor = new Map<string, number>()
    const sharesStep = new Map<string, Set<string>>()
    for (const d of drafts) {
        const keys = d.groups.filter((g) => !g.rest && g.label).map((g) => g.key)
        for (const a of keys) {
            const set = sharesStep.get(a) ?? new Set<string>()
            for (const b of keys) if (b !== a) set.add(b)
            sharesStep.set(a, set)
        }
    }
    let named = 0
    for (const d of drafts) {
        for (const g of d.groups) {
            if (g.rest || !g.label || nameColor.has(g.key)) continue
            const held = new Set<number>()
            sharesStep.get(g.key)?.forEach((b) => held.add(nameColor.get(b) ?? 0))
            let c = 0
            for (let k = 1; k <= slots && !c; k++) if (!held.has(k)) c = k
            nameColor.set(g.key, c || 1 + (named % slots))
            named++
        }
    }
    const colorsOf = (d: Draft) => {
        const held = new Set(d.groups.map((g) => (!g.rest && g.label ? nameColor.get(g.key) ?? 0 : 0)))
        let place = 0
        return d.groups.map((g) => {
            if (g.rest || (!g.label && d.groups.length === 1 && !d.named)) return 0
            if (g.label) return nameColor.get(g.key) ?? 1
            let c = 0
            for (let k = 1; k <= slots && !c; k++) if (!held.has(k)) c = k
            c = c || 1 + (place % slots)
            place++
            held.add(c)
            return c
        })
    }

    // One scale for all steps.
    const totals = drafts.filter((d) => d.ok).map((d) => d.total.value)
    const choice = totals.length ? chooseScale(Math.max(...totals), input.scaleKey, plainFmt) : { n: 1, note: null, none: true }
    const n = choice.n
    // One unit stands alone ("one person"), more units follow the number ("10 people").
    const unit = percent ? format(n, 0, 0, "percent") : n === 1 && input.unitOne.trim() ? input.unitOne.trim() : `${format(n, 0, COMPACT_DIGITS, repOf(n, false))} ${n === 1 ? input.unitOne : input.unitMany}`.trim()
    const figuresOf = drafts.map((d) => (d.ok && !choice.none ? Math.round(d.total.value / n) : 0))
    const maxFigures = Math.max(0, ...figuresOf)
    const empty = choice.none || maxFigures < 1
    if (choice.note) hints.push(choice.note)
    else if (empty) hints.push(`Add a step with data like "Label: 230 of 1,000".`)
    const box = packTogether(empty ? 100 : maxFigures, input.ar)

    const steps: StepView[] = list.map((s, i) => {
        const d = drafts[i]
        const text = str(s?.text, "")
        const figs = figuresOf[i]
        if (empty || !d.ok) {
            return { kind: "empty", text, groups: [], seq: box.xs.map(() => 0), pack: box, apart: null, number: null, ofText: null, bigKey: null, numColor: null, summary: "No data yet." }
        }
        const counts = largestRemainder(
            d.groups.map((g) => g.num.value),
            n,
            figs,
        )
        // One representation per step: the total is its largest value, so it decides compact or plain for all.
        const rep: Rep = percent ? "percent" : d.total.value >= COMPACT_FROM ? "compact" : "plain"
        const fmt = (v: Num) => format(v.value, v.decimals, COMPACT_DIGITS, rep)
        const colors = colorsOf(d)
        const groups: GroupView[] = d.groups.map((g, gi) => ({
            key: g.key,
            label: g.label,
            valueText: fmt(g.num),
            color: colors[gi],
            figures: counts[gi],
            rest: g.rest,
        }))
        const seq: number[] = []
        counts.forEach((c, gi) => {
            for (let k = 0; k < c; k++) seq.push(gi)
        })
        const big = d.first ?? d.total
        const t = d.total
        const ofText = d.named ? input.ofTotal.split("{total}").join(fmt(t)) : null
        if (figs === 0) hints.push(`${where(i)}: ${fmt(t)} is less than one figure at ${unit} per figure.`)
        const parts = groups
            .filter((g) => g.label || !g.rest)
            .map((g) => (g.label ? `${g.label}: ${g.valueText}.` : `${g.valueText}${ofText ? ` ${ofText}` : ""}.`))
        const head = figs === 0 ? "No figures" : figs === 1 ? "1 figure" : `${figs} figures`
        return {
            kind: figs === 0 ? "zero" : "ok",
            text,
            groups,
            seq,
            pack: figs > 0 ? packTogether(figs, input.ar) : null,
            apart:
                figs > 0 && s?.arrange === "apart"
                    ? packApart(
                          groups.map((g) => g.figures),
                          box,
                          maxFigures,
                          input.ar,
                      )
                    : null,
            number: { value: big.value, text: fmt(big), decimals: big.decimals, compactDigits: rep === "compact" ? fraction(big.value) : 0, rep },
            ofText,
            bigKey: d.first ? (d.groups.find((g) => !g.rest)?.key ?? null) : null,
            numColor: d.first ? (groups.find((g) => !g.rest)?.color || null) : null,
            summary: [`${head}, each figure is ${unit}.`, ...parts].join(" "),
        }
    })

    return {
        empty,
        steps,
        box,
        colorList: [input.base, ...palette],
        caption: input.caption.split("{unit}").join(unit).trim(),
        hints: hints.filter((h, i, a) => a.indexOf(h) === i),
        maxChars: Math.max(0, ...steps.map((s) => (s.number ? s.number.text.length : 0))),
        format,
    }
}

// ------------------------------------------------------------------ motion engine (canvas, only during a transition)

interface Slot {
    x: number
    y: number
    s: number
    c: number
    a: number
    k: string
    /** Form of the figure (index into the glyph list). */
    v: number
}

const K_STAY = 0
const K_TINT = 1
const K_FLY = 2
const K_IN = 3
const K_OUT = 4

interface Part {
    kind: number
    x0: number
    y0: number
    s0: number
    c0: number
    a0: number
    x1: number
    y1: number
    s1: number
    c1: number
    a1: number
    v0: number
    v1: number
    delay: number
    k: string
}

interface CountJob {
    el: HTMLElement
    /** "of 1,000" next to the number: moved with a transform while the number counts, so no layout shifts. */
    of: HTMLElement | null
    row: HTMLElement | null
    from: number
    to: NumberView
    decimals: number
    compactDigits: number
    format: Formatter
}

interface StartOptions {
    from: Slot[] | null
    to: Slot[]
    identity: boolean
    colors: string[]
    glyphs: string[] | null
    image: HTMLImageElement | null
    hide: HTMLElement
    host: HTMLElement
    watch: HTMLElement
    count: CountJob | null
    /** Screen px per layout px of the diagram area (ancestor zoom or scale). */
    scale: number
    /** True once React has committed the resting SVG of the target step. */
    ready: () => boolean
    onDone: () => void
}

interface Mover {
    start(o: StartOptions): boolean
    halt(): void
    running(): boolean
    shownCount(): number | null
}

function easeOutCubic(t: number): number {
    return 1 - (1 - t) ** 3
}

/** cubic-bezier(x1, y1, x2, y2) sampled into a lookup table. */
function bezierCurve(size: number, x1: number, y1: number, x2: number, y2: number): Float32Array {
    const out = new Float32Array(size + 1)
    const b = (t: number, p1: number, p2: number) => 3 * p1 * t * (1 - t) ** 2 + 3 * p2 * t * t * (1 - t) + t ** 3
    let t = 0
    for (let i = 0; i <= size; i++) {
        while (t < 1 && b(t, x1, x2) < i / size) t += 1 / (size * 8)
        out[i] = b(Math.min(1, t), y1, y2)
    }
    return out
}

function mkPart(kind: number, a: Slot, b: Slot, delay: number): Part {
    return { kind, x0: a.x, y0: a.y, s0: a.s, c0: a.c, a0: a.a, x1: b.x, y1: b.y, s1: b.s, c1: b.c, a1: b.a, v0: a.v, v1: b.v, delay, k: b.k }
}

/** Pairs figures: by index (Together to Together keeps places), else by group, the rest in reading order. */
function plan(from: Slot[], to: Slot[], identity: boolean): Part[] {
    const pairOf = to.map(() => -1)
    const used = from.map(() => false)
    const take = (j: number, i: number) => {
        pairOf[j] = i
        used[i] = true
    }
    if (identity) to.forEach((_, j) => j < from.length && take(j, j))
    else {
        const byKey = new Map<string, number[]>()
        from.forEach((s, i) => byKey.set(s.k, [...(byKey.get(s.k) ?? []), i]))
        to.forEach((s, j) => {
            const i = byKey.get(s.k)?.shift()
            if (i !== undefined) take(j, i)
        })
        let i = 0
        to.forEach((_, j) => {
            while (i < from.length && used[i]) i++
            if (pairOf[j] < 0 && i < from.length) take(j, i)
        })
    }
    // Recolor wave from the top left: every figure has its place in reading order (rows, then columns), so the
    // front moves evenly over the chart and only figures that change show it. 5 ms apart, 600 ms at most.
    const rank = to.map(() => 0)
    to.map((_, j) => j)
        .sort((a, b) => Math.round(to[a].y) - Math.round(to[b].y) || to[a].x - to[b].x)
        .forEach((j, r) => (rank[j] = r))
    const step = to.length > 1 ? Math.min(TINT_STEP_MS, TINT_WAVE_MS / (to.length - 1)) : 0
    const parts: Part[] = []
    to.forEach((b, j) => {
        const a = from[pairOf[j]]
        const same = a && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.s - b.s) < 0.5
        const kind = !a ? K_IN : !same ? K_FLY : a.c === b.c && Math.abs(a.a - b.a) < 0.01 ? K_STAY : K_TINT
        parts.push(mkPart(kind, a ?? b, b, kind === K_FLY ? (j / Math.max(1, to.length - 1)) * FLY_STAGGER_MS : kind === K_STAY ? 0 : rank[j] * step))
    })
    from.forEach((a, i) => !used[i] && parts.push(mkPart(K_OUT, a, a, 0)))
    return parts
}

function createMover(canvas: HTMLCanvasElement): Mover {
    let ctx: CanvasRenderingContext2D | null = null
    let parts: Part[] = []
    const sprites = new Map<string, HTMLCanvasElement>()
    let colors: string[] = []
    let glyphs: Path2D[] | null = null
    let image: HTMLImageElement | null = null
    let sizes = [1, 1]
    let dpr = 1
    let ox = 0
    let oy = 0
    let t0 = 0
    let total = 0
    let raf = 0
    let io: IntersectionObserver | null = null
    let count: CountJob | null = null
    let countValue = 0
    let hideEl: HTMLElement | null = null
    let onDone: (() => void) | null = null
    let ready: () => boolean = () => true
    let curve: Float32Array | null = null
    let tintCurve: Float32Array | null = null
    // Text width of the counting number, measured on its text node.
    const range = document.createRange()
    let lockW = 0
    let active = false
    // Removes the watchers of the canvas image (they run from the start of a transition until halt).
    let unwatch: (() => void) | null = null
    // Screen px per layout px at the start of a transition.
    let scaleK = 1
    // Set when size, color scheme, pixel density or a color value changes during a transition.
    let stale = false
    // Reused state of one particle at one moment.
    const st = { x: 0, y: 0, s: 0, sc: 1, c: 0, a: 1, mix: 0, v: 0 }

    const stateOf = (p: Part, t: number) => {
        const u = t - p.delay
        let v = 0
        st.x = p.x1
        st.y = p.y1
        st.s = p.s1
        st.c = p.c1
        st.a = p.a1
        st.sc = 1
        st.mix = 0
        st.v = p.v1
        if (p.kind === K_FLY) {
            v = Math.max(0, Math.min(1, u / FLY_MS))
            const e = curve ? curve[Math.round(v * (curve.length - 1))] : easeOutCubic(v)
            st.x = p.x0 + (p.x1 - p.x0) * e
            st.y = p.y0 + (p.y1 - p.y0) * e
            st.s = p.s0 + (p.s1 - p.s0) * e
            st.a = p.a0 + (p.a1 - p.a0) * e
            st.c = e < 0.5 ? p.c0 : p.c1
            st.v = e < 0.5 ? p.v0 : p.v1
            st.mix = p.c0 === p.c1 ? 0 : e
        } else if (p.kind === K_TINT) {
            // Same place, the new color fades in over the old one (draw paints both while 0 < mix < 1).
            v = Math.max(0, Math.min(1, u / TINT_MS))
            const e = tintCurve ? tintCurve[Math.round(v * (tintCurve.length - 1))] : easeOutCubic(v)
            st.c = e < 0.5 ? p.c0 : p.c1
            st.a = p.a0 + (p.a1 - p.a0) * e
            st.mix = e
        } else if (p.kind === K_IN) {
            v = Math.max(0, Math.min(1, u / IN_MS))
            st.sc = u <= 0 ? 0 : v < 0.6 ? 1.06 * easeOutCubic(v / 0.6) : 1.06 - 0.06 * easeOutCubic((v - 0.6) / 0.4)
        } else if (p.kind === K_OUT) {
            v = Math.max(0, Math.min(1, u / OUT_MS))
            st.x = p.x0
            st.y = p.y0
            st.s = p.s0
            st.c = p.c0
            st.a = p.a0
            st.v = p.v0
            st.sc = 1 - v * v
        }
        return st
    }

    // dev: glyph size in device px; fx, fy: subpixel phase of the glyph inside the sprite (quarter pixels).
    const sprite = (c: number, g: number, dev: number, fx: number, fy: number) => {
        const key = `${c}|${g}|${dev}|${fx}|${fy}`
        let cv = sprites.get(key)
        if (!cv) {
            cv = document.createElement("canvas")
            cv.width = cv.height = Math.ceil(dev) + 3
            const x = cv.getContext("2d")
            if (x) {
                x.translate(1 + fx, 1 + fy)
                x.scale(dev / 20, dev / 20)
                x.translate(-2, -2)
                x.fillStyle = colors[c] ?? "transparent"
                if (image) {
                    // Custom figure: the image is a mask, tinted with source-in like the SVG alpha mask.
                    const k = Math.min(20 / image.naturalWidth, 20 / image.naturalHeight)
                    x.drawImage(image, 12 - (image.naturalWidth * k) / 2, 12 - (image.naturalHeight * k) / 2, image.naturalWidth * k, image.naturalHeight * k)
                    x.globalCompositeOperation = "source-in"
                    x.fillRect(0, 0, 24, 24)
                } else if (glyphs) x.fill(glyphs[g] ?? glyphs[0])
            }
            sprites.set(key, cv)
        }
        return cv
    }

    // Draws in device pixels. At a resting size the sprite matching the subpixel phase is placed unscaled on
    // whole pixels, so the canvas matches the SVG; in between the larger sprite is scaled.
    const blit = (c: number, g: number, x: number, y: number, d: number, alpha: number) => {
        if (!ctx || d <= 0.05 || alpha <= 0.002 || c < 0) return
        const dx = (x - d / 2 - ox) * dpr
        const dy = (y - d / 2 - oy) * dpr
        const rest = Math.abs(d - sizes[0]) < 0.01 ? sizes[0] : Math.abs(d - sizes[1]) < 0.01 ? sizes[1] : 0
        ctx.globalAlpha = alpha
        if (rest) {
            const ix = Math.floor(dx)
            const iy = Math.floor(dy)
            const fx = Math.round((dx - ix) * 4) / 4
            const fy = Math.round((dy - iy) * 4) / 4
            ctx.drawImage(sprite(c, g, rest * dpr, fx % 1, fy % 1), ix + Math.floor(fx) - 1, iy + Math.floor(fy) - 1)
        } else {
            const big = Math.max(sizes[0], sizes[1]) * dpr
            const k = (d * dpr) / big
            const sp = sprite(c, g, big, 0, 0)
            ctx.drawImage(sp, dx - k, dy - k, sp.width * k, sp.height * k)
        }
    }

    const draw = (t: number) => {
        if (!ctx) return
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (const p of parts) {
            const s = stateOf(p, t)
            const d = s.s * s.sc
            if (p.kind === K_TINT && s.mix > 0 && s.mix < 1) {
                // Old color fully, new color on top: a straight blend without a lighter middle.
                blit(p.c0, s.v, s.x, s.y, d, p.a0)
                blit(p.c1, s.v, s.x, s.y, d, p.a1 * s.mix)
            } else if (s.mix > 0 && s.mix < 1) {
                const a = s.a
                const { x, y, mix, v } = s
                blit(p.c0, v, x, y, d, a * (1 - mix))
                blit(p.c1, v, x, y, d, a * mix)
            } else blit(s.c, s.v, s.x, s.y, d, s.a)
        }
        ctx.globalAlpha = 1
        if (count) {
            const c = count
            countValue = c.from + (c.to.value - c.from) * easeOutCubic(Math.min(1, t / COUNT_MS))
            const text = t >= COUNT_MS ? c.to.text : c.format(countValue, c.decimals, c.compactDigits, c.to.rep)
            if (c.el.textContent !== text) {
                c.el.textContent = text
                if (c.of) {
                    range.selectNodeContents(c.el)
                    c.of.style.transform = `translateX(${r3(range.getBoundingClientRect().width / scaleK - lockW)}px)`
                }
            }
        }
    }

    // The number box keeps the width of its final value while it counts (see start), "of" follows by transform.
    const endCount = () => {
        if (!count) return
        count.el.textContent = count.to.text
        count.el.style.width = ""
        if (count.of) count.of.style.transform = ""
        count.row?.classList.remove("us-snap")
        count = null
    }

    // Stops a transition or releases a held frame: the SVG is shown again and the canvas freed.
    const halt = () => {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        io?.disconnect()
        io = null
        unwatch?.()
        unwatch = null
        active = false
        stale = false
        if (hideEl) hideEl.style.visibility = ""
        hideEl = null
        endCount()
        canvas.width = canvas.height = 0
        canvas.style.width = canvas.style.height = "0px"
        canvas.style.left = canvas.style.top = ""
        parts = []
        onDone = null
    }

    // The canvas image no longer matches the page: a running transition ends on the SVG, a held frame goes now.
    const release = () => {
        if (active) stale = true
        else halt()
    }

    // Watches what the canvas image depends on, from the start of a transition until halt: the size of the
    // diagram area against its size at the start (layout px), color scheme, pixel density and the color values.
    // A theme switch can change a token without any media query, so each color sits on a hidden span inside
    // the diagram: when its value changes, the span's 1 ms color transition reports it (transitionrun).
    const watch = (el: HTMLElement, list: string[]) => {
        const w = el.offsetWidth
        const h = el.offsetHeight
        const ro =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(() => {
                      if (el.offsetWidth !== w || el.offsetHeight !== h) release()
                  })
        ro?.observe(el)
        const queries = ["(prefers-color-scheme: dark)", `(resolution: ${window.devicePixelRatio || 1}dppx)`].map((q) => window.matchMedia(q))
        for (const q of queries) q.addEventListener("change", release)
        const probe = document.createElement("span")
        probe.setAttribute("aria-hidden", "true")
        probe.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none"
        const spans = list.map((c) => {
            const s = document.createElement("span")
            s.style.setProperty("transition", "color 1ms linear", "important")
            s.style.color = c
            return probe.appendChild(s)
        })
        probe.addEventListener("transitionrun", release)
        el.appendChild(probe)
        // Reading each color now gives the span its start value, so even an immediate change runs the transition.
        for (const s of spans) getComputedStyle(s).color
        unwatch = () => {
            ro?.disconnect()
            for (const q of queries) q.removeEventListener("change", release)
            probe.removeEventListener("transitionrun", release)
            probe.remove()
        }
    }

    // End of a transition: the canvas keeps the last frame and the SVG stays hidden, so the next transition
    // starts on the same pixels. The SVG returns when the canvas can no longer match it: a new size, color
    // scheme, pixel density or color value (see watch; a change during the transition ends it on the SVG),
    // a changed story, reduced motion or unmount (all through halt).
    const settle = () => {
        if (!active) return
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        io?.disconnect()
        io = null
        draw(total)
        endCount()
        active = false
        sprites.clear()
        const cb = onDone
        onDone = null
        if (stale) halt()
        cb?.()
    }

    const frame = (now: number) => {
        raf = 0
        if (!active) return
        // The clock starts with the first animation frame, so a slow first frame never skips motion.
        if (t0 < 0) t0 = now
        const t = now - t0
        // Settle only once React has committed the target step (the commit runs as a transition).
        if (t >= total && (ready() || t > total + 1500)) return settle()
        draw(Math.min(t, total))
        raf = requestAnimationFrame(frame)
    }

    // Current state of all figures still on screen (an interrupted transition continues from here).
    const capture = (now: number): [Slot[], Part[]] => {
        const live: Slot[] = []
        const outs: Part[] = []
        for (const p of parts) {
            const s = stateOf(p, t0 < 0 ? 0 : now - t0)
            const slot = { x: s.x, y: s.y, s: s.s * s.sc, c: s.c, a: s.a, k: p.k, v: s.v }
            if (p.kind !== K_OUT) live.push(slot)
            else if (slot.s > 0.2) outs.push(mkPart(K_OUT, slot, slot, 0))
        }
        return [live, outs]
    }

    const start = (o: StartOptions): boolean => {
        try {
            const now = performance.now()
            const [live, outs] = o.from ? [o.from, []] : capture(now)
            halt()
            ctx = ctx ?? canvas.getContext("2d")
            if (!ctx) return false
            // Colors resolved by the browser (tokens, p3). One the canvas rejects means no flight: instant change.
            colors = o.colors.map((c) => {
                canvas.style.color = c
                return getComputedStyle(canvas).color
            })
            canvas.style.color = ""
            for (const c of colors) {
                ctx.fillStyle = "#010203"
                ctx.fillStyle = c
                if (ctx.fillStyle === "#010203" && c.replace(/\s/g, "") !== "rgb(1,2,3)") return false
            }
            if (o.image && !(o.image.naturalWidth > 0 && o.image.naturalHeight > 0)) return false
            image = o.image
            glyphs = o.glyphs && o.glyphs.length ? o.glyphs.map((d) => new Path2D(d)) : null
            if (!glyphs && !image) return false
            curve = curve ?? bezierCurve(256, 0.2, 0.8, 0.2, 1)
            tintCurve = tintCurve ?? bezierCurve(256, 0.3, 0.7, 0.2, 1)
            sprites.clear()
            parts = plan(live, o.to, o.identity).concat(outs)
            sizes = [Math.max(0.01, ...live.map((s) => s.s)), o.to.length ? o.to[0].s : 0.01]
            total = Math.max(0, ...parts.map((p) => p.delay + (p.kind === K_FLY ? FLY_MS : p.kind === K_OUT ? OUT_MS : p.kind === K_STAY ? 0 : p.kind === K_TINT ? TINT_MS : IN_MS)))
            count = o.count
            scaleK = o.scale
            if (count) {
                countValue = count.from
                total = Math.max(total, COUNT_MS)
                // The number counts in place instead of cross-fading two numbers.
                count.row?.classList.add("us-snap")
                // Its box keeps the width of the final value (the hidden target row shows it now), so nothing
                // around it moves; "of" moves only when it shares the line with the number.
                // Used width in layout px (free of ancestor transforms and of integer rounding).
                lockW = parseFloat(getComputedStyle(count.el).width) || count.el.getBoundingClientRect().width / o.scale
                count.el.style.width = `${lockW}px`
                if (count.of) {
                    const a = count.el.getBoundingClientRect()
                    const b = count.of.getBoundingClientRect()
                    if (b.left < a.right - 0.5 || b.top >= a.bottom) count.of = null
                }
            }
            // Slots are in local layout px. k: screen px per local px (ancestor zoom or scale transforms).
            const rect = o.host.getBoundingClientRect()
            const k = o.scale
            const real = window.devicePixelRatio || 1
            dpr = Math.min(2, Math.max(1, real)) * k
            // Snap the canvas origin to a device pixel, so the browser never resamples it.
            ox = (Math.floor(rect.left * real + 0.01) / real - rect.left) / k
            oy = (Math.floor(rect.top * real + 0.01) / real - rect.top) / k
            canvas.width = Math.max(1, Math.round((rect.width / k - ox) * dpr))
            canvas.height = Math.max(1, Math.round((rect.height / k - oy) * dpr))
            canvas.style.left = `${ox}px`
            canvas.style.top = `${oy}px`
            canvas.style.width = `${canvas.width / dpr}px`
            canvas.style.height = `${canvas.height / dpr}px`
            t0 = -1
            active = true
            onDone = o.onDone
            ready = o.ready
            // Frame 0 on the canvas, then hide the resting SVG in the same task: no visible hand-over.
            draw(0)
            hideEl = o.hide
            hideEl.style.visibility = "hidden"
            if (typeof IntersectionObserver !== "undefined") {
                io = new IntersectionObserver((entries) => {
                    if (!entries[entries.length - 1].isIntersecting) settle()
                })
                io.observe(o.watch)
            }
            watch(o.host, o.colors)
            raf = requestAnimationFrame(frame)
            return true
        } catch {
            halt()
            return false
        }
    }

    return {
        start,
        halt,
        running: () => active,
        shownCount: () => (active && count ? countValue : null),
    }
}

// ------------------------------------------------------------------ rendering helpers

/** Screen px per layout px of an element: 1 unless an ancestor is zoomed or scaled. */
function scaleOf(el: HTMLElement): number {
    const k = el.getBoundingClientRect().width / el.offsetWidth
    return Number.isFinite(k) && k > 0 ? k : 1
}

function pct(v: number): string {
    return `${Math.round(v * 100000) / 1000}%`
}

function r3(v: number): number {
    return Math.round(v * 1000) / 1000
}

// Custom figures load only from Framer's own asset host (File control) or the page's own origin: a path with exactly
// one leading slash (never protocol-relative) or an absolute URL on `origin`, which is known only after mount so the
// server and the first client render agree. Anything else is not loaded at all.
function safeFileUrl(u: unknown, origin: string): string | null {
    const s = typeof u === "string" ? u.trim() : ""
    if (/^https:\/\/framerusercontent\.com\//i.test(s)) return s
    if (origin && s.startsWith(`${origin}/`)) return s
    return s[0] === "/" && s[1] !== "/" && s[1] !== "\\" ? s : null
}

function cssRadius(v: unknown, fallback: string): string {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return `${v}px`
    const s = typeof v === "string" ? v.trim() : ""
    return /^(\d+(\.\d+)?(px|%)\s*){1,4}$/.test(s) ? s : fallback
}

/** Gap from Framer's Gap control: "Y X" (rows first), or one value for both. */
function cssGap(v: unknown, fallback: string): [string, string] {
    const pick = (x: unknown) => (typeof x === "string" ? x.trim() : "").split(/\s+/).filter((t) => /^\d+(\.\d+)?px$/.test(t))
    const parts = pick(v)
    if (parts.length === 1) return [parts[0], parts[0]]
    if (parts.length === 2) return [parts[0], parts[1]]
    const d = pick(fallback)
    return [d[0], d[1]]
}

function cssSize(v: unknown, fallback: number): string {
    if (typeof v === "number") return `${Number.isFinite(v) && v > 0 ? v : fallback}px`
    const s = typeof v === "string" ? v.trim() : ""
    return !s || parseFloat(s) <= 0 ? `${fallback}px` : s
}

function fontBase(f: CSSProperties | undefined, weight: number): CSSProperties {
    const o = f && typeof f === "object" ? f : {}
    return { fontFamily: o.fontFamily, fontStyle: o.fontStyle, fontWeight: o.fontWeight ?? weight }
}

function aspect(w: number, h: number): string {
    return `${r3(w)} / ${r3(h)}`
}

/** Instance-scoped CSS. "&" stands for the instance class. No characters React escapes in SSR (> " ' &). */
function buildCss(r: string, side: boolean): string {
    const mix = (p: number) => `color-mix(in srgb,var(--us-ink) ${p}%,transparent)`
    const id = r.slice(1)
    // Head, diagram, caption and foot stack in this order; side by side the head sits top left, the foot (legend
    // and steps) bottom left on the line of the diagram's lower edge, the diagram on the right, its caption below.
    const css = `&{position:relative;width:100%;container-type:inline-size;color:var(--us-ink);-webkit-tap-highlight-color:transparent}
& *,& ::before,& ::after{box-sizing:border-box}
& .us-fig{--us-nk:21cqi;margin:0;display:grid;grid-template-columns:minmax(0,1fr);align-items:start}
& .us-head{min-width:0;margin:0}
& .us-dia{margin-top:var(--us-gy,28px);position:relative;width:100%;min-width:0}
& .us-key{margin:12px 0 0;min-width:0;font-size:13px;line-height:18px;color:${mix(62)};overflow-wrap:anywhere}
& .us-foot{min-width:0;margin-top:calc(var(--us-gy,28px) * 6 / 7);display:flex;flex-direction:column;gap:calc(var(--us-gy,28px) * 6 / 7)}
& .us-stk{display:grid;align-items:start}
& .us-cl{grid-area:1 / 1;min-width:0}
& .us-it{opacity:0;visibility:hidden;transition:opacity 110ms ease,visibility 0s linear 110ms}
& .us-it.us-on{opacity:1;visibility:visible;transition:opacity 220ms ease 90ms,visibility 0s}
& .us-lb.us-on{transition-delay:360ms,0s}
& .us-snap .us-it,& .us-snap .us-it.us-on{transition:none}
& .us-nrow{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:14px;row-gap:4px}
& .us-num{display:block;white-space:nowrap;font-variant-numeric:tabular-nums}
& .us-of{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere;color:${mix(62)};font-variant-numeric:tabular-nums}
& .us-body{margin-top:22px}
& .us-first{margin-top:0}
& .us-st{display:block;margin:0;overflow-wrap:break-word}
& .us-lg{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:10px 22px}
& .us-lr{display:flex;align-items:center;gap:9px;min-width:0;font-size:15px;line-height:20px;color:${mix(75)}}
& .us-g{flex:none;display:block;width:15px;height:15px;overflow:visible}
& .us-lr .us-l{min-width:0;overflow-wrap:anywhere}
& .us-lr .us-v{flex:none;font-weight:600;color:var(--us-ink);font-variant-numeric:tabular-nums}
& .us-nav{display:flex;align-items:center;gap:11px;width:100%;min-height:44px}
& .us-btn{appearance:none;-webkit-appearance:none;margin:0;padding:0;width:44px;height:44px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:var(--us-br,12px);background:${mix(6)};color:inherit;font:inherit;cursor:pointer;touch-action:manipulation;transition:background-color 150ms ease,opacity 150ms ease}
& .us-btn svg{display:block;width:18px;height:18px}
& .us-btn:focus-visible{outline:2px solid var(--us-acc);outline-offset:3px}
& .us-btn:disabled{cursor:default;opacity:.35}
@media (hover:hover){& .us-btn:not(:disabled):hover{background:${mix(11)}}& button.us-sb:not(.us-cur):not(.us-full):hover .us-bar{background:${mix(34)}}}
& .us-btn:not(:disabled):active{background:${mix(15)}}
& .us-seg{display:flex;flex:1 1 auto;min-width:0}
& .us-sb{appearance:none;-webkit-appearance:none;position:relative;flex:1 1 0;min-width:0;height:44px;margin:0;padding:0 3px;border:0;background:transparent;color:inherit;font:inherit;display:flex;align-items:center;cursor:pointer;touch-action:manipulation}
& span.us-sb{cursor:default}
& .us-bw{display:flex;align-items:center;width:100%;height:22px;border-radius:6px}
& .us-bar{position:relative;display:block;width:100%;height:3px;border-radius:2px;background:${mix(16)};overflow:hidden;transition:background-color 300ms ease}
& .us-full .us-bar{background:var(--us-ink);transition:none}
& .us-sb:focus-visible{outline:none}
& .us-sb:focus-visible .us-bw{outline:2px solid var(--us-acc);outline-offset:3px}
& .us-nav[data-pointer] .us-btn:focus-visible,& .us-nav[data-pointer] .us-sb:focus-visible .us-bw{outline:none}
& .us-fill{position:absolute;left:0;top:0;width:100%;height:100%;background:var(--us-ink);transform:scaleX(0);transform-origin:0 50%}
& .us-run{animation:${id}-fill var(--us-int) linear forwards}
& .us-pause{animation-play-state:paused}
@keyframes ${id}-fill{to{transform:scaleX(1)}}
@container (min-width:${SIDE_FROM}px){& .us-nav{justify-content:flex-start}& .us-seg{flex:0 1 166px}}
& .us-ph{visibility:hidden}
& .us-bk+.us-bk{margin-top:16px}
& .us-bsp,& .us-bl{height:24px}
& .us-band{margin-top:8px}
& .us-bl{display:flex;align-items:center;font-size:15px;line-height:24px;white-space:nowrap;min-width:0}
& .us-bl .us-l{overflow:hidden;text-overflow:ellipsis;min-width:0}
& .us-bl .us-v{flex:none;white-space:pre;font-variant-numeric:tabular-nums}
& svg.us-fg{display:block;overflow:visible}
& .us-cv{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}
& .us-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
& .us-hint{position:absolute;left:0;bottom:0;max-width:100%;padding:6px 10px;border-radius:4px;background:rgba(255,255,255,.94);color:rgb(28,27,25);box-shadow:0 0 0 1px rgba(28,27,25,.16);font:13px/18px system-ui,sans-serif;pointer-events:none;z-index:1}
& .us-hint p{margin:0}
& .us-pre use,& .us-grow use{transform-box:view-box}
& .us-pre use{opacity:0;transform:scale(.6)}
& .us-grow use{animation:${id}-grow ${REVEAL_MS}ms cubic-bezier(.2,.8,.2,1) both}
@keyframes ${id}-grow{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){& .us-pre use{opacity:1;transform:none}& .us-grow use{animation:none}}
@media (prefers-reduced-motion:reduce){& .us-it,& .us-it.us-on,& .us-btn,& .us-bar{transition:none}& .us-body .us-it{transition:opacity 60ms ease,visibility 0s linear 60ms}& .us-body .us-it.us-on{transition:opacity 120ms ease,visibility 0s}}
${side ? `@container (min-width:${SIDE_FROM}px){& .us-fig{--us-gap:clamp(min(32px,var(--us-gx,96px)),7cqi,var(--us-gx,96px));--us-dc:min(calc((100cqi - var(--us-gap)) * 7 / 12),var(--us-dmax,100cqi));--us-col:calc(100cqi - var(--us-gap) - var(--us-dc));--us-nk:13cqi;grid-template-columns:minmax(0,1fr) var(--us-dc);grid-template-rows:auto 1fr auto;column-gap:var(--us-gap)}& .us-head{grid-column:1;grid-row:1}& .us-foot{grid-column:1;grid-row:2;align-self:end;margin-top:var(--us-gy,28px);gap:var(--us-gy,28px)}& .us-dia{grid-column:2;grid-row:1 / span 2;align-self:end;margin-top:0}& .us-key{grid-column:2;grid-row:3;margin-top:14px}& .us-st{max-width:22ch}}@container (min-width:${MAX_WIDTH + 1}px){& .us-fig{--us-col:calc(${MAX_WIDTH}px - var(--us-gap) - var(--us-dc));--us-nk:${r3(MAX_WIDTH * 0.13)}px;grid-template-columns:minmax(0,var(--us-col)) var(--us-dc);justify-content:center}}` : ""}`
    return css.split("&").join(r)
}

// ------------------------------------------------------------------ component

// Layout effects only in the browser: on the server they would warn and do nothing.
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 592
 * @framerDisableUnlink
 */
export default function UnitStory(props: Props) {
    const { steps = DEFAULT_STEPS, step = 1, playback, figures, layout, colors, fonts, look, labels, onFinish, style } = props
    const { mode = "auto", interval = 4, grow = true } = playback || {}
    const { shape = "bust", file, scale = "auto" } = figures || {}
    const { direction = "side", showNumber = true } = layout || {}
    const { groups = DEFAULT_PALETTE, base = DEFAULT_BASE, text = DEFAULT_TEXT } = colors || {}
    const { number: numberFont, text: textFont } = fonts || {}
    const { radius = DEFAULT_RADIUS, gap = DEFAULT_GAP } = look || {}
    const [gapY, gapX] = cssGap(gap, DEFAULT_GAP)
    const {
        unitOne = "one person",
        unitMany = "people",
        ofTotal = "of {total}",
        stepOf = "Step {n} of {count}",
        previous = "Previous step",
        next = "Next step",
        replay = "Start over",
        caption = "Each figure is {unit}",
        steps: stepsName = "Story steps",
    } = labels || {}
    // Button names and the announcement never end up empty: an empty label falls back to the default.
    const nameOf = (v: unknown, fallback: string) => str(v, "").trim() || fallback
    const prevLabel = nameOf(previous, "Previous step")
    const nextLabel = nameOf(next, "Next step")
    const replayLabel = nameOf(replay, "Start over")
    const stepOfLabel = nameOf(stepOf, "Step {n} of {count}")

    const isStatic = useIsStaticRenderer()
    const target = RenderTarget.current()
    const isCanvas = target === RenderTarget.canvas
    // The thumbnail is treated as static too: it must never catch a half transition.
    const still = isStatic || target === RenderTarget.thumbnail
    const reduced = useReducedMotion() === true
    const locale = useLocaleInfo()?.activeLocale?.code || "en-US"
    const uid = `us${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

    const [origin, setOrigin] = useState("")
    useEffect(() => setOrigin(window.location.origin), [])
    const fileUrl = shape === "custom" ? safeFileUrl(file, origin) : null
    // Bust sits in taller rows (32 / 26 of the cell width); every other figure in square cells.
    const ar = shape === "bust" ? BUST_PITCH : 1
    const intervalMs = Math.round(Math.min(12, Math.max(1.5, typeof interval === "number" && Number.isFinite(interval) ? interval : 4)) * 1000)

    const modelInput = JSON.stringify({
        steps: Array.isArray(steps) ? steps.filter((s) => !!s && typeof s === "object") : [],
        scaleKey: str(scale, "auto"),
        palette: Array.isArray(groups) ? groups.filter((g) => typeof g === "string" && g.trim() !== "") : [],
        base: str(base, DEFAULT_BASE),
        locale,
        unitOne: str(unitOne, ""),
        unitMany: str(unitMany, ""),
        ofTotal: str(ofTotal, ""),
        caption: str(caption, ""),
        ar,
    })
    const model = useMemo(() => buildModel(JSON.parse(modelInput) as ModelInput), [modelInput])
    const count = model.steps.length
    const navigable = !model.empty && count > 1
    const last = count - 1
    const propIndex = Math.min(Math.max(1, typeof step === "number" && Number.isFinite(step) ? Math.round(step) : 1), Math.max(1, count)) - 1

    // ---------------------------------------------------------------- custom figure probe
    // One load probe, also on the canvas: a broken file, or one that has not loaded after IMAGE_TIMEOUT_MS, falls
    // back to dots instead of empty masks. The first result wins; the page never waits on it.
    const [probe, setProbe] = useState<{ url: string; ok: boolean; why: "" | "error" | "timeout" }>({ url: "", ok: false, why: "" })
    const imageRef = useRef<HTMLImageElement | null>(null)
    useEffect(() => {
        if (!fileUrl) return
        let alive = true
        const im = new Image()
        const done = (ok: boolean, why: "" | "error" | "timeout") => () => {
            if (!alive) return
            alive = false
            window.clearTimeout(timer)
            im.onload = im.onerror = null
            imageRef.current = ok ? im : null
            setProbe({ url: fileUrl, ok, why })
        }
        const timer = window.setTimeout(done(false, "timeout"), IMAGE_TIMEOUT_MS)
        im.onload = done(true, "")
        // An unsupported or broken file fails here at once, without waiting for the time limit.
        im.onerror = done(false, "error")
        im.src = fileUrl
        return () => {
            alive = false
            window.clearTimeout(timer)
            im.onload = im.onerror = null
        }
    }, [fileUrl])
    const customState = !fileUrl ? "none" : probe.url !== fileUrl ? "wait" : probe.ok ? "ok" : "bad"
    const useCustom = !!fileUrl && customState !== "bad"
    const glyphShape: Glyph = shape !== "custom" && shape in GLYPHS ? shape : "dot"
    const glyphList = useCustom ? null : (VARIANTS[glyphShape] ?? [GLYPHS[glyphShape]])
    const nVar = glyphList ? glyphList.length : 1
    const figSize = glyphShape === "bust" && !useCustom ? BUST_SIZE : useCustom || (glyphShape !== "dot" && glyphShape !== "square") ? 0.8 : 0.7

    // ---------------------------------------------------------------- state
    const [cur, setCur] = useState(propIndex)
    const [announce, setAnnounce] = useState("")
    const [autoRun, setAutoRun] = useState(mode === "auto" && navigable && !still && propIndex < last)
    const [paused, setPaused] = useState(true)
    // Bumped by every press while auto-play runs: the current bar and the timer start again from zero.
    const [runId, setRunId] = useState(0)
    const shown = still ? propIndex : Math.min(Math.max(0, cur), Math.max(0, last))
    const curRef = useRef(shown)
    curRef.current = shown
    const autoActive = autoRun && mode === "auto" && navigable && !still
    // First appearance: hidden until the section is in view, then the figures grow in one after another.
    const growOn = grow !== false && !still && !reduced && !model.empty
    const [growPhase, setGrowPhase] = useState<"off" | "pre" | "run">("off")
    const grownRef = useRef(false)

    const rootRef = useRef<HTMLDivElement | null>(null)
    const diaRef = useRef<HTMLDivElement | null>(null)
    const figRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const prevRef = useRef<HTMLButtonElement | null>(null)
    const nextRef = useRef<HTMLButtonElement | null>(null)
    // Time of the last press on the step buttons: a focus ring shows only after keyboard use.
    const navPointerAt = useRef(0)
    const moverRef = useRef<Mover | null>(null)
    const onFinishRef = useRef(onFinish)
    const reducedRef = useRef(reduced)
    const goRef = useRef<(to: number, source: Source) => void>(() => undefined)

    const symId = `${uid}-f`
    const maskId = `${uid}-m`
    const symHref = `#${symId}`

    // Slots in px relative to the diagram area, read once from the reserved placeholders.
    const slotsFor = (i: number): Slot[] => {
        const dia = diaRef.current
        const st = model.steps[i]
        const out: Slot[] = []
        if (!dia || !st) return out
        const origin = dia.getBoundingClientRect()
        const k = scaleOf(dia)
        const add = (sel: string, pack: Pack, w: number, from: number) => {
            const el = dia.querySelector(sel)
            if (!el) return
            const r = el.getBoundingClientRect()
            const cell = r.width / k / w
            pack.xs.forEach((x, j) => {
                const g = st.kind === "empty" ? null : st.groups[st.seq[from + j]]
                out.push({
                    x: (r.left - origin.left) / k + (x + 0.5) * cell,
                    y: (r.top - origin.top) / k + (pack.ys[j] + ar / 2) * cell,
                    s: figSize * cell,
                    c: g ? g.color : 0,
                    a: g ? 1 : EMPTY_ALPHA,
                    k: g ? g.key : "_",
                    v: variantOf(j, nVar),
                })
            })
        }
        if (st.apart) {
            let from = 0
            st.apart.bands.forEach((b, k) => {
                add(`[data-ph="${i}-${k}"]`, b, st.apart ? st.apart.wa : 1, from)
                from += b.xs.length
            })
        } else if (st.pack) add(`[data-ph="${i}"]`, st.pack, st.pack.w, 0)
        return out
    }

    const goTo = (to: number, source: Source) => {
        if (still || !navigable) return
        const dest = Math.min(Math.max(0, to), last)
        const from = curRef.current
        const mover = moverRef.current ?? (canvasRef.current ? createMover(canvasRef.current) : null)
        moverRef.current = mover
        if (dest === from && !mover?.running()) return
        const a = model.steps[from]
        const b = model.steps[dest]
        if (source !== "auto") {
            const head = stepOfLabel.split("{n}").join(String(dest + 1)).split("{count}").join(String(count))
            const num = b.number ? `${b.number.text}${b.ofText ? ` ${b.ofText}` : ""}` : ""
            setAnnounce([`${[head, num].filter(Boolean).join(": ")}.`, b.text].filter((s) => s && s !== ".").join(" "))
        }
        const done = () => {
            if (dest === last) onFinishRef.current?.()
        }
        let started = false
        const root = rootRef.current
        if (mover && root && figRef.current && diaRef.current && a && b && !reducedRef.current && (!useCustom || customState === "ok")) {
            const numEl = root.querySelector<HTMLElement>(`[data-num="${dest}"]`)
            const shownCount = mover.shownCount()
            started = mover.start({
                from: mover.running() ? null : slotsFor(from),
                to: slotsFor(dest),
                identity: !a.apart && !b.apart,
                colors: model.colorList,
                glyphs: glyphList,
                image: useCustom ? imageRef.current : null,
                hide: figRef.current,
                host: diaRef.current,
                watch: root,
                count:
                    showNumber && numEl && a.number && b.number && a.number.rep === b.number.rep && a.number.value !== b.number.value
                        ? {
                              el: numEl,
                              of: root.querySelector<HTMLElement>(`[data-of="${dest}"]`),
                              row: root.querySelector<HTMLElement>(".us-nr"),
                              from: shownCount ?? a.number.value,
                              to: b.number,
                              decimals: Math.max(a.number.decimals, b.number.decimals),
                              compactDigits: Math.max(a.number.compactDigits, b.number.compactDigits),
                              format: model.format,
                          }
                        : null,
                scale: scaleOf(diaRef.current),
                ready: () => figRef.current?.dataset.step === String(dest),
                onDone: done,
            })
        } else mover?.halt()
        curRef.current = dest
        setGrowPhase("off")
        // The new resting SVG (up to 1,500 figures) renders as a transition, sliced, while the canvas moves.
        startTransition(() => setCur(dest))
        if (!started) done()
    }

    useEffect(() => {
        goRef.current = goTo
        onFinishRef.current = onFinish
        reducedRef.current = reduced
    })

    // The Step property animates after mount (variants, Scroll Variants).
    const prevProp = useRef(propIndex)
    useEffect(() => {
        if (prevProp.current === propIndex) return
        prevProp.current = propIndex
        if (still) return
        setAutoRun(false)
        goRef.current(propIndex, "prop")
    }, [propIndex, still])

    // A changed story or figure ends a transition or releases the held frame; unmount frees the canvas.
    useEffect(() => () => moverRef.current?.halt(), [model, glyphShape, fileUrl, useCustom])

    // Auto-play once when the section becomes visible; pauses offscreen and in hidden tabs. Each step stands for one
    // interval while its bar fills; after the last bar the run ends and every bar stays full.
    useEffect(() => {
        const root = rootRef.current
        if (!autoActive || !root || typeof IntersectionObserver === "undefined") return
        if (reduced) return setAutoRun(false)
        let visible = false
        let timer = 0
        let startedAt = 0
        let remaining = intervalMs
        const sync = () => {
            const run = visible && !document.hidden
            if (run && !timer) {
                startedAt = performance.now()
                timer = window.setTimeout(fire, remaining)
                setPaused(false)
            } else if (!run && timer) {
                window.clearTimeout(timer)
                timer = 0
                remaining = Math.max(0, remaining - (performance.now() - startedAt))
                setPaused(true)
            }
        }
        const fire = () => {
            timer = 0
            remaining = intervalMs
            if (curRef.current >= last) return setAutoRun(false)
            goRef.current(curRef.current + 1, "auto")
            sync()
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    const viewH = e.rootBounds ? e.rootBounds.height : 0
                    visible = e.isIntersecting && (e.intersectionRatio >= 0.35 || (viewH > 0 && e.intersectionRect.height >= viewH * 0.5))
                }
                sync()
            },
            { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] },
        )
        io.observe(root)
        document.addEventListener("visibilitychange", sync)
        return () => {
            io.disconnect()
            document.removeEventListener("visibilitychange", sync)
            window.clearTimeout(timer)
        }
    }, [autoActive, intervalMs, last, reduced, runId])

    useClientLayoutEffect(() => {
        const root = rootRef.current
        if (!growOn || grownRef.current || !root || typeof IntersectionObserver === "undefined") return
        grownRef.current = true
        setGrowPhase("pre")
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    const viewH = e.rootBounds ? e.rootBounds.height : 0
                    if (e.isIntersecting && (e.intersectionRatio >= 0.35 || (viewH > 0 && e.intersectionRect.height >= viewH * 0.5))) {
                        io.disconnect()
                        setGrowPhase((p) => (p === "pre" ? "run" : p))
                        return
                    }
                }
            },
            { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] },
        )
        io.observe(root)
        return () => io.disconnect()
    }, [growOn])

    // Reduced motion or a static render switched on later: show everything at once.
    useEffect(() => {
        if (!growOn) setGrowPhase("off")
    }, [growOn])

    useClientLayoutEffect(() => {
        if (growPhase !== "run") return
        const uses = figRef.current ? Array.from(figRef.current.querySelectorAll<SVGUseElement>("use")) : []
        // Row by row from the top left (45 ms per row, 12 ms per column), at most REVEAL_SPREAD_MS for the whole chart.
        const delays = uses.map((u) => (u.y.baseVal.value / ar) * REVEAL_ROW_MS + u.x.baseVal.value * REVEAL_COL_MS)
        const most = Math.max(0, ...delays)
        const k = most > REVEAL_SPREAD_MS ? REVEAL_SPREAD_MS / most : 1
        // Each figure rises from the middle of its foot, given in view box units (x and y are not part of its box).
        uses.forEach((u, i) => {
            u.style.transformOrigin = `${r3(u.x.baseVal.value + u.width.baseVal.value / 2)}px ${r3(u.y.baseVal.value + u.height.baseVal.value)}px`
            u.style.animationDelay = `${Math.round(delays[i] * k)}ms`
        })
        const timer = window.setTimeout(() => setGrowPhase("off"), Math.round(most * k) + REVEAL_MS + 60)
        return () => {
            window.clearTimeout(timer)
            for (const u of uses) {
                u.style.animationDelay = ""
                u.style.transformOrigin = ""
            }
        }
    }, [growPhase, ar])

    // In auto-play the arrows and bars keep the run going: the step they land on starts its bar from zero.
    const restartRun = () => {
        setRunId((n) => n + 1)
        setPaused(true)
    }
    const onPrev = () => {
        if (still) return
        restartRun()
        // Previous is disabled on step 1: keyboard focus moves on to Next instead of falling back to the page.
        if (curRef.current <= 1 && prevRef.current?.matches(":focus")) nextRef.current?.focus()
        goTo(curRef.current - 1, "user")
    }
    const onStep = (i: number) => {
        if (still || i === curRef.current) return
        restartRun()
        goTo(i, "user")
    }
    const onNext = () => {
        if (still) return
        const replaying = curRef.current >= last
        // "Start over" restarts the auto-play run in auto mode with every bar empty.
        if (replaying) setAutoRun(mode === "auto" && !reducedRef.current)
        restartRun()
        goTo(replaying ? 0 : curRef.current + 1, "user")
    }

    // ---------------------------------------------------------------- styles
    const numberStyle: CSSProperties = {
        ...fontBase(numberFont, 600),
        letterSpacing: numberFont?.letterSpacing ?? "-0.045em",
        lineHeight: numberFont?.lineHeight ?? "0.86em",
        // Never wider than the text column: the widest value of all steps decides.
        fontSize: `min(${cssSize(numberFont?.fontSize, NUMBER_SIZE)}, var(--us-nk), calc(var(--us-col, 100cqi) / ${r3(0.62 * Math.max(1, model.maxChars))}))`,
    }
    const textSize = `min(${cssSize(textFont?.fontSize, TEXT_SIZE)}, 6cqi)`
    const textStyle: CSSProperties = {
        fontWeight: textFont?.fontWeight ?? 500,
        letterSpacing: textFont?.letterSpacing ?? "-0.015em",
        lineHeight: textFont?.lineHeight ?? "1.28em",
        fontSize: textSize,
    }
    const ofStyle: CSSProperties = { fontWeight: 500, letterSpacing: "-0.01em", fontSize: `calc(${textSize} * 0.82)` }
    const css = useMemo(() => buildCss(`.${uid}`, direction !== "stacked"), [uid, direction])
    const active = model.steps[shown]

    // ---------------------------------------------------------------- diagram
    const wbox = model.box.w
    const off = (1 - figSize) / 2
    const offY = (ar - figSize) / 2
    const hrefOf = (i: number) => {
        const v = variantOf(i, nVar)
        return v ? `${symHref}-${v}` : symHref
    }
    const figureSvg = (pack: Pack, runs: { color: number; alpha: number; from: number; to: number }[], extra?: CSSProperties, cls = "us-fg") => (
        <svg className={cls} viewBox={`0 0 ${r3(pack.w)} ${r3(pack.h)}`} style={{ aspectRatio: aspect(pack.w, pack.h), ...extra }} focusable="false">
            {runs.map((run) => (
                <g key={run.from} fill={model.colorList[run.color]} opacity={run.alpha < 1 ? run.alpha : undefined}>
                    {pack.xs.slice(run.from, run.to).map((x, j) => (
                        <use key={j} href={hrefOf(run.from + j)} x={r3(x + off)} y={r3(pack.ys[run.from + j] + offY)} width={figSize} height={figSize} />
                    ))}
                </g>
            ))}
        </svg>
    )

    // Apart is drawn in three layers with identical geometry: placeholder, labels, figures.
    const apartLayer = (st: StepView, i: number, layer: "ph" | "lb" | "fig") => {
        const ap = st.apart
        if (!ap) return null
        const width = pct((ap.scale * ap.wa) / wbox)
        return ap.bands.map((b, k) => {
            const g = st.groups[k]
            const n = b.xs.length
            const box = { width, aspectRatio: aspect(ap.wa, b.h) }
            return (
                <div className="us-bk" key={k}>
                    {layer === "lb" ? (
                        <div className="us-bl">
                            {g.label ? <span className="us-l">{g.label}</span> : null}
                            {g.label && g.key === st.bigKey ? null : <span className="us-v">{g.label ? `\u00a0\u00b7\u00a0${g.valueText}` : g.valueText}</span>}
                        </div>
                    ) : (
                        <div className="us-bsp" />
                    )}
                    {n === 0 ? null : layer === "fig" ? (
                        figureSvg({ ...b, w: ap.wa }, [{ color: g.color, alpha: 1, from: 0, to: n }], box, "us-fg us-band")
                    ) : (
                        <div className="us-band" data-ph={layer === "ph" ? `${i}-${k}` : undefined} style={box} />
                    )}
                </div>
            )
        })
    }

    const figuresNode = useMemo(() => {
        const st = model.steps[shown]
        if (!st || st.kind === "zero" || !st.pack) return null
        if (st.apart) return apartLayer(st, shown, "fig")
        const runs: { color: number; alpha: number; from: number; to: number }[] = []
        if (st.kind === "empty") runs.push({ color: 0, alpha: EMPTY_ALPHA, from: 0, to: st.pack.xs.length })
        else {
            let from = 0
            for (const g of st.groups) {
                if (g.figures > 0) runs.push({ color: g.color, alpha: 1, from, to: from + g.figures })
                from += g.figures
            }
        }
        return figureSvg(st.pack, runs, { width: pct(st.pack.w / wbox) })
        // apartLayer and figureSvg only read values that are part of these dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model, shown, figSize, symHref, nVar, ar])

    // ---------------------------------------------------------------- render
    const anyNumber = showNumber && model.steps.some((s) => s.number)
    const anyText = model.steps.some((s) => s.text.trim() !== "")
    const legendOf = (s: StepView) => (s.apart ? [] : s.groups.filter((g) => g.label))
    const anyLegend = model.steps.some((s) => legendOf(s).length > 0)
    const textIndex = model.empty ? 0 : shown
    const stepName = (i: number) => stepOfLabel.split("{n}").join(String(i + 1)).split("{count}").join(String(count))

    // All steps are rendered on top of each other in one grid cell; only the active one is visible.
    const stack = (name: string, item: (s: StepView, i: number, cls: string) => ReactNode, on = (i: number) => i === textIndex, first = false) => (
        <div className={`us-stk us-${name}${first ? " us-first" : ""}`}>{model.steps.map((s, i) => item(s, i, `us-cl us-it${on(i) ? " us-on" : ""}`))}</div>
    )

    // The symbol maps its 2..22 content box onto the <use> box, so icons use a 0..20 view box.
    const icon = (color: string, outlined: boolean) => (
        <svg className="us-g" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            {outlined && useCustom ? (
                <circle cx="10" cy="10" r="8.4" fill="none" stroke={color} strokeWidth="1.6" />
            ) : outlined ? (
                <use href={symHref} x="1" y="1" width="18" height="18" fill="none" stroke={color} strokeWidth="1.8" />
            ) : (
                <use href={symHref} width="20" height="20" fill={color} />
            )}
        </svg>
    )

    const glyph = (d: string) => (
        <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )

    const hintList = isCanvas
        ? [
              ...model.hints,
              // Why a custom figure does not show, so the designer knows what to fix (visitors just see dots).
              ...(shape === "custom" && !fileUrl && (origin || !str(file, "").trim()) ? [str(file, "").trim() ? "Custom figure: only files uploaded in Framer or from this site load, dots are shown." : "Custom figure: add an SVG or PNG file."] : []),
              ...(customState === "bad" ? [probe.why === "timeout" ? `Custom figure: the file did not load within ${IMAGE_TIMEOUT_MS / 1000} s, dots are shown.` : "Custom figure: the file did not load or is not a valid SVG or PNG, dots are shown."] : []),
          ]
        : []

    // Step bars: buttons with the step name, or plain marks in Step property mode (only the Step value steps).
    // Bar k belongs to step k. Bars of earlier steps are full, later ones empty; the current bar fills over the
    // interval in auto-play and is full otherwise (on tap, Step property, reduced motion, after the run).
    const bar = (i: number) => {
        const filling = autoActive && i === shown
        const inner = (
            <span className="us-bw">
                <span className="us-bar">{filling ? <span key={`${shown}-${runId}`} className={`us-fill us-run${paused ? " us-pause" : ""}`} /> : null}</span>
            </span>
        )
        const cls = `us-sb${i === shown ? " us-cur" : ""}${i < shown || (i === shown && !filling) ? " us-full" : ""}`
        return mode === "prop" ? (
            <span key={i} className={cls} aria-hidden="true">
                {inner}
            </span>
        ) : (
            <button key={i} type="button" className={cls} aria-label={stepName(i)} aria-current={i === shown ? "step" : undefined} onClick={() => onStep(i)}>
                {inner}
            </button>
        )
    }

    const nav = navigable ? (
        <div
            className="us-nav"
            onPointerDown={(e) => {
                navPointerAt.current = Date.now()
                e.currentTarget.setAttribute("data-pointer", "")
            }}
            onKeyDown={(e) => e.currentTarget.removeAttribute("data-pointer")}
            onFocus={(e) => {
                // Focus moved inside the row (Previous hands it to Next) keeps the mark, however long the press.
                const from = e.relatedTarget as Node | null
                if (from && e.currentTarget.contains(from)) return
                if (Date.now() - navPointerAt.current > 600) e.currentTarget.removeAttribute("data-pointer")
            }}
            onBlur={(e) => {
                const to = e.relatedTarget as Node | null
                if (!to || !e.currentTarget.contains(to)) e.currentTarget.removeAttribute("data-pointer")
            }}
        >
            {mode !== "prop" ? (
                <button ref={prevRef} type="button" className="us-btn" aria-label={prevLabel} disabled={shown === 0} onClick={onPrev}>
                    {glyph("M11 4 6 9l5 5")}
                </button>
            ) : null}
            {mode !== "prop" ? (
                // The step bars as one named group for screen readers (FP-6); in Step property mode they are only marks.
                <div className="us-seg" role="group" aria-label={nameOf(stepsName, "Story steps")}>
                    {model.steps.map((_, i) => bar(i))}
                </div>
            ) : (
                <div className="us-seg">{model.steps.map((_, i) => bar(i))}</div>
            )}
            {mode !== "prop" ? (
                <button ref={nextRef} type="button" className="us-btn" aria-label={shown >= last ? replayLabel : nextLabel} onClick={onNext}>
                    {glyph(shown >= last ? "M3.5 9a5.5 5.5 0 1 0 1.7-4M3.5 3v3.5H7" : "m7 4 5 5-5 5")}
                </button>
            ) : (
                <span className="us-sr">{stepName(shown)}</span>
            )}
        </div>
    ) : null

    return (
        <div ref={rootRef} className={uid} style={{ "--us-ink": str(text, DEFAULT_TEXT), "--us-acc": model.colorList[1] ?? str(text, DEFAULT_TEXT), "--us-int": `${intervalMs}ms`, "--us-br": cssRadius(radius, DEFAULT_RADIUS), "--us-gy": gapY, "--us-gx": gapX, fontFamily: textFont?.fontFamily, fontStyle: textFont?.fontStyle, fontWeight: 400, ...style } as CSSProperties}>
            <style>{css}</style>
            {/* Defs live in their own always visible 0 x 0 SVG: masks never inherit a hidden step. */}
            <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", overflow: "hidden" }}>
                <defs>
                    {useCustom && fileUrl ? (
                        <mask id={maskId} maskContentUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
                            <image href={fileUrl} x="2" y="2" width="20" height="20" preserveAspectRatio="xMidYMid meet" />
                        </mask>
                    ) : null}
                    <symbol id={symId} viewBox="2 2 20 20">
                        {useCustom ? <rect x="2" y="2" width="20" height="20" mask={`url(#${maskId})`} /> : <path d={GLYPHS[glyphShape]} />}
                    </symbol>
                    {glyphList
                        ? glyphList.slice(1).map((d, i) => (
                              <symbol key={i} id={`${symId}-${i + 1}`} viewBox="2 2 20 20">
                                  <path d={d} />
                              </symbol>
                          ))
                        : null}
                </defs>
            </svg>
            {/* Diagram column fits the diagram (at most 7/12): its largest width comes from MAX_CELL_PX, the text column takes the rest. */}
            <figure className="us-fig" style={{ "--us-dmax": `${r3(wbox * MAX_CELL_PX)}px` } as CSSProperties}>
                {anyNumber || anyText ? (
                    <figcaption className="us-head">
                        {anyNumber
                            ? stack(
                                  "nr",
                                  (s, i, cls) => (
                                      <div key={i} className={`us-nrow ${cls}`}>
                                          <span className="us-num" data-num={i} style={{ ...numberStyle, color: s.numColor ? model.colorList[s.numColor] : undefined }}>
                                              {s.number ? s.number.text : ""}
                                          </span>
                                          {s.ofText ? (
                                              <span className="us-of" data-of={i} style={ofStyle}>
                                                  {s.ofText}
                                              </span>
                                          ) : null}
                                      </div>
                                  ),
                                  (i) => i === textIndex && !model.empty,
                                  true,
                              )
                            : null}
                        {anyText
                            ? stack(
                                  "body",
                                  (s, i, cls) => (
                                      <p key={i} className={`us-st ${cls}`} style={textStyle}>
                                          {s.text}
                                      </p>
                                  ),
                                  undefined,
                                  !anyNumber,
                              )
                            : null}
                    </figcaption>
                ) : null}
                <div ref={diaRef} className="us-dia" style={{ maxWidth: `${r3(wbox * MAX_CELL_PX)}px` }}>
                    {/* The image role sits on the figures only: its children are presentational, a button inside would be nested. */}
                    <div className="us-stk" role="img" aria-label={active ? active.summary : "No data yet."}>
                        {model.steps.map((st, i) =>
                            st.kind === "zero" || !st.pack ? null : st.apart ? (
                                <div className="us-ph us-cl" key={i} aria-hidden="true">
                                    {apartLayer(st, i, "ph")}
                                </div>
                            ) : (
                                <div className="us-ph us-cl" key={i} aria-hidden="true" data-ph={i} style={{ width: pct(st.pack.w / wbox), aspectRatio: aspect(st.pack.w, st.pack.h) }} />
                            ),
                        )}
                        {model.steps.map((st, i) =>
                            st.apart ? (
                                <div className={`us-cl us-it us-lb${i === shown ? " us-on" : ""}`} key={`l${i}`} aria-hidden="true">
                                    {apartLayer(st, i, "lb")}
                                </div>
                            ) : null,
                        )}
                        <div ref={figRef} className={growPhase === "pre" ? "us-cl us-pre" : growPhase === "run" ? "us-cl us-grow" : "us-cl"} data-step={shown}>
                            {model.empty && !count ? figureSvg(model.box, [{ color: 0, alpha: EMPTY_ALPHA, from: 0, to: 100 }], { width: "100%" }) : figuresNode}
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="us-cv" width={0} height={0} aria-hidden="true" />
                </div>
                {model.empty || !model.caption ? null : <p className="us-key">{model.caption}</p>}
                {anyLegend || nav ? (
                    <div className="us-foot">
                        {anyLegend
                            ? stack("lgs", (s, i, cls) => (
                                  <ul key={i} className={`us-lg ${cls}`}>
                                      {legendOf(s).map((g, k) => (
                                          <li className="us-lr" key={k}>
                                              {icon(model.colorList[g.color], g.figures === 0)}
                                              <span className="us-l">{g.label}</span>
                                              <span className="us-v">{g.valueText}</span>
                                          </li>
                                      ))}
                                  </ul>
                              ))
                            : null}
                        {nav}
                    </div>
                ) : null}
            </figure>
            <p className="us-sr" aria-live="polite">
                {announce}
            </p>
            {hintList.length ? (
                <div className="us-hint" aria-hidden="true">
                    {hintList.slice(0, 3).map((h) => (
                        <p key={h}>{h}</p>
                    ))}
                    {hintList.length > 3 ? <p>{`and ${hintList.length - 3} more`}</p> : null}
                </div>
            ) : null}
        </div>
    )
}

// ------------------------------------------------------------------ property controls

addPropertyControls(UnitStory, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: MAX_STEPS,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Statement",
                    displayTextArea: true,
                    defaultValue: "Describe what this step shows.",
                },
                data: {
                    type: ControlType.String,
                    title: "Data",
                    displayTextArea: true,
                    placeholder: "Label: 230 of 1,000",
                    defaultValue: "Group: 40 of 100\nOthers: rest",
                    description: 'One group per line. "of 1,000" sets the total, "rest" fills it.',
                },
                arrange: {
                    type: ControlType.Enum,
                    title: "Figures",
                    options: ["together", "apart"],
                    optionTitles: ["Together", "Apart"],
                    displaySegmentedControl: true,
                    defaultValue: "together",
                },
            },
        },
        defaultValue: DEFAULT_STEPS,
    },
    // flat: Smart Component variants
    step: {
        type: ControlType.Number,
        title: "Step",
        min: 1,
        max: MAX_STEPS,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
        description: "Start step. Set it per variant to drive the story with scroll.",
    },
    playback: {
        type: ControlType.Object,
        title: "Playback",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["auto", "tap", "prop"],
                optionTitles: ["Auto-play once", "On tap", "Step property"],
                defaultValue: "auto",
                description: "Step property: only the Step value changes the step, for example from Scroll Variants.",
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                min: 1.5,
                max: 12,
                step: 0.1,
                unit: "s",
                defaultValue: 4,
                hidden: (p: { mode?: Mode }) => p.mode !== "auto",
            },
            grow: {
                type: ControlType.Boolean,
                title: "Grow In",
                defaultValue: true,
                description: "Once, when the chart first comes into view.",
            },
        },
    },
    figures: {
        type: ControlType.Object,
        title: "Figures",
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["bust", "dot", "square", "person", "house", "drop", "tree", "meal", "book", "custom"],
                optionTitles: ["Bust", "Dot", "Square", "Person", "House", "Drop", "Tree", "Meal", "Book", "Custom"],
                defaultValue: "bust",
            },
            file: {
                type: ControlType.File,
                title: "Custom",
                allowedFileTypes: ["svg", "png"],
                description: "A dark shape on a transparent background. It is tinted per group.",
                hidden: (p: { shape?: Shape }) => p.shape !== "custom",
            },
            scale: {
                type: ControlType.Enum,
                title: "Per Figure",
                options: ["auto", "1", "2", "5", "10", "20", "50", "100", "500", "1000"],
                optionTitles: ["Auto", "1", "2", "5", "10", "20", "50", "100", "500", "1,000"],
                defaultValue: "auto",
                description: "Auto keeps the chart at 100 figures or fewer. From 500 figures, Dot and Square read best on phones.",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["side", "stacked"],
                optionTitles: ["Side by side", "Stacked"],
                defaultValue: "side",
                description: `Side by side stacks below ${SIDE_FROM} px.`,
            },
            showNumber: {
                type: ControlType.Boolean,
                title: "Number",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            radius: { type: ControlType.BorderRadius, title: "Buttons", defaultValue: DEFAULT_RADIUS },
            gap: {
                type: ControlType.Gap,
                title: "Gap",
                defaultValue: DEFAULT_GAP,
                description: "Rows: space between the blocks. Columns: most space between text and chart.",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            groups: {
                type: ControlType.Array,
                title: "Groups",
                maxCount: MAX_GROUPS,
                control: { type: ControlType.Color, defaultValue: "rgb(70, 90, 110)" },
                defaultValue: DEFAULT_PALETTE,
                description: "A step's groups take these in order. The number takes the color of its group.",
            },
            base: {
                type: ControlType.Color,
                title: "Base",
                defaultValue: DEFAULT_BASE,
                description: "Totals and the rest.",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEFAULT_TEXT,
            },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            number: {
                type: ControlType.Font,
                title: "Number",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { variant: "Semibold", fontSize: NUMBER_SIZE, letterSpacing: "-0.045em", lineHeight: "0.86em" },
            },
            text: {
                type: ControlType.Font,
                title: "Text",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { variant: "Medium", fontSize: TEXT_SIZE, letterSpacing: "-0.015em", lineHeight: "1.28em" },
                description: "Legend and caption use this font at a smaller size.",
            },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            unitOne: {
                type: ControlType.String,
                title: "Unit",
                defaultValue: "one person",
                description: "Stands alone when each figure is 1.",
            },
            unitMany: {
                type: ControlType.String,
                title: "Units",
                defaultValue: "people",
                description: 'Follows the number: "10 people". Percentages show "1%".',
            },
            caption: {
                type: ControlType.String,
                title: "Caption",
                defaultValue: "Each figure is {unit}",
                description: "{unit} is replaced by Unit or Units.",
            },
            ofTotal: {
                type: ControlType.String,
                title: "Total",
                defaultValue: "of {total}",
                description: "{total} is replaced by the total.",
            },
            stepOf: {
                type: ControlType.String,
                title: "Step",
                defaultValue: "Step {n} of {count}",
                description: "Read out by screen readers.",
            },
            previous: { type: ControlType.String, title: "Previous", defaultValue: "Previous step" },
            next: { type: ControlType.String, title: "Next", defaultValue: "Next step" },
            replay: { type: ControlType.String, title: "Replay", defaultValue: "Start over" },
            steps: {
                type: ControlType.String,
                title: "Step Bars",
                defaultValue: "Story steps",
                description: "Name of the step bars for screen readers.",
            },
        },
    },
    onFinish: {
        type: ControlType.EventHandler,
        title: "On Finish",
    },
})
