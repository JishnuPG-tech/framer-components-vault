// Signature Pad: Framer code component port of Arc "signature-pad" (https://uiarc.dev/components/signature-pad)
// Original by Elia Kuratli, MIT License. Ported to a self-contained Framer code component.

import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    useSyncExternalStore,
} from "react"
import type {
    KeyboardEvent as ReactKeyboardEvent,
    PointerEvent as ReactPointerEvent,
    ReactNode,
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
    AnimatePresence,
    animate,
    motion,
    useReducedMotion,
} from "framer-motion"

/* ---------- Motion tokens (inlined from Arc lib/motion-tokens) ---------- */
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
    blur: { subtle: 2, soft: 4, text: 8 },
} as const

const P = "arc-signature-pad-"
const cls = (...names: (string | false | null | undefined)[]) =>
    names
        .filter(Boolean)
        .map((n) => P + n)
        .join(" ")
const CSS = `
.arc-signature-pad-scope {
  --space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem; --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem;
  --radius-control: 1.125rem; --radius-panel: 1.625rem; --radius-surface: 2.125rem; --radius-pill: 9999px;
  --control-height-sm: 2.25rem; --control-height-md: 2.75rem; --control-height-lg: 3.125rem;
  --font-display: inherit; --font-body: inherit;
  --text-xs: .75rem; --text-sm: .875rem; --text-base: 1rem; --text-lg: 1.125rem; --text-xl: 1.375rem; --text-2xl: 1.75rem; --text-3xl: 2.25rem;
  --tracking-display: -.03em; --tracking-body: -.01em; --leading-display: 1.1; --leading-body: 1.4;
  --ease-enter: cubic-bezier(.16,1,.3,1); --ease-standard: cubic-bezier(.22,1,.36,1); --ease-exit: cubic-bezier(.7,0,.84,0); --ease-in-out: cubic-bezier(.65,0,.35,1);
  --ease-spring: linear(0, 0.0213, 0.0739, 0.1443, 0.2235, 0.305, 0.3849, 0.4606, 0.5305, 0.594, 0.6508, 0.7011, 0.7452, 0.7836, 0.8168, 0.8454, 0.8699, 0.8907, 0.9084, 0.9234, 0.9361, 0.9467, 0.9557, 0.9632, 0.9694, 0.9747, 0.979, 0.9826, 0.9857, 0.9882, 0.9902, 0.992, 0.9934, 0.9946, 0.9955, 0.9963, 1);
  --duration-instant: 120ms; --duration-fast: 160ms; --duration-standard: 240ms; --duration-considered: 480ms; --duration-spring: 580ms;

  color-scheme: light;
  --background: #ffffff; --surface: #ffffff; --surface-raised: #ffffff; --surface-muted: oklch(97.8% 0 0);
  --foreground: oklch(15% 0 0); --text-secondary: oklch(46% 0 0); --text-muted: oklch(59% 0 0);
  --border: oklch(93.5% 0 0); --border-subtle: oklch(96.5% 0 0); --border-strong: oklch(82% 0 0);
  --accent: oklch(33% 0 0); --accent-strong: oklch(24% 0 0);
  --danger: oklch(54% .21 25);
  --shadow-resting: 0 1px 2px oklch(0% 0 0 / .035);
  --shadow-raised: 0 6px 18px oklch(0% 0 0 / .065), 0 1px 3px oklch(0% 0 0 / .035);
  --shadow-floating: 0 20px 48px oklch(0% 0 0 / .105), 0 3px 10px oklch(0% 0 0 / .045);
}
.arc-signature-pad-scope[data-theme="dark"] {
  color-scheme: dark;
  --background: oklch(19% 0 0); --surface: oklch(21.5% 0 0); --surface-raised: oklch(24% 0 0); --surface-muted: oklch(26% 0 0);
  --foreground: oklch(96% 0 0); --text-secondary: oklch(77% 0 0); --text-muted: oklch(64% 0 0);
  --border: oklch(29% 0 0); --border-subtle: oklch(25% 0 0); --border-strong: oklch(40% 0 0);
  --accent: oklch(80% 0 0); --accent-strong: oklch(91% 0 0);
  --danger: oklch(76% .2 25);
  --shadow-resting: 0 1px 2px oklch(0% 0 0 / .18);
  --shadow-raised: 0 8px 22px oklch(0% 0 0 / .22);
  --shadow-floating: 0 22px 55px oklch(0% 0 0 / .34);
}
.arc-signature-pad-scope *, .arc-signature-pad-scope *::before, .arc-signature-pad-scope *::after { box-sizing: border-box; }
.arc-signature-pad-scope :focus:not(:focus-visible) { outline: none; }
.arc-signature-pad-scope :is(button, [tabindex]:not([tabindex="-1"]), [role="radio"]):focus-visible { outline: 2px solid color-mix(in oklab, var(--accent-strong) 72%, transparent); outline-offset: 2px; }
.arc-signature-pad-root {
  --ink-black: var(--foreground);
  --ink-blue: oklch(46% .17 262);
  --ink-violet: oklch(49% .2 292);
  display: grid; gap: 10px; width: 100%; min-width: 0; font-family: var(--font-body); letter-spacing: var(--tracking-body);
}
.arc-signature-pad-scope[data-theme="dark"] .arc-signature-pad-root { --ink-blue: oklch(76% .12 258); --ink-violet: oklch(77% .13 295); }
.arc-signature-pad-pad {
  position: relative; aspect-ratio: 600 / 260; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel);
  background: var(--surface); cursor: crosshair; touch-action: none; user-select: none; -webkit-user-select: none; isolation: isolate;
  transition: border-color var(--duration-fast) var(--ease-standard);
}
.arc-signature-pad-pad[data-drawing] { border-color: var(--border-strong); }
.arc-signature-pad-guide { position: absolute; inset: 0; pointer-events: none; }
.arc-signature-pad-baseline { position: absolute; left: 7%; right: 7%; top: 72%; border-top: 1.5px dashed var(--border-strong); }
.arc-signature-pad-mark { position: absolute; left: 7%; top: 72%; color: var(--text-muted); translate: 0 calc(-100% - 6px); }
.arc-signature-pad-signer { position: absolute; left: 7%; top: calc(72% + 8px); color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
.arc-signature-pad-hint {
  position: absolute; left: 50%; top: 72%; translate: -50% calc(-100% - 8px); color: var(--text-muted);
  font-size: var(--text-lg); line-height: var(--leading-body); white-space: nowrap;
}
.arc-signature-pad-ink { position: absolute; inset: 0; pointer-events: none; }
.arc-signature-pad-ink svg { display: block; width: 100%; height: 100%; overflow: visible; }
.arc-signature-pad-stroke { fill: var(--ink-black); }
.arc-signature-pad-stroke[data-color="blue"], .arc-signature-pad-nib[data-color="blue"] { fill: var(--ink-blue); }
.arc-signature-pad-stroke[data-color="violet"], .arc-signature-pad-nib[data-color="violet"] { fill: var(--ink-violet); }
.arc-signature-pad-nib { fill: var(--ink-black); opacity: .35; }
.arc-signature-pad-sweep { position: absolute; inset: 0; pointer-events: none; }
.arc-signature-pad-sweep::before {
  content: ""; position: absolute; top: 8%; bottom: 8%; left: -1px; width: 2px; border-radius: 2px;
  background: var(--foreground); opacity: .5;
}
.arc-signature-pad-sweep::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: -28px; width: 28px;
  background: linear-gradient(to right, transparent, color-mix(in oklab, var(--foreground) 5%, transparent));
}
.arc-signature-pad-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.arc-signature-pad-group { display: flex; align-items: center; gap: 2px; }
.arc-signature-pad-divider { width: 1px; height: 20px; margin: 0 6px; background: var(--border); }
.arc-signature-pad-choice { display: flex; align-items: center; gap: 2px; }
.arc-signature-pad-option {
  position: relative; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: var(--radius-pill);
  background: transparent; color: var(--foreground); cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.arc-signature-pad-selected { position: absolute; inset: 0; border-radius: inherit; background: var(--surface-muted); box-shadow: inset 0 0 0 1px var(--border); }
.arc-signature-pad-swatch { position: relative; width: 16px; height: 16px; border-radius: 50%; background: var(--ink-black); }
.arc-signature-pad-swatch[data-color="blue"] { background: var(--ink-blue); }
.arc-signature-pad-swatch[data-color="violet"] { background: var(--ink-violet); }
.arc-signature-pad-weight { position: relative; border-radius: 50%; background: var(--foreground); }
.arc-signature-pad-iconButton {
  display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: var(--radius-pill);
  background: transparent; color: var(--text-secondary); cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard);
}
.arc-signature-pad-iconButton:active:not(:disabled) { transform: scale(.94); }
.arc-signature-pad-iconButton:disabled { color: var(--text-muted); opacity: .45; cursor: default; }
.arc-signature-pad-iconButton[aria-pressed="true"] { background: var(--surface-muted); color: var(--foreground); }
.arc-signature-pad-swap { display: grid; place-items: center; }
.arc-signature-pad-exports { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.arc-signature-pad-exportLabel { margin-right: 4px; color: var(--text-muted); font-size: var(--text-xs); }
.arc-signature-pad-export {
  display: grid; min-width: 76px; height: var(--control-height-sm); padding: 0 12px; border: 1px solid var(--border); border-radius: var(--radius-control);
  background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard);
}
.arc-signature-pad-export:active:not(:disabled) { transform: scale(.97); }
.arc-signature-pad-export:disabled { color: var(--text-muted); cursor: default; }
.arc-signature-pad-exportContent { display: inline-flex; grid-area: 1 / 1; align-items: center; justify-content: center; gap: 6px; }
.arc-signature-pad-srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (hover: hover) and (pointer: fine) {
  .arc-signature-pad-option:hover, .arc-signature-pad-iconButton:hover:not(:disabled), .arc-signature-pad-export:hover:not(:disabled) { background: var(--surface-muted); color: var(--foreground); }
}

`

/* ---------- Inline icons (lucide) ---------- */
type IconProps = { size?: number; strokeWidth?: number; className?: string }
function Svg({
    size = 18,
    strokeWidth = 1.75,
    className,
    children,
}: IconProps & { children: ReactNode }) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    )
}
const XIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </Svg>
)
const CheckIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="M20 6 9 17l-5-5" />
    </Svg>
)
const DownloadIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="M12 15V3" />
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
    </Svg>
)
const EraserIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21" />
        <path d="m5.082 11.09 8.828 8.828" />
    </Svg>
)
const PlayIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </Svg>
)
const RedoIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="m15 14 5-5-5-5" />
        <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
    </Svg>
)
const UndoIcon = (p: IconProps) => (
    <Svg {...p}>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
    </Svg>
)
const SquareIcon = (p: IconProps) => (
    <Svg {...p}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
    </Svg>
)

/** A sampled point: position in pad units, pen pressure between 0 and 1 (or -1 when the device has none), and ms since the stroke began. */
interface InkPoint {
    x: number
    y: number
    p: number
    t: number
}
type InkColor = "black" | "blue" | "violet"
type InkWidth = "fine" | "medium" | "bold"
interface InkStroke {
    id: string
    points: InkPoint[]
    color: InkColor
    width: InkWidth
    /** When the stroke began, in ms. Replay keeps the real rhythm between strokes. */
    at: number
}
interface OutlineOptions {
    size: number
    thinning?: number
    streamline?: number
    simulatePressure?: boolean
    taperStart?: number
    taperEnd?: number
    last?: boolean
}

/** Pad coordinates. Strokes are stored in this space and scale with the pad. */
const PAD_WIDTH = 600,
    PAD_HEIGHT = 260

const INK: Record<InkColor, { label: string; export: string }> = {
    black: { label: "Black ink", export: "#17171a" },
    blue: { label: "Blue ink", export: "#1d3fae" },
    violet: { label: "Violet ink", export: "#5b35c8" },
}
const WIDTHS: Record<InkWidth, { label: string; size: number }> = {
    fine: { label: "Fine", size: 3.4 },
    medium: { label: "Medium", size: 5.6 },
    bold: { label: "Bold", size: 8.4 },
}
const COLORS = Object.keys(INK) as InkColor[]
const SIZES = Object.keys(WIDTHS) as InkWidth[]

type Vec = [number, number]
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]
const mul = (a: Vec, n: number): Vec => [a[0] * n, a[1] * n]
const lerp = (a: Vec, b: Vec, t: number): Vec => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
]
const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])
const norm = (a: Vec): Vec => {
    const l = Math.hypot(a[0], a[1])
    return l ? [a[0] / l, a[1] / l] : [0, 0]
}
const perp = (a: Vec): Vec => [a[1], -a[0]]
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1]
const rotAround = (p: Vec, c: Vec, r: number): Vec => {
    const s = Math.sin(r),
        co = Math.cos(r),
        px = p[0] - c[0],
        py = p[1] - c[1]
    return [px * co - py * s + c[0], px * s + py * co + c[1]]
}
const easeOut = (t: number) => t * (2 - t)

/**
 * Turns sampled points into the outline of a variable width stroke, in the spirit of perfect-freehand. Points are streamlined
 * toward the pointer, width follows pen pressure or, for a mouse or finger, speed, the ends taper, sharp turns get round joins,
 * and both ends get round caps.
 */
function getStrokeOutline(input: InkPoint[], options: OutlineOptions): Vec[] {
    const {
        size,
        thinning = 0.62,
        streamline = 0.42,
        simulatePressure = true,
        taperStart = 0,
        taperEnd = 0,
        last = true,
    } = options
    const head = input[0]
    if (!head) return []
    const usePen = !simulatePressure && input.some((point) => point.p > 0)

    const pts: { at: Vec; pressure: number; length: number; vector: Vec }[] = []
    let prev: Vec = [head.x, head.y],
        length = 0
    const start = {
        at: prev,
        pressure: usePen ? head.p : 0.5,
        length: 0,
        vector: [1, 0] as Vec,
    }
    pts.push(start)
    for (let i = 1; i < input.length; i++) {
        const sample = input[i]!
        const raw: Vec = [sample.x, sample.y]
        const at =
            i === input.length - 1 && last
                ? raw
                : lerp(prev, raw, 1 - streamline)
        const d = dist(at, prev)
        if (d < 0.4) continue
        length += d
        pts.push({
            at,
            pressure: usePen ? sample.p : 0.5,
            length,
            vector: norm(sub(prev, at)),
        })
        prev = at
    }
    const second = pts[1]
    if (second) start.vector = second.vector
    const total = length

    if (pts.length === 1) {
        const r = Math.max(
            0.6,
            size * (0.5 - thinning * (0.5 - start.pressure)) * 0.9
        )
        return Array.from({ length: 18 }, (_, i) =>
            add(
                start.at,
                mul(
                    [
                        Math.cos((i / 18) * Math.PI * 2),
                        Math.sin((i / 18) * Math.PI * 2),
                    ],
                    r
                )
            )
        )
    }

    const left: Vec[] = [],
        right: Vec[] = []
    let pressure = start.pressure,
        prevVector = start.vector
    for (let i = 0; i < pts.length; i++) {
        const point = pts[i]!
        if (!usePen) {
            const step = i === 0 ? 0 : dist(point.at, pts[i - 1]!.at)
            const speed = Math.min(1, step / size)
            const target = Math.min(1, 1 - speed)
            pressure = Math.min(1, pressure + (target - pressure) * speed * 0.3)
        } else {
            pressure = point.pressure
        }
        let radius = Math.max(0.25, size * (0.5 - thinning * (0.5 - pressure)))
        const ts = taperStart
            ? easeOut(Math.min(1, point.length / taperStart))
            : 1
        const te =
            taperEnd && last
                ? easeOut(Math.min(1, (total - point.length) / taperEnd))
                : 1
        radius = Math.max(0.12 * size, radius * Math.min(ts, te))

        const nextPt = pts[i + 1]
        const next = nextPt ? nextPt.vector : point.vector
        const offset = mul(perp(lerp(next, point.vector, 0.5)), radius)
        if (i > 0 && i < pts.length - 1 && dot(point.vector, next) < -0.2) {
            const corner = mul(perp(prevVector), radius)
            for (let t = 0; t <= 1; t += 1 / 12) {
                left.push(
                    rotAround(sub(point.at, corner), point.at, Math.PI * t)
                )
                right.push(
                    rotAround(add(point.at, corner), point.at, -Math.PI * t)
                )
            }
        } else {
            left.push(sub(point.at, offset))
            right.push(add(point.at, offset))
        }
        prevVector = point.vector
    }

    const cap = (center: Vec, from: Vec, to: Vec, away: Vec) => {
        const out: Vec[] = []
        const r = dist(center, from),
            s = Math.atan2(from[1] - center[1], from[0] - center[0])
        const mid = s + Math.PI / 2
        const sign = dot([Math.cos(mid), Math.sin(mid)], away) >= 0 ? 1 : -1
        for (let k = 1; k < 12; k++) {
            const a = s + (sign * Math.PI * k) / 12
            out.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r])
        }
        out.push(to)
        return out
    }
    const end = pts[pts.length - 1]!
    const endCap = cap(
        end.at,
        left[left.length - 1]!,
        right[right.length - 1]!,
        mul(end.vector, -1)
    )
    const startCap = cap(start.at, right[0]!, left[0]!, start.vector)
    return [...left, ...endCap, ...right.reverse(), ...startCap]
}

const round = (value: number) => Math.round(value * 100) / 100
/** Draws an outline as one smooth closed path, with quadratic curves through the midpoints of its edges. */
function outlineToPath(points: Vec[]) {
    if (points.length < 3) return ""
    let d = `M${round(points[0]![0])} ${round(points[0]![1])} Q`
    for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i]!,
            [x1, y1] = points[(i + 1) % points.length]!
        d += `${round(x0)} ${round(y0)} ${round((x0 + x1) / 2)} ${round((y0 + y1) / 2)} `
    }
    return `${d}Z`
}

function strokeOptions(
    stroke: Pick<InkStroke, "width" | "points">,
    last: boolean
): OutlineOptions {
    const size = WIDTHS[stroke.width].size
    const pen = stroke.points.some((point) => point.p > 0)
    return {
        size,
        simulatePressure: !pen,
        taperStart: size * 1.5,
        taperEnd: pen ? 0 : size * 5,
        last,
    }
}
/** The SVG path of a stroke, or of its first `upTo` ms while it is replayed. */
function strokePath(
    stroke: Pick<InkStroke, "width" | "points">,
    upTo = Infinity
) {
    const all = stroke.points
    const done = upTo >= all[all.length - 1]!.t
    const points = done ? all : all.filter((point) => point.t <= upTo)
    return outlineToPath(getStrokeOutline(points, strokeOptions(stroke, done)))
}

function inkBounds(strokes: InkStroke[]) {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity
    for (const stroke of strokes)
        for (const point of stroke.points) {
            minX = Math.min(minX, point.x)
            minY = Math.min(minY, point.y)
            maxX = Math.max(maxX, point.x)
            maxY = Math.max(maxY, point.y)
        }
    const pad = 16
    return {
        x: Math.floor(minX - pad),
        y: Math.floor(minY - pad),
        width: Math.ceil(maxX - minX + pad * 2),
        height: Math.ceil(maxY - minY + pad * 2),
    }
}

/** A standalone SVG of the signature, cropped to the ink, with print ink colors. */
function signatureToSvg(strokes: InkStroke[]) {
    if (!strokes.length) return ""
    const box = inkBounds(strokes)
    const paths = strokes
        .map(
            (stroke) =>
                `<path d="${strokePath(stroke)}" fill="${INK[stroke.color].export}"/>`
        )
        .join("")
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" width="${box.width}" height="${box.height}">${paths}</svg>`
}

/** A transparent PNG of the signature, cropped to the ink, at `scale` times pad resolution. */
function signatureToPng(strokes: InkStroke[], scale = 3): Promise<Blob> {
    return new Promise((resolve, reject) => {
        if (!strokes.length) return reject(new Error("Nothing to export"))
        const box = inkBounds(strokes)
        const canvas = document.createElement("canvas")
        canvas.width = box.width * scale
        canvas.height = box.height * scale
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas is unavailable"))
        ctx.scale(scale, scale)
        ctx.translate(-box.x, -box.y)
        for (const stroke of strokes) {
            ctx.fillStyle = INK[stroke.color].export
            ctx.fill(new Path2D(strokePath(stroke)))
        }
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error("Export failed")),
            "image/png"
        )
    })
}

function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface History {
    past: InkStroke[][]
    present: InkStroke[]
    future: InkStroke[][]
    fresh: string | null
}
type Saved = null | "png" | "svg" | "failed"

const { spring, duration, ease, blur } = motionTokens
const subscribe = () => () => {}
function useReducedFlag() {
    const hydrated = useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    )
    return !!useReducedMotion() && hydrated
}

/**
 * A signature field with real ink. Width follows pen pressure, or speed for a mouse or finger, and the ends taper like a nib
 * lifting off. It keeps undo and redo, clears with a wipe across the pad, replays the signature in its original rhythm,
 * and exports a cropped PNG or SVG. Keyboard: Mod+Z undoes, Shift+Mod+Z or Mod+Y redoes, and Delete clears.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SignaturePad(props: any) {
    const {
        signer = "Alex Morgan",
        hint = "Sign here",
        defaultColor = "black",
        defaultWidth = "medium",
        fileName = "signature",
        label = "Signature pad",
        showToolbar = true,
        showExports = true,
        theme = "Light",
        font,
        onChange,
        onClear,
        onSave,
        style,
    } = props

    const uid = useId().replace(/[^a-zA-Z0-9-]/g, "")
    const reduced = useReducedFlag()
    const [history, setHistory] = useState<History>({
        past: [],
        present: [],
        future: [],
        fresh: null,
    })
    const [color, setColor] = useState<InkColor>(defaultColor)
    const [width, setWidth] = useState<InkWidth>(defaultWidth)
    const [drawing, setDrawing] = useState(false)
    const [wiping, setWiping] = useState(false)
    const [replay, setReplay] = useState<{
        at: number
        offsets: number[]
    } | null>(null)
    const [saved, setSaved] = useState<Saved>(null)
    const [status, setStatus] = useState("")

    useEffect(() => {
        setColor(defaultColor)
    }, [defaultColor])
    useEffect(() => {
        setWidth(defaultWidth)
    }, [defaultWidth])

    const padRef = useRef<HTMLDivElement>(null)
    const inkRef = useRef<HTMLDivElement>(null)
    const liveRef = useRef<SVGPathElement>(null)
    const live = useRef<{
        id: number
        stroke: InkStroke
        stamp: number
    } | null>(null)
    const replayFrame = useRef(0)
    const savedTimer = useRef(0)
    const wipeAnimation = useRef<{
        stop: () => void
        complete: () => void
    } | null>(null)
    const counter = useRef(0)
    const onChangeRef = useRef(onChange)
    useEffect(() => {
        onChangeRef.current = onChange
    })
    const firstChange = useRef(true)

    const strokes = history.present
    const empty = strokes.length === 0
    const replaying = replay !== null

    useEffect(() => {
        if (firstChange.current) {
            firstChange.current = false
            return
        }
        onChangeRef.current?.(strokes)
    }, [strokes])
    useEffect(
        () => () => {
            cancelAnimationFrame(replayFrame.current)
            window.clearTimeout(savedTimer.current)
        },
        []
    )

    const commit = useCallback(
        (next: InkStroke[], fresh: string | null = null) => {
            setHistory((current) => ({
                past: [...current.past, current.present].slice(-60),
                present: next,
                future: [],
                fresh,
            }))
        },
        []
    )

    const stopReplay = useCallback(() => {
        cancelAnimationFrame(replayFrame.current)
        setReplay(null)
    }, [])
    /** A wipe in flight completes at once, so whatever comes next starts from a clear pad. */
    const settleWipe = useCallback(() => {
        wipeAnimation.current?.complete()
    }, [])

    function toPad(event: { clientX: number; clientY: number }) {
        const box = padRef.current!.getBoundingClientRect()
        return {
            x: ((event.clientX - box.left) / box.width) * PAD_WIDTH,
            y: ((event.clientY - box.top) / box.height) * PAD_HEIGHT,
        }
    }

    function paintLive() {
        const current = live.current
        if (!current || !liveRef.current) return
        liveRef.current.setAttribute(
            "d",
            outlineToPath(
                getStrokeOutline(
                    current.stroke.points,
                    strokeOptions(current.stroke, false)
                )
            )
        )
    }
    function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if (
            live.current ||
            (event.pointerType === "mouse" && event.button !== 0)
        )
            return
        event.preventDefault()
        settleWipe()
        if (replaying) stopReplay()
        padRef.current?.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        const { x, y } = toPad(event)
        const now = event.nativeEvent.timeStamp
        counter.current += 1
        const pen = event.pointerType === "pen" && event.pressure > 0
        live.current = {
            id: event.pointerId,
            stamp: event.nativeEvent.timeStamp,
            stroke: {
                id: `${uid}-${counter.current}`,
                color,
                width,
                at: now,
                points: [{ x, y, p: pen ? event.pressure : -1, t: 0 }],
            },
        }
        setDrawing(true)
        paintLive()
    }
    function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        const current = live.current
        if (!current || current.id !== event.pointerId) return
        const native = event.nativeEvent as PointerEvent
        const samples =
            typeof native.getCoalescedEvents === "function"
                ? native.getCoalescedEvents()
                : []
        const list = samples.length ? samples : [native]
        for (const sample of list) {
            const { x, y } = toPad(sample)
            const pen = sample.pointerType === "pen" && sample.pressure > 0
            current.stroke.points.push({
                x,
                y,
                p: pen ? sample.pressure : -1,
                t: Math.max(
                    current.stroke.points[current.stroke.points.length - 1]!.t,
                    sample.timeStamp - current.stamp
                ),
            })
        }
        paintLive()
    }
    function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
        const current = live.current
        if (!current || current.id !== event.pointerId) return
        live.current = null
        commit([...strokes, current.stroke], current.stroke.id)
        liveRef.current?.setAttribute("d", "")
        setDrawing(false)
        setStatus(`Stroke added. ${strokes.length + 1} in the signature.`)
    }

    function undo() {
        if (!history.past.length || live.current) return
        settleWipe()
        stopReplay()
        setHistory((current) =>
            current.past.length
                ? {
                      past: current.past.slice(0, -1),
                      present: current.past[current.past.length - 1]!,
                      future: [current.present, ...current.future],
                      fresh: null,
                  }
                : current
        )
        setStatus("Undone")
    }
    function redo() {
        if (!history.future.length || live.current) return
        settleWipe()
        stopReplay()
        setHistory((current) =>
            current.future.length
                ? {
                      past: [...current.past, current.present],
                      present: current.future[0]!,
                      future: current.future.slice(1),
                      fresh: null,
                  }
                : current
        )
        setStatus("Redone")
    }

    function clear() {
        if (empty || wiping || live.current) return
        stopReplay()
        const node = inkRef.current
        const finish = () => {
            wipeAnimation.current = null
            commit([])
            setWiping(false)
            setStatus("Signature cleared. Undo brings it back.")
            onClear?.()
            // Lift the clip only once the wiped strokes have left, so they never flash back for a frame.
            if (node)
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                        node.style.clipPath = ""
                    })
                )
        }
        if (!node || reduced) {
            finish()
            return
        }
        setWiping(true)
        // The ink is cut away behind a squeegee edge that sweeps across the pad.
        const controls = animate(
            node,
            { clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 100%)"] } as any,
            { duration: 0.56, ease: [...ease.inOut] } as any
        )
        wipeAnimation.current = {
            stop: () => controls.stop(),
            complete: () => {
                controls.complete()
            },
        }
        controls.then(finish)
    }

    function toggleReplay() {
        if (replaying) {
            stopReplay()
            setStatus("Replay stopped")
            return
        }
        if (empty || live.current) return
        settleWipe()
        // Each stroke keeps its own rhythm, and pauses between strokes are capped so the replay never stalls.
        const offsets: number[] = []
        let cursor = 0
        strokes.forEach((stroke, index) => {
            if (index > 0) {
                const previous = strokes[index - 1]!
                const gap =
                    stroke.at -
                    (previous.at +
                        previous.points[previous.points.length - 1]!.t)
                cursor += Math.min(260, Math.max(90, gap))
            }
            offsets.push(cursor)
            cursor += stroke.points[stroke.points.length - 1]!.t
        })
        const speed = Math.max(1, cursor / 3200)
        const total = cursor + 120
        const begin = performance.now()
        const tick = (now: number) => {
            const at = (now - begin) * speed
            if (at >= total) {
                setReplay(null)
                setStatus("Replay finished")
                return
            }
            setReplay({ at, offsets })
            replayFrame.current = requestAnimationFrame(tick)
        }
        setReplay({ at: 0, offsets })
        setStatus("Replaying signature")
        replayFrame.current = requestAnimationFrame(tick)
    }
    async function save(kind: "png" | "svg") {
        if (empty) return
        window.clearTimeout(savedTimer.current)
        try {
            const blob =
                kind === "svg"
                    ? new Blob([signatureToSvg(strokes)], {
                          type: "image/svg+xml",
                      })
                    : await signatureToPng(strokes)
            download(blob, `${fileName}.${kind}`)
            setSaved(kind)
            setStatus(`Saved ${fileName}.${kind}`)
            onSave?.()
        } catch {
            setSaved("failed")
            setStatus("Export failed. Try again.")
        }
        savedTimer.current = window.setTimeout(() => setSaved(null), 1800)
    }

    function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
        const mod = event.metaKey || event.ctrlKey
        const key = event.key.toLowerCase()
        if (mod && key === "z") {
            event.preventDefault()
            if (event.shiftKey) redo()
            else undo()
        } else if (mod && key === "y") {
            event.preventDefault()
            redo()
        } else if (
            !mod &&
            (event.key === "Delete" || event.key === "Backspace") &&
            event.currentTarget === event.target
        ) {
            event.preventDefault()
            clear()
        } else if (event.key === "Escape" && replaying) {
            stopReplay()
        }
    }

    // During replay each stroke shows only the part drawn so far, and the nib rides its newest point.
    let nib: InkPoint | null = null,
        nibColor: InkColor = color
    const visible: { stroke: InkStroke; d: string | null }[] = []
    for (let index = 0; index < strokes.length; index++) {
        const stroke = strokes[index]!
        if (replay === null) {
            visible.push({ stroke, d: null })
            continue
        }
        const local = replay.at - (replay.offsets[index] ?? 0)
        const lastT = stroke.points[stroke.points.length - 1]!.t
        if (local < 0) {
            visible.push({ stroke, d: "" })
            continue
        }
        if (local >= lastT) {
            visible.push({ stroke, d: null })
            continue
        }
        let found: InkPoint = stroke.points[0]!
        for (let k = stroke.points.length - 1; k >= 0; k--) {
            if (stroke.points[k]!.t <= local) {
                found = stroke.points[k]!
                break
            }
        }
        nib = found
        nibColor = stroke.color
        visible.push({ stroke, d: strokePath(stroke, local) })
    }
    const showHint = empty && !drawing && !wiping
    const hintHidden = reduced
        ? { opacity: 0 }
        : { opacity: 0, y: 6, scale: 0.97, filter: `blur(${blur.soft}px)` }
    const t: any = reduced ? { duration: duration.instant } : spring.snappy

    return (
        <div
            className={P + "scope"}
            data-theme={theme === "Dark" ? "dark" : "light"}
            style={{
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                ...(font || {}),
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--foreground)",
            }}
        >
            <style>{CSS}</style>
            <div className={cls("root")} data-ink={color}>
                <div
                    ref={padRef}
                    className={cls("pad")}
                    tabIndex={0}
                    role="img"
                    aria-roledescription="signature pad"
                    aria-label={`${label}. ${empty ? "Empty." : `${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"}.`} Draw with a pointer, pen, or finger.`}
                    aria-describedby={`${uid}-keys`}
                    data-drawing={drawing ? "" : undefined}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onKeyDown={onKeyDown}
                >
                    <div className={cls("guide")} aria-hidden="true">
                        <XIcon
                            className={cls("mark")}
                            size={14}
                            strokeWidth={1.75}
                        />
                        <span className={cls("baseline")} />
                        {signer && (
                            <span className={cls("signer")}>{signer}</span>
                        )}
                        <AnimatePresence initial={false}>
                            {showHint && (
                                <motion.span
                                    key="hint"
                                    className={cls("hint")}
                                    initial={hintHidden}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        filter: "blur(0px)",
                                    }}
                                    exit={
                                        {
                                            ...hintHidden,
                                            transition: {
                                                duration: duration.fast,
                                                ease: [...ease.standard],
                                            },
                                        } as any
                                    }
                                    transition={
                                        reduced
                                            ? { duration: duration.instant }
                                            : ({
                                                  duration: duration.standard,
                                                  ease: [...ease.enter],
                                              } as any)
                                    }
                                >
                                    {hint}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <div ref={inkRef} className={cls("ink")}>
                        <svg
                            viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <AnimatePresence initial={false}>
                                {visible.map(({ stroke, d }) => (
                                    <motion.path
                                        key={stroke.id}
                                        className={cls("stroke")}
                                        data-color={stroke.color}
                                        d={d ?? strokePath(stroke)}
                                        initial={
                                            history.fresh === stroke.id
                                                ? false
                                                : { opacity: 0 }
                                        }
                                        animate={{ opacity: 1 }}
                                        exit={
                                            {
                                                opacity: 0,
                                                transition: {
                                                    duration: wiping
                                                        ? 0
                                                        : duration.standard,
                                                    ease: [...ease.standard],
                                                },
                                            } as any
                                        }
                                        transition={
                                            {
                                                duration: duration.standard,
                                                ease: [...ease.standard],
                                            } as any
                                        }
                                    />
                                ))}
                            </AnimatePresence>
                            <path
                                ref={liveRef}
                                className={cls("stroke")}
                                data-color={color}
                            />
                            {nib && (
                                <circle
                                    className={cls("nib")}
                                    data-color={nibColor}
                                    cx={nib.x}
                                    cy={nib.y}
                                    r={WIDTHS[width].size * 0.9}
                                />
                            )}
                        </svg>
                    </div>
                    {wiping && (
                        <motion.span
                            className={cls("sweep")}
                            aria-hidden="true"
                            initial={{ x: "0%", opacity: 0 }}
                            animate={{ x: "100%", opacity: [0, 1, 1, 0] }}
                            transition={
                                {
                                    duration: 0.56,
                                    ease: [...ease.inOut],
                                    opacity: {
                                        duration: 0.56,
                                        times: [0, 0.12, 0.85, 1],
                                    },
                                } as any
                            }
                        />
                    )}
                </div>

                {showToolbar && (
                    <div className={cls("toolbar")}>
                        <div className={cls("group")}>
                            <Choice
                                label="Ink color"
                                options={COLORS}
                                value={color}
                                onChange={(next) => {
                                    setColor(next)
                                    setStatus(`${INK[next].label} selected`)
                                }}
                                layoutId={`${uid}-color`}
                                reduced={reduced}
                                render={(option) => (
                                    <span
                                        className={cls("swatch")}
                                        data-color={option}
                                    />
                                )}
                                name={(option) => INK[option].label}
                            />
                            <span
                                className={cls("divider")}
                                aria-hidden="true"
                            />
                            <Choice
                                label="Stroke width"
                                options={SIZES}
                                value={width}
                                onChange={(next) => {
                                    setWidth(next)
                                    setStatus(
                                        `${WIDTHS[next].label} nib selected`
                                    )
                                }}
                                layoutId={`${uid}-width`}
                                reduced={reduced}
                                render={(option) => (
                                    <span
                                        className={cls("weight")}
                                        style={{
                                            width: WIDTHS[option].size + 2,
                                            height: WIDTHS[option].size + 2,
                                        }}
                                    />
                                )}
                                name={(option) => WIDTHS[option].label}
                            />
                        </div>
                        <div className={cls("group")}>
                            <IconButton
                                label="Undo"
                                onClick={undo}
                                disabled={!history.past.length || wiping}
                            >
                                <UndoIcon size={18} />
                            </IconButton>
                            <IconButton
                                label="Redo"
                                onClick={redo}
                                disabled={!history.future.length || wiping}
                            >
                                <RedoIcon size={18} />
                            </IconButton>
                            <IconButton
                                label={
                                    replaying
                                        ? "Stop replay"
                                        : "Replay signature"
                                }
                                onClick={toggleReplay}
                                disabled={empty || wiping}
                                pressed={replaying}
                            >
                                <AnimatePresence
                                    mode="popLayout"
                                    initial={false}
                                >
                                    <motion.span
                                        key={replaying ? "stop" : "play"}
                                        className={cls("swap")}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={t}
                                    >
                                        {replaying ? (
                                            <SquareIcon size={15} />
                                        ) : (
                                            <PlayIcon size={17} />
                                        )}
                                    </motion.span>
                                </AnimatePresence>
                            </IconButton>
                            <IconButton
                                label="Clear signature"
                                onClick={clear}
                                disabled={empty || wiping}
                            >
                                <EraserIcon size={18} />
                            </IconButton>
                        </div>
                    </div>
                )}

                {showExports && (
                    <div className={cls("exports")}>
                        <span className={cls("exportLabel")}>Save as</span>
                        {(["png", "svg"] as const).map((kind) => (
                            <button
                                key={kind}
                                type="button"
                                className={cls("export")}
                                onClick={() => save(kind)}
                                disabled={empty}
                                aria-label={`Download ${kind.toUpperCase()}`}
                            >
                                <AnimatePresence
                                    mode="popLayout"
                                    initial={false}
                                >
                                    <motion.span
                                        key={
                                            saved === kind
                                                ? "done"
                                                : saved === "failed"
                                                  ? "failed"
                                                  : "idle"
                                        }
                                        className={cls("exportContent")}
                                        initial={{
                                            opacity: 0,
                                            y: reduced ? 0 : 4,
                                            filter: reduced
                                                ? "blur(0px)"
                                                : `blur(${blur.subtle}px)`,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            filter: "blur(0px)",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: reduced ? 0 : -4,
                                            transition: {
                                                duration: duration.instant,
                                            },
                                        }}
                                        transition={
                                            reduced
                                                ? { duration: duration.instant }
                                                : ({
                                                      duration: duration.fast,
                                                      ease: [...ease.enter],
                                                  } as any)
                                        }
                                    >
                                        {saved === kind ? (
                                            <>
                                                <CheckIcon size={15} />
                                                Saved
                                            </>
                                        ) : (
                                            <>
                                                <DownloadIcon size={15} />
                                                {kind.toUpperCase()}
                                            </>
                                        )}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        ))}
                    </div>
                )}
                <p id={`${uid}-keys`} className={cls("srOnly")}>
                    Press Control or Command Z to undo, add Shift to redo, and
                    Delete to clear.
                </p>
                <p className={cls("srOnly")} role="status" aria-live="polite">
                    {status}
                </p>
            </div>
        </div>
    )
}

function IconButton({
    label,
    onClick,
    disabled,
    pressed,
    children,
}: {
    label: string
    onClick: () => void
    disabled?: boolean
    pressed?: boolean
    children: ReactNode
}) {
    return (
        <button
            type="button"
            className={cls("iconButton")}
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={pressed}
        >
            {children}
        </button>
    )
}

/** A compact radio group with a highlight that glides to the chosen option. Arrow keys move the choice. */
function Choice<T extends string>({
    label,
    options,
    value,
    onChange,
    render,
    name,
    layoutId,
    reduced,
}: {
    label: string
    options: T[]
    value: T
    onChange: (value: T) => void
    render: (option: T) => ReactNode
    name: (option: T) => string
    layoutId: string
    reduced: boolean
}) {
    const refs = useRef<(HTMLButtonElement | null)[]>([])
    function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
        const step =
            event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0
        if (!step) return
        event.preventDefault()
        const index =
            (options.indexOf(value) + step + options.length) % options.length
        onChange(options[index]!)
        refs.current[index]?.focus()
    }
    return (
        <div
            className={cls("choice")}
            role="radiogroup"
            aria-label={label}
            onKeyDown={onKeyDown}
        >
            {options.map((option, index) => (
                <button
                    key={option}
                    ref={(node) => {
                        refs.current[index] = node
                    }}
                    type="button"
                    role="radio"
                    aria-checked={option === value}
                    aria-label={name(option)}
                    title={name(option)}
                    tabIndex={option === value ? 0 : -1}
                    className={cls("option")}
                    onClick={() => onChange(option)}
                >
                    {option === value && (
                        <motion.span
                            layoutId={layoutId}
                            className={cls("selected")}
                            transition={
                                reduced
                                    ? { duration: 0 }
                                    : (spring.morph as any)
                            }
                        />
                    )}
                    {render(option)}
                </button>
            ))}
        </div>
    )
}

SignaturePad.displayName = "Signature Pad"

addPropertyControls(SignaturePad, {
    signer: {
        type: ControlType.String,
        title: "Signer",
        defaultValue: "Alex Morgan",
        placeholder: "Printed under the line",
    },
    hint: {
        type: ControlType.String,
        title: "Hint",
        defaultValue: "Sign here",
    },
    defaultColor: {
        type: ControlType.Enum,
        title: "Ink",
        options: ["black", "blue", "violet"],
        optionTitles: ["Black", "Blue", "Violet"],
        defaultValue: "black",
    },
    defaultWidth: {
        type: ControlType.Enum,
        title: "Nib",
        options: ["fine", "medium", "bold"],
        optionTitles: ["Fine", "Medium", "Bold"],
        defaultValue: "medium",
        displaySegmentedControl: true,
    },
    showToolbar: {
        type: ControlType.Boolean,
        title: "Toolbar",
        defaultValue: true,
    },
    showExports: {
        type: ControlType.Boolean,
        title: "Exports",
        defaultValue: true,
    },
    fileName: {
        type: ControlType.String,
        title: "File Name",
        defaultValue: "signature",
        hidden: (p: any) => !p.showExports,
    },
    label: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "Signature pad",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    onChange: { type: ControlType.EventHandler },
    onClear: { type: ControlType.EventHandler },
    onSave: { type: ControlType.EventHandler },
})
