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


type Trigger = "view" | "hover" | "mount"
type EaseName = "out" | "outExpo" | "linear" | "inOut"

interface NumberTickerProps {
    from: number
    to: number
    decimals: number
    prefix: string
    suffix: string
    separator: boolean
    font: React.CSSProperties
    color: string
    trigger: Trigger
    duration: number
    ease: EaseName
    replay: boolean
}

const EASES: Record<EaseName, (t: number) => number> = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    linear: (t) => t,
    inOut: (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

/**
 * Number Ticker - counts from one value to another when it comes into view.
 *
 * The final value is rendered as a hidden copy that reserves the box, so a
 * digit changing width never nudges the layout, and it is what crawlers and
 * screen readers get. Only textContent changes while counting.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function NumberTicker(props: NumberTickerProps) {
    const {
        from,
        to,
        decimals,
        prefix,
        suffix,
        separator,
        font,
        color,
        trigger,
        duration,
        ease,
        replay,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLSpanElement>(null)
    const outRef = useRef<HTMLSpanElement>(null)
    const frame = useRef<number | null>(null)

    const places = Math.min(Math.max(Math.round(decimals), 0), 4)

    const format = (value: number) => {
        const fixed = value.toFixed(places)
        if (!separator) return prefix + fixed + suffix
        const [whole, fraction] = fixed.split(".")
        const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        return prefix + (fraction ? grouped + "." + fraction : grouped) + suffix
    }

    // The widest string this can produce, so the reserved box never shifts.
    const widest = format(Math.abs(from) > Math.abs(to) ? from : to)

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const out = outRef.current
        const root = rootRef.current
        if (!out || !root) return

        const curve = EASES[ease] || EASES.out
        const ms = Math.max(duration, 0.05) * 1000
        let startedAt = 0

        const stop = () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)
            frame.current = null
        }

        const step = (now: number) => {
            if (!startedAt) startedAt = now
            const t = Math.min((now - startedAt) / ms, 1)
            out.textContent = format(from + (to - from) * curve(t))
            if (t < 1) frame.current = requestAnimationFrame(step)
            else frame.current = null
        }

        const run = () => {
            stop()
            startedAt = 0
            frame.current = requestAnimationFrame(step)
        }

        const reset = () => {
            stop()
            out.textContent = format(from)
        }

        let observer: IntersectionObserver | null = null
        const onEnter = () => run()

        if (trigger === "hover") {
            reset()
            root.addEventListener("pointerenter", onEnter)
        } else if (trigger === "mount") {
            run()
        } else if (typeof IntersectionObserver !== "undefined") {
            reset()
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            run()
                            if (!replay && observer) observer.disconnect()
                        } else if (replay) {
                            reset()
                        }
                    }
                },
                { threshold: 0.4 }
            )
            observer.observe(root)
        } else {
            run()
        }

        return () => {
            stop()
            if (observer) observer.disconnect()
            root.removeEventListener("pointerenter", onEnter)
            out.textContent = format(to)
        }
    }, [
        isStatic,
        from,
        to,
        places,
        prefix,
        suffix,
        separator,
        trigger,
        duration,
        ease,
        replay,
    ])

    const shared: React.CSSProperties = {
        ...font,
        color,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "pre",
    }

    return (
        <span
            ref={rootRef}
            style={{ position: "relative", display: "inline-block", ...shared }}
        >
            {/* Reserves the widest box and is what assistive tech reads. */}
            <span style={{ visibility: "hidden" }}>{widest}</span>
            <span
                ref={outRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    ...shared,
                }}
            >
                {format(to)}
            </span>
        </span>
    )
}

NumberTicker.displayName = "Number Ticker"

addPropertyControls(NumberTicker, {
    from: {
        type: ControlType.Number,
        title: "From",
        defaultValue: 0,
        min: -1000000,
        max: 1000000,
        step: 1,
        displayStepper: true,
    },
    to: {
        type: ControlType.Number,
        title: "To",
        defaultValue: 1250,
        min: -1000000,
        max: 1000000,
        step: 1,
        displayStepper: true,
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    separator: {
        type: ControlType.Boolean,
        title: "Thousands",
        description: "Group with commas.",
        defaultValue: true,
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "$",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "+",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 56 },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "view",
        options: ["view", "hover", "mount"],
        optionTitles: ["On View", "On Hover", "On Load"],
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.6,
        min: 0.1,
        max: 8,
        step: 0.1,
        unit: "s",
    },
    ease: {
        type: ControlType.Enum,
        title: "Ease",
        defaultValue: "out",
        options: ["out", "outExpo", "linear", "inOut"],
        optionTitles: ["Ease Out", "Expo Out", "Linear", "Ease In Out"],
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        description: "Count again each time it scrolls back into view.",
        defaultValue: false,
        hidden: (props: Partial<NumberTickerProps>) =>
            props.trigger !== "view",
    },
})
