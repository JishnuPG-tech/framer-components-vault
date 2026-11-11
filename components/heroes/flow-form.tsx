// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizePadding(p: any, fallback = "12px"): string {
    if (typeof p === "string") return p
    if (typeof p === "number") return `${p}px`
    if (!p) return fallback
    const { top = 12, right = 12, bottom = 12, left = 12 } = p
    return `${top}px ${right}px ${bottom}px ${left}px`
}

function resolvePaddingSides(
    p: any,
    fallback = { top: 12, right: 12, bottom: 12, left: 12 }
) {
    if (typeof p === "number") {
        return { top: p, right: p, bottom: p, left: p }
    }

    if (typeof p === "string") {
        const parts = p
            .trim()
            .split(/\s+/)
            .map((part) => {
                const parsed = Number.parseFloat(part)
                return Number.isFinite(parsed) ? parsed : NaN
            })

        if (parts.length === 1 && Number.isFinite(parts[0])) {
            return {
                top: parts[0],
                right: parts[0],
                bottom: parts[0],
                left: parts[0],
            }
        }

        if (
            parts.length === 2 &&
            Number.isFinite(parts[0]) &&
            Number.isFinite(parts[1])
        ) {
            return {
                top: parts[0],
                right: parts[1],
                bottom: parts[0],
                left: parts[1],
            }
        }

        if (
            parts.length === 3 &&
            Number.isFinite(parts[0]) &&
            Number.isFinite(parts[1]) &&
            Number.isFinite(parts[2])
        ) {
            return {
                top: parts[0],
                right: parts[1],
                bottom: parts[2],
                left: parts[1],
            }
        }

        if (parts.length >= 4 && parts.every(Number.isFinite)) {
            return {
                top: parts[0],
                right: parts[1],
                bottom: parts[2],
                left: parts[3],
            }
        }
    }

    if (p && typeof p === "object") {
        return {
            top: Number.isFinite(p.top) ? p.top : fallback.top,
            right: Number.isFinite(p.right) ? p.right : fallback.right,
            bottom: Number.isFinite(p.bottom) ? p.bottom : fallback.bottom,
            left: Number.isFinite(p.left) ? p.left : fallback.left,
        }
    }

    return fallback
}

function paddingSidesToCss(p: {
    top: number
    right: number
    bottom: number
    left: number
}) {
    return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}

function normalizeBorderRadius(r: any, fallback = "8px"): string {
    if (typeof r === "string") return r
    if (typeof r === "number") return `${r}px`
    if (!r) return fallback
    const { topLeft = 8, topRight = 8, bottomRight = 8, bottomLeft = 8 } = r
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`
}

function normalizeBorder(border: any): React.CSSProperties {
    if (!border) return {}
    if (typeof border === "string") return { border }
    return border
}

const defaultCheckboxStyle = {
    layout: "vertical",
    gap: 10,
    controlSize: 18,
    controlRadius: "6px",
    controlBackground: "#ffffff",
    controlBorder: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#dddddd",
    },
    selectedColor: "#111111",
    checkmarkColor: "#ffffff",
    optionPadding: { top: 8, right: 12, bottom: 8, left: 12 },
    optionRadius: "8px",
    optionBackground: "transparent",
    labelColor: "#111111",
    hoverBackground: "#f5f5f5",
    alignment: "center",
}

const defaultNumberBehavior = {
    min: "",
    max: "",
    step: 1,
    allowNegative: true,
    decimalPlaces: 0,
}

function parseOptionalNumber(value: any) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : undefined
    }
    return undefined
}

function getCheckboxOptionOrder(options: any[] = []) {
    return options.map((option) => String(option?.value ?? "")).filter(Boolean)
}

function parseCheckboxValue(value: string) {
    if (!value) return [] as string[]

    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
            return parsed.map((entry) => String(entry)).filter(Boolean)
        }
    } catch {
        // Fall through to legacy comma-separated parsing.
    }

    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
}

function serializeCheckboxValue(value: string, options: any[] = []) {
    const selected = Array.from(new Set(parseCheckboxValue(value)))
    const optionOrder = getCheckboxOptionOrder(options)

    if (optionOrder.length > 0) {
        selected.sort(
            (left, right) =>
                optionOrder.indexOf(left) - optionOrder.indexOf(right)
        )
    }

    return JSON.stringify(selected)
}

function getFieldSubmissionValue(field: any, value: string) {
    if (field?.type === "checkbox") {
        return serializeCheckboxValue(value, field?.options ?? [])
    }

    return value ?? ""
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChevronRight({
    size,
    stroke,
    color,
}: {
    size: number
    stroke: number
    color: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}

function ChevronLeft({
    size,
    stroke,
    color,
}: {
    size: number
    stroke: number
    color: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

function ChevronDown({
    size,
    stroke,
    color,
}: {
    size: number
    stroke: number
    color: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    )
}

function CheckMark({
    size,
    stroke,
    color,
}: {
    size: number
    stroke: number
    color: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function FieldInput({
    field,
    fieldStyles,
    value,
    onChange,
    hasError,
    inputRef,
}: {
    field: any
    fieldStyles: any
    value: string
    onChange: (v: string) => void
    hasError: boolean
    inputRef: React.RefObject<any>
}) {
    const padding = normalizePadding(fieldStyles.inputPadding)
    const radius = normalizeBorderRadius(fieldStyles.inputBorderRadius)
    const [hoveredOption, setHoveredOption] = React.useState<string | null>(
        null
    )
    const [selectFocused, setSelectFocused] = React.useState(false)
    const [numberFocused, setNumberFocused] = React.useState(false)
    const borderStyle = hasError
        ? {
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: fieldStyles.errorColor ?? "#ef4444",
          }
        : normalizeBorder(fieldStyles.inputBorder)

    const base: React.CSSProperties = {
        width: "100%",
        padding,
        borderRadius: radius,
        ...borderStyle,
        backgroundColor: fieldStyles.inputBackground ?? "#ffffff",
        color: fieldStyles.inputTextColor ?? "#111111",
        fontSize: 16,
        outline: "none",
        boxSizing: "border-box",
        transition: "border 0.2s",
        fontFamily: "inherit",
        ...(fieldStyles.inputFont ?? {}),
    }

    const placeholderCss = `.chatform-ph-${field.id}::placeholder { color: ${fieldStyles.placeholderColor ?? "#999999"}; }`
    const cls = `chatform-ph-${field.id}`

    if (field.type === "textarea") {
        return (
            <>
                <style>{placeholderCss}</style>
                <textarea
                    ref={inputRef}
                    className={cls}
                    name={field.id}
                    id={field.id}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onChange(e.target.value)
                    }
                    rows={4}
                    style={{ ...base, resize: "vertical" }}
                />
            </>
        )
    }

    if (field.type === "select") {
        const selectPaddingSides = resolvePaddingSides(
            fieldStyles.inputPadding ?? {
                top: 12,
                right: 12,
                bottom: 12,
                left: 12,
            }
        )
        const selectBorder = fieldStyles.inputBorder ?? {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#dddddd",
        }
        const selectBorderStyle =
            typeof selectBorder === "string"
                ? { border: selectBorder }
                : {
                      borderWidth: selectBorder.borderWidth ?? 1,
                      borderStyle: selectBorder.borderStyle ?? "solid",
                      borderColor: selectFocused
                          ? (fieldStyles.errorColor ?? "#111111")
                          : (selectBorder.borderColor ?? "#dddddd"),
                  }
        const arrowSize = 16
        const arrowGap = 12
        const arrowColor = fieldStyles.inputTextColor ?? "#111111"
        const selectTextColor = value
            ? (fieldStyles.inputTextColor ?? "#111111")
            : (fieldStyles.placeholderColor ?? "#999999")
        const selectPaddingRight = Math.max(
            selectPaddingSides.right + Math.round(arrowSize + arrowGap * 2),
            selectPaddingSides.right
        )

        return (
            <div style={{ position: "relative", width: "100%" }}>
                <select
                    ref={inputRef}
                    name={field.id}
                    id={field.id}
                    required={field.required}
                    value={value}
                    onFocus={() => setSelectFocused(true)}
                    onBlur={() => setSelectFocused(false)}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        onChange(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: paddingSidesToCss(selectPaddingSides),
                        paddingRight: `${selectPaddingRight}px`,
                        borderRadius: normalizeBorderRadius(
                            fieldStyles.inputBorderRadius ?? "8px"
                        ),
                        ...selectBorderStyle,
                        backgroundColor:
                            fieldStyles.inputBackground ?? "#ffffff",
                        color: selectTextColor,
                        fontSize: 16,
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border 0.2s, box-shadow 0.2s, color 0.2s",
                        fontFamily: "inherit",
                        textAlign: "left",
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        ...(fieldStyles.inputFont ?? {}),
                    }}
                >
                    <option value="">
                        {field.placeholder || "Select an option"}
                    </option>
                    {(field.options ?? []).map((o: any, i: number) => (
                        <option key={i} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: `${selectPaddingSides.right + arrowGap}px`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: arrowSize,
                        height: arrowSize,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        color: arrowColor,
                    }}
                >
                    <ChevronDown
                        size={arrowSize}
                        stroke={2}
                        color={arrowColor}
                    />
                </div>
            </div>
        )
    }

    if (field.type === "number") {
        const numberBehavior = field.numberBehavior ?? {}
        const numberPadding = normalizePadding(
            fieldStyles.inputPadding ?? {
                top: 12,
                right: 12,
                bottom: 12,
                left: 12,
            }
        )
        const numberRadius = normalizeBorderRadius(
            fieldStyles.inputBorderRadius ?? "8px"
        )
        const numberBorder = fieldStyles.inputBorder ?? {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#dddddd",
        }
        const numberBorderStyle =
            typeof numberBorder === "string"
                ? { border: numberBorder }
                : {
                      borderWidth: numberBorder.borderWidth ?? 1,
                      borderStyle: numberBorder.borderStyle ?? "solid",
                      borderColor: numberFocused
                          ? (fieldStyles.errorColor ?? "#111111")
                          : (numberBorder.borderColor ?? "#dddddd"),
                  }
        const minInput = parseOptionalNumber(numberBehavior.min)
        const maxInput = parseOptionalNumber(numberBehavior.max)
        const minValue =
            typeof minInput === "number"
                ? numberBehavior.allowNegative === false
                    ? Math.max(minInput, 0)
                    : minInput
                : numberBehavior.allowNegative === false
                  ? 0
                  : undefined
        const maxValue = typeof maxInput === "number" ? maxInput : undefined
        const decimalPlaces =
            typeof numberBehavior.decimalPlaces === "number" &&
            Number.isFinite(numberBehavior.decimalPlaces)
                ? Math.max(0, Math.floor(numberBehavior.decimalPlaces))
                : undefined
        const stepValue =
            typeof numberBehavior.step === "number" &&
            Number.isFinite(numberBehavior.step) &&
            numberBehavior.step > 0
                ? numberBehavior.step
                : decimalPlaces && decimalPlaces > 0
                  ? Number(
                        (1 / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces)
                    )
                  : 1
        const useDecimalKeyboard =
            (decimalPlaces ?? 0) > 0 || stepValue % 1 !== 0
        const numberPlaceholderCss = `.chatform-num-ph-${field.id}::placeholder { color: ${fieldStyles.placeholderColor ?? "#999999"}; }`

        return (
            <>
                <style>{numberPlaceholderCss}</style>
                <input
                    ref={inputRef}
                    className={`chatform-num-ph-${field.id} chatform-num-${field.id}`}
                    type="number"
                    name={field.id}
                    id={field.id}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={value}
                    min={minValue}
                    max={maxValue}
                    step={stepValue}
                    inputMode={useDecimalKeyboard ? "decimal" : "numeric"}
                    onFocus={() => setNumberFocused(true)}
                    onBlur={() => setNumberFocused(false)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onChange(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: numberPadding,
                        borderRadius: numberRadius,
                        ...numberBorderStyle,
                        backgroundColor:
                            fieldStyles.inputBackground ?? "#ffffff",
                        color: fieldStyles.inputTextColor ?? "#111111",
                        fontSize: 16,
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border 0.2s, box-shadow 0.2s, color 0.2s",
                        fontFamily: "inherit",
                        textAlign: "left",
                        ...(fieldStyles.inputFont ?? {}),
                    }}
                />
            </>
        )
    }

    if (field.type === "radio") {
        const radioStyles = field.radioStyle ?? {}
        const layout = radioStyles.layout ?? "vertical"
        const gap = radioStyles.gap ?? 10
        const controlSize = radioStyles.controlSize ?? 18
        const controlRadius = normalizeBorderRadius(
            radioStyles.controlRadius ?? 999
        )
        const controlBorder = radioStyles.controlBorder ?? {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#dddddd",
        }
        const controlBorderWidth = controlBorder.borderWidth ?? 1
        const controlBorderStyle = controlBorder.borderStyle ?? "solid"
        const controlBorderColor = controlBorder.borderColor ?? "#dddddd"
        const controlBackground = radioStyles.controlBackground ?? "#ffffff"
        const selectedColor = radioStyles.selectedColor ?? "#111111"
        const selectedBorderColor = radioStyles.selectedBorderColor ?? "#111111"
        const optionPadding = normalizePadding(
            radioStyles.optionPadding ?? {
                top: 8,
                right: 12,
                bottom: 8,
                left: 12,
            }
        )
        const optionRadius = normalizeBorderRadius(
            radioStyles.optionRadius ?? 8
        )
        const optionBackground = radioStyles.optionBackground ?? "transparent"
        const hoverBackground = radioStyles.hoverBackground ?? "#f5f5f5"
        const labelColor =
            radioStyles.labelColor ?? fieldStyles.inputTextColor ?? "#111111"
        const labelFont = radioStyles.labelFont ?? fieldStyles.inputFont ?? {}
        const alignment = radioStyles.alignment ?? "center"

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: layout === "horizontal" ? "row" : "column",
                    flexWrap: layout === "horizontal" ? "wrap" : "nowrap",
                    gap,
                    alignItems:
                        alignment === "center" ? "center" : "flex-start",
                    justifyContent:
                        alignment === "center" ? "center" : "flex-start",
                    width: "100%",
                }}
            >
                {(field.options ?? []).map((o: any, i: number) => (
                    <label
                        key={i}
                        onMouseEnter={() => setHoveredOption(o.value)}
                        onMouseLeave={() => setHoveredOption(null)}
                        style={{
                            display: "flex",
                            flexDirection:
                                layout === "horizontal" ? "column" : "row",
                            alignItems:
                                layout === "horizontal"
                                    ? alignment === "center"
                                        ? "center"
                                        : "flex-start"
                                    : "center",
                            justifyContent: "flex-start",
                            gap: 10,
                            cursor: "pointer",
                            padding: optionPadding,
                            borderRadius: optionRadius,
                            backgroundColor:
                                hoveredOption === o.value
                                    ? hoverBackground
                                    : optionBackground,
                            transition: "background 0.18s",
                            color: labelColor,
                            boxSizing: "border-box",
                        }}
                    >
                        <span
                            style={{
                                position: "relative",
                                width: controlSize,
                                height: controlSize,
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <input
                                ref={i === 0 ? inputRef : undefined}
                                type="radio"
                                id={`${field.id}-${i}`}
                                name={field.id}
                                value={o.value}
                                checked={value === o.value}
                                required={field.required}
                                onChange={() => onChange(o.value)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: controlSize,
                                    height: controlSize,
                                    margin: 0,
                                    opacity: 0,
                                    cursor: "pointer",
                                }}
                            />
                            <span
                                aria-hidden="true"
                                style={{
                                    width: controlSize,
                                    height: controlSize,
                                    borderRadius: controlRadius,
                                    backgroundColor: controlBackground,
                                    borderWidth: controlBorderWidth,
                                    borderStyle: controlBorderStyle,
                                    borderColor:
                                        value === o.value
                                            ? selectedBorderColor
                                            : controlBorderColor,
                                    boxSizing: "border-box",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition:
                                        "border-color 0.18s, background-color 0.18s",
                                }}
                            >
                                {value === o.value ? (
                                    <span
                                        style={{
                                            width: Math.max(
                                                6,
                                                Math.round(controlSize * 0.5)
                                            ),
                                            height: Math.max(
                                                6,
                                                Math.round(controlSize * 0.5)
                                            ),
                                            borderRadius: "50%",
                                            backgroundColor: selectedColor,
                                        }}
                                    />
                                ) : null}
                            </span>
                        </span>
                        <span
                            style={{ color: labelColor, ...(labelFont ?? {}) }}
                        >
                            {o.label}
                        </span>
                    </label>
                ))}
            </div>
        )
    }

    if (field.type === "checkbox") {
        const checkboxStyles = {
            ...defaultCheckboxStyle,
            ...(field.checkboxStyle ?? {}),
        }
        const layout = checkboxStyles.layout ?? "vertical"
        const gap = checkboxStyles.gap ?? 10
        const controlSize = checkboxStyles.controlSize ?? 18
        const controlRadius = normalizeBorderRadius(
            checkboxStyles.controlRadius ?? 6
        )
        const controlBorder = checkboxStyles.controlBorder ?? {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#dddddd",
        }
        const controlBorderWidth = controlBorder.borderWidth ?? 1
        const controlBorderStyle = controlBorder.borderStyle ?? "solid"
        const controlBorderColor = controlBorder.borderColor ?? "#dddddd"
        const controlBackground = checkboxStyles.controlBackground ?? "#ffffff"
        const selectedColor = checkboxStyles.selectedColor ?? "#111111"
        const checkmarkColor = checkboxStyles.checkmarkColor ?? "#ffffff"
        const optionPadding = normalizePadding(
            checkboxStyles.optionPadding ?? {
                top: 8,
                right: 12,
                bottom: 8,
                left: 12,
            }
        )
        const optionRadius = normalizeBorderRadius(
            checkboxStyles.optionRadius ?? 8
        )
        const optionBackground =
            checkboxStyles.optionBackground ?? "transparent"
        const hoverBackground = checkboxStyles.hoverBackground ?? "#f5f5f5"
        const labelColor =
            checkboxStyles.labelColor ?? fieldStyles.inputTextColor ?? "#111111"
        const labelFont =
            checkboxStyles.labelFont ?? fieldStyles.inputFont ?? {}
        const alignment = checkboxStyles.alignment ?? "center"
        const selectedValues = parseCheckboxValue(value)
        const hasCheckedOption = selectedValues.length > 0

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: layout === "horizontal" ? "row" : "column",
                    flexWrap: layout === "horizontal" ? "wrap" : "nowrap",
                    gap,
                    alignItems:
                        alignment === "center" ? "center" : "flex-start",
                    justifyContent:
                        alignment === "center" ? "center" : "flex-start",
                    width: "100%",
                }}
            >
                {(field.options ?? []).map((o: any, i: number) => {
                    const checked = selectedValues.includes(o.value)
                    const toggle = () => {
                        const nextValues = checked
                            ? selectedValues.filter(
                                  (entry) => entry !== o.value
                              )
                            : [...selectedValues, o.value]
                        onChange(
                            JSON.stringify(Array.from(new Set(nextValues)))
                        )
                    }
                    return (
                        <label
                            key={i}
                            onMouseEnter={() => setHoveredOption(o.value)}
                            onMouseLeave={() => setHoveredOption(null)}
                            style={{
                                display: "flex",
                                flexDirection:
                                    layout === "horizontal" ? "column" : "row",
                                alignItems:
                                    layout === "horizontal"
                                        ? alignment === "center"
                                            ? "center"
                                            : "flex-start"
                                        : "center",
                                justifyContent: "flex-start",
                                gap: 10,
                                cursor: "pointer",
                                padding: optionPadding,
                                borderRadius: optionRadius,
                                backgroundColor:
                                    hoveredOption === o.value
                                        ? hoverBackground
                                        : optionBackground,
                                transition: "background 0.18s",
                                color: labelColor,
                                boxSizing: "border-box",
                            }}
                        >
                            <span
                                style={{
                                    position: "relative",
                                    width: controlSize,
                                    height: controlSize,
                                    flexShrink: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <input
                                    ref={i === 0 ? inputRef : undefined}
                                    type="checkbox"
                                    id={`${field.id}-${i}`}
                                    name={field.id}
                                    value={o.value}
                                    checked={checked}
                                    required={
                                        field.required &&
                                        !hasCheckedOption &&
                                        i === 0
                                    }
                                    onChange={toggle}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: controlSize,
                                        height: controlSize,
                                        margin: 0,
                                        opacity: 0,
                                        cursor: "pointer",
                                    }}
                                />
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: controlSize,
                                        height: controlSize,
                                        borderRadius: controlRadius,
                                        backgroundColor: checked
                                            ? selectedColor
                                            : controlBackground,
                                        borderWidth: controlBorderWidth,
                                        borderStyle: controlBorderStyle,
                                        borderColor: checked
                                            ? selectedColor
                                            : controlBorderColor,
                                        boxSizing: "border-box",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition:
                                            "border-color 0.18s, background-color 0.18s",
                                    }}
                                >
                                    {checked ? (
                                        <CheckMark
                                            size={Math.max(
                                                10,
                                                Math.round(controlSize * 0.7)
                                            )}
                                            stroke={2.4}
                                            color={checkmarkColor}
                                        />
                                    ) : null}
                                </span>
                            </span>
                            <span
                                style={{
                                    color: labelColor,
                                    ...(labelFont ?? {}),
                                }}
                            >
                                {o.label}
                            </span>
                        </label>
                    )
                })}
            </div>
        )
    }

    return (
        <>
            <style>{placeholderCss}</style>
            <input
                ref={inputRef}
                className={cls}
                type={field.type}
                name={field.id}
                id={field.id}
                placeholder={field.placeholder}
                required={field.required}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange(e.target.value)
                }
                style={base}
            />
        </>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/** @framerDisableUnlink */
export default function ConversationalForm(props: any) {
    const {
        fields = defaultFields,
        showLabel = true,
        style = {},
        fieldStyle = {},
        navigationStyle = {},
        stepperStyle = {},
        successStyle = {},
        // Transition
        stepTransition,
        onSubmit,
    } = props

    const {
        inputFont,
        inputTextColor = "#111111",
        placeholderColor = "#999999",
        inputBackground = "#ffffff",
        inputPadding,
        inputBorderRadius,
        inputBorder,
        errorColor = "#ef4444",
        labelFont,
        labelColor = "#111111",
    } = fieldStyle

    const {
        arrowBgColor = "#111111",
        arrowHoverBgColor = "#333333",
        arrowColor = "#ffffff",
        arrowSize = 44,
        arrowBorderRadius,
        arrowBorder,
        arrowIconSize = 18,
        arrowIconStroke = 2,
        submitLabel = "Submit",
        submitFont,
        submitBgColor = "#111111",
        submitTextColor = "#ffffff",
        submitPadding,
        submitBorderRadius,
        submitBorder,
        submitHoverBgColor = "#333333",
        submitHoverTextColor = "#ffffff",
    } = navigationStyle

    const {
        showStepper = true,
        stepperSize = 8,
        stepperGap = 8,
        stepperActiveColor = "#111111",
        stepperInactiveColor = "#dddddd",
        stepperCompletedColor = "#888888",
        stepperActiveScale = 1.3,
    } = stepperStyle

    const {
        successTitle = "Thank you! 🎉",
        successSubtitle = "Your response has been received.",
        successTitleFont,
        successTitleColor = "#111111",
        successSubtitleFont,
        successSubtitleColor = "#666666",
        successBackground = "transparent",
    } = successStyle

    const fieldStyles = {
        inputFont,
        inputTextColor,
        placeholderColor,
        inputBackground,
        inputPadding,
        inputBorderRadius,
        inputBorder,
        errorColor,
        labelFont,
        labelColor,
    }

    const visibleFields = (fields as any[]).filter((f) => f.type !== "hidden")
    const hiddenFields = (fields as any[]).filter((f) => f.type === "hidden")

    const [stepIndex, setStepIndex] = React.useState(0)
    const [direction, setDirection] = React.useState(1) // 1=forward, -1=back
    const [values, setValues] = React.useState<Record<string, string>>({})
    const [hasError, setHasError] = React.useState(false)
    const [arrowHovered, setArrowHovered] = React.useState(false)
    const [backHovered, setBackHovered] = React.useState(false)
    const [submitHovered, setSubmitHovered] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<any>(null)

    const currentField = visibleFields[stepIndex]
    const currentFieldType = currentField?.type ?? ""
    const shouldShowLabel =
        showLabel && !["radio", "checkbox"].includes(currentFieldType)
    const isLast = stepIndex === visibleFields.length - 1
    const isFirst = stepIndex === 0
    const currentLabelColor = labelColor
    const currentLabelFont = labelFont ?? {}

    React.useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus?.(), 380)
        return () => clearTimeout(t)
    }, [stepIndex])

    const getContainingForm = React.useCallback(() => {
        return rootRef.current?.closest("form") as HTMLFormElement | null
    }, [])

    const getSerializedValues = React.useCallback(() => {
        const all: Record<string, string> = { ...values }

        hiddenFields.forEach((field: any) => {
            all[field.id] = field.value ?? ""
        })

        visibleFields.forEach((field: any) => {
            if (field.id === currentField?.id) return
            all[field.id] = getFieldSubmissionValue(
                field,
                all[field.id] ?? field.value ?? ""
            )
        })

        if (currentField) {
            all[currentField.id] = getFieldSubmissionValue(
                currentField,
                all[currentField.id] ?? ""
            )
        }

        return all
    }, [currentField, hiddenFields, values, visibleFields])

    const latestSubmissionValues = getSerializedValues()
    const latestOnSubmitRef = React.useRef(onSubmit)
    const latestSubmissionValuesRef = React.useRef(latestSubmissionValues)

    latestOnSubmitRef.current = onSubmit
    latestSubmissionValuesRef.current = latestSubmissionValues

    React.useEffect(() => {
        const form = getContainingForm()
        if (!form) return

        let submitTimer: number | undefined
        let isActive = true

        const handleSubmit = (event: Event) => {
            if (event.defaultPrevented) return
            if (!form.checkValidity()) {
                form.reportValidity()
                return
            }

            if (submitTimer !== undefined) {
                window.clearTimeout(submitTimer)
            }

            submitTimer = window.setTimeout(() => {
                if (!isActive) return
                latestOnSubmitRef.current?.(latestSubmissionValuesRef.current)
                setSubmitted(true)
            }, 0)
        }

        form.addEventListener("submit", handleSubmit)
        return () => {
            isActive = false
            form.removeEventListener("submit", handleSubmit)
            if (submitTimer !== undefined) {
                window.clearTimeout(submitTimer)
            }
        }
    }, [getContainingForm])

    const validate = () => {
        if (!currentField) return true
        const currentInput = inputRef.current
        if (currentInput?.checkValidity) return currentInput.checkValidity()
        if (!currentField.required) return true
        return (values[currentField.id] ?? "").trim() !== ""
    }

    const goForward = () => {
        if (!validate()) {
            setHasError(true)
            return
        }
        setHasError(false)
        if (isLast) {
            const all = latestSubmissionValues
            const form = getContainingForm()

            if (form) {
                if (!form.checkValidity()) {
                    form.reportValidity()
                    return
                }

                if (typeof form.requestSubmit === "function") {
                    form.requestSubmit()
                } else {
                    form.submit()
                }
                return
            }

            latestOnSubmitRef.current?.(all)
            setSubmitted(true)
            return
        }

        setDirection(1)
        setStepIndex((i: number) => i + 1)
    }

    const goBack = () => {
        if (isFirst) return
        setHasError(false)
        setDirection(-1)
        setStepIndex((i: number) => i - 1)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && currentField?.type !== "textarea") {
            e.preventDefault()
            e.stopPropagation()
            goForward()
        }
    }

    const transition = stepTransition ?? { duration: 0.32, ease: "easeInOut" }

    const xIn = direction * 40
    const xOut = direction * -40

    // Arrow button style helper
    const arrowBtnStyle = (
        hovered: boolean,
        active: boolean
    ): React.CSSProperties => ({
        width: arrowSize,
        height: arrowSize,
        borderRadius: normalizeBorderRadius(arrowBorderRadius ?? 999),
        ...normalizeBorder(arrowBorder),
        backgroundColor:
            hovered && active
                ? arrowHoverBgColor
                : active
                  ? arrowBgColor
                  : "transparent",
        cursor: active ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.18s",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
    })

    // ── Success screen ──
    if (submitted) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: successBackground,
                    padding: "0 24px",
                    boxSizing: "border-box",
                    textAlign: "center",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        color: successTitleColor,
                        fontSize: 26,
                        fontWeight: 600,
                        ...(successTitleFont ?? {}),
                    }}
                >
                    {successTitle}
                </div>
                {successSubtitle ? (
                    <div
                        style={{
                            color: successSubtitleColor,
                            fontSize: 16,
                            ...(successSubtitleFont ?? {}),
                        }}
                    >
                        {successSubtitle}
                    </div>
                ) : null}
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Hidden fields and inactive field mirrors */}
            {hiddenFields.map((field: any) => (
                <input
                    key={field.id}
                    type="hidden"
                    name={field.id}
                    value={field.value ?? ""}
                />
            ))}

            {visibleFields.map((field: any) => {
                if (field.id === currentField?.id) return null

                return (
                    <input
                        key={field.id}
                        type="hidden"
                        name={field.id}
                        value={getFieldSubmissionValue(
                            field,
                            values[field.id] ?? field.value ?? ""
                        )}
                    />
                )
            })}

            {/* Root layout: field in center, nav at bottom */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                {/* ── Centered field area ── */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            maxWidth: 560,
                            width: "100%",
                            padding: "0 24px",
                            boxSizing: "border-box",
                        }}
                    >
                        <AnimatePresence
                            mode="sync"
                            initial={false}
                            custom={direction}
                        >
                            <motion.div
                                key={stepIndex}
                                layout
                                initial={{ x: xIn, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: xOut, opacity: 0 }}
                                transition={transition}
                                style={{ width: "100%" }}
                            >
                                {currentField &&
                                    (currentField.type === "radio" ? (
                                        <fieldset
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 10,
                                                width: "100%",
                                                border: 0,
                                                padding: 0,
                                                margin: 0,
                                                minWidth: 0,
                                            }}
                                        >
                                            <legend
                                                style={{
                                                    fontSize: 20,
                                                    fontWeight: 500,
                                                    color: currentLabelColor,
                                                    display: "block",
                                                    padding: 0,
                                                    margin: 0,
                                                    ...(currentLabelFont ?? {}),
                                                }}
                                            >
                                                {currentField.label}
                                                {currentField.required && (
                                                    <span
                                                        style={{
                                                            color: errorColor,
                                                            marginLeft: 4,
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                )}
                                            </legend>

                                            <FieldInput
                                                field={currentField}
                                                fieldStyles={fieldStyles}
                                                value={
                                                    values[currentField.id] ??
                                                    ""
                                                }
                                                onChange={(val) => {
                                                    setHasError(false)
                                                    setValues(
                                                        (
                                                            prev: Record<
                                                                string,
                                                                string
                                                            >
                                                        ) => ({
                                                            ...prev,
                                                            [currentField.id]:
                                                                val,
                                                        })
                                                    )
                                                }}
                                                hasError={hasError}
                                                inputRef={inputRef}
                                            />
                                        </fieldset>
                                    ) : currentField.type === "checkbox" ? (
                                        <fieldset
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 10,
                                                width: "100%",
                                                border: 0,
                                                padding: 0,
                                                margin: 0,
                                                minWidth: 0,
                                            }}
                                        >
                                            <legend
                                                style={{
                                                    fontSize: 20,
                                                    fontWeight: 500,
                                                    color: currentLabelColor,
                                                    display: "block",
                                                    padding: 0,
                                                    margin: 0,
                                                    ...(currentLabelFont ?? {}),
                                                }}
                                            >
                                                {currentField.label}
                                                {currentField.required && (
                                                    <span
                                                        style={{
                                                            color: errorColor,
                                                            marginLeft: 4,
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                )}
                                            </legend>

                                            <FieldInput
                                                field={currentField}
                                                fieldStyles={fieldStyles}
                                                value={
                                                    values[currentField.id] ??
                                                    ""
                                                }
                                                onChange={(val) => {
                                                    setHasError(false)
                                                    setValues(
                                                        (
                                                            prev: Record<
                                                                string,
                                                                string
                                                            >
                                                        ) => ({
                                                            ...prev,
                                                            [currentField.id]:
                                                                val,
                                                        })
                                                    )
                                                }}
                                                hasError={hasError}
                                                inputRef={inputRef}
                                            />
                                        </fieldset>
                                    ) : (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 10,
                                            }}
                                        >
                                            {/* Label */}
                                            {shouldShowLabel && (
                                                <label
                                                    htmlFor={currentField.id}
                                                    style={{
                                                        fontSize: 20,
                                                        fontWeight: 500,
                                                        color: currentLabelColor,
                                                        display: "block",
                                                        ...(currentLabelFont ??
                                                            {}),
                                                    }}
                                                >
                                                    {currentField.label}
                                                    {currentField.required && (
                                                        <span
                                                            style={{
                                                                color: errorColor,
                                                                marginLeft: 4,
                                                            }}
                                                        >
                                                            *
                                                        </span>
                                                    )}
                                                </label>
                                            )}

                                            {/* Input */}
                                            <FieldInput
                                                field={currentField}
                                                fieldStyles={fieldStyles}
                                                value={
                                                    values[currentField.id] ??
                                                    ""
                                                }
                                                onChange={(val) => {
                                                    setHasError(false)
                                                    setValues(
                                                        (
                                                            prev: Record<
                                                                string,
                                                                string
                                                            >
                                                        ) => ({
                                                            ...prev,
                                                            [currentField.id]:
                                                                val,
                                                        })
                                                    )
                                                }}
                                                hasError={hasError}
                                                inputRef={inputRef}
                                            />
                                        </div>
                                    ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Bottom nav: stepper + back/forward ── */}
                <div
                    style={{
                        width: "100%",
                        padding: "16px 24px 24px",
                        boxSizing: "border-box",
                        position: "relative",
                        minHeight: 72,
                    }}
                >
                    {/* Stepper dots */}
                    <div
                        style={{
                            display:
                                showStepper && visibleFields.length > 1
                                    ? "flex"
                                    : "none",
                            alignItems: "center",
                            gap: stepperGap,
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                        }}
                    >
                        {visibleFields.map((_, i) => {
                            const isActive = i === stepIndex
                            const isDone = i < stepIndex
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: stepperSize,
                                        height: stepperSize,
                                        borderRadius: "50%",
                                        backgroundColor: isActive
                                            ? stepperActiveColor
                                            : isDone
                                              ? stepperCompletedColor
                                              : stepperInactiveColor,
                                        transform: isActive
                                            ? `scale(${stepperActiveScale})`
                                            : "scale(1)",
                                        transition:
                                            "transform 0.2s, background-color 0.2s",
                                        flexShrink: 0,
                                    }}
                                />
                            )
                        })}
                    </div>

                    {/* Back */}
                    <div
                        style={{
                            position: "absolute",
                            left: 24,
                            bottom: 24,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <button
                            type="button"
                            onClick={goBack}
                            onMouseEnter={() => setBackHovered(true)}
                            onMouseLeave={() => setBackHovered(false)}
                            style={arrowBtnStyle(backHovered, !isFirst)}
                            tabIndex={isFirst ? -1 : 0}
                            aria-label="Previous"
                        >
                            <ChevronLeft
                                size={arrowIconSize}
                                stroke={arrowIconStroke}
                                color={arrowColor}
                            />
                        </button>
                    </div>

                    {/* Forward or Submit */}
                    <div
                        style={{
                            position: "absolute",
                            right: 24,
                            bottom: 24,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        {isLast ? (
                            <button
                                type="button"
                                onClick={goForward}
                                onMouseEnter={() => setSubmitHovered(true)}
                                onMouseLeave={() => setSubmitHovered(false)}
                                style={{
                                    padding: normalizePadding(
                                        submitPadding ?? {
                                            top: 10,
                                            right: 20,
                                            bottom: 10,
                                            left: 20,
                                        }
                                    ),
                                    borderRadius: normalizeBorderRadius(
                                        submitBorderRadius ?? 8
                                    ),
                                    ...normalizeBorder(submitBorder),
                                    backgroundColor: submitHovered
                                        ? submitHoverBgColor
                                        : submitBgColor,
                                    color: submitHovered
                                        ? submitHoverTextColor
                                        : submitTextColor,
                                    cursor: "pointer",
                                    fontSize: 15,
                                    fontWeight: 500,
                                    transition: "background 0.18s, color 0.18s",
                                    fontFamily: "inherit",
                                    ...(submitFont ?? {}),
                                }}
                            >
                                {submitLabel}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={goForward}
                                onMouseEnter={() => setArrowHovered(true)}
                                onMouseLeave={() => setArrowHovered(false)}
                                style={arrowBtnStyle(arrowHovered, true)}
                                aria-label="Next"
                            >
                                <ChevronRight
                                    size={arrowIconSize}
                                    stroke={arrowIconStroke}
                                    color={arrowColor}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Default fields ───────────────────────────────────────────────────────────

const defaultFields = [
    {
        label: "What's your name?",
        id: "name",
        type: "text",
        placeholder: "Type your answer...",
        required: false,
        value: "",
        options: [],
    },
    {
        label: "What's your email?",
        id: "email",
        type: "email",
        placeholder: "Type your answer...",
        required: false,
        value: "",
        options: [],
    },
    {
        label: "",
        id: "source",
        type: "hidden",
        placeholder: "",
        required: false,
        value: "framer",
        options: [],
    },
]

// ─── Property Controls ────────────────────────────────────────────────────────

ConversationalForm.defaultProps = {
    fields: defaultFields,
    showLabel: true,
    style: {
        width: "100%",
        height: "100%",
    },
    fieldStyle: {
        inputTextColor: "#111111",
        placeholderColor: "#999999",
        inputBackground: "#ffffff",
        inputPadding: "12px",
        inputBorderRadius: "8px",
        inputBorder: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#dddddd",
        },
        errorColor: "#ef4444",
        labelColor: "#111111",
    },
    navigationStyle: {
        arrowBgColor: "#111111",
        arrowHoverBgColor: "#333333",
        arrowColor: "#ffffff",
        arrowSize: 44,
        arrowBorderRadius: "999px",
        arrowBorder: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "transparent",
        },
        arrowIconSize: 18,
        arrowIconStroke: 2,
        submitLabel: "Submit",
        submitBgColor: "#111111",
        submitTextColor: "#ffffff",
        submitPadding: "10px 20px",
        submitBorderRadius: "8px",
        submitBorder: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "transparent",
        },
        submitHoverBgColor: "#333333",
        submitHoverTextColor: "#ffffff",
    },
    stepperStyle: {
        showStepper: true,
        stepperSize: 8,
        stepperGap: 8,
        stepperActiveColor: "#111111",
        stepperInactiveColor: "#dddddd",
        stepperCompletedColor: "#888888",
        stepperActiveScale: 1.3,
    },
    successStyle: {
        successTitle: "Thank you! 🎉",
        successSubtitle: "Your response has been received.",
        successTitleColor: "#111111",
        successSubtitleColor: "#666666",
        successBackground: "transparent",
    },
}

addPropertyControls(ConversationalForm, {
    // ── FIELDS ──────────────────────────────────────────────────────────────

    fields: {
        type: ControlType.Array,
        title: "Fields",
        defaultValue: defaultFields,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Your question here",
                },
                id: {
                    type: ControlType.String,
                    title: "ID / name",
                    defaultValue: "field",
                },
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    defaultValue: "text",
                    options: [
                        "text",
                        "email",
                        "tel",
                        "number",
                        "select",
                        "checkbox",
                        "radio",
                        "date",
                        "time",
                        "textarea",
                        "hidden",
                    ],
                    optionTitles: [
                        "Text",
                        "Email",
                        "Tel",
                        "Number",
                        "Select",
                        "Checkbox",
                        "Radio",
                        "Date",
                        "Time",
                        "Textarea",
                        "Hidden",
                    ],
                },
                placeholder: {
                    type: ControlType.String,
                    title: "Placeholder",
                    defaultValue: "Type your answer...",
                },
                required: {
                    type: ControlType.Boolean,
                    title: "Required",
                    defaultValue: false,
                },
                value: {
                    type: ControlType.String,
                    title: "Hidden value",
                    defaultValue: "",
                    hidden: (props: any) => props.type !== "hidden",
                },
                options: {
                    type: ControlType.Array,
                    title: "Options",
                    defaultValue: [{ label: "Option 1", value: "option_1" }],
                    hidden: (props: any) =>
                        !["select", "radio", "checkbox"].includes(props.type),
                    control: {
                        type: ControlType.Object,
                        controls: {
                            label: {
                                type: ControlType.String,
                                title: "Label",
                                defaultValue: "Option",
                            },
                            value: {
                                type: ControlType.String,
                                title: "Value",
                                defaultValue: "option",
                            },
                        },
                    },
                },
                radioStyle: {
                    type: ControlType.Object,
                    title: "Radio Style",
                    buttonTitle: "Edit Radio",
                    icon: "object",
                    description:
                        "Visual styling for radio options and their checked state.",
                    hidden: (props: any) => props.type !== "radio",
                    controls: {
                        layout: {
                            type: ControlType.Enum,
                            title: "Layout",
                            defaultValue: "vertical",
                            options: ["vertical", "horizontal"],
                            optionTitles: ["Vertical", "Horizontal"],
                        },
                        gap: {
                            type: ControlType.Number,
                            title: "Gap",
                            defaultValue: 10,
                            min: 0,
                            max: 48,
                            displayStepper: true,
                        },
                        controlSize: {
                            type: ControlType.Number,
                            title: "Control Size",
                            defaultValue: 18,
                            min: 8,
                            max: 48,
                            displayStepper: true,
                        },
                        controlRadius: {
                            type: ControlType.BorderRadius,
                            title: "Control Radius",
                            defaultValue: "999px",
                        },
                        controlBackground: {
                            type: ControlType.Color,
                            title: "Control BG",
                            defaultValue: "#ffffff",
                        },
                        controlBorder: {
                            type: ControlType.Border,
                            title: "Control Border",
                            defaultValue: {
                                borderWidth: 1,
                                borderStyle: "solid",
                                borderColor: "#dddddd",
                            },
                        },
                        selectedColor: {
                            type: ControlType.Color,
                            title: "Selected Color",
                            defaultValue: "#111111",
                        },
                        selectedBorderColor: {
                            type: ControlType.Color,
                            title: "Selected Border",
                            defaultValue: "#111111",
                        },
                        optionPadding: {
                            type: ControlType.Padding,
                            title: "Option Padding",
                            defaultValue: {
                                top: 8,
                                right: 12,
                                bottom: 8,
                                left: 12,
                            },
                        },
                        optionRadius: {
                            type: ControlType.BorderRadius,
                            title: "Option Radius",
                            defaultValue: "8px",
                        },
                        optionBackground: {
                            type: ControlType.Color,
                            title: "Option BG",
                            defaultValue: "transparent",
                        },
                        labelColor: {
                            type: ControlType.Color,
                            title: "Label Color",
                            defaultValue: "#111111",
                        },
                        labelFont: {
                            type: ControlType.Font,
                            title: "Label Font",
                            controls: "extended",
                            displayTextAlignment: true,
                            displayFontSize: true,
                        },
                        hoverBackground: {
                            type: ControlType.Color,
                            title: "Hover BG",
                            defaultValue: "#f5f5f5",
                        },
                        alignment: {
                            type: ControlType.Enum,
                            title: "Alignment",
                            defaultValue: "center",
                            options: ["start", "center"],
                            optionTitles: ["Start", "Center"],
                        },
                    },
                },
                checkboxStyle: {
                    type: ControlType.Object,
                    title: "Checkbox Style",
                    buttonTitle: "Edit Checkbox",
                    icon: "object",
                    description:
                        "Visual styling for checkbox options and their checked state.",
                    defaultValue: defaultCheckboxStyle,
                    hidden: (props: any) => props.type !== "checkbox",
                    controls: {
                        layout: {
                            type: ControlType.Enum,
                            title: "Layout",
                            defaultValue: "vertical",
                            options: ["vertical", "horizontal"],
                            optionTitles: ["Vertical", "Horizontal"],
                        },
                        gap: {
                            type: ControlType.Number,
                            title: "Gap",
                            defaultValue: 10,
                            min: 0,
                            max: 48,
                            displayStepper: true,
                        },
                        controlSize: {
                            type: ControlType.Number,
                            title: "Control Size",
                            defaultValue: 18,
                            min: 8,
                            max: 48,
                            displayStepper: true,
                        },
                        controlRadius: {
                            type: ControlType.BorderRadius,
                            title: "Control Radius",
                            defaultValue: "6px",
                        },
                        controlBackground: {
                            type: ControlType.Color,
                            title: "Control BG",
                            defaultValue: "#ffffff",
                        },
                        controlBorder: {
                            type: ControlType.Border,
                            title: "Control Border",
                            defaultValue: {
                                borderWidth: 1,
                                borderStyle: "solid",
                                borderColor: "#dddddd",
                            },
                        },
                        selectedColor: {
                            type: ControlType.Color,
                            title: "Selected Color",
                            defaultValue: "#111111",
                        },
                        checkmarkColor: {
                            type: ControlType.Color,
                            title: "Checkmark Color",
                            defaultValue: "#ffffff",
                        },
                        optionPadding: {
                            type: ControlType.Padding,
                            title: "Option Padding",
                            defaultValue: {
                                top: 8,
                                right: 12,
                                bottom: 8,
                                left: 12,
                            },
                        },
                        optionRadius: {
                            type: ControlType.BorderRadius,
                            title: "Option Radius",
                            defaultValue: "8px",
                        },
                        optionBackground: {
                            type: ControlType.Color,
                            title: "Option BG",
                            defaultValue: "transparent",
                        },
                        labelColor: {
                            type: ControlType.Color,
                            title: "Label Color",
                            defaultValue: "#111111",
                        },
                        labelFont: {
                            type: ControlType.Font,
                            title: "Label Font",
                            controls: "extended",
                            displayTextAlignment: true,
                            displayFontSize: true,
                        },
                        hoverBackground: {
                            type: ControlType.Color,
                            title: "Hover BG",
                            defaultValue: "#f5f5f5",
                        },
                        alignment: {
                            type: ControlType.Enum,
                            title: "Alignment",
                            defaultValue: "center",
                            options: ["start", "center"],
                            optionTitles: ["Start", "Center"],
                        },
                    },
                },
                numberBehavior: {
                    type: ControlType.Object,
                    title: "Number Behavior",
                    buttonTitle: "Edit Number",
                    icon: "object",
                    description:
                        "Native number input behavior for the current field.",
                    defaultValue: defaultNumberBehavior,
                    hidden: (props: any) => props.type !== "number",
                    controls: {
                        min: {
                            type: ControlType.String,
                            title: "Min",
                            defaultValue: "",
                        },
                        max: {
                            type: ControlType.String,
                            title: "Max",
                            defaultValue: "",
                        },
                        step: {
                            type: ControlType.Number,
                            title: "Step",
                            defaultValue: 1,
                            min: 0.0001,
                            displayStepper: true,
                        },
                        allowNegative: {
                            type: ControlType.Boolean,
                            title: "Allow Negative",
                            defaultValue: true,
                        },
                        decimalPlaces: {
                            type: ControlType.Number,
                            title: "Decimal Places",
                            defaultValue: 0,
                            min: 0,
                            max: 8,
                            displayStepper: true,
                        },
                    },
                },
            },
        },
    },

    // ── FIELD STYLES ─────────────────────────────────────────────────────────

    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    fieldStyle: {
        type: ControlType.Object,
        title: "Field Style",
        buttonTitle: "Edit Style",
        icon: "effect",
        description: "Typography and input appearance for the current field.",
        controls: {
            labelFont: {
                type: ControlType.Font,
                title: "Label Font",
                controls: "extended",
                displayTextAlignment: true,
                displayFontSize: true,
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "#111111",
            },
            inputFont: {
                type: ControlType.Font,
                title: "Input Font",
                controls: "extended",
                displayTextAlignment: true,
                displayFontSize: true,
            },
            inputTextColor: {
                type: ControlType.Color,
                title: "Input Text",
                defaultValue: "#111111",
            },
            placeholderColor: {
                type: ControlType.Color,
                title: "Placeholder",
                defaultValue: "#999999",
            },
            inputBackground: {
                type: ControlType.Color,
                title: "Input BG",
                defaultValue: "#ffffff",
            },
            inputPadding: {
                type: ControlType.Padding,
                title: "Input Padding",
                defaultValue: "12px",
            },
            inputBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Input Radius",
                defaultValue: "8px",
            },
            inputBorder: {
                type: ControlType.Border,
                title: "Input Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#dddddd",
                },
            },
            errorColor: {
                type: ControlType.Color,
                title: "Error Color",
                defaultValue: "#ef4444",
            },
        },
    },

    // ── ARROW BUTTON ─────────────────────────────────────────────────────────

    navigationStyle: {
        type: ControlType.Object,
        title: "Buttons",
        buttonTitle: "Edit Buttons",
        icon: "interact",
        description: "Arrow and submit button styling for the step navigation.",
        controls: {
            arrowColor: {
                type: ControlType.Color,
                title: "Arrow Icon",
                defaultValue: "#ffffff",
            },
            arrowBgColor: {
                type: ControlType.Color,
                title: "Arrow BG",
                defaultValue: "#111111",
            },
            arrowHoverBgColor: {
                type: ControlType.Color,
                title: "Arrow Hover BG",
                defaultValue: "#333333",
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Arrow Size",
                defaultValue: 44,
                min: 24,
                max: 96,
                displayStepper: true,
            },
            arrowBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Arrow Radius",
                defaultValue: "999px",
            },
            arrowBorder: {
                type: ControlType.Border,
                title: "Arrow Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "transparent",
                },
            },
            arrowIconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 18,
                min: 10,
                max: 48,
                displayStepper: true,
            },
            arrowIconStroke: {
                type: ControlType.Number,
                title: "Icon Stroke",
                defaultValue: 2,
                min: 1,
                max: 4,
                step: 0.5,
                displayStepper: true,
            },
            submitLabel: {
                type: ControlType.String,
                title: "Submit Text",
                defaultValue: "Submit",
            },
            submitFont: {
                type: ControlType.Font,
                title: "Submit Font",
                controls: "extended",
                displayTextAlignment: true,
                displayFontSize: true,
            },
            submitBgColor: {
                type: ControlType.Color,
                title: "Submit BG",
                defaultValue: "#111111",
            },
            submitTextColor: {
                type: ControlType.Color,
                title: "Submit Text Color",
                defaultValue: "#ffffff",
            },
            submitPadding: {
                type: ControlType.Padding,
                title: "Submit Padding",
                defaultValue: "10px 20px",
            },
            submitBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Submit Radius",
                defaultValue: "8px",
            },
            submitBorder: {
                type: ControlType.Border,
                title: "Submit Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "transparent",
                },
            },
            submitHoverBgColor: {
                type: ControlType.Color,
                title: "Submit Hover BG",
                defaultValue: "#333333",
            },
            submitHoverTextColor: {
                type: ControlType.Color,
                title: "Submit Hover Text",
                defaultValue: "#ffffff",
            },
        },
    },

    // ── STEPPER ───────────────────────────────────────────────────────────────

    stepperStyle: {
        type: ControlType.Object,
        title: "Stepper",
        buttonTitle: "Edit Stepper",
        icon: "object",
        description:
            "Controls the progress dots shown above the navigation buttons.",
        controls: {
            showStepper: {
                type: ControlType.Boolean,
                title: "Show Stepper",
                defaultValue: true,
            },
            stepperSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 8,
                min: 4,
                max: 24,
                displayStepper: true,
            },
            stepperGap: {
                type: ControlType.Number,
                title: "Dot Gap",
                defaultValue: 8,
                min: 2,
                max: 32,
                displayStepper: true,
            },
            stepperActiveColor: {
                type: ControlType.Color,
                title: "Active Dot",
                defaultValue: "#111111",
            },
            stepperInactiveColor: {
                type: ControlType.Color,
                title: "Inactive Dot",
                defaultValue: "#dddddd",
            },
            stepperCompletedColor: {
                type: ControlType.Color,
                title: "Completed Dot",
                defaultValue: "#888888",
            },
            stepperActiveScale: {
                type: ControlType.Number,
                title: "Active Scale",
                defaultValue: 1.3,
                min: 1,
                max: 2,
                step: 0.05,
                displayStepper: true,
            },
        },
    },

    // ── SUCCESS SCREEN ────────────────────────────────────────────────────────

    successStyle: {
        type: ControlType.Object,
        title: "Success",
        buttonTitle: "Edit Success",
        icon: "object",
        description: "Shown after the last step is submitted successfully.",
        controls: {
            successTitle: {
                type: ControlType.String,
                title: "Success Title",
                defaultValue: "Thank you! 🎉",
            },
            successTitleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                displayTextAlignment: true,
                displayFontSize: true,
            },
            successTitleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#111111",
            },
            successSubtitle: {
                type: ControlType.String,
                title: "Success Subtitle",
                defaultValue: "Your response has been received.",
            },
            successSubtitleFont: {
                type: ControlType.Font,
                title: "Subtitle Font",
                controls: "extended",
                displayTextAlignment: true,
                displayFontSize: true,
            },
            successSubtitleColor: {
                type: ControlType.Color,
                title: "Subtitle Color",
                defaultValue: "#666666",
            },
            successBackground: {
                type: ControlType.Color,
                title: "Success BG",
                defaultValue: "transparent",
            },
        },
    },

    // ── TRANSITION ────────────────────────────────────────────────────────────

    stepTransition: {
        type: ControlType.Transition,
        title: "Step Transition",
        defaultValue: { duration: 0.32, ease: "easeInOut" },
    },
})
