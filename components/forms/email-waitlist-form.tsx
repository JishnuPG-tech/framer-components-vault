import { useState, startTransition, type CSSProperties, type FormEvent, type ReactNode } from "react"
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

const MAX_RETRIES = 3

interface WaitlistFormProps {
    placeholder: string
    buttonText: string
    successMessage: string
    sendingText: string
    webhookUrl: string
    backgroundColor: string
    inputTextColor: string
    buttonColor: string
    buttonTextColor: string
    borderColor: string
    errorBorderColor: string
    borderRadius: number
    buttonPadding: number
    inputFont: any
    buttonFont: any
    errorFont: any
    showIcon: boolean
    iconPosition: "left" | "right"
    icon?: ReactNode
    onSubmit?: (email: string) => void
    style?: CSSProperties
    errorTextColor: string
}

/**
 * Email Waitlist Form
 *
 * A compact pill-shaped email signup form for waitlist registration.
 *
 * @framerIntrinsicWidth 474
 * @framerIntrinsicHeight 55
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function EmailWaitlistForm(props: WaitlistFormProps) {
    const {
        placeholder = "yourmail@example.com",
        buttonText = "Notify me",
        successMessage = "Thank you",
        sendingText = "Sending...",
        webhookUrl = "",
        backgroundColor = "#1d1b1a",
        inputTextColor = "#535250",
        buttonColor = "#f5f4f1",
        buttonTextColor = "#242424",
        borderColor = "#2a2827",
        errorBorderColor = "#cc4444",
        borderRadius = 9999,
        buttonPadding = 29,
        inputFont = {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        buttonFont = {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        errorFont = {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
        showIcon = false,
        iconPosition = "right",
        icon,
        onSubmit,
        style,
        errorTextColor = "#cc4444",
    } = props

    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccessText, setShowSuccessText] = useState(false)
    const [showSendingText, setShowSendingText] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("Please enter your email address")
    const [retryCount, setRetryCount] = useState(0)
    const [isCooldown, setIsCooldown] = useState(false)

    const submitWithRetry = async (attempt = 0): Promise<boolean> => {
        if (attempt >= MAX_RETRIES) {
            return false
        }

        try {
            // Try JSON format first (most common)
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ 
                    email: email,
                    email_address: email,
                    timestamp: new Date().toISOString(),
                    source: "waitlist_form",
                    form_data: {
                        email: email,
                        submitted_at: new Date().toISOString(),
                    }
                }),
            })
            
            if (response.ok) {
                return true
            }
            
            throw new Error(`HTTP error! status: ${response.status}`)
        } catch (err) {
            // If JSON fails, try URL-encoded format
            try {
                const formData = new URLSearchParams()
                formData.append("email", email)
                formData.append("email_address", email)
                
                const response = await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: formData.toString(),
                })
                
                if (response.ok) {
                    return true
                }
                
                throw new Error(`HTTP error! status: ${response.status}`)
            } catch (fallbackErr) {
                // Both formats failed, retry with exponential backoff
                if (attempt < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, delay))
                    startTransition(() => setRetryCount(attempt + 1))
                    return submitWithRetry(attempt + 1)
                }
                return false
            }
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        
        // Reset retry count
        startTransition(() => setRetryCount(0))
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) {
            startTransition(() => {
                setErrorMessage("Please enter your email address")
                setShowError(true)
            })
            setTimeout(() => {
                startTransition(() => setShowError(false))
            }, 3000)
            return
        }
        
        if (!emailRegex.test(email)) {
            startTransition(() => {
                setErrorMessage("Enter a valid email address.")
                setShowError(true)
            })
            setTimeout(() => {
                startTransition(() => setShowError(false))
            }, 3000)
            return
        }

        startTransition(() => setShowError(false))
        setIsLoading(true)
        startTransition(() => setShowSendingText(true))
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Make actual webhook call with retry if URL is provided
        if (webhookUrl) {
            const success = await submitWithRetry()
            // Even if webhook fails after retries, we still show success to the user
            // The webhook failure is silently logged
            console.log(`Webhook submission ${success ? 'succeeded' : 'failed after ' + MAX_RETRIES + ' retries'}`)
        }
        
        // Transition to success
        startTransition(() => {
            setShowSendingText(false)
            setShowSuccessText(true)
        })

        await new Promise(resolve => setTimeout(resolve, 400))
        
        if (onSubmit) {
            onSubmit(email)
        }

        // Start cooldown period
        startTransition(() => setIsCooldown(true))
        
        // Wait 3 seconds before resetting
        setTimeout(() => {
            startTransition(() => {
                setShowSuccessText(false)
                setIsCooldown(false)
                setEmail("")
                setRetryCount(0)
            })
        }, 3000)

        setIsLoading(false)
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
    }

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            width: "100%",
        }}>
            <form
                onSubmit={handleSubmit}
                noValidate
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    backgroundColor,
                    borderRadius: `${borderRadius}px`,
                    border: `1px solid ${showError ? errorBorderColor : borderColor}`,
                    height: "55px",
                    minWidth: "280px",
                    padding: "4px",
                    gap: "8px",
                    boxSizing: "border-box",
                }}
            >
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder={placeholder}
                    disabled={isLoading || isCooldown}
                    style={{
                        flex: 1,
                        padding: "0 16px 0 24px",
                        borderRadius: `${borderRadius}px`,
                        border: "none",
                        backgroundColor: "transparent",
                        color: inputTextColor,
                        outline: "none",
                        height: "100%",
                        minWidth: 0,
                        caretColor: inputTextColor,
                        fontFamily: inputFont?.fontFamily,
                        fontSize: inputFont?.fontSize,
                        fontWeight: inputFont?.fontWeight,
                        fontStyle: inputFont?.fontStyle,
                        lineHeight: inputFont?.lineHeight,
                        letterSpacing: inputFont?.letterSpacing,
                    }}
                    aria-label="Email address"
                />
                
                <motion.button
                    type="submit"
                    disabled={isLoading || isCooldown}
                    style={{
                        padding: `0 ${buttonPadding}px`,
                        borderRadius: `${Math.max(0, borderRadius - 4)}px`,
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                        border: "none",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        height: "100%",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        minWidth: "fit-content",
                        width: "auto",
                        fontFamily: buttonFont?.fontFamily,
                        fontSize: buttonFont?.fontSize,
                        fontWeight: buttonFont?.fontWeight,
                        fontStyle: buttonFont?.fontStyle,
                        lineHeight: buttonFont?.lineHeight,
                        letterSpacing: buttonFont?.letterSpacing,
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.opacity = "0.9"
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1"
                    }}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {showSuccessText ? (
                            <motion.span
                                key="button-success"
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -15, opacity: 0 }}
                                transition={{ 
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {successMessage}
                            </motion.span>
                        ) : showSendingText ? (
                            <motion.span
                                key="button-sending"
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 0.6 }}
                                exit={{ y: -15, opacity: 0 }}
                                transition={{ 
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {sendingText}
                            </motion.span>
                        ) : (
                            <motion.span
                                key="button-normal"
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -15, opacity: 0 }}
                                transition={{ 
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: showIcon && icon ? "8px" : "0px",
                                    flexDirection: iconPosition === "left" ? "row-reverse" : "row",
                                }}
                            >
                                <span>{buttonText}</span>
                                {showIcon && icon && (
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {icon}
                                    </span>
                                )}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </form>
            <div style={{ 
                height: "24px", 
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                <AnimatePresence>
                    {showError && (
                        <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 400,
                                damping: 30
                            }}
                            style={{
                                color: errorTextColor,
                                whiteSpace: "nowrap",
                                fontFamily: errorFont?.fontFamily,
                                fontSize: errorFont?.fontSize,
                                fontWeight: errorFont?.fontWeight,
                                fontStyle: errorFont?.fontStyle,
                                lineHeight: errorFont?.lineHeight,
                                letterSpacing: errorFont?.letterSpacing,
                            }}
                        >
                            {errorMessage}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(EmailWaitlistForm, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "yourmail@example.com",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Notify me",
    },
    successMessage: {
        type: ControlType.String,
        title: "Success Message",
        defaultValue: "Thank you",
    },
    sendingText: {
        type: ControlType.String,
        title: "Sending Text",
        defaultValue: "Sending...",
    },
    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        description: "Enter the webhook endpoint URL to receive email submissions (e.g., Zapier, Make, or your custom API endpoint)",
        defaultValue: "",
        placeholder: "https://api.example.com/webhook",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#1d1b1a",
    },
    inputTextColor: {
        type: ControlType.Color,
        title: "Input Text",
        defaultValue: "#535250",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#f5f4f1",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#242424",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#1D1B1A",
    },
    errorBorderColor: {
        type: ControlType.Color,
        title: "Error Border Color",
        defaultValue: "#cc4444",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 9999,
        min: 0,
        max: 300,
        unit: "px",
    },
    buttonPadding: {
        type: ControlType.Number,
        title: "Button Padding",
        defaultValue: 29,
        min: 0,
        max: 100,
        unit: "px",
    },
    inputFont: {
        type: ControlType.Font,
        title: "Input Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    errorFont: {
        type: ControlType.Font,
        title: "Error Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: ({ showIcon }) => !showIcon,
    },
    icon: {
        type: ControlType.Slot,
        title: "Icon",
        hidden: ({ showIcon }) => !showIcon,
    },
    onSubmit: {
        type: ControlType.EventHandler,
        title: "On Submit",
    },
    errorTextColor: {
        type: ControlType.Color,
        title: "Error Text Color",
        defaultValue: "#cc4444",
    },
})

EmailWaitlistForm.displayName = "EmailWaitlistForm"