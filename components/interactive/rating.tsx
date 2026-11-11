/**
 * Rating — Framer code component.
 * Ported from Arc (https://uiarc.dev/components/rating) by Elia Kuratli, MIT License.
 * Copyright (c) Elia Kuratli. The above copyright notice and the MIT permission notice shall be included in all copies.
 *
 * An accessible star rating built as a radio group. Hover or drag across the stars to preview, the fill sweeps left to
 * right from where the value was, and committing pops the stars in a short wave while the value word rolls in the
 * direction it moved. Half stars, clearing (pick the same value again, or Backspace) and number keys are supported.
 */
import * as React from "react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type {
    CSSProperties,
    KeyboardEvent,
    MouseEvent,
    PointerEvent,
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
    useTransform,
} from "framer-motion"
import type { Variants } from "framer-motion"

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
const P = "arc-rating-"
const cls = (...names: (string | false | undefined | null)[]) =>
    names
        .filter(Boolean)
        .map((name) => P + name)
        .join(" ")

const CSS = `.arc-rating-root{--background:oklch(100% 0 0);--surface:oklch(100% 0 0);--surface-raised:oklch(100% 0 0);--surface-muted:oklch(97.8% 0 0);--foreground:oklch(15% 0 0);--text-secondary:oklch(46% 0 0);--text-muted:oklch(59% 0 0);--border:oklch(93.5% 0 0);--border-subtle:oklch(96.5% 0 0);--border-strong:oklch(82% 0 0);--accent:oklch(33% 0 0);--accent-strong:oklch(24% 0 0);--accent-subtle:oklch(33% 0 0 / .1);--accent-foreground:oklch(100% 0 0);--control-on:oklch(23% 0 0);--control-glyph:oklch(100% 0 0);--control-track:oklch(89.5% 0 0);--control-track-hover:oklch(86% 0 0);--control-thumb:oklch(100% 0 0);--control-thumb-on:oklch(100% 0 0);--control-thumb-shadow:0 0 0 .5px oklch(0% 0 0 / .07), 0 1px 2px oklch(0% 0 0 / .14), 0 2px 6px oklch(0% 0 0 / .06);--control-fill:oklch(23% 0 0);--success:oklch(49% .19 150);--warning:oklch(58% .18 75);--danger:oklch(54% .21 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .035);--shadow-raised:0 6px 18px oklch(0% 0 0 / .065), 0 1px 3px oklch(0% 0 0 / .035);--shadow-floating:0 20px 48px oklch(0% 0 0 / .105), 0 3px 10px oklch(0% 0 0 / .045);--space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;--radius-control:1.125rem;--radius-panel:1.625rem;--radius-surface:2.125rem;--radius-pill:9999px;--control-height-sm:2.25rem;--control-height-md:2.75rem;--control-height-lg:3.125rem;--font-body:"Inter", "Inter Variable", system-ui, sans-serif;--text-xs:.75rem;--text-sm:.875rem;--text-base:1rem;--text-lg:1.125rem;--tracking-body:-.01em;--leading-body:1.4;--ease-enter:cubic-bezier(.16,1,.3,1);--ease-standard:cubic-bezier(.22,1,.36,1);--ease-exit:cubic-bezier(.7,0,.84,0);--ease-in-out:cubic-bezier(.65,0,.35,1);--ease-spring:linear(0, 0.0213, 0.0739, 0.1443, 0.2235, 0.305, 0.3849, 0.4606, 0.5305, 0.594, 0.6508, 0.7011, 0.7452, 0.7836, 0.8168, 0.8454, 0.8699, 0.8907, 0.9084, 0.9234, 0.9361, 0.9467, 0.9557, 0.9632, 0.9694, 0.9747, 0.979, 0.9826, 0.9857, 0.9882, 0.9902, 0.992, 0.9934, 0.9946, 0.9955, 0.9963, 1);--duration-instant:120ms;--duration-fast:160ms;--duration-standard:240ms;--duration-considered:480ms;--duration-spring:580ms;--focus-ring:transparent;--font-display:"Geist", "Geist Variable", "Inter", system-ui, sans-serif;--tracking-display:-.03em;--text-xl:1.375rem;--text-2xl:1.75rem;--text-3xl:2.25rem;--leading-display:1.1;color-scheme:light;}
.arc-rating-root[data-theme="dark"]{color-scheme:dark;--background:oklch(19% 0 0);--surface:oklch(21.5% 0 0);--surface-raised:oklch(24% 0 0);--surface-muted:oklch(26% 0 0);--foreground:oklch(96% 0 0);--text-secondary:oklch(77% 0 0);--text-muted:oklch(64% 0 0);--border:oklch(29% 0 0);--border-subtle:oklch(25% 0 0);--border-strong:oklch(40% 0 0);--accent:oklch(80% 0 0);--accent-strong:oklch(91% 0 0);--accent-subtle:oklch(80% 0 0 / .13);--accent-foreground:oklch(19% 0 0);--control-on:oklch(93% 0 0);--control-glyph:oklch(19% 0 0);--control-track:oklch(33% 0 0);--control-track-hover:oklch(37% 0 0);--control-thumb:oklch(97% 0 0);--control-thumb-on:oklch(19% 0 0);--control-fill:oklch(62% 0 0);--control-thumb-shadow:0 0 0 .5px oklch(0% 0 0 / .3), 0 1px 2px oklch(0% 0 0 / .35), 0 2px 6px oklch(0% 0 0 / .2);--success:oklch(78% .18 150);--warning:oklch(83% .17 80);--danger:oklch(76% .2 25);--shadow-resting:0 1px 2px oklch(0% 0 0 / .18);--shadow-raised:0 8px 22px oklch(0% 0 0 / .22);--shadow-floating:0 22px 55px oklch(0% 0 0 / .34);}
.arc-rating-root :focus:not(:focus-visible){outline:none}.arc-rating-root :focus-visible{outline:var(--focus-outline-width, 2px) solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent));outline-offset:var(--focus-outline-offset, 2px)}.arc-rating-root:focus-visible{outline:var(--focus-outline-width, 2px) solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent));outline-offset:var(--focus-outline-offset, 2px)}.arc-rating-root, .arc-rating-root *, .arc-rating-root *::before, .arc-rating-root *::after{box-sizing:border-box}
.arc-rating-field { display: grid; justify-items: start; gap: 6px; min-width: 0; }
.arc-rating-label { color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); letter-spacing: var(--tracking-body); }
.arc-rating-row { display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; row-gap: 2px; max-width: 100%; }
.arc-rating-stars { --cell: 36px; --glyph: 24px; display: inline-flex; gap: 2px; margin-inline: calc((var(--glyph) - var(--cell)) / 2); touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.arc-rating-sm .arc-rating-stars { --cell: 28px; --glyph: 18px; }
.arc-rating-lg .arc-rating-stars { --cell: 44px; --glyph: 30px; }
.arc-rating-cell { position: relative; display: grid; width: var(--cell); height: var(--cell); flex: none; place-items: center; border-radius: calc(var(--radius-control) - 6px); }
.arc-rating-hit { position: absolute; inset: 0; margin: 0; border: 0; border-radius: inherit; padding: 0; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.arc-rating-hit:focus-visible { outline: none; }
.arc-rating-half { z-index: 1; inset-inline-end: 50%; border-start-end-radius: 0; border-end-end-radius: 0; }
.arc-rating-hit:disabled { cursor: default; }
.arc-rating-lift, .arc-rating-pop { display: grid; width: var(--glyph); height: var(--glyph); pointer-events: none; }
.arc-rating-base, .arc-rating-kept, .arc-rating-fill { display: grid; grid-area: 1 / 1; }
.arc-rating-base svg, .arc-rating-kept svg, .arc-rating-fill svg { width: var(--glyph); height: var(--glyph); }
.arc-rating-base svg { fill: transparent; stroke: var(--border-strong); transition: fill var(--duration-standard) var(--ease-standard), stroke var(--duration-standard) var(--ease-standard); }
.arc-rating-stars[data-rated] .arc-rating-base svg { fill: var(--border); stroke: var(--border); }
.arc-rating-kept { color: color-mix(in oklab, var(--warning) 30%, transparent); }
.arc-rating-fill { color: var(--warning); }
.arc-rating-kept svg, .arc-rating-fill svg { fill: currentColor; stroke: currentColor; }
.arc-rating-value { display: inline-grid; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); letter-spacing: var(--tracking-body); font-variant-numeric: tabular-nums; white-space: nowrap; transition: color var(--duration-fast) var(--ease-standard); }
.arc-rating-value[data-empty] { color: var(--text-muted); }
.arc-rating-value > * { grid-area: 1 / 1; }
.arc-rating-sizer { visibility: hidden; }
.arc-rating-description { color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); letter-spacing: var(--tracking-body); font-variant-numeric: tabular-nums; }
.arc-rating-roll { position: relative; display: block; }
.arc-rating-word { display: inline-block; white-space: pre; }
.arc-rating-srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.arc-rating-field[data-disabled] .arc-rating-stars, .arc-rating-field[data-disabled] .arc-rating-value { opacity: .5; }
@media (prefers-reduced-motion: reduce) { .arc-rating-base svg, .arc-rating-value { transition: none; } }
.arc-rating-cell:has(> .arc-rating-hit:focus-visible) { outline: 2px solid var(--focus-outline, color-mix(in oklab, var(--accent-strong) 72%, transparent)); outline-offset: -2px; }`

function StyleTag() {
    return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}

// ---------- icons (lucide, inlined) ----------
const Star = () => (
    <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
)

// ---------- logic (faithful to the original) ----------
const defaultWords = ["Poor", "Fair", "Good", "Great", "Excellent"] as const
/** spring.snappy in physical terms. Time-defined springs drop initial velocity, and a pop is nothing but velocity. */
const snappyRoot =
    (2 * Math.PI) / (motionTokens.spring.snappy.visualDuration * 1.2)
const popSpring = {
    type: "spring",
    stiffness: snappyRoot ** 2,
    damping: 2 * (1 - motionTokens.spring.snappy.bounce) * snappyRoot,
    mass: 1,
} as const
/** Scale per second handed to a resting star: it peaks near 1.18, then the spring settles it back to 1. */
const popVelocity = 9
/** Commits closer together than this pop only the chosen star, so held arrow keys stay calm. */
const waveGap = 260
const still = { duration: 0 } as const

/** Changed words roll in the direction the value moved; unchanged words stay put. */
const wordMotion: Variants = {
    enter: (direction: number) => ({
        opacity: 0,
        y: `${direction * 0.3}em`,
        filter: `blur(${motionTokens.blur.soft}px)`,
    }),
    center: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: motionTokens.duration.standard,
            ease: [...motionTokens.ease.enter] as any,
        },
    },
    exit: (direction: number) => ({
        opacity: 0,
        y: `${direction * -0.25}em`,
        filter: `blur(${motionTokens.blur.subtle}px)`,
        transition: {
            duration: motionTokens.duration.instant,
            ease: [...motionTokens.ease.standard] as any,
        },
    }),
}

function RollingText({
    text,
    direction,
    reduced,
}: {
    text: string
    direction: number
    reduced: boolean
}) {
    const words = text.split(/(\s+)/)
    return (
        <span className={cls("roll")}>
            <span className={cls("srOnly")}>{text}</span>
            <span aria-hidden="true">
                <AnimatePresence
                    mode="popLayout"
                    initial={false}
                    custom={direction}
                >
                    {words.map((word, index) => (
                        <motion.span
                            key={`${index}:${word}`}
                            className={cls("word")}
                            custom={direction}
                            variants={wordMotion}
                            initial={reduced ? false : "enter"}
                            animate="center"
                            exit={reduced ? undefined : "exit"}
                        >
                            {word}
                        </motion.span>
                    ))}
                </AnimatePresence>
            </span>
        </span>
    )
}

const clip = (fraction: number) =>
    `inset(0 ${Math.min(100, Math.max(0, (1 - fraction) * 100))}% 0 0)`

interface GlyphProps {
    fill: number
    kept: number
    delay: number
    soft: boolean
    pressed: boolean
    pop: { key: number; delay: number } | null
    reduced: boolean
}

/** One star in three layers: the empty outline, a faint mark of the committed value, and the live fill that sweeps left to right. */
function StarGlyph({
    fill,
    kept,
    delay,
    soft,
    pressed,
    pop,
    reduced,
}: GlyphProps) {
    const fillValue = useMotionValue(fill)
    const keptValue = useMotionValue(kept)
    const scale = useMotionValue(1)
    const fillClip = useTransform(fillValue, clip)
    const keptClip = useTransform(keptValue, clip)
    const targets = useRef<{
        fill: number
        kept: number
        pop: number | undefined
    }>({ fill, kept, pop: pop?.key })
    useEffect(() => {
        if (targets.current.fill === fill) return
        targets.current.fill = fill
        animate(
            fillValue,
            fill,
            reduced ? still : ({ ...motionTokens.spring.snappy, delay } as any)
        )
    }, [fill, delay, reduced, fillValue])
    useEffect(() => {
        if (targets.current.kept === kept) return
        targets.current.kept = kept
        animate(
            keptValue,
            kept,
            reduced ? still : (motionTokens.spring.smooth as any)
        )
    }, [kept, reduced, keptValue])
    const popKey = pop?.key
    const popDelay = pop?.delay ?? 0
    useEffect(() => {
        if (popKey === undefined || targets.current.pop === popKey) return
        targets.current.pop = popKey
        if (!reduced)
            animate(scale, 1, {
                ...popSpring,
                velocity: popVelocity,
                delay: popDelay,
            } as any)
    }, [popKey, popDelay, reduced, scale])
    return (
        <motion.span
            className={cls("lift")}
            initial={false}
            animate={{ scale: pressed && !reduced ? 0.86 : soft ? 0.9 : 1 }}
            transition={reduced ? still : (motionTokens.spring.snappy as any)}
            aria-hidden="true"
        >
            <motion.span className={cls("pop")} style={{ scale }}>
                <span className={cls("base")}>
                    <Star />
                </span>
                <motion.span
                    className={cls("kept")}
                    style={{ clipPath: keptClip }}
                >
                    <Star />
                </motion.span>
                <motion.span
                    className={cls("fill")}
                    style={{ clipPath: fillClip }}
                >
                    <Star />
                </motion.span>
            </motion.span>
        </motion.span>
    )
}

type Gesture = { start: number; last: number; scrub: boolean; touch: boolean }

interface Props {
    label: string
    showLabel: boolean
    defaultValue: number
    max: number
    allowHalf: boolean
    allowClear: boolean
    showValue: boolean
    valueLabels: string[]
    emptyLabel: string
    description: string
    size: "sm" | "md" | "lg"
    readOnly: boolean
    disabled: boolean
    theme: "Light" | "Dark"
    customColor: boolean
    starColor: string
    font?: CSSProperties
    onChange?: (value: number) => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Rating(props: Props) {
    const {
        label = "Rate your stay",
        showLabel = true,
        defaultValue = 4,
        max: maxProp = 5,
        allowHalf = false,
        allowClear = true,
        showValue = true,
        valueLabels: valueLabelsProp,
        emptyLabel = "Not rated",
        description = "",
        size = "md",
        readOnly = false,
        disabled = false,
        theme = "Light",
        customColor = false,
        starColor = "#F5A524",
        font,
        onChange,
        style,
    } = props
    const max = Math.max(1, Math.round(maxProp))
    const valueLabels =
        valueLabelsProp &&
        valueLabelsProp.filter((word) => word && word.trim()).length
            ? valueLabelsProp
            : undefined
    const generatedId = useId()
    const labelId = `${generatedId}-label`
    const descriptionId = `${generatedId}-description`
    const reduced = useReducedMotion() ?? false
    const step = allowHalf ? 0.5 : 1
    const normalize = (next: number) =>
        Math.max(0, Math.min(max, Math.round(next / step) * step))
    const [internalValue, setInternalValue] = useState(defaultValue)
    // Framer: follow the Value control on the canvas.
    useEffect(() => setInternalValue(defaultValue), [defaultValue])
    const [preview, setPreview] = useState<number | null>(null)
    const [pressed, setPressed] = useState<number | null>(null)
    const [pulse, setPulse] = useState<{
        key: number
        value: number
        wave: boolean
    } | null>(null)
    const [announcement, setAnnouncement] = useState("")
    const currentValue = normalize(internalValue)
    const displayValue = preview ?? currentValue
    // Remember where the shown value came from, so the fill sweeps away from it and the words roll the same way.
    const [sweep, setSweep] = useState({ from: displayValue, to: displayValue })
    if (sweep.to !== displayValue)
        setSweep({ from: sweep.to, to: displayValue })
    const direction = sweep.to >= sweep.from ? 1 : -1
    const cells = useRef<(HTMLSpanElement | null)[]>([])
    const radios = useRef<(HTMLButtonElement | null)[]>([])
    const group = useRef<HTMLDivElement>(null)
    const gesture = useRef<Gesture | null>(null)
    // After a pointer commit the hovered preview steps aside until the pointer reaches a different value.
    const heldAt = useRef<number | null>(null)
    const suppressClickUntil = useRef(0)
    const lastCommit = useRef(0)
    const interactive = !readOnly && !disabled

    const words: readonly string[] | undefined =
        valueLabels ?? (max === 5 && !allowHalf ? defaultWords : undefined)
    const wordFor = (next: number) =>
        Number.isInteger(next) ? words?.[next - 1] : undefined
    const textFor = (next: number) =>
        next <= 0 ? emptyLabel : (wordFor(next) ?? `${next} out of ${max}`)
    const spokenFor = (next: number) =>
        [wordFor(next), `${next} of ${max} stars`].filter(Boolean).join(", ")
    const steps = Array.from(
        { length: Math.round(max / step) },
        (_, index) => (index + 1) * step
    )

    /** `time` is the event's timeStamp, which shares performance.now()'s clock. */
    const commit = (
        next: number,
        time: number,
        { toggle = false, announce = true } = {}
    ) => {
        if (!interactive) return
        let chosen = normalize(next)
        if (toggle && allowClear && chosen === currentValue) chosen = 0
        if (!allowClear) chosen = Math.max(step, chosen)
        if (preview !== null) heldAt.current = preview
        setPreview(null)
        setPulse({
            key: time,
            value: chosen,
            wave: time - lastCommit.current > waveGap,
        })
        lastCommit.current = time
        if (announce)
            setAnnouncement(chosen === 0 ? "Rating cleared" : spokenFor(chosen))
        if (chosen === currentValue) return
        setInternalValue(chosen)
        onChange?.(chosen)
    }

    /** Maps a pointer position to a value; dragging past the first star clears when that is allowed. */
    const valueAt = (x: number) => {
        for (let index = 0; index < max; index += 1) {
            const rect = cells.current[index]?.getBoundingClientRect()
            if (!rect) continue
            if (index === 0 && x < rect.left - rect.width / 2)
                return allowClear ? 0 : step
            if (x <= rect.right + 1 || index === max - 1)
                return allowHalf && x < rect.left + rect.width / 2
                    ? index + 0.5
                    : index + 1
        }
        return currentValue
    }
    const starOf = (next: number) => (next > 0 ? Math.ceil(next) - 1 : null)

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (!interactive || event.button !== 0) return
        const at = valueAt(event.clientX)
        const touch = event.pointerType !== "mouse"
        gesture.current = { start: at, last: at, scrub: false, touch }
        // Touch keeps following the finger once it leaves the stars; a mouse keeps its hover path.
        if (touch) {
            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {
                /* capture is a nicety */
            }
            setPreview(at)
        }
        setPressed(starOf(at))
    }
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!interactive) return
        const at = valueAt(event.clientX)
        const active = gesture.current
        if (active) {
            if (at !== active.last) {
                active.last = at
                active.scrub = true
            }
            setPressed(starOf(at))
            if (active.touch || active.scrub) setPreview(at)
            return
        }
        if (event.pointerType !== "mouse") return
        if (heldAt.current === at) return
        heldAt.current = null
        setPreview(at)
    }
    const endGesture = (
        event: PointerEvent<HTMLDivElement>,
        cancelled = false
    ) => {
        const active = gesture.current
        gesture.current = null
        setPressed(null)
        if (!active) return
        if (!cancelled && (active.touch || active.scrub)) {
            const at = valueAt(event.clientX)
            // The browser may still send a click for this press; the pointer already made the choice.
            suppressClickUntil.current = event.timeStamp + 500
            commit(at, event.timeStamp, { toggle: !active.scrub })
            heldAt.current = active.touch ? null : at
            // A drag that began on another star leaves focus behind; keep it on the checked radio.
            if (active.scrub && group.current?.contains(document.activeElement))
                radios.current[
                    Math.max(0, Math.round(normalize(at) / step) - 1)
                ]?.focus({ preventScroll: true })
        }
        if (active.touch) setPreview(null)
    }
    const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
        if (gesture.current?.touch) return
        gesture.current = null
        heldAt.current = null
        setPressed(null)
        if (event.pointerType === "mouse") setPreview(null)
    }
    const onClick = (event: MouseEvent<HTMLButtonElement>, next: number) => {
        if (event.detail > 0 && event.timeStamp < suppressClickUntil.current)
            return
        commit(next, event.timeStamp, { toggle: true })
    }
    const onKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>,
        own: number
    ) => {
        const moves: Record<string, number> = {
            ArrowRight: currentValue + step,
            ArrowUp: currentValue + step,
            ArrowLeft: currentValue - step,
            ArrowDown: currentValue - step,
            Home: step,
            End: max,
        }
        let next: number | undefined = moves[event.key]
        let announce = false
        if (event.key === " " || event.key === "Enter") next = own
        if (
            (event.key === "Backspace" || event.key === "Delete") &&
            allowClear
        ) {
            next = 0
            announce = true
        }
        if (/^[1-9]$/.test(event.key) && Number(event.key) <= max)
            next = Number(event.key)
        if (next === undefined) return
        event.preventDefault()
        const chosen = next === 0 ? 0 : Math.max(step, Math.min(max, next))
        commit(chosen, event.timeStamp, { announce })
        radios.current[Math.max(0, Math.round(chosen / step) - 1)]?.focus()
    }

    const tabStop = currentValue > 0 ? currentValue : step
    const pulsing =
        pulse && pulse.value === currentValue && currentValue > 0 ? pulse : null
    const radio = (next: number, half: boolean) => (
        <button
            key={next}
            ref={(node) => {
                radios.current[Math.round(next / step) - 1] = node
            }}
            type="button"
            role="radio"
            className={cls("hit", half && "half")}
            aria-checked={currentValue === next}
            aria-label={spokenFor(next)}
            tabIndex={interactive && next === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={(event) => onClick(event, next)}
            onKeyDown={(event) => onKeyDown(event, next)}
        />
    )

    const vars: Record<string, string> = customColor
        ? { "--warning": starColor }
        : {}
    if (font?.fontFamily) vars["--font-body"] = String(font.fontFamily)

    return (
        <div
            className={cls("root", "field", size)}
            data-theme={theme === "Dark" ? "dark" : undefined}
            data-disabled={disabled || undefined}
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
            <span id={labelId} className={cls(showLabel ? "label" : "srOnly")}>
                {label}
            </span>
            <div className={cls("row")}>
                <div
                    ref={group}
                    className={cls("stars")}
                    role={readOnly ? "img" : "radiogroup"}
                    aria-labelledby={readOnly ? undefined : labelId}
                    aria-label={
                        readOnly
                            ? `${label}: ${currentValue > 0 ? `${currentValue} out of ${max}` : emptyLabel}`
                            : undefined
                    }
                    aria-describedby={
                        description && !readOnly ? descriptionId : undefined
                    }
                    aria-disabled={disabled || undefined}
                    data-rated={displayValue > 0 || undefined}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={(event) => endGesture(event)}
                    onPointerCancel={(event) => endGesture(event, true)}
                    onPointerLeave={onPointerLeave}
                >
                    {Array.from({ length: max }, (_, index) => {
                        const fill = Math.max(
                            0,
                            Math.min(1, displayValue - index)
                        )
                        const order =
                            sweep.to > sweep.from
                                ? index - Math.floor(sweep.from)
                                : Math.ceil(sweep.from) - 1 - index
                        const popping =
                            pulsing &&
                            index < Math.ceil(pulsing.value) &&
                            (pulsing.wave ||
                                index === Math.ceil(pulsing.value) - 1)
                        return (
                            <span
                                key={`${generatedId}-${index}`}
                                ref={(node) => {
                                    cells.current[index] = node
                                }}
                                className={cls("cell")}
                            >
                                <StarGlyph
                                    fill={fill}
                                    kept={Math.max(
                                        0,
                                        Math.min(1, currentValue - index)
                                    )}
                                    delay={
                                        Math.max(0, order) *
                                        motionTokens.stagger.item
                                    }
                                    soft={displayValue > 0 && fill === 0}
                                    pressed={pressed === index}
                                    pop={
                                        popping && pulsing
                                            ? {
                                                  key: pulsing.key,
                                                  delay: pulsing.wave
                                                      ? index *
                                                        motionTokens.stagger
                                                            .item
                                                      : 0,
                                              }
                                            : null
                                    }
                                    reduced={reduced}
                                />
                                {!readOnly &&
                                    allowHalf &&
                                    radio(index + 0.5, true)}
                                {!readOnly && radio(index + 1, false)}
                            </span>
                        )
                    })}
                </div>
                {showValue && (
                    <span
                        className={cls("value")}
                        aria-hidden="true"
                        data-empty={displayValue === 0 || undefined}
                    >
                        {[0, ...steps].map((next) => (
                            <span key={next} className={cls("sizer")}>
                                {textFor(next)}
                            </span>
                        ))}
                        <RollingText
                            text={textFor(displayValue)}
                            direction={direction}
                            reduced={reduced}
                        />
                    </span>
                )}
            </div>
            {description && (
                <span id={descriptionId} className={cls("description")}>
                    <RollingText
                        text={description}
                        direction={direction}
                        reduced={reduced}
                    />
                </span>
            )}
            {!readOnly && (
                <span className={cls("srOnly")} aria-live="polite">
                    {announcement}
                </span>
            )}
        </div>
    )
}

addPropertyControls(Rating, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Rate your stay",
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
    },
    defaultValue: {
        type: ControlType.Number,
        title: "Value",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 4,
        displayStepper: true,
    },
    max: {
        type: ControlType.Number,
        title: "Stars",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        displayStepper: true,
    },
    allowHalf: {
        type: ControlType.Boolean,
        title: "Half Stars",
        defaultValue: false,
    },
    allowClear: {
        type: ControlType.Boolean,
        title: "Allow Clear",
        defaultValue: true,
    },
    showValue: {
        type: ControlType.Boolean,
        title: "Show Value",
        defaultValue: true,
    },
    valueLabels: {
        type: ControlType.Array,
        title: "Value Words",
        control: { type: ControlType.String },
        defaultValue: ["Poor", "Fair", "Good", "Great", "Excellent"],
        maxCount: 10,
        hidden: (p: any) => !p.showValue,
        description:
            "One word per whole star. Leave empty to read “4 out of 5”.",
    },
    emptyLabel: {
        type: ControlType.String,
        title: "Empty Label",
        defaultValue: "Not rated",
        hidden: (p: any) => !p.showValue,
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "",
        placeholder: "Optional helper text",
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["sm", "md", "lg"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "md",
        displaySegmentedControl: true,
    },
    readOnly: {
        type: ControlType.Boolean,
        title: "Read Only",
        defaultValue: false,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    customColor: {
        type: ControlType.Boolean,
        title: "Custom Color",
        defaultValue: false,
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#F5A524",
        hidden: (p: any) => !p.customColor,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14 },
    } as any,
    onChange: { type: ControlType.EventHandler },
})
