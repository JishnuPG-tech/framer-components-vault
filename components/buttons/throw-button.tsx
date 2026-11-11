import React, { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CustomButton(props) {
    const {
        text,
        font,
        fontSize,
        textColor,
        hoverTextColor,
        buttonBg,
        hoverButtonBg,
        iconBg,
        hoverIconBg,
        iconColor,
        hoverIconColor,
        gap,
        padding,
        link,
        radius,
        disabled,
        fullWidth,
        showIcon,
        reverseLayout,
        borderWidth,
        borderColor,
        hoverBorderColor,
        animDuration,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()

    // Disable hover effects while rendering thumbnails in Framer canvas/marketplace
    const hovered = isStatic ? false : isHovered

    // Extract font properties safely
    const fontFamily = font?.fontFamily || "Inter, sans-serif"
    const fontWeight = font?.fontWeight || "600"
    const fontStyle = font?.fontStyle || "normal"

    // Safe Link handling
    const href = typeof link === "string" ? link : link?.href || "#"
    const isExternal = typeof link === "object" && link?.target
    const target = isExternal ? "_blank" : "_self"
    const rel = isExternal ? "noopener noreferrer" : undefined

    // Dynamic sizing based on props
    const horizontalPadding = padding * 1.75
    const iconSize = Math.round(fontSize * 1.1)
    const circleSize = fontSize + padding * 2

    // Helper for active border color
    const activeBorderColor = hovered ? hoverBorderColor : borderColor

    return (
        <a
            href={disabled ? undefined : href}
            target={target}
            rel={rel}
            aria-label={text}
            aria-disabled={disabled}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => !disabled && setIsHovered(false)}
            onFocus={() => !disabled && setIsHovered(true)}
            onBlur={() => !disabled && setIsHovered(false)}
            style={{
                display: fullWidth ? "flex" : "inline-flex",
                flexDirection: reverseLayout ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: fullWidth ? "space-between" : "center",
                textDecoration: "none",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? "none" : "auto",
                outline: "none",
                width: fullWidth ? "100%" : "auto",
            }}
        >
            {/* Main Label Pill */}
            <div
                style={{
                    position: "relative",
                    borderRadius: `${radius}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexGrow: fullWidth ? 1 : 0,
                    padding: `${padding}px ${horizontalPadding}px`,
                    backgroundColor: buttonBg,
                    overflow: "hidden",
                    zIndex: 1,
                    border: `${borderWidth}px solid ${activeBorderColor}`,
                    transition: `border-color ${animDuration}s ease`,
                }}
            >
                {/* Top-Left Draw Fill Layer */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "300%",
                        height: "300%",
                        borderRadius: "50%",
                        backgroundColor: hoverButtonBg,
                        transformOrigin: "top left",
                        transform: hovered ? "scale(1)" : "scale(0)",
                        transition: `transform ${animDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />

                <span
                    style={{
                        color: hovered ? hoverTextColor : textColor,
                        fontSize: `${fontSize}px`,
                        fontFamily: fontFamily,
                        fontWeight: fontWeight,
                        fontStyle: fontStyle,
                        whiteSpace: "nowrap",
                        position: "relative",
                        zIndex: 1,
                        transition: `color ${animDuration}s ease`,
                    }}
                >
                    {text}
                </span>
            </div>

            {/* Circle Icon */}
            {showIcon && (
                <div
                    style={{
                        position: "relative",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: iconBg,
                        overflow: "hidden",
                        width: `${circleSize}px`,
                        height: `${circleSize}px`,
                        marginLeft: reverseLayout ? 0 : `${gap}px`,
                        marginRight: reverseLayout ? `${gap}px` : 0,
                        flexShrink: 0,
                        zIndex: 1,
                        border: `${borderWidth}px solid ${activeBorderColor}`,
                        transition: `border-color ${animDuration}s ease`,
                    }}
                >
                    {/* Top-Left Draw Fill Layer */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "300%",
                            height: "300%",
                            borderRadius: "50%",
                            backgroundColor: hoverIconBg,
                            transformOrigin: "top left",
                            transform: hovered ? "scale(1)" : "scale(0)",
                            transition: `transform ${animDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />

                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={hovered ? hoverIconColor : iconColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            position: "relative",
                            zIndex: 1,
                            transform: hovered
                                ? "rotate(-45deg)"
                                : "rotate(0deg)",
                            transition: `transform ${animDuration}s cubic-bezier(0.34, 1.56, 0.64, 1), stroke ${animDuration}s ease`,
                        }}
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>
            )}
        </a>
    )
}

CustomButton.displayName = "Custom Button"

CustomButton.defaultProps = {
    text: "Get Started",
    fontSize: 16,
    textColor: "#FFFFFF",
    hoverTextColor: "#2C3E02",
    buttonBg: "#62862A",
    hoverButtonBg: "#EEFA90",
    iconBg: "#62862A",
    hoverIconBg: "#EEFA90",
    iconColor: "#FFFFFF",
    hoverIconColor: "#2C3E02",
    gap: 8,
    padding: 14,
    radius: 999,
    disabled: false,
    fullWidth: false,
    showIcon: true,
    reverseLayout: false,
    borderWidth: 0,
    borderColor: "transparent",
    hoverBorderColor: "transparent",
    animDuration: 0.4,
}

addPropertyControls(CustomButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get Started",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: "600",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 48,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 14,
        min: 6,
        max: 32,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
    },
    // Layout Controls
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
    },
    reverseLayout: {
        type: ControlType.Boolean,
        title: "Flip Layout",
        defaultValue: false,
        hidden: (props) => !props.showIcon,
    },
    // Style & Color Controls
    buttonBg: {
        type: ControlType.Color,
        title: "Button Bg",
        defaultValue: "#62862A",
    },
    hoverButtonBg: {
        type: ControlType.Color,
        title: "Hover Bg",
        defaultValue: "#EEFA90",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#2C3E02",
    },
    iconBg: {
        type: ControlType.Color,
        title: "Icon Bg",
        defaultValue: "#62862A",
        hidden: (props) => !props.showIcon,
    },
    hoverIconBg: {
        type: ControlType.Color,
        title: "Hover Icon Bg",
        defaultValue: "#EEFA90",
        hidden: (props) => !props.showIcon,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showIcon,
    },
    hoverIconColor: {
        type: ControlType.Color,
        title: "Hover Icon",
        defaultValue: "#2C3E02",
        hidden: (props) => !props.showIcon,
    },
    // Border Controls
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 10,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "transparent",
        hidden: (props) => props.borderWidth === 0,
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "transparent",
        hidden: (props) => props.borderWidth === 0,
    },
    // Animation Controls
    animDuration: {
        type: ControlType.Number,
        title: "Anim Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
