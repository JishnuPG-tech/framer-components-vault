import * as React from "react"
import { useState, useMemo, useCallback, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface MyComponentProps {
    theme?: Record<string, any>
    typography?: Record<string, any>
    layout?: Record<string, any>
    settings?: Record<string, any>
    submissionSetup?: Record<string, any>
    successSetup?: Record<string, any>
}

interface ToggleButtonProps {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    theme: Record<string, any>
    disabled?: boolean
}

interface SliderRowProps {
    label: string
    value: number
    unit: string
    min: number
    max: number
    onChange: (value: number) => void
    theme: Record<string, any>
    disabled?: boolean
}

interface MacroItemProps {
    value: number
    label: string
    color: string
    theme: Record<string, any>
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MacroCalculator(props: MyComponentProps) {
    const isStatic = useIsStaticRenderer()

    const {
        theme = {},
        typography = {},
        layout = {},
        settings = {},
        submissionSetup = {},
        successSetup = {},
    } = props

    const [gender, setGender] = useState("male")
    const [goal, setGoal] = useState("maintain")
    const [age, setAge] = useState(30)
    const [weight, setWeight] = useState(80)
    const [height, setHeight] = useState(175)

    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [submissionError, setSubmissionError] = useState("")
    const [isEmailFocused, setIsEmailFocused] = useState(false)
    const [isSubmitFocused, setIsSubmitFocused] = useState(false)

    const focusRing = `${theme.accent ?? "#10b981"}55`

    const results = useMemo(() => {
        const heightInMeters = height / 100
        const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1)
        const numericBmi = parseFloat(bmiValue)

        let bmiCategory = "Fit & Normal"
        let bmiColor = theme.accent ?? "#10b981"

        if (numericBmi < 18.5) {
            bmiCategory = "Underweight"
            bmiColor = "#38bdf8"
        } else if (numericBmi >= 18.5 && numericBmi <= 24.9) {
            bmiCategory = "Fit & Normal"
            bmiColor = theme.accent ?? "#10b981"
        } else if (numericBmi >= 25 && numericBmi <= 29.9) {
            bmiCategory = "Overweight"
            bmiColor = "#fbbf24"
        } else {
            bmiCategory = "Obese"
            bmiColor = "#ef4444"
        }

        let bmr = 10 * weight + 6.25 * height - 5 * age
        bmr = gender === "male" ? bmr + 5 : bmr - 161

        let tdee = bmr * (settings.activityMultiplier ?? 1.375)

        if (goal === "cut") tdee -= settings.cutDeficit ?? 500
        if (goal === "bulk") tdee += settings.bulkSurplus ?? 300

        const targetCals = Math.round(tdee)

        const protein = Math.round(weight * (settings.proteinPerKg ?? 2.2))
        const fat = Math.round(
            (targetCals * (settings.fatPercentage ?? 0.25)) / 9
        )
        const carbCals = targetCals - protein * 4 - fat * 9
        const carbs = Math.max(0, Math.round(carbCals / 4))

        return {
            calories: targetCals,
            protein,
            carbs,
            fat,
            bmi: bmiValue,
            bmiCategory,
            bmiColor,
        }
    }, [gender, goal, age, weight, height, settings, theme.accent])

    const handleSubmission = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault()
            if (isPending) return

            const mode = submissionSetup.mode ?? "None"

            if (!email.includes("@")) {
                startTransition(() => {
                    setSubmissionError("Please enter a valid email address.")
                })
                return
            }

            startTransition(() => {
                setSubmissionError("")
                setIsPending(true)
            })

            // PRIVACY FIX: Only collect email for lead generation.
            // All health/body data is strictly excluded from the payload and remains local.
            const payload = {
                Email: email,
            }

            if (mode === "Custom Endpoint") {
                if (!submissionSetup.customEndpoint) {
                    startTransition(() => {
                        setSubmissionError("Please set a custom endpoint URL.")
                        setIsPending(false)
                    })
                    return
                }

                try {
                    const response = await fetch(
                        submissionSetup.customEndpoint,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                            },
                            body: JSON.stringify(payload),
                        }
                    )

                    if (!response.ok) {
                        throw new Error(
                            `Request failed with status ${response.status}`
                        )
                    }

                    startTransition(() => {
                        setIsSubmitted(true)
                    })
                } catch (_error) {
                    startTransition(() => {
                        setSubmissionError(
                            "Submission failed. Please verify your endpoint and try again."
                        )
                    })
                } finally {
                    startTransition(() => {
                        setIsPending(false)
                    })
                }
                return
            }

            // Local fallback for "None" mode
            startTransition(() => {
                setIsSubmitted(true)
                setIsPending(false)
            })
        },
        [isPending, email, submissionSetup.mode, submissionSetup.customEndpoint]
    )

    if (isStatic) {
        return (
            <div
                style={{
                    padding: 24,
                    border: "1px dashed #ccc",
                    textAlign: "center",
                    fontFamily: typography.fontFamily ?? "Inter, sans-serif",
                    boxSizing: "border-box",
                    position: "relative",
                }}
            >
                Macro Calculator (Static Preview)
            </div>
        )
    }

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    ...containerStyles(layout, theme, typography),
                    textAlign: "center",
                    justifyContent: "center",
                    minHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                }}
                aria-live="polite"
                role="status"
            >
                <h3
                    style={{
                        fontSize: successSetup.titleSize ?? 24,
                        fontWeight: 800,
                        color: successSetup.titleColor ?? "#f8fafc",
                        margin: "0 0 12px 0",
                        textTransform: "uppercase",
                    }}
                >
                    {successSetup.successTitle ?? "Protocol Sent!"}
                </h3>
                <p
                    style={{
                        fontSize: successSetup.bodySize ?? 15,
                        color: successSetup.bodyColor ?? "#94a3b8",
                        margin: 0,
                        lineHeight: 1.6,
                    }}
                >
                    {successSetup.successMessage ??
                        "Check your inbox for your custom blueprint."}
                </p>
            </motion.div>
        )
    }

    return (
        <div
            style={{
                ...containerStyles(layout, theme, typography),
                position: "relative",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    boxSizing: "border-box",
                }}
            >
                <h2
                    style={{
                        margin: "0 0 4px 0",
                        fontSize: typography.titleSize ?? 28,
                        fontWeight: 800,
                        color: theme.textMain ?? "#f8fafc",
                        textTransform: "uppercase",
                        letterSpacing: "-0.5px",
                    }}
                >
                    {settings.title ?? "Macro Blueprint"}
                </h2>
                <p
                    style={{
                        margin: 0,
                        fontSize: typography.subtitleSize ?? 14,
                        color: theme.textMuted ?? "#94a3b8",
                    }}
                >
                    {settings.subtitle ??
                        "Dial in your nutrition to crush your goals."}
                </p>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    background: "rgba(0,0,0,0.2)",
                    padding: "4px",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    boxSizing: "border-box",
                }}
            >
                <ToggleButton
                    active={gender === "male"}
                    onClick={() =>
                        startTransition(() => {
                            setGender("male")
                        })
                    }
                    theme={theme}
                    disabled={isPending}
                >
                    Male
                </ToggleButton>
                <ToggleButton
                    active={gender === "female"}
                    onClick={() =>
                        startTransition(() => {
                            setGender("female")
                        })
                    }
                    theme={theme}
                    disabled={isPending}
                >
                    Female
                </ToggleButton>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    background: "rgba(0,0,0,0.2)",
                    padding: "4px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    boxSizing: "border-box",
                }}
            >
                <ToggleButton
                    active={goal === "cut"}
                    onClick={() =>
                        startTransition(() => {
                            setGoal("cut")
                        })
                    }
                    theme={theme}
                    disabled={isPending}
                >
                    Cut
                </ToggleButton>
                <ToggleButton
                    active={goal === "maintain"}
                    onClick={() =>
                        startTransition(() => {
                            setGoal("maintain")
                        })
                    }
                    theme={theme}
                    disabled={isPending}
                >
                    Maintain
                </ToggleButton>
                <ToggleButton
                    active={goal === "bulk"}
                    onClick={() =>
                        startTransition(() => {
                            setGoal("bulk")
                        })
                    }
                    theme={theme}
                    disabled={isPending}
                >
                    Bulk
                </ToggleButton>
            </div>

            <SliderRow
                label="Age"
                value={age}
                unit="yrs"
                min={16}
                max={80}
                onChange={setAge}
                theme={theme}
                disabled={isPending}
            />
            <SliderRow
                label="Weight"
                value={weight}
                unit="kg"
                min={40}
                max={150}
                onChange={setWeight}
                theme={theme}
                disabled={isPending}
            />
            <SliderRow
                label="Height"
                value={height}
                unit="cm"
                min={140}
                max={220}
                onChange={setHeight}
                theme={theme}
                disabled={isPending}
            />

            <motion.div
                key={results.calories + results.bmi}
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "16px",
                    padding: "16px",
                    marginTop: "20px",
                    border: `1px solid ${theme.border ?? "#27272a"}`,
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                        paddingBottom: "16px",
                        borderBottom: `1px solid ${theme.border ?? "#27272a"}`,
                        boxSizing: "border-box",
                        gap: "8px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "13px",
                            color: theme.textMuted ?? "#94a3b8",
                            fontWeight: 500,
                        }}
                    >
                        Current BMI:{" "}
                        <span
                            style={{
                                color: theme.textMain ?? "#f8fafc",
                                fontWeight: 700,
                            }}
                        >
                            {results.bmi}
                        </span>
                    </div>
                    <div
                        style={{
                            background: `${results.bmiColor}20`,
                            color: results.bmiColor,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            boxSizing: "border-box",
                            minWidth: 0,
                        }}
                    >
                        {results.bmiCategory}
                    </div>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "16px",
                        paddingBottom: "16px",
                        borderBottom: `1px solid ${theme.border ?? "#27272a"}`,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            fontSize: typography.calorieSize ?? 48,
                            fontWeight: 800,
                            color: theme.accent ?? "#10b981",
                            lineHeight: 1,
                        }}
                    >
                        {results.calories}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: theme.textMuted ?? "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginTop: "4px",
                            fontWeight: 600,
                        }}
                    >
                        Daily Target Calories
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        textAlign: "center",
                        boxSizing: "border-box",
                        width: "100%",
                    }}
                >
                    <MacroItem
                        value={results.protein}
                        label="Protein"
                        color={theme.proteinColor ?? "#38bdf8"}
                        theme={theme}
                    />
                    <MacroItem
                        value={results.carbs}
                        label="Carbs"
                        color={theme.carbColor ?? "#f472b6"}
                        theme={theme}
                    />
                    <MacroItem
                        value={results.fat}
                        label="Fats"
                        color={theme.fatColor ?? "#facc15"}
                        theme={theme}
                    />
                </div>
            </motion.div>

            <form
                onSubmit={handleSubmission}
                noValidate
                style={{
                    marginTop: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxSizing: "border-box",
                }}
            >
                <input
                    type="email"
                    placeholder="Enter email to save your plan..."
                    value={email}
                    onChange={(e) =>
                        startTransition(() => {
                            setEmail(e.target.value)
                            setSubmissionError("")
                        })
                    }
                    onFocus={() =>
                        startTransition(() => {
                            setIsEmailFocused(true)
                        })
                    }
                    onBlur={() =>
                        startTransition(() => {
                            setIsEmailFocused(false)
                        })
                    }
                    disabled={isPending}
                    aria-label="Email address"
                    aria-invalid={submissionError ? true : false}
                    aria-describedby={
                        submissionError
                            ? "macro-calculator-submit-error"
                            : undefined
                    }
                    style={{
                        padding: "14px",
                        background: "rgba(0,0,0,0.2)",
                        border: `1px solid ${theme.border ?? "#27272a"}`,
                        borderRadius: "10px",
                        color: theme.textMain ?? "#f8fafc",
                        fontSize: "14px",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        width: "100%",
                        cursor: isPending ? "not-allowed" : "text",
                        opacity: isPending ? 0.75 : 1,
                        boxShadow: isEmailFocused
                            ? `0 0 0 3px ${focusRing}`
                            : "none",
                    }}
                />
                <motion.button
                    whileHover={isPending ? undefined : { scale: 1.02 }}
                    whileTap={isPending ? undefined : { scale: 0.98 }}
                    type="submit"
                    disabled={isPending}
                    onFocus={() =>
                        startTransition(() => {
                            setIsSubmitFocused(true)
                        })
                    }
                    onBlur={() =>
                        startTransition(() => {
                            setIsSubmitFocused(false)
                        })
                    }
                    style={{
                        padding: "14px",
                        background: theme.accent ?? "#10b981",
                        color: theme.btnText ?? "#000000",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 800,
                        fontSize: "15px",
                        cursor: isPending ? "not-allowed" : "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        opacity: isPending ? 0.55 : 1,
                        boxSizing: "border-box",
                        width: "100%",
                        boxShadow: isSubmitFocused
                            ? `0 0 0 3px ${focusRing}`
                            : "none",
                    }}
                >
                    {isPending ? "Sending..." : "Send My Protocol"}
                </motion.button>
                <div
                    id="macro-calculator-submit-error"
                    aria-live="assertive"
                    role="alert"
                    style={{
                        minHeight: "18px",
                        fontSize: "12px",
                        color: "#ef4444",
                        lineHeight: 1.4,
                    }}
                >
                    {submissionError}
                </div>
            </form>
        </div>
    )
}

const ToggleButton = ({
    active,
    onClick,
    children,
    theme,
    disabled = false,
}: ToggleButtonProps) => {
    const [isFocused, setIsFocused] = useState(false)
    const focusRing = `${theme.accent ?? "#10b981"}55`

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            onFocus={() =>
                startTransition(() => {
                    setIsFocused(true)
                })
            }
            onBlur={() =>
                startTransition(() => {
                    setIsFocused(false)
                })
            }
            style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 8px",
                background: active
                    ? (theme.cardBg ?? "#18181b")
                    : "transparent",
                color: active
                    ? (theme.textMain ?? "#f8fafc")
                    : (theme.textMuted ?? "#94a3b8"),
                border: active
                    ? `1px solid ${theme.border ?? "#27272a"}`
                    : "1px solid transparent",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: isFocused
                    ? `0 0 0 3px ${focusRing}`
                    : active
                      ? "0 2px 8px rgba(0,0,0,0.2)"
                      : "none",
                opacity: disabled ? 0.7 : 1,
                boxSizing: "border-box",
            }}
            aria-pressed={active}
        >
            {children}
        </button>
    )
}

const SliderRow = ({
    label,
    value,
    unit,
    min,
    max,
    onChange,
    theme,
    disabled = false,
}: SliderRowProps) => {
    const [isFocused, setIsFocused] = useState(false)
    const focusRing = `${theme.accent ?? "#10b981"}55`

    return (
        <div style={{ marginBottom: "16px", boxSizing: "border-box" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                }}
            >
                <span
                    style={{
                        fontWeight: 600,
                        color: theme.textMuted ?? "#94a3b8",
                        fontSize: "13px",
                    }}
                >
                    {label}
                </span>
                <span
                    style={{
                        fontWeight: 800,
                        color: theme.accent ?? "#10b981",
                        fontSize: "14px",
                    }}
                >
                    {value} {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) =>
                    startTransition(() => {
                        onChange(Number(e.target.value))
                    })
                }
                disabled={disabled}
                onFocus={() =>
                    startTransition(() => {
                        setIsFocused(true)
                    })
                }
                onBlur={() =>
                    startTransition(() => {
                        setIsFocused(false)
                    })
                }
                aria-label={`${label} slider`}
                style={{
                    width: "100%",
                    accentColor: theme.accent ?? "#10b981",
                    height: "6px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    background: theme.border ?? "#27272a",
                    borderRadius: "3px",
                    appearance: "auto",
                    boxSizing: "border-box",
                    opacity: disabled ? 0.7 : 1,
                    boxShadow: isFocused ? `0 0 0 3px ${focusRing}` : "none",
                }}
            />
        </div>
    )
}

const MacroItem = ({ value, label, color, theme }: MacroItemProps) => (
    <div style={{ minWidth: 0, boxSizing: "border-box" }}>
        <div
            style={{
                fontWeight: 800,
                fontSize: "18px",
                color: color,
                marginBottom: "2px",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
            }}
        >
            {value}g
        </div>
        <div
            style={{
                fontSize: "10px",
                color: theme.textMuted ?? "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
                minWidth: 0,
            }}
        >
            {label}
        </div>
    </div>
)

const containerStyles = (layout, theme, typography) => ({
    width: "100%",
    maxWidth: layout.maxWidth ?? 460,
    margin: "0 auto",
    backgroundColor: theme.cardBg ?? "#18181b",
    border: `1px solid ${theme.border ?? "#27272a"}`,
    borderRadius: layout.radius ?? 20,
    padding: layout.padding ?? 24,
    boxSizing: "border-box" as const,
    fontFamily: typography.fontFamily ?? "Inter, sans-serif",
    boxShadow: layout.shadow ?? "0 20px 40px -12px rgba(0, 0, 0, 0.5)",
})

addPropertyControls(MacroCalculator, {
    submissionSetup: {
        type: ControlType.Object,
        title: "Lead Capture (Email Only)",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                defaultValue: "None",
                options: ["None", "Custom Endpoint"],
                optionTitles: ["None", "Custom Endpoint"],
                description:
                    "Calculations remain local. Only the email address is sent to your endpoint to protect user privacy.",
            },
            customEndpoint: {
                type: ControlType.String,
                title: "Endpoint URL",
                defaultValue: "",
                placeholder: "https://your-domain.com/api/leads",
                description:
                    "Sends a JSON POST payload containing only the user's email address.",
                hidden(props) {
                    return props.mode !== "Custom Endpoint"
                },
            },
        },
    },
    settings: {
        type: ControlType.Object,
        title: "Calculator Logic",
        controls: {
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Macro Blueprint",
            },
            subtitle: {
                type: ControlType.String,
                title: "Subtitle",
                defaultValue: "Dial in your nutrition to crush your goals.",
            },
            activityMultiplier: {
                type: ControlType.Number,
                title: "Activity M.",
                defaultValue: 1.375,
                step: 0.1,
            },
            cutDeficit: {
                type: ControlType.Number,
                title: "Cut Deficit",
                defaultValue: 500,
            },
            bulkSurplus: {
                type: ControlType.Number,
                title: "Bulk Surplus",
                defaultValue: 300,
            },
            proteinPerKg: {
                type: ControlType.Number,
                title: "Protein/Kg",
                defaultValue: 2.2,
                step: 0.1,
            },
            fatPercentage: {
                type: ControlType.Number,
                title: "Fat %",
                defaultValue: 0.25,
                step: 0.05,
            },
        },
    },
    successSetup: {
        type: ControlType.Object,
        title: "Success Screen",
        controls: {
            successTitle: {
                type: ControlType.String,
                defaultValue: "Protocol Sent!",
            },
            titleSize: { type: ControlType.Number, defaultValue: 24 },
            titleColor: { type: ControlType.Color, defaultValue: "#f8fafc" },
            successMessage: {
                type: ControlType.String,
                defaultValue: "Check your inbox for your custom blueprint.",
            },
            bodySize: { type: ControlType.Number, defaultValue: 15 },
            bodyColor: { type: ControlType.Color, defaultValue: "#94a3b8" },
        },
    },
    theme: {
        type: ControlType.Object,
        title: "Theme Colors",
        controls: {
            cardBg: {
                type: ControlType.Color,
                title: "Card BG",
                defaultValue: "#18181b",
            },
            border: {
                type: ControlType.Color,
                title: "Borders",
                defaultValue: "#27272a",
            },
            textMain: {
                type: ControlType.Color,
                title: "Primary Text",
                defaultValue: "#f8fafc",
            },
            textMuted: {
                type: ControlType.Color,
                title: "Muted Text",
                defaultValue: "#94a3b8",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent Color",
                defaultValue: "#10b981",
            },
            btnText: {
                type: ControlType.Color,
                title: "Btn Text",
                defaultValue: "#000000",
            },
            proteinColor: {
                type: ControlType.Color,
                title: "Protein Color",
                defaultValue: "#38bdf8",
            },
            carbColor: {
                type: ControlType.Color,
                title: "Carb Color",
                defaultValue: "#f472b6",
            },
            fatColor: {
                type: ControlType.Color,
                title: "Fat Color",
                defaultValue: "#facc15",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography Sizes",
        controls: {
            titleSize: { type: ControlType.Number, defaultValue: 28 },
            subtitleSize: { type: ControlType.Number, defaultValue: 14 },
            calorieSize: { type: ControlType.Number, defaultValue: 48 },
            fontFamily: {
                type: ControlType.String,
                defaultValue: "Inter, sans-serif",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout & Spacing",
        controls: {
            maxWidth: { type: ControlType.Number, defaultValue: 460 },
            padding: { type: ControlType.Number, defaultValue: 24 },
            radius: { type: ControlType.Number, defaultValue: 20 },
            shadow: {
                type: ControlType.String,
                defaultValue: "0 20px 40px -12px rgba(0, 0, 0, 0.5)",
            },
        },
    },
})
