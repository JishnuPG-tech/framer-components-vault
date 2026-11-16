// Chat on Telegram component with customizable message and username
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

interface TelegramChatProps {
    username: string
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
export default function TelegramChat(props: TelegramChatProps) {
    const {
        username,
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

    const [screenSize, setScreenSize] = useState<
        "mobile" | "tablet" | "desktop"
    >("desktop")

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
            const cleanUsername = username.replace(/[@]/g, "")
            const telegramUrl = `https://t.me/${cleanUsername}`
            window.open(telegramUrl, "_blank")
        }
    }

    // Size configurations
    const sizeConfig = {
        small: {
            padding: "8px 16px",
            iconSize: 16,
            gap: "6px",
            fontSize: "14px",
        },
        medium: {
            padding: "12px 20px",
            iconSize: 20,
            gap: "8px",
            fontSize: "16px",
        },
        large: {
            padding: "16px 24px",
            iconSize: 24,
            gap: "10px",
            fontSize: "18px",
        },
        "x-large": {
            padding: "20px 32px",
            iconSize: 28,
            gap: "12px",
            fontSize: "20px",
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
                ...(isFixedWidth
                    ? { ...props?.style }
                    : { minWidth: "max-content" }),
                backgroundColor,
                color: textColor,
                borderRadius,
                border: "none",
                padding: iconOnly ? `${parseInt(currentSize.padding.split(' ')[0])}px` : currentSize.padding,
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
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
            )}
            {!iconOnly && <span>{buttonText}</span>}
        </button>
    )
}

addPropertyControls(TelegramChat, {
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Chat on Telegram",
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
    username: {
        type: ControlType.String,
        title: "Username",
        defaultValue: "username",
        placeholder: "username or @username",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Telegram Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ iconOnly }) => iconOnly,
    },
    iconOnly: {
        type: ControlType.Boolean,
        title: "Icon Only",
        defaultValue: false,
        enabledTitle: "Icon Only",
        disabledTitle: "Text + Icon",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#0088CC",
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