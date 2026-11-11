"use client"

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
import { useState, useEffect, useRef, useMemo } from "react"
import React from "react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CSS_EASINGS: Record<string, string> = {
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
    mechanical: "cubic-bezier(0.77, 0, 0.18, 1)",
    linear: "linear",
}

const FM_EASINGS: Record<string, number[]> = {
    smooth: [0.16, 1, 0.3, 1],
    mechanical: [0.77, 0, 0.18, 1],
    linear: [0, 0, 1, 1],
}

function buildStrip(from: number, to: number, slots: number): number[] {
    const mids = Array.from({ length: slots }, () =>
        Math.floor(Math.random() * 10)
    )
    return [from, ...mids, to]
}

function getSepIndices(len: number): Set<number> {
    const s = new Set<number>()
    if (len <= 3) return s // no separator for 3-digit numbers or fewer
    for (let i = 1; i < len; i++) {
        if ((len - i) % 3 === 0) s.add(i)
    }
    return s
}

// ─── DigitColumn — framer-motion y% calc, exactly like reference ──────────────

interface DigitColumnProps {
    fromDigit: number
    toDigit: number
    direction: "up" | "down"
    randomOffset: number
    cellHeight: number
    fontSize: number
    fontWeight: number
    fontFamily: string
    color: string
    shouldAnimate: boolean
    delay: number
    duration: number
    easing: string
}

function DigitColumn({
    fromDigit,
    toDigit,
    direction,
    randomOffset,
    cellHeight,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    shouldAnimate,
    delay,
    duration,
    easing,
}: DigitColumnProps) {
    const strip = useMemo(
        () => buildStrip(fromDigit, toDigit, randomOffset),
        [fromDigit, toDigit, randomOffset]
    )

    // direction "up": last item in strip = target → animate to -100% + 1 cell
    // direction "down": reverse strip so first item is target, animate to 0
    const displayStrip = direction === "up" ? strip : [...strip].reverse()

    // Reference technique: y calc based on percentage of total strip height
    // -100% of the strip + one cell height = last item perfectly in view
    const finalY = direction === "up" ? `calc(-100% + ${cellHeight}px)` : "0%"
    const initialY = direction === "up" ? "0%" : `calc(-100% + ${cellHeight}px)`

    return (
        <div
            style={{
                height: cellHeight,
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "flex-start",
                flexShrink: 0,
            }}
        >
            <motion.div
                style={{ y: initialY, willChange: "transform" }}
                animate={{ y: shouldAnimate ? finalY : initialY }}
                transition={{
                    duration,
                    delay,
                    ease: FM_EASINGS[easing] ?? FM_EASINGS.smooth,
                }}
            >
                {displayStrip.map((digit, i) => (
                    <div
                        key={i}
                        style={{
                            height: cellHeight,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize,
                            fontWeight,
                            fontFamily,
                            color,
                            lineHeight: 1,
                            userSelect: "none",
                        }}
                    >
                        {digit}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    from: number
    to: number
    // Prefix
    prefix: string
    useSamePrefixColor: boolean
    prefixColor: string
    // Suffix
    suffix: string
    useSameSuffixColor: boolean
    suffixColor: string
    // Thousand separator
    thousandSeparator: boolean
    separatorChar: string
    useSameSeparatorColor: boolean
    separatorColor: string
    // Animation
    direction: "up" | "down"
    randomOffset: number
    gearEffect: boolean
    gearDecay: number
    trigger: "onAppear" | "inView"
    startDelay: number
    easing: "smooth" | "mechanical" | "linear"
    duration: number
    stagger: number
    slotRevealOffset: number
    digitGap: number
    // Typography
    fontFamily: string
    fontSize: number
    fontWeight: number
    lineHeight: number
    color: string
    style?: React.CSSProperties
}

export default function MechanicalOdometerCounter({
    from = 0,
    to = 10000,
    prefix = "",
    useSamePrefixColor = true,
    prefixColor = "#aaaaaa",
    suffix = "",
    useSameSuffixColor = true,
    suffixColor = "#aaaaaa",
    thousandSeparator = false,
    separatorChar = ".",
    useSameSeparatorColor = true,
    separatorColor = "#aaaaaa",
    direction = "up",
    randomOffset = 6,
    gearEffect = true,
    gearDecay = 2.5,
    trigger = "inView",
    startDelay = 0,
    easing = "smooth",
    duration = 1.6,
    stagger = 0.07,
    slotRevealOffset = 0.2,
    digitGap = 2,
    fontFamily = "Inter, sans-serif",
    fontSize = 72,
    fontWeight = 700,
    lineHeight = 1.15,
    color = "#ffffff",
    style,
    ...rest
}: Partial<Props>) {
    const ref = useRef<HTMLDivElement>(null)
    const [shouldAnimate, setShouldAnimate] = useState(false)
    // Which appearing-column indices have their max-width expanded (CSS transition target)
    const [revealedCols, setRevealedCols] = useState<Set<number>>(new Set())

    const isStatic = useIsStaticRenderer()
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (isStatic) return
        if (trigger === "onAppear") {
            const t = setTimeout(
                () => setShouldAnimate(true),
                80 + startDelay * 1000
            )
            return () => clearTimeout(t)
        }
    }, [trigger, isStatic, startDelay])

    useEffect(() => {
        if (isStatic) return
        if (trigger !== "onAppear" && isInView) {
            const t = setTimeout(
                () => setShouldAnimate(true),
                startDelay * 1000
            )
            return () => clearTimeout(t)
        }
    }, [isInView, trigger, isStatic, startDelay])

    const animating = isStatic ? false : shouldAnimate

    // Schedule max-width reveal for each appearing column via CSS transition
    // Each column mounts immediately (maxWidth=0 hidden), strip pre-rolls, then reveals
    useEffect(() => {
        if (isStatic) return
        if (!animating) {
            setRevealedCols(new Set())
            return
        }
        const extra = Math.max(
            0,
            Math.abs(Math.floor(to)).toString().length -
                Math.abs(Math.floor(from)).toString().length
        )
        const timers: ReturnType<typeof setTimeout>[] = []
        for (let idx = 0; idx < extra; idx++) {
            // appearOrder 0 = closest to existing digit (reveals first, after one slotRevealOffset)
            const appearOrder = extra - 1 - idx
            const revealAt = (appearOrder + 1) * slotRevealOffset * 1000
            const t = setTimeout(() => {
                setRevealedCols((prev) => new Set([...prev, idx]))
            }, revealAt)
            timers.push(t)
        }
        return () => timers.forEach(clearTimeout)
    }, [animating, from, to, slotRevealOffset, isStatic])

    // ── Digit math ─────────────────────────────────────────────────────────────
    const absFrom = Math.abs(Math.floor(from))
    const absTo = Math.abs(Math.floor(to))
    const fromStr = absFrom.toString()
    const toStr = absTo.toString()
    const fromLen = fromStr.length
    const toLen = toStr.length
    const extraCols = Math.max(0, toLen - fromLen)
    const fromDigs = fromStr.split("").map(Number)
    const toDigs = toStr.split("").map(Number)
    const isNeg = to < 0

    const columns = toDigs.map((toDigit, i) => {
        const isAppearing = i < extraCols
        const fromDigit = isAppearing ? 0 : fromDigs[i - extraCols]
        return { toDigit, fromDigit, isAppearing }
    })

    const cellH = fontSize * lineHeight
    const sepIndices = thousandSeparator
        ? getSepIndices(toLen)
        : new Set<number>()

    const resolvedPrefix = useSamePrefixColor ? color : prefixColor
    const resolvedSuffix = useSameSuffixColor ? color : suffixColor
    const resolvedSep = useSameSeparatorColor ? color : separatorColor

    const affixStyle = (c: string): React.CSSProperties => ({
        fontSize,
        fontWeight,
        fontFamily,
        color: c,
        lineHeight: 1,
        userSelect: "none",
        display: "inline-flex",
        alignItems: "center",
        height: cellH,
        flexShrink: 0,
    })

    // Approximate max digit width for the CSS max-width reveal target
    // Generous enough for any font, digit never wider than 1em
    const revealTarget = `${fontSize}px`

    // ── Static render path ────────────────────────────────────────────────
    // In static rendering contexts (canvas thumbnails, code export, preview)
    // we skip all timers, framer-motion work, and CSS transitions. The final
    // non-animated state is rendered directly as plain text so the editor
    // stays performant and export artifacts are clean.
    if (isStatic) {
        const staticDigits: React.ReactNode[] = []
        toDigs.forEach((d, i) => {
            if (sepIndices.has(i)) {
                staticDigits.push(
                    <span key={`sep-${i}`} style={affixStyle(resolvedSep)}>
                        {separatorChar}
                    </span>
                )
            }
            staticDigits.push(
                <span key={`d-${i}`} style={affixStyle(color)}>
                    {d}
                </span>
            )
        })

        return (
            <div
                ref={ref}
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    ...style,
                }}
                {...rest}
            >
                {prefix ? (
                    <span style={affixStyle(resolvedPrefix)}>{prefix}</span>
                ) : null}
                {isNeg ? <span style={affixStyle(color)}>-</span> : null}
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: digitGap,
                    }}
                >
                    {staticDigits}
                </div>
                {suffix ? (
                    <span style={affixStyle(resolvedSuffix)}>{suffix}</span>
                ) : null}
            </div>
        )
    }

    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                justifyContent: "flex-end", // right-anchored → prefix drifts left as digits expand
                alignItems: "center",
                width: "100%",
                height: "100%",
                overflow: "visible",
                ...style,
            }}
            {...rest}
        >
            {/* Prefix — moves left naturally as CSS flex reflows when columns expand */}
            {prefix ? (
                <span style={affixStyle(resolvedPrefix)}>{prefix}</span>
            ) : null}
            {isNeg ? <span style={affixStyle(color)}>-</span> : null}

            {/* Digit columns — all always in DOM; appearing ones start at maxWidth:0 */}
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "flex-start",
                    gap: digitGap,
                }}
            >
                {columns.map(({ fromDigit, toDigit, isAppearing }, i) => {
                    const posFromRight = toLen - 1 - i
                    const gearSlots = gearEffect
                        ? Math.round(
                              randomOffset / Math.pow(gearDecay, posFromRight)
                          )
                        : randomOffset
                    // If digit actually changes, guarantee at least 3 slots so animation is visible
                    const digitChanges = fromDigit !== toDigit
                    const adjustedSlots = Math.max(
                        digitChanges ? 3 : 0,
                        gearSlots
                    )

                    const appearOrder = isAppearing ? extraCols - 1 - i : -1
                    const revealAt = isAppearing
                        ? (appearOrder + 1) * slotRevealOffset
                        : 0

                    // Strip starts 0.1s before reveal so it's just beginning to move when visible
                    // (not at t=0, which would mean the animation is nearly done by reveal time)
                    const PRE_ROLL = 0.1
                    const stripDelay = isAppearing
                        ? Math.max(0, revealAt - PRE_ROLL)
                        : (i - extraCols) * stagger

                    const isRevealed = !isAppearing || revealedCols.has(i)
                    const showSep = sepIndices.has(i)

                    // Smooth CSS max-width expand — the column "slides open" revealing the strip
                    const colStyle: React.CSSProperties = isAppearing
                        ? {
                              display: "inline-flex",
                              alignItems: "flex-start",
                              maxWidth: isRevealed ? revealTarget : "0px",
                              overflow: "hidden",
                              flexShrink: 0,
                              transition: `max-width 0.4s ${CSS_EASINGS.smooth}`,
                          }
                        : {
                              display: "inline-flex",
                              alignItems: "flex-start",
                              flexShrink: 0,
                          }

                    return (
                        <div key={i} style={colStyle}>
                            {showSep ? (
                                <span
                                    style={{
                                        ...affixStyle(resolvedSep),
                                        opacity: isAppearing
                                            ? isRevealed
                                                ? 1
                                                : 0
                                            : 1,
                                        transition: isAppearing
                                            ? "opacity 0.3s ease-out"
                                            : "none",
                                    }}
                                >
                                    {separatorChar}
                                </span>
                            ) : null}
                            <DigitColumn
                                fromDigit={fromDigit}
                                toDigit={toDigit}
                                direction={direction}
                                randomOffset={adjustedSlots}
                                cellHeight={cellH}
                                fontSize={fontSize}
                                fontWeight={fontWeight}
                                fontFamily={fontFamily}
                                color={color}
                                shouldAnimate={animating}
                                delay={stripDelay}
                                duration={duration}
                                easing={easing}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Suffix */}
            {suffix ? (
                <span style={affixStyle(resolvedSuffix)}>{suffix}</span>
            ) : null}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(MechanicalOdometerCounter, {
    // ── Values
    from: { type: ControlType.Number, title: "From", defaultValue: 0 },
    to: { type: ControlType.Number, title: "To", defaultValue: 10000 },

    // ── Prefix
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "€, $, …",
    },
    useSamePrefixColor: {
        type: ControlType.Boolean,
        title: "Prefix Color",
        defaultValue: true,
        enabledTitle: "Same as digits",
        disabledTitle: "Custom",
    },
    prefixColor: {
        type: ControlType.Color,
        title: " ",
        defaultValue: "#aaaaaa",
        hidden(props) {
            return props.useSamePrefixColor !== false
        },
    },

    // ── Suffix
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "+, %, k, …",
    },
    useSameSuffixColor: {
        type: ControlType.Boolean,
        title: "Suffix Color",
        defaultValue: true,
        enabledTitle: "Same as digits",
        disabledTitle: "Custom",
    },
    suffixColor: {
        type: ControlType.Color,
        title: " ",
        defaultValue: "#aaaaaa",
        hidden(props) {
            return props.useSameSuffixColor !== false
        },
    },

    // ── Thousand separator
    thousandSeparator: {
        type: ControlType.Boolean,
        title: "Thousand Sep.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Inserts a separator every 3 digits — e.g. 10.000",
    },
    separatorChar: {
        type: ControlType.Enum,
        title: "Sep. Char",
        options: [".", ",", "'", "\u2009"],
        optionTitles: ["Dot  .", "Comma ,", "Apostrophe '", "Thin space"],
        defaultValue: ".",
        hidden(props) {
            return !props.thousandSeparator
        },
    },
    useSameSeparatorColor: {
        type: ControlType.Boolean,
        title: "Sep. Color",
        defaultValue: true,
        enabledTitle: "Same as digits",
        disabledTitle: "Custom",
        hidden(props) {
            return !props.thousandSeparator
        },
    },
    separatorColor: {
        type: ControlType.Color,
        title: " ",
        defaultValue: "#aaaaaa",
        hidden(props) {
            return (
                !props.thousandSeparator ||
                props.useSameSeparatorColor !== false
            )
        },
    },

    // ── Animation
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["↑ Up", "↓ Down"],
        defaultValue: "up",
    },
    randomOffset: {
        type: ControlType.Number,
        title: "Random Slots",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
        displayStepper: true,
        description:
            "Max slots for the rightmost digit — reduces with Gear Effect",
    },
    gearEffect: {
        type: ControlType.Boolean,
        title: "Gear Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Right digits spin most, left digits progressively less",
    },
    gearDecay: {
        type: ControlType.Number,
        title: "Gear Decay",
        defaultValue: 2.5,
        min: 1.2,
        max: 10,
        step: 0.1,
        displayStepper: true,
        description: "2 = halves per step, 10 = drops sharply",
        hidden(props) {
            return !props.gearEffect
        },
    },
    slotRevealOffset: {
        type: ControlType.Number,
        title: "Slot Reveal Delay",
        defaultValue: 0.2,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        description:
            "Time between each new digit slot revealing. Strip pre-rolls during this time so digits appear already moving.",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["smooth", "mechanical", "linear"],
        optionTitles: ["Smooth", "Mechanical", "Linear"],
        defaultValue: "smooth",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["onAppear", "inView"],
        optionTitles: ["On Appear", "Layer in View"],
        defaultValue: "inView",
    },
    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        description:
            "How long the number stays still before the animation begins",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.6,
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.07,
        min: 0,
        max: 2,
        step: 0.01,
        unit: "s",
        description: "Delay between non-appearing digit columns",
    },
    digitGap: {
        type: ControlType.Number,
        title: "Digit Gap",
        defaultValue: 2,
        min: -20,
        max: 40,
        step: 1,
        unit: "px",
    },

    // ── Typography
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 72,
        min: 10,
        max: 400,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 700,
        min: 100,
        max: 900,
        step: 100,
        displayStepper: true,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.15,
        min: 0.8,
        max: 2.5,
        step: 0.05,
        description: "Controls digit cell height",
    },
    color: {
        type: ControlType.Color,
        title: "Digit Color",
        defaultValue: "#ffffff",
    },
})
