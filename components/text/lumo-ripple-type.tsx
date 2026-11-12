/**
 * WaveText — Framer code component (Hero Kit)
 *
 * A headline whose letters ride a sine wave: letter `i` is lifted by
 * `sin(2π·(t·speed + i/wavelength))·amplitude` px (and optionally rotated in
 * proportion). The pointer raises the amplitude of the letters within
 * `pointerRadius` px of it, up to `1 + pointerBoost` times, with a short lerp
 * so the lift fades in and out. DOM and CSS only, no WebGL.
 *
 * Each letter is an `aria-hidden` span; the full text is rendered once for
 * screen readers. Per frame it writes one transform per letter plus `--hk-t`
 * (seconds) on the root; the pointer lives in `--hk-x`. The clock is a
 * `setTimeout` chain (no rAF). Sizes itself (any × auto). Static (canvas,
 * thumbnail, reduced motion): letters at rest, no timer, no pointer.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
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

import { clamp01, formatNumber, useMotionMode } from "./HeroKit.tsx"

export type WaveParams = {
    amplitude?: number
    wavelength?: number
    speed?: number
}

/** Vertical offset (px) of letter `i` at time `t` (seconds): a sine that repeats every `wavelength` letters. */
export function waveOffset(i: number, t: number, params: WaveParams) {
    const { amplitude = 12, wavelength = 8, speed = 1 } = params
    const wl = Math.max(1, wavelength)
    return Math.sin(2 * Math.PI * (t * speed + i / wl)) * amplitude
}

type Props = {
    text?: string
    amplitude?: number
    wavelength?: number
    speed?: number
    rotate?: number
    pointerRadius?: number
    pointerBoost?: number
    font?: React.CSSProperties
    color?: string
    background?: string
    align?: "left" | "center"
    style?: React.CSSProperties
}

const TICK_MS = 16
const LERP = 0.2

export default function WaveText(props: Props) {
    const {
        text = "Make waves",
        amplitude = 12,
        wavelength = 8,
        speed = 1,
        rotate = 0,
        pointerRadius = 120,
        pointerBoost = 2,
        font,
        color = "#FFFFFF",
        background = "#0B0B0F",
        align = "center",
        style,
    } = props

    const mode = useMotionMode()
    const animated = mode === "animated"
    const rootRef = React.useRef<HTMLDivElement>(null)
    const centersRef = React.useRef<Array<{ x: number; y: number }> | null>(
        null
    )
    const boostRef = React.useRef<number[]>([])
    const pointerRef = React.useRef<{ x: number; y: number } | null>(null)

    const words = React.useMemo(
        () =>
            text
                .split(/\s+/)
                .filter(Boolean)
                .map((w) => [...w]),
        [text]
    )

    const params = React.useMemo<WaveParams>(
        () => ({ amplitude, wavelength, speed }),
        [amplitude, wavelength, speed]
    )

    const draw = React.useCallback(
        (t: number) => {
            const root = rootRef.current
            if (!root) return
            const letters =
                root.querySelectorAll<HTMLElement>("[data-hk=letter]")
            const boosts = boostRef.current
            const p = pointerRef.current
            const r = Math.max(1, pointerRadius)
            if (p && !centersRef.current) {
                centersRef.current = [...letters].map((el) => {
                    const rect = el.getBoundingClientRect()
                    return {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                    }
                })
            }
            const centers = centersRef.current
            for (let i = 0; i < letters.length; i++) {
                let target = 1
                if (p && centers && centers[i]) {
                    const d = Math.hypot(centers[i].x - p.x, centers[i].y - p.y)
                    if (d < r) target = 1 + pointerBoost * (1 - d / r)
                }
                const b = (boosts[i] ?? 1) + (target - (boosts[i] ?? 1)) * LERP
                boosts[i] = b
                const y = waveOffset(i, t, params) * b
                letters[i].style.transform = rotate
                    ? `translateY(${formatNumber(y, 2)}px) rotate(${formatNumber((y / Math.max(0.001, amplitude)) * rotate, 2)}deg)`
                    : `translateY(${formatNumber(y, 2)}px)`
            }
            root.style.setProperty("--hk-t", formatNumber(t, 3))
        },
        [params, rotate, amplitude, pointerRadius, pointerBoost]
    )

    // Clock (animated only): a setTimeout chain; one frame at t = 0 at once.
    React.useEffect(() => {
        if (!animated) return
        const start = Date.now()
        let timer = 0
        const tick = () => {
            draw((Date.now() - start) / 1000)
            timer = window.setTimeout(tick, TICK_MS)
        }
        draw(0)
        timer = window.setTimeout(tick, TICK_MS)
        return () => window.clearTimeout(timer)
    }, [animated, draw])

    // Pointer (animated only): --hk-x on the root; the lift itself is applied by the clock.
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || !animated) return
        const onMove = (e: PointerEvent) => {
            pointerRef.current = { x: e.clientX, y: e.clientY }
            const rect = root.getBoundingClientRect()
            root.style.setProperty(
                "--hk-x",
                formatNumber(
                    clamp01((e.clientX - rect.left) / Math.max(1, rect.width)),
                    4
                )
            )
        }
        const onLeave = () => {
            pointerRef.current = null
        }
        root.addEventListener("pointermove", onMove, { passive: true })
        root.addEventListener("pointerleave", onLeave, { passive: true })
        return () => {
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
        }
    }, [animated])

    // Letter positions are measured lazily and forgotten on resize or text change.
    React.useEffect(() => {
        centersRef.current = null
        boostRef.current = []
        if (typeof ResizeObserver === "undefined" || !rootRef.current) return
        const ro = new ResizeObserver(() => {
            centersRef.current = null
        })
        ro.observe(rootRef.current)
        return () => ro.disconnect()
    }, [text])

    let index = 0
    return (
        <div
            ref={rootRef}
            data-hk="stage"
            data-hk-mode={mode}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                padding: "clamp(32px, 8vh, 96px) clamp(20px, 6vw, 96px)",
                boxSizing: "border-box",
                background,
                color,
                textAlign: align,
                overflow: "hidden",
            }}
        >
            <span
                data-hk="sr"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    margin: -1,
                    padding: 0,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {text}
            </span>
            <div
                aria-hidden="true"
                style={{
                    fontSize: "clamp(40px, 9vw, 160px)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    fontWeight: 700,
                    ...font,
                }}
            >
                {words.map((letters, wi) => (
                    <React.Fragment key={wi}>
                        <span
                            data-hk="word"
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {letters.map((ch, li) => (
                                <span
                                    key={li}
                                    data-hk="letter"
                                    aria-hidden="true"
                                    data-hk-i={index++}
                                    style={{
                                        display: "inline-block",
                                        willChange: animated
                                            ? "transform"
                                            : undefined,
                                    }}
                                >
                                    {ch}
                                </span>
                            ))}
                        </span>
                        {wi < words.length - 1 ? " " : null}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(WaveText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Make waves",
    },
    amplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    wavelength: {
        type: ControlType.Number,
        title: "Wavelength",
        defaultValue: 8,
        min: 1,
        max: 40,
        step: 1,
        unit: " letters",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 0.05,
        unit: " Hz",
    },
    rotate: {
        type: ControlType.Number,
        title: "Rotate",
        defaultValue: 0,
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
    },
    pointerRadius: {
        type: ControlType.Number,
        title: "Pointer radius",
        defaultValue: 120,
        min: 0,
        max: 600,
        step: 10,
        unit: "px",
    },
    pointerBoost: {
        type: ControlType.Number,
        title: "Pointer boost",
        defaultValue: 2,
        min: 0,
        max: 6,
        step: 0.25,
        unit: "×",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    color: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0F",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "center",
    },
})
