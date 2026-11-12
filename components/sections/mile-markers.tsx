/**
 * Mile Markers — © 2026 H SHIFT WORKS
 * Free to use in your own and client projects. Do not resell or redistribute this component or its code.
 */
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


// Mile Markers — by H SHIFT WORKS (https://hshiftworks.com)
// A timeline or a list of steps. A line grows down the list as people read, and each marker lights up when the
// line reaches it.
// - Every step is plain HTML (an ordered list), so search engines and screen readers read all of it.
// - "Alternate" puts the steps on both sides of the line, and falls back to one side when the component is
//   narrower than 640px (a CSS container query, so nothing jumps on phones).
// - On the canvas, half of the steps are lit so you can style both states. Static renders and visitors who turn
//   off motion see every step lit.

type Layout = "left" | "alternate"
type Marker = "dot" | "number" | "ring"
type Tag = "h2" | "h3" | "h4" | "p"
type FontStyle = React.CSSProperties

interface Step {
    label?: string
    title: string
    text?: string
}

interface MileMarkersProps {
    steps: Step[]
    layout: Layout
    marker: Marker
    titleTag: Tag
    labelFont?: FontStyle
    titleFont?: FontStyle
    textFont?: FontStyle
    color: string
    muted: string
    accent: string
    track: string
    markerFill: string
    markerSize: number
    lineWidth: number
    gap: number
    rail: number
    focus: number
    dim: number
    once: boolean
    style?: React.CSSProperties
}

const FALLBACK_LABEL: FontStyle = { fontSize: 13, fontWeight: 500, lineHeight: 1.3, letterSpacing: "0.04em" }
const FALLBACK_TITLE: FontStyle = { fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em" }
const FALLBACK_TEXT: FontStyle = { fontSize: 16, fontWeight: 400, lineHeight: 1.55 }
const EASE = "cubic-bezier(.2,.7,.2,1)"

function hash(text: string) {
    let h = 5381
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
    return (h >>> 0).toString(36)
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 720
 */
export default function MileMarkers(props: MileMarkersProps) {
    const p = { ...DEFAULTS, ...props }
    const steps = p.steps?.length ? p.steps : DEFAULTS.steps
    const isStatic = useIsStaticRenderer()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const root = useRef<HTMLDivElement>(null)
    const fill = useRef<HTMLDivElement>(null)
    // How many steps are lit. Server HTML and static renders: all of them; canvas: half.
    const still = isStatic || onCanvas
    const [lit, setLit] = useState(still ? (onCanvas ? Math.ceil(steps.length / 2) : steps.length) : 0)
    const [live, setLive] = useState(false)

    // Class names come from the settings, so the server HTML and the browser agree.
    const id = "mm" + hash(JSON.stringify([p.layout, p.marker, p.markerSize, p.lineWidth, p.gap, p.rail, p.dim, p.color, p.muted, p.accent, p.track, p.markerFill]))

    useEffect(() => {
        if (still) return
        const el = root.current
        if (!el) return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            setLit(steps.length)
            if (fill.current) fill.current.style.transform = "scaleY(1)"
            return
        }
        setLive(true)
        let raf = 0
        let best = 0 // furthest progress so far (for "Once")
        // Marker centers in page coordinates, measured once and again only when the layout changes (resize,
        // fonts, content). Scrolling then only compares numbers: no layout reads per frame.
        let centers: number[] = []
        const measure = () => {
            const y = window.scrollY
            centers = Array.from(el.querySelectorAll<HTMLElement>(`.${id}-m`)).map((m) => {
                const r = m.getBoundingClientRect()
                return r.top + y + r.height / 2
            })
        }
        const update = () => {
            raf = 0
            if (!centers.length) return
            const anchor = window.scrollY + window.innerHeight * p.focus
            const top = centers[0]
            const bottom = centers[centers.length - 1]
            let progress = bottom > top ? (anchor - top) / (bottom - top) : anchor > top ? 1 : 0
            progress = Math.max(0, Math.min(1, progress))
            if (p.once) progress = best = Math.max(best, progress)
            let n = 0
            while (n < centers.length && centers[n] <= anchor + 1) n++
            if (p.once) n = Math.max(n, Math.round(progress * (centers.length - 1)) + (progress > 0 ? 1 : 0))
            // The line runs from the first marker to the last one.
            if (fill.current) fill.current.style.transform = `scaleY(${progress})`
            setLit((old) => (p.once ? Math.max(old, n) : n))
        }
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update)
        }
        const onLayout = () => {
            measure()
            onScroll()
        }
        measure()
        update()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onLayout)
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onLayout) : null
        ro?.observe(el)
        ro?.observe(document.body)
        document.fonts?.ready.then(onLayout).catch(() => {})
        return () => {
            cancelAnimationFrame(raf)
            ro?.disconnect()
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onLayout)
        }
    }, [still, id, p.focus, p.once, steps.length])

    const half = p.markerSize / 2
    const railCenter = p.rail / 2
    // CSS as raw text (React would escape it on the server). Only numbers and colors from the settings reach it.
    const css = [
        `.${id}{container-type:inline-size;position:relative}`,
        `.${id}-l{list-style:none;margin:0;padding:0;display:grid;row-gap:${p.gap}px}`,
        `.${id}-line{position:absolute;top:${half}px;bottom:0;width:${p.lineWidth}px;background:${p.track};pointer-events:none}`,
        `.${id}-fill{position:absolute;inset:0;background:${p.accent};transform-origin:top;transform:scaleY(${still || !live ? (lit >= steps.length ? 1 : lit / Math.max(1, steps.length)) : 0})}`,
        `.${id}-i{display:grid;grid-template-columns:${p.rail}px 1fr;column-gap:20px;align-items:start}`,
        `.${id}-m{grid-column:1;justify-self:center;width:${p.markerSize}px;height:${p.markerSize}px;border-radius:50%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;background:${p.markerFill};border:${Math.max(2, p.lineWidth)}px solid ${p.track};color:${p.muted};transition:background .35s ${EASE},border-color .35s ${EASE},color .35s ${EASE},transform .35s ${EASE}}`,
        `.${id}-c{grid-column:2;display:flex;flex-direction:column;gap:6px;min-width:0;transition:opacity .45s ${EASE}}`,
        `.${id}-i:not(.${id}-on) .${id}-c{opacity:${p.dim}}`,
        `.${id}-on .${id}-m{border-color:${p.accent};${p.marker === "ring" ? "" : `background:${p.accent};`}color:${p.markerFill};transform:scale(1.08)}`,
        `.${id}-line{left:${railCenter - p.lineWidth / 2}px}`,
        // Alternate: steps on both sides of a center line, from 640px wide.
        `@container (min-width: 640px){`,
        p.layout === "alternate"
            ? `.${id}-i{grid-template-columns:1fr ${p.rail}px 1fr}.${id}-m{grid-column:2}.${id}-i:nth-child(odd) .${id}-c{grid-column:1;grid-row:1;text-align:right;align-items:flex-end}.${id}-i:nth-child(even) .${id}-c{grid-column:3}`
            : "",
        `}`,
        p.layout === "alternate" ? `@container (min-width: 640px){.${id}-line{left:calc(50% - ${p.lineWidth / 2}px)}}` : "",
        `@media (prefers-reduced-motion: reduce){.${id}-m,.${id}-c{transition:none}}`,
    ].join("")

    const Title = p.titleTag as keyof JSX.IntrinsicElements
    const label: React.CSSProperties = { ...FALLBACK_LABEL, ...p.labelFont, color: p.muted, margin: 0 }
    const title: React.CSSProperties = { ...FALLBACK_TITLE, ...p.titleFont, color: p.color, margin: 0 }
    const text: React.CSSProperties = { ...FALLBACK_TEXT, ...p.textFont, color: p.muted, margin: 0 }
    const numberStyle: React.CSSProperties = { fontSize: Math.max(10, Math.round(p.markerSize * 0.36)), fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }

    return (
        <div ref={root} className={id} style={{ ...p.style }}>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <div className={`${id}-line`} aria-hidden="true" style={{ bottom: half }}>
                <div ref={fill} className={`${id}-fill`} />
            </div>
            <ol className={`${id}-l`}>
                {steps.map((s, i) => (
                    <li key={i} className={i < lit ? `${id}-i ${id}-on` : `${id}-i`}>
                        <div className={`${id}-m`} aria-hidden="true">
                            {p.marker === "number" && <span style={numberStyle}>{String(i + 1).padStart(2, "0")}</span>}
                        </div>
                        <div className={`${id}-c`}>
                            {s.label ? <p style={label}>{s.label}</p> : null}
                            <Title style={title}>{s.title}</Title>
                            {s.text ? <p style={text}>{s.text}</p> : null}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    )
}

MileMarkers.displayName = "Mile Markers"

const DEFAULTS: MileMarkersProps = {
    steps: [
        { label: "Week 1", title: "Listen", text: "A call to learn what you need, who it is for and what has to be ready by when." },
        { label: "Week 2", title: "Plan", text: "Pages, content and a schedule on one page, so everyone agrees before work starts." },
        { label: "Weeks 3–5", title: "Design and build", text: "The site takes shape in Framer. You see progress every week and comment on the real thing." },
        { label: "Week 6", title: "Launch", text: "Final checks on phones and laptops, then the site goes live on your domain." },
    ],
    layout: "left",
    marker: "dot",
    titleTag: "h3",
    color: "#141413",
    muted: "#6B6A66",
    accent: "#2454FF",
    track: "#DCDAD4",
    markerFill: "#FFFFFF",
    markerSize: 18,
    lineWidth: 2,
    gap: 40,
    rail: 40,
    focus: 0.6,
    dim: 0.4,
    once: false,
}

MileMarkers.defaultProps = DEFAULTS

addPropertyControls(MileMarkers, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", placeholder: "2024 or Week 1" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Step" },
                text: { type: ControlType.String, title: "Text", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.steps,
    },
    layout: { type: ControlType.Enum, title: "Layout", defaultValue: "left", options: ["left", "alternate"], optionTitles: ["Line on the left", "Alternate"], displaySegmentedControl: true, description: "Alternate turns into a line on the left when narrower than 640px." },
    marker: { type: ControlType.Enum, title: "Marker", defaultValue: "dot", options: ["dot", "ring", "number"], optionTitles: ["Dot", "Ring", "Number"], displaySegmentedControl: true },
    titleTag: { type: ControlType.Enum, title: "Title tag", defaultValue: "h3", options: ["h2", "h3", "h4", "p"], optionTitles: ["H2", "H3", "H4", "P"], displaySegmentedControl: true },
    labelFont: { type: ControlType.Font, title: "Label font", controls: "extended", defaultFontType: "monospace", defaultValue: { fontSize: "13px", letterSpacing: "0.04em", lineHeight: "1.3em" } },
    titleFont: { type: ControlType.Font, title: "Title font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "24px", variant: "Semibold", letterSpacing: "-0.02em", lineHeight: "1.2em" } },
    textFont: { type: ControlType.Font, title: "Text font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "16px", variant: "Regular", lineHeight: "1.55em" } },
    color: { type: ControlType.Color, title: "Title color", defaultValue: DEFAULTS.color },
    muted: { type: ControlType.Color, title: "Text color", defaultValue: DEFAULTS.muted },
    accent: { type: ControlType.Color, title: "Line color", defaultValue: DEFAULTS.accent, description: "The growing line and the lit markers." },
    track: { type: ControlType.Color, title: "Track color", defaultValue: DEFAULTS.track, description: "The line and markers before they light up." },
    markerFill: { type: ControlType.Color, title: "Marker inside", defaultValue: DEFAULTS.markerFill, description: "Usually your background color." },
    markerSize: { type: ControlType.Number, title: "Marker size", defaultValue: 18, min: 8, max: 48, step: 1, unit: "px" },
    lineWidth: { type: ControlType.Number, title: "Line width", defaultValue: 2, min: 1, max: 8, step: 1, unit: "px" },
    rail: { type: ControlType.Number, title: "Rail width", defaultValue: 40, min: 16, max: 120, step: 1, unit: "px", description: "The column the line sits in." },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 40, min: 0, max: 160, step: 2, unit: "px" },
    dim: { type: ControlType.Number, title: "Unlit text", defaultValue: 0.4, min: 0, max: 1, step: 0.05, description: "Opacity of steps the line has not reached. 1 keeps them as they are." },
    focus: { type: ControlType.Number, title: "Reading line", defaultValue: 0.6, min: 0.2, max: 0.9, step: 0.05, description: "Where on the screen the line lights a step: 0.6 = 60% down." },
    once: { type: ControlType.Boolean, title: "Once", defaultValue: false, description: "On: steps stay lit when people scroll back up." },
})
