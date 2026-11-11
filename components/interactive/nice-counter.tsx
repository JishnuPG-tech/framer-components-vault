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

import { motion, useInView } from "framer-motion"

type Mode = "smooth" | "odometer"
type Trigger = "inView" | "appear" | "scroll"
type Easing =
    | "linear"
    | "smooth"
    | "snappy"
    | "easeInOut"
    | "softSpring"
    | "back"
    | "bounce"
type Align = "left" | "center" | "right"

interface NiceCounterProps {
    mode: Mode
    from: number
    to: number
    duration: number
    delay: number
    decimals: number
    prefix: string
    suffix: string
    separator: string
    trigger: Trigger
    easing: Easing
    loop: boolean
    resetOnReEntry: boolean
    color: string
    mutedColor: string
    maskFade: boolean
    align: Align
    font: React.CSSProperties
    showCredit: boolean
    creditText: string
    creditColor: string
    creditFont: React.CSSProperties
    style?: React.CSSProperties
}

function clamp(value: number) {
    return Math.max(0, Math.min(1, value))
}

function easedProgress(progress: number, type: Easing) {
    if (type === "linear") return progress
    if (type === "bounce") {
        const n1 = 7.5625
        const d1 = 2.75
        if (progress < 1 / d1) return n1 * progress * progress
        if (progress < 2 / d1)
            return n1 * (progress -= 1.5 / d1) * progress + 0.75
        if (progress < 2.5 / d1)
            return n1 * (progress -= 2.25 / d1) * progress + 0.9375
        return n1 * (progress -= 2.625 / d1) * progress + 0.984375
    }
    if (type === "softSpring") {
        return clamp(
            1 - Math.cos(progress * Math.PI * 2.8) * Math.exp(-progress * 4.6)
        )
    }
    if (type === "back") {
        const c1 = 1.70158
        const c3 = c1 + 1
        return clamp(
            1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2)
        )
    }
    if (type === "easeInOut") {
        return progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2
    }
    if (type === "snappy") {
        return 1 - Math.pow(1 - progress, 5)
    }
    return 1 - Math.pow(1 - progress, 3)
}

function formatNumber(value: number, decimals: number, separator: string) {
    const fixed = value.toFixed(decimals)
    const sign = fixed.startsWith("-") ? "-" : ""
    const parts = fixed.replace("-", "").split(".")
    const integer = parts[0]
    const fraction = parts[1]
    const grouped = separator
        ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
        : integer
    return sign + grouped + (fraction ? "." + fraction : "")
}

function getFontSize(font: React.CSSProperties) {
    const raw = font?.fontSize
    if (typeof raw === "number") return raw
    if (typeof raw === "string") return Number.parseFloat(raw) || 64
    return 64
}

function integerDigit(value: number, place: number) {
    return Math.floor(Math.abs(value) / place) % 10
}

function buildOdometerEntries(
    from: number,
    to: number,
    decimals: number,
    separator: string
) {
    const fromInt = Math.round(Math.abs(from) * Math.pow(10, decimals))
    const toInt = Math.round(Math.abs(to) * Math.pow(10, decimals))
    const startWhole = Math.floor(fromInt / Math.pow(10, decimals))
    const endWhole = Math.floor(toInt / Math.pow(10, decimals))
    const maxWhole = Math.max(startWhole, endWhole)
    const integerLength = Math.max(1, String(maxWhole).length)
    const totalSteps = Math.abs(toInt - fromInt)
    const direction = toInt >= fromInt ? 1 : -1
    const maxRenderedSteps = 3000
    const stepEvery = Math.max(1, Math.ceil(totalSteps / maxRenderedSteps))
    const entries: Array<
        { type: "digit"; values: number[] } | { type: "mark"; value: string }
    > = []
    const integerPlaces = Array.from({ length: integerLength }, (_, index) =>
        Math.pow(10, integerLength - index - 1)
    )

    integerPlaces.forEach((place, index) => {
        const values: number[] = []
        for (let step = 0; step <= totalSteps; step += stepEvery) {
            const raw = fromInt + direction * step
            const whole = Math.floor(Math.abs(raw) / Math.pow(10, decimals))
            values.push(integerDigit(whole, place))
        }
        const finalWhole = Math.floor(Math.abs(toInt) / Math.pow(10, decimals))
        const finalDigit = integerDigit(finalWhole, place)
        if (values[values.length - 1] !== finalDigit) values.push(finalDigit)
        entries.push({ type: "digit", values })

        const remainingIntegerDigits = integerLength - index - 1
        if (
            separator &&
            remainingIntegerDigits > 0 &&
            remainingIntegerDigits % 3 === 0
        ) {
            entries.push({ type: "mark", value: separator })
        }
    })

    if (decimals > 0) {
        entries.push({ type: "mark", value: "." })
        for (
            let decimalIndex = decimals - 1;
            decimalIndex >= 0;
            decimalIndex--
        ) {
            const place = Math.pow(10, decimalIndex)
            const values: number[] = []
            for (let step = 0; step <= totalSteps; step += stepEvery) {
                const raw = fromInt + direction * step
                values.push(integerDigit(raw, place))
            }
            const finalDigit = integerDigit(toInt, place)
            if (values[values.length - 1] !== finalDigit)
                values.push(finalDigit)
            entries.push({ type: "digit", values })
        }
    }

    return entries
}

function DigitWheel(props: {
    values: number[]
    progress: number
    height: number
    width: number
    color: string
    maskFade: boolean
    transition: any
}) {
    const { values, progress, height, width, color, maskFade, transition } =
        props
    const y = -(values.length - 1) * height * progress
    const mask =
        maskFade && values.length > 1
            ? {
                  WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
                  maskImage:
                      "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              }
            : undefined

    return (
        <span
            aria-hidden="true"
            style={{
                position: "relative",
                display: "inline-flex",
                justifyContent: "center",
                overflow: "hidden",
                width,
                height,
                ...mask,
            }}
        >
            <motion.span
                animate={{ y }}
                transition={transition}
                style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
            >
                {values.map((value, index) => (
                    <span
                        key={value + "-" + index}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height,
                            color,
                            lineHeight: 1,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {value}
                    </span>
                ))}
            </motion.span>
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NiceCounter(props: NiceCounterProps) {
    const {
        mode,
        from,
        to,
        duration,
        delay,
        decimals,
        prefix,
        suffix,
        separator,
        trigger,
        easing,
        loop,
        resetOnReEntry,
        color,
        mutedColor,
        maskFade,
        align,
        font,
        showCredit,
        creditText,
        creditColor,
        creditFont,
        style,
    } = props

    const ref = React.useRef<HTMLDivElement | null>(null)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(ref, {
        once: !resetOnReEntry,
        margin: "0px 0px -12% 0px",
    })
    const [progress, setProgress] = React.useState(isStatic ? 1 : 0)
    const frame = React.useRef<number | undefined>(undefined)
    const timeout = React.useRef<number | undefined>(undefined)
    const started = trigger === "appear" || isInView
    const safeDuration = Math.max(0.1, duration)

    React.useEffect(() => {
        if (isStatic) {
            setProgress(1)
            return
        }

        if (trigger === "scroll") {
            const element = ref.current
            const update = () => {
                const el = ref.current
                if (!el) return
                const rect = el.getBoundingClientRect()
                const viewport = window.innerHeight || 1
                setProgress(
                    clamp((viewport - rect.top) / (viewport + rect.height))
                )
            }

            let listening = false
            const addListeners = () => {
                if (listening) return
                listening = true
                window.addEventListener("scroll", update, { passive: true })
                window.addEventListener("resize", update)
            }
            const removeListeners = () => {
                if (!listening) return
                listening = false
                window.removeEventListener("scroll", update)
                window.removeEventListener("resize", update)
            }

            // Only attach the global scroll/resize listeners while the
            // component is near or within the viewport, so it stops doing
            // progress work entirely once it scrolls offscreen.
            const io =
                typeof IntersectionObserver !== "undefined" && element
                    ? new IntersectionObserver(
                          (intersections) => {
                              if (
                                  intersections.some((e) => e.isIntersecting)
                              ) {
                                  addListeners()
                                  update()
                              } else {
                                  removeListeners()
                              }
                          },
                          { rootMargin: "200px 0px 200px 0px" }
                      )
                    : null

            if (io && element) {
                io.observe(element)
            } else {
                // No IntersectionObserver support: fall back to always listening.
                addListeners()
            }
            update()

            return () => {
                removeListeners()
                if (io) io.disconnect()
            }
        }
    }, [trigger, isStatic])

    React.useEffect(() => {
        if (isStatic || trigger === "scroll") return
        if (!started) {
            if (resetOnReEntry) setProgress(0)
            return
        }

        const run = () => {
            const startTime = performance.now()
            const tick = (now: number) => {
                const raw = clamp((now - startTime) / (safeDuration * 1000))
                setProgress(clamp(easedProgress(raw, easing)))
                if (raw < 1) {
                    frame.current = requestAnimationFrame(tick)
                } else if (loop) {
                    timeout.current = window.setTimeout(() => {
                        setProgress(0)
                        run()
                    }, 180)
                }
            }
            frame.current = requestAnimationFrame(tick)
        }

        timeout.current = window.setTimeout(run, Math.max(0, delay) * 1000)

        return () => {
            if (frame.current) cancelAnimationFrame(frame.current)
            if (timeout.current) window.clearTimeout(timeout.current)
        }
    }, [
        started,
        trigger,
        from,
        to,
        duration,
        delay,
        easing,
        loop,
        resetOnReEntry,
        isStatic,
        safeDuration,
    ])

    const fontSize = getFontSize(font)
    const current = from + (to - from) * progress
    const text = prefix + formatNumber(current, decimals, separator) + suffix
    const targetText = prefix + formatNumber(to, decimals, separator) + suffix
    // The digit wheels follow `progress`, which is already advanced over
    // `duration` and eased by `easing` in the animation effect. So the wheel
    // only needs a short tween to smooth sub-frame motion — never a second
    // `duration`-long animation, which would fight the progress updates and
    // make the Duration control feel sluggish and inconsistent.
    const transition = { duration: 0.12, ease: "linear" }

    const justifyContent =
        align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start"
    const entries = React.useMemo(
        () => buildOdometerEntries(from, to, decimals, separator),
        [from, to, decimals, separator]
    )

    return (
        <div
            ref={ref}
            role="text"
            aria-label={targetText}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems:
                    align === "center"
                        ? "center"
                        : align === "right"
                          ? "flex-end"
                          : "flex-start",
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: fontSize,
                overflow: "visible",
                ...style,
            }}
        >
            <div style={{ display: "flex", justifyContent, width: "100%" }}>
                {mode === "smooth" ? (
                    <span
                        style={{
                            display: "block",
                            width: "max-content",
                            whiteSpace: "nowrap",
                            textAlign: align,
                            color,
                            fontVariantNumeric: "tabular-nums",
                            ...font,
                        }}
                    >
                        {text}
                    </span>
                ) : (
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            width: "max-content",
                            whiteSpace: "nowrap",
                            color,
                            fontVariantNumeric: "tabular-nums",
                            ...font,
                        }}
                    >
                        {prefix && (
                            <span style={{ marginRight: fontSize * 0.08 }}>
                                {prefix}
                            </span>
                        )}
                        {to < 0 && (
                            <span
                                style={{
                                    color: mutedColor,
                                    marginRight: fontSize * 0.08,
                                }}
                            >
                                -
                            </span>
                        )}
                        {entries.map((entry, index) => {
                            if (entry.type === "mark") {
                                return (
                                    <span
                                        key={"mark-" + index}
                                        style={{
                                            color:
                                                entry.value === separator
                                                    ? mutedColor
                                                    : color,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {entry.value}
                                    </span>
                                )
                            }
                            return (
                                <DigitWheel
                                    key={"digit-" + index}
                                    values={entry.values}
                                    progress={progress}
                                    height={fontSize * 1.12}
                                    width={fontSize * 0.62}
                                    color={color}
                                    maskFade={maskFade}
                                    transition={transition}
                                />
                            )
                        })}
                        {suffix && (
                            <span style={{ marginLeft: fontSize * 0.08 }}>
                                {suffix}
                            </span>
                        )}
                    </span>
                )}
            </div>
            {showCredit && (
                <span
                    style={{
                        display: "block",
                        marginTop: Math.max(6, fontSize * 0.12),
                        color: creditColor,
                        whiteSpace: "nowrap",
                        ...creditFont,
                    }}
                >
                    {creditText}
                </span>
            )}
        </div>
    )
}

addPropertyControls(NiceCounter, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["odometer", "smooth"],
        optionTitles: ["Odometer", "Smooth"],
        defaultValue: "odometer",
        displaySegmentedControl: true,
    },
    from: { type: ControlType.Number, title: "From", defaultValue: 0, step: 1 },
    to: { type: ControlType.Number, title: "To", defaultValue: 1000, step: 1 },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2.4,
        min: 0.1,
        max: 12,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.trigger === "scroll",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.trigger === "scroll",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["inView", "appear", "scroll"],
        optionTitles: ["In View", "On Appear", "On Scroll"],
        defaultValue: "inView",
    },
    easing: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "smooth",
            "snappy",
            "easeInOut",
            "softSpring",
            "back",
            "bounce",
            "linear",
        ],
        optionTitles: [
            "Smooth Ease",
            "Snappy Ease",
            "Ease In Out",
            "Soft Spring",
            "Back Overshoot",
            "Bounce",
            "Linear",
        ],
        defaultValue: "smooth",
        hidden: (props) => props.trigger === "scroll",
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 3,
        step: 1,
        displayStepper: true,
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
        defaultValue: ",",
        placeholder: ",",
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
        placeholder: "%, +, k",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        hidden: (props) => props.trigger === "scroll",
    },
    resetOnReEntry: {
        type: ControlType.Boolean,
        title: "Reset",
        defaultValue: false,
        hidden: (props) => props.trigger !== "inView",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "72px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#FFFFFF" },
    mutedColor: {
        type: ControlType.Color,
        title: "Marks",
        defaultValue: "rgba(255,255,255,0.45)",
    },
    maskFade: {
        type: ControlType.Boolean,
        title: "Fade Mask",
        defaultValue: true,
        hidden: (props) => props.mode !== "odometer",
    },
    showCredit: {
        type: ControlType.Boolean,
        title: "Credit",
        defaultValue: false,
    },
    creditText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Counter component",
        hidden: (props) => !props.showCredit,
    },
    creditColor: {
        type: ControlType.Color,
        title: "Credit Color",
        defaultValue: "rgba(255,255,255,0.48)",
        hidden: (props) => !props.showCredit,
    },
    creditFont: {
        type: ControlType.Font,
        title: "Credit Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
        hidden: (props) => !props.showCredit,
    },
})
