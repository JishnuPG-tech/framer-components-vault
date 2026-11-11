/**
 * CounterPreloader — Framer code component (Hero Kit)
 *
 * A full-page curtain that counts 0 → 100 with an ease-out, then lifts to
 * reveal the hero. Page scroll is locked while it is up. Optionally shown once
 * per browser session.
 *
 * It is driven by the clock, not by scroll. In the browser it renders a fixed
 * overlay; on the Framer canvas and thumbnail it renders an in-flow preview
 * at 100 so you can style it; with reduced motion it renders nothing (the
 * page is simply there).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
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

import { clamp01, easeOut, useDesignTime, useMotionMode } from "./HeroKit.tsx"

type Props = {
    duration?: number
    curtainDuration?: number
    background?: string
    color?: string
    accent?: string
    font?: React.CSSProperties
    label?: string
    suffix?: string
    placement?: "bottomLeft" | "center"
    showOnce?: boolean
    style?: React.CSSProperties
}

type Phase = "count" | "curtain" | "done"

const SEEN_KEY = "hk-preloader-seen"
const TICK_MS = 20

function seenThisSession() {
    try {
        return window.sessionStorage.getItem(SEEN_KEY) === "1"
    } catch {
        return false
    }
}
function markSeen() {
    try {
        window.sessionStorage.setItem(SEEN_KEY, "1")
    } catch {
        /* private mode: shown again next time, which is harmless */
    }
}

export default function CounterPreloader(props: Props) {
    const {
        duration = 1800,
        curtainDuration = 700,
        background = "#0B0B0F",
        color = "#FFFFFF",
        accent = "#8B7CFF",
        font,
        label,
        suffix = "%",
        placement = "bottomLeft",
        showOnce = false,
        style,
    } = props

    const motion = useMotionMode()
    const designTime = useDesignTime()
    const live = motion === "animated"
    const [phase, setPhase] = React.useState<Phase>(() =>
        live && !(showOnce && seenThisSession()) ? "count" : "done"
    )
    const countRef = React.useRef<HTMLSpanElement>(null)
    const barRef = React.useRef<HTMLDivElement>(null)

    // Count, then lift, then leave. Timeouts (not rAF) so a hidden tab still finishes.
    React.useEffect(() => {
        if (!live || phase !== "count") return
        const start = Date.now()
        let timer = 0
        const paint = (t: number) => {
            const value = Math.round(100 * easeOut(t))
            if (countRef.current)
                countRef.current.textContent = `${value}${suffix}`
            if (barRef.current)
                barRef.current.style.transform = `scaleX(${value / 100})`
        }
        const step = () => {
            const t = clamp01((Date.now() - start) / Math.max(1, duration))
            paint(t)
            if (t < 1) {
                timer = window.setTimeout(step, TICK_MS)
                return
            }
            setPhase("curtain")
        }
        paint(0)
        step()
        return () => window.clearTimeout(timer)
    }, [live, phase, duration, suffix])

    React.useEffect(() => {
        if (!live || phase !== "curtain") return
        const timer = window.setTimeout(() => {
            if (showOnce) markSeen()
            setPhase("done")
        }, curtainDuration)
        return () => window.clearTimeout(timer)
    }, [live, phase, curtainDuration, showOnce])

    // Scroll lock while the curtain is up.
    React.useEffect(() => {
        if (!live || phase === "done") return
        const root = document.documentElement
        const previous = root.style.overflow
        root.style.overflow = "hidden"
        return () => {
            root.style.overflow = previous
        }
    }, [live, phase])

    const content = (preview: boolean) => (
        <>
            <div
                style={{
                    position: "absolute",
                    ...(placement === "center"
                        ? {
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                          }
                        : {
                              left: "clamp(20px, 5vw, 64px)",
                              bottom: "clamp(20px, 5vh, 64px)",
                          }),
                }}
            >
                {label ? (
                    <div
                        data-hk="label"
                        style={{
                            fontSize: 13,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            opacity: 0.6,
                            marginBottom: 12,
                        }}
                    >
                        {label}
                    </div>
                ) : null}
                <span
                    ref={countRef}
                    data-hk="count"
                    style={{
                        display: "block",
                        fontSize: "clamp(64px, 14vw, 200px)",
                        lineHeight: 0.9,
                        letterSpacing: "-0.04em",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        ...font,
                    }}
                >
                    {preview ? `100${suffix}` : `0${suffix}`}
                </span>
            </div>
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    background: "rgba(255,255,255,0.12)",
                }}
            >
                <div
                    ref={barRef}
                    data-hk="bar"
                    style={{
                        width: "100%",
                        height: "100%",
                        background: accent,
                        transformOrigin: "0 50%",
                        transform: preview ? "scaleX(1)" : "scaleX(0)",
                    }}
                />
            </div>
        </>
    )

    if (designTime) {
        return (
            <div
                data-hk="preloader"
                data-hk-mode={motion}
                data-hk-state="preview"
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 240,
                    overflow: "hidden",
                    background,
                    color,
                }}
            >
                {content(true)}
            </div>
        )
    }

    if (!live) {
        return (
            <div
                data-hk="preloader"
                data-hk-mode={motion}
                data-hk-state="done"
                style={{ display: "none" }}
            />
        )
    }

    const lifting = phase !== "count"
    return (
        <div
            data-hk="preloader"
            data-hk-mode={motion}
            data-hk-state={phase}
            role="status"
            aria-live="polite"
            style={{
                ...style,
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                overflow: "hidden",
                background,
                color,
                display: phase === "done" ? "none" : "block",
                transform: lifting ? "translateY(-100%)" : "translateY(0%)",
                transition: lifting
                    ? `transform ${curtainDuration}ms cubic-bezier(0.76, 0, 0.24, 1)`
                    : undefined,
                willChange: "transform",
            }}
        >
            {content(false)}
        </div>
    )
}

addPropertyControls(CounterPreloader, {
    duration: {
        type: ControlType.Number,
        title: "Count time",
        defaultValue: 1800,
        min: 300,
        max: 6000,
        step: 100,
        unit: "ms",
    },
    curtainDuration: {
        type: ControlType.Number,
        title: "Lift time",
        defaultValue: 700,
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
    },
    label: { type: ControlType.String, title: "Label", defaultValue: "" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "%" },
    placement: {
        type: ControlType.Enum,
        title: "Placement",
        options: ["bottomLeft", "center"],
        optionTitles: ["Bottom left", "Center"],
        defaultValue: "bottomLeft",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    color: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    accent: { type: ControlType.Color, title: "Bar", defaultValue: "#8B7CFF" },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0F",
    },
    showOnce: {
        type: ControlType.Boolean,
        title: "Show once",
        defaultValue: false,
        enabledTitle: "Per session",
        disabledTitle: "Every load",
    },
})
