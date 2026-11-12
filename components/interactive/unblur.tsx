// Click to unblur image with eye icon
import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ClickToUnblurImageProps {
    image: { src: string; alt: string }
    showIcon: boolean
    icon: { src: string; alt: string }
    iconColor: string
    iconSize: number
    buttonBackground: string
    buttonSize: number
    blurAmount: number
    animationDuration: number
    borderRadius: number
    style?: CSSProperties
}

/**
 * Click to Unblur Image
 *
 * An image component that starts blurred and can be unblurred by clicking on it.
 * Features an eye icon to indicate viewing action.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ClickToUnblurImage(props: ClickToUnblurImageProps) {
    const {
        image = {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='white'/%3E%3C/svg%3E",
            alt: "Click to unblur image",
        },
        showIcon = true,
        icon = {
            src: "",
            alt: "Icon",
        },
        iconColor = "#1F2937",
        iconSize = 24,
        buttonBackground = "rgba(255, 255, 255, 0.9)",
        buttonSize = 64,
        blurAmount = 20,
        animationDuration = 500,
        borderRadius = 0,
    } = props

    const [isBlurred, setIsBlurred] = useState(true)

    const handleClick = () => {
        if (isBlurred) {
            startTransition(() => setIsBlurred(false))
        }
    }

    const renderIcon = () => {
        // If custom icon is uploaded, use it
        if (icon.src) {
            return (
                <img
                    src={icon.src}
                    alt={icon.alt || "Icon"}
                    style={{
                        width: iconSize,
                        height: iconSize,
                        objectFit: "contain",
                    }}
                />
            )
        }

        // Otherwise use default eye icon
        return (
            <svg
                width={iconSize}
                height={iconSize}
                fill="none"
                stroke={iconColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: borderRadius,
                ...props.style,
            }}
        >
            <img
                src={image.src}
                alt={image.alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: isBlurred ? `blur(${blurAmount}px)` : "blur(0px)",
                    transition: `filter ${animationDuration}ms ease-in-out`,
                }}
            />

            {isBlurred && showIcon && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleClick()
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: buttonBackground,
                        borderRadius: "50%",
                        width: buttonSize,
                        height: buttonSize,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 200ms ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                            "translate(-50%, -50%) scale(1.1)"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                            "translate(-50%, -50%) scale(1)"
                    }}
                    aria-label="Click to unblur image"
                >
                    {renderIcon()}
                </button>
            )}
        </div>
    )
}

addPropertyControls(ClickToUnblurImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    icon: {
        type: ControlType.ResponsiveImage,
        title: "Icon",
        description:
            "Upload a custom SVG icon (optional - defaults to eye icon)",
        hidden: ({ showIcon }) => !showIcon,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        description: "Only applies to default eye icon",
        defaultValue: "#1F2937",
        hidden: ({ showIcon, icon }) => !showIcon || (icon && icon.src),
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 24,
        min: 16,
        max: 48,
        step: 2,
        unit: "px",
        hidden: ({ showIcon }) => !showIcon,
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button Background",
        defaultValue: "rgba(255, 255, 255, 0.9)",
        hidden: ({ showIcon }) => !showIcon,
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 64,
        min: 40,
        max: 120,
        step: 4,
        unit: "px",
        hidden: ({ showIcon }) => !showIcon,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})
