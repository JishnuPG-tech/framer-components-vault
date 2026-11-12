// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

// --- Utility Functions ---

function accentToRGBA(accentColor: string, opacity: number): string {
    if (accentColor.startsWith("#")) {
        const hex = accentColor.slice(1)
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    const match = accentColor.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
    return `rgba(99, 102, 241, ${opacity})`
}

function evaluateFormula(
    formula: string,
    inputs: Record<string, number>
): number {
    if (!formula || !formula.trim()) return 0
    try {
        const paramNames = Object.keys(inputs)
        const paramValues = Object.values(inputs)
        const mathHelpers = {
            round: Math.round,
            ceil: Math.ceil,
            floor: Math.floor,
            min: Math.min,
            max: Math.max,
            abs: Math.abs,
        }
        const helperNames = Object.keys(mathHelpers)
        const helperValues = Object.values(mathHelpers)
        const fn = new Function(
            ...paramNames,
            ...helperNames,
            `"use strict"; return (${formula})`
        )
        const result = fn(...paramValues, ...helperValues)
        if (typeof result !== "number" || !isFinite(result)) return 0
        return result
    } catch {
        return 0
    }
}

function formatResult(
    value: number,
    format: "currency" | "decimal" | "percent" | "compact",
    locale: string,
    currencyCode: string,
    decimalPlaces: number
): string {
    const resolvedLocale = locale === "custom" ? "en-US" : locale
    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }
    if (format === "currency") {
        options.style = "currency"
        options.currency = currencyCode || "USD"
    } else if (format === "compact") {
        options.notation = "compact"
        options.compactDisplay = "short"
    }
    try {
        let formatted = new Intl.NumberFormat(resolvedLocale, options).format(
            value
        )
        if (format === "percent") {
            formatted = formatted + "%"
        }
        return formatted
    } catch {
        return value.toFixed(decimalPlaces)
    }
}

function formatSliderValue(value: number, step: number): string {
    const decimals = step < 1 ? String(step).split(".")[1]?.length || 0 : 0
    return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

// --- Hooks ---

function useAnimatedValue(
    target: number,
    duration: number,
    enabled: boolean
): number {
    const [display, setDisplay] = useState(target)
    const prevRef = useRef(target)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        if (!enabled) {
            setDisplay(target)
            prevRef.current = target
            return
        }

        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
        }

        const from = prevRef.current
        const startTime = performance.now()

        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / (duration * 1000), 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = from + (target - from) * eased

            setDisplay(current)

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                prevRef.current = target
                rafRef.current = null
            }
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            prevRef.current = target
        }
    }, [target, duration, enabled])

    return display
}

// --- Sub-components ---

interface SliderProps {
    value: number
    min: number
    max: number
    step: number
    filledColor: string
    trackColor: string
    onChange: (v: number) => void
}

function CalcSlider({
    value,
    min,
    max,
    step,
    filledColor,
    trackColor,
    onChange,
}: SliderProps) {
    const range = max - min
    const percent = range > 0 ? ((value - min) / range) * 100 : 0

    return (
        <input
            type="range"
            className="sc-calcfree-slider"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            style={{
                width: "100%",
                height: 6,
                appearance: "none",
                WebkitAppearance: "none",
                outline: "none",
                borderRadius: 3,
                cursor: "pointer",
                background: `linear-gradient(to right, ${filledColor} 0%, ${filledColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`,
                margin: 0,
            }}
        />
    )
}

interface EditableValueProps {
    value: number
    min: number
    max: number
    step: number
    prefix: string
    suffix: string
    textColor: string
    fontFamily: string
    fontSize: number
    textTransform: string
    letterSpacing: string
    onChange: (v: number) => void
}

function EditableValue({
    value,
    min,
    max,
    step,
    prefix,
    suffix,
    textColor,
    fontFamily,
    fontSize,
    textTransform,
    letterSpacing,
    onChange,
}: EditableValueProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(String(value))
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.select()
        }
    }, [editing])

    if (editing) {
        return (
            <input
                ref={inputRef}
                type="number"
                value={draft}
                min={min}
                max={max}
                step={step}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                    setEditing(false)
                    const num = Number(draft)
                    if (!isNaN(num)) {
                        onChange(Math.min(max, Math.max(min, num)))
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                    if (e.key === "Escape") {
                        setDraft(String(value))
                        setEditing(false)
                    }
                }}
                style={{
                    width: 80,
                    textAlign: "right",
                    fontSize: fontSize,
                    fontWeight: 600,
                    color: textColor,
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    padding: "2px 8px",
                    outline: "none",
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: fontFamily || "inherit",
                    textTransform: textTransform as any,
                    letterSpacing: letterSpacing,
                    background: "transparent",
                }}
            />
        )
    }

    return (
        <span
            onClick={() => {
                setDraft(String(value))
                setEditing(true)
            }}
            style={{
                fontSize: fontSize,
                fontWeight: 600,
                color: textColor,
                cursor: "text",
                fontVariantNumeric: "tabular-nums",
                fontFamily: fontFamily || undefined,
                textTransform: textTransform as any,
                letterSpacing: letterSpacing,
                userSelect: "none",
            }}
            title="Click to edit"
        >
            {prefix}
            {formatSliderValue(value, step)}
            {suffix}
        </span>
    )
}

// --- Types ---

interface InputConfig {
    variableName: string
    label: string
    min: number
    max: number
    step: number
    defaultValue: number
    unitPrefix: string
    unitSuffix: string
}

interface CalcEngineFreeProps {
    inputs: InputConfig[]
    formula: string
    resultLabel: string
    resultDescription: string
    resultFormat: "currency" | "decimal" | "percent" | "compact"
    currencyCode: string
    locale: string
    customLocale: string
    decimalPlaces: number
    animateResult: boolean
    animationDuration: number
    fontFamily: string
    labelFontFamily: string
    labelFontSize: number
    labelTextTransform: string
    labelLetterSpacing: string
    valueFontFamily: string
    valueFontSize: number
    valueTextTransform: string
    valueLetterSpacing: string
    resultLabelFontFamily: string
    resultLabelFontSize: number
    resultDescFontFamily: string
    resultDescFontSize: number
    resultFontSize: number
    accentColor: string
    bgColor: string
    textColor: string
    labelColor: string
    sliderValueColor: string
    sliderFilledColor: string
    sliderTrackColor: string
    showShadow: boolean
    containerPadding: number
    inputGap: number
    resultSpacing: number
    borderRadius: number
    style?: React.CSSProperties
}

// --- Main Component ---

/**
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CalcEngineFree(props: CalcEngineFreeProps) {
    const {
        inputs,
        formula,
        resultLabel,
        resultDescription,
        resultFormat,
        currencyCode,
        locale,
        customLocale,
        decimalPlaces,
        animateResult,
        animationDuration,
        fontFamily,
        labelFontFamily,
        labelFontSize,
        labelTextTransform,
        labelLetterSpacing,
        valueFontFamily,
        valueFontSize,
        valueTextTransform,
        valueLetterSpacing,
        resultLabelFontFamily,
        resultLabelFontSize,
        resultDescFontFamily,
        resultDescFontSize,
        resultFontSize,
        accentColor,
        bgColor,
        textColor,
        labelColor,
        sliderValueColor,
        sliderFilledColor,
        sliderTrackColor,
        showShadow,
        containerPadding,
        inputGap,
        resultSpacing,
        borderRadius,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // --- Reduced motion ---
    const [reducedMotion, setReducedMotion] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReducedMotion(mq.matches)
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])

    const shouldAnimate = animateResult && !reducedMotion && !isCanvas

    // --- State management ---
    const inputStructureKey = useMemo(
        () =>
            inputs.map((i) => `${i.variableName}:${i.defaultValue}`).join(","),
        [inputs]
    )

    const [values, setValues] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        inputs.forEach((input) => {
            const def = input.defaultValue ?? input.min ?? 0
            initial[input.variableName] = Math.min(
                input.max,
                Math.max(input.min, def)
            )
        })
        return initial
    })

    useEffect(() => {
        const newState: Record<string, number> = {}
        inputs.forEach((input) => {
            const def = input.defaultValue ?? input.min ?? 0
            newState[input.variableName] = Math.min(
                input.max,
                Math.max(input.min, def)
            )
        })
        setValues(newState)
    }, [inputStructureKey])

    const updateValue = useCallback((variableName: string, value: number) => {
        setValues((prev) => ({ ...prev, [variableName]: value }))
    }, [])

    // --- Calculation ---
    const rawResult = useMemo(
        () => evaluateFormula(formula, values),
        [formula, values]
    )

    const animatedResult = useAnimatedValue(
        rawResult,
        animationDuration,
        shouldAnimate
    )

    const resolvedLocale =
        locale === "custom" ? customLocale || "en-US" : locale

    const formattedResult = formatResult(
        shouldAnimate ? animatedResult : rawResult,
        resultFormat,
        resolvedLocale,
        currencyCode,
        decimalPlaces
    )

    // --- Gradient ---
    const resultGradient = `linear-gradient(135deg, ${accentToRGBA(accentColor, 0.04)}, ${accentToRGBA(accentColor, 0.08)})`

    // --- Injected CSS ---
    const injectedCSS = `
.sc-calcfree-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 2px solid var(--sc-slider-filled);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}
.sc-calcfree-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.sc-calcfree-slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
}
.sc-calcfree-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 2px solid var(--sc-slider-filled);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}
.sc-calcfree-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.sc-calcfree-slider::-moz-range-track {
  background: transparent;
  border: none;
}
@media (max-width: 480px) {
  .sc-calcfree-result-value {
    font-size: 32px !important;
  }
  .sc-calcfree-container {
    padding: 24px !important;
  }
}
`

    return (
        <div
            style={{
                ...style,
                padding: 16,
                boxSizing: "border-box",
            }}
        >
            <div
                className="sc-calcfree-container"
                style={
                    {
                        "--sc-accent": accentColor,
                        "--sc-slider-filled": sliderFilledColor || accentColor,
                        background: bgColor,
                        borderRadius: borderRadius,
                        padding: containerPadding,
                        boxShadow:
                            showShadow !== false
                                ? "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)"
                                : "none",
                        border: "1px solid rgba(0,0,0,0.06)",
                        fontFamily:
                            fontFamily ||
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        position: "relative",
                        boxSizing: "border-box",
                        width: "100%",
                        height: "100%",
                    } as React.CSSProperties
                }
            >
                <style>{injectedCSS}</style>

                {/* INPUTS SECTION */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: inputGap,
                    }}
                >
                    {inputs.map((input, index) => {
                        const currentValue =
                            values[input.variableName] ??
                            input.defaultValue ??
                            input.min ??
                            0
                        return (
                            <div key={input.variableName || index}>
                                {/* Label row */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 10,
                                    }}
                                >
                                    <label
                                        style={{
                                            fontSize: labelFontSize,
                                            fontWeight: 500,
                                            textTransform:
                                                labelTextTransform as any,
                                            letterSpacing: labelLetterSpacing,
                                            color: labelColor,
                                            fontFamily:
                                                labelFontFamily || undefined,
                                            margin: 0,
                                            padding: 0,
                                        }}
                                    >
                                        {input.label}
                                    </label>
                                    <EditableValue
                                        value={currentValue}
                                        min={input.min}
                                        max={input.max}
                                        step={input.step}
                                        prefix={input.unitPrefix || ""}
                                        suffix={input.unitSuffix || ""}
                                        textColor={
                                            sliderValueColor || textColor
                                        }
                                        fontFamily={valueFontFamily}
                                        fontSize={valueFontSize}
                                        textTransform={valueTextTransform}
                                        letterSpacing={valueLetterSpacing}
                                        onChange={(v) =>
                                            updateValue(input.variableName, v)
                                        }
                                    />
                                </div>

                                {/* Slider */}
                                <CalcSlider
                                    value={currentValue}
                                    min={input.min}
                                    max={input.max}
                                    step={input.step}
                                    filledColor={
                                        sliderFilledColor || accentColor
                                    }
                                    trackColor={sliderTrackColor || "#E5E7EB"}
                                    onChange={(v) =>
                                        updateValue(input.variableName, v)
                                    }
                                />
                            </div>
                        )
                    })}
                </div>

                {/* RESULT SECTION */}
                <div
                    className="sc-calcfree-result"
                    style={{
                        marginTop: resultSpacing,
                        padding: 24,
                        borderRadius: 12,
                        background: resultGradient,
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: resultLabelFontSize,
                            fontWeight: 500,
                            color: labelColor,
                            fontFamily: resultLabelFontFamily || undefined,
                            marginBottom: 8,
                        }}
                    >
                        {resultLabel}
                    </div>
                    <div
                        className="sc-calcfree-result-value"
                        style={{
                            fontSize: resultFontSize,
                            fontWeight: 700,
                            color: accentColor,
                            fontVariantNumeric: "tabular-nums",
                            lineHeight: 1.2,
                        }}
                    >
                        {formattedResult}
                    </div>
                    {resultDescription && (
                        <div
                            style={{
                                fontSize: resultDescFontSize,
                                color: labelColor,
                                fontFamily: resultDescFontFamily || undefined,
                                marginTop: 8,
                                maxWidth: 360,
                                marginLeft: "auto",
                                marginRight: "auto",
                                lineHeight: 1.5,
                            }}
                        >
                            {resultDescription}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// --- Property Controls ---

addPropertyControls(CalcEngineFree, {
    // -- SECTION: INPUTS --
    inputs: {
        type: ControlType.Array,
        title: "Calculator Inputs",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                variableName: {
                    type: ControlType.String,
                    title: "Variable Name",
                    placeholder: "monthlySpend",
                    description:
                        "Use this name in the formula. Letters only, no spaces.",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    placeholder: "Monthly Software Spend",
                },
                min: {
                    type: ControlType.Number,
                    title: "Min Value",
                    defaultValue: 0,
                },
                max: {
                    type: ControlType.Number,
                    title: "Max Value",
                    defaultValue: 100,
                },
                step: {
                    type: ControlType.Number,
                    title: "Step",
                    defaultValue: 1,
                    min: 0.01,
                },
                defaultValue: {
                    type: ControlType.Number,
                    title: "Default Value",
                    defaultValue: 50,
                },
                unitPrefix: {
                    type: ControlType.String,
                    title: "Unit Prefix",
                    placeholder: "$",
                    description: "Shown before the value (e.g., $)",
                },
                unitSuffix: {
                    type: ControlType.String,
                    title: "Unit Suffix",
                    placeholder: "%",
                    description: "Shown after the value (e.g., %, hrs, /mo)",
                },
            },
        },
        defaultValue: [
            {
                variableName: "monthlySpend",
                label: "Monthly Software Spend",
                min: 500,
                max: 50000,
                step: 500,
                defaultValue: 5000,
                unitPrefix: "$",
                unitSuffix: "",
            },
            {
                variableName: "savingsPercent",
                label: "Expected Savings",
                min: 5,
                max: 80,
                step: 5,
                defaultValue: 30,
                unitPrefix: "",
                unitSuffix: "%",
            },
            {
                variableName: "years",
                label: "Time Period",
                min: 1,
                max: 5,
                step: 1,
                defaultValue: 1,
                unitPrefix: "",
                unitSuffix: " year(s)",
            },
        ],
    },

    // -- SECTION: FORMULA --
    formula: {
        type: ControlType.String,
        title: "Formula",
        placeholder: "monthlySpend * (savingsPercent / 100) * years * 12",
        displayTextArea: true,
        defaultValue: "monthlySpend * (savingsPercent / 100) * years * 12",
        description:
            "JavaScript expression using input variable names. Available: round(), ceil(), floor(), min(), max(), abs()",
    },

    // -- SECTION: RESULT --
    resultLabel: {
        type: ControlType.String,
        title: "Result Label",
        defaultValue: "Your Projected Savings",
    },
    resultDescription: {
        type: ControlType.String,
        title: "Result Description",
        defaultValue:
            "Based on your current spend and expected efficiency gains",
        displayTextArea: true,
    },
    resultFormat: {
        type: ControlType.Enum,
        title: "Number Format",
        options: ["currency", "decimal", "percent", "compact"],
        optionTitles: [
            "Currency ($1,234)",
            "Number (1,234)",
            "Percent (12%)",
            "Compact (1.2K)",
        ],
        defaultValue: "currency",
    },
    currencyCode: {
        type: ControlType.String,
        title: "Currency Code",
        defaultValue: "USD",
        placeholder: "USD, EUR, GBP, JPY...",
        description:
            "ISO 4217 code. Common: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL. Full list: en.wikipedia.org/wiki/ISO_4217",
        hidden: (props: any) => props.resultFormat !== "currency",
    },
    locale: {
        type: ControlType.Enum,
        title: "Number Locale",
        options: ["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP", "custom"],
        optionTitles: [
            "English (US)",
            "English (UK)",
            "German",
            "French",
            "Japanese",
            "Custom",
        ],
        defaultValue: "en-US",
    },
    customLocale: {
        type: ControlType.String,
        title: "Custom Locale Code",
        placeholder: "pt-BR",
        hidden: (props: any) => props.locale !== "custom",
    },
    decimalPlaces: {
        type: ControlType.Number,
        title: "Decimal Places",
        defaultValue: 0,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },

    // -- SECTION: ANIMATION --
    animateResult: {
        type: ControlType.Boolean,
        title: "Animate Result",
        defaultValue: true,
        enabledTitle: "Animated",
        disabledTitle: "Instant",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.6,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: (props: any) => !props.animateResult,
    },

    // -- SECTION: TYPOGRAPHY --
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        description:
            "Global CSS font-family. Per-section fonts below override this.",
    },

    // Input Label Typography
    labelFontFamily: {
        type: ControlType.String,
        title: "Label Font",
        defaultValue: "",
        placeholder: "Inherit from global",
        description: "Font family for input labels. Leave empty to inherit.",
    },
    labelFontSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 1,
        unit: "px",
    },
    labelTextTransform: {
        type: ControlType.Enum,
        title: "Label Transform",
        options: ["uppercase", "none", "lowercase", "capitalize"],
        optionTitles: ["UPPERCASE", "None", "lowercase", "Capitalize"],
        defaultValue: "uppercase",
    },
    labelLetterSpacing: {
        type: ControlType.String,
        title: "Label Spacing",
        defaultValue: "0.05em",
        placeholder: "0.05em",
        description: "CSS letter-spacing (e.g., 0.05em, 1px)",
    },

    // Input Value Typography
    valueFontFamily: {
        type: ControlType.String,
        title: "Value Font",
        defaultValue: "",
        placeholder: "Inherit from global",
        description: "Font family for slider values. Leave empty to inherit.",
    },
    valueFontSize: {
        type: ControlType.Number,
        title: "Value Size",
        defaultValue: 14,
        min: 10,
        max: 28,
        step: 1,
        unit: "px",
    },
    valueTextTransform: {
        type: ControlType.Enum,
        title: "Value Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
        defaultValue: "none",
    },
    valueLetterSpacing: {
        type: ControlType.String,
        title: "Value Spacing",
        defaultValue: "0em",
        placeholder: "0em",
        description: "CSS letter-spacing (e.g., 0em, 1px)",
    },

    // Result Typography
    resultLabelFontFamily: {
        type: ControlType.String,
        title: "Result Label Font",
        defaultValue: "",
        placeholder: "Inherit from global",
        description: "Font family for the result label text.",
    },
    resultLabelFontSize: {
        type: ControlType.Number,
        title: "Result Label Size",
        defaultValue: 14,
        min: 10,
        max: 28,
        step: 1,
        unit: "px",
    },
    resultDescFontFamily: {
        type: ControlType.String,
        title: "Result Desc Font",
        defaultValue: "",
        placeholder: "Inherit from global",
        description: "Font family for the result description text.",
    },
    resultDescFontSize: {
        type: ControlType.Number,
        title: "Result Desc Size",
        defaultValue: 13,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
    },
    resultFontSize: {
        type: ControlType.Number,
        title: "Result Value Size",
        defaultValue: 40,
        min: 16,
        max: 72,
        step: 2,
        unit: "px",
    },

    // -- SECTION: COLORS --
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#6366F1",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111827",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#6B7280",
    },
    sliderValueColor: {
        type: ControlType.Color,
        title: "Slider Value Color",
        defaultValue: "#111827",
        description: "Color of the editable number next to each slider",
    },
    sliderFilledColor: {
        type: ControlType.Color,
        title: "Slider Filled Color",
        defaultValue: "#6366F1",
        description: "Color of the filled portion of the slider track",
    },
    sliderTrackColor: {
        type: ControlType.Color,
        title: "Slider Track Color",
        defaultValue: "#E5E7EB",
        description: "Color of the unfilled portion of the slider track",
    },

    // -- SECTION: SPACING & APPEARANCE --
    showShadow: {
        type: ControlType.Boolean,
        title: "Drop Shadow",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    containerPadding: {
        type: ControlType.Number,
        title: "Container Padding",
        defaultValue: 32,
        min: 8,
        max: 64,
        step: 4,
        unit: "px",
    },
    inputGap: {
        type: ControlType.Number,
        title: "Input Gap",
        defaultValue: 24,
        min: 8,
        max: 48,
        step: 4,
        unit: "px",
    },
    resultSpacing: {
        type: ControlType.Number,
        title: "Result Spacing",
        defaultValue: 28,
        min: 8,
        max: 56,
        step: 4,
        unit: "px",
        description: "Space between inputs and result section",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
})
