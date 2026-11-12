// Smart form fields component with conditional logic and calculations
import React, {
    useState,
    useMemo,
    useCallback,
    memo,
    startTransition,
    useRef,
    useEffect,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ThemeMode = "light" | "dark" | "auto"

type FieldType =
    | "text"
    | "email"
    | "tel"
    | "number"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "time"
    | "textarea"
    | "calculation"
    | "hidden"
    | "note"
    | "slider"

interface BorderStyle {
    borderWidth?: number
    borderStyle?: string
    borderColor?: string
}

interface CheckboxRadioStyle {
    size?: number
    inputBorder?: BorderStyle
    fillColor?: string
    checkmarkColor?: string
    gap?: number
    backgroundColor?: string
    padding?: string
    borderRadius?: number
    layout?: "row" | "column"
    border?: BorderStyle
    hoverBorder?: BorderStyle
    hoverBackgroundColor?: string
    hoverLabelColor?: string
    activeBackgroundColor?: string
    activeLabelColor?: string
    inputBackground?: string
    inputHoverBackground?: string
    font?: any
}

interface Field {
    id: string
    label: string
    type: FieldType
    placeholder?: string
    options?: {
        value: string
        name: string
        enabled: boolean
        amount?: number
    }[]
    required?: boolean
    conditionalField?: string
    conditionalValues?: string[]
    /** How condition works: "show" (default) = show when condition matches, "hide" = hide when condition matches */
    conditionalMode?: "show" | "hide"
    formula?: string
    value?: string
    amount?: number
    formStep?: number
    noteText?: string
    noteBackgroundColor?: string
    noteTextColor?: string
    noteBorder?: BorderStyle
    noteBorderRadius?: number
    notePadding?: string
    calculationPrefix?: string
    calculationSuffix?: string
    checkboxStyle?: CheckboxRadioStyle
    radioStyle?: CheckboxRadioStyle
    numberButtonStyle?: {
        width?: number
        height?: number
        backgroundColor?: string
        textColor?: string
        border?: BorderStyle
        borderRadius?: number
        fontSize?: number
    }
    showNumberButtons?: boolean
    telInputMode?: "numeric" | "tel"
    showCountryCode?: boolean
    countryCodeWidth?: number
    countryCodePadding?: string
    /** Gap between "+" sign and country code digit (px) */
    countryCodeGap?: number
    selectStyle?: {
        dropdownBackgroundColor?: string
        dropdownTextColor?: string
        dropdownHoverBackgroundColor?: string
        dropdownHoverTextColor?: string
        dropdownBorder?: BorderStyle
        dropdownMaxHeight?: number
    }
    sliderMin?: number
    sliderMax?: number
    sliderStep?: number
    sliderDefaultValue?: number
    showSliderValue?: boolean
    sliderStyle?: {
        trackColor?: string
        fillColor?: string
        thumbColor?: string
        thumbBorderColor?: string
        thumbSize?: number
        trackHeight?: number
        valueTextColor?: string
        valueGap?: number
        marginTop?: number
        marginBottom?: number
    }
    /** Field width as percentage (5-100, in 5% increments). Defaults to 100% */
    width?: number
}

interface Step {
    stepNumber: number
    title: string
}

interface SmartFormFieldsProps {
    fields: Field[]
    gapHorizontal?: number
    gapVertical?: number
    showLabels?: boolean
    labelStyle?: CSSProperties & { font?: any; color?: string }
    containerStyle?: CSSProperties & { border?: BorderStyle; padding?: string }
    fieldStyle?: CSSProperties & {
        border?: BorderStyle
        focusBorder?: BorderStyle
        gap?: number
        padding?: string
    }
    enableSteps?: boolean
    steps?: Step[]
    showStepIndicator?: boolean
    stepIndicatorStyle?: {
        activeColor?: string
        inactiveColor?: string
        completedColor?: string
        activeTextColor?: string
        inactiveTextColor?: string
        activeLabelColor?: string
        inactiveLabelColor?: string
        font?: any
    }
    previousButtonText?: string
    nextButtonText?: string
    submitButtonText?: string
    buttonStyle?: {
        backgroundColor?: string
        textColor?: string
        border?: BorderStyle
        borderRadius?: number
        padding?: string
        font?: any
        hoverBackgroundColor?: string
        hoverTextColor?: string
    }
    theme?: ThemeMode
    successMessage?: string
    /** Toggle to show or hide the success message after submit */
    showSuccessMessage?: boolean
    successMessageStyle?: {
        backgroundColor?: string
        textColor?: string
        border?: BorderStyle
        borderRadius?: number
        padding?: string
        font?: any
    }
    hideFormOnSubmit?: boolean
    resetFormOnSubmit?: boolean
    /** Duration in ms before auto-reset after successful submit (when resetFormOnSubmit is true). Defaults to 2000. */
    successAutoHideDuration?: number
}

interface FormFieldProps {
    field: Field
    values: Record<string, any>
    handleChange: (id: string, val: any) => void
    globalFieldStyle?: CSSProperties & {
        border?: BorderStyle
        focusBorder?: BorderStyle
        gap?: number
    }
    showLabels: boolean
    labelStyle?: CSSProperties & { font?: any; color?: string }
    containerStyle?: CSSProperties & { border?: BorderStyle }
    themeColors: {
        background: string
        text: string
        border: string
        inputBackground: string
        labelText: string
        noteBackground: string
    }
    fieldWidth?: number
    usedFieldTypes: Set<FieldType>
}

// Constants
const THEME_COLORS = {
    dark: {
        background: "transparent",
        text: "#e0e0e0",
        border: "#404040",
        inputBackground: "#2a2a2a",
        labelText: "#b0b0b0",
        noteBackground: "#2a2a2a",
    },
    light: {
        background: "transparent",
        text: "#111",
        border: "#ccc",
        inputBackground: "#fff",
        labelText: "#555",
        noteBackground: "#f5f5f5",
    },
} as const

const ALLOWED_KEYS = new Set([
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
])

const TEXT_INPUT_TYPES = new Set(["text", "email", "tel", "date", "time"])
const NON_CONTAINER_TYPES = new Set(["note", "checkbox", "radio"])
const DEFAULT_SUCCESS_MESSAGE =
    "Thank you! Your form has been submitted successfully."

// Regex patterns (compiled once for performance)
const IDENTIFIER_REGEX = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g
const NUMERIC_ONLY_REGEX = /[^0-9]/g
const NUMBER_CLEAN_REGEX = /[^0-9-]/g
const NUMBER_DASH_REGEX = /(?!^)-/g
const NOTE_PLACEHOLDER_REGEX = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g

const TEL_ROW_STYLE: CSSProperties = {
    display: "flex",
    alignItems: "stretch",
    gap: 8,
    width: "100%",
}

const COUNTRY_CODE_PLUS_STYLE: CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
}

const COUNTRY_CODE_INPUT_STYLE_BASE: CSSProperties = {
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    padding: 0,
    textAlign: "center",
    fontSize: "14px",
}

const STEP_NAV_CONTAINER_STYLE: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
}

const FONT_WEIGHT_NORMAL: CSSProperties = { fontWeight: "normal" }

// Utility functions
const buildBorderStyle = (b?: BorderStyle): string | undefined => {
    if (b?.borderWidth == null) return undefined
    if (b.borderWidth === 0) return "none"
    return `${b.borderWidth}px ${b.borderStyle || "solid"} ${b.borderColor || "#ccc"}`
}

const hasValue = (v: any): boolean =>
    v != null && v !== "" && (!Array.isArray(v) || v.length > 0)

const checkFieldVisibility = (
    field: Field,
    values: Record<string, any>
): boolean => {
    if (!field.conditionalField) return true
    const value = values[field.conditionalField]
    const cv = field.conditionalValues
    if (!cv?.length) {
        const base = hasValue(value)
        return field.conditionalMode === "hide" ? !base : base
    }
    const validValues = cv.filter(Boolean)

    let match: boolean
    if (!validValues.length) {
        match = hasValue(value)
    } else if (Array.isArray(value)) {
        // For checkbox or multi-select style values
        match = value.some((v) => validValues.includes(String(v)))
    } else {
        match = validValues.includes(String(value))
    }

    return field.conditionalMode === "hide" ? !match : match
}

const getFieldCalculationValue = (f: Field, v: any, h: boolean): number => {
    if (f.type === "hidden" && f.amount != null) return h ? f.amount : 0
    if (f.options) {
        if (f.type === "select" || f.type === "radio") {
            const opt = f.options.find((o) => o.value === v)
            return opt?.amount ?? 0
        }
        if (f.type === "checkbox" && Array.isArray(v)) {
            const m = new Map(f.options.map((o) => [o.value, o.amount ?? 0]))
            return v.reduce((s, x) => s + (m.get(x) ?? 0), 0)
        }
    }
    const p = parseFloat(v)
    return isNaN(p) ? 0 : p
}

const renderHiddenInput = (field: Field, val: any) => {
    const fieldName = getFieldName(field)
    return Array.isArray(val) ? (
        val.map((v, i) => (
            <input
                key={`${field.id}-${i}`}
                type="hidden"
                name={fieldName}
                value={v}
            />
        ))
    ) : (
        <input key={field.id} type="hidden" name={fieldName} value={val} />
    )
}

const getFieldName = (field: Pick<Field, "id" | "label">): string =>
    field.label?.trim() || field.id

// Custom hooks
const useSystemTheme = () => {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light"
        return window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    })

    useEffect(() => {
        if (typeof window === "undefined") return

        const mq = window.matchMedia?.("(prefers-color-scheme: dark)")
        if (!mq) return

        const handler = (e: MediaQueryListEvent) =>
            setTheme(e.matches ? "dark" : "light")
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])

    return theme
}

// Step Indicator Component
const StepIndicator = memo(
    ({
        totalSteps,
        currentStep,
        steps,
        stepIndicatorStyle,
    }: {
        totalSteps: number
        currentStep: number
        steps: Step[]
        stepIndicatorStyle?: SmartFormFieldsProps["stepIndicatorStyle"]
    }) => {
        const {
            activeColor = "#0099FF",
            inactiveColor = "#CCCCCC",
            completedColor = "#22CC66",
            activeTextColor = activeColor,
            inactiveTextColor = "#666666",
            activeLabelColor,
            inactiveLabelColor,
            font,
        } = stepIndicatorStyle || {}

        const stepsMap = useMemo(
            () => new Map(steps.map((s) => [s.stepNumber, s])),
            [steps]
        )

        const stepElements = useMemo(
            () =>
                Array.from({ length: totalSteps }, (_, i) => {
                    const num = i + 1
                    const active = num === currentStep
                    const done = num < currentStep
                    const info = stepsMap.get(num)

                    return (
                        <div
                            key={num}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flex: 1,
                            }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    backgroundColor: done
                                        ? completedColor
                                        : active
                                          ? activeColor
                                          : inactiveColor,
                                    color: done
                                        ? "#fff"
                                        : active
                                          ? activeTextColor
                                          : inactiveTextColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    ...font,
                                }}
                            >
                                {done ? "✓" : num}
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    fontSize: "14px",
                                    fontWeight: active ? "600" : "400",
                                    color: active
                                        ? activeLabelColor || activeTextColor
                                        : inactiveLabelColor ||
                                          inactiveTextColor,
                                    ...font,
                                }}
                            >
                                {info?.title || `Step ${num}`}
                            </div>
                            {num < totalSteps && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: 2,
                                        backgroundColor: done
                                            ? completedColor
                                            : inactiveColor,
                                    }}
                                />
                            )}
                        </div>
                    )
                }),
            [
                totalSteps,
                currentStep,
                stepsMap,
                completedColor,
                activeColor,
                inactiveColor,
                activeTextColor,
                inactiveTextColor,
                activeLabelColor,
                inactiveLabelColor,
                font,
            ]
        )

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                {stepElements}
            </div>
        )
    }
)

StepIndicator.displayName = "StepIndicator"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SmartFormFields({
    fields = [],
    gapHorizontal = 12,
    gapVertical = 12,
    showLabels = true,
    labelStyle,
    containerStyle,
    fieldStyle: globalFieldStyle,
    enableSteps = false,
    steps = [],
    showStepIndicator = true,
    stepIndicatorStyle,
    previousButtonText = "Previous",
    nextButtonText = "Next",
    submitButtonText = "Submit",
    buttonStyle,
    theme = "auto",
    showSuccessMessage = true,
    successMessage = DEFAULT_SUCCESS_MESSAGE,
    successMessageStyle,
    hideFormOnSubmit = true,
    resetFormOnSubmit = false,
    successAutoHideDuration = 2000,
}: SmartFormFieldsProps) {
    const getInitialValues = useCallback(() => {
        const initialValues: Record<string, any> = {}
        for (const field of fields) {
            if (field.type === "number") initialValues[field.id] = 1
            if (field.type === "slider") {
                initialValues[field.id] =
                    field.sliderDefaultValue ?? field.sliderMin ?? 0
            }
            if (field.type === "tel" && field.showCountryCode) {
                initialValues[`${field.id}_countryCode`] = "1"
            }
        }
        return initialValues
    }, [fields])

    const [values, setValues] = useState<Record<string, any>>(getInitialValues)

    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [hoveredButton, setHoveredButton] = useState<
        "prev" | "next" | "submit" | null
    >(null)
    const formRef = useRef<HTMLDivElement>(null)

    const systemTheme = useSystemTheme()
    const appliedTheme = theme === "auto" ? systemTheme : theme
    const themeColors = THEME_COLORS[appliedTheme]

    const handleChange = useCallback((id: string, val: any) => {
        startTransition(() => setValues((prev) => ({ ...prev, [id]: val })))
    }, [])

    // Build a simple lookup map for fields by id to avoid repeated array scans
    const fieldsById = useMemo(() => {
        const map: Record<string, Field> = {}
        for (const f of fields) {
            map[f.id] = f
        }
        return map
    }, [fields])

    // Pre-filter calculation fields once
    const calculationFields = useMemo(
        () => fields.filter((f) => f.type === "calculation" && !!f.formula),
        [fields]
    )

    // Pre-compile calculation formulas to avoid repeated regex + eval on every render
    const compiledFormulas = useMemo(() => {
        const formulaMap = new Map<
            string,
            {
                refs: string[]
                fn: (...args: number[]) => number
            }
        >()

        if (!calculationFields.length) return formulaMap

        for (const f of calculationFields) {
            IDENTIFIER_REGEX.lastIndex = 0
            const matches = f.formula!.match(IDENTIFIER_REGEX)
            if (!matches || !matches.length) continue

            const refs = Array.from(
                new Set<string>(matches.filter((r) => !!fieldsById[r]))
            )

            if (!refs.length) continue

            try {
                // Create a function like: (price, quantity) => return price * quantity
                // Using field IDs as parameter names preserves the original formula syntax
                // eslint-disable-next-line no-new-func
                const fn = new Function(...refs, `return ${f.formula};`) as (
                    ...args: number[]
                ) => number

                formulaMap.set(f.id, { refs, fn })
            } catch {
                // If formula can't be compiled, skip it (will yield empty value)
            }
        }

        return formulaMap
    }, [calculationFields, fieldsById])

    const calculatedValues = useMemo(() => {
        if (!calculationFields.length) return values

        const calc = { ...values }

        for (const f of calculationFields) {
            const compiled = compiledFormulas.get(f.id)
            if (!compiled) {
                calc[f.id] = ""
                continue
            }

            const { refs, fn } = compiled

            const hasVal = refs.some((r) => {
                const refField = fieldsById[r]
                return (
                    refField && refField.type !== "hidden" && hasValue(calc[r])
                )
            })

            try {
                const args = refs.map((r) =>
                    getFieldCalculationValue(fieldsById[r]!, calc[r], hasVal)
                )
                const result = fn(...args)
                calc[f.id] = isNaN(result as any) ? 0 : (result as any)
            } catch {
                calc[f.id] = ""
            }
        }

        return calc
    }, [values, calculationFields, compiledFormulas, fieldsById])

    const totalSteps = useMemo(() => {
        if (!enableSteps || !steps.length) return 1
        return steps.reduce((max, s) => Math.max(max, s.stepNumber), 1)
    }, [enableSteps, steps])

    // Determine which field types are actually used
    const usedFieldTypes = useMemo(
        () => new Set(fields.map((f) => f.type)),
        [fields]
    )

    const { visibleFields, hiddenFieldsWithValues } = useMemo(() => {
        const visible = fields.filter(
            (f) =>
                (!enableSteps || !steps.length || f.formStep === currentStep) &&
                checkFieldVisibility(f, calculatedValues)
        )

        const hidden = enableSteps
            ? (() => {
                  const visibleIds = new Set<string>()
                  for (const f of visible) visibleIds.add(f.id)
                  return fields.filter(
                      (f) =>
                          !visibleIds.has(f.id) &&
                          f.type !== "note" &&
                          hasValue(calculatedValues[f.id])
                  )
              })()
            : []

        return { visibleFields: visible, hiddenFieldsWithValues: hidden }
    }, [fields, calculatedValues, enableSteps, currentStep, steps.length])

    const validateCurrentStep = useCallback(() => {
        if (!formRef.current) return true
        const parentForm = formRef.current.closest("form")
        if (!parentForm) {
            // If no parent form, validate fields manually
            const els = formRef.current.querySelectorAll(
                'input:not([type="hidden"]),select,textarea'
            )
            return Array.from(els).every((el) => {
                const inp = el as
                    | HTMLInputElement
                    | HTMLSelectElement
                    | HTMLTextAreaElement
                if (inp.required && !inp.checkValidity()) {
                    inp.reportValidity()
                    return false
                }
                return true
            })
        }

        // With a parent form, use its validation and also trigger the
        // native browser tooltip tray (reportValidity) when invalid.
        const isValid = parentForm.checkValidity()
        if (!isValid) {
            parentForm.reportValidity()
        }
        return isValid
    }, [])

    const handleNext = useCallback(() => {
        if (currentStep < totalSteps && validateCurrentStep()) {
            startTransition(() => setCurrentStep((p) => p + 1))
        }
    }, [currentStep, totalSteps, validateCurrentStep])

    const handlePrev = useCallback(() => {
        if (currentStep > 1) {
            startTransition(() => setCurrentStep((p) => p - 1))
        }
    }, [currentStep])

    const handleSubmit = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!formRef.current) return

            const parentForm = formRef.current.closest("form")

            if (parentForm) {
                // Validate the form before allowing submission
                if (!parentForm.checkValidity()) {
                    e.preventDefault()
                    parentForm.reportValidity()
                    return
                }

                // Don't prevent default - let form submit naturally to Framer
                // The useEffect will detect the actual form submission and show success
                // Only show success if form actually submits (not just button click)
            } else {
                // If no parent form, validate and show success
                e.preventDefault()
                if (validateCurrentStep()) {
                    setIsSubmitted(true)
                }
            }
        },
        [validateCurrentStep]
    )

    const buttonStyleMemo = useMemo(
        () => ({
            padding: buttonStyle?.padding || "12px 24px",
            backgroundColor: buttonStyle?.backgroundColor || "#111",
            color: buttonStyle?.textColor || "#fff",
            border: buildBorderStyle(buttonStyle?.border) || "none",
            borderRadius:
                buttonStyle?.borderRadius != null
                    ? `${buttonStyle.borderRadius}px`
                    : "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            width: buttonStyle ? undefined : "100%",
            transition: "background-color .2s,color .2s",
            ...buttonStyle?.font,
        }),
        [buttonStyle]
    )

    const getButtonHoverStyle = useCallback(
        (key: "prev" | "next" | "submit") => {
            if (!buttonStyle || hoveredButton !== key) return {}
            const hasHoverStyles =
                !!buttonStyle.hoverBackgroundColor ||
                !!buttonStyle.hoverTextColor
            if (!hasHoverStyles) return {}
            const hoverStyles: CSSProperties = {}
            if (buttonStyle.hoverBackgroundColor) {
                hoverStyles.backgroundColor = buttonStyle.hoverBackgroundColor
            }
            if (buttonStyle.hoverTextColor) {
                hoverStyles.color = buttonStyle.hoverTextColor
            }
            return hoverStyles
        },
        [buttonStyle, hoveredButton]
    )

    const isLastStep = enableSteps && currentStep === totalSteps
    const canGoPrev = currentStep > 1

    const verticalGap = gapVertical
    const horizontalGap = gapHorizontal

    const containerBaseStyle = useMemo(
        () => ({
            display: "flex" as const,
            flexDirection: "column" as const,
            gap: verticalGap,
            backgroundColor: themeColors.background,
            color: themeColors.text,
            transition: "background-color .3s,color .3s",
        }),
        [verticalGap, themeColors.background, themeColors.text]
    )

    const fieldsContainerStyle: CSSProperties = useMemo(
        () => ({
            display: "flex",
            flexWrap: "wrap",
            rowGap: verticalGap,
            columnGap: horizontalGap,
            width: "100%",
        }),
        [verticalGap, horizontalGap]
    )

    const successMessageStyleMemo = useMemo(
        () => ({
            backgroundColor:
                successMessageStyle?.backgroundColor ||
                (appliedTheme === "dark" ? "#22CC66" : "#E8F5E9"),
            color:
                successMessageStyle?.textColor ||
                (appliedTheme === "dark" ? "#fff" : "#2E7D32"),
            border: buildBorderStyle(successMessageStyle?.border) || "none",
            borderRadius:
                successMessageStyle?.borderRadius != null
                    ? `${successMessageStyle.borderRadius}px`
                    : "6px",
            padding: successMessageStyle?.padding || "16px 20px",
            fontSize: "16px",
            fontWeight: "500",
            boxSizing: "border-box" as const,
            width: "100%",
            transition: "background-color .3s,color .3s,border-color .3s",
            ...successMessageStyle?.font,
        }),
        [successMessageStyle, appliedTheme]
    )

    // Listen for form submission from parent Framer form (e.g., when Enter is pressed)
    useEffect(() => {
        if (isSubmitted || !formRef.current) return

        const parentForm = formRef.current.closest("form")
        if (!parentForm) return

        const handleFormSubmit = (e: Event) => {
            // Only show success if form is valid and submit was not prevented
            // We listen in the bubble phase so defaultPrevented reflects
            // Framer's own submit handling (e.g. missing email/action).
            if (
                parentForm.checkValidity() &&
                !e.defaultPrevented &&
                !isSubmitted
            ) {
                // Wait a bit to ensure Framer processes the submission
                // If form submission fails, Framer will prevent default and we won't reach here
                setTimeout(() => {
                    setIsSubmitted(true)
                }, 500)
            }
        }

        parentForm.addEventListener("submit", handleFormSubmit)
        return () => parentForm.removeEventListener("submit", handleFormSubmit)
    }, [isSubmitted])

    // Reset form after successful submission if enabled
    useEffect(() => {
        if (isSubmitted && resetFormOnSubmit) {
            const resetTimeout = setTimeout(() => {
                setValues(getInitialValues())
                setCurrentStep(1)
                setIsSubmitted(false)

                // Reset form inputs if form element exists
                if (formRef.current) {
                    const parentForm = formRef.current.closest("form")
                    if (parentForm) {
                        parentForm.reset()
                    }
                }
            }, successAutoHideDuration) // Wait before resetting so success message is visible

            return () => clearTimeout(resetTimeout)
        }
    }, [
        isSubmitted,
        resetFormOnSubmit,
        getInitialValues,
        successAutoHideDuration,
    ])

    const successOnlyContainerStyle = useMemo(
        () => ({ ...containerBaseStyle, width: "100%", minHeight: "60px" }),
        [containerBaseStyle]
    )

    // If form should hide on submit and is submitted, show only success message
    if (isSubmitted && hideFormOnSubmit) {
        return (
            <div style={successOnlyContainerStyle}>
                {showSuccessMessage && (
                    <div style={successMessageStyleMemo}>
                        {successMessage || DEFAULT_SUCCESS_MESSAGE}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div ref={formRef} style={containerBaseStyle}>
            {enableSteps && showStepIndicator && (
                <StepIndicator
                    totalSteps={totalSteps}
                    currentStep={currentStep}
                    steps={steps}
                    stepIndicatorStyle={stepIndicatorStyle}
                />
            )}

            {showSuccessMessage && isSubmitted && !hideFormOnSubmit && (
                <div style={successMessageStyleMemo}>
                    {successMessage || DEFAULT_SUCCESS_MESSAGE}
                </div>
            )}

            <div style={fieldsContainerStyle}>
                {visibleFields.map((field) => (
                    <FormField
                        key={field.id}
                        field={field}
                        values={calculatedValues}
                        handleChange={handleChange}
                        globalFieldStyle={globalFieldStyle}
                        showLabels={showLabels}
                        labelStyle={labelStyle}
                        containerStyle={containerStyle}
                        themeColors={themeColors}
                        fieldWidth={field.width}
                        usedFieldTypes={usedFieldTypes}
                    />
                ))}
            </div>

            {hiddenFieldsWithValues.map((field) =>
                renderHiddenInput(field, calculatedValues[field.id])
            )}

            {enableSteps ? (
                <div style={STEP_NAV_CONTAINER_STYLE}>
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!canGoPrev}
                        style={{
                            ...buttonStyleMemo,
                            ...getButtonHoverStyle("prev"),
                            opacity: canGoPrev ? 1 : 0.5,
                            cursor: canGoPrev ? "pointer" : "not-allowed",
                            flex: isLastStep ? 0 : 1,
                        }}
                        onMouseEnter={
                            buttonStyle
                                ? () => setHoveredButton("prev")
                                : undefined
                        }
                        onMouseLeave={
                            buttonStyle
                                ? () => setHoveredButton(null)
                                : undefined
                        }
                        className={buttonStyle ? "custom-button" : ""}
                    >
                        {previousButtonText}
                    </button>
                    {isLastStep ? (
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            style={{
                                ...buttonStyleMemo,
                                ...getButtonHoverStyle("submit"),
                                flex: 1,
                            }}
                            onMouseEnter={
                                buttonStyle
                                    ? () => setHoveredButton("submit")
                                    : undefined
                            }
                            onMouseLeave={
                                buttonStyle
                                    ? () => setHoveredButton(null)
                                    : undefined
                            }
                            className={buttonStyle ? "custom-button" : ""}
                        >
                            {submitButtonText}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            style={{
                                ...buttonStyleMemo,
                                ...getButtonHoverStyle("next"),
                                flex: 1,
                            }}
                            onMouseEnter={
                                buttonStyle
                                    ? () => setHoveredButton("next")
                                    : undefined
                            }
                            onMouseLeave={
                                buttonStyle
                                    ? () => setHoveredButton(null)
                                    : undefined
                            }
                            className={buttonStyle ? "custom-button" : ""}
                        >
                            {nextButtonText}
                        </button>
                    )}
                </div>
            ) : (
                <button
                    type="submit"
                    onClick={handleSubmit}
                    style={{
                        ...buttonStyleMemo,
                        ...getButtonHoverStyle("submit"),
                        marginTop: 20,
                    }}
                    onMouseEnter={
                        buttonStyle
                            ? () => setHoveredButton("submit")
                            : undefined
                    }
                    onMouseLeave={
                        buttonStyle ? () => setHoveredButton(null) : undefined
                    }
                    className={buttonStyle ? "custom-button" : ""}
                >
                    {submitButtonText}
                </button>
            )}
        </div>
    )
}

const FormField = memo(function FormField({
    field,
    values,
    handleChange,
    globalFieldStyle,
    showLabels,
    labelStyle,
    containerStyle,
    themeColors,
    fieldWidth = 100,
    usedFieldTypes,
}: FormFieldProps) {
    // Early return for hidden fields BEFORE any hooks
    if (field.type === "hidden")
        return (
            <input
                type="hidden"
                name={getFieldName(field)}
                value={field.value || ""}
            />
        )

    const inputStyle: CSSProperties = useMemo(
        () => ({
            background:
                globalFieldStyle?.backgroundColor ||
                themeColors.inputBackground,
            color: globalFieldStyle?.color || themeColors.text,
            border:
                buildBorderStyle(globalFieldStyle?.border) ||
                `1px solid ${themeColors.border}`,
            borderRadius:
                globalFieldStyle?.borderRadius != null
                    ? `${globalFieldStyle.borderRadius}px`
                    : "6px",
            padding: globalFieldStyle?.padding || "8px 12px",
            width: "100%",
            fontSize:
                globalFieldStyle?.fontSize != null
                    ? `${globalFieldStyle.fontSize}px`
                    : "14px",
            fontWeight: globalFieldStyle?.fontWeight || "normal",
            boxSizing: "border-box",
            transition: "background-color .3s,color .3s,border-color .3s",
            ...globalFieldStyle?.font,
        }),
        [globalFieldStyle, themeColors]
    )

    const focusBorderStyle = buildBorderStyle(globalFieldStyle?.focusBorder)

    const labelStyleMemo = useMemo(
        () => ({
            color: labelStyle?.color || themeColors.labelText,
            display: "flex",
            flexDirection: "column" as const,
            gap: globalFieldStyle?.gap ?? 4,
            fontSize:
                labelStyle?.fontSize != null
                    ? `${labelStyle.fontSize}px`
                    : "14px",
            fontWeight: labelStyle?.fontWeight || "normal",
            width: "100%",
            transition: "color .3s",
            ...labelStyle?.font,
        }),
        [labelStyle, globalFieldStyle?.gap, themeColors.labelText]
    )

    const handleFieldChange = useCallback(
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >
        ) => {
            if (field.type === "checkbox") {
                const t = e.target as HTMLInputElement
                const currentValue = values[field.id]
                const cv = Array.isArray(currentValue) ? currentValue : []
                const newValue = t.checked
                    ? [...cv, t.value]
                    : cv.filter((v: string) => v !== t.value)
                handleChange(field.id, newValue)
            } else {
                handleChange(field.id, e.target.value)
            }
        },
        [field.type, field.id, values[field.id], handleChange]
    )

    // Conditionally compute values only for used field types (hooks always called)
    const handleTelInput = useCallback(
        (e: React.FormEvent<HTMLInputElement>) => {
            if (field.type === "tel" && field.telInputMode === "numeric") {
                const inp = e.target as HTMLInputElement
                const clean = inp.value.replace(NUMERIC_ONLY_REGEX, "")
                if (inp.value !== clean) {
                    inp.value = clean
                    handleChange(field.id, clean)
                }
            }
        },
        [field.type, field.telInputMode, field.id, handleChange]
    )

    const handleNumberInput = useCallback(
        (e: React.FormEvent<HTMLInputElement>) => {
            if (field.type === "number") {
                const inp = e.target as HTMLInputElement
                const clean = inp.value
                    .replace(NUMBER_CLEAN_REGEX, "")
                    .replace(NUMBER_DASH_REGEX, "")
                if (inp.value !== clean) {
                    inp.value = clean
                    handleChange(field.id, clean)
                }
            }
        },
        [field.type, field.id, handleChange]
    )

    const handleNumberKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (field.type !== "number") return
            const isModifierKey =
                (e.ctrlKey || e.metaKey) &&
                ["a", "c", "v", "x"].includes(e.key.toLowerCase())
            const isNumericKey =
                (e.key >= "0" && e.key <= "9") ||
                (e.code >= "Numpad0" && e.code <= "Numpad9")

            if (
                isModifierKey ||
                isNumericKey ||
                ALLOWED_KEYS.has(e.key) ||
                e.key === "-"
            )
                return
            e.preventDefault()
        },
        [field.type]
    )

    const showNumberButtons =
        field.type === "number" && field.showNumberButtons !== false

    const handleNumberIncrement = useCallback(() => {
        if (field.type === "number") {
            const val = parseFloat(values[field.id]) || 1
            handleChange(field.id, val + 1)
        }
    }, [field.type, field.id, values[field.id], handleChange])

    const handleNumberDecrement = useCallback(() => {
        if (field.type === "number") {
            const val = parseFloat(values[field.id]) || 1
            handleChange(field.id, Math.max(1, val - 1))
        }
    }, [field.type, field.id, values[field.id], handleChange])

    const handleCountryCodeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const clean = e.target.value.replace(NUMERIC_ONLY_REGEX, "")
            handleChange(`${field.id}_countryCode`, clean)
        },
        [field.id, handleChange]
    )

    const countryCodeBoxStyle = useMemo((): CSSProperties | null => {
        if (field.type !== "tel" || !field.showCountryCode) return null
        return {
            ...inputStyle,
            display: "flex",
            alignItems: "center",
            flex: "0 0 auto",
            gap: field.countryCodeGap ?? 4,
            padding: field.countryCodePadding || "0 8px",
            borderRight: `1px solid ${themeColors.border}`,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            whiteSpace: "nowrap",
            width: `${field.countryCodeWidth ?? 50}px`,
        }
    }, [
        field.type,
        field.showCountryCode,
        field.countryCodeGap,
        field.countryCodePadding,
        field.countryCodeWidth,
        inputStyle,
        themeColors.border,
    ])

    const telInputStyle = useMemo((): CSSProperties => {
        const base = { ...inputStyle, flex: 1 }
        if (field.type === "tel" && field.showCountryCode)
            return {
                ...base,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
            }
        return base
    }, [field.type, field.showCountryCode, inputStyle])

    const telSubmittedValue = useMemo((): string => {
        if (field.type !== "tel") return ""
        const code = values[`${field.id}_countryCode`]
        const num = values[field.id] || ""
        if (field.showCountryCode && code)
            return num ? `+${code} ${num}` : `+${code}`
        return num
    }, [
        field.type,
        field.id,
        field.showCountryCode,
        values[field.id],
        values[`${field.id}_countryCode`],
    ])

    const countryCodeInputStyle = useMemo(
        () => ({ ...COUNTRY_CODE_INPUT_STYLE_BASE, color: inputStyle.color }),
        [inputStyle.color]
    )

    const calculationDisplayStyle = useMemo(
        () => ({
            ...inputStyle,
            fontWeight: "600",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
        }),
        [inputStyle]
    )

    const textareaStyle = useMemo(
        () => ({
            ...inputStyle,
            minHeight: "80px",
            resize: "vertical" as const,
        }),
        [inputStyle]
    )

    const noteBoxStyle = useMemo((): CSSProperties | null => {
        if (field.type !== "note") return null
        return {
            whiteSpace: "pre-wrap",
            minHeight: "60px",
            backgroundColor:
                field.noteBackgroundColor || themeColors.noteBackground,
            color: field.noteTextColor || themeColors.text,
            border:
                buildBorderStyle(field.noteBorder) ||
                `1px solid ${themeColors.border}`,
            borderRadius: `${field.noteBorderRadius ?? 6}px`,
            padding: field.notePadding || "12px",
            boxSizing: "border-box",
            width: "100%",
            transition: "background-color .3s,color .3s,border-color .3s",
        }
    }, [
        field.type,
        field.noteBackgroundColor,
        field.noteTextColor,
        field.noteBorder,
        field.noteBorderRadius,
        field.notePadding,
        themeColors.noteBackground,
        themeColors.text,
        themeColors.border,
    ])

    const processedNoteText = useMemo(
        () =>
            field.type === "note"
                ? field.noteText?.replace(NOTE_PLACEHOLDER_REGEX, (_, id) =>
                      String(values[id] || "")
                  ) || ""
                : "",
        [field.type, field.noteText, values]
    )

    const crs = useMemo(
        () =>
            field.type === "checkbox"
                ? field.checkboxStyle
                : field.type === "radio"
                  ? field.radioStyle
                  : undefined,
        [field.type, field.checkboxStyle, field.radioStyle]
    )

    const enabledOptions = useMemo(
        () =>
            field.type === "select" ||
            field.type === "checkbox" ||
            field.type === "radio"
                ? field.options?.filter((opt) => opt.enabled !== false) || []
                : [],
        [field.type, field.options]
    )

    const numberButtonStyleMemo = useMemo(() => {
        if (field.type !== "number") return {}
        const nbs = field.numberButtonStyle
        return {
            width: nbs?.width ? `${nbs.width}px` : "auto",
            height: nbs?.height ? `${nbs.height}px` : "auto",
            padding: nbs?.width || nbs?.height ? "0" : "8px 16px",
            backgroundColor:
                nbs?.backgroundColor ||
                globalFieldStyle?.backgroundColor ||
                themeColors.inputBackground,
            color:
                nbs?.textColor || globalFieldStyle?.color || themeColors.text,
            border:
                buildBorderStyle(nbs?.border) ||
                buildBorderStyle(globalFieldStyle?.border) ||
                `1px solid ${themeColors.border}`,
            borderRadius:
                nbs?.borderRadius != null
                    ? `${nbs.borderRadius}px`
                    : globalFieldStyle?.borderRadius != null
                      ? `${globalFieldStyle.borderRadius}px`
                      : "6px",
            cursor: "pointer",
            fontSize: nbs?.fontSize ? `${nbs.fontSize}px` : "16px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color .3s,color .3s,border-color .3s",
        }
    }, [
        field.numberButtonStyle,
        globalFieldStyle?.backgroundColor,
        globalFieldStyle?.color,
        globalFieldStyle?.border,
        globalFieldStyle?.borderRadius,
        themeColors.inputBackground,
        themeColors.text,
        themeColors.border,
    ])

    const checkboxRadioWrapperStyle = useMemo(
        () => ({
            display: "flex",
            gap: crs?.gap ?? 8,
            flexWrap: "wrap" as const,
            flexDirection:
                crs?.layout === "column"
                    ? ("column" as const)
                    : ("row" as const),
        }),
        [crs?.layout, crs?.gap]
    )

    const checkboxRadioOptionStyle = useMemo(() => {
        const base: CSSProperties = {
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            ...crs?.font,
        }
        if (!crs) return base

        const hasCustomStyles =
            crs.backgroundColor ||
            crs.padding ||
            crs.borderRadius != null ||
            crs.border

        if (!hasCustomStyles) return base

        return {
            ...base,
            backgroundColor: crs.backgroundColor,
            padding: crs.padding,
            borderRadius:
                crs.borderRadius != null ? `${crs.borderRadius}px` : undefined,
            border: buildBorderStyle(crs.border),
            transition: "background-color .2s,border .2s",
        }
    }, [crs])

    const showContainer = !NON_CONTAINER_TYPES.has(field.type as any)
    const sid = `field-${field.id}-style`

    const wrapperStyle = useMemo(() => {
        const base: CSSProperties = {
            width: `${fieldWidth}%`,
            boxSizing: "border-box",
        }
        if (showContainer && containerStyle) {
            return {
                ...base,
                ...containerStyle,
                border: buildBorderStyle(containerStyle.border),
            }
        }
        return base
    }, [fieldWidth, showContainer, containerStyle])

    const dynamicStyles = useMemo(() => {
        const styles: string[] = []

        if (focusBorderStyle) {
            styles.push(
                `.${sid}:focus{outline:none;border:${focusBorderStyle}!important}`
            )
        }

        // Only generate styles for used field types
        if (usedFieldTypes.has("select") && field.type === "select") {
            const ss = field.selectStyle
            if (ss) {
                const dropdownBg =
                    ss.dropdownBackgroundColor || inputStyle.background
                const dropdownText = ss.dropdownTextColor || themeColors.text
                const hoverBg =
                    ss.dropdownHoverBackgroundColor || "rgba(0, 153, 255, 0.1)"
                const hoverText = ss.dropdownHoverTextColor || dropdownText

                styles.push(
                    `${ss.dropdownMaxHeight ? `select.${sid}{max-height:${ss.dropdownMaxHeight}px;overflow-y:auto}` : ""}` +
                        `select.${sid} option{background-color:${dropdownBg};color:${dropdownText}${ss.dropdownBorder ? `;border:${buildBorderStyle(ss.dropdownBorder)}` : ""}}` +
                        `select.${sid} option:hover{background-color:${hoverBg};color:${hoverText}}`
                )
            } else {
                styles.push(
                    `select.${sid} option{background-color:${inputStyle.background};color:#000}`
                )
            }
        }

        if (
            (usedFieldTypes.has("date") || usedFieldTypes.has("time")) &&
            (field.type === "date" || field.type === "time")
        ) {
            const icon =
                field.type === "date"
                    ? "%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E"
                    : "%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E"
            styles.push(
                `.${sid}::-webkit-calendar-picker-indicator{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(themeColors.text)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${icon}%3C/svg%3E") no-repeat center;background-size:contain;opacity:1;cursor:pointer;transition:opacity .3s}` +
                    `.${sid}::-webkit-calendar-picker-indicator:hover{opacity:.7}`
            )
        }

        if (
            (usedFieldTypes.has("checkbox") || usedFieldTypes.has("radio")) &&
            crs
        ) {
            const size = crs.size ?? 16
            const fillColor = crs.fillColor || "#09f"
            const checkmarkColor = crs.checkmarkColor || "white"
            const inputBorder =
                buildBorderStyle(crs.inputBorder) || "2px solid #09f"
            const checkmarkStyle =
                field.type === "checkbox"
                    ? `left:30%;top:10%;width:30%;height:60%;border:solid ${checkmarkColor};border-width:0 2px 2px 0;transform:rotate(45deg)`
                    : `left:50%;top:50%;width:50%;height:50%;background-color:${checkmarkColor};border-radius:50%;transform:translate(-50%,-50%)`

            styles.push(
                `.checkbox-radio-input-${field.id}{width:${size}px!important;height:${size}px!important;min-width:${size}px!important;min-height:${size}px!important;border:${inputBorder}!important;background-color:${crs.inputBackground || "transparent"}!important;cursor:pointer;appearance:none;-webkit-appearance:none;-moz-appearance:none;border-radius:${field.type === "radio" ? "50%" : "3px"}!important;position:relative;flex-shrink:0}`,
                `.checkbox-radio-input-${field.id}:checked{background-color:${fillColor}!important;border-color:${fillColor}!important}`,
                `.checkbox-radio-input-${field.id}:checked::after{content:'';position:absolute;${checkmarkStyle}}`
            )

            const hoverStyles: string[] = []
            if (crs.hoverBorder)
                hoverStyles.push(
                    `border:${buildBorderStyle(crs.hoverBorder)}!important`
                )
            if (crs.hoverBackgroundColor)
                hoverStyles.push(
                    `background-color:${crs.hoverBackgroundColor}!important`
                )
            if (crs.hoverLabelColor)
                hoverStyles.push(`color:${crs.hoverLabelColor}!important`)

            if (hoverStyles.length) {
                styles.push(
                    `.checkbox-radio-option-${field.id}:hover:not(:has(input:checked)){${hoverStyles.join(";")}}`
                )
            }

            const activeStyles: string[] = []
            if (crs.activeBackgroundColor)
                activeStyles.push(
                    `background-color:${crs.activeBackgroundColor}!important`
                )
            if (crs.activeLabelColor)
                activeStyles.push(`color:${crs.activeLabelColor}!important`)

            if (activeStyles.length) {
                styles.push(
                    `.checkbox-radio-option-${field.id}:has(input:checked){${activeStyles.join(";")}}`
                )
            }

            if (crs.inputHoverBackground) {
                styles.push(
                    `.checkbox-radio-option-${field.id}:hover:not(:has(input:checked)) .checkbox-radio-input-${field.id}{background-color:${crs.inputHoverBackground}!important}`
                )
            }
        }

        return styles.length ? styles.join("") : ""
    }, [
        field.type,
        field.id,
        field.selectStyle,
        focusBorderStyle,
        inputStyle.background,
        themeColors.text,
        themeColors.border,
        crs,
        sid,
        usedFieldTypes,
    ])

    return (
        <div style={wrapperStyle}>
            {dynamicStyles && <style>{dynamicStyles}</style>}

            <label style={labelStyleMemo}>
                {field.type !== "note" && showLabels && (
                    <div>{field.label}</div>
                )}
                {field.type === "calculation" &&
                    (() => {
                        const displayValue =
                            typeof values[field.id] === "number"
                                ? values[field.id].toFixed(2)
                                : values[field.id] || ""
                        return (
                            <>
                                <div style={calculationDisplayStyle}>
                                    {field.calculationPrefix && (
                                        <span style={FONT_WEIGHT_NORMAL}>
                                            {field.calculationPrefix}
                                        </span>
                                    )}
                                    <span>{displayValue}</span>
                                    {field.calculationSuffix && (
                                        <span style={FONT_WEIGHT_NORMAL}>
                                            {field.calculationSuffix}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="hidden"
                                    name={getFieldName(field)}
                                    value={displayValue}
                                />
                            </>
                        )
                    })()}
                {field.type === "textarea" && (
                    <textarea
                        name={getFieldName(field)}
                        placeholder={field.placeholder}
                        required={field.required}
                        onChange={handleFieldChange}
                        value={values[field.id] || ""}
                        style={textareaStyle}
                        className={sid}
                    />
                )}
                {field.type === "note" && noteBoxStyle && (
                    <div style={noteBoxStyle}>{processedNoteText}</div>
                )}
                {field.type === "select" && (
                    <select
                        name={getFieldName(field)}
                        required={field.required}
                        onChange={handleFieldChange}
                        value={values[field.id] || ""}
                        style={inputStyle}
                        className={sid}
                    >
                        <option value="">Select</option>
                        {enabledOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.name || opt.value}
                            </option>
                        ))}
                    </select>
                )}
                {TEXT_INPUT_TYPES.has(field.type as any) &&
                    field.type !== "tel" && (
                        <input
                            name={getFieldName(field)}
                            type={field.type}
                            placeholder={field.placeholder}
                            required={field.required}
                            onChange={handleFieldChange}
                            value={values[field.id] || ""}
                            style={inputStyle}
                            className={sid}
                        />
                    )}
                {field.type === "tel" && (
                    <>
                        <div style={TEL_ROW_STYLE}>
                            {field.showCountryCode && countryCodeBoxStyle && (
                                <div style={countryCodeBoxStyle}>
                                    <span style={COUNTRY_CODE_PLUS_STYLE}>
                                        +
                                    </span>
                                    <input
                                        type="tel"
                                        placeholder="1"
                                        value={
                                            values[`${field.id}_countryCode`] ??
                                            "1"
                                        }
                                        onChange={handleCountryCodeChange}
                                        style={countryCodeInputStyle}
                                        inputMode="numeric"
                                    />
                                </div>
                            )}
                            <input
                                type="tel"
                                placeholder={field.placeholder}
                                required={field.required}
                                onChange={handleFieldChange}
                                onInput={handleTelInput}
                                value={values[field.id] || ""}
                                style={telInputStyle}
                                className={sid}
                                inputMode={
                                    field.telInputMode === "numeric"
                                        ? "numeric"
                                        : undefined
                                }
                            />
                        </div>
                        <input
                            type="hidden"
                            name={getFieldName(field)}
                            value={telSubmittedValue}
                        />
                    </>
                )}
                {field.type === "number" && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        {showNumberButtons && (
                            <button
                                type="button"
                                onClick={handleNumberDecrement}
                                style={numberButtonStyleMemo}
                            >
                                −
                            </button>
                        )}
                        <input
                            name={getFieldName(field)}
                            type="number"
                            placeholder={field.placeholder}
                            required={field.required}
                            onChange={handleFieldChange}
                            onInput={handleNumberInput}
                            onKeyDown={handleNumberKeyDown}
                            value={values[field.id] ?? 1}
                            min={1}
                            inputMode="numeric"
                            style={{
                                ...inputStyle,
                                textAlign: showNumberButtons
                                    ? "center"
                                    : "left",
                                flex: 1,
                            }}
                            className={sid}
                        />
                        {showNumberButtons && (
                            <button
                                type="button"
                                onClick={handleNumberIncrement}
                                style={numberButtonStyleMemo}
                            >
                                +
                            </button>
                        )}
                    </div>
                )}
                {field.type === "slider" &&
                    (() => {
                        const min = field.sliderMin ?? 0
                        const max = field.sliderMax ?? 100
                        const defaultValue = field.sliderDefaultValue ?? min
                        const currentValue =
                            values[field.id] != null
                                ? Number(values[field.id])
                                : defaultValue
                        const clampedValue = Math.max(
                            min,
                            Math.min(max, currentValue)
                        )
                        const step = Math.max(
                            1,
                            Math.round(field.sliderStep ?? 1)
                        )

                        const {
                            trackColor: trackColorRaw,
                            fillColor: fillColorRaw,
                            thumbColor = "#B0B0B0",
                            thumbBorderColor,
                            thumbSize = 20,
                            trackHeight = 6,
                            valueTextColor,
                            valueGap = 16,
                            marginTop = 8,
                            marginBottom = 0,
                        } = field.sliderStyle || {}

                        const trackColor = trackColorRaw || "#E0E0E0"
                        const fillColor = fillColorRaw || trackColor
                        const contentGap = 10
                        const percent =
                            max > min
                                ? ((clampedValue - min) / (max - min)) * 100
                                : 0

                        return (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: contentGap,
                                    width: "100%",
                                    marginTop,
                                    marginBottom,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: valueGap,
                                        width: "100%",
                                    }}
                                >
                                    <input
                                        name={getFieldName(field)}
                                        type="range"
                                        min={min}
                                        max={max}
                                        step={step}
                                        value={clampedValue}
                                        onChange={handleFieldChange}
                                        required={field.required}
                                        style={{
                                            flex: 1,
                                            height: `${trackHeight}px`,
                                            outline: "none",
                                            WebkitAppearance: "none",
                                            appearance: "none",
                                            background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`,
                                            cursor: "pointer",
                                            borderRadius: `${trackHeight / 2}px`,
                                            border: "none",
                                            padding: 0,
                                            margin: 0,
                                            boxSizing: "border-box",
                                        }}
                                        className={`slider-${field.id}`}
                                    />
                                    {field.showSliderValue !== false && (
                                        <div
                                            style={{
                                                minWidth: "50px",
                                                textAlign: "right",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color:
                                                    valueTextColor ||
                                                    themeColors.text,
                                                lineHeight: "1",
                                            }}
                                        >
                                            {clampedValue}
                                        </div>
                                    )}
                                </div>
                                <style>{`
                                .slider-${field.id} {
                                    border: none !important;
                                    padding: 0 !important;
                                    margin: 0 !important;
                                }
                                .slider-${field.id}::-webkit-slider-track {
                                    height: ${trackHeight}px;
                                    background: transparent;
                                    border-radius: ${trackHeight / 2}px;
                                    border: none;
                                }
                                .slider-${field.id}::-webkit-slider-runnable-track {
                                    height: ${trackHeight}px;
                                    background: transparent;
                                    border-radius: ${trackHeight / 2}px;
                                }
                                .slider-${field.id}::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    appearance: none;
                                    width: ${thumbSize}px;
                                    height: ${thumbSize}px;
                                    background: ${thumbColor};
                                    border-radius: 50%;
                                    cursor: pointer;
                                    border: ${thumbBorderColor ? `2px solid ${thumbBorderColor}` : "none"};
                                    margin-top: ${-(
                                        (thumbSize - trackHeight) /
                                        2
                                    )}px;
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                                }
                                .slider-${field.id}::-moz-range-track {
                                    height: ${trackHeight}px;
                                    background: ${trackColor};
                                    border-radius: ${trackHeight / 2}px;
                                    border: none;
                                }
                                .slider-${field.id}::-moz-range-thumb {
                                    width: ${thumbSize}px;
                                    height: ${thumbSize}px;
                                    background: ${thumbColor};
                                    border-radius: 50%;
                                    cursor: pointer;
                                    border: ${thumbBorderColor ? `2px solid ${thumbBorderColor}` : "none"};
                                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                                }
                                .slider-${field.id}::-moz-range-progress {
                                    height: ${trackHeight}px;
                                    background: ${fillColor};
                                    border-radius: ${trackHeight / 2}px;
                                }
                            `}</style>
                            </div>
                        )
                    })()}
                {(field.type === "checkbox" || field.type === "radio") && (
                    <div style={checkboxRadioWrapperStyle}>
                        {enabledOptions.map((opt, idx) => {
                            const isCheckbox = field.type === "checkbox"
                            const isChecked = isCheckbox
                                ? Array.isArray(values[field.id]) &&
                                  values[field.id].includes(opt.value)
                                : values[field.id] === opt.value
                            const isRequired =
                                field.required &&
                                (isCheckbox
                                    ? idx === 0 &&
                                      (!Array.isArray(values[field.id]) ||
                                          values[field.id].length === 0)
                                    : true)

                            return (
                                <label
                                    key={opt.value}
                                    style={checkboxRadioOptionStyle}
                                    className={`checkbox-radio-option-${field.id}`}
                                >
                                    <input
                                        name={getFieldName(field)}
                                        type={field.type}
                                        value={opt.value}
                                        onChange={handleFieldChange}
                                        checked={isChecked}
                                        required={isRequired}
                                        className={`checkbox-radio-input-${field.id}`}
                                    />
                                    {opt.name || opt.value}
                                </label>
                            )
                        })}
                    </div>
                )}
            </label>
        </div>
    )
})

const checkboxRadioControls = {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["row", "column"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "row",
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 8,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        optional: true,
    },
    size: {
        type: ControlType.Number,
        title: "Input Size",
        min: 10,
        max: 40,
        unit: "px",
        defaultValue: 16,
    },
    inputBorder: {
        type: ControlType.Border,
        title: "Input Border",
        optional: true,
    },
    inputBackground: {
        type: ControlType.Color,
        title: "Input Background",
        optional: true,
    },
    fillColor: {
        type: ControlType.Color,
        title: "Checked Fill",
        defaultValue: "#0099FF",
        optional: true,
    },
    inputHoverBackground: {
        type: ControlType.Color,
        title: "Input Hover BG",
        optional: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Container BG",
        optional: true,
    },
    padding: {
        type: ControlType.Padding,
        title: "Container Padding",
        optional: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Container Radius",
        min: 0,
        unit: "px",
        optional: true,
    },
    border: {
        type: ControlType.Border,
        title: "Container Border",
        optional: true,
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        optional: true,
    },
    hoverBorder: {
        type: ControlType.Border,
        title: "Hover Border",
        optional: true,
    },
    hoverLabelColor: {
        type: ControlType.Color,
        title: "Hover Label",
        optional: true,
    },
    activeBackgroundColor: {
        type: ControlType.Color,
        title: "Active BG",
        optional: true,
    },
    activeLabelColor: {
        type: ControlType.Color,
        title: "Active Label",
        optional: true,
    },
}

addPropertyControls(SmartFormFields, {
    fields: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: (props) =>
                        props.type === "note" ? "" : "Field Label",
                    hidden: (props) =>
                        props.type === "note" || props.type === "hidden",
                },
                id: {
                    type: ControlType.String,
                    title: "ID",
                    defaultValue: "field1",
                },
                type: {
                    type: ControlType.Enum,
                    title: "Type",
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
                        "calculation",
                        "hidden",
                        "note",
                        "slider",
                    ],
                    defaultValue: "text",
                },
                formStep: {
                    type: ControlType.Number,
                    title: "Form Step",
                    defaultValue: 1,
                    min: 1,
                    displayStepper: true,
                    hidden: (props, rootProps) => !rootProps.enableSteps,
                },
                placeholder: {
                    type: ControlType.String,
                    title: "Placeholder",
                    hidden: (props) =>
                        props.type === "hidden" ||
                        props.type === "note" ||
                        props.type === "calculation" ||
                        props.type === "checkbox" ||
                        props.type === "radio" ||
                        props.type === "slider",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    hidden: (props) => props.type !== "hidden",
                },
                amount: {
                    type: ControlType.Number,
                    title: "Amount",
                    step: 0.01,
                    hidden: (props) => props.type !== "hidden",
                },
                noteText: {
                    type: ControlType.String,
                    title: "Note Text",
                    defaultValue: "Hello {name}, your email is {email}",
                    displayTextArea: true,
                    placeholder: "Use {fieldID} to insert field values",
                    hidden: (props) => props.type !== "note",
                    preventLocalization: true,
                },
                noteBackgroundColor: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#FFFFFF",
                    hidden: (props) => props.type !== "note",
                    optional: true,
                },
                noteTextColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#111111",
                    hidden: (props) => props.type !== "note",
                    optional: true,
                },
                noteBorder: {
                    type: ControlType.Border,
                    title: "Border",
                    defaultValue: {
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: "#CCCCCC",
                    },
                    hidden: (props) => props.type !== "note",
                    optional: true,
                },
                notePadding: {
                    type: ControlType.Padding,
                    title: "Padding",
                    defaultValue: "12px",
                    hidden: (props) => props.type !== "note",
                    optional: true,
                },
                noteBorderRadius: {
                    type: ControlType.Number,
                    title: "Border Radius",
                    defaultValue: 6,
                    min: 0,
                    hidden: (props) => props.type !== "note",
                    optional: true,
                },
                formula: {
                    type: ControlType.String,
                    title: "Formula",
                    placeholder: "e.g. price * quantity + tax",
                    displayTextArea: true,
                    hidden: (props) => props.type !== "calculation",
                },
                calculationPrefix: {
                    type: ControlType.String,
                    title: "Prefix",
                    placeholder: "e.g. $",
                    hidden: (props) => props.type !== "calculation",
                    optional: true,
                },
                calculationSuffix: {
                    type: ControlType.String,
                    title: "Suffix",
                    placeholder: "e.g. USD",
                    hidden: (props) => props.type !== "calculation",
                    optional: true,
                },
                options: {
                    type: ControlType.Array,
                    title: "Options",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            value: {
                                type: ControlType.String,
                                title: "Value",
                                defaultValue: "Option",
                            },
                            name: {
                                type: ControlType.String,
                                title: "Name",
                                defaultValue: "Option",
                            },
                            amount: {
                                type: ControlType.Number,
                                title: "Amount",
                                defaultValue: 0,
                                step: 0.01,
                            },
                            enabled: {
                                type: ControlType.Boolean,
                                title: "Enabled",
                                defaultValue: true,
                            },
                        },
                    },
                    defaultValue: [
                        { value: "Option 1", name: "Option 1", enabled: true },
                        { value: "Option 2", name: "Option 2", enabled: true },
                    ],
                    hidden: (props) =>
                        !["select", "radio", "checkbox"].includes(props.type),
                },
                checkboxStyle: {
                    type: ControlType.Object,
                    title: "Checkbox Style",
                    optional: true,
                    controls: {
                        ...checkboxRadioControls,
                        checkmarkColor: {
                            type: ControlType.Color,
                            title: "Checkmark Color",
                            defaultValue: "#FFFFFF",
                            optional: true,
                        },
                    },
                    hidden: (props) => props.type !== "checkbox",
                },
                radioStyle: {
                    type: ControlType.Object,
                    title: "Radio Style",
                    optional: true,
                    controls: {
                        ...checkboxRadioControls,
                        checkmarkColor: {
                            type: ControlType.Color,
                            title: "Dot Color",
                            defaultValue: "#FFFFFF",
                            optional: true,
                        },
                    },
                    hidden: (props) => props.type !== "radio",
                },
                numberButtonStyle: {
                    type: ControlType.Object,
                    title: "Number Button Style",
                    optional: true,
                    controls: {
                        width: {
                            type: ControlType.Number,
                            title: "Width",
                            min: 20,
                            max: 100,
                            unit: "px",
                            optional: true,
                        },
                        height: {
                            type: ControlType.Number,
                            title: "Height",
                            min: 20,
                            max: 100,
                            unit: "px",
                            optional: true,
                        },
                        backgroundColor: {
                            type: ControlType.Color,
                            title: "Background",
                            optional: true,
                        },
                        textColor: {
                            type: ControlType.Color,
                            title: "Text Color",
                            optional: true,
                        },
                        border: {
                            type: ControlType.Border,
                            title: "Border",
                            optional: true,
                        },
                        borderRadius: {
                            type: ControlType.Number,
                            title: "Border Radius",
                            min: 0,
                            unit: "px",
                            optional: true,
                        },
                        fontSize: {
                            type: ControlType.Number,
                            title: "Font Size",
                            min: 10,
                            max: 32,
                            unit: "px",
                            optional: true,
                        },
                    },
                    hidden: (props) => props.type !== "number",
                },
                showNumberButtons: {
                    type: ControlType.Boolean,
                    title: "Show Number Buttons",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                    hidden: (props) => props.type !== "number",
                },
                telInputMode: {
                    type: ControlType.Enum,
                    title: "Tel Input Mode",
                    options: ["tel", "numeric"],
                    optionTitles: ["All Keys", "Numeric"],
                    defaultValue: "tel",
                    displaySegmentedControl: true,
                    hidden: (props) => props.type !== "tel",
                },
                showCountryCode: {
                    type: ControlType.Boolean,
                    title: "Country Code",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: (props) => props.type !== "tel",
                },
                countryCodeWidth: {
                    type: ControlType.Number,
                    title: "Code Width",
                    defaultValue: 50,
                    min: 40,
                    max: 200,
                    unit: "px",
                    optional: true,
                    hidden: (props) =>
                        props.type !== "tel" || !props.showCountryCode,
                },
                countryCodePadding: {
                    type: ControlType.Padding,
                    title: "Code Padding",
                    defaultValue: "0px 8px",
                    optional: true,
                    hidden: (props) =>
                        props.type !== "tel" || !props.showCountryCode,
                },
                countryCodeGap: {
                    type: ControlType.Number,
                    title: "Gap (+ & digit)",
                    defaultValue: 4,
                    min: 0,
                    max: 24,
                    unit: "px",
                    optional: true,
                    hidden: (props) =>
                        props.type !== "tel" || !props.showCountryCode,
                },
                selectStyle: {
                    type: ControlType.Object,
                    title: "Select Dropdown Style",
                    optional: true,
                    controls: {
                        dropdownBackgroundColor: {
                            type: ControlType.Color,
                            title: "Dropdown Background",
                            optional: true,
                        },
                        dropdownTextColor: {
                            type: ControlType.Color,
                            title: "Dropdown Text Color",
                            optional: true,
                        },
                        dropdownHoverBackgroundColor: {
                            type: ControlType.Color,
                            title: "Hover Background",
                            optional: true,
                        },
                        dropdownHoverTextColor: {
                            type: ControlType.Color,
                            title: "Hover Text Color",
                            optional: true,
                        },
                        dropdownBorder: {
                            type: ControlType.Border,
                            title: "Dropdown Border",
                            optional: true,
                        },
                        dropdownMaxHeight: {
                            type: ControlType.Number,
                            title: "Max Height",
                            min: 100,
                            max: 500,
                            unit: "px",
                            optional: true,
                        },
                    },
                    hidden: (props) => props.type !== "select",
                },
                sliderMin: {
                    type: ControlType.Number,
                    title: "Min Value",
                    defaultValue: 0,
                    hidden: (props) => props.type !== "slider",
                },
                sliderMax: {
                    type: ControlType.Number,
                    title: "Max Value",
                    defaultValue: 100,
                    hidden: (props) => props.type !== "slider",
                },
                sliderStep: {
                    type: ControlType.Number,
                    title: "Step",
                    defaultValue: 1,
                    min: 1,
                    step: 1,
                    hidden: (props) => props.type !== "slider",
                },
                sliderDefaultValue: {
                    type: ControlType.Number,
                    title: "Default Value",
                    defaultValue: 50,
                    hidden: (props) => props.type !== "slider",
                },
                showSliderValue: {
                    type: ControlType.Boolean,
                    title: "Show Value",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                    hidden: (props) => props.type !== "slider",
                },
                sliderStyle: {
                    type: ControlType.Object,
                    title: "Slider Style",
                    optional: true,
                    controls: {
                        trackColor: {
                            type: ControlType.Color,
                            title: "Track Color",
                            optional: true,
                        },
                        fillColor: {
                            type: ControlType.Color,
                            title: "Fill Color",
                            optional: true,
                        },
                        thumbColor: {
                            type: ControlType.Color,
                            title: "Thumb Color",
                            optional: true,
                        },
                        thumbBorderColor: {
                            type: ControlType.Color,
                            title: "Thumb Border Color",
                            optional: true,
                        },
                        thumbSize: {
                            type: ControlType.Number,
                            title: "Thumb Size",
                            min: 12,
                            max: 40,
                            unit: "px",
                            defaultValue: 20,
                            optional: true,
                        },
                        trackHeight: {
                            type: ControlType.Number,
                            title: "Track Height",
                            min: 4,
                            max: 20,
                            unit: "px",
                            defaultValue: 6,
                            optional: true,
                        },
                        valueTextColor: {
                            type: ControlType.Color,
                            title: "Value Text Color",
                            optional: true,
                        },
                        valueGap: {
                            type: ControlType.Number,
                            title: "Slider / Value Gap",
                            min: 0,
                            max: 40,
                            unit: "px",
                            defaultValue: 16,
                            optional: true,
                        },
                        marginTop: {
                            type: ControlType.Number,
                            title: "Top Margin",
                            min: 0,
                            max: 40,
                            unit: "px",
                            defaultValue: 8,
                            optional: true,
                        },
                        marginBottom: {
                            type: ControlType.Number,
                            title: "Bottom Margin",
                            min: 0,
                            max: 40,
                            unit: "px",
                            defaultValue: 0,
                            optional: true,
                        },
                    },
                    hidden: (props) => props.type !== "slider",
                },
                required: {
                    type: ControlType.Boolean,
                    title: "Required",
                    defaultValue: false,
                    hidden: (props) => props.type === "note",
                },
                conditionalField: {
                    type: ControlType.String,
                    title: "Condition Field",
                    hidden: (props) => props.type === "hidden",
                    optional: true,
                },
                conditionalMode: {
                    type: ControlType.Enum,
                    title: "Condition Mode",
                    options: ["show", "hide"],
                    optionTitles: ["Show If", "Hide If"],
                    defaultValue: "show",
                    hidden: (props) => props.type === "hidden",
                },
                conditionalValues: {
                    type: ControlType.Array,
                    title: "Condition Values",
                    control: { type: ControlType.String },
                    defaultValue: [],
                    hidden: (props) => props.type === "hidden",
                    optional: true,
                },
                width: {
                    type: ControlType.Number,
                    title: "Width",
                    min: 5,
                    max: 100,
                    unit: "%",
                    defaultValue: 100,
                    displayStepper: true,
                    hidden: (props) => props.type === "hidden",
                },
            },
        },
        title: "Fields",
        actions: (items, info) => [
            {
                type: "duplicate",
                title: "Duplicate",
                perform: (item) => {
                    const duplicated = { ...item }
                    // Generate a unique ID for the duplicated field
                    if (duplicated.id) {
                        const match = duplicated.id.match(/^(.+?)(\d+)$/)
                        if (match) {
                            const base = match[1]
                            const num = parseInt(match[2]) + 1
                            duplicated.id = `${base}${num}`
                        } else {
                            duplicated.id = `${duplicated.id}_copy`
                        }
                    }
                    // Update label if it exists
                    if (duplicated.label && duplicated.type !== "note") {
                        duplicated.label = `${duplicated.label} (Copy)`
                    }
                    return duplicated
                },
            },
        ],
        defaultValue: [
            {
                id: "name",
                label: "Name",
                type: "text",
                placeholder: "Enter your name",
                required: true,
                formStep: 1,
                width: 100,
            },
            {
                id: "email",
                label: "Email",
                type: "email",
                placeholder: "your@email.com",
                required: true,
                formStep: 1,
                width: 100,
            },
        ],
    },
    gapHorizontal: {
        type: ControlType.Number,
        title: "Horizontal Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        unit: "px",
    },
    gapVertical: {
        type: ControlType.Number,
        title: "Vertical Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        unit: "px",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableSteps: {
        type: ControlType.Boolean,
        title: "Enable Steps",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    steps: {
        type: ControlType.Array,
        title: "Steps",
        control: {
            type: ControlType.Object,
            controls: {
                stepNumber: {
                    type: ControlType.Number,
                    title: "Step Number",
                    defaultValue: 1,
                    min: 1,
                    displayStepper: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Step 1",
                },
            },
        },
        defaultValue: [
            { stepNumber: 1, title: "Personal Info" },
            { stepNumber: 2, title: "Contact Details" },
            { stepNumber: 3, title: "Review" },
        ],
        hidden: (props) => !props.enableSteps,
    },
    showStepIndicator: {
        type: ControlType.Boolean,
        title: "Show Step Indicator",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.enableSteps,
    },
    previousButtonText: {
        type: ControlType.String,
        title: "Previous Button Text",
        defaultValue: "Previous",
        hidden: (props) => !props.enableSteps,
    },
    nextButtonText: {
        type: ControlType.String,
        title: "Next Button Text",
        defaultValue: "Next",
        hidden: (props) => !props.enableSteps,
    },
    submitButtonText: {
        type: ControlType.String,
        title: "Submit Button Text",
        defaultValue: "Submit",
    },
    stepIndicatorStyle: {
        type: ControlType.Object,
        title: "Step Indicator Style",
        optional: true,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                optional: true,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#0099FF",
                optional: true,
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Inactive Color",
                defaultValue: "#CCCCCC",
                optional: true,
            },
            completedColor: {
                type: ControlType.Color,
                title: "Completed Color",
                defaultValue: "#22CC66",
                optional: true,
            },
            activeTextColor: {
                type: ControlType.Color,
                title: "Active Number Color",
                optional: true,
            },
            inactiveTextColor: {
                type: ControlType.Color,
                title: "Inactive Number Color",
                defaultValue: "#666666",
                optional: true,
            },
            activeLabelColor: {
                type: ControlType.Color,
                title: "Active Label Color",
                optional: true,
            },
            inactiveLabelColor: {
                type: ControlType.Color,
                title: "Inactive Label Color",
                optional: true,
            },
        },
        hidden: (props) => !props.enableSteps,
    },
    buttonStyle: {
        type: ControlType.Object,
        title: "Button Style",
        optional: true,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                optional: true,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0099FF",
                optional: true,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                optional: true,
            },
            hoverBackgroundColor: {
                type: ControlType.Color,
                title: "Hover Background",
                optional: true,
            },
            hoverTextColor: {
                type: ControlType.Color,
                title: "Hover Text Color",
                optional: true,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "10px 20px",
                optional: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                min: 0,
                unit: "px",
                defaultValue: 6,
                optional: true,
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                optional: true,
            },
        },
    },
    labelStyle: {
        type: ControlType.Object,
        title: "Label Style",
        optional: true,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                optional: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#555555",
                optional: true,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                optional: true,
            },
        },
    },
    fieldStyle: {
        type: ControlType.Object,
        title: "Field Style",
        optional: true,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                optional: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#111111",
                optional: true,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
                optional: true,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "8px 12px 8px 12px",
                optional: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Label Gap",
                min: 0,
                max: 40,
                unit: "px",
                defaultValue: 4,
                optional: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                min: 0,
                unit: "px",
                defaultValue: 6,
                optional: true,
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#CCCCCC",
                },
                optional: true,
            },
            focusBorder: {
                type: ControlType.Border,
                title: "Focus Border",
                optional: true,
            },
        },
    },
    containerStyle: {
        type: ControlType.Object,
        title: "Container Style",
        optional: true,
        controls: {
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "0px",
                optional: true,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                optional: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                min: 0,
                unit: "px",
                optional: true,
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                optional: true,
            },
        },
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "auto"],
        optionTitles: ["Light", "Dark", "Auto"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    showSuccessMessage: {
        type: ControlType.Boolean,
        title: "Show Success Message",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    successMessage: {
        type: ControlType.String,
        title: "Success Message",
        defaultValue: DEFAULT_SUCCESS_MESSAGE,
        displayTextArea: true,
    },
    successMessageStyle: {
        type: ControlType.Object,
        title: "Success Message Style",
        optional: true,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                optional: true,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                optional: true,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                optional: true,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "16px 20px",
                optional: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                min: 0,
                unit: "px",
                defaultValue: 6,
                optional: true,
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                optional: true,
            },
        },
    },
    hideFormOnSubmit: {
        type: ControlType.Boolean,
        title: "Hide Form On Submit",
        defaultValue: true,
        enabledTitle: "Hide",
        disabledTitle: "Show",
    },
    resetFormOnSubmit: {
        type: ControlType.Boolean,
        title: "Reset Form On Submit",
        defaultValue: false,
        enabledTitle: "Reset",
        disabledTitle: "Keep",
    },
})
