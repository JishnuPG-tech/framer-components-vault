// Cookie Settings popup component with overlay, centered card, and action buttons
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

import type { CSSProperties } from "react"

interface CookieSettingsProps {
    title: string
    bodyText: string
    linkText: string
    linkUrl: string
    rejectLabel: string
    customizeLabel: string
    acceptLabel: string
    onAccept?: () => void
    onReject?: () => void
    onCustomize?: () => void
    backgroundColor: string
    borderColor: string
    titleColor: string
    bodyColor: string
    buttonGrayBg: string
    buttonDarkBg: string
    buttonDarkText: string
    overlayColor: string
    titleFont: any
    bodyFont: any
    buttonFont: any
    style?: CSSProperties
}

/**
 * Cookie Settings Popup
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 340
 */
export default function CookieSettings(props: CookieSettingsProps) {
    const {
        title,
        bodyText,
        linkText,
        linkUrl,
        rejectLabel,
        customizeLabel,
        acceptLabel,
        onAccept,
        onReject,
        onCustomize,
        backgroundColor,
        borderColor,
        titleColor,
        bodyColor,
        buttonGrayBg,
        buttonDarkBg,
        buttonDarkText,
        overlayColor,
        titleFont,
        bodyFont,
        buttonFont,
    } = props

    const handleAccept = () => {
        if (onAccept) onAccept()
    }

    const handleReject = () => {
        if (onReject) onReject()
    }

    const handleCustomize = () => {
        if (onCustomize) onCustomize()
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
        >
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: overlayColor,
                }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                    position: "relative",
                    width: 360,
                    backgroundColor: backgroundColor,
                    borderRadius: 16,
                    border: `1px solid ${borderColor}`,
                    padding: 32,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                }}
            >
                {/* Title */}
                <h2
                    style={{
                        margin: 0,
                        color: titleColor,
                        ...titleFont,
                    }}
                >
                    {title}
                </h2>

                {/* Body Text with Link */}
                <p
                    style={{
                        margin: 0,
                        color: bodyColor,
                        ...bodyFont,
                    }}
                >
                    {bodyText.split(linkText)[0]}
                    <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: titleColor,
                            textDecoration: "underline",
                            cursor: "pointer",
                        }}
                    >
                        {linkText}
                    </a>
                    {bodyText.split(linkText)[1]}
                </p>

                {/* Buttons */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginTop: 4,
                    }}
                >
                    {/* Reject Button */}
                    <motion.button
                        whileHover={{ backgroundColor: "#E0DDD5" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReject}
                        style={{
                            width: "100%",
                            height: 48,
                            backgroundColor: buttonGrayBg,
                            color: titleColor,
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            ...buttonFont,
                        }}
                    >
                        {rejectLabel}
                    </motion.button>

                    {/* Customize Button */}
                    <motion.button
                        whileHover={{ backgroundColor: "#E0DDD5" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCustomize}
                        style={{
                            width: "100%",
                            height: 48,
                            backgroundColor: buttonGrayBg,
                            color: titleColor,
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            ...buttonFont,
                        }}
                    >
                        {customizeLabel}
                    </motion.button>

                    {/* Accept Button */}
                    <motion.button
                        whileHover={{ backgroundColor: "#1A2B3D" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAccept}
                        style={{
                            width: "100%",
                            height: 48,
                            backgroundColor: buttonDarkBg,
                            color: buttonDarkText,
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            ...buttonFont,
                        }}
                    >
                        {acceptLabel}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(CookieSettings, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Cookie Settings",
    },
    bodyText: {
        type: ControlType.String,
        title: "Body Text",
        displayTextArea: true,
        defaultValue:
            "We use cookies to enhance your experience, analyze site traffic and deliver personalized content. Read our Cookie Policy.",
    },
    linkText: {
        type: ControlType.String,
        title: "Link Text",
        defaultValue: "Cookie Policy",
    },
    linkUrl: {
        type: ControlType.String,
        title: "Link URL",
        defaultValue: "#",
    },
    rejectLabel: {
        type: ControlType.String,
        title: "Reject Label",
        defaultValue: "Reject all",
    },
    customizeLabel: {
        type: ControlType.String,
        title: "Customize Label",
        defaultValue: "Customize",
    },
    acceptLabel: {
        type: ControlType.String,
        title: "Accept Label",
        defaultValue: "Accept all",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F7F5F0",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E8E4DC",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#0D1B2A",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#4A5568",
    },
    buttonGrayBg: {
        type: ControlType.Color,
        title: "Gray Button BG",
        defaultValue: "#EDEBE6",
    },
    buttonDarkBg: {
        type: ControlType.Color,
        title: "Dark Button BG",
        defaultValue: "#0D1B2A",
    },
    buttonDarkText: {
        type: ControlType.Color,
        title: "Dark Button Text",
        defaultValue: "#FFFFFF",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(13, 27, 42, 0.6)",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.6em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    onAccept: {
        type: ControlType.EventHandler,
    },
    onReject: {
        type: ControlType.EventHandler,
    },
    onCustomize: {
        type: ControlType.EventHandler,
    },
})
