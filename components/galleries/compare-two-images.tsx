/**
 * Image Compare — Framer code component.
 * Ported from Arc (https://uiarc.dev/components/image-compare) by Elia Kuratli, MIT License.
 * Copyright (c) Elia Kuratli. The above copyright notice and the MIT permission notice shall be included in all copies.
 *
 * Before and after, split by a divider. Drag anywhere to move it: the handle follows 1:1, rubber-bands past the edges, and stays
 * where it is released. A press on the image springs the divider there; on touch the press waits to see a sideways drag so the page
 * still scrolls. Arrow keys step 1% (Shift for 10%), Home and End reveal one side fully, and a double-click on the handle springs it
 * back to the middle. Switching orientation swings the divider a quarter turn.
 */
import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
    useMotionValue,
    useReducedMotion,
    useTransform,
} from "framer-motion"

// ---------- inlined helpers ----------
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
        responsive: { type: "spring", stiffness: 520, damping: 44 },
        gentle: { type: "spring", stiffness: 340, damping: 34 },
        snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
        smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
        morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
    },
    stagger: { char: 0.016, word: 0.04, line: 0.08, item: 0.035 },
    blur: { subtle: 2, soft: 4, text: 8 },
} as const

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const CSS = `.arc-image-compare-root{--background:oklch(100% 0 0);--surface:oklch(100% 0 0);--surface-raised:oklch(100% 0 0);--surface-muted:oklch(97.8% 0 0);--foreground:oklch(15% 0 0);--text-secondary:oklch(46% 0 0);--text-muted:oklch(59% 0 0);--border:oklch(93.5% 0 0);--border-subtle:oklch(96.5% 0 0);--border-strong:oklch(82% 0 0);--accent:oklch(33% 0 0);--accent-strong:oklch(24% 0 0);--accent-subtle:oklch(33% 0 0 / .1);--accent-foreground:oklch(100% 0 0);--control-on:oklch(23% 0 0);--control-glyph:oklch(100% 0 0);--control-track:oklch(89.5% 0 0);--control-track-hover:oklch(86% 0 0);--control-thumb:oklch(100% 0 0);--control-thumb-on:oklch(100% 0 0);--control-thumb-shadow:0 0 0 .5px oklch(0% 0 0 / .07), 0 1px 2px oklch(0% 0 0 / .14), 0 2px 6px oklch(0% 0 0 / .06);--control-fill:oklch(23% 0 0);--success:oklch(49% .19 150);--warning:oklch(58% .18 75);--danger:oklch(54% .21 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .035);--shadow-raised:0 6px 18px oklch(0% 0 0 / .065), 0 1px 3px oklch(0% 0 0 / .035);--shadow-floating:0 20px 48px oklch(0% 0 0 / .105), 0 3px 10px oklch(0% 0 0 / .045);--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--radius-control:1.125rem;--radius-panel:1.625rem;--radius-surface:2.125rem;--radius-pill:9999px;--control-height-sm:2.25rem;--control-height-md:2.75rem;--control-height-lg:3.125rem;--font-body:"Inter", "Inter Variable", system-ui, sans-serif;--text-xs:.75rem;--text-sm:.875rem;--text-base:1rem;--text-lg:1.125rem;--tracking-body:-.01em;--leading-body:1.4;--ease-enter:cubic-bezier(.16,1,.3,1);--ease-standard:cubic-bezier(.22,1,.36,1);--ease-exit:cubic-bezier(.7,0,.84,0);--ease-in-out:cubic-bezier(.65,0,.35,1);--ease-spring:linear(0, 0.0213, 0.0739, 0.1443, 0.2235, 0.305, 0.3849, 0.4606, 0.5305, 0.594, 0.6508, 0.7011, 0.7452, 0.7836, 0.8168, 0.8454, 0.8699, 0.8907, 0.9084, 0.9234, 0.9361, 0.9467, 0.9557, 0.9632, 0.9694, 0.9747, 0.979, 0.9826, 0.9857, 0.9882, 0.9902, 0.992, 0.9934, 0.9946, 0.9955, 0.9963, 1);--duration-instant:120ms;--duration-fast:160ms;--duration-standard:240ms;--duration-considered:480ms;--duration-spring:580ms;color-scheme:light;}
.arc-image-compare-root[data-theme="dark"]{color-scheme:dark;--background:oklch(19% 0 0);--surface:oklch(21.5% 0 0);--surface-raised:oklch(24% 0 0);--surface-muted:oklch(26% 0 0);--foreground:oklch(96% 0 0);--text-secondary:oklch(77% 0 0);--text-muted:oklch(64% 0 0);--border:oklch(29% 0 0);--border-subtle:oklch(25% 0 0);--border-strong:oklch(40% 0 0);--accent:oklch(80% 0 0);--accent-strong:oklch(91% 0 0);--accent-subtle:oklch(80% 0 0 / .13);--accent-foreground:oklch(19% 0 0);--control-on:oklch(93% 0 0);--control-glyph:oklch(19% 0 0);--control-track:oklch(33% 0 0);--control-track-hover:oklch(37% 0 0);--control-thumb:oklch(97% 0 0);--control-thumb-on:oklch(19% 0 0);--control-fill:oklch(62% 0 0);--control-thumb-shadow:0 0 0 .5px oklch(0% 0 0 / .3), 0 1px 2px oklch(0% 0 0 / .35), 0 2px 6px oklch(0% 0 0 / .2);--success:oklch(78% .18 150);--warning:oklch(83% .17 80);--danger:oklch(76% .2 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .18);--shadow-raised:0 8px 22px oklch(0% 0 0 / .22);--shadow-floating:0 22px 55px oklch(0% 0 0 / .34);}
.arc-image-compare-root :focus:not(:focus-visible){outline:none}.arc-image-compare-root :focus-visible{outline:var(--focus-outline-width, 2px) solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent));outline-offset:var(--focus-outline-offset, 2px)}.arc-image-compare-root:focus-visible{outline:var(--focus-outline-width, 2px) solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent));outline-offset:var(--focus-outline-offset, 2px)}.arc-image-compare-root, .arc-image-compare-root *, .arc-image-compare-root *::before, .arc-image-compare-root *::after{box-sizing:border-box}
.arc-image-compare-root { position: relative; display: block; width: 100%; overflow: clip; container-type: size; isolation: isolate; border-radius: var(--radius-panel); background: var(--surface-muted); cursor: ew-resize; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.arc-image-compare-root[data-orientation="vertical"] { cursor: ns-resize; touch-action: pan-x; }
.arc-image-compare-root::after { content: ""; position: absolute; z-index: 3; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 8%, transparent); pointer-events: none; }
.arc-image-compare-layer { position: absolute; inset: 0; }
.arc-image-compare-layer :where(img, picture, video) { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; -webkit-user-drag: none; }
.arc-image-compare-chip { position: absolute; z-index: 1; top: var(--space-3); left: var(--space-3); padding: 3px 10px; border-radius: var(--radius-pill); background: color-mix(in oklab, var(--background) 74%, transparent); color: var(--foreground); font-size: var(--text-xs); font-weight: 500; line-height: var(--leading-body); letter-spacing: var(--tracking-body); pointer-events: none; -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4); }
.arc-image-compare-chip[data-place="end"] { right: var(--space-3); left: auto; }
.arc-image-compare-chip[data-place="bottom"] { top: auto; bottom: var(--space-3); }
.arc-image-compare-pivot { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
.arc-image-compare-rotor { position: absolute; top: 0; left: 0; width: 0; height: 0; }
.arc-image-compare-line { position: absolute; top: calc((100cqw + 100cqh) * -1); left: -1px; width: 2px; height: calc((100cqw + 100cqh) * 2); background: var(--compare-line, var(--surface-raised)); box-shadow: 0 0 0 .5px oklch(0% 0 0 / .14); }
.arc-image-compare-root[data-theme="dark"] .arc-image-compare-line { background: var(--compare-line, var(--foreground)); }
.arc-image-compare-handleSlot { position: absolute; top: 0; left: 0; }
.arc-image-compare-handle { position: absolute; top: 0; left: 0; display: grid; box-sizing: border-box; width: 40px; height: 40px; place-items: center; translate: -50% -50%; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-raised); box-shadow: var(--shadow-raised); color: var(--foreground); pointer-events: auto; outline: 0 solid transparent; transition: border-color var(--duration-fast) var(--ease-standard); }
.arc-image-compare-handle::after { content: ""; position: absolute; inset: -8px; border-radius: inherit; }
@media (hover: hover) and (pointer: fine) { .arc-image-compare-root:hover .arc-image-compare-handle { border-color: var(--border-strong); } }
.arc-image-compare-chevrons { display: flex; align-items: center; }
.arc-image-compare-chevron { display: grid; margin-inline: -2.5px; place-items: center; }
@media (prefers-reduced-motion: reduce) { .arc-image-compare-handle { transition: none; } }`

function StyleTag() {
    return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}

// ---------- icons (lucide, inlined) ----------
const chevron = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
}
const ChevronLeft = () => (
    <svg {...chevron}>
        <path d="m15 18-6-6 6-6" />
    </svg>
)
const ChevronRight = () => (
    <svg {...chevron}>
        <path d="m9 18 6-6-6-6" />
    </svg>
)

// ---------- logic (faithful to the original) ----------
type Metrics = {
    w: number
    h: number
    bw: number
    bh: number
    aw: number
    ah: number
}
type Drag = {
    pointer: number
    grab: number
    press: boolean
    started: boolean
    x: number
    y: number
    raw: number
}

const { spring } = motionTokens
const physical = ({
    visualDuration,
    bounce,
}: {
    visualDuration: number
    bounce: number
}) => {
    const root = (2 * Math.PI) / (visualDuration * 1.2)
    return {
        type: "spring" as const,
        stiffness: root * root,
        damping: 2 * (1 - bounce) * root,
        restDelta: 0.002,
        restSpeed: 0.02,
    }
}
const moveSpring = physical(spring.snappy)
const turnSpring = physical(spring.morph)
const kickSpring = physical(spring.morph)
const STRETCH = 9,
    MARGIN = 42,
    GIVE = 12,
    BUMP_PX = 150,
    INSET = 12
const clamp = (value: number, low: number, high: number) =>
    Math.min(high, Math.max(low, value))
const lerp = (from: number, to: number, amount: number) =>
    from + (to - from) * amount
const rubber = (distance: number, limit = STRETCH) =>
    Math.sign(distance) *
    (1 - 1 / ((Math.abs(distance) * 0.55) / limit + 1)) *
    limit
const give = (distance: number) => GIVE * (1 - 1 / (distance / GIVE + 1))
const soften = (at: number, size: number) =>
    at < MARGIN
        ? MARGIN - give(MARGIN - at)
        : at > size - MARGIN
          ? size - MARGIN + give(at - size + MARGIN)
          : at
const fade = (room: number) => clamp(room / 28, 0, 1)

/** The before side of a line through `center` at `angle`, cut from the frame: the clip while the divider turns. */
function halfPlane(
    w: number,
    h: number,
    center: [number, number],
    angle: number
) {
    const nx = -Math.cos(angle),
        ny = -Math.sin(angle)
    const side = ([x, y]: [number, number]) =>
        (x - center[0]) * nx + (y - center[1]) * ny
    const corners: [number, number][] = [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
    ]
    const points: [number, number][] = []
    corners.forEach((corner, index) => {
        const next = corners[(index + 1) % 4]!,
            a = side(corner),
            b = side(next)
        if (a >= 0) points.push(corner)
        if (a >= 0 !== b >= 0) {
            const t = a / (a - b)
            points.push([
                corner[0] + (next[0] - corner[0]) * t,
                corner[1] + (next[1] - corner[1]) * t,
            ])
        }
    })
    return points.length
        ? `polygon(${points.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(", ")})`
        : "inset(50%)"
}

type ImageValue =
    | { src?: string; srcSet?: string; alt?: string }
    | string
    | undefined
const DEFAULT_PHOTO =
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&auto=format&fit=crop"
const DEFAULT_BEFORE = DEFAULT_PHOTO + "&sat=-100"

function Img({
    image,
    fallback,
    alt,
}: {
    image: ImageValue
    fallback: string
    alt: string
}) {
    const value = typeof image === "string" ? { src: image } : image
    const src = value?.src || fallback
    return (
        <img
            src={src}
            srcSet={value?.src ? value.srcSet : undefined}
            alt={value?.alt || alt}
            draggable={false}
        />
    )
}

interface Props {
    before?: ImageValue
    after?: ImageValue
    beforeAlt: string
    afterAlt: string
    defaultPosition: number
    orientation: "horizontal" | "vertical"
    showLabels: boolean
    beforeLabel: string
    afterLabel: string
    label: string
    radius: number
    theme: "Light" | "Dark"
    lineColor: string
    font?: CSSProperties
    onChange?: (position: number) => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function ImageCompare(props: Props) {
    const {
        before,
        after,
        beforeAlt = "The photo in black and white",
        afterAlt = "The photo in full colour",
        defaultPosition = 50,
        orientation = "horizontal",
        showLabels = true,
        beforeLabel = "Before",
        afterLabel = "After",
        label = "Before and after",
        radius = 26,
        theme = "Light",
        lineColor = "",
        font,
        onChange,
        style,
    } = props
    const labels: [string, string] | false = showLabels
        ? [beforeLabel, afterLabel]
        : false
    const reduced = useReducedMotion()
    const vertical = orientation === "vertical"
    const [current, setCurrentRaw] = useState(clamp(defaultPosition, 0, 100))
    const setInternal = (value: number) => setCurrentRaw(clamp(value, 0, 100))
    // Framer: follow the Position control when it is edited on the canvas.
    useEffect(() => {
        setInternal(defaultPosition)
    }, [defaultPosition])
    const afterShare = Math.round(100 - current)
    const rootRef = useRef<HTMLDivElement>(null)
    const handleRef = useRef<HTMLDivElement>(null)
    const beforeChip = useRef<HTMLSpanElement>(null)
    const afterChip = useRef<HTMLSpanElement>(null)
    const latest = useRef(current)
    const goal = useRef(current)
    const drag = useRef<Drag | null>(null)
    const pressedHandle = useRef(false)
    const [dragging, setDragging] = useState(false)
    const [quiet, setQuiet] = useState(false)

    // The divider is a committed position plus a catch-up offset.
    const pos = useMotionValue(current),
        lag = useMotionValue(0)
    const theta = useMotionValue(vertical ? 90 : 0)
    const metrics = useMotionValue<Metrics>({
        w: 0,
        h: 0,
        bw: 0,
        bh: 0,
        aw: 0,
        ah: 0,
    })
    const shown = useTransform(() => pos.get() + lag.get())
    const turn = useTransform(() => clamp(theta.get() / 90, 0, 1))
    const center = (p: number, m: Metrics): [number, number] => [
        lerp((p / 100) * m.w, m.w / 2, turn.get()),
        lerp(m.h / 2, (p / 100) * m.h, turn.get()),
    ]
    const clipPath = useTransform(() => {
        const angle = theta.get(),
            p = clamp(shown.get(), 0, 100),
            m = metrics.get()
        if (angle === 0 || !m.w)
            return angle >= 45
                ? `inset(0 0 ${(100 - p).toFixed(3)}% 0)`
                : `inset(0 ${(100 - p).toFixed(3)}% 0 0)`
        if (angle === 90) return `inset(0 0 ${(100 - p).toFixed(3)}% 0)`
        return halfPlane(m.w, m.h, center(p, m), (angle * Math.PI) / 180)
    })
    const rest = (angle: number, m: Metrics) =>
        angle === 0 || angle === 90 || !m.w
    const pivotX = useTransform(() => {
        const angle = theta.get(),
            m = metrics.get()
        return rest(angle, m)
            ? angle >= 45
                ? "50%"
                : `${shown.get()}%`
            : `${center(shown.get(), m)[0]}px`
    })
    const pivotY = useTransform(() => {
        const angle = theta.get(),
            m = metrics.get()
        return rest(angle, m)
            ? angle >= 45
                ? `${shown.get()}%`
                : "50%"
            : `${center(shown.get(), m)[1]}px`
    })
    const offset = () => {
        const m = metrics.get()
        if (!m.w) return 0
        const p = shown.get(),
            x = (p / 100) * m.w,
            y = (p / 100) * m.h
        return lerp(soften(x, m.w) - x, soften(y, m.h) - y, turn.get())
    }
    const handleX = useTransform(
        () => offset() * Math.cos((theta.get() * Math.PI) / 180)
    )
    const handleY = useTransform(
        () => offset() * Math.sin((theta.get() * Math.PI) / 180)
    )
    // Captions fade as the divider reaches them, and hand over mid-turn when the after caption changes corner.
    const beforeOpacity = useTransform(() => {
        const m = metrics.get(),
            k = turn.get(),
            p = clamp(shown.get(), 0, 100),
            across = clamp(1 - k * 3, 0, 1),
            down = clamp(k * 3 - 2, 0, 1)
        if (!m.w) return across + down
        return (
            across * fade((p / 100) * m.w - (INSET + m.bw + 8)) +
            down * fade((p / 100) * m.h - (INSET + m.bh + 8))
        )
    })
    const afterAcross = useTransform(() => {
        const m = metrics.get(),
            k = clamp(1 - turn.get() * 3, 0, 1)
        return m.w
            ? k *
                  fade(
                      m.w -
                          INSET -
                          m.aw -
                          8 -
                          (clamp(shown.get(), 0, 100) / 100) * m.w
                  )
            : k
    })
    const afterDown = useTransform(() => {
        const m = metrics.get(),
            k = clamp(turn.get() * 3 - 2, 0, 1)
        return m.w
            ? k *
                  fade(
                      m.h -
                          INSET -
                          m.ah -
                          8 -
                          (clamp(shown.get(), 0, 100) / 100) * m.h
                  )
            : k
    })

    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const measure = () =>
            metrics.set({
                w: root.clientWidth,
                h: root.clientHeight,
                bw: beforeChip.current?.offsetWidth ?? 0,
                bh: beforeChip.current?.offsetHeight ?? 0,
                aw: afterChip.current?.offsetWidth ?? 0,
                ah: afterChip.current?.offsetHeight ?? 0,
            })
        const observer = new ResizeObserver(measure)
        ;[root, beforeChip.current, afterChip.current].forEach(
            (node) => node && observer.observe(node)
        )
        measure()
        return () => observer.disconnect()
    }, [metrics, showLabels])

    // A new orientation swings the divider a quarter turn about its pivot while the clip follows it.
    useEffect(() => {
        const target = vertical ? 90 : 0
        if (theta.get() === target) return
        if (reduced) theta.jump(target)
        else animate(theta, target, turnSpring)
    }, [reduced, theta, vertical])

    // Positions that arrive from outside a drag (props, keys, a double-click) spring the divider there.
    useIsoLayoutEffect(() => {
        latest.current = current
        if (drag.current?.started || goal.current === current) return
        goal.current = current
        const from = pos.get() + lag.get()
        lag.jump(0)
        pos.jump(from)
        if (reduced) pos.jump(current)
        else animate(pos, current, moveSpring)
    })

    function commit(next: number, live = false) {
        if (live && Math.round(next) === Math.round(latest.current)) return
        const value = Number(next.toFixed(2))
        if (value === latest.current) return
        latest.current = value
        setInternal(value)
        onChange?.(value)
    }

    const percentAt = (event: PointerEvent<HTMLDivElement>) => {
        const rect = rootRef.current!.getBoundingClientRect()
        return vertical
            ? ((event.clientY - rect.top) / (rect.height || 1)) * 100
            : ((event.clientX - rect.left) / (rect.width || 1)) * 100
    }
    const axisSize = () => {
        const rect = rootRef.current?.getBoundingClientRect()
        return (vertical ? rect?.height : rect?.width) || 1
    }
    /** Focus that follows a pointer keeps the handle quiet: no ring until a key is pressed. */
    function focusQuietly() {
        const node = handleRef.current
        if (!node || document.activeElement === node) return
        setQuiet(true)
        node.focus({ preventScroll: true })
    }

    function start(state: Drag, at: number) {
        const from = pos.get() + lag.get()
        state.started = true
        state.grab = state.press ? 0 : at - from
        lag.jump(0)
        pos.jump(from)
        setDragging(true)
        focusQuietly()
        follow(state, at, true)
    }
    /** Puts the line under the pointer, with resistance past the edges, and commits the position once per whole percent. */
    function follow(state: Drag, at: number, first = false) {
        const raw = at - state.grab,
            size = axisSize()
        const edge = clamp(raw, 0, 100)
        const placed = reduced
            ? edge
            : edge + (rubber(((raw - edge) / 100) * size) / size) * 100
        state.raw = raw
        if (first && state.press && !reduced) {
            const from = pos.get()
            pos.jump(placed)
            lag.jump(from - placed)
            animate(lag, 0, moveSpring)
        } else pos.set(placed)
        commit(edge, true)
    }

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0 || !event.isPrimary || !rootRef.current) return
        const onHandle = !!(event.target as HTMLElement).closest(
            "[data-handle]"
        )
        pressedHandle.current = onHandle
        event.currentTarget.setPointerCapture(event.pointerId)
        const state: Drag = {
            pointer: event.pointerId,
            grab: 0,
            press: !onHandle,
            started: false,
            x: event.clientX,
            y: event.clientY,
            raw: 0,
        }
        drag.current = state
        // A finger on the photo might be scrolling the page, so it waits for a sideways drag; a mouse or the handle answers at once.
        if (event.pointerType !== "touch" || onHandle)
            start(state, percentAt(event))
    }
    function onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const state = drag.current
        if (!state || state.pointer !== event.pointerId) return
        if (!state.started) {
            const along = Math.abs(
                    vertical ? event.clientY - state.y : event.clientX - state.x
                ),
                across = Math.abs(
                    vertical ? event.clientX - state.x : event.clientY - state.y
                )
            if (along < 6 && across < 6) return
            if (across > along) {
                drag.current = null
                return
            }
            start(state, percentAt(event))
            return
        }
        follow(state, percentAt(event))
    }
    function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
        const state = drag.current
        if (!state || state.pointer !== event.pointerId) return
        drag.current = null
        // A tap on the photo moves the divider there.
        if (!state.started) {
            if (event.type === "pointerup") {
                focusQuietly()
                commit(clamp(percentAt(event), 0, 100))
            }
            return
        }
        const from = pos.get() + lag.get(),
            velocity =
                lag.getVelocity() +
                (from > 100 || from < 0 ? pos.getVelocity() : 0)
        const target = clamp(lag.get() !== 0 ? state.raw : from, 0, 100)
        lag.jump(0)
        pos.jump(from)
        goal.current = Number(target.toFixed(2))
        if (from !== target) {
            if (reduced) pos.jump(target)
            else animate(pos, target, { ...moveSpring, velocity })
        }
        commit(target)
        setDragging(false)
    }

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const large = event.shiftKey ? 10 : 1
        const toward: Record<string, number> = vertical
            ? {
                  ArrowUp: -large,
                  ArrowDown: large,
                  ArrowRight: -large,
                  ArrowLeft: large,
                  PageUp: -10,
                  PageDown: 10,
              }
            : {
                  ArrowLeft: -large,
                  ArrowRight: large,
                  ArrowUp: -large,
                  ArrowDown: large,
                  PageUp: -10,
                  PageDown: 10,
              }
        let next: number
        if (event.key === "Home") next = 100
        else if (event.key === "End") next = 0
        else if (event.key in toward)
            next = Math.round(latest.current) + toward[event.key]!
        else return
        event.preventDefault()
        setQuiet(false)
        const clamped = clamp(next, 0, 100)
        if (clamped === latest.current) {
            if (!reduced && next !== clamped)
                animate(pos, goal.current, {
                    ...kickSpring,
                    velocity:
                        ((Math.sign(next - clamped) * BUMP_PX) / axisSize()) *
                        100,
                })
            return
        }
        commit(clamped)
    }

    const capsule = dragging
        ? vertical
            ? { width: 36, height: 56 }
            : { width: 56, height: 36 }
        : { width: 40, height: 40 }
    const vars: Record<string, string> = { "--radius-panel": `${radius}px` }
    if (lineColor) vars["--compare-line"] = lineColor
    return (
        <div
            ref={rootRef}
            className="arc-image-compare-root"
            data-theme={theme === "Dark" ? "dark" : undefined}
            data-orientation={orientation}
            data-dragging={dragging || undefined}
            style={
                {
                    height: "100%",
                    fontFamily: "var(--font-body)",
                    ...vars,
                    ...style,
                } as CSSProperties
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onLostPointerCapture={onPointerEnd}
            onMouseDown={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
            // Pointer capture sends the double-click to the frame, so it checks where the presses began.
            onDoubleClick={() => {
                if (pressedHandle.current && latest.current !== 50) commit(50)
            }}
        >
            <StyleTag />
            <div className="arc-image-compare-layer">
                <Img image={after} fallback={DEFAULT_PHOTO} alt={afterAlt} />
            </div>
            <motion.div
                className="arc-image-compare-layer"
                style={{ clipPath }}
            >
                <Img image={before} fallback={DEFAULT_BEFORE} alt={beforeAlt} />
            </motion.div>
            {labels && (
                <>
                    <motion.span
                        ref={beforeChip}
                        className="arc-image-compare-chip"
                        style={{ opacity: beforeOpacity, ...font }}
                        aria-hidden="true"
                    >
                        {labels[0]}
                    </motion.span>
                    <motion.span
                        ref={afterChip}
                        className="arc-image-compare-chip"
                        data-place="end"
                        style={{ opacity: afterAcross, ...font }}
                        aria-hidden="true"
                    >
                        {labels[1]}
                    </motion.span>
                    <motion.span
                        className="arc-image-compare-chip"
                        data-place="bottom"
                        style={{ opacity: afterDown, ...font }}
                        aria-hidden="true"
                    >
                        {labels[1]}
                    </motion.span>
                </>
            )}
            <motion.div
                className="arc-image-compare-pivot"
                style={{ x: pivotX, y: pivotY }}
            >
                <motion.span
                    className="arc-image-compare-rotor"
                    style={{ rotate: theta }}
                >
                    <span className="arc-image-compare-line" />
                </motion.span>
                <motion.span
                    className="arc-image-compare-handleSlot"
                    style={{ x: handleX, y: handleY }}
                >
                    <motion.div
                        ref={handleRef}
                        data-handle=""
                        data-quiet={quiet || undefined}
                        className="arc-image-compare-handle"
                        role="slider"
                        tabIndex={0}
                        aria-label={label}
                        aria-orientation={orientation}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={afterShare}
                        aria-valuetext={`${afterShare}% after`}
                        initial={false}
                        animate={capsule}
                        transition={
                            reduced ? { duration: 0 } : (spring.morph as any)
                        }
                        onKeyDown={onKeyDown}
                        onBlur={() => setQuiet(false)}
                    >
                        <motion.span
                            className="arc-image-compare-chevrons"
                            style={{ rotate: theta }}
                            aria-hidden="true"
                        >
                            <motion.span
                                className="arc-image-compare-chevron"
                                initial={false}
                                animate={{ x: dragging ? -4 : 0 }}
                                transition={
                                    reduced
                                        ? { duration: 0 }
                                        : (spring.morph as any)
                                }
                            >
                                <ChevronLeft />
                            </motion.span>
                            <motion.span
                                className="arc-image-compare-chevron"
                                initial={false}
                                animate={{ x: dragging ? 4 : 0 }}
                                transition={
                                    reduced
                                        ? { duration: 0 }
                                        : (spring.morph as any)
                                }
                            >
                                <ChevronRight />
                            </motion.span>
                        </motion.span>
                    </motion.div>
                </motion.span>
            </motion.div>
        </div>
    )
}

addPropertyControls(ImageCompare, {
    before: { type: ControlType.ResponsiveImage, title: "Before" },
    beforeAlt: {
        type: ControlType.String,
        title: "Before Alt",
        defaultValue: "The photo in black and white",
    },
    after: { type: ControlType.ResponsiveImage, title: "After" },
    afterAlt: {
        type: ControlType.String,
        title: "After Alt",
        defaultValue: "The photo in full colour",
    },
    defaultPosition: {
        type: ControlType.Number,
        title: "Position",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 50,
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
    },
    beforeLabel: {
        type: ControlType.String,
        title: "Before Label",
        defaultValue: "Before",
        hidden: (p: any) => !p.showLabels,
    },
    afterLabel: {
        type: ControlType.String,
        title: "After Label",
        defaultValue: "After",
        hidden: (p: any) => !p.showLabels,
    },
    label: {
        type: ControlType.String,
        title: "A11y Name",
        defaultValue: "Before and after",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        defaultValue: 26,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        optional: true,
    } as any,
    font: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 12, fontWeight: 500 },
    } as any,
    onChange: { type: ControlType.EventHandler },
})
