import * as React from "react"
import { useEffect, useMemo, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

interface Props {
    headline: string
    description: string
    targetDate: string
    completedText: string
    ctaLabel: string
    ctaLink: string
    showSeconds: boolean
    showCTA: boolean
    leftBackground: string
    rightBackground: string
    accentColor: string
    inkColor: string
    cornerRadius: number
    motionSpeed: number
    style?: React.CSSProperties
}

const DEFAULTS = {
    headline: "Something good is coming.",
    description: "The next chapter is getting closer. Make yours happen while the clock is ticking.",
    targetDate: "2027-01-15T10:00:00+01:00",
    completedText: "The moment is here.",
    ctaLabel: "Start Building",
    ctaLink: "",
    showSeconds: true,
    showCTA: true,
    leftBackground: "#F7F6F1",
    rightBackground: "#3D55EF",
    accentColor: "#DFFF69",
    inkColor: "#17191B",
    cornerRadius: 24,
    motionSpeed: 0.55,
}

function pad(value: number) {
    return String(Math.max(0, value)).padStart(2, "0")
}

function useTimeLeft(targetDate: string, staticRenderer: boolean) {
    const [clock, setClock] = useState(() => Date.now())
    useEffect(() => {
        if (staticRenderer) return
        const timer = window.setInterval(() => setClock(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [staticRenderer])
    const target = Date.parse(targetDate)
    const validTarget = Number.isFinite(target) ? target : Date.parse(DEFAULTS.targetDate)
    const total = Math.max(0, Math.floor((validTarget - clock) / 1000))
    return {
        isComplete: total === 0,
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    }
}

function RollingNumber({
    value,
    reduced,
    speed,
}: {
    value: string
    reduced: boolean
    speed: number
}) {
    return (
        <span style={{
            position: "relative", display: "block", overflow: "hidden",
            height: "1.08em", lineHeight: 1.08, width: "100%",
            fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"',
        }}>
            <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                    key={value}
                    initial={reduced ? false : { y: "78%", opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    exit={reduced ? undefined : { y: "-78%", opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: reduced ? 0 : speed, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 390
 */
export default function LaunchCountdownCard(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = !!useReducedMotion() || staticRenderer
    const time = useTimeLeft(p.targetDate, staticRenderer)
    const [ctaHovered, setCtaHovered] = useState(false)
    const [ctaFocused, setCtaFocused] = useState(false)
    const hasLink = typeof p.ctaLink === "string" && p.ctaLink.trim().length > 0
    const units = useMemo(() => [
        { label: "DAYS", value: String(time.days).padStart(2, "0") },
        { label: "HOURS", value: pad(time.hours) },
        { label: "MINS", value: pad(time.minutes) },
        ...(p.showSeconds ? [{ label: "SECS", value: pad(time.seconds) }] : []),
    ], [time.days, time.hours, time.minutes, time.seconds, p.showSeconds])

    const radius = Math.max(0, p.cornerRadius)
    const speed = Math.max(0.12, p.motionSpeed)
    const cardStyle: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "stretch",
        width: "100%",
        height: "auto",
        minWidth: 0,
        overflow: "hidden",
        borderRadius: radius,
        background: p.leftBackground,
        boxShadow: "0 16px 48px rgba(23,25,27,0.08), 0 2px 7px rgba(23,25,27,0.04)",
        fontFamily: "Inter, sans-serif",
        WebkitFontSmoothing: "antialiased",
        ...props.style,
    }

    return (
        <div style={cardStyle}>
            <div style={{
                flex: "1 1 320px", minWidth: 0, boxSizing: "border-box",
                minHeight: 352, padding: "clamp(25px, 4.5vw, 49px)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                background: p.leftBackground, color: p.inkColor,
            }}>
                <div style={{ maxWidth: 390 }}>
                    <h2 style={{
                        padding: 0, margin: 0, maxWidth: 380,
                        color: p.inkColor,
                        fontFamily: "Inter Display, Inter, sans-serif",
                        fontWeight: 750, fontSize: "clamp(34px, 4.15vw, 52px)",
                        lineHeight: 0.99, letterSpacing: "-0.064em",
                    }}>
                        {p.headline}
                    </h2>
                    <p style={{
                        margin: "19px 0 0", maxWidth: 330, color: p.inkColor,
                        opacity: 0.62, fontSize: 15, lineHeight: 1.53,
                        fontWeight: 450, letterSpacing: "-0.012em",
                    }}>
                        {p.description}
                    </p>
                </div>
                {p.showCTA && hasLink && (
                    <a href={p.ctaLink} target="_blank" rel="noopener noreferrer"
                        onMouseEnter={() => setCtaHovered(true)}
                        onMouseLeave={() => setCtaHovered(false)}
                        onFocus={() => setCtaFocused(true)}
                        onBlur={() => setCtaFocused(false)}
                        style={{
                            display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
                            gap: 28, minHeight: 47, padding: "0 10px 0 20px",
                            background: p.inkColor, color: p.leftBackground, borderRadius: 99,
                            fontSize: 13, fontWeight: 650, letterSpacing: "-0.01em",
                            textDecoration: "none", cursor: "pointer",
                            outline: ctaFocused ? "3px solid " + p.rightBackground : "none",
                            outlineOffset: 3, marginTop: 26,
                        }}
                    >
                        <span>{p.ctaLabel}</span>
                        <motion.span animate={{ x: ctaHovered && !reducedMotion ? 3 : 0, rotate: ctaHovered && !reducedMotion ? 10 : 0 }}
                            transition={{ type: "spring", stiffness: 320, damping: 22 }}
                            aria-hidden="true"
                            style={{
                                height: 30, width: 30, borderRadius: "50%",
                                background: p.accentColor, color: p.inkColor,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18, fontWeight: 500, lineHeight: 1,
                            }}
                        >↗</motion.span>
                    </a>
                )}
            </div>
            <div style={{
                position: "relative", isolation: "isolate",
                flex: "1 1 390px", minWidth: 0, boxSizing: "border-box",
                minHeight: 352, padding: "clamp(25px, 3.8vw, 45px)",
                overflow: "hidden",
                background: p.rightBackground,
                color: p.accentColor,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
                <div aria-hidden="true" style={{
                    position: "absolute", right: -88, top: -118, width: 340, height: 340,
                    border: "1.5px solid rgba(255,255,255,0.26)", borderRadius: "50%",
                    pointerEvents: "none", zIndex: 0,
                }}>
                    <div style={{ position: "absolute", inset: 42, border: "1.5px solid rgba(255,255,255,0.21)", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", inset: 86, border: "1.5px solid rgba(255,255,255,0.19)", borderRadius: "50%" }} />
                </div>
                <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{
                        width: 54, height: 54, display: "flex", alignItems: "center",
                        justifyContent: "center", borderRadius: "50%",
                        background: p.accentColor, color: p.rightBackground,
                        fontSize: 36, lineHeight: 1, fontWeight: 300,
                    }} aria-hidden="true">✳</div>
                    <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: 700, letterSpacing: "0.13em" }}>
                        THE COUNTDOWN
                    </span>
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                        fontSize: "clamp(22px, 2.75vw, 34px)", fontWeight: 650,
                        letterSpacing: "-0.047em", lineHeight: 1.1,
                        color: p.accentColor, marginBottom: 23,
                    }}>
                        {time.isComplete ? p.completedText : "Until the big moment."}
                    </div>
                    <div role="timer" aria-label={units.map(unit => unit.value + " " + unit.label.toLowerCase()).join(", ")}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(" + units.length + ", minmax(0, 1fr))",
                            gap: "clamp(6px, 0.9vw, 11px)",
                        }}>
                        {units.map(unit => (
                            <div key={unit.label} style={{
                                minWidth: 0, borderRadius: Math.max(8, radius - 10),
                                padding: "clamp(12px, 1.7vw, 20px) 4px clamp(11px, 1.5vw, 16px)",
                                background: p.accentColor,
                                color: p.inkColor,
                                display: "flex", flexDirection: "column", alignItems: "center",
                                boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.055)",
                            }}>
                                <div style={{
                                    fontFamily: "Inter Display, Inter, sans-serif",
                                    fontSize: "clamp(34px, 4.8vw, 61px)",
                                    fontWeight: 730, letterSpacing: "-0.075em",
                                    width: "100%", textAlign: "center", lineHeight: 1.08,
                                }}>
                                    <RollingNumber value={unit.value} reduced={reducedMotion} speed={speed} />
                                </div>
                                <span style={{ fontSize: "clamp(8px, 0.85vw, 10px)", letterSpacing: "0.10em", fontWeight: 750, marginTop: 9, opacity: 0.66 }}>
                                    {unit.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(LaunchCountdownCard, {
    headline: { type: ControlType.String, title: "Headline", defaultValue: DEFAULTS.headline, displayTextArea: true },
    description: { type: ControlType.String, title: "Description", defaultValue: DEFAULTS.description, displayTextArea: true },
    targetDate: { type: ControlType.String, title: "Target Date", defaultValue: DEFAULTS.targetDate, description: "ISO 8601 with time zone, e.g. 2027-01-15T10:00:00+01:00" },
    completedText: { type: ControlType.String, title: "At Zero", defaultValue: DEFAULTS.completedText },
    showSeconds: { type: ControlType.Boolean, title: "Show Seconds", defaultValue: true },
    ctaLabel: { type: ControlType.String, title: "CTA Text", defaultValue: DEFAULTS.ctaLabel },
    ctaLink: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
    showCTA: { type: ControlType.Boolean, title: "CTA", defaultValue: true },
    leftBackground: { type: ControlType.Color, title: "Left Panel", defaultValue: DEFAULTS.leftBackground },
    rightBackground: { type: ControlType.Color, title: "Right Panel", defaultValue: DEFAULTS.rightBackground },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: DEFAULTS.accentColor },
    inkColor: { type: ControlType.Color, title: "Text", defaultValue: DEFAULTS.inkColor },
    cornerRadius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 60, step: 1, unit: "px" },
    motionSpeed: { type: ControlType.Number, title: "Digit Speed", defaultValue: 0.55, min: 0.12, max: 1.2, step: 0.05, unit: "s" },
})
