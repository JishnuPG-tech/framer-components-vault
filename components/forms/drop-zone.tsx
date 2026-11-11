/**
 * Kern_Dropzone · v0.17.4
 * Drag real files in from your computer, or choose them with the keyboard.
 * Files are read on the device and never leave the page.
 */

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
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type Transition,
} from "framer-motion"
import {
    forwardRef,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type DragEvent,
    type PointerEvent,
    type RefObject,
    type ReactNode,
} from "react"

const MB = 1024 * 1024
// The box's base text size, the Font control's default. Text sizes are multiples of it, so the Font size control scales them all.
const TYPE_BASE = 14
const em = (px: number) => `${px / TYPE_BASE}em`

// Option values equal their labels, so the stored control value matches what the component compares against.
type AcceptOption = "Anything" | "Images" | "Video" | "PDF"
type JobKind = "reading" | "done" | "failed"
type Refusal = "size" | "type" | "full"
type FilesAs = "Tags" | "List"
// Hairline: the animated line figures. Plain: a quiet line icon for any site. Custom: the buyer's own SVG or PNG.
type StyleOption = "Hairline" | "Plain" | "Custom"

interface DropItem {
    id: number
    name: string
    size: number
    ext: string
    kind: JobKind
    progress: number
    thumb?: string
    // Why a file failed, for the accessible name and the tag's title. Set only for unexpected errors.
    reason?: string
}

const ACCEPT_ATTR: Record<AcceptOption, string | undefined> = {
    Anything: undefined,
    Images: "image/*",
    Video: "video/*",
    PDF: "application/pdf",
}

// Escalating lines for repeat size refusals. The index rises with each try and resets after 8 s idle.
const SIZE_LINES = [
    "That one runs over the limit. A smaller copy will go straight through.",
    "Still too heavy for this box. Shrink it a little and I'll take it.",
    "Nope, that one is past the line. Try a lighter export.",
    "We're counting megabytes together, friend. This one is still too big.",
    "I admire the effort. The limit is the limit, so compress it and try again.",
]
const TYPE_LINE = "This box doesn't take that kind of file. Try one from the list."
const FULL_LINE = "The box is full. Remove a file to make room."

// Expected cancellations are DOMException AbortError; anything else is an unexpected failure.
function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError"
}

function describeError(error: unknown): string {
    return error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error"
}

// Motion values locked in Kits/2026-10-09-playful-components/REF-MOTION.md.
const SNAP_SPRING = { stiffness: 120, damping: 14, mass: 0.9 }
const SNAP: Transition = { type: "spring", ...SNAP_SPRING }
const POP: Transition = { type: "spring", stiffness: 150, damping: 15, mass: 0.8 }
const FILL_SPRING = { stiffness: 170, damping: 26 }
const SWALLOW_EASE: [number, number, number, number] = [0.55, 0, 1, 0.45]
const CROSSFADE: Transition = { duration: 0.15 }
// Exits are shorter and calmer than enters: critically damped, no overshoot.
const EXIT: Transition = { type: "spring", stiffness: 420, damping: 41 }
const DIGIT_HEIGHT = 17

// Group and field keys match their panel titles (Framer derives $control__ names from titles).
interface ContentGroup {
    prompt: string
}
interface LimitsGroup {
    maxSize: number
    maxFiles: number
    accepts: AcceptOption
}
interface UploadGroup {
    paceLocalReads: boolean
}
interface LookGroup {
    style: StyleOption
    figure: FigureOption
    icon: string
    keepColours: boolean
    filesAs: FilesAs
    radius: number
    ink: string
    surface: string
    muted: string
    accent: string
    success: string
    refuse: string
    font?: CSSProperties
}
interface BehaviorGroup {
    idleDemo: boolean
    blockOutsideDrops: boolean
}

const CREDIT =
    "[Explore more components](https://www.framer.com/%40builtbykern/)\n[Made in Framer](https://www.framer.com/?via=builtbykern)"

const CONTENT_DEFAULTS: ContentGroup = { prompt: "Drop files here" }
const LIMITS_DEFAULTS: LimitsGroup = { maxSize: 5, maxFiles: 4, accepts: "Anything" }
const UPLOAD_DEFAULTS: UploadGroup = { paceLocalReads: true }
const LOOK_DEFAULTS: LookGroup = {
    style: "Hairline",
    figure: "Drawers",
    icon: "",
    keepColours: false,
    filesAs: "Tags",
    radius: 20,
    ink: "#1B1B1F",
    surface: "#FBFAF7",
    muted: "#6B675F",
    accent: "#2459C4",
    success: "#23794A",
    refuse: "#C7342B",
}
const BEHAVIOR_DEFAULTS: BehaviorGroup = { blockOutsideDrops: true, idleDemo: true }

interface Kern_DropzoneProps {
    content?: Partial<ContentGroup>
    limits?: Partial<LimitsGroup>
    upload?: Partial<UploadGroup>
    look?: Partial<LookGroup>
    behavior?: Partial<BehaviorGroup>
    onFileAdded?: () => void
    onFileRefused?: () => void
    // Supplied by Framer from the frame's size and position, so it has no property control. Kept on the root.
    style?: CSSProperties
}

// Merge a control group over its defaults, ignoring fields Framer leaves undefined.
function withDefaults<T extends object>(defaults: T, group: Partial<T> | undefined): T {
    const merged = { ...defaults }
    if (!group) return merged
    for (const key of Object.keys(group) as (keyof T)[]) {
        const value = group[key]
        if (value !== undefined) merged[key] = value as T[keyof T]
    }
    return merged
}

function formatSize(bytes: number): string {
    if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / MB).toFixed(1)} MB`
}

function middleEllipsis(name: string, max = 28): string {
    if (name.length <= max) return name
    const keep = Math.floor((max - 1) / 2)
    return `${name.slice(0, keep)}…${name.slice(-keep)}`
}

function extensionOf(name: string): string {
    const dot = name.lastIndexOf(".")
    const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ""
    return ext.length > 0 && ext.length <= 4 ? ext : "file"
}

function matchesAccept(file: File, accepts: AcceptOption): boolean {
    if (accepts === "Anything") return true
    if (accepts === "Images") return file.type.startsWith("image/")
    if (accepts === "Video") return file.type.startsWith("video/")
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

// Small seeded generator, so the same file always gets the same pacing.
function seededRandom(seed: number): () => number {
    let state = seed >>> 0 || 1
    return () => {
        state ^= state << 13
        state >>>= 0
        state ^= state >>> 17
        state ^= state << 5
        state >>>= 0
        return state / 4294967296
    }
}

function hashString(text: string): number {
    let hash = 2166136261
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

interface PaceStep {
    wait: number
    value: number
}

// Uneven bursts with short pauses, about 1.6–2.4 s in total, so a local read never looks like a timer.
function paceSchedule(seed: number): PaceStep[] {
    const random = seededRandom(seed)
    const total = 1600 + random() * 800
    const bursts = 5 + Math.floor(random() * 4)
    const weights = Array.from({ length: bursts }, () => 0.4 + random())
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
    // Uneven gaps, scaled so they add up to exactly `total`.
    const gaps = weights.map(() => 0.5 + random())
    const gapSum = gaps.reduce((sum, gap) => sum + gap, 0)
    let value = 0
    const steps = weights.map((weight, index) => {
        value += weight / weightSum
        return { wait: (gaps[index] / gapSum) * total, value: Math.min(1, value) }
    })
    steps[steps.length - 1].value = 1
    return steps
}

function waitFor(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        const onAbort = () => {
            window.clearTimeout(timer)
            resolve()
        }
        // A finished wait takes its abort listener off the signal, so a long-running demo does not pile them up.
        const timer = window.setTimeout(() => {
            signal.removeEventListener("abort", onAbort)
            resolve()
        }, ms)
        signal.addEventListener("abort", onAbort, { once: true })
    })
}

// ── Figures. Three isometric line drawings the buyer picks from (Look → Figure): an antique drawer cabinet, open
// pigeonholes, and a simple folder. Drawn from scratch in a hairline style: one stroke, rounded solids as a silhouette
// plus a crease, opaque plates painted back to front, one bright edge, no words inside the drawing.
type Pt = [number, number]
type FigureOption = "Drawers" | "Pigeonholes" | "Folder" | "Trays" | "Box" | "Mailbox" | "Tray"
const ISO = 6 // world unit → viewBox units
const PULL = 5 // how far a drawer or tray slides out, in world units
const AJAR = 2.8 // a filled drawer rests this far out, so its card shows
// Figures answer the pointer on a damped spring (ζ ≈ 0.9): no overshoot inside the drawing.
const TRAY_SPRING = { stiffness: 100, damping: 18, mass: 1 }
// A figure draws itself in once: a long ease-out per stroke, staggered from the first slot outward.
const DRAW_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

// 2:1 isometric projection: x runs down-right, y down-left (toward the viewer), z up.
function iso(x: number, y: number, z: number): Pt {
    return [(x - y) * ISO, ((x + y) * ISO) / 2 - z * ISO]
}

function corners(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Pt[] {
    const out: Pt[] = []
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) out.push(iso(x, y, z))
    return out
}

function cross(o: Pt, a: Pt, b: Pt) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

// Convex hull (monotone chain): the silhouette of a solid is the hull of its corners.
function hull(points: Pt[]): Pt[] {
    const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const lower: Pt[] = []
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
        lower.push(p)
    }
    const upper: Pt[] = []
    for (const p of [...sorted].reverse()) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
        upper.push(p)
    }
    return lower.slice(0, -1).concat(upper.slice(0, -1))
}

const f = (n: number) => Math.round(n * 10) / 10

// Closed outline with every corner rounded (no sharp corners anywhere).
function rounded(points: Pt[], radius: number): string {
    const n = points.length
    const parts: string[] = []
    for (let i = 0; i < n; i++) {
        const v = points[i]
        const toward = (to: Pt): Pt => {
            const dx = to[0] - v[0]
            const dy = to[1] - v[1]
            const k = Math.min(radius / Math.max(0.001, Math.hypot(dx, dy)), 0.5)
            return [v[0] + dx * k, v[1] + dy * k]
        }
        const a = toward(points[(i - 1 + n) % n])
        const b = toward(points[(i + 1) % n])
        parts.push(`${i === 0 ? "M" : "L"}${f(a[0])} ${f(a[1])}Q${f(v[0])} ${f(v[1])} ${f(b[0])} ${f(b[1])}`)
    }
    return `${parts.join("")}Z`
}

function open(points: Pt[]): string {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${f(p[0])} ${f(p[1])}`).join("")
}

// A flat rectangle on a front-facing plane (constant y).
function face(x0: number, x1: number, y: number, z0: number, z1: number): Pt[] {
    return [iso(x0, y, z0), iso(x1, y, z0), iso(x1, y, z1), iso(x0, y, z1)]
}

function inside(pt: Pt, poly: Pt[]): boolean {
    let hit = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i]
        const [xj, yj] = poly[j]
        if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit
    }
    return hit
}

interface ViewBox {
    x: number
    y: number
    w: number
    h: number
}

const FRAME_ASPECT = 1.2 // every figure shares one 6:5 frame
const FRAME_FILL = 0.4 // the rest silhouette's area as a share of the frame: one optical size for all figures

function bounds(points: Pt[]) {
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

// The figure's frame: centred on its rest pose, sized by the area of its rest silhouette, and grown evenly
// (never shifted) until every moving part fits, so each figure rests in the middle at the same optical size.
function frameFor(rest: Pt[], moving: Pt[], pad = 8): ViewBox {
    const outline = hull(rest)
    let area = 0
    for (let i = 0; i < outline.length; i++) {
        const a = outline[i]
        const b = outline[(i + 1) % outline.length]
        area += a[0] * b[1] - b[0] * a[1]
    }
    const r = bounds(rest)
    const cx = (r.x0 + r.x1) / 2
    const cy = (r.y0 + r.y1) / 2
    const all = bounds(rest.concat(moving))
    const halfW = Math.max(cx - all.x0, all.x1 - cx) + pad
    const halfH = Math.max(cy - all.y0, all.y1 - cy) + pad
    const h = Math.max(Math.sqrt(Math.abs(area) / 2 / (FRAME_FILL * FRAME_ASPECT)), 2 * halfH, (2 * halfW) / FRAME_ASPECT)
    const w = h * FRAME_ASPECT
    return { x: cx - w / 2, y: cy - h / 2, w, h }
}

// Grid shape for n slots: the most compact columns × rows that fills exactly, never taller than wide.
function gridFor(n: number): [number, number] {
    for (let cols = Math.ceil(Math.sqrt(n)); cols <= n; cols++) if (n % cols === 0 && cols >= n / cols) return [cols, n / cols]
    return [n, 1]
}

interface GridCell {
    x0: number
    x1: number
    z0: number
    z1: number
}

// Lays out n cells on a cabinet front, filled in reading order (top row first).
function layoutCells(n: number, cellW: number, cellH: number, wall: number) {
    const [cols, rows] = gridFor(Math.max(1, Math.round(n)))
    const cells: GridCell[] = []
    for (let i = 0; i < cols * rows; i++) {
        const x0 = wall + (i % cols) * (cellW + wall)
        const z0 = wall + (rows - 1 - Math.floor(i / cols)) * (cellH + wall)
        cells.push({ x0, x1: x0 + cellW, z0, z1: z0 + cellH })
    }
    return { cells, W: cols * cellW + (cols + 1) * wall, H: rows * cellH + (rows + 1) * wall }
}

// What a container's contents may show through: its top opening, extended straight up by `lift` world units.
// Contents are clipped to it, so nothing is ever seen through a wall (honest construction).
function openingAbove(ring: Pt[], lift: number): string {
    return rounded(hull(ring.concat(ring.map((pt): Pt => [pt[0], pt[1] - lift * ISO]))), 1)
}

// Uneven rest offsets, so an empty cabinet is already a composition.
const REST = [0.5, 0, 1.1, 0.2, 0.8, 0, 0.35, 0.9, 0.1, 0.6, 0.3, 0.7]
const SWEEP: Pt = [-PULL * ISO, (PULL * ISO) / 2]
const swept = (points: Pt[]): Pt[] => points.map((p): Pt => [p[0] + SWEEP[0], p[1] + SWEEP[1]])

// ── Drawers: an antique card-file chest with cornice and plinth; its one drawer pulls out toward the viewer.
interface DrawerCell {
    opening: Pt[]
    openingPath: string
    outPath: string
    inner: string
    box: string
    front: string
    label: string
    pull: string
    card: string
    cardEdge: string
    cardWindow: string
    rim: string
    edges: string
    center: Pt
    rest: number
}

interface DrawerCabinet {
    plinth: string
    body: string
    cornice: string
    corniceCrease: string
    cells: DrawerCell[]
    viewBox: ViewBox
}

function buildDrawers(): DrawerCabinet {
    // One drawer in a near-cubic card-file chest.
    const wall = 1.2
    const W = 14 + 2 * wall
    const H = 9.6 + 2 * wall
    const grid: GridCell[] = [{ x0: wall, x1: wall + 14, z0: wall, z1: wall + 9.6 }]
    // Card-file drawers run deep: 0.8 of the width keeps a cube-like read while the drawer face stays dominant.
    const D = W * 0.8
    const plinthHull = hull(corners(-0.6, W + 0.6, -0.6, D + 0.6, -1.6, 0))
    const corniceHull = hull(corners(-0.9, W + 0.9, -0.9, D + 0.9, H, H + 1.4))
    const rest: Pt[] = [...plinthHull, ...corniceHull]
    const moving: Pt[] = []
    const cells = grid.map(({ x0, x1, z0, z1 }, i): DrawerCell => {
        const g = 0.45
        const mid = (x0 + x1) / 2
        const opening = face(x0, x1, D, z0, z1)
        // The region a drawer may occupy: its opening swept out toward the viewer, with headroom for a card.
        const outHull = hull(opening.concat(swept(opening.concat([iso(x0, D, z1 + 2.2), iso(x1, D, z1 + 2.2)]))))
        moving.push(...outHull)
        const labelZ = z0 + (z1 - z0) * 0.56
        return {
            opening,
            openingPath: rounded(opening, 2),
            outPath: rounded(outHull, 2),
            inner: `${open([iso(x0, 1, z1), iso(x0, 1, z0), iso(x1, 1, z0)])}${open([iso(x0, 1, z0), iso(x0, D, z0)])}`,
            box: rounded(hull(corners(x0 + g, x1 - g, 1.5, D, z0 + g, z1 - 1.1)), 1.6),
            front: rounded(face(x0 + g, x1 - g, D, z0 + g, z1 - g), 1.4),
            label: rounded(face(mid - 2.3, mid + 2.3, D + 0.05, labelZ, labelZ + 1.7), 1.2),
            pull: rounded(face(mid - 1.7, mid + 1.7, D + 0.05, labelZ - 2.3, labelZ - 1.3), 1.4),
            card: rounded(face(x0 + 1.6, x1 - 1.6, D - 2, z1 - 3, z1 + 1.4), 1),
            cardEdge: open([iso(x0 + 2.4, D - 2, z1 + 0.6), iso(x1 - 2.4, D - 2, z1 + 0.6)]),
            // The drawer's open top, so a pulled drawer reads as a tray-like box and not a solid block.
            rim: rounded([iso(x0 + g + 0.35, 1.9, z1 - 1.1), iso(x1 - g - 0.35, 1.9, z1 - 1.1), iso(x1 - g - 0.35, D - 0.35, z1 - 1.1), iso(x0 + g + 0.35, D - 0.35, z1 - 1.1)], 1.2),
            // The opening's top and right edges are the frame a drawer slides under: they stay drawn over it.
            edges: open([iso(x0 + 0.8, D, z1), iso(x1, D, z1), iso(x1, D, z0 + 0.8)]),
            cardWindow: openingAbove([iso(x0 + g + 0.35, 1.9, z1 - 1.1), iso(x1 - g - 0.35, 1.9, z1 - 1.1), iso(x1 - g - 0.35, D - 0.35, z1 - 1.1), iso(x0 + g + 0.35, D - 0.35, z1 - 1.1)], 4),
            center: iso(mid, D, (z0 + z1) / 2),
            rest: REST[i % REST.length],
        }
    })
    return {
        plinth: rounded(plinthHull, 2),
        body: rounded(hull(corners(0, W, 0, D, 0, H)), 2.4),
        cornice: rounded(corniceHull, 2),
        corniceCrease: open([iso(-0.2, D + 0.9, H + 1.4), iso(W + 0.9, D + 0.9, H + 1.4), iso(W + 0.9, -0.2, H + 1.4)]),
        cells,
        viewBox: frameFor(rest, moving),
    }
}

// ── Pigeonholes: an open cabinet of cubbies; the tray in each slides out toward the viewer.
interface PigeonCell {
    opening: Pt[]
    openingPath: string
    outPath: string
    inner: string
    traySil: string
    trayCrease: string
    sheet: string
    fold: string
    edges: string
    center: Pt
    rest: number
}

interface PigeonCabinet {
    body: string
    crease: string
    cells: PigeonCell[]
    viewBox: ViewBox
}

function buildPigeonholes(n: number): PigeonCabinet {
    const D = 11
    const { cells: grid, W, H } = layoutCells(n, 10, 7, 1.4)
    const bodyHull = hull(corners(0, W, 0, D, 0, H))
    const moving: Pt[] = []
    const cells = grid.map(({ x0, x1, z0, z1 }, i): PigeonCell => {
        const opening = face(x0, x1, D, z0, z1)
        const outHull = hull(opening.concat(swept(opening)))
        moving.push(...outHull)
        const ty = z0 + 1.4
        return {
            opening,
            openingPath: rounded(opening, 2.6),
            outPath: rounded(outHull, 2.6),
            inner: `${open([iso(x0, 1, z1), iso(x0, 1, z0), iso(x1, 1, z0)])}${open([iso(x0, 1, z0), iso(x0, D, z0)])}`,
            traySil: rounded(hull(corners(x0 + 1, x1 - 1, 2, D - 0.6, z0 + 0.05, ty)), 3),
            trayCrease: open([iso(x0 + 1.8, D - 0.6, ty), iso(x1 - 1, D - 0.6, ty), iso(x1 - 1, 2.8, ty)]),
            sheet: rounded([iso(x0 + 2, 3, ty + 0.2), iso(x1 - 2, 3, ty + 0.2), iso(x1 - 2, D - 1.6, ty + 0.2), iso(x0 + 2, D - 1.6, ty + 0.2)], 2),
            fold: open([iso(x1 - 4.6, D - 1.6, ty + 0.2), iso(x1 - 2, D - 4.2, ty + 0.2)]),
            edges: open([iso(x0 + 1, D, z1), iso(x1, D, z1), iso(x1, D, z0 + 1)]),
            center: iso((x0 + x1) / 2, D, (z0 + z1) / 2),
            rest: REST[i % REST.length],
        }
    })
    return {
        body: rounded(bodyHull, 3),
        crease: open([iso(1.6, D, H), iso(W, D, H), iso(W, 1.6, H)]),
        cells,
        viewBox: frameFor(bodyHull, moving),
    }
}

// ── Folder: one standing file folder; the front panel tips open toward the viewer, sheets show inside.
const FOLDER_W = 24
const FOLDER_H = 17
const FOLDER_FRONT = FOLDER_H - 1.4
const FOLDER_ANGLE = { rest: 7, open: 24, receiving: 32 } // degrees from upright

interface FolderModel {
    back: string
    floor: string
    hinge: string
    sheets: { plate: string; edge: string }[]
    hit: Pt[]
    mouth: Pt
    viewBox: ViewBox
}

function folderFrontPoints(degrees: number): Pt[] {
    const t = (degrees * Math.PI) / 180
    const yTop = 2.6 + FOLDER_FRONT * Math.sin(t)
    const zTop = FOLDER_FRONT * Math.cos(t)
    // Hinged on a bottom gusset 2.6 units deep, so the sheets stand between the back and the front.
    return [iso(0.3, 2.6, 0), iso(FOLDER_W - 0.3, 2.6, 0), iso(FOLDER_W - 0.3, yTop, zTop), iso(0.3, yTop, zTop)]
}

function buildFolder(): FolderModel {
    const W = FOLDER_W
    const H = FOLDER_H
    const back = [iso(0, 0, 0), iso(W, 0, 0), iso(W, 0, H), iso(10, 0, H), iso(9, 0, H + 2.4), iso(2.6, 0, H + 2.4), iso(1.6, 0, H), iso(0, 0, H)]
    const sheets = Array.from({ length: 6 }, (_, k) => {
        const x0 = 1.2 + k * 0.7
        const x1 = W - 3.2 + (k % 2) * 1.4
        const y = 0.5 + k * 0.3
        const top = H - 0.4 + (k % 3) * 0.5
        return { plate: rounded(face(x0, x1, y, 0.4, top), 1.4), edge: open([iso(x0 + 1.4, y, top - 1.2), iso(x0 + 7, y, top - 1.2)]) }
    })
    const widest = folderFrontPoints(FOLDER_ANGLE.receiving)
    const hit = hull(back.concat(folderFrontPoints(FOLDER_ANGLE.open)))
    return {
        back: rounded(back, 2.4),
        // The bottom gusset joining back and front, so the folder reads as one closed object.
        floor: rounded([iso(0, 0, 0), iso(W, 0, 0), iso(W - 0.3, 2.6, 0), iso(0.3, 2.6, 0)], 1.2),
        hinge: open([iso(0.8, 2.6, 0.05), iso(W - 0.8, 2.6, 0.05)]),
        sheets,
        hit,
        mouth: iso(W / 2, 2.6 + (FOLDER_FRONT * Math.sin((FOLDER_ANGLE.open * Math.PI) / 180)) / 2, H * 0.8),
        viewBox: frameFor(back.concat(folderFrontPoints(FOLDER_ANGLE.rest)), widest, 10),
    }
}

type FigureModel =
    | { kind: "Drawers"; model: DrawerCabinet }
    | { kind: "Pigeonholes"; model: PigeonCabinet }
    | { kind: "Folder"; model: FolderModel }
    | { kind: "Trays"; model: TrayStack }
    | { kind: "Box"; model: ArchiveBox }
    | { kind: "Mailbox"; model: Mailbox }
    | { kind: "Tray"; model: SingleTray }
    | { kind: "Plain"; model: PlainMark }
    | { kind: "Custom"; model: CustomMark }

function buildFigure(figure: FigureOption, n: number): FigureModel {
    if (figure === "Pigeonholes") return { kind: "Pigeonholes", model: buildPigeonholes(n) }
    if (figure === "Folder") return { kind: "Folder", model: buildFolder() }
    if (figure === "Trays") return { kind: "Trays", model: buildTrays() }
    if (figure === "Box") return { kind: "Box", model: buildBox() }
    if (figure === "Mailbox") return { kind: "Mailbox", model: buildMailbox() }
    if (figure === "Tray") return { kind: "Tray", model: buildTray() }
    return { kind: "Drawers", model: buildDrawers() }
}

// Which slot the next file goes to. Trays share files round the three tiers; cabinets fill in reading order.
function nextSlot(kind: FigureModel["kind"], count: number, n: number): number {
    return kind === "Trays" || kind === "Drawers" ? count % n : Math.min(count, n - 1)
}

// Hit regions (rest pose, never moving) and landing points per slot. The folder is one slot.
function figureSlots(figure: FigureModel): { hit: Pt[]; center: Pt }[] {
    if (figure.kind === "Folder" || figure.kind === "Box" || figure.kind === "Mailbox" || figure.kind === "Tray" || figure.kind === "Plain" || figure.kind === "Custom") return [{ hit: figure.model.hit, center: figure.model.mouth }]
    if (figure.kind === "Trays") return figure.model.tiers.map((tier) => ({ hit: tier.hit, center: tier.center }))
    return figure.model.cells.map((cell: DrawerCell | PigeonCell) => ({ hit: cell.opening, center: cell.center }))
}

interface StrokeProps {
    d: string
    className: string
    delay: number
    play: boolean
    still: boolean
    clipPath?: string
}

// One stroke that draws itself in on first view, then lets its plate fill appear. Static and reduced motion: complete.
// Once drawn it becomes a plain path: the draw-in dash is normalised by path length, which does not match a
// non-scaling stroke at every scale, so leaving it on could cut lines short.
function Stroke({ d, className, delay, play, still, clipPath }: StrokeProps) {
    const [drawn, setDrawn] = useState(false)
    if (still || drawn) return <path d={d} className={className} clipPath={clipPath} />
    return (
        <motion.path
            d={d}
            className={className}
            clipPath={clipPath}
            // Hidden until its turn: a zero-length stroke with round caps would otherwise paint a dot.
            initial={{ pathLength: 0, fillOpacity: 0, opacity: 0 }}
            animate={play ? { pathLength: 1, fillOpacity: 1, opacity: 1 } : { pathLength: 0, fillOpacity: 0, opacity: 0 }}
            transition={{
                opacity: { duration: 0.01, delay },
                pathLength: { duration: 0.7, ease: DRAW_EASE, delay },
                fillOpacity: { duration: 0.3, ease: DRAW_EASE, delay: delay + 0.45 },
            }}
            onAnimationComplete={() => {
                if (play) setDrawn(true)
            }}
        />
    )
}

// A spring-driven offset toward the viewer, in world units, mapped to an isometric screen translation.
function usePull(target: number, still: boolean) {
    const pull = useMotionValue(target)
    const sprung = useSpring(pull, TRAY_SPRING)
    useEffect(() => {
        pull.set(target)
    }, [target, pull])
    const source = still ? pull : sprung
    return { x: useTransform(source, (v) => -v * ISO), y: useTransform(source, (v) => (v * ISO) / 2) }
}

// A card or sheet dropping into place when a file lands.
function Landing({ show, still, children }: { show: boolean; still: boolean; children: ReactNode }) {
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.g
                    initial={still ? { opacity: 0 } : { y: -14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={still ? { opacity: 0, transition: CROSSFADE } : { y: -12, opacity: 0, transition: { y: EXIT, opacity: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } } }}
                    transition={still ? CROSSFADE : { type: "spring", ...TRAY_SPRING }}
                >
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    )
}

interface SceneProps {
    scope: string
    filledCount: number
    // Every file the figure takes is in: a six-sheet figure stops inviting a drop (hover or drag).
    full: boolean
    hovered: number | null
    receiving: number | null
    // Held open after a card lands, or while a removed file's card lifts out of it.
    held: number | null
    inviting: number | null
    bright: number
    still: boolean
    play: boolean
}

function slotOut(index: number, rest: number, filled: boolean, p: SceneProps, ajar: number) {
    if (p.hovered === index || p.receiving === index || p.held === index) return PULL
    if (p.inviting === index) return PULL * 0.5
    return filled ? Math.max(rest, ajar) : rest
}

// Paint order follows depth: the further a slot sits out toward the viewer, the later it is painted.
function depthOrder(rests: number[], p: SceneProps, ajar: number) {
    const out = (i: number) => slotOut(i, rests[i], i < p.filledCount, p, ajar)
    return rests.map((_, i) => i).sort((a, b) => out(a) - out(b) || a - b)
}

function ClipDefs({ scope, cells }: { scope: string; cells: { outPath: string; openingPath: string }[] }) {
    return (
        <defs>
            {cells.map((cell, index) => (
                <clipPath key={`out${index}`} id={`${scope}-out-${index}`}>
                    <path d={cell.outPath} />
                </clipPath>
            ))}
            {cells.map((cell, index) => (
                <clipPath key={`in${index}`} id={`${scope}-in-${index}`}>
                    <path d={cell.openingPath} />
                </clipPath>
            ))}
        </defs>
    )
}

function DrawerSlot({ cell, index, p }: { cell: DrawerCell; index: number; p: SceneProps }) {
    const filled = index < p.filledCount
    const { x, y } = usePull(slotOut(index, cell.rest, filled, p, AJAR), p.still)
    const delay = 0.45 + index * 0.06
    const s = p.scope
    return (
        <g clipPath={`url(#${s}-out-${index})`}>
            <motion.g style={{ x, y }}>
                <Stroke d={cell.box} className={`${s}__plate ${s}__sil`} delay={delay} play={p.play} still={p.still} />
                <Stroke d={cell.rim} className={`${s}__lo`} delay={delay + 0.1} play={p.play} still={p.still} />
                <clipPath id={`${s}-card-${index}`}>
                    <path d={cell.cardWindow} />
                </clipPath>
                <g clipPath={`url(#${s}-card-${index})`}>
                    <Landing show={filled} still={p.still}>
                        <path className={`${s}__plate ${s}__sil`} d={cell.card} />
                        <path className={`${s}__lo`} d={cell.cardEdge} />
                    </Landing>
                </g>
                <Stroke d={cell.front} className={`${s}__plate ${p.bright === index ? `${s}__hi` : `${s}__sil`}`} delay={delay + 0.05} play={p.play} still={p.still} />
                <Stroke d={cell.label} className={`${s}__lo`} delay={delay + 0.15} play={p.play} still={p.still} />
                <Stroke d={cell.pull} className={`${s}__mid`} delay={delay + 0.2} play={p.play} still={p.still} />
            </motion.g>
        </g>
    )
}

function DrawerScene({ model, p }: { model: DrawerCabinet; p: SceneProps }) {
    const s = p.scope
    return (
        <>
            <ClipDefs scope={s} cells={model.cells} />
            <Stroke d={model.plinth} className={`${s}__plate ${s}__sil`} delay={0} play={p.play} still={p.still} />
            <Stroke d={model.body} className={`${s}__plate ${s}__sil`} delay={0.1} play={p.play} still={p.still} />
            <Stroke d={model.cornice} className={`${s}__plate ${s}__sil`} delay={0.2} play={p.play} still={p.still} />
            <Stroke d={model.corniceCrease} className={`${s}__lo`} delay={0.3} play={p.play} still={p.still} />
            {model.cells.map((cell, index) => (
                <g key={index}>
                    <Stroke d={cell.openingPath} className={`${s}__plate ${s}__mid`} delay={0.3 + index * 0.06} play={p.play} still={p.still} />
                    <Stroke d={cell.inner} className={`${s}__lo`} clipPath={`url(#${s}-in-${index})`} delay={0.4 + index * 0.06} play={p.play} still={p.still} />
                </g>
            ))}
            {depthOrder(model.cells.map((c) => c.rest), p, AJAR).map((index) => (
                <DrawerSlot key={index} cell={model.cells[index]} index={index} p={p} />
            ))}
            {model.cells.map((cell, index) => (
                <Stroke key={`edge${index}`} d={cell.edges} className={`${s}__mid`} delay={0.4 + index * 0.06} play={p.play} still={p.still} />
            ))}
        </>
    )
}

function TraySlot({ cell, index, p }: { cell: PigeonCell; index: number; p: SceneProps }) {
    const filled = index < p.filledCount
    const { x, y } = usePull(slotOut(index, cell.rest, filled, p, 1.8), p.still)
    const delay = 0.45 + index * 0.06
    const s = p.scope
    return (
        <g clipPath={`url(#${s}-out-${index})`}>
            <motion.g style={{ x, y }}>
                <Stroke d={cell.traySil} className={`${s}__plate ${p.bright === index ? `${s}__hi` : `${s}__sil`}`} delay={delay} play={p.play} still={p.still} />
                <Stroke d={cell.trayCrease} className={`${s}__lo`} delay={delay + 0.1} play={p.play} still={p.still} />
                <Landing show={filled} still={p.still}>
                    <path className={`${s}__plate ${s}__sil`} d={cell.sheet} />
                    <path className={`${s}__lo`} d={cell.fold} />
                </Landing>
            </motion.g>
        </g>
    )
}

function PigeonScene({ model, p }: { model: PigeonCabinet; p: SceneProps }) {
    const s = p.scope
    return (
        <>
            <ClipDefs scope={s} cells={model.cells} />
            <Stroke d={model.body} className={`${s}__plate ${s}__sil`} delay={0} play={p.play} still={p.still} />
            <Stroke d={model.crease} className={`${s}__lo`} delay={0.15} play={p.play} still={p.still} />
            {model.cells.map((cell, index) => (
                <g key={index}>
                    <Stroke d={cell.openingPath} className={`${s}__plate ${s}__mid`} delay={0.25 + index * 0.06} play={p.play} still={p.still} />
                    <Stroke d={cell.inner} className={`${s}__lo`} clipPath={`url(#${s}-in-${index})`} delay={0.35 + index * 0.06} play={p.play} still={p.still} />
                </g>
            ))}
            {depthOrder(model.cells.map((c) => c.rest), p, 1.8).map((index) => (
                <TraySlot key={index} cell={model.cells[index]} index={index} p={p} />
            ))}
            {model.cells.map((cell, index) => (
                <Stroke key={`edge${index}`} d={cell.edges} className={`${s}__mid`} delay={0.35 + index * 0.06} play={p.play} still={p.still} />
            ))}
        </>
    )
}

function FolderScene({ model, p }: { model: FolderModel; p: SceneProps }) {
    const s = p.scope
    // A full folder takes no more drops, so hover and drag no longer open it.
    const hover = p.full ? null : p.hovered
    const invite = p.full ? null : p.inviting
    const target = p.receiving === 0 ? FOLDER_ANGLE.receiving : hover === 0 || invite === 0 || p.held === 0 ? FOLDER_ANGLE.open : FOLDER_ANGLE.rest
    const angle = useMotionValue(target)
    const sprung = useSpring(angle, TRAY_SPRING)
    useEffect(() => {
        angle.set(target)
    }, [target, angle])
    const front = useTransform(p.still ? angle : sprung, (degrees) => rounded(folderFrontPoints(degrees), 2.4))
    const shown = Math.min(p.filledCount, model.sheets.length)
    return (
        <>
            <Stroke d={model.back} className={`${s}__plate ${s}__sil`} delay={0} play={p.play} still={p.still} />
            <Stroke d={model.floor} className={`${s}__plate ${s}__sil`} delay={0.2} play={p.play} still={p.still} />
            {model.sheets.map((sheet, k) => (
                <Landing key={k} show={k < shown} still={p.still}>
                    <path className={`${s}__plate ${s}__sil`} d={sheet.plate} />
                    <path className={`${s}__lo`} d={sheet.edge} />
                </Landing>
            ))}
            <motion.path
                d={front}
                className={`${s}__plate ${s}__hi`}
                // Its shape changes as it opens, so it fades in after the back is drawn instead of drawing a dash.
                initial={p.still ? false : { opacity: 0 }}
                animate={p.play || p.still ? { opacity: 1 } : { opacity: 0 }}
                transition={{ opacity: { duration: 0.4, ease: DRAW_EASE, delay: 0.7 } }}
            />
            <Stroke d={model.hinge} className={`${s}__lo`} delay={0.6} play={p.play} still={p.still} />
        </>
    )
}

// ── Trays: three stacked desk trays stepping back as they rise; each tier slides out toward the viewer.
interface TrayTier {
    sil: string
    rim: string
    window: string
    lip: string
    sheets: string[]
    hit: Pt[]
    center: Pt
    rest: number
}

interface TrayStack {
    risers: string[]
    tiers: TrayTier[]
    viewBox: ViewBox
}

function buildTrays(): TrayStack {
    const W = 22
    const D = 14
    const rests = [0.6, 0, 1]
    const rest: Pt[] = []
    const moving: Pt[] = []
    const tiers = [0, 1, 2].map((k): TrayTier => {
        const y0 = -k * 2.6
        const z0 = k * 5.4
        const corners8 = corners(0, W, y0, y0 + D, z0, z0 + 2.2)
        rest.push(...corners(0, W, y0 + rests[k], y0 + rests[k] + D, z0, z0 + 2.2))
        moving.push(...swept(hull(corners8)))
        return {
            sil: rounded(hull(corners8), 3),
            rim: rounded([iso(1, y0 + 1, z0 + 2.2), iso(W - 1, y0 + 1, z0 + 2.2), iso(W - 1, y0 + D - 1, z0 + 2.2), iso(1, y0 + D - 1, z0 + 2.2)], 2.4),
            window: openingAbove([iso(1, y0 + 1, z0 + 2.2), iso(W - 1, y0 + 1, z0 + 2.2), iso(W - 1, y0 + D - 1, z0 + 2.2), iso(1, y0 + D - 1, z0 + 2.2)], 3),
            lip: open([iso(W * 0.38, y0 + D, z0 + 1.4), iso(W * 0.62, y0 + D, z0 + 1.4)]),
            sheets: [0, 1, 2, 3].map((j) => rounded([iso(2.4 + j * 0.5, y0 + 2 + j * 0.4, z0 + 0.7 + j * 0.3), iso(W - 3 + j * 0.3, y0 + 2 + j * 0.4, z0 + 0.7 + j * 0.3), iso(W - 3 + j * 0.3, y0 + D - 2.4, z0 + 0.7 + j * 0.3), iso(2.4 + j * 0.5, y0 + D - 2.4, z0 + 0.7 + j * 0.3)], 1.6)),
            hit: hull(corners8),
            center: iso(W / 2, y0 + D / 2, z0 + 1.2),
            rest: rests[k],
        }
    })
    // Two risers under each upper tier, standing on the tier below.
    const risers = [0, 1].map((k) => {
        // Inside both the tier below and the tier above, so each riser stands on something and carries something.
        const y = -k * 2.6 + 1.6
        return [1.2, W - 1.2].map((x) => open([iso(x, y, k * 5.4 + 2.2), iso(x, y, (k + 1) * 5.4)])).join("")
    })
    return { risers, tiers, viewBox: frameFor(rest, moving) }
}

function TrayTierSlot({ tier, index, p }: { tier: TrayTier; index: number; p: SceneProps }) {
    const count = Math.max(0, Math.min(4, Math.ceil((p.filledCount - index) / 3)))
    const { x, y } = usePull(slotOut(index, tier.rest, count > 0, p, 1.4), p.still)
    const s = p.scope
    return (
        <motion.g style={{ x, y }}>
            <Stroke d={tier.sil} className={`${s}__plate ${p.bright === index ? `${s}__hi` : `${s}__sil`}`} delay={0.1 + index * 0.15} play={p.play} still={p.still} />
            <Stroke d={tier.rim} className={`${s}__lo`} delay={0.25 + index * 0.15} play={p.play} still={p.still} />
            <clipPath id={`${s}-tray-${index}`}>
                <path d={tier.window} />
            </clipPath>
            <g clipPath={`url(#${s}-tray-${index})`}>
                {tier.sheets.map((sheet, j) => (
                    <Landing key={j} show={j < count} still={p.still}>
                        <path className={`${s}__plate ${s}__sil`} d={sheet} />
                    </Landing>
                ))}
            </g>
            <Stroke d={tier.lip} className={`${s}__mid`} delay={0.35 + index * 0.15} play={p.play} still={p.still} />
        </motion.g>
    )
}

function TrayScene({ model, p }: { model: TrayStack; p: SceneProps }) {
    const pulledTier = p.hovered ?? p.receiving ?? p.held ?? p.inviting
    return (
        <>
            {model.tiers.map((tier, index) => (
                <g key={index}>
                    {index > 0 && (
                        // A riser only shows while both tiers it joins are home; a pulled tier leaves it standing on nothing.
                        <motion.g
                            animate={{ opacity: pulledTier === index || pulledTier === index - 1 ? 0 : 1 }}
                            transition={p.still ? { duration: 0 } : CROSSFADE}
                        >
                            <Stroke d={model.risers[index - 1]} className={`${p.scope}__mid`} delay={0.05 + index * 0.15} play={p.play} still={p.still} />
                        </motion.g>
                    )}
                    <TrayTierSlot tier={tier} index={index} p={p} />
                </g>
            ))}
        </>
    )
}

// ── Tray: the plainest figure, one open desk tray. Files drop in as sheets that pile up; it lifts to meet a file.
const TRAY = { W: 17, D: 15, H: 3.4, lift: 1.4, raised: 2.2 }

interface SingleTray {
    footprint: string
    sil: string
    rim: string
    window: string
    lip: string
    sheets: string[]
    hit: Pt[]
    mouth: Pt
    viewBox: ViewBox
}

function buildTray(): SingleTray {
    const { W, D, H } = TRAY
    const solid = corners(0, W, 0, D, 0, H)
    const ring = [iso(1, 1, H), iso(W - 1, 1, H), iso(W - 1, D - 1, H), iso(1, D - 1, H)]
    const raised = solid.map((pt): Pt => [pt[0], pt[1] - TRAY.raised * ISO])
    // Each sheet sits a little askew on the one below, so a full tray reads as a pile, not one thick plate.
    const sheets = Array.from({ length: 6 }, (_, k) => {
        const dx = [0, 0.6, -0.3, 0.9, 0.2, -0.5][k]
        const dy = [0, -0.4, 0.5, 0.1, -0.6, 0.3][k]
        const z = 0.6 + k * 0.32
        return rounded([iso(2.6 + dx, 2.4 + dy, z), iso(W - 2.8 + dx, 2.4 + dy, z), iso(W - 2.8 + dx, D - 2.6 + dy, z), iso(2.6 + dx, D - 2.6 + dy, z)], 1.6)
    })
    return {
        // The tray's mark on the desk: hidden under it at rest, seen once it lifts.
        footprint: rounded([iso(0.6, 0.6, 0), iso(W - 0.6, 0.6, 0), iso(W - 0.6, D - 0.6, 0), iso(0.6, D - 0.6, 0)], 3),
        sil: rounded(hull(solid), 3),
        rim: rounded(ring, 2.4),
        window: openingAbove(ring, 3),
        lip: open([iso(W * 0.38, D, H * 0.6), iso(W * 0.62, D, H * 0.6)]),
        sheets,
        hit: hull(solid.concat(raised)),
        mouth: iso(W / 2, D / 2, H),
        viewBox: frameFor(solid, raised),
    }
}

function SingleTrayScene({ model, p }: { model: SingleTray; p: SceneProps }) {
    const s = p.scope
    // A full tray takes no more drops, so hover and drag no longer lift it.
    const hover = p.full ? null : p.hovered
    const invite = p.full ? null : p.inviting
    const target = p.receiving === 0 ? TRAY.raised : hover === 0 || p.held === 0 ? TRAY.lift : invite === 0 ? TRAY.lift * 0.5 : 0
    const lift = useMotionValue(target)
    const sprung = useSpring(lift, TRAY_SPRING)
    useEffect(() => {
        lift.set(target)
    }, [target, lift])
    const y = useTransform(p.still ? lift : sprung, (v) => -v * ISO)
    const shown = Math.min(p.filledCount, model.sheets.length)
    return (
        <>
            <Stroke d={model.footprint} className={`${s}__lo`} delay={0} play={p.play} still={p.still} />
            <motion.g style={{ y }}>
                <Stroke d={model.sil} className={`${s}__plate ${p.bright === 0 ? `${s}__hi` : `${s}__sil`}`} delay={0.1} play={p.play} still={p.still} />
                <Stroke d={model.rim} className={`${s}__lo`} delay={0.25} play={p.play} still={p.still} />
                <clipPath id={`${s}-tray1`}>
                    <path d={model.window} />
                </clipPath>
                <g clipPath={`url(#${s}-tray1)`}>
                    {model.sheets.map((sheet, k) => (
                        <Landing key={k} show={k < shown} still={p.still}>
                            <path className={`${s}__plate ${s}__sil`} d={sheet} />
                        </Landing>
                    ))}
                </g>
                <Stroke d={model.lip} className={`${s}__mid`} delay={0.35} play={p.play} still={p.still} />
            </motion.g>
        </>
    )
}

// ── Box: an open archive box with no lid that simply fills with papers; the next sheet waits above the opening.
const BOX = { W: 20, D: 13, H: 11 }

interface ArchiveBox {
    body: string
    rim: string
    rimFront: string
    inner: string
    window: string
    handle: string
    papers: string[]
    waiting: string
    hit: Pt[]
    mouth: Pt
    viewBox: ViewBox
}

function buildBox(): ArchiveBox {
    const { W, D, H } = BOX
    const body = hull(corners(0, W, 0, D, 0, H))
    const ring = [iso(0.8, 0.8, H), iso(W - 0.8, 0.8, H), iso(W - 0.8, D - 0.8, H), iso(0.8, D - 0.8, H)]
    // Papers stand in a row from the back; each new one rises a little higher, so a full box reads as full.
    const paper = (k: number, lift: number) =>
        rounded(face(1.6 + (k % 2) * 0.7, W - 1.8 - (k % 3) * 0.5, 2.2 + k * 1.5, H - 6 + lift, H + 1.4 + (k % 3) * 0.6 + lift), 1)
    const papers = Array.from({ length: 6 }, (_, k) => paper(k, 0))
    return {
        body: rounded(body, 2.4),
        rim: rounded(ring, 1.4),
        // The two front rim edges pass in front of the papers; the back edges sit behind them.
        rimFront: open([iso(0.8, D - 0.8, H), iso(W - 0.8, D - 0.8, H), iso(W - 0.8, 0.8, H)]),
        inner: `${open([iso(0.8, 0.8, H), iso(0.8, 0.8, 1), iso(W - 0.8, 0.8, 1)])}${open([iso(0.8, 0.8, 1), iso(0.8, D - 0.8, 1)])}`,
        window: openingAbove(ring, 9),
        handle: rounded(face(W / 2 - 2.6, W / 2 + 2.6, D, H - 4.6, H - 3.4), 1.6),
        papers,
        waiting: paper(0, 3),
        hit: hull(body.concat(ring.map((pt): Pt => [pt[0], pt[1] - 6 * ISO]))),
        mouth: iso(W / 2, D / 2, H),
        viewBox: frameFor(body, ring.map((pt): Pt => [pt[0], pt[1] - 5.8 * ISO])),
    }
}

function BoxScene({ model, p }: { model: ArchiveBox; p: SceneProps }) {
    const s = p.scope
    // A full box stops inviting: no waiting sheet, whether it is hovered or dragged over.
    const inviting = !p.full && (p.hovered === 0 || p.receiving === 0 || p.inviting === 0 || p.held === 0)
    const shown = Math.min(p.filledCount, model.papers.length)
    // The waiting sheet sits where the next paper will stand, raised above the opening.
    const nextIndex = Math.min(shown, model.papers.length - 1)
    const lift = (model.papers.length > 0 ? nextIndex : 0) * 1.5
    return (
        <>
            <Stroke d={model.body} className={`${s}__plate ${s}__sil`} delay={0} play={p.play} still={p.still} />
            <Stroke d={model.rim} className={`${s}__lo`} delay={0.15} play={p.play} still={p.still} />
            <Stroke d={model.inner} className={`${s}__lo`} clipPath={`url(#${s}-boxrim)`} delay={0.3} play={p.play} still={p.still} />
            <defs>
                <clipPath id={`${s}-boxrim`}>
                    <path d={model.rim} />
                </clipPath>
                <clipPath id={`${s}-boxwin`}>
                    <path d={model.window} />
                </clipPath>
            </defs>
            <g clipPath={`url(#${s}-boxwin)`}>
                {model.papers.map((paper, k) => (
                    <Landing key={k} show={k < shown} still={p.still}>
                        <path className={`${s}__plate ${s}__sil`} d={paper} />
                    </Landing>
                ))}
                <AnimatePresence>
                    {inviting && shown < model.papers.length && (
                        <motion.g
                            key="waiting"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: CROSSFADE }}
                            transition={p.still ? CROSSFADE : { type: "spring", ...TRAY_SPRING }}
                        >
                            <path className={`${s}__plate ${s}__mid`} d={model.waiting} transform={`translate(${f(-lift * ISO)} ${f((lift * ISO) / 2)})`} />
                        </motion.g>
                    )}
                </AnimatePresence>
            </g>
            <Stroke d={model.rimFront} className={`${s}__hi`} delay={0.2} play={p.play} still={p.still} />
            <Stroke d={model.handle} className={`${s}__mid`} delay={0.35} play={p.play} still={p.still} />
        </>
    )
}

// ── Mailbox: a wall mailbox; the slot flap swings out to take mail.
const MAIL = { W: 12, D: 9, H: 19, flapTop: 16, flapLen: 3.6 }

interface Mailbox {
    body: string
    roof: string
    roofCrease: string
    slot: string
    hit: Pt[]
    mouth: Pt
    viewBox: ViewBox
}

function flapPoints(degrees: number): Pt[] {
    const t = (degrees * Math.PI) / 180
    const { D, flapTop, flapLen } = MAIL
    const y = D + 0.05 + flapLen * Math.sin(t)
    const z = flapTop - flapLen * Math.cos(t)
    return [iso(2, D + 0.05, flapTop), iso(MAIL.W - 2, D + 0.05, flapTop), iso(MAIL.W - 2, y, z), iso(2, y, z)]
}

function buildMailbox(): Mailbox {
    const { W, D, H } = MAIL
    const body = hull(corners(0, W, 0, D, 0, H))
    const roof = hull(corners(-0.5, W + 0.5, -0.5, D + 0.7, H, H + 1.1))
    return {
        body: rounded(body, 4),
        roof: rounded(roof, 3),
        roofCrease: open([iso(0, D + 0.7, H + 1.1), iso(W + 0.5, D + 0.7, H + 1.1), iso(W + 0.5, 0, H + 1.1)]),
        slot: rounded(face(2, W - 2, D, MAIL.flapTop - MAIL.flapLen, MAIL.flapTop), 1),
        hit: hull(body.concat(roof, flapPoints(60))),
        mouth: iso(W / 2, D, MAIL.flapTop - 1.6),
        viewBox: frameFor(body.concat(roof, flapPoints(4)), flapPoints(70), 10),
    }
}

function MailboxScene({ model, p }: { model: Mailbox; p: SceneProps }) {
    const s = p.scope
    const open0 = p.hovered === 0 || p.receiving === 0 || p.inviting === 0 || p.held === 0
    const flapTarget = p.receiving === 0 ? 70 : open0 ? 52 : 4
    const flapAngle = useMotionValue(flapTarget)
    const flapSprung = useSpring(flapAngle, TRAY_SPRING)
    useEffect(() => {
        flapAngle.set(flapTarget)
    }, [flapTarget, flapAngle])
    const flap = useTransform(p.still ? flapAngle : flapSprung, (v) => rounded(flapPoints(v), 1.2))
    const fade = p.still ? undefined : { opacity: 0 }
    const show = p.play || p.still ? { opacity: 1 } : { opacity: 0 }
    return (
        <>
            <Stroke d={model.body} className={`${s}__plate ${s}__sil`} delay={0} play={p.play} still={p.still} />
            <Stroke d={model.roof} className={`${s}__plate ${s}__sil`} delay={0.15} play={p.play} still={p.still} />
            <Stroke d={model.roofCrease} className={`${s}__lo`} delay={0.3} play={p.play} still={p.still} />
            <Stroke d={model.slot} className={`${s}__plate ${s}__mid`} delay={0.35} play={p.play} still={p.still} />
            {/* Shapes that change every frame fade in instead of drawing a dash. */}
            <motion.path d={flap} className={`${s}__plate ${s}__hi`} initial={fade} animate={show} transition={{ duration: 0.4, delay: 0.6 }} />
        </>
    )
}

// ── Plain and Custom: one quiet mark instead of a figure, in a wider frame so it sits small and calm.
// The mark lowers a little toward the tray while a file is over it; the box itself does the gulp.
const MARK_FRAME: ViewBox = { x: 20, y: 100 - 250 / 3, w: 200, h: 500 / 3 }
const MARK_HIT: Pt[] = [[60, 50], [180, 50], [180, 150], [60, 150]]

interface PlainMark {
    tray: string
    lip: string
    shaft: string
    head: string
    hit: Pt[]
    mouth: Pt
    viewBox: ViewBox
}

interface CustomMark {
    icon: string
    keepColours: boolean
    hit: Pt[]
    mouth: Pt
    viewBox: ViewBox
}

function buildPlain(): PlainMark {
    return {
        tray: "M80 112v14a8 8 0 0 0 8 8h64a8 8 0 0 0 8-8v-14",
        lip: "M80 112h22l6 8h24l6-8h22",
        shaft: "M120 64v40",
        head: "M106 90l14 14 14-14",
        hit: MARK_HIT,
        mouth: [120, 118],
        viewBox: MARK_FRAME,
    }
}

function buildCustom(icon: string, keepColours: boolean): CustomMark {
    return { icon, keepColours, hit: MARK_HIT, mouth: [120, 100], viewBox: MARK_FRAME }
}

function useMarkDrop(p: SceneProps) {
    const target = p.receiving === 0 ? 10 : p.hovered === 0 || p.inviting === 0 || p.held === 0 ? 6 : 0
    const drop = useMotionValue(target)
    const sprung = useSpring(drop, TRAY_SPRING)
    useEffect(() => {
        drop.set(target)
    }, [target, drop])
    return p.still ? drop : sprung
}

function PlainScene({ model, p }: { model: PlainMark; p: SceneProps }) {
    const s = p.scope
    const y = useMarkDrop(p)
    return (
        <>
            <Stroke d={model.tray} className={`${s}__mark`} delay={0} play={p.play} still={p.still} />
            <Stroke d={model.lip} className={`${s}__mark`} delay={0.1} play={p.play} still={p.still} />
            <motion.g style={{ y }}>
                <Stroke d={model.shaft} className={`${s}__mark`} delay={0.2} play={p.play} still={p.still} />
                <Stroke d={model.head} className={`${s}__mark`} delay={0.3} play={p.play} still={p.still} />
            </motion.g>
        </>
    )
}

function CustomScene({ model, p, ink }: { model: CustomMark; p: SceneProps; ink: string }) {
    const s = p.scope
    const y = useMarkDrop(p)
    // No icon yet: the plain mark stands in, so the box never renders empty on the canvas.
    if (!model.icon) return <PlainScene model={buildPlain()} p={p} />
    const box = { x: 72, y: 52, width: 96, height: 96 }
    return (
        <motion.g
            style={{ y }}
            initial={p.still ? false : { opacity: 0 }}
            animate={p.play || p.still ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, ease: DRAW_EASE }}
        >
            {model.keepColours ? (
                <image href={model.icon} {...box} preserveAspectRatio="xMidYMid meet" />
            ) : (
                <>
                    {/* An alpha mask inside the SVG: the icon's shape painted in Ink, whatever colours the file has. */}
                    <mask id={`${s}-icon`} style={{ maskType: "alpha" }}>
                        <image href={model.icon} {...box} preserveAspectRatio="xMidYMid meet" />
                    </mask>
                    <rect {...box} fill={ink} mask={`url(#${s}-icon)`} />
                </>
            )}
        </motion.g>
    )
}

interface Point {
    x: number
    y: number
}

interface GhostState {
    key: number
    label: string
    ext: string
    from: Point
    to: Point
    refused: boolean
}

interface Accepted {
    file: File
    item: DropItem
}

// One rolling column per digit, so the percentage counts like an odometer.
function RollDigits({ value, scope, still }: { value: number; scope: string; still: boolean }) {
    const digits = String(value).split("")
    return (
        <span className={`${scope}__digits`} aria-hidden="true">
            {digits.map((digit, index) => (
                <span key={digits.length - index} className={`${scope}__digit`}>
                    <motion.span
                        className={`${scope}__reel`}
                        initial={false}
                        animate={{ y: -Number(digit) * DIGIT_HEIGHT }}
                        transition={still ? { duration: 0 } : { type: "spring", ...FILL_SPRING }}
                    >
                        {"0123456789".split("").map((n) => (
                            <span key={n}>{n}</span>
                        ))}
                    </motion.span>
                </span>
            ))}
            <span>%</span>
        </span>
    )
}

interface FileRowProps {
    item: DropItem
    label: string
    scope: string
    still: boolean
    onRemove: (id: number) => void
    registerRemove: (id: number, el: HTMLButtonElement | null) => void
}

function FileRow({ item, label, scope, still, onRemove, registerRemove }: FileRowProps) {
    const target = useMotionValue(item.progress)
    const smooth = useSpring(target, FILL_SPRING)
    useEffect(() => {
        target.set(item.progress)
    }, [item.progress, target])
    const percent = Math.round(item.progress * 100)

    return (
        <motion.li
            layout={!still}
            className={`${scope}__row`}
            initial={still ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? { opacity: 0, transition: CROSSFADE } : { opacity: 0, scale: 0.97, transition: EXIT }}
            transition={still ? CROSSFADE : { ...SNAP, opacity: { duration: 0.1 } }}
        >
            <span className={`${scope}__thumb`} aria-hidden="true">
                {item.thumb ? (
                    <img src={item.thumb} alt="" />
                ) : (
                    <>
                        <svg className={`${scope}__page`} viewBox="0 0 30 36" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
                            <path d="M3 1.5h15.5L27 9.5v25H3z" />
                            <path d="M18.5 1.5v8h8.5" />
                        </svg>
                        <span className={`${scope}__ext`}>{item.ext}</span>
                    </>
                )}
            </span>
            <span className={`${scope}__main`}>
                <span className={`${scope}__top`}>
                    <span className={`${scope}__name`} title={item.name}>
                        {middleEllipsis(item.name)}
                    </span>
                    <span className={`${scope}__size`}>{formatSize(item.size)}</span>
                </span>
                <span
                    className={`${scope}__track`}
                    role="progressbar"
                    aria-label={`Progress for ${label}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                >
                    <motion.span className={`${scope}__fill`} style={{ scaleX: still ? target : smooth }} />
                </span>
            </span>
            <span className={`${scope}__state`}>
                {item.kind === "done" ? (
                    <motion.svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        role="img"
                        aria-label="Done"
                        initial={{ scale: still ? 1 : 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={still ? CROSSFADE : POP}
                    >
                        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                    </motion.svg>
                ) : item.kind === "failed" ? (
                    <span className={`${scope}__failed`}>Didn't make it</span>
                ) : (
                    <RollDigits value={percent} scope={scope} still={still} />
                )}
            </span>
            <button ref={(el) => registerRemove(item.id, el)} type="button" className={`${scope}__remove`} aria-label={`Remove ${label}`} onClick={() => onRemove(item.id)}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                </svg>
            </button>
        </motion.li>
    )
}

interface TagItemProps {
    item: DropItem
    label: string
    scope: string
    still: boolean
    delay: number
    origin: () => Point | null
    onRemove: (id: number) => void
    registerRemove: (id: number, el: HTMLButtonElement | null) => void
}

// A dropped file shown as a tag inside the well. It issues from the mouth of the slot that took it (FLIP measured once
// on mount), fills a tint layer behind its text while it reads, and swaps its extension for a check when done.
// AnimatePresence in popLayout hands its child a ref to measure it, so the tag must forward one.
const TagItem = forwardRef<HTMLLIElement, TagItemProps>(function TagItem({ item, label, scope, still, delay, origin, onRemove, registerRemove }, ref) {
    const body = useRef<HTMLSpanElement>(null)
    const issue = useMotionValue(still ? 0 : 1)
    const from = useRef<Point>({ x: 0, y: 0 })
    const transform = useTransform(issue, (p) => `translate(${from.current.x * p}px, ${from.current.y * p}px) scale(${1 - 0.4 * p})`)
    const opacity = useTransform(issue, [1, 0.6], [0, 1])
    const target = useMotionValue(item.progress)
    const smooth = useSpring(target, FILL_SPRING)
    useEffect(() => {
        target.set(item.progress)
    }, [item.progress, target])

    useEffect(() => {
        if (still) return
        const element = body.current
        const start = origin()
        if (!element || !start) {
            issue.set(0)
            return
        }
        const rect = element.getBoundingClientRect()
        from.current = { x: start.x - (rect.left + rect.width / 2), y: start.y - (rect.top + rect.height / 2) }
        const flight = animate(issue, 0, { ...SNAP, delay })
        return () => flight.stop()
        // Measured once, when the tag mounts: later reflows belong to the layout animation.
    }, [])

    const percent = Math.round(item.progress * 100)
    const done = item.kind === "done"
    return (
        <motion.li
            ref={ref}
            layout={!still}
            className={`${scope}__tag`}
            data-failed={item.kind === "failed" ? "" : undefined}
            initial={false}
            exit={still ? { opacity: 0, transition: CROSSFADE } : { opacity: 0, scale: 0.96, transition: EXIT }}
            transition={{ layout: SNAP }}
        >
            <motion.span
                ref={body}
                className={`${scope}__tagBody`}
                style={still ? undefined : { transform, opacity }}
                initial={still ? { opacity: 0 } : false}
                animate={still ? { opacity: 1 } : undefined}
                transition={CROSSFADE}
            >
                <span
                    className={`${scope}__tagTrack`}
                    role="progressbar"
                    aria-label={`Progress for ${label}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                >
                    <motion.span
                        className={`${scope}__tagFill`}
                        style={{ scaleX: still ? target : smooth }}
                        initial={false}
                        animate={{ opacity: done ? 0 : 1 }}
                        transition={still ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    />
                </span>
                <span className={`${scope}__tagBadge`}>
                    {done ? (
                        <motion.svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            role="img"
                            aria-label="Done"
                            initial={{ scale: still ? 1 : 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={still ? CROSSFADE : POP}
                        >
                            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                        </motion.svg>
                    ) : item.kind === "failed" ? (
                        <span className={`${scope}__failed`} aria-hidden="true">!</span>
                    ) : (
                        item.ext
                    )}
                </span>
                <span className={`${scope}__tagName`} title={item.name}>
                    {middleEllipsis(item.name, 22)}
                </span>
                {item.kind === "failed" && <span className={`${scope}__sr`}>{item.reason ? `Didn't make it: ${item.reason}` : "Didn't make it"}</span>}
                <button ref={(el) => registerRemove(item.id, el)} type="button" className={`${scope}__tagRemove`} aria-label={`Remove ${label}`} onClick={() => onRemove(item.id)}>
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
                        <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                    </svg>
                </button>
            </motion.span>
        </motion.li>
    )
})

interface GhostProps {
    ghost: GhostState
    scope: string
    onArrive: () => void
    onGone: () => void
}

// The dropped file, pulled into the box on an ease-in path. Accepted files land; refused ones bounce off and fade.
function Ghost({ ghost, scope, onArrive, onGone }: GhostProps) {
    const travel = useMotionValue(0)
    const opacity = useMotionValue(1)
    const dx = ghost.to.x - ghost.from.x
    const dy = ghost.to.y - ghost.from.y
    const length = Math.max(1, Math.hypot(dx, dy))
    const weightX = Math.abs(dx) / length
    const weightY = Math.abs(dy) / length
    // Stretch shared between the axes by travel direction. No rotate or skew, so text never tilts.
    const transform = useTransform(travel, (t) => {
        const x = ghost.from.x + dx * t
        const y = ghost.from.y + dy * t
        const stretch = 0.25 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)))
        const shrink = 1 - 0.4 * t
        return `translate(${x}px, ${y}px) scale(${shrink * (1 + stretch * weightX)}, ${shrink * (1 + stretch * weightY)})`
    })

    useEffect(() => {
        let cancelled = false
        const running: ReturnType<typeof animate>[] = []
        const run = async () => {
            const toward = animate(travel, ghost.refused ? 0.55 : 1, {
                duration: ghost.refused ? 0.2 : 0.28,
                ease: SWALLOW_EASE,
            })
            running.push(toward)
            await toward
            if (cancelled) return
            onArrive()
            if (!ghost.refused) {
                onGone()
                return
            }
            const back = animate(travel, 0.15, SNAP)
            const fade = animate(opacity, 0, { duration: 0.24 })
            running.push(back, fade)
            await fade
            if (!cancelled) onGone()
        }
        void run()
        return () => {
            cancelled = true
            running.forEach((animation) => animation.stop())
        }
        // The ghost remounts per drop (keyed), so this runs once per flight.
    }, [])

    return (
        // The clip keeps the chip inside the box while it flies, so it never paints over the page.
        <div className={`${scope}__ghostClip`}>
            <motion.div className={`${scope}__ghost`} style={{ transform, opacity }} aria-hidden="true">
                <span className={`${scope}__chip`}>
                    <span className={`${scope}__chipExt`}>{ghost.ext}</span>
                    <span className={`${scope}__chipName`}>{ghost.label}</span>
                </span>
            </motion.div>
        </div>
    )
}

// Whether an element is on screen. The observer is only created when enabled, so a static or reduced-motion
// render never sets one up. Once: stays true after the first time the element is seen.
function useOnScreen(ref: RefObject<Element>, enabled: boolean, amount: number, once: boolean): boolean {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!enabled || !el || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.intersectionRatio >= amount) {
                    setVisible(true)
                    if (once) observer.disconnect()
                } else if (!once) setVisible(false)
            },
            { threshold: amount },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, enabled, amount, once])
    return enabled && visible
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Kern_Dropzone(props: Kern_DropzoneProps) {
    const { prompt } = withDefaults(CONTENT_DEFAULTS, props.content)
    const { maxSize, maxFiles, accepts } = withDefaults(LIMITS_DEFAULTS, props.limits)
    const { paceLocalReads } = withDefaults(UPLOAD_DEFAULTS, props.upload)
    const { style: look, figure, icon, keepColours, filesAs, radius, ink, surface, muted, accent, success, refuse, font } = withDefaults(LOOK_DEFAULTS, props.look)
    const { blockOutsideDrops, idleDemo } = withDefaults(BEHAVIOR_DEFAULTS, props.behavior)
    // Hairline Box, Folder and Single tray draw six sheets, so they take six at most: a full box says so instead of looking stuck. Plain and Custom have no sheets.
    const capacity = look === "Hairline" && (figure === "Box" || figure === "Folder" || figure === "Tray") ? Math.min(maxFiles, 6) : maxFiles
    const { onFileAdded, onFileRefused, style } = props

    // Canvas and asset export both render the static frame: no window listeners there.
    const frozen = useIsStaticRenderer()
    const reduceMotion = useReducedMotion() === true

    // Unique per instance, so two drop boxes on one page never share colours or styles.
    const scope = `kdz${useId().replace(/[^a-zA-Z0-9]/g, "")}`
    const rowRadius = Math.max(8, radius - 12)
    const tint = `color-mix(in srgb, ${muted} 12%, ${surface})`
    // Paper depth: a faint edge plus two soft drops, tinted from ink so custom colours keep the material.
    const edge = `color-mix(in srgb, ${ink} 8%, transparent)`
    const drop = `color-mix(in srgb, ${ink} 6%, transparent)`
    const deep = `color-mix(in srgb, ${ink} 12%, transparent)`
    const thumbRadius = Math.max(4, rowRadius - 10)
    const typeNote = accepts === "Anything" ? "" : `${accepts === "PDF" ? "PDFs" : accepts} only. `

    const [items, setItems] = useState<DropItem[]>([])
    // Accessible names: two files with the same name get a number, so each remove and progress label is unique.
    const labels = useMemo(() => {
        const total = new Map<string, number>()
        for (const item of items) total.set(item.name, (total.get(item.name) ?? 0) + 1)
        // A numbered label must not equal a real file name (a file may already be called "x (2)") or a label given out.
        const names = new Set(items.map((item) => item.name))
        const given = new Set<string>()
        const out = new Map<number, string>()
        for (const item of items) {
            if ((total.get(item.name) ?? 0) < 2) {
                out.set(item.id, item.name)
                continue
            }
            let n = 1
            while (names.has(`${item.name} (${n})`) || given.has(`${item.name} (${n})`)) n += 1
            const label = `${item.name} (${n})`
            given.add(label)
            out.set(item.id, label)
        }
        return out
    }, [items])
    const [dragging, setDragging] = useState(false)
    const [refusalText, setRefusalText] = useState("")
    const [liveText, setLiveText] = useState("")

    const inputRef = useRef<HTMLInputElement>(null)
    const chooseRef = useRef<HTMLButtonElement>(null)
    // Live announcements are queued here and flushed once per tick, so a mixed drop reports both halves.
    const announcement = useRef<string[]>([])
    const announceTimer = useRef<number | undefined>(undefined)
    // Size refusals in a row climb SIZE_LINES. A ref, not state, so a success and a refusal in one tick agree on the count.
    const refusalStreak = useRef(0)
    const refusalTimer = useRef<number | undefined>(undefined)
    // Each file's × button, so focus can move to a neighbouring file after a removal.
    const removeButtons = useRef(new Map<number, HTMLButtonElement>())
    // When the tags no longer fit, the list scrolls; a soft fade at its foot says there is more below.
    const tagsRef = useRef<HTMLUListElement>(null)
    const [moreBelow, setMoreBelow] = useState(false)
    const nextId = useRef(0)
    const jobs = useRef(new Map<number, AbortController>())
    const thumbs = useRef(new Map<number, string>())
    const realProgress = useRef(new Map<number, number>())
    const rootRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const [ghost, setGhost] = useState<GhostState | null>(null)
    const ghostKey = useRef(0)
    const pending = useRef<{ accepted: Accepted[]; refusal: Refusal | null } | null>(null)
    // How long each new tag waits before it issues from the figure: the card lands and the copy makes room first,
    // then tags follow 50 ms apart.
    const issueDelay = useRef(new Map<number, number>())

    // Reduced motion and the static renderer share one quiet path: crossfades, no stretch, shake or overshoot.
    const still = reduceMotion || frozen
    const shakeX = useMotionValue(0)
    const squashX = useMotionValue(1)
    const squashY = useMotionValue(1)
    // The cabinet: geometry depends only on how many slots there are.
    const svgRef = useRef<SVGSVGElement>(null)
    const figureModel = useMemo<FigureModel>(
        () => (look === "Plain" ? { kind: "Plain", model: buildPlain() } : look === "Custom" ? { kind: "Custom", model: buildCustom(icon, keepColours) } : buildFigure(figure, maxFiles)),
        [look, icon, keepColours, figure, maxFiles]
    )
    const slots = useMemo(() => figureSlots(figureModel), [figureModel])
    const viewBox = figureModel.model.viewBox
    const [hovered, setHovered] = useState<number | null>(null)
    // Inside the box at all, not only over a slot: the idle demo stops for anyone pointing at it.
    const [pointerIn, setPointerIn] = useState(false)
    // The drawer a dropped file is flying to: it opens to receive, then rests ajar once filled.
    const [receiving, setReceiving] = useState<number | null>(null)
    // Add and remove mirror each other: a slot holds open after a card lands, and opens to let a removed file's card go.
    const [held, setHeld] = useState<number | null>(null)
    const heldTimer = useRef<number | undefined>(undefined)
    // Removed files leave the list at once; their card leaves the figure a beat later, once its slot is open.
    const [leaving, setLeaving] = useState<ReadonlySet<number>>(() => new Set())
    const leaveTimers = useRef(new Set<number>())
    // Draw the figure in once, the first time it is seen.
    const figureInView = useOnScreen(svgRef, !still, 0.4, true)

    useEffect(() => {
        const list = tagsRef.current
        if (frozen || !list || typeof ResizeObserver === "undefined") return
        const check = () => setMoreBelow(list.scrollTop + list.clientHeight < list.scrollHeight - 1)
        const observer = new ResizeObserver(check)
        observer.observe(list)
        list.addEventListener("scroll", check, { passive: true })
        check()
        return () => {
            observer.disconnect()
            list.removeEventListener("scroll", check)
        }
    }, [frozen, filesAs, items.length])

    // A file dropped outside the box would otherwise open in the tab. Block that on the live page only.
    // Scoped: only file drags, and never an event another element has already handled, so other drop targets keep theirs.
    useEffect(() => {
        if (frozen || !blockOutsideDrops || typeof window === "undefined") return
        const block = (event: Event) => {
            if (event.defaultPrevented) return
            const types = (event as globalThis.DragEvent).dataTransfer?.types
            if (!types || !Array.from(types).includes("Files")) return
            event.preventDefault()
        }
        window.addEventListener("dragover", block)
        window.addEventListener("drop", block)
        return () => {
            window.removeEventListener("dragover", block)
            window.removeEventListener("drop", block)
        }
    }, [frozen, blockOutsideDrops])

    // Stop running jobs and release preview URLs when the component leaves the page.
    useEffect(() => {
        const runningJobs = jobs.current
        const previews = thumbs.current
        const timers = leaveTimers.current
        return () => {
            runningJobs.forEach((controller) => controller.abort())
            previews.forEach((url) => URL.revokeObjectURL(url))
            timers.forEach((timer) => window.clearTimeout(timer))
            window.clearTimeout(heldTimer.current)
            window.clearTimeout(announceTimer.current)
            window.clearTimeout(refusalTimer.current)
        }
    }, [])

    function patchItem(id: number, patch: Partial<DropItem>) {
        // A finished job no longer needs its controller; drop it so the map does not grow per drop.
        if (patch.kind === "done" || patch.kind === "failed") jobs.current.delete(id)
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    }

    // Reads the file on this device. Real progress goes to realProgress; when paced, the pacer owns the display.
    async function readOnDevice(file: File, id: number, signal: AbortSignal, paced: boolean) {
        const report = (value: number) => {
            realProgress.current.set(id, value)
            if (!paced) patchItem(id, value >= 1 ? { kind: "done", progress: 1 } : { progress: value })
        }
        if (typeof file.stream !== "function") {
            report(1)
            return
        }
        const reader = file.stream().getReader()
        signal.addEventListener("abort", () => void reader.cancel())
        let loaded = 0
        try {
            let chunk = await reader.read()
            while (!chunk.done) {
                loaded += chunk.value.byteLength
                report(Math.min(0.999, loaded / Math.max(1, file.size)))
                chunk = await reader.read()
            }
            // A cancelled read ends like a finished one; a removed file must not report done.
            if (signal.aborted) return
            report(1)
        } catch (error: unknown) {
            // An abort is expected: the file was removed or the component left the page.
            if (signal.aborted || isAbortError(error)) return
            realProgress.current.set(id, -1)
            patchItem(id, { kind: "failed", reason: describeError(error) })
            announce(`${file.name} didn't make it`)
        }
    }

    // Shows local progress in seeded bursts, never ahead of what has really been read.
    async function paceDisplay(id: number, seed: number, signal: AbortSignal) {
        for (const step of paceSchedule(seed)) {
            await waitFor(step.wait, signal)
            for (;;) {
                if (signal.aborted) return
                const real = realProgress.current.get(id) ?? 0
                if (real < 0) return
                if (real >= step.value) break
                await waitFor(60, signal)
            }
            patchItem(id, step.value >= 1 ? { kind: "done", progress: 1 } : { progress: step.value })
        }
    }

    function startJob(file: File, id: number) {
        const controller = new AbortController()
        jobs.current.set(id, controller)
        void readOnDevice(file, id, controller.signal, paceLocalReads)
        if (paceLocalReads) void paceDisplay(id, hashString(`${file.name}:${file.size}`), controller.signal)
    }

    function refuseWith(reason: Refusal) {
        const count = reason === "size" ? refusalStreak.current + 1 : refusalStreak.current
        const line =
            reason === "size"
                ? SIZE_LINES[Math.min(count - 1, SIZE_LINES.length - 1)]
                : reason === "type"
                  ? TYPE_LINE
                  : FULL_LINE
        // Every refusal restarts the 8 s window; a ladder left idle for that long starts again at the first line.
        refusalStreak.current = count
        window.clearTimeout(refusalTimer.current)
        refusalTimer.current = window.setTimeout(() => {
            refusalStreak.current = 0
        }, 8000)
        setRefusalText(line)
        announce(line)
        shake()
        onFileRefused?.()
    }

    // Damped sideways shake from a spring impulse. Starts from wherever x is, so a quick retry never restarts from zero.
    function shake() {
        if (still) return
        void animate(shakeX, 0, { type: "spring", stiffness: 600, damping: 12, velocity: -240 })
    }

    // One gulp: an impulse that squashes the box, overshoots, and settles.
    function gulp() {
        if (still) return
        void animate(squashY, 1, { type: "spring", stiffness: 260, damping: 14, velocity: -1.4 })
        void animate(squashX, 1, { type: "spring", stiffness: 260, damping: 14, velocity: 0.9 })
    }

    function commit(accepted: Accepted[]) {
        if (accepted.length === 0) return
        accepted.forEach((entry, k) => issueDelay.current.set(entry.item.id, 0.2 + k * 0.05))
        setItems((prev) => [...prev, ...accepted.map((entry) => entry.item)])
        accepted.forEach((entry) => startJob(entry.file, entry.item.id))
        setRefusalText("")
        refusalStreak.current = 0
        announce(`${accepted.length === 1 ? "1 file" : `${accepted.length} files`} added`)
        // The accepted files reach the page as a DOM event on the box. Nothing is sent anywhere; the site's own code decides.
        rootRef.current?.dispatchEvent(new CustomEvent("kern-dropzone:added", { bubbles: true, detail: { files: accepted.map((entry) => entry.file) } }))
        onFileAdded?.()
    }

    // Lands a delivery that is still in flight, so a new drop never loses the previous one. Returns how many it added.
    function flushPending(): number {
        const delivery = pending.current
        if (!delivery) return 0
        pending.current = null
        commit(delivery.accepted)
        if (delivery.refusal) refuseWith(delivery.refusal)
        return delivery.accepted.length
    }

    function deliver(list: FileList | null, point: Point | null) {
        if (!list || list.length === 0) return
        const landed = flushPending()
        // A file on its way out no longer counts against the limit, so a drop right after a removal is not refused.
        const listed = items.filter((item) => !leaving.has(item.id)).length
        const { accepted, refusal, refusedName } = evaluate(list, listed + landed, capacity)
        const root = rootRef.current
        const box = boxRef.current
        if (still || !point || !root || !box) {
            if (accepted.length > 0) gulp()
            commit(accepted)
            if (refusal) refuseWith(refusal)
            return
        }
        const rootRect = root.getBoundingClientRect()
        const boxRect = box.getBoundingClientRect()
        const lead = accepted[0]?.item
        const name = lead ? lead.name : refusedName
        pending.current = { accepted, refusal }
        if (lead) setReceiving(nextSlot(figureModel.kind, listed + landed, slots.length))
        ghostKey.current += 1
        setGhost({
            key: ghostKey.current,
            label: accepted.length > 1 ? `${middleEllipsis(name, 20)} +${accepted.length - 1}` : middleEllipsis(name, 22),
            ext: extensionOf(name),
            from: { x: point.x - rootRect.left, y: point.y - rootRect.top },
            to: slotPoint(nextSlot(figureModel.kind, listed + landed, slots.length)) ?? { x: boxRect.left + boxRect.width / 2 - rootRect.left, y: boxRect.top + boxRect.height / 2 - rootRect.top },
            refused: !lead,
        })
    }

    // Kept in refs so the ghost's one-shot effect always calls the latest handlers.
    // Updated after each commit (not during render); the ghost lands 200–280 ms later, so it always sees the latest.
    const arriveRef = useRef<() => void>(() => undefined)
    useEffect(() => {
        arriveRef.current = () => {
            const delivery = pending.current
            pending.current = null
            const slot = receiving
            setReceiving(null)
            if (!delivery) return
            if (delivery.accepted.length > 0) {
                // The slot keeps open while the card settles and its tag comes out, then closes.
                if (slot !== null) holdOpen(slot, 380)
                gulp()
                commit(delivery.accepted)
            }
            if (delivery.refusal) refuseWith(delivery.refusal)
        }
    })

    // Queues one part of the live message. Parts queued in the same tick are joined into one announcement; the text is
    // cleared and then set again, so a repeat of the same message is a change a screen reader announces.
    function announce(part: string) {
        announcement.current.push(part)
        if (announcement.current.length > 1) return
        queueMicrotask(() => {
            const joined = announcement.current.join(". ")
            announcement.current = []
            const message = /[.!?]$/.test(joined) ? joined : `${joined}.`
            setLiveText("")
            window.clearTimeout(announceTimer.current)
            announceTimer.current = window.setTimeout(() => setLiveText(message), 60)
        })
    }

    function holdOpen(slot: number, ms: number) {
        window.clearTimeout(heldTimer.current)
        setHeld(slot)
        heldTimer.current = window.setTimeout(() => setHeld(null), ms)
    }

    function evaluate(list: FileList, existing: number, limit: number) {
        const accepted: Accepted[] = []
        let refusal: Refusal | null = null
        let refusedName = ""

        for (const file of Array.from(list)) {
            if (existing + accepted.length >= limit) {
                if (!refusal) refusal = "full"
                if (!refusedName) refusedName = file.name
                break
            }
            if (!matchesAccept(file, accepts)) {
                if (!refusal) refusal = "type"
                if (!refusedName) refusedName = file.name
                continue
            }
            if (file.size > maxSize * MB) {
                if (!refusal) refusal = "size"
                if (!refusedName) refusedName = file.name
                continue
            }
            nextId.current += 1
            const id = nextId.current
            const thumb = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
            if (thumb) thumbs.current.set(id, thumb)
            accepted.push({
                file,
                item: { id, name: file.name, size: file.size, ext: extensionOf(file.name), kind: "reading", progress: 0, thumb },
            })
        }

        return { accepted, refusal, refusedName }
    }

    function registerRemove(id: number, el: HTMLButtonElement | null) {
        if (el) removeButtons.current.set(id, el)
        else removeButtons.current.delete(id)
    }

    function removeItem(id: number) {
        // A file already leaving has a disabled ×, so a second press or a Tab onto it does nothing.
        const exiting = removeButtons.current.get(id)
        if (exiting?.disabled) return
        // Focus moves to the next file still listed, else the previous one, else the choose button, so it stays near the work.
        const listed = items.filter((item) => !leaving.has(item.id))
        const index = listed.findIndex((item) => item.id === id)
        const neighbour = listed[index + 1] ?? listed[index - 1]
        const next = neighbour ? removeButtons.current.get(neighbour.id) : undefined
        const fallback = next ?? chooseRef.current
        fallback?.focus()
        if (exiting) exiting.disabled = true
        jobs.current.get(id)?.abort()
        jobs.current.delete(id)
        realProgress.current.delete(id)
        issueDelay.current.delete(id)
        const preview = thumbs.current.get(id)
        if (preview) {
            URL.revokeObjectURL(preview)
            thumbs.current.delete(id)
        }
        // The same label the × carries, so two files with one name are told apart.
        announce(`${labels.get(id) ?? "File"} removed`)
        if (still) {
            setItems((prev) => prev.filter((item) => item.id !== id))
            return
        }
        // The slot holding the last card opens now; the card lifts out of it 200 ms later, and it closes at 560 ms.
        holdOpen(nextSlot(figureModel.kind, Math.max(0, items.length - 1), slots.length), 560)
        setLeaving((prev) => new Set(prev).add(id))
        const timer = window.setTimeout(() => {
            leaveTimers.current.delete(timer)
            setItems((prev) => prev.filter((item) => item.id !== id))
            setLeaving((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }, 200)
        leaveTimers.current.add(timer)
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        // Keyboard path: no drop point, so the shortened story — gulp, then rows.
        deliver(event.target.files, null)
        event.target.value = ""
    }

    // The svg fits its viewBox inside its box and centres it, so a short frame leaves margins. This maps between the two,
    // margins included, so the pointer finds the drawing where it is drawn.
    function fitFrame(rect: DOMRect, vb: ViewBox) {
        const scale = Math.min(Math.max(1, rect.width) / vb.w, Math.max(1, rect.height) / vb.h)
        return { scale, left: rect.left + (rect.width - vb.w * scale) / 2, top: rect.top + (rect.height - vb.h * scale) / 2 }
    }

    // Which slot is under the pointer, tested against the rest pose (openings never move), so trays cannot flicker.
    function slotAt(clientX: number, clientY: number): number | null {
        const svg = svgRef.current
        if (!svg) return null
        const vb = viewBox
        const fit = fitFrame(svg.getBoundingClientRect(), vb)
        const point: Pt = [vb.x + (clientX - fit.left) / fit.scale, vb.y + (clientY - fit.top) / fit.scale]
        const index = slots.findIndex((slot) => inside(point, slot.hit))
        return index >= 0 ? index : null
    }

    // A slot's mouth in viewport coordinates: where a tag issues from.
    function slotClient(index: number): Point | null {
        const svg = svgRef.current
        const cell = slots[index]
        if (!svg || !cell) return null
        const vb = viewBox
        const fit = fitFrame(svg.getBoundingClientRect(), vb)
        return { x: fit.left + (cell.center[0] - vb.x) * fit.scale, y: fit.top + (cell.center[1] - vb.y) * fit.scale }
    }

    // A slot's centre in root coordinates: where the ghost is headed.
    function slotPoint(index: number): Point | null {
        const at = slotClient(index)
        const root = rootRef.current
        if (!at || !root) return null
        const rootRect = root.getBoundingClientRect()
        return { x: at.x - rootRect.left, y: at.y - rootRect.top }
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (event.pointerType !== "mouse" || still) return
        setHovered(slotAt(event.clientX, event.clientY))
    }

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
        // Only file drags light the box; a dragged link or text selection passes through untouched.
        if (!Array.from(event.dataTransfer.types).includes("Files")) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
        setDragging(true)
        setHovered(slotAt(event.clientX, event.clientY))
    }

    function handleDragLeave(event: DragEvent<HTMLDivElement>) {
        const next = event.relatedTarget
        if (next instanceof Node && event.currentTarget.contains(next)) return
        setDragging(false)
        setHovered(null)
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault()
        setDragging(false)
        setHovered(null)
        deliver(event.dataTransfer.files, { x: event.clientX, y: event.clientY })
    }

    // One bright edge: the slot under the pointer, otherwise the next free slot (or the last one when full).
    // Idle demo: while the figure is on screen and empty, slots open, take a card, close, fill up and empty again.
    // It stops the moment anyone hovers, drags or drops, and never runs on the canvas or with reduced motion.
    const [demo, setDemo] = useState<{ filled: number; pulled: number | null }>({ filled: 0, pulled: null })
    const figureOnScreen = useOnScreen(svgRef, !still, 0.25, false)
    // Browsers stop reporting the figure's visibility while the tab is hidden, so the tab state is read directly.
    const [tabVisible, setTabVisible] = useState(true)
    useEffect(() => {
        if (frozen || typeof document === "undefined") return
        const update = () => setTabVisible(document.visibilityState !== "hidden")
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [frozen])
    // Keyboard focus inside the component stops the demo, as the pointer does.
    const [focusIn, setFocusIn] = useState(false)
    // The idle demo belongs to the Hairline figures; Plain and Custom stay quiet.
    const demoActive = idleDemo && look === "Hairline" && !still && figureOnScreen && tabVisible && items.length === 0 && !dragging && !pointerIn && !focusIn && hovered === null && ghost === null
    useEffect(() => {
        if (!demoActive) {
            setDemo({ filled: 0, pulled: null })
            return
        }
        const controller = new AbortController()
        const { signal } = controller
        const n = slots.length
        const cycle = n > 1 ? n : 3
        const slotOf = (k: number) => (n > 1 ? nextSlot(figureModel.kind, k, n) : 0)
        const pause = async (ms: number) => {
            await waitFor(ms, signal)
            if (signal.aborted) throw signal.reason
        }
        const run = async () => {
            await pause(900)
            for (;;) {
                for (let k = 0; k < cycle; k++) {
                    setDemo((d) => ({ ...d, pulled: slotOf(k) }))
                    await pause(650)
                    setDemo({ filled: k + 1, pulled: slotOf(k) })
                    await pause(700)
                    setDemo((d) => ({ ...d, pulled: null }))
                    await pause(900)
                }
                await pause(1200)
                for (let k = cycle - 1; k >= 0; k--) {
                    setDemo((d) => ({ ...d, pulled: slotOf(k) }))
                    await pause(650)
                    setDemo({ filled: k, pulled: slotOf(k) })
                    await pause(600)
                    setDemo((d) => ({ ...d, pulled: null }))
                    await pause(700)
                }
                await pause(1600)
            }
        }
        run().catch((error: unknown) => {
            if (signal.aborted) return
            throw error
        })
        return () => controller.abort()
    }, [demoActive, slots.length, figureModel.kind])

    const shownFilled = items.length > 0 ? items.length : demo.filled
    const nextFree = nextSlot(figureModel.kind, shownFilled, slots.length)
    const brightSlot = hovered ?? demo.pulled ?? nextFree
    const scene: SceneProps = {
        scope,
        filledCount: shownFilled,
        full: shownFilled >= capacity,
        hovered,
        receiving: receiving ?? demo.pulled,
        held,
        inviting: dragging && hovered === null ? nextFree : null,
        bright: brightSlot,
        still,
        play: figureInView,
    }

    const css = `
.${scope} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 12px; color: ${ink}; -webkit-font-smoothing: antialiased; }
.${scope}__box { position: relative; flex: 1 1 auto; min-height: 220px; box-sizing: border-box; display: flex; padding: 8px; border-radius: ${radius}px; background: ${surface}; box-shadow: 0 0 0 1px ${edge}, 0 1px 2px -1px ${drop}, 0 6px 14px -4px ${drop}, 0 22px 40px -18px ${deep}; transition: ${reduceMotion ? "none" : "box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1)"}; }
.${scope}__box { margin: 4px; }
.${scope}__box[data-filled] { flex: 0 1 auto; min-height: 176px; }
.${scope}__box[data-dragging] { margin: 0; }
.${scope}__copy { display: flex; flex-direction: column; align-items: center; gap: 8px; }
/* The counter keeps a fixed size and ignores Font, so its reel height always fits the digits. */
.${scope}__digits { display: inline-flex; height: ${DIGIT_HEIGHT}px; font-size: 13px; line-height: ${DIGIT_HEIGHT}px; overflow: hidden; }
.${scope}__digit { display: block; height: ${DIGIT_HEIGHT}px; overflow: hidden; }
.${scope}__reel { display: flex; flex-direction: column; }
.${scope}__reel span { display: block; height: ${DIGIT_HEIGHT}px; line-height: ${DIGIT_HEIGHT}px; }
.${scope}__ghostClip { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 3; }
.${scope}__ghost { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 3; pointer-events: none; transform-origin: 0 0; }
.${scope}__chip { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px 8px 8px; border-radius: 12px; background: ${surface}; box-shadow: 0 0 0 1px ${edge}, 0 8px 18px -6px ${deep}; white-space: nowrap; }
.${scope}__chipExt { padding: 4px 5px; border-radius: 5px; background: ${tint}; font-size: ${em(10)}; line-height: 1; font-weight: 600; color: ${ink}; }
.${scope}__chipName { font-size: ${em(14)}; line-height: 1.3; font-weight: 500; color: ${ink}; }
.${scope}__box[data-dragging] { box-shadow: 0 0 0 1.5px ${ink}, 0 2px 4px -1px ${drop}, 0 10px 20px -6px ${deep}, 0 30px 56px -20px ${deep}; }
.${scope}__well { flex: 1 1 auto; position: relative; overflow: hidden; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px 20px 56px; border-radius: ${Math.max(4, radius - 8)}px; background: color-mix(in srgb, ${muted} 6%, ${surface}); box-shadow: inset 0 1px 2px ${drop}, inset 0 0 0 1px ${edge}; text-align: center; }
/* Matches the bottom room kept for the refusal line, so figure and copy sit at the optical centre; it gives way first when space is short. */
.${scope}__well::before { content: ""; flex: 0 100 28px; }
/* The figure always fits the well: capped in width and height, clipped to its own frame (every pull, lid and flap is inside it). */
.${scope}__cabinet { display: block; flex: 0 1 auto; width: min(300px, 88%); height: auto; max-height: 250px; min-height: 72px; margin-bottom: 8px; overflow: hidden; }
.${scope}__box[data-filled] .${scope}__cabinet { width: 120px; max-height: 104px; margin-bottom: 0; }
.${scope}__cabinet path { fill: none; stroke-width: 1; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
.${scope}__cabinet path.${scope}__plate { fill: color-mix(in srgb, ${muted} 6%, ${surface}); }
.${scope}__sil { stroke: ${muted}; }
.${scope}__mid { stroke: color-mix(in srgb, ${muted} 62%, ${surface}); }
.${scope}__lo { stroke: color-mix(in srgb, ${muted} 34%, ${surface}); }
.${scope}__hi { stroke: ${ink}; }
.${scope}__cabinet path.${scope}__mark { stroke: ${ink}; stroke-width: 1.75; }
.${scope}__prompt { margin: 0; font-size: ${em(17)}; line-height: 1.25; font-weight: 600; color: ${ink}; text-wrap: balance; }
.${scope}__hint { margin: 0; max-width: 34ch; font-size: ${em(13)}; line-height: 1.5; font-weight: 400; color: ${muted}; text-wrap: balance; }
.${scope}__link { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: ${ink}; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; cursor: pointer; transition: ${reduceMotion ? "none" : "transform 100ms ease"}; }
.${scope}__refusal { position: absolute; left: 20px; right: 20px; bottom: 12px; margin: 0; font-size: ${em(13)}; line-height: 1.4; font-weight: 400; color: ${refuse}; text-align: center; text-wrap: balance; }
.${scope}__list { flex: 1 1 0; min-height: 68px; overflow: auto; display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 2px 2px 6px; list-style: none; container-type: inline-size; }
.${scope}__row { flex: none; display: grid; grid-template-columns: 36px minmax(0, 1fr) auto 40px; grid-template-areas: "thumb main state remove"; align-items: center; gap: 12px; box-sizing: border-box; padding: 10px 6px 10px 12px; border-radius: ${rowRadius}px; background: ${surface}; box-shadow: 0 0 0 1px ${edge}, 0 1px 2px -1px ${drop}, 0 2px 4px 0 ${drop}; }
.${scope}__thumb { grid-area: thumb; position: relative; flex: none; display: grid; place-items: center; width: 36px; height: 40px; color: ${muted}; }
.${scope}__thumb img { display: block; width: 36px; height: 36px; border-radius: ${thumbRadius}px; object-fit: cover; outline: 1px solid ${edge}; outline-offset: -1px; }
.${scope}__page { display: block; width: 30px; height: 36px; }
.${scope}__ext { position: absolute; left: 0; right: 0; bottom: 4px; font-size: ${em(10)}; line-height: 1; font-weight: 600; text-align: center; color: ${muted}; }
.${scope}__main { grid-area: main; flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.${scope}__top { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.${scope}__name { flex: 1 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: ${em(14)}; line-height: 1.3; font-weight: 500; color: ${ink}; }
.${scope}__size { flex: none; font-size: ${em(13)}; line-height: 1.3; font-weight: 400; color: ${muted}; font-variant-numeric: tabular-nums; }
.${scope}__track { display: block; height: 4px; border-radius: 2px; background: ${tint}; overflow: hidden; }
.${scope}__fill { display: block; width: 100%; height: 100%; border-radius: 2px; background: ${accent}; transform-origin: left center; }
.${scope}__state { grid-area: state; flex: none; min-width: 44px; display: flex; justify-content: flex-end; font-size: ${em(13)}; line-height: 1.3; font-weight: 400; color: ${muted}; font-variant-numeric: tabular-nums; }
.${scope}__state svg { width: 16px; height: 16px; color: ${success}; }
/* Same specificity as the base .state rule above, so this narrow override must come after it to win. */
@container (max-width: 340px) {
.${scope}__row { grid-template-columns: 36px minmax(0, 1fr) 40px; grid-template-areas: "thumb main remove" "thumb state remove"; row-gap: 4px; }
.${scope}__state { justify-content: flex-start; }
}
@container (max-width: 240px) {
.${scope}__row { grid-template-columns: minmax(0, 1fr) 40px; grid-template-areas: "main remove" "state remove"; }
.${scope}__thumb { display: none; }
}
.${scope}__failed { color: ${refuse}; }
.${scope}__remove { grid-area: remove; position: relative; flex: none; display: grid; place-items: center; width: 40px; height: 40px; margin: -6px 0; padding: 0; border: 0; border-radius: 50%; background: none; color: ${muted}; cursor: pointer; transition: ${reduceMotion ? "none" : "transform 100ms ease, color 150ms ease"}; }
.${scope}__remove::before { content: ""; position: absolute; inset: 6px; border-radius: 50%; background: transparent; transition: ${reduceMotion ? "none" : "background-color 150ms ease"}; }
.${scope}__remove svg { position: relative; width: 12px; height: 12px; }
.${scope}__tags { flex: 0 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start; gap: 8px; max-width: 100%; margin: 8px 0 0; padding: 6px 6px 10px; list-style: none; }
.${scope}__tags:empty { display: none; }
.${scope}__tags[data-more] { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 14px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 14px), transparent); }
.${scope}__tag { display: flex; min-width: 0; max-width: 100%; }
.${scope}__tagBody { position: relative; display: inline-flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; box-sizing: border-box; padding: 8px 8px 8px 6px; border-radius: 12px; background: ${surface}; box-shadow: 0 0 0 1px ${edge}, 0 1px 2px -1px ${drop}, 0 4px 10px -4px ${drop}; transform-origin: center; }
.${scope}__tag[data-failed] .${scope}__tagBody { box-shadow: 0 0 0 1.5px ${refuse}, 0 1px 2px -1px ${drop}, 0 4px 10px -4px ${drop}; }
.${scope}__tagTrack { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }
.${scope}__tagFill { display: block; width: 100%; height: 100%; background: color-mix(in srgb, ${accent} 12%, ${surface}); transform-origin: left center; }
.${scope}__tagBadge { position: relative; flex: none; display: grid; place-items: center; min-width: 26px; height: 20px; box-sizing: border-box; padding: 0 5px; border-radius: 6px; background: ${tint}; font-size: ${em(10)}; line-height: 1; font-weight: 600; color: ${ink}; }
.${scope}__tagBadge svg { width: 14px; height: 14px; color: ${success}; }
.${scope}__tagName { position: relative; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: ${em(14)}; line-height: 1.3; font-weight: 500; color: ${ink}; }
.${scope}__tagRemove { position: relative; flex: none; display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 8px; background: none; color: ${muted}; cursor: pointer; transition: ${reduceMotion ? "none" : "transform 100ms ease, color 150ms ease, background-color 150ms ease"}; }
/* A wider hit area, kept inside the card: it never reaches the gap between tags, where a click would remove a file. */
.${scope}__tagRemove::after { content: ""; position: absolute; inset: -8px; }
.${scope}__tagRemove svg { width: 10px; height: 10px; }
.${scope}__tagRemove:focus-visible { outline: 2px solid ${accent}; outline-offset: 0; }
.${scope}__link:active, .${scope}__remove:active, .${scope}__tagRemove:active { transform: scale(0.97); }
@media (hover: hover) and (pointer: fine) {
  .${scope}__remove:hover, .${scope}__tagRemove:hover { color: ${ink}; }
  .${scope}__tagRemove:hover { background: ${tint}; }
  .${scope}__remove:hover::before { background: ${tint}; }
  .${scope}__link:hover { text-decoration-thickness: 2px; }
}
.${scope}__cover { position: absolute; inset: 0; margin: 0; padding: 0; border: 0; border-radius: inherit; background: transparent; appearance: none; cursor: pointer; z-index: 0; }
/* The well paints over the cover but lets clicks through to it. The tag list takes clicks on its tags (they open the picker); each × is its own target. */
.${scope}__well { pointer-events: none; }
.${scope}__tags { pointer-events: auto; cursor: pointer; }
.${scope}__link { pointer-events: auto; }
.${scope}__tag { pointer-events: none; }
.${scope}__tagRemove { pointer-events: auto; }
.${scope}__link:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; border-radius: 4px; }
.${scope}__remove:focus-visible { outline: 2px solid ${accent}; outline-offset: -4px; }
.${scope}__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`

    return (
        <div ref={rootRef} className={scope} onFocus={() => setFocusIn(true)} onBlur={(event) => setFocusIn(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))} style={{ width: "100%", height: "100%", ...font, fontSize: font?.fontSize ?? TYPE_BASE, letterSpacing: font?.letterSpacing ?? 0, ...style }}>
            <style>{css}</style>
            <motion.div
                ref={boxRef}
                className={`${scope}__box`}
                data-drop-area=""
                layout={!still}
                transition={{ layout: SNAP }}
                style={{ x: shakeX, scaleX: squashX, scaleY: squashY }}
                data-dragging={dragging ? "" : undefined}
                data-filled={filesAs === "List" && items.length > 0 ? "" : undefined}
                onPointerMove={handlePointerMove}
                onPointerEnter={() => setPointerIn(true)}
                onPointerLeave={() => {
                    setPointerIn(false)
                    setHovered(null)
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Clicks on empty space open the picker. Keyboard and assistive tech use the visible choose button instead. */}
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className={`${scope}__cover`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => inputRef.current?.click()}
                />
                <motion.div className={`${scope}__well`} layout={!still} transition={{ layout: SNAP }}>
                    <motion.svg
                        ref={svgRef}
                        className={`${scope}__cabinet`}
                        viewBox={`${f(viewBox.x)} ${f(viewBox.y)} ${f(viewBox.w)} ${f(viewBox.h)}`}
                        aria-hidden="true"
                        layout={!still}
                        transition={{ layout: SNAP }}
                    >
                        {figureModel.kind === "Drawers" && <DrawerScene key="drawers" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Pigeonholes" && <PigeonScene key="pigeonholes" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Folder" && <FolderScene key="folder" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Trays" && <TrayScene key="trays" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Box" && <BoxScene key="box" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Mailbox" && <MailboxScene key="mailbox" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Tray" && <SingleTrayScene key="tray" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Plain" && <PlainScene key="plain" model={figureModel.model} p={scene} />}
                        {figureModel.kind === "Custom" && <CustomScene key="custom" model={figureModel.model} p={scene} ink={ink} />}
                    </motion.svg>
                    <motion.div className={`${scope}__copy`} layout={still ? false : "position"} transition={{ layout: SNAP }}>
                        <p className={`${scope}__prompt`}>{prompt}</p>
                        <p className={`${scope}__hint`}>
                            <span id={`${scope}-limits`}>{`${typeNote}Up to ${maxSize} MB each, ${capacity} at most`}</span>
                            {", or "}
                            <button
                                ref={chooseRef}
                                id={`${scope}-choose`}
                                type="button"
                                className={`${scope}__link`}
                                aria-describedby={`${scope}-limits`}
                                onClick={() => inputRef.current?.click()}
                            >
                                choose from your computer
                            </button>
                        </p>
                    </motion.div>
                    {filesAs === "Tags" && (
                        <ul
                            ref={tagsRef}
                            className={`${scope}__tags`}
                            aria-label="Files"
                            data-more={moreBelow ? "" : undefined}
                            onClick={(event) => {
                                if (event.target === event.currentTarget) inputRef.current?.click()
                            }}
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                {items.filter((item) => !leaving.has(item.id)).map((item) => (
                                    <TagItem
                                        key={item.id}
                                        item={item}
                                        label={labels.get(item.id) ?? item.name}
                                        registerRemove={registerRemove}
                                        scope={scope}
                                        still={still}
                                        delay={issueDelay.current.get(item.id) ?? 0}
                                        origin={() => slotClient(nextSlot(figureModel.kind, items.findIndex((entry) => entry.id === item.id), slots.length))}
                                        onRemove={removeItem}
                                    />
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}
                    <p className={`${scope}__refusal`}>{refusalText}</p>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className={`${scope}__sr`}
                        tabIndex={-1}
                        aria-hidden="true"
                        accept={ACCEPT_ATTR[accepts]}
                        onChange={handleInputChange}
                    />
                </motion.div>
            </motion.div>

            {filesAs === "List" && items.length > 0 && (
                <ul className={`${scope}__list`} aria-label="Files">
                    <AnimatePresence initial={false}>
                        {items.filter((item) => !leaving.has(item.id)).map((item) => (
                            <FileRow key={item.id} item={item} label={labels.get(item.id) ?? item.name} registerRemove={registerRemove} scope={scope} still={still} onRemove={removeItem} />
                        ))}
                    </AnimatePresence>
                </ul>
            )}

            {ghost && (
                <Ghost
                    key={ghost.key}
                    ghost={ghost}
                    scope={scope}
                    onArrive={() => arriveRef.current()}
                    onGone={() => setGhost(null)}
                />
            )}

            <span className={`${scope}__sr`} aria-live="polite">
                {liveText}
            </span>
        </div>
    )
}

addPropertyControls(Kern_Dropzone, {
    content: {
        type: ControlType.Object,
        title: "Content",
        description: "What the box says at rest.",
        controls: {
            prompt: { type: ControlType.String, title: "Prompt", description: "The line of text in the box at rest.", defaultValue: CONTENT_DEFAULTS.prompt },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        description: "Style, figure, how files come back out (Files as), corner radius, colours and font.",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                defaultValue: LOOK_DEFAULTS.style,
                options: ["Hairline", "Plain", "Custom"],
                optionTitles: ["Hairline", "Plain", "Custom"],
                displaySegmentedControl: true,
                description: "Hairline: animated line figures. Plain: a quiet line icon that fits any site. Custom: your own SVG or PNG.",
            },
            icon: {
                type: ControlType.File,
                title: "Icon",
                allowedFileTypes: ["svg", "png"],
                description: "An SVG or PNG with a transparent background. It is painted in Ink unless Keep colours is on.",
                hidden: (group: Partial<LookGroup>) => group.style !== "Custom",
            },
            keepColours: {
                type: ControlType.Boolean,
                title: "Keep colours",
                description: "Shows the icon's own colours instead of Ink. Custom style only.",
                defaultValue: LOOK_DEFAULTS.keepColours,
                hidden: (group: Partial<LookGroup>) => group.style !== "Custom",
            },
            figure: {
                type: ControlType.Enum,
                title: "Figure",
                defaultValue: LOOK_DEFAULTS.figure,
                options: ["Drawers", "Pigeonholes", "Folder", "Trays", "Box", "Mailbox", "Tray"],
                optionTitles: ["Drawers", "Pigeonholes", "Folder", "Trays", "Box", "Mailbox", "Single tray"],
                description: "The line drawing inside the box. Pigeonholes shows one slot per allowed file. Single tray is the plainest: one open tray where files pile up.",
                hidden: (group: Partial<LookGroup>) => group.style !== "Hairline",
            },
            filesAs: {
                type: ControlType.Enum,
                title: "Files as",
                defaultValue: LOOK_DEFAULTS.filesAs,
                options: ["Tags", "List"],
                optionTitles: ["Tags", "List"],
                displaySegmentedControl: true,
                description: "Tags: each file comes back out of the figure as a tag inside the box. List: rows under the box with size and percentage.",
            },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: LOOK_DEFAULTS.radius, min: 0, max: 40, step: 1, unit: "px" },
            ink: { type: ControlType.Color, title: "Ink", description: "Text, icons and the highlighted edges of the figure.", defaultValue: LOOK_DEFAULTS.ink },
            surface: { type: ControlType.Color, title: "Surface", description: "The background of the box and the file rows.", defaultValue: LOOK_DEFAULTS.surface },
            muted: { type: ControlType.Color, title: "Muted", description: "Hints, file sizes and secondary lines.", defaultValue: LOOK_DEFAULTS.muted },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: LOOK_DEFAULTS.accent, description: "Progress bars (list and tag tint) and the keyboard focus ring." },
            success: { type: ControlType.Color, title: "Success", defaultValue: LOOK_DEFAULTS.success, description: "The colour of the check on finished files." },
            refuse: { type: ControlType.Color, title: "Refuse", defaultValue: LOOK_DEFAULTS.refuse, description: "Refusal line and a failed file." },
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Typeface and base text size. The size scales the box's text, except the percentage counter in List mode. Weights and line heights follow the component's type scale.",
                controls: "basic",
                displayFontSize: true,
                defaultFontType: "sans-serif",
                defaultValue: { variant: "Variable", fontSize: TYPE_BASE },
            },
        },
    },
    limits: {
        type: ControlType.Object,
        title: "Limits",
        description: "Which files the box takes. Anything outside these gets a kind refusal line.",
        controls: {
            maxSize: { type: ControlType.Number, title: "Max size", description: "The largest file the box accepts. A bigger file gets the size line in the box.", defaultValue: LIMITS_DEFAULTS.maxSize, min: 1, max: 50, step: 1, unit: "MB" },
            maxFiles: {
                type: ControlType.Number,
                title: "Max files",
                description: "Hairline Box, Folder and Single tray take 6 at most. Other figures, Plain and Custom take up to 12.",
                defaultValue: LIMITS_DEFAULTS.maxFiles,
                min: 1,
                max: 12,
                step: 1,
            },
            accepts: {
                type: ControlType.Enum,
                title: "Accepts",
                description: "Which file types the box takes. Any other type gets the type line.",
                defaultValue: LIMITS_DEFAULTS.accepts,
                options: ["Anything", "Images", "Video", "PDF"],
                optionTitles: ["Anything", "Images", "Video", "PDF"],
            },
        },
    },
    upload: {
        type: ControlType.Object,
        title: "Upload",
        description: "Files never leave the page. To send them to a service, paste the upload script from the User Guide into the site's custom code. There is no URL field here.",
        controls: {
            paceLocalReads: {
                type: ControlType.Boolean,
                title: "Pace local reads",
                defaultValue: UPLOAD_DEFAULTS.paceLocalReads,
                description:
                    "Files on this device read in milliseconds. On: the bar moves in uneven bursts over about 2 s, never ahead of the real read.",
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        description: `How the page reacts around the box.\n\n${CREDIT}`,
        controls: {
            idleDemo: {
                type: ControlType.Boolean,
                title: "Idle demo",
                defaultValue: BEHAVIOR_DEFAULTS.idleDemo,
                hidden: (_group: Partial<BehaviorGroup>, rootProps: Partial<Kern_DropzoneProps>) => rootProps.look?.style !== "Hairline",
                description: "Hairline style only. On: while the box is empty and on screen, the figure fills and empties itself slowly. It stops as soon as someone hovers, drags or drops, and never runs on the canvas or with reduced motion.",
            },
            blockOutsideDrops: {
                type: ControlType.Boolean,
                title: "Block outside drops",
                defaultValue: BEHAVIOR_DEFAULTS.blockOutsideDrops,
                description: "On: a file dropped anywhere else on the page is ignored instead of opening in the tab. Other drop targets that handle a drop keep it, and text or link drags are never touched. Turn off to leave file drops to the browser.",
            },
        },
    },
    onFileAdded: {
        type: ControlType.EventHandler,
        title: "On file added",
        description: "Fires when at least one file passes the size, type and count checks. The accepted files come with it as the DOM event kern-dropzone:added (event.detail.files).",
    },
    onFileRefused: {
        type: ControlType.EventHandler,
        title: "On file refused",
        description: "Fires when a file breaks the size, type or count limit.",
    },
})
