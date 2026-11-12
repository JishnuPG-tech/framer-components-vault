import * as React from "react"
import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { motion, useAnimation, useInView } from "framer-motion"
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
 * NumberOdometer renders an animated odometer-style counter with a label
 * and caption.
 *
 * Controls (kept simple):
 *  - Value            (top level, raw number input)
 *  - Content          (prefix, suffix, grouping, label, caption)
 *  - Style            (fonts + colors)
 *  - Settings         (trigger, duration, stagger, align, gap)
 */

const ROW_HEIGHT_EM = 1 // each digit "row" is 1em tall

// Fixed values for options that no longer have controls.
const SPIN_LOOPS = 2
const PADDING = "2em"
const BACKGROUND_COLOR = "transparent"
const BORDER_RADIUS = "0px"
const VERTICAL_ALIGN: "flex-start" | "center" | "flex-end" = "center"

// ---------- helpers ----------

function formatValue(value: number, groupingChar: string): string {
    const rounded = Math.round(Number.isFinite(value) ? value : 0)
    // format with a plain grouping separator, then swap to the desired char
    const withCommas = rounded.toLocaleString("en-US")
    return withCommas.split(",").join(groupingChar)
}

function isDigitChar(c: string) {
    return /[0-9]/.test(c)
}

function getFontSizeNumber(
    value: number | string | undefined,
    fallback: number
) {
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const parsed = parseFloat(value)
        if (!Number.isNaN(parsed)) return parsed
    }
    return fallback
}

// ---------- single animated digit reel ----------

interface DigitReelProps {
    digit: number
    play: boolean
    delay: number
    duration: number
    loops: number
    font: React.CSSProperties
    fontSize: number
    color: string
    ease: [number, number, number, number]
}

function DigitReel({
    digit,
    play,
    delay,
    duration,
    loops,
    font,
    fontSize,
    color,
    ease,
}: DigitReelProps) {
    const controls = useAnimation()
    const rowHeightPx = Math.round(fontSize * ROW_HEIGHT_EM)

    // Build the strip: `loops` full passes of 0-9, then climb to the target digit
    const sequence = useMemo(() => {
        const seq: number[] = []
        for (let l = 0; l < loops; l++) {
            for (let d = 0; d <= 9; d++) seq.push(d)
        }
        for (let d = 0; d <= digit; d++) seq.push(d)
        return seq
    }, [digit, loops])

    useEffect(() => {
        if (!play) return
        controls.set({ y: 0, filter: "blur(0px)" })
        controls.start({
            y: -(sequence.length - 1) * rowHeightPx,
            filter: ["blur(0px)", "blur(10px)", "blur(0px)"],
            transition: {
                y: { delay, duration, ease },
                filter: {
                    delay,
                    duration,
                    times: [0, 0.35, 1],
                    ease: "easeOut",
                },
            },
        })
    }, [play, sequence, delay, duration, ease, controls, rowHeightPx])

    return (
        <div
            style={{
                position: "relative",
                height: rowHeightPx,
                width: Math.round(fontSize * 0.62),
                overflow: "hidden",
                display: "inline-block",
            }}
        >
            <motion.div
                animate={controls}
                initial={{ y: 0 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    willChange: "transform, filter",
                }}
            >
                {sequence.map((d, i) => (
                    <span
                        key={i}
                        style={{
                            height: rowHeightPx,
                            lineHeight: `${rowHeightPx}px`,
                            ...font,
                            fontSize,
                            color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {d}
                    </span>
                ))}
            </motion.div>
        </div>
    )
}

// ---------- static (non-spinning) character, e.g. separators ----------

function StaticChar({
    char,
    font,
    fontSize,
    color,
}: {
    char: string
    font: React.CSSProperties
    fontSize: number
    color: string
}) {
    const rowHeightPx = Math.round(fontSize * ROW_HEIGHT_EM)
    return (
        <span
            style={{
                ...font,
                fontSize,
                color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: rowHeightPx,
                lineHeight: `${rowHeightPx}px`,
            }}
        >
            {char}
        </span>
    )
}

// ---------- main component ----------

interface FontValue {
    fontSize?: number | string
    fontFamily?: string
    fontWeight?: number
    fontStyle?: "normal" | "italic"
    variant?: string
    letterSpacing?: number | string
    lineHeight?: number | string
    textAlign?: "left" | "center" | "right"
}

interface NumberOdometerProps {
    value?: number
    content?: {
        prefix?: string
        suffix?: string
        groupingChar?: string
        label?: string
        caption?: string
    }
    style?: {
        numberFont?: FontValue
        labelFont?: FontValue
        captionFont?: FontValue
        numberColor?: string
        labelColor?: string
        captionColor?: string
    }
    settings?: {
        trigger?: "mount" | "inView"
        duration?: number
        digitStagger?: number
        horizontalAlign?: "left" | "center" | "right"
        gapScale?: number
    }
}

const DEFAULT_NUMBER_FONT: FontValue = {
    fontSize: 96,
    variant: "Bold",
    letterSpacing: "-0.01em",
    lineHeight: "1em",
    textAlign: "center",
}
const DEFAULT_LABEL_FONT: FontValue = {
    fontSize: "18px",
    variant: "Medium",
    letterSpacing: "0.2em",
    lineHeight: "1em",
    textAlign: "center",
}
const DEFAULT_CAPTION_FONT: FontValue = {
    fontSize: "18px",
    variant: "Regular",
    letterSpacing: "-0.01em",
    lineHeight: "1.2em",
    textAlign: "center",
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NumberOdometer(props: NumberOdometerProps) {
    const value = props.value ?? 347245

    const prefix = props.content?.prefix ?? "$"
    const suffix = props.content?.suffix ?? ""
    const groupingChar = props.content?.groupingChar ?? ","
    const label = props.content?.label ?? "ANNUAL REVENUE · SPECIALTY COFFEE"
    const caption =
        props.content?.caption ??
        "from small-batch roasts shipped to cafés worldwide."

    const numberFont = props.style?.numberFont ?? DEFAULT_NUMBER_FONT
    const labelFont = props.style?.labelFont ?? DEFAULT_LABEL_FONT
    const captionFont = props.style?.captionFont ?? DEFAULT_CAPTION_FONT
    const numberColor = props.style?.numberColor ?? "#F5F5F5"
    const labelColor = props.style?.labelColor ?? "#8A8A8A"
    const captionColor = props.style?.captionColor ?? "#8A8A8A"

    const trigger = props.settings?.trigger ?? "inView"
    const duration = props.settings?.duration ?? 2.6
    const digitStagger = props.settings?.digitStagger ?? 0.15
    const horizontalAlign = props.settings?.horizontalAlign ?? "center"
    const gapScale = props.settings?.gapScale ?? 0.3

    const fontSize = getFontSizeNumber(numberFont.fontSize, 96)
    const numberFontStyle: React.CSSProperties = {
        fontFamily: numberFont.fontFamily,
        fontWeight: numberFont.fontWeight,
        fontStyle: numberFont.fontStyle,
        letterSpacing: numberFont.letterSpacing,
        lineHeight: numberFont.lineHeight,
        textAlign: numberFont.textAlign,
    }

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: "-10% 0px" })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        startTransition(() => setMounted(true))
    }, [])

    const play = isStatic
        ? false
        : trigger === "mount"
          ? mounted
          : mounted && isInView

    const formatted = useMemo(
        () => formatValue(value, groupingChar),
        [value, groupingChar]
    )
    const chars = useMemo(() => formatted.split(""), [formatted])

    // rightmost digit settles first: order counted from the right, digits only
    const digitOrders = useMemo(() => {
        let order = 0
        const orders: number[] = new Array(chars.length).fill(0)
        for (let i = chars.length - 1; i >= 0; i--) {
            if (isDigitChar(chars[i])) {
                orders[i] = order
                order += 1
            }
        }
        return orders
    }, [chars])

    const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

    const alignItems =
        horizontalAlign === "left"
            ? "flex-start"
            : horizontalAlign === "right"
              ? "flex-end"
              : "center"

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems,
                justifyContent: VERTICAL_ALIGN,
                gap: fontSize * gapScale,
                background: BACKGROUND_COLOR,
                padding: PADDING,
                borderRadius: BORDER_RADIUS,
                boxSizing: "border-box",
            }}
        >
            {label && (
                <div
                    style={{
                        ...labelFont,
                        fontSize: labelFont.fontSize ?? fontSize * 0.16,
                        textTransform: "uppercase",
                        color: labelColor,
                        width: "100%",
                        textAlign: horizontalAlign,
                    }}
                >
                    {label}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1,
                    alignSelf: alignItems,
                }}
            >
                {prefix && (
                    <StaticChar
                        char={prefix}
                        font={numberFontStyle}
                        fontSize={fontSize}
                        color={numberColor}
                    />
                )}

                {chars.map((c, i) =>
                    isDigitChar(c) ? (
                        <DigitReel
                            key={i}
                            digit={parseInt(c, 10)}
                            play={play}
                            delay={digitOrders[i] * digitStagger}
                            duration={duration}
                            loops={SPIN_LOOPS}
                            font={numberFontStyle}
                            fontSize={fontSize}
                            color={numberColor}
                            ease={ease}
                        />
                    ) : (
                        <StaticChar
                            key={i}
                            char={c}
                            font={numberFontStyle}
                            fontSize={fontSize}
                            color={numberColor}
                        />
                    )
                )}

                {suffix && (
                    <StaticChar
                        char={suffix}
                        font={numberFontStyle}
                        fontSize={fontSize}
                        color={numberColor}
                    />
                )}
            </div>

            {caption && (
                <div
                    style={{
                        ...captionFont,
                        fontSize: captionFont.fontSize ?? fontSize * 0.18,
                        color: captionColor,
                        width: "100%",
                        textAlign: horizontalAlign,
                    }}
                >
                    {caption}
                </div>
            )}
        </div>
    )
}

addPropertyControls(NumberOdometer, {
    value: {
        type: ControlType.Number,
        title: "Value",
        defaultValue: 347245,
        displayStepper: false,
    },

    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            prefix: {
                type: ControlType.String,
                title: "Prefix",
                defaultValue: "$",
            },
            suffix: {
                type: ControlType.String,
                title: "Suffix",
                defaultValue: "",
            },
            groupingChar: {
                type: ControlType.String,
                title: "Grouping",
                defaultValue: ",",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "ANNUAL REVENUE · SPECIALTY COFFEE",
            },
            caption: {
                type: ControlType.String,
                title: "Caption",
                defaultValue:
                    "from small-batch roasts shipped to cafés worldwide.",
            },
        },
    },

    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            numberFont: {
                type: ControlType.Font,
                title: "Number Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 96,
                    variant: "Bold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                    textAlign: "center",
                },
            },
            labelFont: {
                type: ControlType.Font,
                title: "Label Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Medium",
                    letterSpacing: "0.2em",
                    lineHeight: "1em",
                    textAlign: "center",
                },
            },
            captionFont: {
                type: ControlType.Font,
                title: "Caption Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                    textAlign: "center",
                },
            },
            numberColor: {
                type: ControlType.Color,
                title: "Number",
                defaultValue: "#F5F5F5",
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label",
                defaultValue: "#8A8A8A",
            },
            captionColor: {
                type: ControlType.Color,
                title: "Caption",
                defaultValue: "#8A8A8A",
            },
        },
    },

    settings: {
        type: ControlType.Object,
        title: "Settings",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Trigger",
                options: ["mount", "inView"],
                optionTitles: ["On Mount", "In View"],
                displaySegmentedControl: true,
                defaultValue: "inView",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 2.6,
                min: 0.2,
                max: 10,
                step: 0.1,
            },
            digitStagger: {
                type: ControlType.Number,
                title: "Digit Stagger",
                defaultValue: 0.15,
                min: 0,
                max: 1,
                step: 0.01,
            },
            horizontalAlign: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: "center",
            },
            gapScale: {
                type: ControlType.Number,
                title: "Vertical Gap",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },
})
