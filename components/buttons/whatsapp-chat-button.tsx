// Chat on WhatsApp component with customizable message and phone number
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useState, useEffect } from "react"

interface WhatsAppChatProps {
    message: string
    phoneNumber: string
    buttonText: string
    backgroundColor: string
    textColor: string
    borderRadius: number
    showIcon: boolean
    iconOnly: boolean
    size: "small" | "medium" | "large" | "x-large"
    font: any
    responsive: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function WhatsAppChat(props: WhatsAppChatProps) {
    const {
        message,
        phoneNumber,
        buttonText,
        backgroundColor,
        textColor,
        borderRadius,
        showIcon,
        iconOnly,
        size,
        font,
        responsive,
    } = props

    const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop")

    useEffect(() => {
        if (!responsive || typeof window === "undefined") return

        const updateScreenSize = () => {
            const width = window.innerWidth
            if (width < 768) {
                setScreenSize("mobile")
            } else if (width < 1024) {
                setScreenSize("tablet")
            } else {
                setScreenSize("desktop")
            }
        }

        updateScreenSize()
        window.addEventListener("resize", updateScreenSize)
        return () => window.removeEventListener("resize", updateScreenSize)
    }, [responsive])

    const handleClick = () => {
        if (typeof window !== "undefined") {
            const encodedMessage = encodeURIComponent(message)
            const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, "")
            const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`
            window.open(whatsappUrl, "_blank")
        }
    }

    // Size configurations
    const sizeConfig = {
        small: {
            padding: "8px 16px",
            iconSize: 16,
            gap: "6px",
            fontSize: "14px",
            iconOnlyPadding: "8px",
        },
        medium: {
            padding: "12px 20px",
            iconSize: 20,
            gap: "8px",
            fontSize: "16px",
            iconOnlyPadding: "12px",
        },
        large: {
            padding: "16px 24px",
            iconSize: 24,
            gap: "10px",
            fontSize: "18px",
            iconOnlyPadding: "16px",
        },
        "x-large": {
            padding: "20px 32px",
            iconSize: 28,
            gap: "12px",
            fontSize: "20px",
            iconOnlyPadding: "20px",
        },
    }

    // Responsive size mapping
    const getResponsiveSize = () => {
        if (!responsive) return size

        const responsiveMapping = {
            mobile: {
                small: "small",
                medium: "small",
                large: "medium",
                "x-large": "medium",
            },
            tablet: {
                small: "small",
                medium: "medium",
                large: "medium",
                "x-large": "large",
            },
            desktop: {
                small: "small",
                medium: "medium",
                large: "large",
                "x-large": "x-large",
            },
        }

        return responsiveMapping[screenSize][size] as keyof typeof sizeConfig
    }

    const currentSize = sizeConfig[getResponsiveSize()]
    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <button
            onClick={handleClick}
            style={{
                ...props.style,
                ...(isFixedWidth ? { ...props?.style } : { minWidth: "max-content" }),
                backgroundColor,
                color: textColor,
                borderRadius,
                border: "none",
                padding: iconOnly ? currentSize.iconOnlyPadding : currentSize.padding,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: iconOnly ? "center" : "flex-start",
                gap: showIcon && !iconOnly ? currentSize.gap : "0px",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                ...font,
                fontSize: currentSize.fontSize,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1"
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(0px)"
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
            }}
        >
            {(showIcon || iconOnly) && (
                <svg
                    width={currentSize.iconSize}
                    height={currentSize.iconSize}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ flexShrink: 0 }}
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
            )}
            {!iconOnly && <span>{buttonText}</span>}
        </button>
    )
}

addPropertyControls(WhatsAppChat, {
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Chat on WhatsApp",
        hidden: ({ iconOnly }) => iconOnly,
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["small", "medium", "large", "x-large"],
        optionTitles: ["Small", "Medium", "Large", "X-Large"],
        defaultValue: "medium",
        displaySegmentedControl: true,
    },
    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    phoneNumber: {
        type: ControlType.String,
        title: "Phone Number",
        defaultValue: "+1234567890",
        placeholder: "+1234567890",
    },
    message: {
        type: ControlType.String,
        title: "Pre-filled Message",
        defaultValue: "Hello! I'm interested in your services.",
        displayTextArea: true,
    },
    iconOnly: {
        type: ControlType.Boolean,
        title: "Icon Only",
        defaultValue: false,
        enabledTitle: "Icon Only",
        disabledTitle: "With Text",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show WhatsApp Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ iconOnly }) => iconOnly,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#25D366",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "basic",
        defaultFontType: "sans-serif",
        hidden: ({ iconOnly }) => iconOnly,
    },
})