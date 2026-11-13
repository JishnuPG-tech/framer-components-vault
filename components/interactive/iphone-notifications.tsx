// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"

/**
 * iPhone Notification Component
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function iPhoneNotification(props) {
    const {
        appName,
        message,
        time,
        iconColor,
        backgroundColor,
        showIcon,
        iconSize,
        bubbleSize,
        size,
        customLogo,
        useCustomLogo,
        enableHoverAnimation,
        actionText,
        actionButtonColor,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    // Scale factor based on notification size (100 is baseline)
    const scale = size / 100

    // Calculate proportional dimensions
    const iconBorderRadius = iconSize * 0.25
    const bubbleRadius = (bubbleSize / 100) * (iconSize * 0.5)

    // Default gradient for Messages
    const defaultIconGradient =
        "linear-gradient(135deg, #00D856 0%, #00B84A 100%)"

    // Scaled dimensions
    const scaledGap = 12 * scale
    const scaledPadding = `${14 * scale}px ${16 * scale}px`
    const scaledBorderRadius = 20 * scale
    const scaledMinWidth = 340 * scale
    const scaledMaxWidth = 380 * scale

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                overflow: "hidden",
                borderRadius: `${scaledBorderRadius}px`,
            }}
            onMouseEnter={() => enableHoverAnimation && setIsHovered(true)}
            onMouseLeave={() => enableHoverAnimation && setIsHovered(false)}
        >
            {/* Action Button (revealed on hover) */}
            {enableHoverAnimation && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${100 * scale}px`,
                        backgroundColor: actionButtonColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 0,
                        borderRadius: `${scaledBorderRadius}px`,
                    }}
                >
                    <div
                        style={{
                            color: "#000000",
                            fontSize: `${14 * scale}px`,
                            fontWeight: 400,
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {actionText}
                    </div>
                </div>
            )}

            {/* Notification Card */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: `${scaledGap}px`,
                    padding: scaledPadding,
                    backgroundColor: backgroundColor,
                    borderRadius: `${scaledBorderRadius}px`,
                    boxShadow: `0 ${4 * scale}px ${16 * scale}px rgba(0, 0, 0, 0.12)`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    minWidth: `${scaledMinWidth}px`,
                    maxWidth: `${scaledMaxWidth}px`,
                    position: "relative",
                    zIndex: 1,
                    transform: isHovered
                        ? `translateX(-${80 * scale}px)`
                        : "translateX(0)",
                    transition:
                        "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
            >
                {/* App Icon */}
                {showIcon && (
                    <div
                        style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                            borderRadius: `${iconBorderRadius}px`,
                            background:
                                useCustomLogo && customLogo
                                    ? "transparent"
                                    : iconColor || settings.iconGradient,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            boxShadow:
                                useCustomLogo && customLogo
                                    ? "none"
                                    : `inset 0 ${1 * scale}px 0 rgba(255, 255, 255, 0.3), 0 ${1 * scale}px ${2 * scale}px rgba(0, 0, 0, 0.2)`,
                        }}
                    >
                        {/* Show custom logo if uploaded and enabled */}
                        {useCustomLogo && customLogo ? (
                            <img
                                src={customLogo}
                                alt="Custom logo"
                                style={{
                                    width: `${iconSize}px`,
                                    height: `${iconSize}px`,
                                    objectFit: "cover",
                                    borderRadius: `${iconBorderRadius}px`,
                                }}
                            />
                        ) : (
                            <svg
                                width={iconSize * 0.75}
                                height={iconSize * 0.75}
                                viewBox="0 0 30 30"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d={`M15 4C8.5 4 3 8.5 3 15C3 17.5 4 19.8 5.5 21.5L3.5 26.5L8.5 24.5C10.2 25.5 12.5 26 15 26C21.5 26 27 21.5 27 15C27 8.5 21.5 4 15 4Z`}
                                    fill="white"
                                    transform={`scale(${bubbleSize / 100})`}
                                    style={{
                                        transformOrigin: "center",
                                    }}
                                />
                            </svg>
                        )}
                    </div>
                )}

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: `${2 * scale}px`,
                    }}
                >
                    {/* App Name */}
                    <div
                        style={{
                            fontSize: `${14 * scale}px`,
                            fontWeight: 600,
                            color: "#000000",
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {appName}
                    </div>

                    {/* Message */}
                    <div
                        style={{
                            fontSize: `${14 * scale}px`,
                            fontWeight: 400,
                            color: "#000000",
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                            lineHeight: "1.3",
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {message}
                    </div>
                </div>

                {/* Time */}
                <div
                    style={{
                        fontSize: `${13 * scale}px`,
                        fontWeight: 400,
                        color: "#8E8E93",
                        fontFamily:
                            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {time}
                </div>
            </div>
        </div>
    )
}

// Property controls for Framer
addPropertyControls(iPhoneNotification, {
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 100,
        min: 50,
        max: 200,
        step: 5,
        displayStepper: true,
        description: "Scale the entire notification (100 = default)",
    },
    appName: {
        type: ControlType.String,
        title: "App Name",
        defaultValue: "Messages",
    },
    message: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "Remix and make it shine! ☀️",
        displayTextArea: true,
    },
    time: {
        type: ControlType.String,
        title: "Time",
        defaultValue: "now",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 40,
        min: 24,
        max: 64,
        step: 2,
        displayStepper: true,
        hidden: (props) => !props.showIcon,
    },
    useCustomLogo: {
        type: ControlType.Boolean,
        title: "Use Custom Logo",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Default",
        hidden: (props) => !props.showIcon,
    },
    customLogo: {
        type: ControlType.Image,
        title: "Upload Logo",
        hidden: (props) => !props.showIcon || !props.useCustomLogo,
    },
    bubbleSize: {
        type: ControlType.Number,
        title: "Bubble Size",
        defaultValue: 100,
        min: 50,
        max: 150,
        step: 5,
        displayStepper: true,
        description: "Scale the speech bubble (100 = default)",
        hidden: (props) => !props.showIcon || props.useCustomLogo,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#00D856",
        hidden: (props) => !props.showIcon || props.useCustomLogo,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(247, 247, 247, 0.92)",
    },
    enableHoverAnimation: {
        type: ControlType.Boolean,
        title: "Swipe Animation",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    actionText: {
        type: ControlType.String,
        title: "Action Text",
        defaultValue: "Open",
        hidden: (props) => !props.enableHoverAnimation,
    },
    actionButtonColor: {
        type: ControlType.Color,
        title: "Action Color",
        defaultValue: "rgba(247, 247, 247, 0.92)",
        hidden: (props) => !props.enableHoverAnimation,
    },
})
