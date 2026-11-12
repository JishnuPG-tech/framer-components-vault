// Live Ticker — a rolling number that counts up, ticks live, or both.
//
// It publishes to a channel, so companions (Ticker Bars, Ring, Feed, Stat) can follow it.
// Leave Channel empty and companions link to the nearest Live Ticker on their own; name it
// (e.g. "orders") to link parts that sit apart, or to show the same number in two places.
// Display "Cells" puts each digit in its own odometer cell.
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useTickerSource, useIsLive, Rolling, fmt } from "./Ticker_Core.tsx"

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    border: 0,
}

// The latest text, updated at most once per `seconds`, so screen readers hear the number
// now and then instead of on every tick or count-up frame.
function useThrottled(text: string, seconds: number, on: boolean) {
    const [shown, setShown] = useState(text)
    const latest = useRef(text)
    const last = useRef(0)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    latest.current = text
    useEffect(() => () => clearTimeout(timer.current), [])
    useEffect(() => {
        if (!on) {
            setShown(text)
            return
        }
        // One pending update at a time; it reads the newest text when it fires.
        if (timer.current) return
        const wait = last.current ? Math.max(0, last.current + seconds * 1000 - Date.now()) : seconds * 1000
        timer.current = setTimeout(() => {
            timer.current = undefined
            last.current = Date.now()
            setShown(latest.current)
        }, wait)
    }, [text, on, seconds])
    return shown
}

interface Props {
    channel: string
    mode: "Live Ticker" | "Count Up" | "Count Up, then Live"
    endValue: number
    startValue: number
    duration: number
    tickInterval: number
    minTick: number
    maxTick: number
    prefix: string
    suffix: string
    useCommas: boolean
    display: "Text" | "Cells"
    digits: number
    cellColor: string
    cellRadius: number
    lastDigit: string
    announce: "Off" | "Polite" | "Assertive"
    announceEvery: number
    label: string
    font: React.CSSProperties
    fontSize: number
    color: string
    letterSpacing: number
    align: "left" | "center" | "right"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 */
export default function LiveTicker(props: Props) {
    const {
        prefix,
        suffix,
        useCommas,
        display,
        digits,
        cellColor,
        cellRadius,
        lastDigit,
        font,
        fontSize,
        color,
        letterSpacing,
        align,
        style,
    } = props
    const ref = useRef<HTMLDivElement>(null)
    const reduce = !!useReducedMotion()
    const { name, ch } = useTickerSource(ref, {
        channel: props.channel,
        mode: props.mode,
        value: props.endValue,
        startAt: props.startValue,
        duration: props.duration,
        every: props.tickInterval,
        min: props.minTick,
        max: props.maxTick,
    })
    const value = ch ? ch.value : props.endValue
    const live = useIsLive()
    const spoken = `${props.label ? props.label + ": " : ""}${prefix}${fmt(value, true)}${suffix}`
    const announced = useThrottled(spoken, Math.max(1, props.announceEvery), live)

    const text: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        ...font,
        fontSize,
        color,
        letterSpacing: `${letterSpacing}em`,
    }
    const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"

    let content: React.ReactNode
    if (display === "Cells") {
        const n = Math.max(1, Math.min(12, Math.round(digits)))
        const raw = String(Math.max(0, value))
        const shown = raw.length > n ? raw : raw.padStart(n, "0")
        const leading = Math.max(0, n - raw.length)
        content = (
            <span style={{ display: "inline-flex", alignItems: "center", ...text, letterSpacing: 0 }}>
                {prefix && <span style={{ marginRight: "0.25em" }}>{prefix}</span>}
                {shown.split("").map((d, i) => {
                    const fromRight = shown.length - i
                    const last = fromRight === 1
                    return (
                        <span
                            key={fromRight}
                            style={{
                                position: "relative",
                                display: "inline-flex",
                                padding: "0.14em 0.1em",
                                marginRight: last ? 0 : (fromRight - 1) % 3 === 0 ? "0.22em" : "0.08em",
                                borderRadius: cellRadius,
                                background: cellColor,
                                overflow: "hidden",
                            }}
                        >
                            <Rolling
                                text={d}
                                reduce={reduce}
                                style={{
                                    opacity: i < leading ? 0.3 : 1,
                                    color: last && lastDigit ? lastDigit : undefined,
                                }}
                            />
                            <span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: "50%",
                                    height: 1,
                                    background: "rgba(0, 0, 0, 0.35)",
                                }}
                            />
                        </span>
                    )
                })}
                {suffix && <span style={{ marginLeft: "0.25em" }}>{suffix}</span>}
            </span>
        )
    } else {
        content = <Rolling text={`${prefix}${fmt(value, useCommas)}${suffix}`} reduce={reduce} style={text} />
    }
    const politeness = props.announce === "Assertive" ? "assertive" : props.announce === "Polite" ? "polite" : "off"

    return (
        <div
            ref={ref}
            data-ticker-channel={name}
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: justify,
                whiteSpace: "nowrap",
                position: style && style.position ? style.position : "relative",
            }}
        >
            {/* Screen readers get one clean reading of the number; the rolling digits are hidden. */}
            <span aria-hidden style={{ display: "contents" }}>
                {content}
            </span>
            <span style={SR_ONLY} role="status" aria-live={politeness} aria-atomic="true">
                {announced}
            </span>
        </div>
    )
}

LiveTicker.displayName = "Live Ticker"

addPropertyControls(LiveTicker, {
    channel: {
        type: ControlType.String,
        title: "Channel",
        defaultValue: "",
        placeholder: "Auto",
        description: "Empty: companions link to the nearest ticker. Name it to link parts placed apart.",
    },
    mode: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["Live Ticker", "Count Up", "Count Up, then Live"],
        defaultValue: "Count Up, then Live",
    },
    endValue: { type: ControlType.Number, title: "Value", defaultValue: 14280, min: 0, max: 999999999, step: 1 },
    startValue: {
        type: ControlType.Number,
        title: "Start at",
        defaultValue: 0,
        min: 0,
        max: 999999999,
        hidden: (p) => p.mode === "Live Ticker",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2.5,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (p) => p.mode === "Live Ticker",
    },
    tickInterval: {
        type: ControlType.Number,
        title: "Tick every",
        defaultValue: 2,
        min: 0.1,
        max: 30,
        step: 0.1,
        unit: "s",
        hidden: (p) => p.mode === "Count Up",
    },
    minTick: {
        type: ControlType.Number,
        title: "Min increase",
        defaultValue: 1,
        min: 0,
        max: 100000,
        hidden: (p) => p.mode === "Count Up",
    },
    maxTick: {
        type: ControlType.Number,
        title: "Max increase",
        defaultValue: 6,
        min: 0,
        max: 100000,
        hidden: (p) => p.mode === "Count Up",
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "" },
    useCommas: {
        type: ControlType.Boolean,
        title: "Commas",
        defaultValue: true,
        hidden: (p) => p.display === "Cells",
    },
    display: {
        type: ControlType.Enum,
        title: "Display",
        options: ["Text", "Cells"],
        displaySegmentedControl: true,
        defaultValue: "Text",
    },
    digits: {
        type: ControlType.Number,
        title: "Digits",
        defaultValue: 6,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        hidden: (p) => p.display !== "Cells",
    },
    cellColor: {
        type: ControlType.Color,
        title: "Cell color",
        defaultValue: "#1C1C1F",
        hidden: (p) => p.display !== "Cells",
    },
    cellRadius: {
        type: ControlType.Number,
        title: "Cell radius",
        defaultValue: 5,
        min: 0,
        max: 40,
        hidden: (p) => p.display !== "Cells",
    },
    lastDigit: {
        type: ControlType.Color,
        title: "Last digit",
        defaultValue: "#FF5B19",
        optional: true,
        hidden: (p) => p.display !== "Cells",
    },
    announce: {
        type: ControlType.Enum,
        title: "Announce",
        options: ["Off", "Polite", "Assertive"],
        defaultValue: "Polite",
        description: "How screen readers hear updates. Polite waits for a pause; Off stays readable but silent.",
    },
    announceEvery: {
        type: ControlType.Number,
        title: "Announce every",
        defaultValue: 15,
        min: 1,
        max: 300,
        step: 1,
        unit: "s",
        hidden: (p) => p.announce === "Off",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "e.g. Orders today",
        description: "Read before the number by screen readers.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Semibold" },
    },
    fontSize: { type: ControlType.Number, title: "Font size", defaultValue: 48, min: 6, max: 400, step: 1, unit: "px" },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#F5F5F7" },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter spacing",
        defaultValue: -0.04,
        min: -0.2,
        max: 0.5,
        step: 0.01,
        unit: "em",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
})
