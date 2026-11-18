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

interface Props {
    text: string
    textColor: string
    borderColor: string
    backgroundColor: string
    font: any
    padding: string
    borderWidth: number
    link: string
    openInNewTab: boolean
    cursor: string
    style?: any
}

export default function AnimatedButton({
    text,
    textColor,
    borderColor,
    backgroundColor,
    font,
    padding,
    borderWidth,
    link,
    openInNewTab,
    cursor,
    style,
    ...rest
}: Props) {
    const [isHovered, setIsHovered] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        if (link) {
            if (openInNewTab) {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = link
            }
        }
    }

    // Helper: normalize font props returned by ControlType.Font
    const resolvedFont = () => {
        if (!font) {
            return {
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 20,
            }
        }
        if (typeof font === "string") {
            return {
                fontFamily: font,
                fontWeight: 600,
                fontSize: 20,
            }
        }
        return {
            fontFamily: font.fontFamily || "Inter",
            fontWeight: font.fontWeight || font.weight || 600,
            fontSize: font.fontSize || 20,
        }
    }

    const fontStyle = resolvedFont()

    return (
        <button
            {...rest}
            style={{
                ...style,
                backgroundColor: backgroundColor,
                border: "none",
                padding: 0,
                cursor: cursor,
                display: "inline-block",
            }}
            onClick={handleClick}
        >
            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    padding: padding,
                    border: `${borderWidth}px solid ${borderColor}`,
                    textTransform: "uppercase",
                    color: textColor,
                    textDecoration: "none",
                    fontFamily: fontStyle.fontFamily,
                    fontWeight: fontStyle.fontWeight,
                    fontSize: fontStyle.fontSize,
                    backgroundColor: backgroundColor,
                    boxSizing: "border-box",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Vertical bars (::before) - creates left and right parts of corner brackets */}
                <div
                    style={{
                        content: "''",
                        position: "absolute",
                        top: "6px",
                        left: `${-borderWidth - 0.5}px`,
                        width: `calc(100% + ${borderWidth * 2 + 1}px)`,
                        height: "calc(100% - 12px)",
                        backgroundColor: backgroundColor,
                        transition: "transform 0.3s ease-in-out",
                        transform: isHovered ? "scaleY(0)" : "scaleY(1)",
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                />

                {/* Horizontal bars (::after) - creates top and bottom parts of corner brackets */}
                <div
                    style={{
                        content: "''",
                        position: "absolute",
                        left: "6px",
                        top: `${-borderWidth - 0.5}px`,
                        height: `calc(100% + ${borderWidth * 2 + 1}px)`,
                        width: "calc(100% - 12px)",
                        backgroundColor: backgroundColor,
                        transition: "transform 0.3s ease-in-out 0.5s",
                        transform: isHovered ? "scaleX(0)" : "scaleX(1)",
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                />

                {/* Text content */}
                <span
                    style={{
                        position: "relative",
                        zIndex: 3,
                    }}
                >
                    {text}
                </span>
            </div>
        </button>
    )
}

AnimatedButton.defaultProps = {
    text: "Button",
    textColor: "#fefefe",
    borderColor: "#fefefe",
    backgroundColor: "#212121",
    font: {
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 20,
    },
    padding: "15px 30px",
    borderWidth: 2,
    link: "",
    openInNewTab: true,
    cursor: "pointer",
}

addPropertyControls(AnimatedButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Button",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 20,
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fefefe",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#fefefe",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#212121",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "15px 30px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 2,
        displayStepper: true,
    },
    cursor: {
        type: ControlType.Enum,
        title: "Cursor",
        options: [
            "pointer",
            "default",
            "grab",
            "grabbing",
            "help",
            "wait",
            "crosshair",
            "not-allowed",
            "zoom-in",
            "zoom-out",
            "move",
            "text",
        ],
        optionTitles: [
            "Pointer",
            "Default",
            "Grab",
            "Grabbing",
            "Help",
            "Wait",
            "Crosshair",
            "Not Allowed",
            "Zoom In",
            "Zoom Out",
            "Move",
            "Text",
        ],
        defaultValue: "pointer",
    },
    link: {
        type: ControlType.String,
        title: "Link URL",
        defaultValue: "",
        placeholder: "https://example.com",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
