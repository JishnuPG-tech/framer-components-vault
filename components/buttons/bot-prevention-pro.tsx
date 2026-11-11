import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- SVGs ---
const ShieldIcon = ({ color }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
)
const CheckIcon = ({ color, strokeWidth = 2.5, size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
)
const AlertCircleIcon = ({ color }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
)
const ArrowDownIcon = ({ color }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
    </svg>
)

// ─── DEFAULT GROUPS ───────────────────────────────────────────────────────────

const defaultText = {
    instructionText: "Hold to verify for {holdSeconds} seconds",
    buttonText: "Hold to Verify",
    buttonSuccessText: "Verification Complete",
    errorText: "Verification failed. Please try again.",
    successText: "Verified successfully",
    successFooterText: "Verification complete",
    warningText: "Please complete the verification before submitting.",
    footerText: "Security powered by system",
}

const defaultStyling = {
    instructionColor: "#171717",
    buttonVariant: "filled",
    buttonColor: "#171717",
    buttonTextColor: "#ffffff",
    progressBarColor: "#10B981",
    successIconColor: "#10B981",
    iconColor: "#A3A3A3",
    iconBackgroundColor: "#f5f5f5",
    buttonSuccessIconColor: "#ffffff",
    errorIconColor: "#EF4444",
    errorIconBackgroundColor: "rgba(239, 68, 68, 0.1)",
    footerColor: "#737373",
    successColor: "#171717",
    errorColor: "#7F1D1D",
    warningColor: "#78350F",
    cardBackground: "rgba(255, 255, 255, 0)",
    cardBorderColor: "rgba(0,0,0,0)",
    instructionFont: {
        family: "Inter",
        size: 18,
        weight: "600",
        lineHeight: 1.5,
        letterSpacing: "-0.02em",
    },
    buttonFont: {
        family: "Inter",
        size: 16,
        weight: "500",
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
    },
    footerFont: {
        family: "Inter",
        size: 14,
        weight: "400",
        lineHeight: 1.5,
        letterSpacing: 0,
    },
    successFont: {
        family: "Inter",
        size: 18,
        weight: "600",
        lineHeight: 1.5,
        letterSpacing: "-0.02em",
    },
    errorFont: {
        family: "Inter",
        size: 14,
        weight: "400",
        lineHeight: 1.5,
        letterSpacing: 0,
    },
    warningFont: {
        family: "Inter",
        size: 14,
        weight: "400",
        lineHeight: 1.5,
        letterSpacing: 0,
    },
    cardBorderWidth: 0,
    itemGap: 24,
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
    cardPadding: "16px 0px",
    buttonPadding: "12px",
    messagePadding: "16px",
}

const defaultSecurity = {
    honeypotEnabled: true,
    holdDurationSeconds: 2,
    warningDurationSeconds: 5,
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function Bot_Prevention_Pro(props) {
    const {
        text = defaultText,
        styling = defaultStyling,
        security = defaultSecurity,
    } = props

    // Destructure Text Group
    const {
        instructionText = defaultText.instructionText,
        buttonText = defaultText.buttonText,
        buttonSuccessText = defaultText.buttonSuccessText,
        errorText = defaultText.errorText,
        successText = defaultText.successText,
        successFooterText = defaultText.successFooterText,
        warningText = defaultText.warningText,
        footerText = defaultText.footerText,
    } = text

    // Destructure Styling Group
    const {
        instructionFont = defaultStyling.instructionFont,
        buttonFont = defaultStyling.buttonFont,
        footerFont = defaultStyling.footerFont,
        successFont = defaultStyling.successFont,
        errorFont = defaultStyling.errorFont,
        warningFont = defaultStyling.warningFont,
        instructionColor = defaultStyling.instructionColor,
        buttonVariant = defaultStyling.buttonVariant,
        buttonColor = defaultStyling.buttonColor,
        buttonTextColor = defaultStyling.buttonTextColor,
        progressBarColor = defaultStyling.progressBarColor,
        successIconColor = defaultStyling.successIconColor,
        iconColor = defaultStyling.iconColor,
        iconBackgroundColor = defaultStyling.iconBackgroundColor,
        buttonSuccessIconColor = defaultStyling.buttonSuccessIconColor,
        errorIconColor = defaultStyling.errorIconColor,
        errorIconBackgroundColor = defaultStyling.errorIconBackgroundColor,
        footerColor = defaultStyling.footerColor,
        successColor = defaultStyling.successColor,
        errorColor = defaultStyling.errorColor,
        warningColor = defaultStyling.warningColor,
        cardBackground = defaultStyling.cardBackground,
        cardBorderColor = defaultStyling.cardBorderColor,
        cardBorderWidth = defaultStyling.cardBorderWidth,
        itemGap = defaultStyling.itemGap,
        cardBorderRadius = defaultStyling.cardBorderRadius,
        cardPadding = defaultStyling.cardPadding,
        messagePadding = defaultStyling.messagePadding,
        buttonPadding = defaultStyling.buttonPadding,
        buttonBorderRadius = defaultStyling.buttonBorderRadius,
    } = styling

    // Destructure Security Group
    const {
        honeypotEnabled = defaultSecurity.honeypotEnabled,
        holdDurationSeconds = defaultSecurity.holdDurationSeconds,
        warningDurationSeconds = defaultSecurity.warningDurationSeconds,
    } = security

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // --- State Management ---
    const [state, setState] = useState("default") // 'default' | 'holding' | 'warning' | 'error' | 'success'
    const [progress, setProgress] = useState(0)
    const [honeypot, setHoneypot] = useState("")
    const [showSubmitAttemptWarning, setShowSubmitAttemptWarning] =
        useState(false)
    const [submitAttempted, setSubmitAttempted] = useState(false)

    // Refs to avoid stale closures
    const stateRef = useRef(state)
    const progressRef = useRef(progress)
    const honeypotRef = useRef(honeypot)
    const isSpaceDownRef = useRef(false) // For keyboard accessibility

    useEffect(() => {
        stateRef.current = state
    }, [state])
    useEffect(() => {
        progressRef.current = progress
    }, [progress])
    useEffect(() => {
        honeypotRef.current = honeypot
    }, [honeypot])

    const holdIntervalRef = useRef(null)
    const startTimeRef = useRef(null)
    const submitButtonsRef = useRef([])

    const handleSubmitAttemptRef = useRef(null)
    const formSubmitHandlerRef = useRef(null)
    const formKeydownHandlerRef = useRef(null)

    // --- Typography Helper ---
    const applyFontStyles = (font, fallbackSize = 16, fallbackWeight = 400) => {
        if (!font || typeof font === "string") {
            return {
                fontFamily: font || "Inter, sans-serif",
                fontSize: fallbackSize,
                fontWeight: fallbackWeight,
                lineHeight: 1.5,
                letterSpacing: 0,
                textAlign: "left",
            }
        }
        return {
            fontFamily: font.family || font.fontFamily || "Inter, sans-serif",
            fontSize: font.size || font.fontSize || fallbackSize,
            fontWeight: font.weight || font.fontWeight || fallbackWeight,
            lineHeight: font.lineHeight || 1.5,
            letterSpacing: font.letterSpacing || 0,
            textAlign: font.alignment || font.textAlign || "left",
        }
    }

    const instructionStyles = applyFontStyles(instructionFont, 16, 600)
    const buttonStyles = applyFontStyles(buttonFont, 16, 500)
    const footerStyles = applyFontStyles(footerFont, 14, 400)
    const successStyles = applyFontStyles(successFont, 16, 600)
    const errorStyles = applyFontStyles(errorFont, 14, 400)
    const warningStyles = applyFontStyles(warningFont, 14, 400)

    // --- Form Helpers ---
    const checkRequiredFields = useCallback(() => {
        if (typeof document === "undefined") return true
        const form = document.querySelector("form")
        if (!form) return true
        const requiredFields = form.querySelectorAll("[required]")
        let allFilled = true
        requiredFields.forEach((field) => {
            if (field.id === "bot_verification_field") return
            if (!field.value || field.value.trim() === "") {
                allFilled = false
            }
        })
        return allFilled
    }, [])

    // --- Hold Interaction Logic ---
    const handleVerificationComplete = useCallback(() => {
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current)
            holdIntervalRef.current = null
        }

        const isBot = honeypotEnabled && honeypotRef.current !== ""

        if (isBot) {
            setState("error")
            setProgress(0)
            setTimeout(() => {
                setState((prev) => (prev === "error" ? "default" : prev))
            }, 3000)
            return
        }

        setState("success")
        setProgress(100)

        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("botProtectionVerified", {
                    detail: { verified: true },
                })
            )
        }
    }, [honeypotEnabled])

    const handleMouseDown = useCallback(
        (e) => {
            if (stateRef.current === "success") return
            if (e && e.preventDefault && e.type !== "keydown")
                e.preventDefault()

            setState("holding")
            setShowSubmitAttemptWarning(false)

            startTimeRef.current = Date.now()
            holdIntervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    const elapsed = Date.now() - startTimeRef.current
                    const newProgress = Math.min(
                        (elapsed / (holdDurationSeconds * 1000)) * 100,
                        100
                    )
                    setProgress(newProgress)
                    progressRef.current = newProgress
                    if (newProgress >= 100) {
                        handleVerificationComplete()
                    }
                }
            }, 16)
        },
        [holdDurationSeconds, handleVerificationComplete]
    )

    const handleMouseUp = useCallback(() => {
        if (stateRef.current === "success") return
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current)
            holdIntervalRef.current = null
        }
        if (progressRef.current < 100 && progressRef.current > 0) {
            setState("default")
            setProgress(0)
            progressRef.current = 0
        }
        startTimeRef.current = null
    }, [])

    // --- Keyboard Handlers (Spacebar Hold & Enter Block) ---
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter") {
                e.preventDefault() // Stop enter from doing default button click behavior
            }
            if (e.key === " " || e.code === "Space") {
                e.preventDefault() // Stop page scroll
                if (!isSpaceDownRef.current) {
                    isSpaceDownRef.current = true
                    handleMouseDown(e)
                }
            }
        },
        [handleMouseDown]
    )

    const handleKeyUp = useCallback(
        (e) => {
            if (e.key === " " || e.code === "Space") {
                e.preventDefault()
                isSpaceDownRef.current = false
                handleMouseUp()
            }
        },
        [handleMouseUp]
    )

    // --- Submit Attempt Handler ---
    const handleSubmitAttempt = useCallback(
        (e) => {
            if (stateRef.current !== "success") {
                e.preventDefault()
                e.stopPropagation()
            }

            setSubmitAttempted(true)

            const form = e.target.closest("form")
            let hasEmptyFields = false

            if (form) {
                const requiredFields = form.querySelectorAll("[required]")
                requiredFields.forEach((field) => {
                    if (field.id === "bot_verification_field") return
                    if (!field.value || field.value.trim() === "") {
                        hasEmptyFields = true
                        const originalBorder = field.style.border
                        field.style.border = "2px solid #ef4444"
                        field.style.transition = "border 0.3s ease"
                        setTimeout(() => {
                            field.style.border = originalBorder
                        }, 3000)
                    }
                })
            }

            if (stateRef.current !== "success" || hasEmptyFields) {
                setState("warning")
                setShowSubmitAttemptWarning(true)

                setTimeout(() => {
                    setShowSubmitAttemptWarning(false)
                    setState((prev) => (prev === "warning" ? "default" : prev))
                }, warningDurationSeconds * 1000)

                const verificationElement = document.getElementById(
                    "hold-bot-verification"
                )
                if (verificationElement) {
                    verificationElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    })
                }
            }
        },
        [warningDurationSeconds]
    )

    useEffect(() => {
        handleSubmitAttemptRef.current = handleSubmitAttempt
    }, [handleSubmitAttempt])

    const stableSubmitHandler = useCallback((e) => {
        handleSubmitAttemptRef.current?.(e)
    }, [])

    useEffect(() => {
        return () => {
            if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
        }
    }, [])

    // --- Warning auto-dismiss when fields are filled ---
    useEffect(() => {
        if (
            !submitAttempted ||
            !showSubmitAttemptWarning ||
            typeof document === "undefined"
        )
            return

        const form = document.querySelector("form")
        if (!form) return

        const checkAndHideWarning = () => {
            const allFieldsFilled = checkRequiredFields()
            if (stateRef.current === "success" && allFieldsFilled) {
                setShowSubmitAttemptWarning(false)
                setSubmitAttempted(false)
            }
        }

        checkAndHideWarning()
        form.addEventListener("input", checkAndHideWarning)
        form.addEventListener("change", checkAndHideWarning)

        return () => {
            form.removeEventListener("input", checkAndHideWarning)
            form.removeEventListener("change", checkAndHideWarning)
        }
    }, [state, submitAttempted, showSubmitAttemptWarning, checkRequiredFields])

    // --- Form Injection & Submit Button Hijacking ---
    useEffect(() => {
        if (typeof document === "undefined" || isCanvas) return

        const existingInput = document.getElementById("bot_verification_field")

        if (existingInput) {
            existingInput.value =
                state === "success" ? "verified" : "not_verified"
        } else {
            const form = document.querySelector("form")
            if (form) {
                const hiddenInput = document.createElement("input")
                hiddenInput.type = "hidden"
                hiddenInput.name = "Human_Verification"
                hiddenInput.id = "bot_verification_field"
                hiddenInput.value =
                    state === "success" ? "verified" : "not_verified"
                form.appendChild(hiddenInput)
            }
        }

        submitButtonsRef.current.forEach((button) => {
            button.removeEventListener("click", stableSubmitHandler, true)
        })
        submitButtonsRef.current = []

        const submitButtons = document.querySelectorAll(
            'button[type="submit"], input[type="submit"]'
        )

        submitButtons.forEach((button) => {
            if (state === "success") {
                button.removeAttribute("disabled")
                button.style.opacity = "1"
                button.style.cursor = "pointer"
            } else {
                button.removeAttribute("disabled")
                button.style.opacity = "0.5"
                button.style.cursor = "not-allowed"
                button.addEventListener("click", stableSubmitHandler, true)
                submitButtonsRef.current.push(button)
            }
        })

        const form = document.querySelector("form")
        if (!form) return

        // Cleanup old listeners
        if (formSubmitHandlerRef.current) {
            form.removeEventListener("submit", formSubmitHandlerRef.current)
        }
        if (formKeydownHandlerRef.current) {
            form.removeEventListener("keydown", formKeydownHandlerRef.current)
        }

        // Add robust submit blocker
        const formSubmitHandler = (e) => {
            if (stateRef.current !== "success") {
                e.preventDefault()
                e.stopPropagation()
                stableSubmitHandler(e)
            }
        }

        // Add robust Enter key blocker on the form itself
        const formKeydownHandler = (e) => {
            if (e.key === "Enter" && stateRef.current !== "success") {
                const target = e.target
                // Allow enter key if user is typing in a multiline textarea
                if (target.tagName.toLowerCase() !== "textarea") {
                    e.preventDefault()
                    e.stopPropagation()
                    stableSubmitHandler(e)
                }
            }
        }

        formSubmitHandlerRef.current = formSubmitHandler
        formKeydownHandlerRef.current = formKeydownHandler

        form.addEventListener("submit", formSubmitHandler)
        form.addEventListener("keydown", formKeydownHandler)

        return () => {
            form.removeEventListener("submit", formSubmitHandler)
            form.removeEventListener("keydown", formKeydownHandler)
            formSubmitHandlerRef.current = null
            formKeydownHandlerRef.current = null
            submitButtonsRef.current.forEach((button) => {
                button.removeEventListener("click", stableSubmitHandler, true)
            })
        }
    }, [state, isCanvas, stableSubmitHandler])

    // --- Styling Objects ---
    const getIconBoxStyle = () => {
        const base = {
            width: 48,
            height: 48,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.5s ease",
            flexShrink: 0,
        }

        switch (state) {
            case "success":
                return {
                    ...base,
                    backgroundColor: `${successIconColor}1A`,
                    boxShadow: `0 0 24px ${successIconColor}26`,
                }
            case "error":
                return {
                    ...base,
                    backgroundColor: errorIconBackgroundColor,
                }
            case "warning":
                return { ...base, backgroundColor: "rgba(245, 158, 11, 0.1)" }
            default:
                return {
                    ...base,
                    backgroundColor: iconBackgroundColor,
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)",
                }
        }
    }

    const isOutline = buttonVariant === "outline"

    const dynamicInstructionText = instructionText.replace(
        "{holdSeconds}",
        holdDurationSeconds.toString()
    )

    // Calculate Message Border Radius smoothly handling potential string values
    const parsedCardRadius =
        typeof cardBorderRadius === "number"
            ? cardBorderRadius
            : parseInt(cardBorderRadius) || 12
    const messageRadius = Math.max(8, parsedCardRadius - 4)

    return (
        <div id="hold-bot-verification" style={{ width: "100%" }}>
            {/* Honeypot Field */}
            {honeypotEnabled && (
                <input
                    type="text"
                    name="bot_trap_field_ignore"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                    tabIndex={-1}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    aria-hidden="true"
                />
            )}

            {/* Premium Card Container */}
            <motion.div
                layout={isCanvas ? false : "position"}
                style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: cardBorderRadius,
                    backgroundColor: cardBackground,
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: `${cardBorderWidth}px solid ${cardBorderColor}`,
                }}
            >
                {/* Floating Status Messages Overlay */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        padding: cardPadding,
                        zIndex: 20,
                        pointerEvents: "none",
                    }}
                >
                    <AnimatePresence mode="wait">
                        {showSubmitAttemptWarning && state === "warning" && (
                            <motion.div
                                key="warning-message"
                                initial={
                                    isCanvas
                                        ? false
                                        : { opacity: 0, y: -10, scale: 0.95 }
                                }
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: messagePadding,
                                    borderRadius: messageRadius,
                                    backgroundColor:
                                        "rgba(254, 243, 199, 0.95)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(253, 230, 138, 0.8)",
                                    boxShadow:
                                        "0 10px 30px -10px rgba(0,0,0,0.1)",
                                    pointerEvents: "auto",
                                }}
                            >
                                <div style={{ marginTop: 2 }}>
                                    <ArrowDownIcon color="#D97706" />
                                </div>
                                <p
                                    style={{
                                        ...warningStyles,
                                        color: warningColor,
                                        margin: 0,
                                    }}
                                >
                                    {warningText}
                                </p>
                            </motion.div>
                        )}

                        {state === "error" && (
                            <motion.div
                                key="error-message"
                                initial={
                                    isCanvas
                                        ? false
                                        : { opacity: 0, y: -10, scale: 0.95 }
                                }
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    padding: messagePadding,
                                    borderRadius: messageRadius,
                                    backgroundColor:
                                        "rgba(254, 226, 226, 0.95)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(254, 202, 202, 0.8)",
                                    boxShadow:
                                        "0 10px 30px -10px rgba(0,0,0,0.1)",
                                    pointerEvents: "auto",
                                }}
                            >
                                <div style={{ marginTop: 2 }}>
                                    <AlertCircleIcon color="#DC2626" />
                                </div>
                                <p
                                    style={{
                                        ...errorStyles,
                                        color: errorColor,
                                        margin: 0,
                                    }}
                                >
                                    {errorText}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Content Wrapper */}
                <div
                    style={{
                        position: "relative",
                        padding: cardPadding,
                        display: "flex",
                        flexDirection: "column",
                        gap: itemGap,
                    }}
                >
                    {/* Header Section */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 16,
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: state === "success" ? [1, 1.1, 1] : 1,
                                rotate: state === "success" ? [0, 5, -5, 0] : 0,
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <div style={getIconBoxStyle()}>
                                <AnimatePresence mode="wait">
                                    {state === "success" ? (
                                        <motion.div
                                            key="check"
                                            initial={
                                                isCanvas
                                                    ? false
                                                    : { scale: 0, rotate: -180 }
                                            }
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 180 }}
                                            transition={{
                                                duration: 0.5,
                                                ease: [0.34, 1.56, 0.64, 1],
                                            }}
                                        >
                                            <CheckIcon
                                                color={successIconColor}
                                            />
                                        </motion.div>
                                    ) : state === "error" ? (
                                        <motion.div
                                            key="error"
                                            initial={
                                                isCanvas ? false : { scale: 0 }
                                            }
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <AlertCircleIcon
                                                color={errorIconColor}
                                            />
                                        </motion.div>
                                    ) : state === "warning" ? (
                                        <motion.div
                                            key="warning"
                                            initial={
                                                isCanvas ? false : { scale: 0 }
                                            }
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <AlertCircleIcon color="#F59E0B" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="shield"
                                            initial={
                                                isCanvas ? false : { scale: 0 }
                                            }
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <ShieldIcon color={iconColor} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <AnimatePresence mode="wait">
                                {state === "success" ? (
                                    <motion.div
                                        key="success"
                                        initial={
                                            isCanvas
                                                ? false
                                                : { opacity: 0, y: 10 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h3
                                            style={{
                                                ...successStyles,
                                                margin: "0 0 4px 0",
                                                color: successColor,
                                            }}
                                        >
                                            {successText}
                                        </h3>
                                        <p
                                            style={{
                                                ...footerStyles,
                                                color: footerColor,
                                                margin: 0,
                                            }}
                                        >
                                            {successFooterText}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="default"
                                        initial={
                                            isCanvas
                                                ? false
                                                : { opacity: 0, y: 10 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h3
                                            style={{
                                                ...instructionStyles,
                                                margin: "0 0 4px 0",
                                                color: instructionColor,
                                            }}
                                        >
                                            {dynamicInstructionText}
                                        </h3>
                                        <p
                                            style={{
                                                ...footerStyles,
                                                color: footerColor,
                                                margin: 0,
                                            }}
                                        >
                                            {footerText}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Hold Button */}
                    <motion.button
                        tabIndex={0}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchEnd={handleMouseUp}
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyUp}
                        disabled={state === "success"}
                        whileTap={state !== "success" ? { scale: 0.98 } : {}}
                        layout={isCanvas ? false : "position"}
                        style={{
                            position: "relative",
                            width: "100%",
                            padding: buttonPadding,
                            borderRadius: buttonBorderRadius,
                            overflow: "hidden",
                            cursor: state === "success" ? "default" : "pointer",
                            transition: "all 0.3s ease",
                            backgroundColor: isOutline
                                ? "transparent"
                                : state === "success"
                                  ? progressBarColor
                                  : buttonColor,
                            border: isOutline
                                ? `1px solid ${state === "success" ? progressBarColor : buttonColor}`
                                : "none",
                            boxShadow: isOutline
                                ? "none"
                                : state === "success"
                                  ? `0 0 0 1px ${progressBarColor}33, 0 4px 16px ${progressBarColor}40`
                                  : "0 0 0 1px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.08)",
                            display: "block",
                            outline: "none",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            WebkitTouchCallout: "none",
                        }}
                    >
                        {/* Progress Fill */}
                        <motion.div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: progressBarColor,
                                transformOrigin: "left",
                                zIndex: 0,
                            }}
                            initial={isCanvas ? false : { scaleX: 0 }}
                            animate={{
                                scaleX: progress / 100,
                                opacity:
                                    state === "success"
                                        ? isOutline
                                            ? 0.15
                                            : 0
                                        : isOutline
                                          ? 0.15
                                          : 1,
                            }}
                            transition={{ duration: 0.1, ease: "linear" }}
                        />

                        {/* Glow Effect on Hold */}
                        {state === "holding" && !isOutline && (
                            <motion.div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
                                    zIndex: 1,
                                }}
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        )}

                        {/* Button Content */}
                        <div
                            style={{
                                position: "relative",
                                zIndex: 10,
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {state === "success" ? (
                                    <motion.div
                                        key="success-content"
                                        initial={
                                            isCanvas
                                                ? false
                                                : { opacity: 0, y: 10 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        <motion.div
                                            initial={
                                                isCanvas
                                                    ? false
                                                    : { scale: 0, rotate: -90 }
                                            }
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{
                                                delay: 0.1,
                                                duration: 0.4,
                                                ease: [0.34, 1.56, 0.64, 1],
                                            }}
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: "50%",
                                                background: isOutline
                                                    ? "transparent"
                                                    : "rgba(255,255,255,0.25)",
                                                backdropFilter: isOutline
                                                    ? "none"
                                                    : "blur(4px)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <CheckIcon
                                                color={
                                                    isOutline
                                                        ? progressBarColor
                                                        : buttonSuccessIconColor
                                                }
                                                strokeWidth={3}
                                                size={14}
                                            />
                                        </motion.div>
                                        <span
                                            style={{
                                                ...buttonStyles,
                                                color: isOutline
                                                    ? progressBarColor
                                                    : buttonTextColor,
                                                margin: 0,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {buttonSuccessText}
                                        </span>
                                    </motion.div>
                                ) : state === "holding" ? (
                                    <motion.span
                                        key="holding-text"
                                        initial={
                                            isCanvas ? false : { opacity: 0 }
                                        }
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            ...buttonStyles,
                                            color: buttonTextColor,
                                            margin: 0,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Keep holding... {Math.floor(progress)}%
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="default-text"
                                        initial={
                                            isCanvas ? false : { opacity: 0 }
                                        }
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            ...buttonStyles,
                                            color: buttonTextColor,
                                            margin: 0,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {buttonText}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(Bot_Prevention_Pro, {
    // ── Group 1: Text ─────────────────────────────────────────────────────────
    text: {
        type: ControlType.Object,
        title: "Text 📝",
        controls: {
            instructionText: {
                type: ControlType.String,
                title: "Instruction",
            },
            buttonText: {
                type: ControlType.String,
                title: "Button",
            },
            buttonSuccessText: {
                type: ControlType.String,
                title: "Btn Success",
            },
            successText: {
                type: ControlType.String,
                title: "Success Msg",
            },
            successFooterText: {
                type: ControlType.String,
                title: "Success Footer",
            },
            errorText: {
                type: ControlType.String,
                title: "Error Msg",
            },
            warningText: {
                type: ControlType.String,
                title: "Warning Msg",
            },
            footerText: {
                type: ControlType.String,
                title: "Footer",
            },
        },
        defaultValue: defaultText,
    },

    // ── Group 2: Styling ──────────────────────────────────────────────────────
    styling: {
        type: ControlType.Object,
        title: "Styling 🎨",
        controls: {
            // Options
            buttonVariant: {
                type: ControlType.Enum,
                title: "Button Style",
                options: ["filled", "outline"],
                optionTitles: ["Filled", "Outline"],
            },
            // Colors
            instructionColor: { type: ControlType.Color, title: "Instruction" },
            buttonColor: { type: ControlType.Color, title: "Button Bg" },
            buttonTextColor: { type: ControlType.Color, title: "Button Text" },
            progressBarColor: {
                type: ControlType.Color,
                title: "Progress Bar",
            },
            successIconColor: {
                type: ControlType.Color,
                title: "Success Icon",
            },
            iconColor: { type: ControlType.Color, title: "Default Icon" },
            iconBackgroundColor: { type: ControlType.Color, title: "Icon Box" },
            buttonSuccessIconColor: {
                type: ControlType.Color,
                title: "Btn Check",
            },
            errorIconColor: { type: ControlType.Color, title: "Error Icon" },
            errorIconBackgroundColor: {
                type: ControlType.Color,
                title: "Error Box",
            },
            footerColor: { type: ControlType.Color, title: "Footer Color" },
            successColor: { type: ControlType.Color, title: "Success Text" },
            errorColor: { type: ControlType.Color, title: "Error Text" },
            warningColor: { type: ControlType.Color, title: "Warning Text" },
            cardBackground: { type: ControlType.Color, title: "Card Bg" },
            cardBorderColor: { type: ControlType.Color, title: "Card Border" },

            // Typography
            instructionFont: {
                type: ControlType.Font,
                title: "Instruction Font",
                controls: "extended",
            },
            buttonFont: {
                type: ControlType.Font,
                title: "Button Font",
                controls: "extended",
            },
            footerFont: {
                type: ControlType.Font,
                title: "Footer Font",
                controls: "extended",
            },
            successFont: {
                type: ControlType.Font,
                title: "Success Font",
                controls: "extended",
            },
            errorFont: {
                type: ControlType.Font,
                title: "Error Font",
                controls: "extended",
            },
            warningFont: {
                type: ControlType.Font,
                title: "Warning Font",
                controls: "extended",
            },

            // Layout & Borders
            cardBorderWidth: {
                type: ControlType.Number,
                title: "Card Border W",
                min: 0,
                max: 10,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            itemGap: {
                type: ControlType.Number,
                title: "Item Gap",
                min: 0,
                max: 64,
                step: 2,
                unit: "px",
                displayStepper: true,
            },
            cardBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Card Radius",
            },
            buttonBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Button Radius",
            },

            // Padding
            cardPadding: {
                type: ControlType.Padding,
                title: "Card Padding",
            },
            buttonPadding: {
                type: ControlType.Padding,
                title: "Button Padding",
            },
            messagePadding: {
                type: ControlType.Padding,
                title: "Message Padding",
            },
        },
        defaultValue: defaultStyling,
    },

    // ── Group 3: Security ─────────────────────────────────────────────────────
    security: {
        type: ControlType.Object,
        title: "Security 🛡️",
        controls: {
            honeypotEnabled: {
                type: ControlType.Boolean,
                title: "Honeypot Trap",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            holdDurationSeconds: {
                type: ControlType.Number,
                title: "Hold Time",
                min: 1,
                max: 10,
                step: 1,
                unit: "s",
                displayStepper: true,
            },
            warningDurationSeconds: {
                type: ControlType.Number,
                title: "Warning Time",
                min: 1,
                max: 30,
                step: 1,
                unit: "s",
                displayStepper: true,
            },
        },
        defaultValue: defaultSecurity,
    },
})
