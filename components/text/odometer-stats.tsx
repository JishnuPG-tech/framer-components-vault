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


/**
 * Odometer Stats - by Pixlify (free)
 * Numbers that roll into place like a mechanical counter when scrolled into view.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

interface Stat { value: number; decimals: number; prefix: string; suffix: string; label: string }
interface Props {
    stats: Stat[]
    numberFont: React.CSSProperties
    labelFont: React.CSSProperties
    colors: { number: string; affix: string; label: string; divider: string }
    layout: { columns: number; gap: number; align: "left" | "center" | "right"; dividers: boolean; separator: string; labelGap: number; autoFit: boolean; labels: boolean }
    reel: { style: "off" | "visible"; intensity: number; depth: number }
    animation: { duration: number; stagger: number; spins: number; once: boolean; trigger: "view" | "load" }
    mobile: { breakpoint: number; columns: number }
    style?: React.CSSProperties
}

const DEF_COL = { number: "#F2F1EC", affix: "#C8FF3D", label: "#8C8C92", divider: "rgba(255,255,255,0.12)" }
const DEF_LAY = { columns: 4, gap: 32, align: "left" as const, dividers: true, separator: ",", labelGap: 12, autoFit: true, labels: true }
const DEF_REEL = { style: "off" as const, intensity: 0.45, depth: 1 }
const DEF_ANI = { duration: 1.8, stagger: 0.12, spins: 1, once: true, trigger: "view" as const }
const DEF_MOB = { breakpoint: 640, columns: 2 }

function useReducedMotion() {
    const [r, set] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => set(mq.matches)
        on()
        mq.addEventListener?.("change", on)
        return () => mq.removeEventListener?.("change", on)
    }, [])
    return r
}

function format(v: number, decimals: number, sep: string) {
    const fixed = Math.abs(v).toFixed(Math.max(0, decimals))
    const [int, dec] = fixed.split(".")
    const grouped = sep ? int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : int
    return (v < 0 ? "-" : "") + grouped + (dec ? "." + dec : "")
}

const DIGITS = "0123456789"

interface Reel { on: boolean; depth: number; intensity: number }

function reelMask(depth: number, intensity: number) {
    // Window is (1 + 2 * depth) rows tall; the middle row is the live digit.
    const cell = 100 / (1 + 2 * depth)
    const c0 = depth * cell
    const c1 = c0 + cell
    const a = Math.max(0, Math.min(1, intensity))
    const g = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,${a}) ${(c0 - cell * 0.3).toFixed(2)}%, #000 ${(c0 + cell * 0.18).toFixed(2)}%, #000 ${(c1 - cell * 0.18).toFixed(2)}%, rgba(0,0,0,${a}) ${(c1 + cell * 0.3).toFixed(2)}%, rgba(0,0,0,0) 100%)`
    return { WebkitMaskImage: g, maskImage: g }
}

function Digit({ d, on, delay, duration, spins, instant, reel }: { d: number; on: boolean; delay: number; duration: number; spins: number; instant: boolean; reel: Reel }) {
    const rows = 10 * (spins + 1)
    const target = on ? spins * 10 + d : 0
    // With Reel style on, extra rows above and below keep neighbours visible at both ends of the strip.
    const pad = reel.on ? reel.depth : 0
    const total = rows + pad * 2
    return (
        <span aria-hidden style={{ display: "inline-block", height: `${1 + pad * 2}em`, overflow: "hidden", lineHeight: 1, verticalAlign: "top", ...(pad ? reelMask(pad, reel.intensity) : {}) }}>
            <span
                style={{
                    display: "flex",
                    flexDirection: "column",
                    transform: `translate3d(0, ${(-target * 100) / total}%, 0)`,
                    transition: instant ? "none" : `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                    willChange: instant ? undefined : "transform",
                }}
            >
                {Array.from({ length: total }, (_, k) => (
                    <span key={k} style={{ height: "1em", lineHeight: 1, display: "block" }}>{DIGITS[(((k - pad) % 10) + 10) % 10]}</span>
                ))}
            </span>
        </span>
    )
}

export default function OdometerStats(props: Props) {
    const { stats = [], numberFont, labelFont, style } = props
    const colors = { ...DEF_COL, ...(props.colors || {}) }
    const lay = { ...DEF_LAY, ...(props.layout || {}) }
    const ani = { ...DEF_ANI, ...(props.animation || {}) }
    const mob = { ...DEF_MOB, ...(props.mobile || {}) }
    const reelCfg = { ...DEF_REEL, ...(props.reel || {}) }
    const reel: Reel = { on: reelCfg.style === "visible", depth: Math.max(1, Math.min(2, Math.round(reelCfg.depth || 1))), intensity: reelCfg.intensity ?? DEF_REEL.intensity }
    const padEm = reel.on ? `${reel.depth}em` : undefined
    const target = RenderTarget.current()
    const isStatic = target === RenderTarget.canvas || target === RenderTarget.export
    const reduced = useReducedMotion()
    const instant = isStatic || reduced

    const ref = React.useRef<HTMLDivElement>(null)
    const [on, setOn] = React.useState(instant)
    const [cols, setCols] = React.useState(lay.columns)
    const [fit, setFit] = React.useState(1)

    React.useEffect(() => {
        if (instant) { setOn(true); return }
        if (ani.trigger === "load") { const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true))); return () => cancelAnimationFrame(t) }
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") { setOn(true); return }
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setOn(true); if (ani.once) io.disconnect() }
            else if (!ani.once) setOn(false)
        }, { threshold: 0.35 })
        io.observe(el)
        return () => io.disconnect()
    }, [instant, ani.trigger, ani.once])

    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        let raf = 0
        const measure = () => {
            const base = el.clientWidth < mob.breakpoint ? mob.columns : lay.columns
            if (!lay.autoFit) { setCols(base); setFit(1); return }
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                // natural (unscaled) width of the widest number
                let need = 0
                el.querySelectorAll<HTMLElement>("[data-num]").forEach((num) => {
                    const w = num.scrollWidth / (Number(num.dataset.fit) || 1)
                    if (w > need) need = w
                })
                const W = el.clientWidth
                const total = Math.max(1, stats.length || 1)
                let c = Math.max(1, Math.min(base, total))
                let f = 1
                // drop columns until numbers can stay readable (>= 55% of the set size)
                for (; c >= 1; c--) {
                    const cell = c === 1 ? W : W / c - lay.gap
                    f = need <= 0 ? 1 : cell <= 0 ? 0 : Math.min(1, (cell * 0.97) / need)
                    if (f >= 0.55 || c === 1) break
                }
                setCols(Math.max(1, c))
                setFit(Math.max(0.1, Math.min(1, f)))
            })
        }
        const fonts = (document as any).fonts
        if (fonts && fonts.ready) fonts.ready.then(() => measure()).catch(() => {})
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => { ro.disconnect(); cancelAnimationFrame(raf) }
    }, [mob.breakpoint, mob.columns, lay.columns, lay.autoFit, lay.gap, stats])

    const justify = lay.align === "center" ? "center" : lay.align === "right" ? "flex-end" : "flex-start"
    const n = Math.max(1, Math.min(cols, stats.length || 1))

    return (
        <div ref={ref} style={{ width: "100%", display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, columnGap: lay.dividers ? 0 : lay.gap, rowGap: lay.gap * 1.25, fontFamily: "Inter, sans-serif", ...style }}>
            {stats.map((s, i) => {
                const str = format(Number(s.value) || 0, s.decimals || 0, lay.separator)
                let di = 0
                const firstInRow = i % n === 0
                return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: justify, textAlign: lay.align, paddingLeft: lay.dividers && !firstInRow ? lay.gap / 2 : 0, paddingRight: lay.dividers && (i + 1) % n !== 0 ? lay.gap / 2 : 0, borderLeft: lay.dividers && !firstInRow ? `1px solid ${colors.divider}` : "none", minWidth: 0 }}>
                        <div data-num data-fit={fit} style={{ position: "relative", display: "flex", alignItems: "flex-start", color: colors.number, fontSize: 64, fontWeight: 600, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", ...numberFont, ...(fit < 1 ? { fontSize: (parseFloat(String((numberFont as any)?.fontSize ?? 64)) || 64) * fit } : {}), lineHeight: 1 }}>
                            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{`${s.prefix || ""}${str}${s.suffix || ""} ${s.label || ""}`}</span>
                            {s.prefix ? <span aria-hidden style={{ color: colors.affix, paddingTop: padEm }}>{s.prefix}</span> : null}
                            {str.split("").map((ch, k) => {
                                if (ch >= "0" && ch <= "9") {
                                    const idx = di++
                                    return <Digit key={k} d={Number(ch)} on={on} delay={i * ani.stagger + idx * 0.04} duration={ani.duration} spins={Math.max(0, Math.round(ani.spins))} instant={instant} reel={reel} />
                                }
                                return <span key={k} aria-hidden style={{ display: "inline-block", paddingTop: padEm }}>{ch}</span>
                            })}
                            {s.suffix ? <span aria-hidden style={{ color: colors.affix, paddingTop: padEm }}>{s.suffix}</span> : null}
                        </div>
                        {s.label && lay.labels ? <div aria-hidden style={{ marginTop: lay.labelGap, color: colors.label, fontSize: 15, lineHeight: 1.4, ...labelFont }}>{s.label}</div> : null}
                    </div>
                )
            })}
        </div>
    )
}

OdometerStats.defaultProps = {
    stats: [
        { value: 120, decimals: 0, prefix: "", suffix: "+", label: "Websites launched" },
        { value: 98, decimals: 0, prefix: "", suffix: "%", label: "Client retention" },
        { value: 4.9, decimals: 1, prefix: "", suffix: "/5", label: "Average rating" },
        { value: 2.5, decimals: 1, prefix: "$", suffix: "M", label: "Revenue generated" },
    ],
    numberFont: {},
    labelFont: {},
    colors: DEF_COL,
    layout: DEF_LAY,
    animation: DEF_ANI,
    mobile: DEF_MOB,
    reel: DEF_REEL,
}

addPropertyControls(OdometerStats, {
    stats: {
        type: ControlType.Array,
        title: "Stats",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                value: { type: ControlType.Number, title: "Value", defaultValue: 100, displayStepper: false },
                decimals: { type: ControlType.Number, title: "Decimals", min: 0, max: 3, step: 1, displayStepper: true, defaultValue: 0 },
                prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
                suffix: { type: ControlType.String, title: "Suffix", defaultValue: "+" },
                label: { type: ControlType.String, title: "Label", defaultValue: "Label" },
            },
        },
        defaultValue: OdometerStats.defaultProps.stats,
    },
    numberFont: { type: ControlType.Font, title: "Number Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 64, fontWeight: 600, letterSpacing: "-0.04em" } } as any,
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 15, lineHeight: "1.4em" } } as any,
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            number: { type: ControlType.Color, title: "Number", defaultValue: DEF_COL.number },
            affix: { type: ControlType.Color, title: "Prefix/Suffix", defaultValue: DEF_COL.affix },
            label: { type: ControlType.Color, title: "Label", defaultValue: DEF_COL.label },
            divider: { type: ControlType.Color, title: "Divider", defaultValue: DEF_COL.divider },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            columns: { type: ControlType.Number, title: "Columns", min: 1, max: 6, step: 1, displayStepper: true, defaultValue: DEF_LAY.columns },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 120, unit: "px", defaultValue: DEF_LAY.gap },
            align: { type: ControlType.Enum, title: "Align", options: ["left", "center", "right"], optionTitles: ["Left", "Center", "Right"], displaySegmentedControl: true, defaultValue: "left" },
            dividers: { type: ControlType.Boolean, title: "Dividers", defaultValue: true },
            separator: { type: ControlType.Enum, title: "Thousands", options: [",", " ", ".", ""], optionTitles: ["1,000", "1 000", "1.000", "1000"], defaultValue: "," },
            labelGap: { type: ControlType.Number, title: "Label Gap", min: 0, max: 48, unit: "px", defaultValue: DEF_LAY.labelGap },
            autoFit: { type: ControlType.Boolean, title: "Auto Fit", defaultValue: true, description: "Shrinks numbers that would overflow their column." },
            labels: { type: ControlType.Boolean, title: "Labels", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: true, description: "Hidden labels are still read by screen readers." },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            trigger: { type: ControlType.Enum, title: "Trigger", options: ["view", "load"], optionTitles: ["In View", "On Load"], displaySegmentedControl: true, defaultValue: "view" },
            duration: { type: ControlType.Number, title: "Duration", min: 0.3, max: 5, step: 0.1, unit: "s", defaultValue: DEF_ANI.duration },
            stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.6, step: 0.02, unit: "s", defaultValue: DEF_ANI.stagger },
            spins: { type: ControlType.Number, title: "Extra Spins", min: 0, max: 4, step: 1, displayStepper: true, defaultValue: DEF_ANI.spins },
            once: { type: ControlType.Boolean, title: "Play Once", defaultValue: true },
        },
    },
    reel: {
        type: ControlType.Object,
        title: "Reel Style",
        controls: {
            style: { type: ControlType.Enum, title: "Style", options: ["off", "visible"], optionTitles: ["Off", "Visible"], displaySegmentedControl: true, defaultValue: "off", description: "Visible shows the digits above and below, faded out like a real counter drum." },
            intensity: { type: ControlType.Number, title: "Intensity", min: 0.05, max: 1, step: 0.05, defaultValue: DEF_REEL.intensity, hidden: (p: any) => p.style !== "visible" },
            depth: { type: ControlType.Number, title: "Rows", min: 1, max: 2, step: 1, displayStepper: true, defaultValue: DEF_REEL.depth, hidden: (p: any) => p.style !== "visible" },
        },
    },
    mobile: {
        type: ControlType.Object,
        title: "Mobile",
        controls: {
            breakpoint: { type: ControlType.Number, title: "Below", min: 320, max: 1200, unit: "px", defaultValue: DEF_MOB.breakpoint },
            columns: { type: ControlType.Number, title: "Columns", min: 1, max: 4, step: 1, displayStepper: true, defaultValue: DEF_MOB.columns },
        },
    },
})
