/**
 * Elastic Slider — Framer code component.
 * Ported from Arc (https://uiarc.dev/components/elastic-slider) by Elia Kuratli, MIT License.
 * Copyright (c) Elia Kuratli. The above copyright notice and the MIT permission notice shall be included in all copies.
 *
 * A single value slider made of something that gives. The thumb swells under the finger, the track stretches like rubber past
 * either end and springs back with the release velocity, a value tag hangs off the thumb and sways with its speed, and marks act
 * as detents the thumb clicks into. Arrows, Shift+arrows, PageUp, PageDown, Home, and End work as in a native range input.
 */
import * as React from "react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type {
    CSSProperties,
    KeyboardEvent,
    PointerEvent,
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
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    useVelocity,
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

const CSS = `.arc-elastic-slider-root{--background:oklch(100% 0 0);--surface:oklch(100% 0 0);--surface-raised:oklch(100% 0 0);--surface-muted:oklch(97.8% 0 0);--foreground:oklch(15% 0 0);--text-secondary:oklch(46% 0 0);--text-muted:oklch(59% 0 0);--border:oklch(93.5% 0 0);--border-subtle:oklch(96.5% 0 0);--border-strong:oklch(82% 0 0);--accent:oklch(33% 0 0);--accent-strong:oklch(24% 0 0);--accent-subtle:oklch(33% 0 0 / .1);--accent-foreground:oklch(100% 0 0);--control-on:oklch(23% 0 0);--control-glyph:oklch(100% 0 0);--control-track:oklch(89.5% 0 0);--control-track-hover:oklch(86% 0 0);--control-thumb:oklch(100% 0 0);--control-thumb-on:oklch(100% 0 0);--control-thumb-shadow:0 0 0 .5px oklch(0% 0 0 / .07), 0 1px 2px oklch(0% 0 0 / .14), 0 2px 6px oklch(0% 0 0 / .06);--control-fill:oklch(23% 0 0);--success:oklch(49% .19 150);--warning:oklch(58% .18 75);--danger:oklch(54% .21 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .035);--shadow-raised:0 6px 18px oklch(0% 0 0 / .065), 0 1px 3px oklch(0% 0 0 / .035);--shadow-floating:0 20px 48px oklch(0% 0 0 / .105), 0 3px 10px oklch(0% 0 0 / .045);--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--radius-control:1.125rem;--radius-panel:1.625rem;--radius-surface:2.125rem;--radius-pill:9999px;--control-height-sm:2.25rem;--control-height-md:2.75rem;--control-height-lg:3.125rem;--font-body:"Inter", "Inter Variable", system-ui, sans-serif;--text-xs:.75rem;--text-sm:.875rem;--text-base:1rem;--text-lg:1.125rem;--tracking-body:-.01em;--leading-body:1.4;--ease-enter:cubic-bezier(.16,1,.3,1);--ease-standard:cubic-bezier(.22,1,.36,1);--ease-exit:cubic-bezier(.7,0,.84,0);--ease-in-out:cubic-bezier(.65,0,.35,1);--ease-spring:linear(0, 0.0213, 0.0739, 0.1443, 0.2235, 0.305, 0.3849, 0.4606, 0.5305, 0.594, 0.6508, 0.7011, 0.7452, 0.7836, 0.8168, 0.8454, 0.8699, 0.8907, 0.9084, 0.9234, 0.9361, 0.9467, 0.9557, 0.9632, 0.9694, 0.9747, 0.979, 0.9826, 0.9857, 0.9882, 0.9902, 0.992, 0.9934, 0.9946, 0.9955, 0.9963, 1);--duration-instant:120ms;--duration-fast:160ms;--duration-standard:240ms;--duration-considered:480ms;--duration-spring:580ms;color-scheme:light;}
.arc-elastic-slider-root[data-theme="dark"]{color-scheme:dark;--background:oklch(19% 0 0);--surface:oklch(21.5% 0 0);--surface-raised:oklch(24% 0 0);--surface-muted:oklch(26% 0 0);--foreground:oklch(96% 0 0);--text-secondary:oklch(77% 0 0);--text-muted:oklch(64% 0 0);--border:oklch(29% 0 0);--border-subtle:oklch(25% 0 0);--border-strong:oklch(40% 0 0);--accent:oklch(80% 0 0);--accent-strong:oklch(91% 0 0);--accent-subtle:oklch(80% 0 0 / .13);--accent-foreground:oklch(19% 0 0);--control-on:oklch(93% 0 0);--control-glyph:oklch(19% 0 0);--control-track:oklch(33% 0 0);--control-track-hover:oklch(37% 0 0);--control-thumb:oklch(97% 0 0);--control-thumb-on:oklch(19% 0 0);--control-fill:oklch(62% 0 0);--control-thumb-shadow:0 0 0 .5px oklch(0% 0 0 / .3), 0 1px 2px oklch(0% 0 0 / .35), 0 2px 6px oklch(0% 0 0 / .2);--success:oklch(78% .18 150);--warning:oklch(83% .17 80);--danger:oklch(76% .2 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .18);--shadow-raised:0 8px 22px oklch(0% 0 0 / .22);--shadow-floating:0 22px 55px oklch(0% 0 0 / .34);}
.arc-elastic-slider-root :focus:not(:focus-visible){outline:none}.arc-elastic-slider-root :focus-visible{outline:var(--focus-outline-width, 2px) solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent));outline-offset:var(--focus-outline-offset, 2px)}.arc-elastic-slider-root:focus-visible{outline:var(--focus-outline-width, 2px) solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent));outline-offset:var(--focus-outline-offset, 2px)}.arc-elastic-slider-root, .arc-elastic-slider-root *, .arc-elastic-slider-root *::before, .arc-elastic-slider-root *::after{box-sizing:border-box}
.arc-elastic-slider-root { --elastic-thumb: 24px; --elastic-track: 8px; display: grid; width: 100%; min-width: 0; gap: var(--space-2); color: var(--foreground); font-size: var(--text-sm); line-height: var(--leading-body); letter-spacing: var(--tracking-body); user-select: none; -webkit-user-select: none; }
.arc-elastic-slider-header { display: flex; min-width: 0; align-items: baseline; justify-content: space-between; gap: var(--space-4); }
.arc-elastic-slider-label { min-width: 0; font-weight: 500; }
.arc-elastic-slider-readout { flex: none; color: var(--text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity var(--duration-fast) var(--ease-standard); }
.arc-elastic-slider-root[data-tag] .arc-elastic-slider-readout { opacity: 0; }
.arc-elastic-slider-body { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; }
.arc-elastic-slider-start, .arc-elastic-slider-end { display: flex; color: var(--text-muted); will-change: transform; }
.arc-elastic-slider-start { grid-area: 1 / 1; margin-right: var(--space-3); }
.arc-elastic-slider-end { grid-area: 1 / 3; margin-left: var(--space-3); }
.arc-elastic-slider-control { position: relative; grid-area: 1 / 2; height: var(--control-height-md); cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
.arc-elastic-slider-rail { position: absolute; top: 50%; right: calc(var(--elastic-thumb) / 2); left: calc(var(--elastic-thumb) / 2); height: var(--elastic-track); margin-top: calc(var(--elastic-track) / -2); }
.arc-elastic-slider-track { position: absolute; inset: 0; border-radius: var(--radius-pill); background: var(--control-track); will-change: transform; }
.arc-elastic-slider-fill { position: absolute; inset: 0; border-radius: inherit; background: var(--control-fill); }
.arc-elastic-slider-tick { position: absolute; top: 50%; width: 4px; height: 4px; margin: -2px 0 0 -2px; border-radius: var(--radius-pill); background: color-mix(in oklab, var(--foreground) 32%, transparent); pointer-events: none; transition: background-color var(--duration-fast) var(--ease-standard); }
.arc-elastic-slider-tick[data-on] { background: color-mix(in oklab, var(--control-glyph) 60%, transparent); }
.arc-elastic-slider-thumbs { position: absolute; inset: 0 calc(var(--elastic-thumb) / 2); container-type: inline-size; pointer-events: none; }
.arc-elastic-slider-layer { position: absolute; inset: 0; }
.arc-elastic-slider-shift { position: absolute; inset: 0; }
.arc-elastic-slider-thumb { position: absolute; top: 50%; right: 0; box-sizing: border-box; width: var(--elastic-thumb); height: var(--elastic-thumb); translate: 50% -50%; border: 0; border-radius: var(--radius-pill); background: var(--control-thumb); box-shadow: var(--control-thumb-shadow); pointer-events: auto; cursor: grab; outline: none; transition: box-shadow var(--duration-fast) var(--ease-standard); }
.arc-elastic-slider-thumb::after { content: ""; position: absolute; inset: -12px; border-radius: inherit; }
.arc-elastic-slider-root[data-dragging], .arc-elastic-slider-root[data-dragging] .arc-elastic-slider-control, .arc-elastic-slider-root[data-dragging] .arc-elastic-slider-thumb { cursor: grabbing; }
.arc-elastic-slider-bubbleAnchor { --edge: calc(var(--elastic-thumb) / 2); --x: calc(var(--at, 0) * 1cqw); position: absolute; right: 0; bottom: calc(50% + var(--elastic-thumb) / 2 + 10px); display: flex; translate: clamp(calc(100% - var(--edge) - var(--x)), 50%, calc(100cqw + var(--edge) - var(--x))) 0; pointer-events: none; }
@media (pointer: coarse) { .arc-elastic-slider-bubbleAnchor { bottom: calc(50% + var(--elastic-thumb) / 2 + 20px); } }
.arc-elastic-slider-bubble { display: inline-flex; min-height: 1.75rem; align-items: center; padding: 0 var(--space-3); border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); box-shadow: var(--shadow-raised); font-size: var(--text-sm); font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; transform-origin: 50% 130%; }
.arc-elastic-slider-marks { position: relative; grid-area: 2 / 2; height: 1.25rem; margin: 0 calc(var(--elastic-thumb) / 2); color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.arc-elastic-slider-markLabel { position: absolute; top: 0; translate: -50% 0; white-space: nowrap; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard); }
.arc-elastic-slider-markLabel[data-edge="start"] { translate: max(-50%, calc(var(--elastic-thumb) / -2)) 0; }
.arc-elastic-slider-markLabel[data-edge="end"] { translate: min(-50%, calc(-100% + var(--elastic-thumb) / 2)) 0; }
.arc-elastic-slider-markLabel[data-on] { color: var(--foreground); }
@media (hover: hover) and (pointer: fine) { .arc-elastic-slider-markLabel:hover { color: var(--foreground); } }
.arc-elastic-slider-root[data-disabled] { opacity: .5; }
.arc-elastic-slider-root[data-disabled] .arc-elastic-slider-control, .arc-elastic-slider-root[data-disabled] .arc-elastic-slider-thumb, .arc-elastic-slider-root[data-disabled] .arc-elastic-slider-markLabel { cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .arc-elastic-slider-thumb, .arc-elastic-slider-tick, .arc-elastic-slider-markLabel { transition: none; } }`

function StyleTag() {
    return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}

// ---------- icons (lucide, inlined) ----------
const svg = (size: number) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
})
const SPEAKER =
    "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
function VolumeLow() {
    return (
        <svg {...svg(18)}>
            <path d={SPEAKER} />
        </svg>
    )
}
function VolumeHigh() {
    return (
        <svg {...svg(18)}>
            <path d={SPEAKER} />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
        </svg>
    )
}
function SunDim() {
    return (
        <svg {...svg(16)}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 4h.01M20 12h.01M12 20h.01M4 12h.01M17.657 6.343h.01M17.657 17.657h.01M6.343 17.657h.01M6.343 6.343h.01" />
        </svg>
    )
}
function SunBright() {
    return (
        <svg {...svg(18)}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    )
}
function Minus() {
    return (
        <svg {...svg(16)}>
            <path d="M5 12h14" />
        </svg>
    )
}
function Plus() {
    return (
        <svg {...svg(16)}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
const ICON_SETS: Record<string, [ReactNode, ReactNode] | null> = {
    Volume: [<VolumeLow key="s" />, <VolumeHigh key="e" />],
    Brightness: [<SunDim key="s" />, <SunBright key="e" />],
    "Minus / Plus": [<Minus key="s" />, <Plus key="e" />],
    None: null,
}

// ---------- logic (faithful to the original) ----------
export interface ElasticSliderMark {
    value: number
    label?: string
}
type Drag = {
    pointer: number
    grab: number
    samples: { t: number; p: number }[]
    detent: number | null
    edge: number
    type: string
}

const { spring, duration, blur } = motionTokens
const enterEase = [...motionTokens.ease.enter] as [
    number,
    number,
    number,
    number,
]
const exitEase = [...motionTokens.ease.standard] as [
    number,
    number,
    number,
    number,
]
/** Motion drops velocity on time-defined springs, so anything a gesture hands off to runs the same spring written as stiffness and damping. */
const physical = (
    { visualDuration, bounce }: { visualDuration: number; bounce: number },
    restDelta = 0.002
) => {
    const root = (2 * Math.PI) / (visualDuration * 1.2)
    return {
        type: "spring" as const,
        stiffness: root * root,
        damping: 2 * (1 - bounce) * root,
        restDelta,
        restSpeed: restDelta * 10,
    }
}
const thumbSpring = physical(spring.snappy)
/** The stretch lets go with more life than anything else here: it is the one thing the user threw. */
const snapBack = physical({ visualDuration: 0.5, bounce: 0.42 }, 0.05)
const STRETCH = 26,
    DETENT_PX = 7,
    BUMP_PX = 260
const rubber = (distance: number, limit = STRETCH) =>
    Math.sign(distance) *
    (1 - 1 / ((Math.abs(distance) * 0.55) / limit + 1)) *
    limit
const clamp = (value: number, low: number, high: number) =>
    Math.min(high, Math.max(low, value))
const decimalsOf = (value: number) => (String(value).split(".")[1] ?? "").length

const bubbleIn = {
    opacity: 0,
    scale: 0.7,
    y: 6,
    filter: `blur(${blur.subtle}px)`,
}
const bubbleRest: any = {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transitionEnd: { filter: "none" },
}
const bubbleOut: any = {
    opacity: 0,
    scale: 0.85,
    y: 4,
    filter: `blur(${blur.subtle}px)`,
    transition: { duration: duration.instant, ease: exitEase },
}
const bubbleEnter: any = {
    ...spring.snappy,
    opacity: { duration: duration.fast, ease: enterEase },
    filter: { duration: duration.fast, ease: enterEase },
}

interface Props {
    label: string
    showLabel: boolean
    defaultValue: number
    min: number
    max: number
    step: number
    largeStep: number
    marks: ElasticSliderMark[]
    prefix: string
    suffix: string
    showValue: boolean
    icons: "Volume" | "Brightness" | "Minus / Plus" | "None"
    disabled: boolean
    theme: "Light" | "Dark"
    customColors: boolean
    fillColor: string
    trackColor: string
    thumbColor: string
    textColor: string
    thumbSize: number
    trackHeight: number
    font?: CSSProperties
    onChange?: (value: number) => void
    onCommit?: (value: number) => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ElasticSlider(props: Props) {
    const {
        label = "Volume",
        showLabel = true,
        defaultValue = 40,
        min = 0,
        max = 100,
        step: stepProp = 1,
        largeStep: largeStepProp = 0,
        marks: rawMarks = DEFAULT_MARKS,
        prefix = "",
        suffix = "%",
        showValue = true,
        icons = "Volume",
        disabled = false,
        theme = "Light",
        customColors = false,
        fillColor = "#1A1A1A",
        trackColor = "#E2E2E2",
        thumbColor = "#FFFFFF",
        textColor = "#1A1A1A",
        thumbSize = 24,
        trackHeight = 8,
        font,
        onChange,
        onCommit,
        style,
    } = props
    const largeStep = largeStepProp > 0 ? largeStepProp : undefined
    const iconPair = ICON_SETS[icons] ?? null
    const startIcon = iconPair?.[0]
    const endIcon = iconPair?.[1]

    const reduced = useReducedMotion() ?? false
    const labelId = useId()
    const step = stepProp > 0 ? stepProp : 1
    const span = max - min || 1
    const decimals = Math.max(decimalsOf(step), decimalsOf(min))
    const [current, setInternal] = useState(() =>
        clamp(defaultValue ?? min, min, max)
    )
    // Framer: follow the Default Value control when it is edited on the canvas.
    useEffect(() => {
        setInternal(clamp(defaultValue ?? min, min, max))
    }, [defaultValue, min, max])
    const formatValue = (input: number) =>
        `${prefix}${input.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
    const pct = (input: number) => ((input - min) / span) * 100
    const valueAt = (percent: number) => min + (percent / 100) * span
    const snap = (input: number) =>
        clamp(
            Number(
                (min + Math.round((input - min) / step) * step).toFixed(
                    decimals
                )
            ),
            min,
            max
        )
    const markList = (rawMarks ?? [])
        .filter(
            (mark) =>
                mark &&
                typeof mark.value === "number" &&
                !Number.isNaN(mark.value)
        )
        .map(
            (mark) =>
                ({
                    value: mark.value,
                    label: mark.label || undefined,
                }) as ElasticSliderMark
        )
        .filter((mark) => mark.value >= min && mark.value <= max)

    const trackRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<HTMLDivElement>(null)
    const tickRefs = useRef(new Map<number, HTMLSpanElement>())
    const latest = useRef(current)
    const goal = useRef(pct(current))
    const drag = useRef<Drag | null>(null)
    const width = useRef(1)
    const lingerTimer = useRef<number | undefined>(undefined)
    const [dragging, setDragging] = useState(false)
    const [keyed, setKeyed] = useState(false)
    const [linger, setLinger] = useState(false)

    // The thumb is a committed position plus a catch-up offset. `over` is the rubber-band stretch in pixels, signed by side.
    const pos = useMotionValue(pct(current))
    const lag = useMotionValue(0)
    const over = useMotionValue(0)
    const press = useMotionValue(0)
    const shown = useTransform(() => pos.get() + lag.get())
    const thumbX = useTransform(shown, (at) => `${at - 100}%`)
    const clipPath = useTransform(
        shown,
        (at) =>
            `inset(0 ${(100 - clamp(at, 0, 100)).toFixed(3)}% 0 0 round 999px)`
    )
    // Stretch: the track grows away from its anchored end and thins as it does, like a band pulled tight. A press thickens it a little.
    const scaleX = useTransform(over, (px) => 1 + Math.abs(px) / width.current)
    const originX = useTransform(over, (px) => (px < 0 ? 1 : 0))
    const scaleY = useTransform(
        () =>
            (1 + press.get() * 0.45) *
            (1 - (Math.abs(over.get()) / STRETCH) * 0.32)
    )
    const startShift = useTransform(over, (px) => Math.min(0, px))
    const endShift = useTransform(over, (px) => Math.max(0, px))
    // The tag trails the thumb on a soft spring, and swings on its tail with that speed.
    const trailed = useSpring(shown, { stiffness: 420, damping: 30, mass: 0.7 })
    const bubbleAt = reduced ? shown : trailed
    const bubbleX = useTransform(bubbleAt, (at) => `${at - 100}%`)
    const speed = useVelocity(trailed)
    const rotate = useTransform(speed, (velocity) =>
        reduced ? 0 : clamp((-velocity / 100) * width.current * 0.009, -11, 11)
    )

    const emit = (next: number) => {
        if (latest.current === next) return
        latest.current = next
        setInternal(next)
        onChange?.(next)
    }

    // Values from outside a drag (keys, props) spring the thumb to their place from wherever it is on screen.
    useIsoLayoutEffect(() => {
        latest.current = current
        const target = pct(current)
        if (drag.current || goal.current === target) return
        goal.current = target
        const from = pos.get() + lag.get()
        lag.jump(0)
        pos.jump(from)
        if (reduced) pos.jump(target)
        else animate(pos, target, thumbSpring)
    })
    useEffect(() => {
        const node = trackRef.current
        if (!node || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(([entry]) => {
            if (entry) width.current = entry.contentRect.width || 1
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])
    useEffect(() => () => window.clearTimeout(lingerTimer.current), [])

    /** A detent answers with a small pop of its tick and, where the device supports it, a short tap of vibration. */
    function pulse(mark: number, haptic: boolean) {
        const node = tickRefs.current.get(mark)
        if (node && !reduced)
            animate(
                node,
                { scale: [1, 2.1, 1] },
                { duration: 0.34, ease: enterEase }
            )
        if (
            haptic &&
            typeof navigator !== "undefined" &&
            "vibrate" in navigator
        )
            navigator.vibrate?.(6)
    }
    /** Moves the thumb to a new resting spot through a spring on the catch-up offset, so the jump reads as travel. */
    function glide(placed: number) {
        const from = pos.get() + lag.get()
        pos.set(placed)
        if (reduced) {
            lag.jump(0)
            return
        }
        lag.jump(from - placed)
        animate(lag, 0, thumbSpring)
    }
    const detentAt = (percent: number) => {
        let best: number | null = null,
            gap = DETENT_PX + 1
        for (const mark of markList) {
            const distance = Math.abs(
                ((percent - pct(mark.value)) / 100) * width.current
            )
            if (distance <= DETENT_PX && distance < gap) {
                best = mark.value
                gap = distance
            }
        }
        return best
    }

    function follow(state: Drag, at: number, time: number, first = false) {
        const raw = at - state.grab
        const edge = clamp(raw, 0, 100)
        over.set(reduced ? 0 : rubber(((raw - edge) / 100) * width.current))
        const detent = detentAt(edge)
        const placed = detent === null ? edge : pct(detent)
        if (first || detent !== state.detent) {
            if (detent !== null && !first) pulse(detent, state.type === "touch")
            glide(placed)
        } else pos.set(placed)
        state.detent = detent
        state.edge = edge
        state.samples.push({ t: time, p: placed })
        if (state.samples.length > 6) state.samples.shift()
        emit(detent ?? snap(valueAt(edge)))
    }

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (disabled || event.button !== 0 || !event.isPrimary) return
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect) return
        width.current = rect.width || 1
        const at = ((event.clientX - rect.left) / width.current) * 100
        const grabbed = !!(event.target as HTMLElement).closest("[data-thumb]")
        event.currentTarget.setPointerCapture(event.pointerId)
        const from = pos.get() + lag.get()
        lag.jump(0)
        pos.jump(from)
        const state: Drag = {
            pointer: event.pointerId,
            grab: grabbed ? at - from : 0,
            samples: [],
            detent: null,
            edge: from,
            type: event.pointerType,
        }
        drag.current = state
        setDragging(true)
        window.clearTimeout(lingerTimer.current)
        setLinger(false)
        thumbRef.current?.focus({ preventScroll: true })
        if (reduced) press.jump(1)
        else animate(press, 1, spring.snappy as any)
        // A grabbed thumb stays put under the finger; a pressed track pulls the thumb over on a spring.
        follow(state, grabbed ? from + state.grab : at, event.timeStamp, true)
    }
    function onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const state = drag.current
        if (!state || state.pointer !== event.pointerId) return
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect) return
        follow(
            state,
            ((event.clientX - rect.left) / (rect.width || 1)) * 100,
            event.timeStamp
        )
    }
    function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
        const state = drag.current
        if (!state || state.pointer !== event.pointerId) return
        drag.current = null
        const samples = state.samples,
            first = samples[0],
            last = samples[samples.length - 1]
        const elapsed = last && first ? (last.t - first.t) / 1000 : 0
        const velocity =
            (elapsed > 0.008 && event.timeStamp - last!.t < 60
                ? (last!.p - first!.p) / elapsed
                : 0) + lag.getVelocity()
        const next = state.detent ?? snap(valueAt(state.edge))
        const from = pos.get() + lag.get(),
            target = pct(next)
        lag.jump(0)
        pos.jump(from)
        goal.current = target
        if (reduced) {
            pos.jump(target)
            over.jump(0)
            press.jump(0)
        } else {
            animate(pos, target, { ...thumbSpring, velocity })
            animate(over, 0, { ...snapBack, velocity: over.getVelocity() })
            animate(press, 0, spring.snappy as any)
        }
        emit(next)
        setDragging(false)
        setLinger(true)
        lingerTimer.current = window.setTimeout(() => setLinger(false), 700)
        onCommit?.(next)
    }

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (disabled) return
        const now = latest.current
        const large = largeStep ?? Math.max(step, snap(min + span / 10) - min)
        const moves: Record<string, number> = {
            ArrowRight: step,
            ArrowUp: step,
            ArrowLeft: -step,
            ArrowDown: -step,
            PageUp: large,
            PageDown: -large,
        }
        let wanted: number
        if (event.key === "Home") wanted = min
        else if (event.key === "End") wanted = max
        else if (event.key in moves)
            wanted =
                now +
                (event.shiftKey && event.key.startsWith("Arrow")
                    ? Math.sign(moves[event.key]!) * large
                    : moves[event.key]!)
        else return
        event.preventDefault()
        setKeyed(true)
        const next = snap(wanted)
        // At a limit the track still stretches toward the press and snaps back, so the key visibly lands on something.
        if (next === now) {
            const toward = Math.sign(wanted - now)
            if (toward && !reduced)
                animate(over, 0, { ...snapBack, velocity: toward * BUMP_PX })
            return
        }
        emit(next)
        if (markList.some((mark) => mark.value === next)) pulse(next, false)
        onCommit?.(next)
    }

    const text = formatValue(current)
    const labelled = markList.filter((mark) => mark.label)
    const bubble = dragging || keyed || linger

    const vars: Record<string, string> = {
        "--elastic-thumb": `${thumbSize}px`,
        "--elastic-track": `${trackHeight}px`,
    }
    if (customColors)
        Object.assign(vars, {
            "--control-fill": fillColor,
            "--control-track": trackColor,
            "--control-thumb": thumbColor,
            "--foreground": textColor,
            "--control-glyph": thumbColor,
        })

    return (
        <div
            className="arc-elastic-slider-root"
            data-theme={theme === "Dark" ? "dark" : undefined}
            data-disabled={disabled || undefined}
            data-dragging={dragging || undefined}
            data-tag={bubble || undefined}
            data-marks={labelled.length > 0 || undefined}
            style={
                {
                    fontFamily: "var(--font-body)",
                    ...vars,
                    ...font,
                    ...style,
                } as CSSProperties
            }
        >
            <StyleTag />
            {(showLabel || showValue) && (
                <div className="arc-elastic-slider-header">
                    <span
                        id={labelId}
                        className="arc-elastic-slider-label"
                        style={showLabel ? undefined : HIDDEN}
                    >
                        {label}
                    </span>
                    {showValue && (
                        <span
                            className="arc-elastic-slider-readout"
                            aria-hidden="true"
                        >
                            {text}
                        </span>
                    )}
                </div>
            )}
            {!showLabel && !showValue && (
                <span id={labelId} style={HIDDEN}>
                    {label}
                </span>
            )}
            <div className="arc-elastic-slider-body">
                {startIcon && (
                    <motion.span
                        className="arc-elastic-slider-start"
                        style={{ x: startShift }}
                        aria-hidden="true"
                    >
                        {startIcon}
                    </motion.span>
                )}
                <div
                    className="arc-elastic-slider-control"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    onLostPointerCapture={onPointerEnd}
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <div ref={trackRef} className="arc-elastic-slider-rail">
                        <motion.div
                            className="arc-elastic-slider-track"
                            style={{ scaleX, scaleY, originX }}
                        >
                            <motion.div
                                className="arc-elastic-slider-fill"
                                style={{ clipPath }}
                            />
                        </motion.div>
                        {markList
                            .filter(
                                (mark) => mark.value > min && mark.value < max
                            )
                            .map((mark) => (
                                <span
                                    key={mark.value}
                                    ref={(node) => {
                                        if (node)
                                            tickRefs.current.set(
                                                mark.value,
                                                node
                                            )
                                        else tickRefs.current.delete(mark.value)
                                    }}
                                    className="arc-elastic-slider-tick"
                                    data-on={mark.value <= current || undefined}
                                    style={{ left: `${pct(mark.value)}%` }}
                                />
                            ))}
                    </div>
                    <div className="arc-elastic-slider-thumbs">
                        <motion.div
                            className="arc-elastic-slider-layer"
                            style={{ x: bubbleX }}
                        >
                            <motion.span
                                className="arc-elastic-slider-bubbleAnchor"
                                style={{ x: over, "--at": bubbleAt } as any}
                            >
                                <AnimatePresence>
                                    {bubble && (
                                        <motion.span
                                            key="bubble"
                                            className="arc-elastic-slider-bubble"
                                            aria-hidden="true"
                                            style={{ rotate }}
                                            initial={
                                                reduced
                                                    ? { opacity: 0 }
                                                    : bubbleIn
                                            }
                                            animate={bubbleRest}
                                            exit={
                                                reduced
                                                    ? {
                                                          opacity: 0,
                                                          transition: {
                                                              duration:
                                                                  duration.instant,
                                                          },
                                                      }
                                                    : bubbleOut
                                            }
                                            transition={
                                                reduced
                                                    ? { duration: 0.15 }
                                                    : bubbleEnter
                                            }
                                        >
                                            {text}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.span>
                        </motion.div>
                        <motion.div
                            className="arc-elastic-slider-layer"
                            style={{ x: thumbX }}
                        >
                            <motion.div
                                className="arc-elastic-slider-shift"
                                style={{ x: over }}
                            >
                                <motion.div
                                    ref={thumbRef}
                                    role="slider"
                                    data-thumb=""
                                    className="arc-elastic-slider-thumb"
                                    tabIndex={disabled ? -1 : 0}
                                    aria-labelledby={labelId}
                                    aria-valuemin={min}
                                    aria-valuemax={max}
                                    aria-valuenow={current}
                                    aria-valuetext={text}
                                    aria-orientation="horizontal"
                                    aria-disabled={disabled || undefined}
                                    initial={false}
                                    animate={{ scale: dragging ? 1.28 : 1 }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : (spring.snappy as any)
                                    }
                                    onKeyDown={onKeyDown}
                                    onBlur={() => setKeyed(false)}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
                {endIcon && (
                    <motion.span
                        className="arc-elastic-slider-end"
                        style={{ x: endShift }}
                        aria-hidden="true"
                    >
                        {endIcon}
                    </motion.span>
                )}
                {labelled.length > 0 && (
                    <div
                        className="arc-elastic-slider-marks"
                        aria-hidden="true"
                    >
                        {labelled.map((mark) => (
                            <span
                                key={mark.value}
                                className="arc-elastic-slider-markLabel"
                                data-on={mark.value === current || undefined}
                                data-edge={
                                    mark.value === min
                                        ? "start"
                                        : mark.value === max
                                          ? "end"
                                          : undefined
                                }
                                style={{ left: `${pct(mark.value)}%` }}
                                onClick={() => {
                                    if (
                                        disabled ||
                                        mark.value === latest.current
                                    )
                                        return
                                    emit(mark.value)
                                    pulse(mark.value, false)
                                    onCommit?.(mark.value)
                                }}
                            >
                                {mark.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const HIDDEN: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
}

const DEFAULT_MARKS: ElasticSliderMark[] = [
    { value: 0, label: "0" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
    { value: 75, label: "75" },
    { value: 100, label: "100" },
]

addPropertyControls(ElasticSlider, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Volume" },
    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
    },
    showValue: {
        type: ControlType.Boolean,
        title: "Show Value",
        defaultValue: true,
    },
    defaultValue: {
        type: ControlType.Number,
        title: "Value",
        defaultValue: 40,
        displayStepper: false,
    },
    min: { type: ControlType.Number, title: "Min", defaultValue: 0 },
    max: { type: ControlType.Number, title: "Max", defaultValue: 100 },
    step: {
        type: ControlType.Number,
        title: "Step",
        defaultValue: 1,
        min: 0.01,
        step: 0.01,
    },
    largeStep: {
        type: ControlType.Number,
        title: "Large Step",
        defaultValue: 0,
        min: 0,
        description: "PageUp / Shift+Arrow jump. 0 = a tenth of the range.",
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "%" },
    marks: {
        type: ControlType.Array,
        title: "Detents",
        control: {
            type: ControlType.Object,
            controls: {
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    defaultValue: 50,
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                },
            },
        },
        defaultValue: DEFAULT_MARKS,
    },
    icons: {
        type: ControlType.Enum,
        title: "Icons",
        options: ["Volume", "Brightness", "Minus / Plus", "None"],
        defaultValue: "Volume",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    customColors: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#1A1A1A",
        hidden: (p: any) => !p.customColors,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "#E2E2E2",
        hidden: (p: any) => !p.customColors,
    },
    thumbColor: {
        type: ControlType.Color,
        title: "Thumb",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => !p.customColors,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1A1A1A",
        hidden: (p: any) => !p.customColors,
    },
    thumbSize: {
        type: ControlType.Number,
        title: "Thumb Size",
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    trackHeight: {
        type: ControlType.Number,
        title: "Track Height",
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14 },
    } as any,
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    onChange: { type: ControlType.EventHandler },
    onCommit: { type: ControlType.EventHandler },
})
