// Count Up by Plainware
// Counts to any figure written the way you would write it: "1,400+", "$2.5M", "98%", "4.9/5".
// Prefix, suffix, decimals and thousands separators are kept. The box is sized for the widest
// possible frame up front, so nothing around the number moves while it counts.

import { useEffect, useId, useMemo, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate } from "framer-motion"

type Easing = "easeOut" | "linear" | "spring"

interface CountUpProps {
    value: string
    from: number
    duration: number
    delay: number
    easing: Easing
    trigger: "inView" | "load"
    once: boolean
    font: CSSProperties
    color: string
    tabular: boolean
    alignment: "left" | "center" | "right"
    style?: CSSProperties
}

interface Figure {
    prefix: string
    suffix: string
    target: number
    decimals: number
    group: string
    point: string
}

const FIGURE = /^(\D*?)(\d(?:[\d.,]*\d)?)([\s\S]*)$/

function parseFigure(value: string): Figure | null {
    const m = value.match(FIGURE)
    if (!m) return null
    const prefix = m[1]
    const raw = m[2]
    const suffix = m[3]
    const commas = raw.split(",").length - 1
    const dots = raw.split(".").length - 1
    let group = ""
    let point = "."
    if (commas && dots) {
        if (raw.lastIndexOf(".") > raw.lastIndexOf(",")) group = ","
        else {
            group = "."
            point = ","
        }
    } else if (commas) {
        if (commas === 1 && !/^\d{1,3},\d{3}$/.test(raw)) point = ","
        else group = ","
    } else if (dots > 1) {
        group = "."
    }
    const parts = raw.split(point)
    if (parts.length > 2) return null
    const int = group ? parts[0].split(group).join("") : parts[0]
    const frac = parts[1] || ""
    if (!/^\d+$/.test(int) || (frac && !/^\d+$/.test(frac))) return null
    const target = parseFloat(int + (frac ? "." + frac : ""))
    if (!isFinite(target)) return null
    return { prefix, suffix, target, decimals: frac.length, group, point }
}

function formatNumber(v: number, f: Figure): string {
    const fixed = Math.abs(v).toFixed(f.decimals)
    const [i, d] = fixed.split(".")
    const int = f.group ? i.replace(/\B(?=(\d{3})+(?!\d))/g, f.group) : i
    const sign = v < 0 && Number(fixed) !== 0 ? "-" : ""
    return sign + int + (d ? f.point + d : "")
}

function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
}

const srOnly: CSSProperties = {
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

/**
 * Count Up
 *
 * Counts up to a figure like 1,400+, $2.5M or 98% when it enters the view.
 * Keeps prefix, suffix, decimals and separators. No layout shift.
 *
 * @framerIntrinsicWidth 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PlainwareCountUp(props: CountUpProps) {
    const {
        value = "1,400+",
        from = 0,
        duration = 2,
        delay = 0,
        easing = "easeOut",
        trigger = "inView",
        once = true,
        font,
        color = "#111111",
        tabular = true,
        alignment = "left",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    // CSS-safe id (React escapes quotes in <style> text during SSR, so the selector must not need quotes).
    const id = "pw" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rootRef = useRef<HTMLDivElement | null>(null)
    const liveRef = useRef<HTMLSpanElement | null>(null)
    const figure = useMemo(() => parseFigure(value), [value])

    // Every width the counter can take: start and end value with each digit forced to 0–9.
    const ghosts = useMemo(() => {
        const out = new Set<string>([value])
        if (!figure) return Array.from(out)
        const shapes = [formatNumber(from, figure), formatNumber(figure.target, figure)]
        for (const s of shapes) {
            for (const d of "0123456789") out.add(figure.prefix + s.replace(/\d/g, d) + figure.suffix)
        }
        return Array.from(out)
    }, [value, from, figure])

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        const live = liveRef.current
        if (!root || !live) return
        if (!figure || prefersReducedMotion()) {
            live.textContent = value
            live.style.opacity = "1"
            return
        }
        const f = figure
        const startText = f.prefix + formatNumber(from, f) + f.suffix
        let alive = true
        let timer = 0
        let controls: { stop: () => void } | null = null
        let io: IntersectionObserver | null = null

        const stop = () => {
            window.clearTimeout(timer)
            if (controls) controls.stop()
            controls = null
        }

        const play = () => {
            stop()
            live.textContent = startText
            live.style.opacity = "1"
            timer = window.setTimeout(() => {
                if (!alive) return
                const options: any =
                    easing === "spring"
                        ? { type: "spring", duration, bounce: 0 }
                        : { duration, ease: easing === "linear" ? "linear" : [0, 0, 0.58, 1] }
                controls = animate(from, f.target, {
                    ...options,
                    onUpdate: (v: number) => {
                        live.textContent = f.prefix + formatNumber(v, f) + f.suffix
                    },
                    onComplete: () => {
                        live.textContent = value
                    },
                })
            }, Math.max(0, delay) * 1000)
        }

        if (trigger === "load" || typeof IntersectionObserver === "undefined") {
            play()
        } else {
            io = new IntersectionObserver((entries) => {
                const e = entries[entries.length - 1]
                if (e.isIntersecting) {
                    play()
                    if (once && io) {
                        io.disconnect()
                        io = null
                    }
                } else if (!once) {
                    stop()
                    live.textContent = startText
                }
            })
            io.observe(root)
        }

        return () => {
            alive = false
            stop()
            if (io) io.disconnect()
            live.textContent = value
        }
    }, [isStatic, value, from, duration, delay, easing, trigger, once, figure])

    const autoWidth = !(style && style.width === "100%")
    const cell: CSSProperties = { gridArea: "1 / 1", textAlign: alignment }

    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html: `[data-pw-ghost]::before{content:attr(data-pw-ghost)}${
                        isStatic
                            ? ""
                            : `@media (prefers-reduced-motion: no-preference){[data-pw-count=${id}] [data-pw-live]{opacity:0}}`
                    }`,
                }}
            />
            <div
                ref={rootRef}
                data-pw-count={id}
                style={{
                    ...style,
                    position: "relative",
                    display: "grid",
                    margin: 0,
                    color,
                    ...font,
                    textAlign: alignment,
                    whiteSpace: "pre",
                    fontVariantNumeric: tabular ? "tabular-nums" : "normal",
                    width: autoWidth ? "max-content" : style?.width,
                }}
            >
                <span style={srOnly}>{value}</span>
                {ghosts.map((g) => (
                    <span key={g} aria-hidden="true" data-pw-ghost={g} style={{ ...cell, visibility: "hidden" }} />
                ))}
                <span ref={liveRef} aria-hidden="true" data-pw-live="" style={cell}>
                    {value}
                </span>
            </div>
        </>
    )
}

PlainwareCountUp.displayName = "Count Up"

addPropertyControls(PlainwareCountUp, {
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "1,400+",
        placeholder: "$2.5M, 98%, 1,400+",
        description: "Write the figure as it should end. Prefix, suffix, decimals and separators are kept.",
    },
    from: {
        type: ControlType.Number,
        title: "Start From",
        defaultValue: 0,
        step: 1,
        displayStepper: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.05,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "linear", "spring"],
        optionTitles: ["Ease Out", "Linear", "Spring"],
        defaultValue: "easeOut",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["inView", "load"],
        optionTitles: ["In View", "On Load"],
        defaultValue: "inView",
        displaySegmentedControl: true,
    },
    once: {
        type: ControlType.Boolean,
        title: "Once",
        defaultValue: true,
        hidden: (props: Partial<CountUpProps>) => props.trigger === "load",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    tabular: {
        type: ControlType.Boolean,
        title: "Tabular",
        description: "Equal-width digits, so the number doesn’t wobble while counting.",
        defaultValue: true,
    },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
})
