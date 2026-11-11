import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FormStatus = "idle" | "loading" | "success" | "error"

interface HumanicSubscriberFormProps {
    webhookUrl: string

    placeholder: string
    buttonText: string
    loadingText: string

    successMessage: string
    errorMessage: string
    invalidEmailMessage: string

    inputBackground: string
    inputTextColor: string
    inputPlaceholderColor: string
    inputBorderColor: string
    inputBorderWidth: number
    inputRadius: number

    buttonBackground: string
    buttonTextColor: string
    buttonRadius: number

    fontSize: number
    gap: number
    padding: number

    direction: "vertical" | "horizontal"
}

export default function HumanicSubscriberForm(
    props: HumanicSubscriberFormProps
) {
    const {
        webhookUrl,

        placeholder,
        buttonText,
        loadingText,

        successMessage,
        errorMessage,
        invalidEmailMessage,

        inputBackground,
        inputTextColor,
        inputPlaceholderColor,
        inputBorderColor,
        inputBorderWidth,
        inputRadius,

        buttonBackground,
        buttonTextColor,
        buttonRadius,

        fontSize,
        gap,
        padding,

        direction,
    } = props

    const [email, setEmail] = React.useState("")
    const [status, setStatus] = React.useState<FormStatus>("idle")

    const isLoading = status === "loading"

    /**
     * Validate email
     */
    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    }

    /**
     * Validate Humanic webhook URL
     */
    function isValidWebhookUrl(value: string) {
        try {
            const url = new URL(value)

            return (
                url.protocol === "https:" &&
                url.hostname === "prod.humanic.ai" &&
                url.pathname.startsWith("/api/webhooks/integrations/")
            )
        } catch {
            return false
        }
    }

    /**
     * Submit subscriber
     */
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (isLoading) return

        const normalizedEmail = email.trim()

        const normalizedWebhookUrl = webhookUrl.trim()

        /**
         * Validate email
         */
        if (!isValidEmail(normalizedEmail)) {
            setStatus("error")
            return
        }

        /**
         * Validate webhook
         */
        if (!isValidWebhookUrl(normalizedWebhookUrl)) {
            console.error("[Humanic] Invalid webhook URL.")

            setStatus("error")
            return
        }

        setStatus("loading")

        try {
            /**
             * Humanic webhook payload
             *
             * Current V1:
             *
             * {
             *   "email": "email@example.com"
             * }
             *
             * The API supports additional fields
             * such as name and data_field_* in the
             * future.
             */
            const payload = {
                email: normalizedEmail,
            }

            const response = await fetch(normalizedWebhookUrl, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(`Humanic webhook returned ${response.status}`)
            }

            /**
             * Success
             */
            setEmail("")
            setStatus("success")
        } catch (error) {
            console.error("[Humanic] Webhook submission failed:", error)

            setStatus("error")
        }
    }

    /**
     * Success state
     */
    if (status === "success") {
        return (
            <div
                style={{
                    width: "100%",
                    minHeight: 48,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    padding,

                    boxSizing: "border-box",

                    fontSize,

                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <span
                    style={{
                        color: "#16803C",
                        textAlign: "center",
                    }}
                >
                    {successMessage}
                </span>
            </div>
        )
    }

    const showInvalidEmail = status === "error" && !isValidEmail(email)

    const showGeneralError = status === "error" && isValidEmail(email)

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                width: "100%",

                display: "flex",

                flexDirection: direction === "horizontal" ? "row" : "column",

                gap,

                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <input
                    type="email"
                    value={email}
                    disabled={isLoading}
                    placeholder={placeholder}
                    onChange={(event) => {
                        setEmail(event.target.value)

                        if (status === "error") {
                            setStatus("idle")
                        }
                    }}
                    aria-label="Email address"
                    autoComplete="email"
                    style={{
                        width: "100%",
                        height: 48,

                        boxSizing: "border-box",

                        padding: `0 ${padding}px`,

                        background: inputBackground,

                        color: inputTextColor,

                        border: `${inputBorderWidth}px solid ${inputBorderColor}`,

                        borderRadius: inputRadius,

                        outline: "none",

                        fontSize,

                        fontFamily:
                            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

                        opacity: isLoading ? 0.6 : 1,

                        transition:
                            "border-color 150ms ease, opacity 150ms ease",
                    }}
                />

                {showInvalidEmail && (
                    <div
                        style={{
                            marginTop: 6,

                            fontSize: Math.max(12, fontSize - 2),

                            color: "#D92D20",

                            lineHeight: 1.4,
                        }}
                    >
                        {invalidEmailMessage}
                    </div>
                )}

                {showGeneralError && (
                    <div
                        style={{
                            marginTop: 6,

                            fontSize: Math.max(12, fontSize - 2),

                            color: "#D92D20",

                            lineHeight: 1.4,
                        }}
                    >
                        {errorMessage}
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                style={{
                    height: 48,

                    padding: `0 ${padding * 1.5}px`,

                    border: "none",

                    borderRadius: buttonRadius,

                    background: buttonBackground,

                    color: buttonTextColor,

                    fontSize,

                    fontWeight: 600,

                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

                    cursor: isLoading ? "wait" : "pointer",

                    whiteSpace: "nowrap",

                    opacity: isLoading ? 0.7 : 1,

                    transition: "opacity 150ms ease",
                }}
            >
                {isLoading ? loadingText : buttonText}
            </button>

            <style>
                {`
                    input::placeholder {
                        color: ${inputPlaceholderColor};
                        opacity: 1;
                    }

                    input:focus {
                        border-color: ${buttonBackground} !important;
                    }

                    button:hover:not(:disabled) {
                        opacity: 0.9;
                    }
                `}
            </style>
        </form>
    )
}

HumanicSubscriberForm.defaultProps = {
    webhookUrl: "",

    placeholder: "Enter your email",

    buttonText: "Subscribe",

    loadingText: "Subscribing...",

    successMessage: "Thanks for subscribing!",

    errorMessage: "Something went wrong. Please try again.",

    invalidEmailMessage: "Please enter a valid email address.",

    inputBackground: "#FFFFFF",

    inputTextColor: "#111827",

    inputPlaceholderColor: "#6B7280",

    inputBorderColor: "#D1D5DB",

    inputBorderWidth: 1,

    inputRadius: 8,

    buttonBackground: "#0053FA",

    buttonTextColor: "#FFFFFF",

    buttonRadius: 8,

    fontSize: 16,

    gap: 8,

    padding: 14,

    direction: "vertical",
}

addPropertyControls(HumanicSubscriberForm, {
    webhookUrl: {
        type: ControlType.String,

        title: "Webhook URL",

        placeholder: "https://prod.humanic.ai/api/webhooks/integrations/...",

        displayTextArea: false,
    },

    direction: {
        type: ControlType.Enum,

        title: "Layout",

        options: ["vertical", "horizontal"],

        optionTitles: ["Vertical", "Horizontal"],

        defaultValue: "vertical",

        displaySegmentedControl: true,
    },

    placeholder: {
        type: ControlType.String,

        title: "Placeholder",

        defaultValue: "Enter your email",
    },

    buttonText: {
        type: ControlType.String,

        title: "Button",

        defaultValue: "Subscribe",
    },

    loadingText: {
        type: ControlType.String,

        title: "Loading",

        defaultValue: "Subscribing...",
    },

    successMessage: {
        type: ControlType.String,

        title: "Success",

        defaultValue: "Thanks for subscribing!",
    },

    errorMessage: {
        type: ControlType.String,

        title: "Error",

        defaultValue: "Something went wrong. Please try again.",
    },

    invalidEmailMessage: {
        type: ControlType.String,

        title: "Invalid Email",

        defaultValue: "Please enter a valid email address.",
    },

    inputBackground: {
        type: ControlType.Color,

        title: "Input BG",

        defaultValue: "#FFFFFF",
    },

    inputTextColor: {
        type: ControlType.Color,

        title: "Input Text",

        defaultValue: "#111827",
    },

    inputPlaceholderColor: {
        type: ControlType.Color,

        title: "Placeholder",

        defaultValue: "#6B7280",
    },

    inputBorderColor: {
        type: ControlType.Color,

        title: "Input Border",

        defaultValue: "#D1D5DB",
    },

    inputBorderWidth: {
        type: ControlType.Number,

        title: "Border",

        defaultValue: 1,

        min: 0,

        max: 5,

        step: 1,

        unit: "px",
    },

    inputRadius: {
        type: ControlType.Number,

        title: "Input Radius",

        defaultValue: 8,

        min: 0,

        max: 50,

        step: 1,

        unit: "px",
    },

    buttonBackground: {
        type: ControlType.Color,

        title: "Button BG",

        defaultValue: "#0053FA",
    },

    buttonTextColor: {
        type: ControlType.Color,

        title: "Button Text",

        defaultValue: "#FFFFFF",
    },

    buttonRadius: {
        type: ControlType.Number,

        title: "Button Radius",

        defaultValue: 8,

        min: 0,

        max: 50,

        step: 1,

        unit: "px",
    },

    fontSize: {
        type: ControlType.Number,

        title: "Font Size",

        defaultValue: 16,

        min: 10,

        max: 32,

        step: 1,

        unit: "px",
    },

    gap: {
        type: ControlType.Number,

        title: "Gap",

        defaultValue: 8,

        min: 0,

        max: 50,

        step: 1,

        unit: "px",
    },

    padding: {
        type: ControlType.Number,

        title: "Padding",

        defaultValue: 14,

        min: 4,

        max: 40,

        step: 1,

        unit: "px",
    },
})
