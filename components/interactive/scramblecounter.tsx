import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const CHARS = "0123456789"

function easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

export default function ScrambleCounter({
    target = 98.6,
    decimals = 1,
    prefix = "",
    suffix = "%",
    duration = 1600,
    delay = 0,
    font,
    color = "#0a0a0a",
    affixColor = "rgba(0,0,0,0.35)",
    runOnce = true,
    style,
}: {
    target?: number
    decimals?: number
    prefix?: string
    suffix?: string
    duration?: number
    delay?: number
    font?: any
    color?: string
    affixColor?: string
    runOnce?: boolean
    style?: React.CSSProperties
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, {
        once: runOnce,
        margin: "0px 0px -60px 0px",
    })
    const [display, setDisplay] = useState((0).toFixed(decimals))
    const rafRef = useRef<number | null>(null)
    const hasRun = useRef(false)

    useEffect(() => {
        if (!isInView) return
        if (runOnce && hasRun.current) return
        hasRun.current = true

        const timeout = setTimeout(() => {
            const start = performance.now()

            function frame(now: number) {
                const p = Math.min((now - start) / duration, 1)
                const eased = easeOut(p)
                const val = target * eased

                if (p < 1) {
                    const digits = val.toFixed(decimals).split("")
                    const scrambled = digits
                        .map((ch) =>
                            ch !== "." && Math.random() < (1 - p) * 0.65
                                ? CHARS[Math.floor(Math.random() * 10)]
                                : ch
                        )
                        .join("")
                    setDisplay(scrambled)
                    rafRef.current = requestAnimationFrame(frame)
                } else {
                    setDisplay(target.toFixed(decimals))
                }
            }

            rafRef.current = requestAnimationFrame(frame)
        }, delay)

        return () => {
            clearTimeout(timeout)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isInView])

    const sharedStyle = {
        ...font,
        lineHeight: 1,
    }

    return (
        <div
            ref={ref}
            style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 2,
                lineHeight: 1,
                ...style,
            }}
        >
            {prefix && (
                <span style={{ ...sharedStyle, color: affixColor }}>
                    {prefix}
                </span>
            )}
            <span
                style={{
                    ...sharedStyle,
                    color,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {display}
            </span>
            {suffix && (
                <span style={{ ...sharedStyle, color: affixColor }}>
                    {suffix}
                </span>
            )}
        </div>
    )
}

addPropertyControls(ScrambleCounter, {
    target: {
        type: ControlType.Number,
        title: "Target",
        defaultValue: 98.6,
        step: 0.1,
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 1,
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
        defaultValue: "%",
        placeholder: "%",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration ms",
        defaultValue: 1600,
        min: 300,
        max: 5000,
        step: 100,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay ms",
        defaultValue: 0,
        min: 0,
        max: 2000,
        step: 50,
    },
    font: { type: ControlType.Font, title: "Font", controls: "extended" },
    color: {
        type: ControlType.Color,
        title: "Number color",
        defaultValue: "#0a0a0a",
    },
    affixColor: {
        type: ControlType.Color,
        title: "Prefix/Suffix color",
        defaultValue: "rgba(0,0,0,0.35)",
    },
    runOnce: {
        type: ControlType.Boolean,
        title: "Animate once",
        defaultValue: true,
    },
})
