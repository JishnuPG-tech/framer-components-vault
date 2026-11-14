// Multi-Step Animated Form with smooth transitions, validation, and review step
// All steps and fields are fully customizable separately
import { useState, useCallback, useMemo, startTransition, type CSSProperties } from "react"
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

interface Field {
    id: string
    label: string
    type: "text" | "email" | "phone" | "password" | "select" | "number" | "date" | "file"
    placeholder?: string
    required?: boolean
    options?: string
    fileMultiple?: boolean
    fileMaxSize?: number
    fileAllowedTypes?: string
}

interface Step {
    id: string
    title: string
    fields: Field[]
    linkLabel?: string
    linkUrl?: string
    linkNewTab?: boolean
}

interface MultiStepFormProps {
    steps: Step[]
    onComplete?: (data: Record<string, string>) => void
    submissionTarget: "none" | "email" | "webhook" | "googleSheet"
    emailTo: string
    webhookUrl: string
    googleSheetWebhookUrl: string
    useSeparateSteps: boolean
    step1: Step & { enabled?: boolean }
    step2: Step & { enabled?: boolean }
    step3: Step & { enabled?: boolean }
    step4: Step & { enabled?: boolean }
    transition: "slide" | "fade" | "scale" | "flip"
    progressStyle: "bar" | "steps" | "circles" | "breadcrumb"
    validateOnBlur: boolean
    validateOnChange: boolean
    showReview: boolean
    allowStepNavigation: boolean
    primaryColor: string
    errorColor: string
    successColor: string
    backgroundColor: string
    textColor: string
    titleFont: CSSProperties
    labelFont: CSSProperties
    inputFont: CSSProperties
    submitButtonText: string
    nextButtonText: string
    backButtonText: string
    reviewTitle: string
    editButtonText: string
    successTitle: string
    successMessage: string
    style?: CSSProperties
}

/**
 * Multi-Step Animated Form
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MultiStepForm(props: MultiStepFormProps) {
    const {
        steps = [],
        onComplete,
        submissionTarget = "none",
        emailTo = "hello@example.com",
        webhookUrl = "",
        googleSheetWebhookUrl = "",
        useSeparateSteps = false,
        step1 = {
            enabled: true,
            id: "personal",
            title: "Personal Information",
            fields: [
                { id: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
            ],
        },
        step2 = {
            enabled: true,
            id: "account",
            title: "Account Details",
            fields: [
                { id: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com" },
            ],
        },
        step3 = {
            enabled: false,
            id: "preferences",
            title: "Preferences",
            fields: [
                { id: "theme", label: "Preferred Theme", type: "select", required: false, options: "Light,Dark,Auto" },
            ],
        },
        step4 = {
            enabled: false,
            id: "extra",
            title: "Extra",
            fields: [
                { id: "notes", label: "Notes", type: "text", required: false, placeholder: "Optional" },
            ],
        },
        transition = "slide",
        progressStyle = "bar",
        validateOnBlur = true,
        validateOnChange = false,
        showReview = true,
        allowStepNavigation = true,
        primaryColor = "#0099FF",
        errorColor = "#FF5588",
        successColor = "#22CC66",
        backgroundColor = "#FFFFFF",
        textColor = "#000000",
        titleFont,
        labelFont,
        inputFont,
        submitButtonText = "Submit",
        nextButtonText = "Next",
        backButtonText = "Back",
        reviewTitle = "Review Your Information",
        editButtonText = "Edit",
        successTitle = "Form Submitted!",
        successMessage = "Thank you for completing the form.",
    } = props

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [fileData, setFileData] = useState<Record<string, File[]>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
    const [shakeField, setShakeField] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [direction, setDirection] = useState(1)

    const effectiveSteps = useMemo(() => {
        if (!useSeparateSteps) return steps
        const list = [step1, step2, step3, step4]
        return list.filter((s) => s && (s as any).enabled !== false) as Step[]
    }, [steps, step1, step2, step3, step4, useSeparateSteps])

    const totalSteps = showReview ? effectiveSteps.length + 1 : effectiveSteps.length
    const isReviewStep = showReview && currentStepIndex === effectiveSteps.length
    const currentStep = isReviewStep ? null : effectiveSteps[currentStepIndex]

    const validateField = useCallback((field: Field, value: string): string | null => {
        if (field.type === "file") {
            const files = fileData[field.id] || []
            if (field.required && files.length === 0) {
                return `${field.label} is required`
            }
            
            if (files.length > 0 && field.fileMaxSize) {
                const maxSizeBytes = field.fileMaxSize * 1024 * 1024
                const oversizedFile = files.find(f => f.size > maxSizeBytes)
                if (oversizedFile) {
                    return `File size must be less than ${field.fileMaxSize}MB`
                }
            }
            
            if (files.length > 0 && field.fileAllowedTypes) {
                const allowedTypes = field.fileAllowedTypes.split(',').map(t => t.trim().toLowerCase())
                const invalidFile = files.find(f => {
                    const ext = f.name.split('.').pop()?.toLowerCase() || ''
                    return !allowedTypes.includes(ext)
                })
                if (invalidFile) {
                    return `Only ${field.fileAllowedTypes} files are allowed`
                }
            }
            
            return null
        }
        
        if (field.required && !value) {
            return `${field.label} is required`
        }
        if (field.type === "email" && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
                return "Invalid email address"
            }
        }
        return null
    }, [])

    const handleFieldChange = useCallback((fieldId: string, value: string, field: Field) => {
        if (field.type === "file") return
        
        startTransition(() => {
            setFormData(prev => ({ ...prev, [fieldId]: value }))
            
            if (validateOnChange) {
                const error = validateField(field, value)
                setErrors(prev => {
                    const newErrors = { ...prev }
                    if (error) {
                        newErrors[fieldId] = error
                    } else {
                        delete newErrors[fieldId]
                    }
                    return newErrors
                })
            }
        })
    }, [validateOnChange, validateField])

    const handleFieldBlur = useCallback((fieldId: string, field: Field) => {
        if (field.type === "file") return
        
        startTransition(() => {
            setTouched(prev => ({ ...prev, [fieldId]: true }))
            
            if (validateOnBlur) {
                const value = formData[fieldId] || ""
                const error = validateField(field, value)
                setErrors(prev => {
                    const newErrors = { ...prev }
                    if (error) {
                        newErrors[fieldId] = error
                    } else {
                        delete newErrors[fieldId]
                    }
                    return newErrors
                })
            }
        })
    }, [formData, validateOnBlur, validateField])

    const handleFileChange = useCallback((fieldId: string, files: FileList | null, field: Field) => {
        if (!files) return
        
        const fileArray = Array.from(files)
        const filesToStore = field.fileMultiple ? fileArray : fileArray.slice(0, 1)
        
        startTransition(() => {
            setFileData(prev => ({ ...prev, [fieldId]: filesToStore }))
            setTouched(prev => ({ ...prev, [fieldId]: true }))
            
            if (validateOnChange) {
                const error = validateField(field, "")
                setErrors(prev => {
                    const newErrors = { ...prev }
                    if (error) {
                        newErrors[fieldId] = error
                    } else {
                        delete newErrors[fieldId]
                    }
                    return newErrors
                })
            }
        })
    }, [validateOnChange, validateField])

    const handleFileRemove = useCallback((fieldId: string, fileIndex: number) => {
        startTransition(() => {
            setFileData(prev => {
                const newFiles = [...(prev[fieldId] || [])]
                newFiles.splice(fileIndex, 1)
                return { ...prev, [fieldId]: newFiles }
            })
        })
    }, [])

    const validateCurrentStep = useCallback((): boolean => {
        if (isReviewStep) return true
        
        const stepFields = currentStep?.fields || []
        let isValid = true
        const newErrors: Record<string, string> = {}
        const newTouched: Record<string, boolean> = {}

        stepFields.forEach(field => {
            const value = formData[field.id] || ""
            const error = validateField(field, value)
            newTouched[field.id] = true
            
            if (error) {
                newErrors[field.id] = error
                isValid = false
                setShakeField(field.id)
                setTimeout(() => {
                    startTransition(() => setShakeField(null))
                }, 500)
            }
        })

        startTransition(() => {
            setErrors(prev => ({ ...prev, ...newErrors }))
            setTouched(prev => ({ ...prev, ...newTouched }))
        })

        return isValid
    }, [currentStep, formData, isReviewStep, validateField])

    const handleNext = useCallback(() => {
        if (validateCurrentStep()) {
            startTransition(() => {
                setCompletedSteps(prev => new Set(prev).add(currentStepIndex))
                setDirection(1)
                setCurrentStepIndex(prev => Math.min(prev + 1, totalSteps - 1))
            })
        }
    }, [validateCurrentStep, currentStepIndex, totalSteps])

    const handleBack = useCallback(() => {
        startTransition(() => {
            setDirection(-1)
            setCurrentStepIndex(prev => Math.max(prev - 1, 0))
        })
    }, [])

    const handleStepClick = useCallback((index: number) => {
        if (allowStepNavigation && completedSteps.has(index)) {
            startTransition(() => {
                setDirection(index > currentStepIndex ? 1 : -1)
                setCurrentStepIndex(index)
            })
        }
    }, [allowStepNavigation, completedSteps, currentStepIndex])

    const submitToTarget = useCallback(async () => {
        const payload = {
            data: formData,
            files: Object.entries(fileData).reduce((acc, [key, files]) => {
                acc[key] = files.map(f => ({ name: f.name, size: f.size, type: f.type }))
                return acc
            }, {} as Record<string, any[]>),
            steps: effectiveSteps.map((s) => ({
                id: s.id,
                title: s.title,
                fields: s.fields.map((f) => ({ id: f.id, label: f.label, value: formData[f.id] || "" })),
            })),
            submittedAt: new Date().toISOString(),
        }

        if (submissionTarget === "none") return

        if (submissionTarget === "email") {
            if (typeof window === "undefined") return
            const subject = encodeURIComponent("New form submission")
            const body = encodeURIComponent(JSON.stringify(payload, null, 2))
            const to = encodeURIComponent(emailTo || "")
            window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
            return
        }

        const url = submissionTarget === "googleSheet" ? googleSheetWebhookUrl : webhookUrl
        if (!url) return

        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    }, [emailTo, effectiveSteps, formData, googleSheetWebhookUrl, submissionTarget, webhookUrl])

    const handleSubmit = useCallback(async () => {
        startTransition(() => {
            setIsSubmitting(true)
        })

        try {
            await submitToTarget()
            if (onComplete) onComplete(formData)
            startTransition(() => {
                setIsSubmitting(false)
                setIsComplete(true)
            })
        } catch (e) {
            startTransition(() => {
                setIsSubmitting(false)
            })
        }
    }, [formData, onComplete, submitToTarget])

    const getTransitionVariants = () => {
        const slideVariants = {
            enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 })
        }

        const fadeVariants = {
            enter: { opacity: 0 },
            center: { opacity: 1, transition: { delay: 0.2 } },
            exit: { opacity: 0 }
        }

        const scaleVariants = {
            enter: { scale: 0.95, opacity: 0 },
            center: { scale: 1, opacity: 1 },
            exit: { scale: 1.05, opacity: 0 }
        }

        const flipVariants = {
            enter: { rotateY: 90, opacity: 0 },
            center: { rotateY: 0, opacity: 1 },
            exit: { rotateY: -90, opacity: 0 }
        }

        switch (transition) {
            case "fade": return fadeVariants
            case "scale": return scaleVariants
            case "flip": return flipVariants
            default: return slideVariants
        }
    }

    const renderProgressIndicator = () => {
        const progress = ((currentStepIndex + 1) / totalSteps) * 100

        if (progressStyle === "bar") {
            return (
                <div style={{ width: "100%", height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div
                        style={{ height: "100%", backgroundColor: primaryColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                </div>
            )
        }

        if (progressStyle === "circles") {
            return (
                <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
                    {Array.from({ length: totalSteps }).map((_, index) => {
                        const isCompleted = completedSteps.has(index) || index < currentStepIndex
                        const isActive = index === currentStepIndex
                        
                        return (
                            <motion.div
                                key={index}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    backgroundColor: isCompleted ? successColor : isActive ? primaryColor : "#E0E0E0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: allowStepNavigation && isCompleted ? "pointer" : "default",
                                    color: "#FFF",
                                    fontSize: 14,
                                    fontWeight: 600,
                                }}
                                whileHover={allowStepNavigation && isCompleted ? { scale: 1.1 } : {}}
                                onClick={() => handleStepClick(index)}
                            >
                                {isCompleted ? "✓" : index + 1}
                            </motion.div>
                        )
                    })}
                </div>
            )
        }

        if (progressStyle === "steps") {
            return (
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                    {Array.from({ length: totalSteps }).map((_, index) => {
                        const isCompleted = completedSteps.has(index) || index < currentStepIndex
                        const isActive = index === currentStepIndex
                        
                        return (
                            <div
                                key={index}
                                style={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: isCompleted ? successColor : isActive ? primaryColor : "#E0E0E0",
                                    transition: "background-color 0.3s",
                                }}
                            />
                        )
                    })}
                </div>
            )
        }

        return null
    }

    const parseOptions = useCallback((optionsString: string): string[] => {
        if (!optionsString) return []
        return optionsString.split(',').map(opt => opt.trim()).filter(Boolean)
    }, [])

    const renderField = (field: Field) => {
        const value = formData[field.id] || ""
        const files = fileData[field.id] || []
        const error = errors[field.id]
        const isTouched = touched[field.id]
        const showError = error && isTouched
        const isValid = !error && isTouched && value

        const fieldOptions = field.type === "select" ? parseOptions(field.options || "") : []

        return (
            <div key={field.id} style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, ...labelFont, color: textColor }}>
                    {field.label} {field.required && <span style={{ color: errorColor }}>*</span>}
                </label>
                
                <div style={{ position: "relative" }}>
                    {field.type === "select" ? (
                        <select
                            value={value}
                            onChange={(e) => handleFieldChange(field.id, e.target.value, field)}
                            onBlur={() => handleFieldBlur(field.id, field)}
                            style={{
                                width: "100%",
                                padding: "12px 40px 12px 12px",
                                borderRadius: 8,
                                border: `2px solid ${showError ? errorColor : isValid ? successColor : "#E0E0E0"}`,
                                ...inputFont,
                                backgroundColor: "#FFF",
                                color: textColor,
                                outline: "none",
                                transition: "border-color 0.2s",
                            }}
                        >
                            <option value="">Select {field.label}</option>
                            {fieldOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    ) : field.type === "file" ? (
                        <div>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    padding: "20px",
                                    borderRadius: 8,
                                    border: `2px dashed ${showError ? errorColor : isValid ? successColor : "#E0E0E0"}`,
                                    backgroundColor: "#FAFAFA",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    ...inputFont,
                                    color: "#666",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = primaryColor
                                    e.currentTarget.style.backgroundColor = "#F5F5F5"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = showError ? errorColor : isValid ? successColor : "#E0E0E0"
                                    e.currentTarget.style.backgroundColor = "#FAFAFA"
                                }}
                            >
                                <input
                                    type="file"
                                    multiple={field.fileMultiple}
                                    accept={field.fileAllowedTypes ? field.fileAllowedTypes.split(',').map(t => `.${t.trim()}`).join(',') : undefined}
                                    onChange={(e) => handleFileChange(field.id, e.target.files, field)}
                                    style={{ display: "none" }}
                                />
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
                                    <div>{field.placeholder || `Click to upload ${field.fileMultiple ? 'files' : 'file'}`}</div>
                                    {field.fileMaxSize && (
                                        <div style={{ fontSize: 12, marginTop: 4, color: "#999" }}>
                                            Max size: {field.fileMaxSize}MB
                                        </div>
                                    )}
                                    {field.fileAllowedTypes && (
                                        <div style={{ fontSize: 12, marginTop: 2, color: "#999" }}>
                                            Allowed: {field.fileAllowedTypes}
                                        </div>
                                    )}
                                </div>
                            </label>
                            
                            {files.length > 0 && (
                                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "8px 12px",
                                                backgroundColor: "#F5F5F5",
                                                borderRadius: 6,
                                                ...inputFont,
                                                fontSize: 13,
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                                <span>📄</span>
                                                <span style={{ 
                                                    overflow: "hidden", 
                                                    textOverflow: "ellipsis", 
                                                    whiteSpace: "nowrap" 
                                                }}>
                                                    {file.name}
                                                </span>
                                                <span style={{ color: "#999", fontSize: 11, flexShrink: 0 }}>
                                                    ({(file.size / 1024).toFixed(1)}KB)
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleFileRemove(field.id, index)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: errorColor,
                                                    cursor: "pointer",
                                                    padding: "4px 8px",
                                                    fontSize: 16,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.input
                            type={field.type}
                            value={value}
                            placeholder={field.placeholder}
                            onChange={(e) => handleFieldChange(field.id, e.target.value, field)}
                            onBlur={() => handleFieldBlur(field.id, field)}
                            animate={shakeField === field.id ? {
                                x: [0, -10, 10, -10, 10, 0],
                                transition: { duration: 0.4 }
                            } : {}}
                            style={{
                                width: "100%",
                                padding: "12px 40px 12px 12px",
                                borderRadius: 8,
                                border: `2px solid ${showError ? errorColor : isValid ? successColor : "#E0E0E0"}`,
                                ...inputFont,
                                backgroundColor: "#FFF",
                                color: textColor,
                                outline: "none",
                                transition: "border-color 0.2s",
                            }}
                        />
                    )}
                    
                    {isValid && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: successColor,
                                fontSize: 18,
                            }}
                        >
                            ✓
                        </motion.div>
                    )}
                </div>
                
                <AnimatePresence>
                    {showError && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -8 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                color: errorColor,
                                fontSize: 13,
                                marginTop: 6,
                                overflow: "hidden",
                            }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    const renderReviewStep = () => {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <h2 style={{ ...titleFont, color: textColor, margin: 0 }}>{reviewTitle}</h2>
                
                {effectiveSteps.map((step, stepIndex) => (
                    <div key={step.id} style={{ 
                        padding: 20, 
                        backgroundColor: "#F5F5F5", 
                        borderRadius: 8,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ ...labelFont, color: textColor, margin: 0, fontSize: 16 }}>{step.title}</h3>
                            <button
                                onClick={() => handleStepClick(stepIndex)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    border: `1px solid ${primaryColor}`,
                                    backgroundColor: "transparent",
                                    color: primaryColor,
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                {editButtonText}
                            </button>
                        </div>
                        
                        {step.fields.map(field => (
                            <div key={field.id} style={{ marginBottom: 8 }}>
                                <span style={{ ...labelFont, fontSize: 13, color: "#666" }}>{field.label}: </span>
                                <span style={{ ...inputFont, fontSize: 14, color: textColor }}>
                                    {field.type === "file" 
                                        ? (fileData[field.id] || []).map(f => f.name).join(", ") || "—"
                                        : formData[field.id] || "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    if (isComplete) {
        return (
            <div style={{
                ...props.style,
                backgroundColor,
                padding: 40,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
            }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        backgroundColor: successColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFF",
                        fontSize: 40,
                    }}
                >
                    ✓
                </motion.div>
                <h2 style={{ ...titleFont, color: textColor, margin: 0 }}>{successTitle}</h2>
                <p style={{ ...labelFont, color: "#666", margin: 0 }}>{successMessage}</p>
            </div>
        )
    }

    return (
        <div style={{
            ...props.style,
            backgroundColor,
            padding: 40,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 32,
            overflow: "hidden",
        }}>
            {renderProgressIndicator()}
            
            <div style={{ minHeight: 400, position: "relative" }}>
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStepIndex}
                        custom={direction}
                        variants={getTransitionVariants()}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        style={{ position: "absolute", width: "100%", top: 0, left: 0 }}
                    >
                        {isReviewStep ? (
                            renderReviewStep()
                        ) : (
                            <div>
                                <h2 style={{ ...titleFont, color: textColor, marginBottom: 24 }}>
                                    {currentStep?.title}
                                </h2>
                                {currentStep?.fields.map(renderField)}

                                {currentStep?.linkUrl && currentStep?.linkLabel && (
                                    <a
                                        href={currentStep.linkUrl}
                                        target={currentStep.linkNewTab ? "_blank" : "_self"}
                                        rel={currentStep.linkNewTab ? "noopener noreferrer" : undefined}
                                        style={{
                                            ...labelFont,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            color: primaryColor,
                                            textDecoration: "none",
                                            marginTop: 16,
                                            padding: "8px 0",
                                            width: "max-content",
                                            transition: "opacity 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = "0.7"
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = "1"
                                        }}
                                    >
                                        {currentStep.linkLabel}
                                        <span aria-hidden="true" style={{ fontSize: "1.2em" }}>→</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <button
                    onClick={handleBack}
                    disabled={currentStepIndex === 0}
                    style={{
                        padding: "12px 24px",
                        borderRadius: 8,
                        border: `2px solid ${primaryColor}`,
                        backgroundColor: "transparent",
                        color: primaryColor,
                        cursor: currentStepIndex === 0 ? "not-allowed" : "pointer",
                        opacity: currentStepIndex === 0 ? 0.5 : 1,
                        fontSize: 15,
                        fontWeight: 600,
                    }}
                >
                    {backButtonText}
                </button>
                
                <button
                    onClick={isReviewStep ? handleSubmit : handleNext}
                    disabled={isSubmitting}
                    style={{
                        padding: "12px 32px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: primaryColor,
                        color: "#FFF",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        fontSize: 15,
                        fontWeight: 600,
                        minWidth: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{
                                    width: 16,
                                    height: 16,
                                    border: "2px solid #FFF",
                                    borderTopColor: "transparent",
                                    borderRadius: "50%",
                                }}
                            />
                            Submitting...
                        </>
                    ) : isReviewStep ? (
                        submitButtonText
                    ) : currentStepIndex === effectiveSteps.length - 1 && !showReview ? (
                        submitButtonText
                    ) : (
                        nextButtonText
                    )}
                </button>
            </div>
        </div>
    )
}

addPropertyControls(MultiStepForm, {
    submissionTarget: {
        type: ControlType.Enum,
        title: "Collect To",
        options: ["none", "email", "webhook", "googleSheet"],
        optionTitles: ["None", "Email", "Webhook", "Google Sheet"],
        defaultValue: "none",
    },
    emailTo: {
        type: ControlType.String,
        title: "Email To",
        defaultValue: "hello@example.com",
        hidden: (p) => p.submissionTarget !== "email",
    },
    webhookUrl: {
        type: ControlType.Link,
        title: "Webhook URL",
        defaultValue: "",
        hidden: (p) => p.submissionTarget !== "webhook",
    },
    googleSheetWebhookUrl: {
        type: ControlType.Link,
        title: "Google Sheet URL",
        defaultValue: "",
        hidden: (p) => p.submissionTarget !== "googleSheet",
    },
    onComplete: {
        type: ControlType.EventHandler,
        title: "On Complete",
    },
    useSeparateSteps: {
        type: ControlType.Boolean,
        title: "Separate Step Props",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    step1: {
        type: ControlType.Object,
        title: "Step 1",
        hidden: (props) => !props.useSeparateSteps,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            id: {
                type: ControlType.String,
                title: "ID",
                defaultValue: "personal",
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Personal Information",
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: "",
            },
            linkUrl: {
                type: ControlType.Link,
                title: "Link URL",
                defaultValue: "",
            },
            linkNewTab: {
                type: ControlType.Boolean,
                title: "Link New Tab",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p) => !p.linkUrl,
            },
            fields: {
                type: ControlType.Array,
                title: "Fields",
                control: {
                    type: ControlType.Object,
                    controls: {
                        id: { type: ControlType.String, title: "Field ID", defaultValue: "firstName" },
                        label: { type: ControlType.String, title: "Label", defaultValue: "First Name" },
                        type: {
                            type: ControlType.Enum,
                            title: "Type",
                            options: ["text", "email", "phone", "password", "select", "number", "date", "file"],
                            optionTitles: ["Text", "Email", "Phone", "Password", "Select", "Number", "Date", "File"],
                            defaultValue: "text",
                        },
                        placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "John" },
                        required: {
                            type: ControlType.Boolean,
                            title: "Required",
                            defaultValue: true,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                        },
                        options: {
                            type: ControlType.String,
                            title: "Options (comma-separated)",
                            defaultValue: "",
                            displayTextArea: true,
                            hidden: (p) => p.type !== "select",
                        },
                        fileMultiple: {
                            type: ControlType.Boolean,
                            title: "Multiple Files",
                            defaultValue: false,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                            hidden: (p) => p.type !== "file",
                        },
                        fileMaxSize: {
                            type: ControlType.Number,
                            title: "Max Size (MB)",
                            defaultValue: 5,
                            min: 1,
                            max: 100,
                            step: 1,
                            hidden: (p) => p.type !== "file",
                        },
                        fileAllowedTypes: {
                            type: ControlType.String,
                            title: "Allowed Types",
                            defaultValue: "jpg,png,pdf",
                            placeholder: "jpg,png,pdf",
                            hidden: (p) => p.type !== "file",
                        },
                    },
                },
                defaultValue: [
                    { id: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
                ],
            },
        },
    },
    step2: {
        type: ControlType.Object,
        title: "Step 2",
        hidden: (props) => !props.useSeparateSteps,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            id: {
                type: ControlType.String,
                title: "ID",
                defaultValue: "account",
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Account Details",
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: "",
            },
            linkUrl: {
                type: ControlType.Link,
                title: "Link URL",
                defaultValue: "",
            },
            linkNewTab: {
                type: ControlType.Boolean,
                title: "Link New Tab",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p) => !p.linkUrl,
            },
            fields: {
                type: ControlType.Array,
                title: "Fields",
                control: {
                    type: ControlType.Object,
                    controls: {
                        id: { type: ControlType.String, title: "Field ID", defaultValue: "email" },
                        label: { type: ControlType.String, title: "Label", defaultValue: "Email" },
                        type: {
                            type: ControlType.Enum,
                            title: "Type",
                            options: ["text", "email", "phone", "password", "select", "number", "date", "file"],
                            optionTitles: ["Text", "Email", "Phone", "Password", "Select", "Number", "Date", "File"],
                            defaultValue: "email",
                        },
                        placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "john@example.com" },
                        required: {
                            type: ControlType.Boolean,
                            title: "Required",
                            defaultValue: true,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                        },
                        options: {
                            type: ControlType.String,
                            title: "Options (comma-separated)",
                            defaultValue: "",
                            displayTextArea: true,
                            hidden: (p) => p.type !== "select",
                        },
                        fileMultiple: {
                            type: ControlType.Boolean,
                            title: "Multiple Files",
                            defaultValue: false,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                            hidden: (p) => p.type !== "file",
                        },
                        fileMaxSize: {
                            type: ControlType.Number,
                            title: "Max Size (MB)",
                            defaultValue: 5,
                            min: 1,
                            max: 100,
                            step: 1,
                            hidden: (p) => p.type !== "file",
                        },
                        fileAllowedTypes: {
                            type: ControlType.String,
                            title: "Allowed Types",
                            defaultValue: "jpg,png,pdf",
                            placeholder: "jpg,png,pdf",
                            hidden: (p) => p.type !== "file",
                        },
                    },
                },
                defaultValue: [
                    { id: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com" },
                ],
            },
        },
    },
    step3: {
        type: ControlType.Object,
        title: "Step 3",
        hidden: (props) => !props.useSeparateSteps,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            id: {
                type: ControlType.String,
                title: "ID",
                defaultValue: "preferences",
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Preferences",
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: "",
            },
            linkUrl: {
                type: ControlType.Link,
                title: "Link URL",
                defaultValue: "",
            },
            linkNewTab: {
                type: ControlType.Boolean,
                title: "Link New Tab",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p) => !p.linkUrl,
            },
            fields: {
                type: ControlType.Array,
                title: "Fields",
                control: {
                    type: ControlType.Object,
                    controls: {
                        id: { type: ControlType.String, title: "Field ID", defaultValue: "theme" },
                        label: { type: ControlType.String, title: "Label", defaultValue: "Preferred Theme" },
                        type: {
                            type: ControlType.Enum,
                            title: "Type",
                            options: ["text", "email", "phone", "password", "select", "number", "date", "file"],
                            optionTitles: ["Text", "Email", "Phone", "Password", "Select", "Number", "Date", "File"],
                            defaultValue: "select",
                        },
                        placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "" },
                        required: {
                            type: ControlType.Boolean,
                            title: "Required",
                            defaultValue: false,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                        },
                        options: {
                            type: ControlType.String,
                            title: "Options (comma-separated)",
                            defaultValue: "Light,Dark,Auto",
                            displayTextArea: true,
                            hidden: (p) => p.type !== "select",
                        },
                        fileMultiple: {
                            type: ControlType.Boolean,
                            title: "Multiple Files",
                            defaultValue: false,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                            hidden: (p) => p.type !== "file",
                        },
                        fileMaxSize: {
                            type: ControlType.Number,
                            title: "Max Size (MB)",
                            defaultValue: 5,
                            min: 1,
                            max: 100,
                            step: 1,
                            hidden: (p) => p.type !== "file",
                        },
                        fileAllowedTypes: {
                            type: ControlType.String,
                            title: "Allowed Types",
                            defaultValue: "jpg,png,pdf",
                            placeholder: "jpg,png,pdf",
                            hidden: (p) => p.type !== "file",
                        },
                    },
                },
                defaultValue: [
                    { id: "theme", label: "Preferred Theme", type: "select", required: false, options: "Light,Dark,Auto" },
                ],
            },
        },
    },
    step4: {
        type: ControlType.Object,
        title: "Step 4",
        hidden: (props) => !props.useSeparateSteps,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            id: {
                type: ControlType.String,
                title: "ID",
                defaultValue: "extra",
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Extra",
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: "",
            },
            linkUrl: {
                type: ControlType.Link,
                title: "Link URL",
                defaultValue: "",
            },
            linkNewTab: {
                type: ControlType.Boolean,
                title: "Link New Tab",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p) => !p.linkUrl,
            },
            fields: {
                type: ControlType.Array,
                title: "Fields",
                control: {
                    type: ControlType.Object,
                    controls: {
                        id: { type: ControlType.String, title: "Field ID", defaultValue: "notes" },
                        label: { type: ControlType.String, title: "Label", defaultValue: "Notes" },
                        type: {
                            type: ControlType.Enum,
                            title: "Type",
                            options: ["text", "email", "phone", "password", "select", "number", "date", "file"],
                            optionTitles: ["Text", "Email", "Phone", "Password", "Select", "Number", "Date", "File"],
                            defaultValue: "text",
                        },
                        placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "Optional" },
                        required: {
                            type: ControlType.Boolean,
                            title: "Required",
                            defaultValue: false,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                        },
                        options: {
                            type: ControlType.String,
                            title: "Options (comma-separated)",
                            defaultValue: "",
                            displayTextArea: true,
                            hidden: (p) => p.type !== "select",
                        },
                        fileMultiple: {
                            type: ControlType.Boolean,
                            title: "Multiple Files",
                            defaultValue: false,
                            enabledTitle: "Yes",
                            disabledTitle: "No",
                            hidden: (p) => p.type !== "file",
                        },
                        fileMaxSize: {
                            type: ControlType.Number,
                            title: "Max Size (MB)",
                            defaultValue: 5,
                            min: 1,
                            max: 100,
                            step: 1,
                            hidden: (p) => p.type !== "file",
                        },
                        fileAllowedTypes: {
                            type: ControlType.String,
                            title: "Allowed Types",
                            defaultValue: "jpg,png,pdf",
                            placeholder: "jpg,png,pdf",
                            hidden: (p) => p.type !== "file",
                        },
                    },
                },
                defaultValue: [
                    { id: "notes", label: "Notes", type: "text", required: false, placeholder: "Optional" },
                ],
            },
        },
    },
    steps: {
        type: ControlType.Array,
        title: "Steps",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "Step ID",
                    defaultValue: "step",
                },
                title: {
                    type: ControlType.String,
                    title: "Step Title",
                    defaultValue: "Step Title",
                },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link Label",
                    defaultValue: "",
                },
                linkUrl: {
                    type: ControlType.Link,
                    title: "Link URL",
                    defaultValue: "",
                },
                linkNewTab: {
                    type: ControlType.Boolean,
                    title: "Link New Tab",
                    defaultValue: true,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    hidden: (p) => !p.linkUrl,
                },
                fields: {
                    type: ControlType.Array,
                    title: "Fields",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            id: {
                                type: ControlType.String,
                                title: "Field ID",
                                defaultValue: "field",
                            },
                            label: {
                                type: ControlType.String,
                                title: "Label",
                                defaultValue: "Field Label",
                            },
                            type: {
                                type: ControlType.Enum,
                                title: "Type",
                                options: ["text", "email", "phone", "password", "select", "number", "date", "file"],
                                optionTitles: ["Text", "Email", "Phone", "Password", "Select", "Number", "Date", "File"],
                                defaultValue: "text",
                            },
                            placeholder: {
                                type: ControlType.String,
                                title: "Placeholder",
                                defaultValue: "",
                            },
                            required: {
                                type: ControlType.Boolean,
                                title: "Required",
                                defaultValue: false,
                                enabledTitle: "Yes",
                                disabledTitle: "No",
                            },
                            options: {
                                type: ControlType.String,
                                title: "Options (comma-separated)",
                                defaultValue: "",
                                displayTextArea: true,
                                hidden: (props) => props.type !== "select",
                            },
                            fileMultiple: {
                                type: ControlType.Boolean,
                                title: "Multiple Files",
                                defaultValue: false,
                                enabledTitle: "Yes",
                                disabledTitle: "No",
                                hidden: (props) => props.type !== "file",
                            },
                            fileMaxSize: {
                                type: ControlType.Number,
                                title: "Max Size (MB)",
                                defaultValue: 5,
                                min: 1,
                                max: 100,
                                step: 1,
                                hidden: (props) => props.type !== "file",
                            },
                            fileAllowedTypes: {
                                type: ControlType.String,
                                title: "Allowed Types",
                                defaultValue: "jpg,png,pdf",
                                placeholder: "jpg,png,pdf",
                                hidden: (props) => props.type !== "file",
                            },
                        },
                    },
                    defaultValue: [
                        {
                            id: "field1",
                            label: "Field Label",
                            type: "text",
                            placeholder: "Enter value...",
                            required: true,
                        },
                    ],
                },
            },
        },
        defaultValue: [
            {
                id: "personal",
                title: "Personal Information",
                fields: [
                    { id: "firstName", label: "First Name", type: "text", required: true, placeholder: "John" },
                    { id: "lastName", label: "Last Name", type: "text", required: true, placeholder: "Doe" },
                    { id: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com" },
                ],
            },
            {
                id: "account",
                title: "Account Details",
                fields: [
                    { id: "username", label: "Username", type: "text", required: true, placeholder: "johndoe" },
                    { id: "password", label: "Password", type: "password", required: true, placeholder: "••••••••" },
                    { id: "role", label: "Role", type: "select", required: true, options: "Developer,Designer,Manager,Other" },
                ],
            },
            {
                id: "preferences",
                title: "Preferences",
                fields: [
                    { id: "notifications", label: "Notification Frequency", type: "select", required: true, options: "Daily,Weekly,Monthly,Never" },
                    { id: "theme", label: "Preferred Theme", type: "select", required: false, options: "Light,Dark,Auto" },
                ],
            },
        ],
        hidden: (props) => props.useSeparateSteps,
    },
    transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["slide", "fade", "scale", "flip"],
        optionTitles: ["Slide", "Fade", "Scale", "Flip"],
        defaultValue: "slide",
        displaySegmentedControl: true,
    },
    progressStyle: {
        type: ControlType.Enum,
        title: "Progress Style",
        options: ["bar", "steps", "circles", "breadcrumb"],
        optionTitles: ["Bar", "Steps", "Circles", "Breadcrumb"],
        defaultValue: "bar",
    },
    validateOnBlur: {
        type: ControlType.Boolean,
        title: "Validate on Blur",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    validateOnChange: {
        type: ControlType.Boolean,
        title: "Validate on Change",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showReview: {
        type: ControlType.Boolean,
        title: "Show Review Step",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    allowStepNavigation: {
        type: ControlType.Boolean,
        title: "Allow Step Navigation",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    submitButtonText: {
        type: ControlType.String,
        title: "Submit Button",
        defaultValue: "Submit",
    },
    nextButtonText: {
        type: ControlType.String,
        title: "Next Button",
        defaultValue: "Next",
    },
    backButtonText: {
        type: ControlType.String,
        title: "Back Button",
        defaultValue: "Back",
    },
    reviewTitle: {
        type: ControlType.String,
        title: "Review Title",
        defaultValue: "Review Your Information",
        hidden: (props) => !props.showReview,
    },
    editButtonText: {
        type: ControlType.String,
        title: "Edit Button",
        defaultValue: "Edit",
        hidden: (props) => !props.showReview,
    },
    successTitle: {
        type: ControlType.String,
        title: "Success Title",
        defaultValue: "Form Submitted!",
    },
    successMessage: {
        type: ControlType.String,
        title: "Success Message",
        defaultValue: "Thank you for completing the form.",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#0099FF",
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error Color",
        defaultValue: "#FF5588",
    },
    successColor: {
        type: ControlType.Color,
        title: "Success Color",
        defaultValue: "#22CC66",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    inputFont: {
        type: ControlType.Font,
        title: "Input Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})