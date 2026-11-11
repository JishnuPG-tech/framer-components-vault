import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Count Up In View — by H SHIFT WORKS (https://hshiftworks.com)
// A number that counts from one value to another when it scrolls into view (or when the page loads).
// - The final value is in the HTML from the start, so search engines and screen readers read it.
// - The box is as wide as the final value from the start, so nothing around it shifts while it counts.
// - On the canvas, in static renders and with "Reduce motion" turned on, it shows the final value without moving.

const SR_ONLY: React.CSSProperties = {
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

const EASINGS: Record<Easing, (t: number) => number> = {
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    linear: (t) => t,
}

const SEPARATORS: Record<Separator, string> = { comma: ",", period: ".", space: " ", apostrophe: "’", none: "" }

function format(n: number, decimals: number, separator: Separator) {
    const sep = SEPARATORS[separator] ?? ","
    const dec = separator === "period" ? "," : "."
    const fixed = Math.abs(n).toFixed(decimals)
    const [whole, frac] = fixed.split(".")
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
    const sign = n < 0 && Number(fixed) !== 0 ? "−" : ""
    return sign + grouped + (frac ? dec + frac : "")
}

type Separator = "comma" | "period" | "space" | "apostrophe" | "none"
type Easing = "easeOut" | "easeInOut" | "linear"
type TextAlign = "left" | "center" | "right" | "justify" | "start" | "end"
type FontStyle = React.CSSProperties & { textAlign?: TextAlign }

interface CountUpProps {
    from: number
    to: number
    decimals: number
    separator: Separator
    prefix: string
    suffix: string
    trigger: "inView" | "load"
    duration: number
    delay: number
    easing: Easing
    replay: boolean
    font?: FontStyle
    color: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CountUp(props: CountUpProps) {
    const { from, to, decimals, separator, prefix, suffix, trigger, duration, delay, easing, replay, font, color, style } = props
    const ref = useRef<HTMLSpanElement>(null)
    const [shown, setShown] = useState<number | null>(null)
    // Static renders (and the canvas) show the final value: no animation frames, a stable result.
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const el = ref.current
        if (!el || isStatic || RenderTarget.current() === RenderTarget.canvas) return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

        const ease = EASINGS[easing] ?? EASINGS.easeOut
        let raf = 0
        let timer = 0
        const run = () => {
            cancelAnimationFrame(raf)
            clearTimeout(timer)
            setShown(from)
            timer = window.setTimeout(() => {
                const start = performance.now()
                const tick = (now: number) => {
                    const t = Math.min(1, (now - start) / Math.max(1, duration * 1000))
                    setShown(from + (to - from) * ease(t))
                    if (t < 1) raf = requestAnimationFrame(tick)
                    else setShown(null)
                }
                raf = requestAnimationFrame(tick)
            }, delay * 1000)
        }

        if (trigger === "load" || typeof IntersectionObserver === "undefined") {
            run()
            return () => {
                cancelAnimationFrame(raf)
                clearTimeout(timer)
            }
        }

        // Not on screen yet: show the start value now, so the final value doesn't flash first.
        const r = el.getBoundingClientRect()
        if (r.top > window.innerHeight || r.bottom < 0) setShown(from)
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    run()
                    if (!replay) io.disconnect()
                } else if (replay) {
                    cancelAnimationFrame(raf)
                    clearTimeout(timer)
                    setShown(from)
                }
            },
            { threshold: 0.5 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            cancelAnimationFrame(raf)
            clearTimeout(timer)
        }
    }, [from, to, trigger, duration, delay, easing, replay, isStatic])

    const finalText = `${prefix}${format(to, decimals, separator)}${suffix}`
    const shownText = shown === null ? finalText : `${prefix}${format(shown, decimals, separator)}${suffix}`
    const cell: React.CSSProperties = { gridArea: "1 / 1", textAlign: font?.textAlign ?? "inherit" }

    return (
        <span
            ref={ref}
            style={{
                ...style,
                ...font,
                color,
                display: "inline-grid",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                margin: 0,
            }}
        >
            {/* Holds the width of the final value, so the layout doesn't move while counting. */}
            <span aria-hidden="true" style={{ ...cell, visibility: "hidden" }}>
                {finalText}
            </span>
            <span aria-hidden="true" style={cell}>
                {shownText}
            </span>
            <span style={SR_ONLY}>{finalText}</span>
        </span>
    )
}

CountUp.displayName = "Count Up In View"

CountUp.defaultProps = {
    from: 0,
    to: 1280,
    decimals: 0,
    separator: "comma",
    prefix: "",
    suffix: "+",
    trigger: "inView",
    duration: 1.6,
    delay: 0,
    easing: "easeOut",
    replay: false,
    color: "#111111",
    font: { fontSize: 64, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: "1em" },
}

addPropertyControls(CountUp, {
    from: { type: ControlType.Number, title: "From", step: 1, displayStepper: true, defaultValue: 0 },
    to: { type: ControlType.Number, title: "To", step: 1, displayStepper: true, defaultValue: 1280 },
    decimals: { type: ControlType.Number, title: "Decimals", min: 0, max: 3, step: 1, displayStepper: true, defaultValue: 0 },
    separator: {
        type: ControlType.Enum,
        title: "Separator",
        options: ["comma", "period", "space", "apostrophe", "none"],
        optionTitles: ["1,000.5", "1.000,5", "1 000.5", "1’000.5", "1000.5"],
        defaultValue: "comma",
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "+" },
    trigger: {
        type: ControlType.Enum,
        title: "Start",
        options: ["inView", "load"],
        optionTitles: ["In view", "On load"],
        displaySegmentedControl: true,
        defaultValue: "inView",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
        hidden: (p: CountUpProps) => p.trigger === "load",
    },
    duration: { type: ControlType.Number, title: "Duration", min: 0.2, max: 10, step: 0.1, unit: "s", defaultValue: 1.6 },
    delay: { type: ControlType.Number, title: "Delay", min: 0, max: 5, step: 0.1, unit: "s", defaultValue: 0 },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "easeInOut", "linear"],
        optionTitles: ["Ease out", "Ease in-out", "Linear"],
        defaultValue: "easeOut",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "64px", variant: "Semibold", letterSpacing: "-0.04em", lineHeight: "1em" },
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#111111" },
})
