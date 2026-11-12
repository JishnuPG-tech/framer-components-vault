// Smart OS Download Button - Detects user's OS and redirects to appropriate download link
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SmartOSDownloadButtonProps {
    windowsLink: string
    macosLink: string
    linuxLink: string
    buttonText: string
    windowsText: string
    macosText: string
    linuxText: string
    showOSInText: boolean
    backgroundColor: string
    textColor: string
    hoverBackgroundColor: string
    hoverTextColor: string
    borderRadius: number
    padding: number
    font: any
    showIcon: boolean
    iconColor: string
    style?: CSSProperties
}

/**
 * Smart OS Download Button - Detects user's OS and redirects to appropriate download link
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SmartOSDownloadButton(
    props: SmartOSDownloadButtonProps
) {
    const {
        windowsLink = "https://example.com/windows-download",
        macosLink = "https://example.com/macos-download",
        linuxLink = "https://example.com/linux-download",
        buttonText = "Download",
        windowsText = "Download for Windows",
        macosText = "Download for macOS",
        linuxText = "Download for Linux",
        showOSInText = true,
        backgroundColor = "#1f2937",
        textColor = "#ffffff",
        hoverBackgroundColor = "#374151",
        hoverTextColor = "#ffffff",
        borderRadius = 32,
        padding = 16,
        font,
        showIcon = true,
        iconColor = "#ffffff",
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [detectedOS, setDetectedOS] = useState<
        "windows" | "macos" | "linux" | "unknown"
    >("unknown")

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userAgent = window.navigator.userAgent.toLowerCase()

            if (userAgent.includes("win")) {
                startTransition(() => setDetectedOS("windows"))
            } else if (userAgent.includes("mac")) {
                startTransition(() => setDetectedOS("macos"))
            } else if (userAgent.includes("linux")) {
                startTransition(() => setDetectedOS("linux"))
            }
        }
    }, [])

    const handleClick = () => {
        if (typeof window === "undefined") return

        let targetLink = windowsLink // default fallback

        switch (detectedOS) {
            case "windows":
                targetLink = windowsLink
                break
            case "macos":
                targetLink = macosLink
                break
            case "linux":
                targetLink = linuxLink
                break
            default:
                targetLink = windowsLink
        }

        if (targetLink) {
            window.open(targetLink, "_blank", "noopener,noreferrer")
        }
    }

    const getOSIcon = () => {
        switch (detectedOS) {
            case "windows":
                return (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={iconColor}
                    >
                        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.851" />
                    </svg>
                )
            case "macos":
                return (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={iconColor}
                    >
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.638-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                )
            case "linux":
                return (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={iconColor}
                    >
                        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 01-.088.069c-.104.105-.259.158-.436.158-.18 0-.348-.053-.456-.158-.107-.104-.121-.252-.121-.407 0-.199.042-.42.121-.647.079-.235.213-.406.334-.498.146-.106.318-.174.51-.174z" />
                    </svg>
                )
            default:
                return (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={iconColor}
                    >
                        <path d="M12 1l3.09 6.26L22 9l-6.91 1.01L12 16l-3.09-5.99L2 9l6.91-1.74L12 1z" />
                    </svg>
                )
        }
    }

    const getDisplayText = () => {
        if (!showOSInText) {
            return buttonText
        }

        switch (detectedOS) {
            case "windows":
                return windowsText
            case "macos":
                return macosText
            case "linux":
                return linuxText
            default:
                return buttonText
        }
    }

    const currentBackgroundColor = isHovered
        ? hoverBackgroundColor
        : backgroundColor
    const currentTextColor = isHovered ? hoverTextColor : textColor

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
            style={{
                ...props.style,
                backgroundColor: currentBackgroundColor,
                color: currentTextColor,
                border: "none",
                borderRadius: `${borderRadius}px`,
                padding: `${padding}px ${padding * 1.5}px`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: showIcon ? "8px" : "0",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isHovered ? "translateY(-1px)" : "translateY(0)",
                boxShadow: isHovered
                    ? "0 4px 12px rgba(0, 0, 0, 0.15)"
                    : "0 2px 4px rgba(0, 0, 0, 0.1)",
                outline: "none",
                userSelect: "none",
                ...font,
            }}
            aria-label={`Download for ${detectedOS}`}
        >
            {showIcon && getOSIcon()}
            <span>{getDisplayText()}</span>
        </button>
    )
}

addPropertyControls(SmartOSDownloadButton, {
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Download",
    },
    windowsText: {
        type: ControlType.String,
        title: "Windows Text",
        defaultValue: "Download for Windows",
        placeholder: "Enter custom Windows text",
        hidden: ({ showOSInText }) => !showOSInText,
    },
    macosText: {
        type: ControlType.String,
        title: "macOS Text",
        defaultValue: "Download for macOS",
        placeholder: "Enter custom macOS text",
        hidden: ({ showOSInText }) => !showOSInText,
    },
    linuxText: {
        type: ControlType.String,
        title: "Linux Text",
        defaultValue: "Download for Linux",
        placeholder: "Enter custom Linux text",
        hidden: ({ showOSInText }) => !showOSInText,
    },
    showOSInText: {
        type: ControlType.Boolean,
        title: "Show OS in Text",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Custom",
    },
    windowsLink: {
        type: ControlType.String,
        title: "Windows Link",
        defaultValue: "https://example.com/windows-download",
        placeholder: "Enter Windows download URL",
    },
    macosLink: {
        type: ControlType.String,
        title: "macOS Link",
        defaultValue: "https://example.com/macos-download",
        placeholder: "Enter macOS download URL",
    },
    linuxLink: {
        type: ControlType.String,
        title: "Linux Link",
        defaultValue: "https://example.com/linux-download",
        placeholder: "Enter Linux download URL",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#1f2937",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "#374151",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#ffffff",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show OS Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#ffffff",
        hidden: ({ showIcon }) => !showIcon,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 32,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
