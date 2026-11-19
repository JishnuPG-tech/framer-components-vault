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

import { motion, useReducedMotion } from "framer-motion"

type Props = {
    heading: string
    description: string
    sliderLabel: string
    unitLabel: string
    minUnits: number
    maxUnits: number
    step: number
    initialUnits: number
    beforeRate: number
    afterRate: number
    beforeLabel: string
    afterLabel: string
    resultLabel: string
    resultUnit: string
    supportingText: string
    ctaLabel: string
    ctaLink: string
    background: string
    leftSurface: string
    leftText: string
    leftMuted: string
    trackColor: string
    accent: string
    resultStart: string
    resultEnd: string
    resultText: string
    radius: number
    panelPadding: number
    animationSpeed: number
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    numberFont?: React.CSSProperties
    style?: React.CSSProperties
}

const defaults: Props = {
    heading: "More space for what matters.",
    description: "A little less busywork can make a big difference. Move the slider to see the time you could get back.",
    sliderLabel: "Projects each month",
    unitLabel: "projects",
    minUnits: 1,
    maxUnits: 12,
    step: 1,
    initialUnits: 5,
    beforeRate: 18,
    afterRate: 7,
    beforeLabel: "Traditional process",
    afterLabel: "Smarter workflow",
    resultLabel: "TIME BACK IN YOUR MONTH",
    resultUnit: "hours saved",
    supportingText: "Your time is worth more than repetitive work.",
    ctaLabel: "Learn More",
    ctaLink: "",
    background: "#FFFFFF",
    leftSurface: "#F3F3F0",
    leftText: "#17201E",
    leftMuted: "#68716C",
    trackColor: "#D9DFD7",
    accent: "#FFB66B",
    resultStart: "#2B50F3",
    resultEnd: "#6948DA",
    resultText: "#FFFFFF",
    radius: 24,
    panelPadding: 36,
    animationSpeed: 0.55,
}

function finite(value: number, fallback: number) {
    return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

const tabular = { fontVariantNumeric: "tabular-nums" } as React.CSSProperties

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 440
 */
export default function SavingsCompareSlider(incoming: Partial<Props>) {
    const p = { ...defaults, ...incoming }
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const still = staticRenderer || Boolean(reducedMotion)
    const min = Math.max(0, Math.floor(finite(p.minUnits, 1)))
    const max = Math.max(min + 1, Math.floor(finite(p.maxUnits, 12)))
    const step = Math.max(1, Math.floor(finite(p.step, 1)))
    const initial = clamp(finite(p.initialUnits, 5), min, max)
    const [units, setUnits] = React.useState(initial)
    const [focused, setFocused] = React.useState(false)
    const rangeId = React.useId()

    React.useEffect(() => setUnits(initial), [initial])

    const n = clamp(units, min, max)
    const progress = max === min ? 0 : (n - min) / (max - min)
    const before = n * Math.max(0, finite(p.beforeRate, 18))
    const after = n * Math.max(0, finite(p.afterRate, 7))
    const saved = Math.max(0, before - after)
    const afterWidth = before <= 0 ? 0 : Math.min(100, (after / before) * 100)
    const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })
    const duration = still ? 0 : Math.max(0.15, finite(p.animationSpeed, 0.55))
    const hasLink = typeof p.ctaLink === "string" && p.ctaLink.trim().length > 0

    const titleFont: React.CSSProperties = {
        fontFamily: "Inter Display, Inter, sans-serif",
        fontWeight: 600,
        fontSize: "clamp(30px, 4.1vw, 52px)",
        letterSpacing: "-0.065em",
        lineHeight: 1.02,
        ...p.headingFont,
    }
    const bodyFont: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontWeight: 400,
        fontSize: 15,
        lineHeight: 1.55,
        ...p.bodyFont,
    }
    const numberFont: React.CSSProperties = {
        fontFamily: "Inter Display, Inter, sans-serif",
        fontWeight: 650,
        letterSpacing: "-0.092em",
        lineHeight: 0.94,
        ...tabular,
        ...p.numberFont,
    }
    const tiny: React.CSSProperties = {
        fontFamily: bodyFont.fontFamily,
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: "0.095em",
        textTransform: "uppercase",
        lineHeight: 1.3,
    }
    const pad = Math.max(18, finite(p.panelPadding, 36))
    const panelBase: React.CSSProperties = {
        padding: `clamp(22px, 3vw, ${pad}px)`,
        minWidth: 0,
        minHeight: 378,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
    }
    const bars = (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: "auto" }}>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, fontSize: 12, fontFamily: bodyFont.fontFamily, fontWeight: 500 }}>
                    <span>{p.beforeLabel}</span><span style={tabular}>{fmt.format(before)}h</span>
                </div>
                <div style={{ height: 9, borderRadius: 100, overflow: "hidden", background: "rgba(255,255,255,.20)" }}>
                    <motion.div initial={false} animate={{ width: "100%" }} transition={{ duration }} style={{ height: "100%", background: "rgba(255,255,255,.42)", borderRadius: 100 }} />
                </div>
            </div>
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, fontSize: 12, fontFamily: bodyFont.fontFamily, fontWeight: 500 }}>
                    <span>{p.afterLabel}</span><span style={tabular}>{fmt.format(after)}h</span>
                </div>
                <div style={{ height: 9, borderRadius: 100, overflow: "hidden", background: "rgba(255,255,255,.20)" }}>
                    <motion.div initial={false} animate={{ width: `${afterWidth}%` }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 190, damping: 30 }} style={{ height: "100%", background: p.accent, borderRadius: 100 }} />
                </div>
            </div>
        </div>
    )

    const resultContent = (
        <>
            <div style={{ position: "absolute", top: -56, right: -70, width: 250, height: 250, borderRadius: "50%", border: "1px solid rgba(255,255,255,.19)", boxShadow: "0 0 0 38px rgba(255,255,255,.035), 0 0 0 77px rgba(255,255,255,.025)", pointerEvents: "none" }} />
            <span style={{ ...tiny, position: "relative", zIndex: 1, opacity: 0.82 }}>{p.resultLabel}</span>
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginTop: 28, minWidth: 0 }}>
                <span style={{ ...numberFont, fontSize: "clamp(78px, 9vw, 124px)", display: "block", overflowWrap: "anywhere" }}>{fmt.format(saved)}</span>
                <span style={{ ...bodyFont, fontWeight: 500, fontSize: 16, opacity: 0.86, maxWidth: 106 }}>{p.resultUnit}</span>
            </div>
            <p style={{ ...bodyFont, position: "relative", zIndex: 1, margin: "18px 0 36px", opacity: 0.84, maxWidth: 320 }}>{p.supportingText}</p>
            {bars}
            {hasLink && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", color: "#1C2D65", borderRadius: 999, padding: "14px 18px", gap: 12, marginTop: 26, fontFamily: bodyFont.fontFamily, fontSize: 14, fontWeight: 650 }}>
                    <span>{p.ctaLabel || "Learn More"}</span>
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                </div>
            )}
        </>
    )

    const rightStyle: React.CSSProperties = {
        ...panelBase,
        background: `linear-gradient(139deg, ${p.resultStart} 0%, ${p.resultEnd} 100%)`,
        color: p.resultText,
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        textDecoration: "none",
        cursor: hasLink ? "pointer" : "default",
        outlineOffset: -5,
    }

    return (
        <div style={{ ...p.style, width: "100%", height: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", background: p.background, borderRadius: p.radius, overflow: "hidden", boxSizing: "border-box", WebkitFontSmoothing: "antialiased" }}>
            <section style={{ ...panelBase, background: p.leftSurface, color: p.leftText, gap: 0 }}>
                <h2 style={{ ...titleFont, margin: 0, maxWidth: 490 }}>{p.heading}</h2>
                <p style={{ ...bodyFont, margin: "20px 0 45px", color: p.leftMuted, maxWidth: 405 }}>{p.description}</p>
                <div style={{ marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                        <label htmlFor={rangeId} style={{ ...bodyFont, fontWeight: 600, fontSize: 13 }}>{p.sliderLabel}</label>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                            <span style={{ ...numberFont, fontSize: 41 }}>{fmt.format(n)}</span>
                            <span style={{ ...bodyFont, color: p.leftMuted, fontSize: 13 }}>{p.unitLabel}</span>
                        </div>
                    </div>
                    <div style={{ position: "relative", height: 40, display: "flex", alignItems: "center", borderRadius: 20, outline: focused ? `2px solid ${p.resultStart}` : "none", outlineOffset: 3 }}>
                        <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, height: 8, background: p.trackColor, borderRadius: 10 }} />
                        <div aria-hidden="true" style={{ position: "absolute", left: 0, width: `${progress * 100}%`, height: 8, background: p.resultStart, borderRadius: 10 }} />
                        <motion.div aria-hidden="true" initial={false} animate={{ left: `${progress * 100}%` }} transition={{ duration: still ? 0 : 0.13, ease: "easeOut" }} style={{ position: "absolute", transform: "translateX(-50%)", width: 30, height: 30, borderRadius: "50%", background: p.accent, border: `7px solid ${p.resultStart}`, boxShadow: "0 3px 13px rgba(25,34,72,.17)", boxSizing: "border-box", pointerEvents: "none" }} />
                        <input id={rangeId} type="range" aria-label={p.sliderLabel} min={min} max={max} step={step} value={n} onChange={e => setUnits(Number(e.currentTarget.value))} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ position: "relative", width: "100%", height: 40, opacity: 0, cursor: "ew-resize", margin: 0, touchAction: "pan-y" }} />
                    </div>
                    <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", color: p.leftMuted, marginTop: 6, fontFamily: bodyFont.fontFamily, fontSize: 11, ...tabular }}><span>{min}</span><span>{max}</span></div>
                </div>
            </section>
            {hasLink ? (
                <a href={p.ctaLink} target="_blank" rel="noopener noreferrer" aria-label={`${p.ctaLabel}: ${fmt.format(saved)} ${p.resultUnit}`} style={rightStyle}>{resultContent}</a>
            ) : (
                <section style={rightStyle}>{resultContent}</section>
            )}
        </div>
    )
}

addPropertyControls(SavingsCompareSlider, {
    heading: { type: ControlType.String, title: "Headline", defaultValue: defaults.heading },
    description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: defaults.description },
    sliderLabel: { type: ControlType.String, title: "Slider Label", defaultValue: defaults.sliderLabel },
    unitLabel: { type: ControlType.String, title: "Unit Label", defaultValue: defaults.unitLabel },
    minUnits: { type: ControlType.Number, title: "Minimum", min: 0, max: 10000, step: 1, defaultValue: defaults.minUnits },
    maxUnits: { type: ControlType.Number, title: "Maximum", min: 1, max: 10000, step: 1, defaultValue: defaults.maxUnits },
    step: { type: ControlType.Number, title: "Step", min: 1, max: 100, step: 1, defaultValue: defaults.step },
    initialUnits: { type: ControlType.Number, title: "Start At", min: 0, max: 10000, step: 1, defaultValue: defaults.initialUnits },
    beforeRate: { type: ControlType.Number, title: "Before/Unit", min: 0, max: 100000, step: 0.5, defaultValue: defaults.beforeRate },
    afterRate: { type: ControlType.Number, title: "After/Unit", min: 0, max: 100000, step: 0.5, defaultValue: defaults.afterRate },
    beforeLabel: { type: ControlType.String, title: "Before Name", defaultValue: defaults.beforeLabel },
    afterLabel: { type: ControlType.String, title: "After Name", defaultValue: defaults.afterLabel },
    resultLabel: { type: ControlType.String, title: "Result Label", defaultValue: defaults.resultLabel },
    resultUnit: { type: ControlType.String, title: "Result Unit", defaultValue: defaults.resultUnit },
    supportingText: { type: ControlType.String, title: "Result Text", defaultValue: defaults.supportingText },
    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: defaults.ctaLabel },
    ctaLink: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
    background: { type: ControlType.Color, title: "Background", defaultValue: defaults.background },
    leftSurface: { type: ControlType.Color, title: "Left Panel", defaultValue: defaults.leftSurface },
    leftText: { type: ControlType.Color, title: "Text", defaultValue: defaults.leftText },
    leftMuted: { type: ControlType.Color, title: "Muted Text", defaultValue: defaults.leftMuted },
    trackColor: { type: ControlType.Color, title: "Slider Track", defaultValue: defaults.trackColor },
    accent: { type: ControlType.Color, title: "Slider Accent", defaultValue: defaults.accent },
    resultStart: { type: ControlType.Color, title: "Gradient Start", defaultValue: defaults.resultStart },
    resultEnd: { type: ControlType.Color, title: "Gradient End", defaultValue: defaults.resultEnd },
    resultText: { type: ControlType.Color, title: "Result Text", defaultValue: defaults.resultText },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, step: 1, defaultValue: defaults.radius },
    panelPadding: { type: ControlType.Number, title: "Padding", min: 18, max: 60, step: 1, defaultValue: defaults.panelPadding },
    animationSpeed: { type: ControlType.Number, title: "Motion Speed", min: 0.15, max: 1.5, step: 0.05, defaultValue: defaults.animationSpeed },
    headingFont: { type: ControlType.Font, title: "Heading Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" },
    numberFont: { type: ControlType.Font, title: "Number Font", controls: "extended" },
})
