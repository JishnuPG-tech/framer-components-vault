// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import type { CSSProperties } from "react"

// Types

type Grouping = "none" | "space" | "thinSpace" | "comma" | "dot"
type DecimalMarkOption = "dot" | "comma"
type Decimals = "off" | "1" | "2" | "3"
type Start = "zero" | "custom"
type Align = "left" | "center" | "right"
type AffixAlign = "baseline" | "top" | "center" | "bottom"
type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut"
type AboveFoldMode = "animate" | "final"
type DecimalMark = "." | ","

interface NumberFormat {
    decimals: number
    decimalMark: DecimalMark
    digits: number
    groupingMark: string
    formatter: Intl.NumberFormat
}

interface CounterState {
    sourceKey: string
    value: number | null
    segmentFrom: number
}

interface BetterCounterProps {
    value?: number
    prefix?: string
    suffix?: string
    digits?: number
    decimals?: Decimals
    decimalMark?: DecimalMarkOption
    grouping?: Grouping
    start?: Start
    from?: number
    duration?: number
    delay?: number
    easing?: Easing
    aboveFold?: AboveFoldMode
    stableWidth?: boolean
    tabular?: boolean
    numberFont?: CSSProperties
    affixFont?: CSSProperties
    numberColor?: string
    affixColor?: string
    affixGap?: number
    affixAlign?: AffixAlign
    layerAlign?: Align
    textAlign?: Align
    style?: CSSProperties
}

// Constants

const DEFAULT_FROM = 0
const DEFAULT_VALUE = 100
const DEFAULT_DIGITS = 1
const MAX_DIGITS = 15
const DEFAULT_NUMBER_COLOR = "#000000"
const DEFAULT_DURATION = 2
const DEFAULT_DELAY = 0
const MAX_ABSOLUTE_VALUE = 999_999_999_999_999
const MAX_DURATION = 30
const MAX_DELAY = 10
const VIEWPORT_THRESHOLD = 0.01
const GROUP_SPACE = "\u00A0"
const THIN_SPACE = "\u2009"
const MASH_COMPONENT_CREDIT = "Made by [MASH](https://framer.link/mash)."

const GROUPING_OPTIONS: Grouping[] = [
    "none",
    "space",
    "thinSpace",
    "comma",
    "dot",
]
const DECIMAL_MARK_OPTIONS: DecimalMarkOption[] = ["dot", "comma"]
const DECIMALS_OPTIONS: Decimals[] = ["off", "1", "2", "3"]
const START_OPTIONS: Start[] = ["zero", "custom"]
const ALIGN_OPTIONS: Align[] = ["left", "center", "right"]
const AFFIX_ALIGN_OPTIONS: AffixAlign[] = [
    "baseline",
    "top",
    "center",
    "bottom",
]
const EASING_OPTIONS: Easing[] = ["linear", "easeIn", "easeOut", "easeInOut"]
const ABOVE_FOLD_OPTIONS: AboveFoldMode[] = ["animate", "final"]
const WIDTH_SAMPLE_DIGITS = Array.from("0123456789")

const DEFAULT_FONT: CSSProperties = {
    fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 64,
    lineHeight: "1em",
    letterSpacing: "-0.04em",
    fontWeight: 700,
}

const DEFAULT_FONT_CONTROL = {
    fontSize: DEFAULT_FONT.fontSize,
    lineHeight: DEFAULT_FONT.lineHeight,
    letterSpacing: DEFAULT_FONT.letterSpacing,
    variant: "Bold",
}

const TEXT_BASE_STYLE: CSSProperties = {
    whiteSpace: "pre",
    unicodeBidi: "isolate",
    direction: "ltr",
}

const NO_SHRINK_STYLE: CSSProperties = {
    flex: "0 0 auto",
    minWidth: "max-content",
    maxWidth: "none",
}

const MAX_CONTENT_STYLE: CSSProperties = {
    width: "max-content",
    minWidth: "max-content",
    maxWidth: "none",
}

const GHOST_STYLE: CSSProperties = {
    gridArea: "1 / 1",
    visibility: "hidden",
    pointerEvents: "none",
    minWidth: "max-content",
    maxWidth: "none",
}

const SCREEN_READER_STYLE: CSSProperties = {
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

// Utilities

const formatNumber = (value: number, format: NumberFormat) => {
    const { decimals, decimalMark, digits, groupingMark, formatter } = format
    const [integer, fraction = ""] = formatter.format(value).split(".")
    const negative = integer.startsWith("-")
    const absoluteInteger = negative ? integer.slice(1) : integer
    const sign =
        negative && (absoluteInteger !== "0" || Number(fraction) !== 0)
            ? "-"
            : ""
    const paddedInteger = absoluteInteger.padStart(digits, "0")
    const grouped =
        groupingMark && digits <= absoluteInteger.length
            ? paddedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, groupingMark)
            : paddedInteger

    return decimals > 0
        ? `${sign}${grouped}${decimalMark}${fraction}`
        : `${sign}${grouped}`
}

const getWidthSamples = (text: string) => [
    text,
    ...WIDTH_SAMPLE_DIGITS.map((digit) => text.replace(/\d/g, digit)),
]

const getEasedProgress = (progress: number, easing: Easing) => {
    if (easing === "linear") return progress
    if (easing === "easeIn") return progress * progress * progress
    if (easing === "easeInOut") {
        return progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2
    }

    return 1 - Math.pow(1 - progress, 3)
}

const alignToJustify = (value: Align) => {
    if (value === "center") return "center"
    if (value === "right") return "flex-end"

    return "flex-start"
}

const alignToItems = (value: Align) => {
    if (value === "center") return "center"
    if (value === "right") return "end"

    return "start"
}

const alignAffixes = (value: AffixAlign) => {
    if (value === "top") return "flex-start"
    if (value === "center") return "center"
    if (value === "bottom") return "flex-end"

    return "baseline"
}

// Normalizers

const pick = <T extends string>(
    value: T | undefined,
    options: readonly T[],
    fallback: T
): T => (value && options.includes(value) ? value : fallback)

const finiteNumber = (value: number | undefined, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))

// Resolvers

const resolveNumberFormat = (
    digits: number,
    decimals: Decimals,
    decimalMark: DecimalMark,
    grouping: Grouping
): NumberFormat => {
    const decimalCount = decimals === "off" ? 0 : Number(decimals)
    let groupingMark = ""

    if (grouping === "space") groupingMark = GROUP_SPACE
    if (grouping === "thinSpace") groupingMark = THIN_SPACE
    if (grouping === "comma") groupingMark = ","
    if (grouping === "dot") groupingMark = "."
    if (decimalCount > 0 && groupingMark === decimalMark) {
        groupingMark = GROUP_SPACE
    }

    return {
        decimals: decimalCount,
        decimalMark,
        digits,
        groupingMark,
        formatter: new Intl.NumberFormat("en-US", {
            useGrouping: false,
            minimumFractionDigits: decimalCount,
            maximumFractionDigits: decimalCount,
        }),
    }
}

// Hooks

const useIsoLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// Component

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 80
 */
export default function BetterCounter(props: BetterCounterProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const numberRef = React.useRef<HTMLSpanElement | null>(null)
    const sourceGhostRefs = React.useRef<(HTMLSpanElement | null)[]>([])
    const stateRef = React.useRef<CounterState>({
        sourceKey: "",
        value: null,
        segmentFrom: DEFAULT_FROM,
    })

    const value = clamp(
        finiteNumber(props.value, DEFAULT_VALUE),
        -MAX_ABSOLUTE_VALUE,
        MAX_ABSOLUTE_VALUE
    )
    const prefix = String(props.prefix ?? "")
    const suffix = String(props.suffix ?? "")
    const digits = Math.round(
        clamp(
            finiteNumber(props.digits, DEFAULT_DIGITS),
            DEFAULT_DIGITS,
            MAX_DIGITS
        )
    )
    const decimals = pick(props.decimals, DECIMALS_OPTIONS, "off")
    const decimalMark: DecimalMark =
        pick(props.decimalMark, DECIMAL_MARK_OPTIONS, "dot") === "comma"
            ? ","
            : "."
    const grouping = pick(props.grouping, GROUPING_OPTIONS, "none")
    const start = pick(props.start, START_OPTIONS, "zero")
    const from =
        start === "custom"
            ? clamp(
                  finiteNumber(props.from, DEFAULT_FROM),
                  -MAX_ABSOLUTE_VALUE,
                  MAX_ABSOLUTE_VALUE
              )
            : DEFAULT_FROM
    const duration = clamp(
        finiteNumber(props.duration, DEFAULT_DURATION),
        0,
        MAX_DURATION
    )
    const delay = clamp(finiteNumber(props.delay, DEFAULT_DELAY), 0, MAX_DELAY)
    const easing = pick(props.easing, EASING_OPTIONS, "easeOut")
    const aboveFold = pick(props.aboveFold, ABOVE_FOLD_OPTIONS, "animate")
    const stableWidth = props.stableWidth !== false
    const tabular = props.tabular === true
    const layerAlign = pick(props.layerAlign, ALIGN_OPTIONS, "center")
    const textAlign = pick(props.textAlign, ALIGN_OPTIONS, "center")
    const affixAlign = pick(props.affixAlign, AFFIX_ALIGN_OPTIONS, "baseline")
    const affixGap = Math.round(clamp(finiteNumber(props.affixGap, 0), 0, 120))
    const numberColor = props.numberColor || DEFAULT_NUMBER_COLOR
    const affixColor = props.affixColor || DEFAULT_NUMBER_COLOR
    const format = React.useMemo(
        () => resolveNumberFormat(digits, decimals, decimalMark, grouping),
        [digits, decimals, decimalMark, grouping]
    )
    const startText = formatNumber(from, format)
    const finalText = formatNumber(value, format)
    const initialText =
        duration > 0 && aboveFold !== "final" ? startText : finalText
    const accessibleText = `${prefix}${finalText}${suffix}`
    const ghostTexts = stableWidth
        ? [...getWidthSamples(startText), ...getWidthSamples(finalText)]
        : []
    const sourceKey = `${start}:${from}`
    const numberStyle: CSSProperties = {
        ...DEFAULT_FONT,
        ...(props.numberFont ?? {}),
        ...TEXT_BASE_STYLE,
        color: numberColor,
        ...(tabular ? { fontVariantNumeric: "tabular-nums" } : {}),
    }
    const affixStyle: CSSProperties = {
        ...DEFAULT_FONT,
        ...(props.affixFont ?? props.numberFont ?? {}),
        ...TEXT_BASE_STYLE,
        color: affixColor,
    }

    useIsoLayoutEffect(() => {
        const node = numberRef.current
        if (!node) return

        const state = stateRef.current
        if (state.sourceKey !== sourceKey) {
            state.sourceKey = sourceKey
            state.value = null
        }

        const previousValue = state.value
        const animationFrom = previousValue ?? from
        const sourceText = formatNumber(animationFrom, format)
        state.segmentFrom = animationFrom

        const paint = (numberValue: number) => {
            state.value = numberValue
            const text =
                numberValue === value
                    ? finalText
                    : formatNumber(numberValue, format)
            if (node.textContent !== text) node.textContent = text
        }

        if (
            isStaticRenderer ||
            duration === 0 ||
            sourceText === finalText ||
            typeof window === "undefined" ||
            typeof window.requestAnimationFrame !== "function" ||
            typeof window.IntersectionObserver !== "function"
        ) {
            paint(value)
            return
        }

        const media =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        if (media?.matches) {
            paint(value)
            return
        }

        let frame: number | null = null
        let timeout: number | null = null
        let observer: IntersectionObserver | null = null
        let disposed = false
        let started = false
        let visible = false
        let firstObservation = true
        let startTime: number | null = null
        const durationMs = duration * 1000

        const dispose = () => {
            disposed = true
            if (frame !== null) window.cancelAnimationFrame(frame)
            if (timeout !== null) window.clearTimeout(timeout)
            observer?.disconnect()
            media?.removeEventListener("change", onMotionChange)
            frame = null
            timeout = null
            observer = null
        }

        const finish = () => {
            if (disposed) return
            paint(value)
            dispose()
        }

        const onMotionChange = (event: MediaQueryListEvent) => {
            if (event.matches) finish()
        }

        const step = (time: number) => {
            frame = null
            if (disposed) return
            if (startTime === null) startTime = time

            const progress = clamp((time - startTime) / durationMs, 0, 1)
            if (progress === 1) {
                finish()
                return
            }

            const eased = getEasedProgress(progress, easing)
            paint(animationFrom + (value - animationFrom) * eased)
            frame = window.requestAnimationFrame(step)
        }

        const begin = () => {
            if (disposed || started || !visible) return
            started = true
            observer?.disconnect()
            observer = null
            frame = window.requestAnimationFrame(step)
        }

        if (aboveFold !== "final" || previousValue !== null)
            paint(animationFrom)
        media?.addEventListener("change", onMotionChange)

        observer = new window.IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry || disposed || started) return
                visible =
                    entry.isIntersecting &&
                    entry.intersectionRatio >= VIEWPORT_THRESHOLD

                if (firstObservation) {
                    firstObservation = false
                    if (
                        previousValue === null &&
                        aboveFold === "final" &&
                        visible
                    ) {
                        finish()
                        return
                    }
                    paint(animationFrom)
                }

                if (!visible) {
                    if (timeout !== null) window.clearTimeout(timeout)
                    timeout = null
                    return
                }
                if (timeout !== null) return

                if (delay > 0) {
                    timeout = window.setTimeout(() => {
                        timeout = null
                        begin()
                    }, delay * 1000)
                } else {
                    begin()
                }
            },
            { threshold: VIEWPORT_THRESHOLD }
        )
        observer.observe(rootRef.current ?? node)

        return dispose
    }, [
        isStaticRenderer,
        sourceKey,
        from,
        value,
        format,
        finalText,
        duration,
        delay,
        easing,
        aboveFold,
    ])

    useIsoLayoutEffect(() => {
        if (!stableWidth) return

        // Keep the reserve tied to the animation segment, not its current frame.
        const state = stateRef.current
        const source = state.sourceKey === sourceKey ? state.segmentFrom : from
        const samples = getWidthSamples(formatNumber(source, format))
        samples.forEach((text, index) => {
            const node = sourceGhostRefs.current[index]
            if (node && node.textContent !== text) node.textContent = text
        })
    }, [stableWidth, sourceKey, from, value, format])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                boxSizing: "border-box",
                ...props.style,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    justifyContent: alignToJustify(layerAlign),
                    alignItems: "center",
                    overflow: "visible",
                }}
            >
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: alignAffixes(affixAlign),
                        gap: affixGap > 0 ? `${affixGap}px` : undefined,
                        flexWrap: "nowrap",
                        overflow: "visible",
                        pointerEvents: "none",
                        ...TEXT_BASE_STYLE,
                        ...NO_SHRINK_STYLE,
                        ...MAX_CONTENT_STYLE,
                    }}
                >
                    {prefix ? (
                        <span style={{ ...affixStyle, ...NO_SHRINK_STYLE }}>
                            {prefix}
                        </span>
                    ) : null}
                    <span
                        style={{
                            display: stableWidth
                                ? "inline-grid"
                                : "inline-block",
                            justifyItems: stableWidth
                                ? alignToItems(textAlign)
                                : undefined,
                            alignItems: "center",
                            overflow: "visible",
                            ...NO_SHRINK_STYLE,
                            ...MAX_CONTENT_STYLE,
                            ...numberStyle,
                        }}
                    >
                        {ghostTexts.map((text, index) => (
                            <span
                                key={index}
                                ref={
                                    index <= WIDTH_SAMPLE_DIGITS.length
                                        ? (node) => {
                                              sourceGhostRefs.current[index] =
                                                  node
                                          }
                                        : undefined
                                }
                                aria-hidden="true"
                                style={GHOST_STYLE}
                            >
                                {text}
                            </span>
                        ))}
                        <span
                            ref={numberRef}
                            suppressHydrationWarning
                            style={{
                                gridArea: stableWidth ? "1 / 1" : undefined,
                                ...MAX_CONTENT_STYLE,
                            }}
                        >
                            {isStaticRenderer ? finalText : initialText}
                        </span>
                    </span>
                    {suffix ? (
                        <span style={{ ...affixStyle, ...NO_SHRINK_STYLE }}>
                            {suffix}
                        </span>
                    ) : null}
                </span>
            </div>
            <span style={SCREEN_READER_STYLE}>{accessibleText}</span>
        </div>
    )
}

// Controls

BetterCounter.displayName = "Better Counter"

addPropertyControls(BetterCounter, {
    value: {
        type: ControlType.Number,
        title: "Value",
        defaultValue: DEFAULT_VALUE,
        min: -MAX_ABSOLUTE_VALUE,
        max: MAX_ABSOLUTE_VALUE,
        step: 0.001,
        displayStepper: true,
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
        placeholder: "%",
    },
    digits: {
        type: ControlType.Number,
        title: "Digits",
        defaultValue: DEFAULT_DIGITS,
        min: DEFAULT_DIGITS,
        max: MAX_DIGITS,
        step: 1,
        displayStepper: true,
    },
    grouping: {
        type: ControlType.Enum,
        title: "Grouping",
        options: GROUPING_OPTIONS,
        optionTitles: ["None", "Space", "Thin Space", "Comma", "Dot"],
        defaultValue: "none",
    },
    decimals: {
        type: ControlType.Enum,
        title: "Decimals",
        options: DECIMALS_OPTIONS,
        optionTitles: ["Off", "1", "2", "3"],
        defaultValue: "off",
        displaySegmentedControl: true,
    },
    decimalMark: {
        type: ControlType.Enum,
        title: "Mark",
        options: DECIMAL_MARK_OPTIONS,
        optionTitles: ["Dot", "Comma"],
        defaultValue: "dot",
        displaySegmentedControl: true,
    },
    start: {
        type: ControlType.Enum,
        title: "Start",
        options: START_OPTIONS,
        optionTitles: ["From 0", "Custom"],
        defaultValue: "zero",
        displaySegmentedControl: true,
    },
    from: {
        type: ControlType.Number,
        title: "From",
        defaultValue: DEFAULT_FROM,
        min: -MAX_ABSOLUTE_VALUE,
        max: MAX_ABSOLUTE_VALUE,
        step: 0.001,
        displayStepper: true,
        hidden: (props: Partial<BetterCounterProps>) =>
            props.start !== "custom",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: DEFAULT_DURATION,
        min: 0,
        max: MAX_DURATION,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: DEFAULT_DELAY,
        min: 0,
        max: MAX_DELAY,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: EASING_OPTIONS,
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "easeOut",
    },
    aboveFold: {
        type: ControlType.Enum,
        title: "Above Fold",
        options: ABOVE_FOLD_OPTIONS,
        optionTitles: ["Animate", "Final"],
        defaultValue: "animate",
        displaySegmentedControl: true,
    },
    stableWidth: {
        type: ControlType.Boolean,
        title: "Stable Width",
        defaultValue: true,
    },
    tabular: {
        type: ControlType.Boolean,
        title: "Tabular",
        defaultValue: false,
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: DEFAULT_NUMBER_COLOR,
    },
    affixColor: {
        type: ControlType.Color,
        title: "Affix Color",
        defaultValue: DEFAULT_NUMBER_COLOR,
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT_CONTROL,
    },
    affixFont: {
        type: ControlType.Font,
        title: "Affix Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT_CONTROL,
    },
    affixGap: {
        type: ControlType.Number,
        title: "Affix Gap",
        defaultValue: 0,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    affixAlign: {
        type: ControlType.Enum,
        title: "Affix Align",
        options: AFFIX_ALIGN_OPTIONS,
        optionTitles: ["Baseline", "Top", "Center", "Bottom"],
        defaultValue: "baseline",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Number Align",
        options: ALIGN_OPTIONS,
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (props: Partial<BetterCounterProps>) =>
            props.stableWidth === false,
    },
    layerAlign: {
        type: ControlType.Enum,
        title: "Layer Align",
        options: ALIGN_OPTIONS,
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description: MASH_COMPONENT_CREDIT,
    },
})
