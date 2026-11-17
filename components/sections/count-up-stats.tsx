/**
 * Count-Up Stats
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas and set its width to Fill (or a max width).
 * 3. Edit stats, timing, size and colors in the property panel.
 * 4. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * A row of colour-band blocks, each with a huge number, a small superscript unit and a two-line label.
 * When the row scrolls into view each number counts up from 0 with an ease-out curve and
 * a small stagger. Two columns on tablet, one on phone.
 * Static render and reduced motion show the final numbers; the live page starts at 0, so there is no flash.
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


type Stat = { value: number; prefix: string; suffix: string; decimals: number; label: string }

interface CountUpStatsProps {
    items: Stat[]
    duration: number
    stagger: number
    replay: boolean
    numberSize: number
    padding: number
    radius: number
    weight: number
    colors: string[]
    textColor: string
    muted: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Stat[] = [
    { value: 12, prefix: "", suffix: "K+", decimals: 0, label: "Teams using\nAcme every day" },
    { value: 99.9, prefix: "", suffix: "%", decimals: 1, label: "Uptime over\nthe last year" },
    { value: 4.9, prefix: "", suffix: "/5", decimals: 1, label: "Average rating\nfrom customers" },
    { value: 3, prefix: "", suffix: "x", decimals: 0, label: "Faster launches\nafter switching" },
]

const DEFAULT_COLORS = ["#FFD35C", "#C8B8B2", "#F9C2F2", "#86A3E0", "#55683F"]

function easeOutExpo(t: number): number {
    if (t >= 1) return 1
    return 1 - Math.pow(2, -10 * t)
}

function format(value: number, decimals: number): string {
    const d = Math.max(0, Math.min(6, Math.round(decimals || 0)))
    // shortcut: fixed en-US separators so server and client render the same string; add a locale prop if needed.
    return value.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 */
export default function CountUpStats(props: CountUpStatsProps) {
    const {
        items: rawItems = DEFAULT_ITEMS,
        duration = 2,
        stagger = 0.15,
        replay = false,
        numberSize = 120,
        padding = 28,
        radius = 24,
        weight = 800,
        colors: rawColors = DEFAULT_COLORS,
        textColor = "#0E0E0E",
        muted = "rgba(14, 14, 14, 0.55)",
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const items = rawItems.length ? rawItems : DEFAULT_ITEMS
    const colors = rawColors.length ? rawColors : DEFAULT_COLORS
    const rootRef = React.useRef<HTMLDivElement>(null)
    // null = show final values. The static render shows them; the live page (server HTML included) starts at 0
    // so hydration never swaps final numbers for zeros. Reduced motion switches back to null below.
    const [progress, setProgress] = React.useState<number[] | null>(() => {
        if (isStatic) return null
        return new Array(items.length).fill(0)
    })
    // Shared size so every block's number fits its column: rough em width of the longest final string.
    let widest = 1
    for (const item of items) {
        let em = 0.1 + (item.suffix || "").length * 0.22
        for (const ch of `${item.prefix || ""}${format(Number(item.value) || 0, item.decimals)}`) {
            if (ch === "," || ch === ".") em += 0.28
            else em += 0.58
        }
        widest = Math.max(widest, em)
    }
    const numberFont = `min(${numberSize}px, calc(100cqw / ${widest.toFixed(2)}))`

    React.useEffect(() => {
        if (isStatic) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setProgress(null)
            return
        }
        const node = rootRef.current
        if (!node) return
        const count = items.length
        const zeros = () => new Array(count).fill(0)
        let frame = 0
        let played = false
        setProgress(zeros())

        const run = () => {
            const start = performance.now()
            const tick = (now: number) => {
                const t = (now - start) / 1000
                const next: number[] = []
                for (let i = 0; i < count; i++) {
                    const local = Math.min(1, Math.max(0, (t - i * stagger) / Math.max(0.01, duration)))
                    next.push(easeOutExpo(local))
                }
                setProgress(next)
                if (next.every((p) => p >= 1)) return
                frame = requestAnimationFrame(tick)
            }
            frame = requestAnimationFrame(tick)
        }

        const io = new IntersectionObserver(
            (entries) => {
                const inView = entries.some((e) => e.isIntersecting)
                if (inView) {
                    if (played) return
                    played = true
                    run()
                    if (!replay) io.disconnect()
                    return
                }
                if (!replay || !played) return
                cancelAnimationFrame(frame)
                played = false
                setProgress(zeros())
            },
            { threshold: 0.3 }
        )
        io.observe(node)
        return () => {
            cancelAnimationFrame(frame)
            io.disconnect()
        }
    }, [isStatic, items.length, duration, stagger, replay])

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                ...font,
                width: "100%",
                ...({ containerType: "inline-size" } as any),
                color: textColor,
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .cus-grid { grid-template-columns: repeat(var(--cus-cols), minmax(0, 1fr)); }
                @container (max-width: 860px) { .cus-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @container (max-width: 520px) { .cus-grid { grid-template-columns: minmax(0, 1fr); } }
            `}</style>
            <dl
                className="cus-grid"
                style={{ ["--cus-cols" as any]: items.length, display: "grid", margin: 0, padding: 0, overflow: "hidden", borderRadius: radius }}
            >
                {items.map((item, i) => {
                    const value = Number(item.value) || 0
                    let shown = value
                    if (progress !== null && i < progress.length) shown = value * progress[i]
                    const finalText = `${item.prefix || ""}${format(value, item.decimals)}${item.suffix || ""}`
                    return (
                        <div
                            key={i}
                            style={{
                                position: "relative",
                                display: "flex",
                                flexDirection: "column-reverse",
                                justifyContent: "flex-end",
                                gap: 14,
                                padding,
                                background: colors[i % colors.length],
                                minWidth: 0,
                                ...({ containerType: "inline-size" } as any),
                            }}
                        >
                            <dt
                                style={{
                                    margin: 0,
                                    paddingTop: 12,
                                    borderTop: `1px solid ${muted}`,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    lineHeight: 1.3,
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {item.label}
                            </dt>
                            <dd
                                style={{
                                    margin: 0,
                                    display: "flex",
                                    alignItems: "flex-start",
                                    fontSize: numberFont,
                                    fontWeight: weight,
                                    lineHeight: 0.95,
                                    letterSpacing: "-0.04em",
                                    fontVariantNumeric: "tabular-nums",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <span aria-hidden="true">
                                    {item.prefix}
                                    {format(shown, item.decimals)}
                                </span>
                                {item.suffix ? (
                                    <span aria-hidden="true" style={{ fontSize: "0.3em", letterSpacing: 0, marginLeft: "0.12em", marginTop: "0.08em" }}>
                                        {item.suffix}
                                    </span>
                                ) : null}
                                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                                    {finalText}
                                </span>
                            </dd>
                        </div>
                    )
                })}
            </dl>
        </div>
    )
}

addPropertyControls(CountUpStats, {
    items: {
        type: ControlType.Array,
        title: "Stats",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                value: { type: ControlType.Number, title: "Value", defaultValue: 100, step: 0.1, displayStepper: true },
                prefix: { type: ControlType.String, title: "Prefix", defaultValue: "", description: "Shown before the number, e.g. $" },
                suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", description: "Shown after the number, e.g. %, +, M" },
                decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 6, step: 1, displayStepper: true },
                label: { type: ControlType.String, title: "Label", defaultValue: "Label", displayTextArea: true, description: "Two short lines read best." },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 2, min: 0.2, max: 6, step: 0.1, unit: "s" },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.15, min: 0, max: 1, step: 0.05, unit: "s", description: "Delay between stats." },
    replay: {
        type: ControlType.Boolean,
        title: "Count",
        enabledTitle: "Replay",
        disabledTitle: "Once",
        defaultValue: false,
        description: "Replay counts again every time the row scrolls back into view.",
    },
    numberSize: { type: ControlType.Number, title: "Number Size", defaultValue: 120, min: 16, max: 240, step: 1, description: "Maximum size. Shrinks so the longest number fits its block." },
    weight: { type: ControlType.Number, title: "Weight", defaultValue: 800, min: 100, max: 900, step: 100, description: "Number weight, applied on top of the Font." },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 28, min: 0, max: 80 },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 40 },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_COLORS,
        description: "Block colours, used in order and repeated.",
    },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#0E0E0E" },
    muted: { type: ControlType.Color, title: "Divider", defaultValue: "rgba(14, 14, 14, 0.55)" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
})
