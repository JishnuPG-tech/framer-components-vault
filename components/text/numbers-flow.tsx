import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
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
 * Number Flow Progress
 * A big rolling number (odometer-style, digit by digit) with a minimal progress
 * slider underneath. Drag or click the track and the digits roll to the new value.
 *
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const MAX = 100

const clamp = (n: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, n))

const decimalsOf = (n: number) => {
    const s = String(n)
    return s.includes(".") ? s.split(".")[1].length : 0
}

// Returns a finite number clamped to [lo, hi]; used for any configurable value
// that ends up inside a CSS string.
const safeNumber = (n: unknown, fallback: number, lo: number, hi: number) => {
    const v = typeof n === "number" && Number.isFinite(n) ? n : fallback
    return Math.min(hi, Math.max(lo, v))
}

// Reads the line height out of a Framer font object and returns it in "em"
// so the rolling digit columns match the font's own line height setting.
const lineHeightEm = (font: any): number => {
    const lh = font?.lineHeight
    if (typeof lh === "number") return lh > 0 ? lh : 1.1
    if (typeof lh === "string") {
        const n = parseFloat(lh)
        if (!isNaN(n) && n > 0) {
            if (lh.endsWith("em")) return n
            if (lh.endsWith("%")) return n / 100
            if (lh.endsWith("px")) {
                const fs = parseFloat(font?.fontSize)
                if (fs > 0) return n / fs
            }
            if (/^[\d.]+$/.test(lh.trim())) return n
        }
    }
    return 1.1
}

/* -------------------------------------------------------------------------- */
/*  One rolling digit column                                                  */
/* -------------------------------------------------------------------------- */

interface DigitProps {
    digit: number
    lineHeight: number
    fade: number
    spring: { type: "spring"; stiffness: number; damping: number; mass: number }
}

function Digit({ digit, lineHeight, fade, spring }: DigitProps) {
    // `fade` is always a finite number clamped to 0–50 (see safeNumber), so it
    // cannot break out of the gradient string.
    const safeFade = safeNumber(fade, 0, 0, 50)
    const mask = `linear-gradient(to bottom, transparent 0%, #000 ${safeFade}%, #000 ${
        100 - safeFade
    }%, transparent 100%)`

    return (
        <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring}
            style={{
                display: "inline-block",
                position: "relative",
                height: `${lineHeight}em`,
                overflow: "hidden",
                WebkitMaskImage: safeFade > 0 ? mask : undefined,
                maskImage: safeFade > 0 ? mask : undefined,
            }}
        >
            <motion.span
                initial={false}
                animate={{ y: `${-digit * lineHeight}em` }}
                transition={spring}
                style={{ display: "block" }}
            >
                {DIGITS.map((d) => (
                    <span
                        key={d}
                        style={{
                            display: "block",
                            height: `${lineHeight}em`,
                            lineHeight: `${lineHeight}em`,
                            textAlign: "center",
                        }}
                    >
                        {d}
                    </span>
                ))}
            </motion.span>
        </motion.span>
    )
}

/* -------------------------------------------------------------------------- */
/*  Rolling number                                                            */
/* -------------------------------------------------------------------------- */

interface FlowProps {
    value: number
    decimals: number
    prefix: string
    suffix: string
    lineHeight: number
    fade: number
    spring: DigitProps["spring"]
}

function Flow({
    value,
    decimals,
    prefix,
    suffix,
    lineHeight,
    fade,
    spring,
}: FlowProps) {
    const fixed = Math.abs(value).toFixed(decimals)
    const [intPart, fracPart = ""] = fixed.split(".")
    const negative = value < 0 && Number(fixed) !== 0

    // Digits are keyed by place value (counted from the decimal point) so the
    // ones column stays mounted while hundreds/tens appear and disappear.
    const ints = intPart.split("").map((c, i) => ({
        key: `i${intPart.length - 1 - i}`,
        digit: Number(c),
    }))
    const fracs = fracPart.split("").map((c, i) => ({
        key: `f${i}`,
        digit: Number(c),
    }))

    const staticStyle: React.CSSProperties = {
        display: "inline-block",
        height: `${lineHeight}em`,
        lineHeight: `${lineHeight}em`,
        whiteSpace: "pre",
    }

    return (
        <span
            aria-hidden
            style={{
                display: "inline-flex",
                alignItems: "flex-start",
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {prefix && <span style={staticStyle}>{prefix}</span>}
            {negative && <span style={staticStyle}>-</span>}
            <AnimatePresence initial={false}>
                {ints.map((d) => (
                    <Digit
                        key={d.key}
                        digit={d.digit}
                        lineHeight={lineHeight}
                        fade={fade}
                        spring={spring}
                    />
                ))}
            </AnimatePresence>
            {decimals > 0 && <span style={staticStyle}>.</span>}
            <AnimatePresence initial={false}>
                {fracs.map((d) => (
                    <Digit
                        key={d.key}
                        digit={d.digit}
                        lineHeight={lineHeight}
                        fade={fade}
                        spring={spring}
                    />
                ))}
            </AnimatePresence>
            {suffix && <span style={staticStyle}>{suffix}</span>}
        </span>
    )
}

/* -------------------------------------------------------------------------- */
/*  Defaults for the grouped controls                                         */
/* -------------------------------------------------------------------------- */

const DEFAULT_NUMBER = {
    value: 69,
    min: 0,
    step: 1,
    prefix: "",
    suffix: "%",
    font: { fontSize: "128px", fontWeight: 300, lineHeight: "1.1em" } as any,
    color: "#FFFFFF",
    spacing: 24,
}

const DEFAULT_LABEL = {
    show: true,
    text: "For progress",
    font: { fontSize: "16px", lineHeight: "1.3em" } as any,
    color: "#BDB4A7",
}

const DEFAULT_TRACK = {
    trackColor: "rgba(255,255,255,0.16)",
    trackHeight: 2,
    thumbSize: 22,
    thumbGrow: 1.15,
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface Props {
    number: Partial<typeof DEFAULT_NUMBER>
    label: Partial<typeof DEFAULT_LABEL>
    track: Partial<typeof DEFAULT_TRACK>

    // Animation (kept in code, not exposed in the property panel)
    thumbSpring: number
    stiffness: number
    damping: number
    mass: number
    fade: number

    onChange?: (value: number) => void
    style?: React.CSSProperties
}

export default function NumberFlowProgress(props: Props) {
    const { thumbSpring, stiffness, damping, mass, fade, onChange, style } =
        props
    const isStatic = useIsStaticRenderer()

    const n = { ...DEFAULT_NUMBER, ...(props.number || {}) }
    const l = { ...DEFAULT_LABEL, ...(props.label || {}) }
    const t = { ...DEFAULT_TRACK, ...(props.track || {}) }

    const {
        value: valueProp,
        min,
        step,
        prefix,
        suffix,
        font,
        color,
        spacing,
    } = n
    const { trackColor, trackHeight, thumbSize, thumbGrow } = t

    const lo = Math.min(safeNumber(min, 0, -100000, 100000), MAX)
    const hi = MAX
    const range = hi - lo || 1
    const decimals = Math.min(decimalsOf(step > 0 ? step : 1), 4)
    const lineHeight = lineHeightEm(font)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canInteract = !isCanvas

    const [value, setValue] = useState(() => clamp(valueProp, lo, hi))
    const [dragging, setDragging] = useState(false)
    const trackRef = useRef<HTMLDivElement>(null)

    // Keep in sync when the prop changes (variables, canvas edits, etc.)
    useEffect(() => {
        setValue(clamp(valueProp, lo, hi))
    }, [valueProp, lo, hi])

    const pct = (value - lo) / range

    // Thumb position (spring-smoothed so click-to-jump feels fluid)
    const pctSpring = useSpring(pct, {
        stiffness: thumbSpring,
        damping: Math.sqrt(thumbSpring) * 2 * 0.9,
        mass: 1,
    })
    useEffect(() => {
        // Static renderer (thumbnails, exports): no animation, jump straight there
        if (isStatic) pctSpring.jump(pct)
        else pctSpring.set(pct)
    }, [pct, pctSpring, isStatic])

    const thumbLeft = useTransform(
        pctSpring,
        (p) => `calc(${p * 100}% - ${p * thumbSize}px)`
    )
    const fillWidth = useTransform(
        pctSpring,
        (p) => `calc(${p * 100}% - ${p * thumbSize}px + ${thumbSize / 2}px)`
    )

    const commit = useCallback(
        (raw: number) => {
            const stepSafe = step > 0 ? step : 1
            const snapped = Math.round((raw - lo) / stepSafe) * stepSafe + lo
            const next = clamp(
                Number(snapped.toFixed(Math.max(decimalsOf(stepSafe), 6))),
                lo,
                hi
            )
            setValue((prev) => {
                if (prev !== next) onChange?.(next)
                return next
            })
        },
        [step, lo, hi, onChange]
    )

    const fromPointer = useCallback(
        (clientX: number) => {
            const el = trackRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const usable = rect.width - thumbSize
            if (usable <= 0) return
            const p = clamp(
                (clientX - rect.left - thumbSize / 2) / usable,
                0,
                1
            )
            commit(lo + p * range)
        },
        [thumbSize, lo, range, commit]
    )

    const onPointerDown = (e: React.PointerEvent) => {
        if (!canInteract) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        fromPointer(e.clientX)
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (dragging) fromPointer(e.clientX)
    }
    const onPointerUp = (e: React.PointerEvent) => {
        if (!dragging) return
        setDragging(false)
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
    }
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!canInteract) return
        const s = step > 0 ? step : 1
        const map: Record<string, number> = {
            ArrowRight: value + s,
            ArrowUp: value + s,
            ArrowLeft: value - s,
            ArrowDown: value - s,
            PageUp: value + s * 10,
            PageDown: value - s * 10,
            Home: lo,
            End: hi,
        }
        if (e.key in map) {
            e.preventDefault()
            commit(map[e.key])
        }
    }

    // In the static renderer every transition is instant, so the output is a
    // plain styled element with no animation.
    const spring = isStatic
        ? ({ duration: 0 } as any)
        : {
              type: "spring" as const,
              stiffness,
              damping,
              mass,
          }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing,
                width: "100%",
                height: "100%",
                overflow: "visible",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            {l.show && l.text && (
                <div
                    style={{
                        ...l.font,
                        color: l.color,
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {l.text}
                </div>
            )}

            <div
                role="status"
                aria-label={`${prefix}${value.toFixed(decimals)}${suffix}`}
                style={{
                    ...font,
                    color,
                    textAlign: "center",
                    lineHeight: `${lineHeight}em`,
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                <Flow
                    value={value}
                    decimals={decimals}
                    prefix={prefix}
                    suffix={suffix}
                    lineHeight={lineHeight}
                    fade={fade}
                    spring={spring}
                />
            </div>

            <div
                ref={trackRef}
                role="slider"
                tabIndex={canInteract ? 0 : -1}
                aria-valuemin={lo}
                aria-valuemax={hi}
                aria-valuenow={value}
                aria-label={l.text || "Progress"}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                style={{
                    position: "relative",
                    width: "100%",
                    height: Math.max(thumbSize, 24),
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    cursor: canInteract
                        ? dragging
                            ? "grabbing"
                            : "pointer"
                        : "default",
                    touchAction: "none",
                    outline: "none",
                }}
            >
                {/* inactive track */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "50%",
                        height: trackHeight,
                        marginTop: -trackHeight / 2,
                        borderRadius: trackHeight,
                        background: trackColor,
                    }}
                />
                {/* active fill (left of the thumb, same color as value) */}
                <motion.div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        height: trackHeight,
                        marginTop: -trackHeight / 2,
                        borderRadius: trackHeight,
                        background: color,
                        width: fillWidth,
                    }}
                />
                {/* thumb (same color as value) */}
                <motion.div
                    animate={{ scale: dragging ? thumbGrow : 1 }}
                    transition={
                        isStatic
                            ? { duration: 0 }
                            : {
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                              }
                    }
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: thumbLeft,
                        width: thumbSize,
                        height: thumbSize,
                        marginTop: -thumbSize / 2,
                        borderRadius: "50%",
                        background: color,
                    }}
                />
            </div>
        </div>
    )
}

NumberFlowProgress.defaultProps = {
    number: DEFAULT_NUMBER,
    label: DEFAULT_LABEL,
    track: DEFAULT_TRACK,

    // Animation (not in property controls)
    thumbSpring: 600,
    stiffness: 170,
    damping: 24,
    mass: 1,
    fade: 16,
}

/* -------------------------------------------------------------------------- */
/*  Property controls                                                         */
/* -------------------------------------------------------------------------- */

addPropertyControls(NumberFlowProgress, {
    /* ---- Value (the middle part) ---- */
    number: {
        type: ControlType.Object,
        title: "Value",
        controls: {
            value: {
                type: ControlType.Number,
                title: "Value",
                defaultValue: 69,
                min: -100000,
                max: 100000,
                step: 1,
                displayStepper: true,
            },
            min: {
                type: ControlType.Number,
                title: "Min",
                defaultValue: 0,
                min: -100000,
                max: 100000,
                step: 1,
                displayStepper: true,
            },
            step: {
                type: ControlType.Number,
                title: "Step",
                defaultValue: 1,
                min: 0.001,
                max: 1000,
                step: 0.1,
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
                defaultValue: "%",
                placeholder: "%",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "128px",
                    fontWeight: 300,
                    lineHeight: "1.1em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 24,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
            },
        },
    },

    /* ---- Label ---- */
    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "For progress",
                hidden: (p: any) => !p.show,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    lineHeight: "1.3em",
                },
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#BDB4A7",
                hidden: (p: any) => !p.show,
            },
        },
    },

    /* ---- Line / track ---- */
    track: {
        type: ControlType.Object,
        title: "Track",
        controls: {
            trackColor: {
                type: ControlType.Color,
                title: "Inactive",
                defaultValue: "rgba(255,255,255,0.16)",
            },
            trackHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 2,
                min: 1,
                max: 24,
                step: 1,
                unit: "px",
            },
            thumbSize: {
                type: ControlType.Number,
                title: "Thumb Size",
                defaultValue: 22,
                min: 6,
                max: 64,
                step: 1,
                unit: "px",
            },
            thumbGrow: {
                type: ControlType.Number,
                title: "Press Scale",
                defaultValue: 1.15,
                min: 0.8,
                max: 2,
                step: 0.01,
                displayStepper: true,
            },
        },
    },

    /* ---- Events ---- */
    onChange: {
        type: ControlType.EventHandler,
    },
})
