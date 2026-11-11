// Swipe Letters Button - A button with animated letter transitions on hover

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


interface SwipeLettersButtonProps {
    label: string
    defaultState: {
        bgColor: string
        borderColor: string
        textColor: string
    }
    hoverState: {
        bgColor: string
        borderColor: string
        textColor: string
    }
    radius: number
    paddingX: number
    paddingY: number
    font: any
    align: "start" | "center" | "end"
    showBorder: boolean
    direction: "top" | "bottom" | "alternate"
    duration: number
    easing: string
    stagger: number
    link: string
}

/**
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 64
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SwipeLettersButton(props: SwipeLettersButtonProps) {
    const {
        label = "GET IN TOUCH",
        defaultState = {
            bgColor: "#1D1D1D",
            borderColor: "#414141",
            textColor: "#FFFFFF"
        },
        hoverState = {
            bgColor: "#2D2D2D",
            borderColor: "#515151",
            textColor: "#FFFFFF"
        },
        radius = 9999,
        paddingX = 24,
        paddingY = 16,
        font = {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "0.4px",
            textAlign: "center"
        },
        align = "center",
        showBorder = true,
        direction = "alternate",
        duration = 380,
        easing = "cubic-bezier(.25,.75,.25,1)",
        stagger = 18,
        link = "",
    } = props

    const [hovered, setHovered] = React.useState(false)
    const chars = React.useMemo(
        () => Array.from(label || "").map((c) => (c === " " ? "\u00A0" : c)),
        [label]
    )

    const handleClick = () => {
        if (link && typeof window !== "undefined") {
            if (link.startsWith("http") || link.startsWith("//")) {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = link
            }
        }
    }

    const currentBgColor = hovered ? hoverState.bgColor : defaultState.bgColor
    const currentBorderColor = hovered ? hoverState.borderColor : defaultState.borderColor
    const currentTextColor = hovered ? hoverState.textColor : defaultState.textColor

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleClick}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    align === "center"
                        ? "center"
                        : align === "start"
                          ? "flex-start"
                          : "flex-end",
                backgroundColor: currentBgColor,
                borderRadius: radius,
                border: showBorder ? `1px solid ${currentBorderColor}` : "none",
                overflow: "hidden",
                position: "relative",
                userSelect: "none",
                cursor: "pointer",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
        >
            <div
                style={{
                    padding: `${paddingY}px ${paddingX}px`,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        align === "center"
                            ? "center"
                            : align === "start"
                              ? "flex-start"
                              : "flex-end",
                    gap: `${parseFloat(font.letterSpacing) || 0.4}px`,
                }}
            >
                {chars.map((ch, i) => {
                    const dir =
                        direction === "alternate"
                            ? i % 2 === 0
                                ? "top"
                                : "bottom"
                            : direction

                    const initY = dir === "top" ? "-50%" : "0%"
                    const hoverY = dir === "top" ? "0%" : "-50%"
                    const delay = `${i * stagger}ms`

                    return (
                        <span
                            key={`${ch}-${i}`}
                            style={{
                                position: "relative",
                                display: "inline-block",
                                height: "1em",
                                overflow: "hidden",
                                fontFamily: font.fontFamily || "inherit",
                                fontSize: font.fontSize,
                                fontWeight: font.fontWeight,
                                fontStyle: font.fontStyle,
                                lineHeight: 1,
                            }}
                        >
                            <span
                                style={{
                                    display: "grid",
                                    gridAutoRows: "1em",
                                    transform: `translateY(${hovered ? hoverY : initY})`,
                                    transitionProperty: "transform",
                                    transitionDuration: `${duration}ms`,
                                    transitionTimingFunction: easing,
                                    transitionDelay: delay,
                                    willChange: "transform",
                                }}
                            >
                                <span style={{ color: currentTextColor, transition: "color 0.2s ease" }}>{ch}</span>
                                <span style={{ color: currentTextColor, transition: "color 0.2s ease" }}>{ch}</span>
                            </span>
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(SwipeLettersButton, {
    label: { 
        type: ControlType.String, 
        title: "Label",
        defaultValue: "GET IN TOUCH"
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: ""
    },
    defaultState: {
        type: ControlType.Object,
        title: "Default",
        controls: {
            bgColor: { 
                type: ControlType.Color, 
                title: "Background",
                defaultValue: "#1D1D1D"
            },
            borderColor: { 
                type: ControlType.Color, 
                title: "Border",
                defaultValue: "#414141"
            },
            textColor: { 
                type: ControlType.Color, 
                title: "Text",
                defaultValue: "#FFFFFF"
            }
        },
        defaultValue: {
            bgColor: "#1D1D1D",
            borderColor: "#414141",
            textColor: "#FFFFFF"
        }
    },
    hoverState: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            bgColor: { 
                type: ControlType.Color, 
                title: "Background",
                defaultValue: "#2D2D2D"
            },
            borderColor: { 
                type: ControlType.Color, 
                title: "Border",
                defaultValue: "#515151"
            },
            textColor: { 
                type: ControlType.Color, 
                title: "Text",
                defaultValue: "#FFFFFF"
            }
        },
        defaultValue: {
            bgColor: "#2D2D2D",
            borderColor: "#515151",
            textColor: "#FFFFFF"
        }
    },
    showBorder: { 
        type: ControlType.Boolean, 
        title: "Show Border",
        defaultValue: true
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 2000,
        step: 1,
        defaultValue: 9999
    },
    paddingX: {
        type: ControlType.Number,
        title: "Pad X",
        min: 0,
        max: 96,
        step: 1,
        defaultValue: 24
    },
    paddingY: {
        type: ControlType.Number,
        title: "Pad Y",
        min: 0,
        max: 96,
        step: 1,
        defaultValue: 16
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "0.4px",
            textAlign: "center"
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        displaySegmentedControl: true,
        defaultValue: "center"
    },
    direction: {
        type: ControlType.Enum,
        title: "Swipe From",
        options: ["top", "bottom", "alternate"],
        optionTitles: ["Top", "Bottom", "Alternate"],
        defaultValue: "alternate"
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        min: 80,
        max: 2000,
        step: 10,
        defaultValue: 380
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "ease",
            "ease-in",
            "ease-out",
            "ease-in-out",
            "cubic-bezier(.25,.75,.25,1)",
        ],
        optionTitles: ["ease", "ease-in", "ease-out", "ease-in-out", "Snap"],
        defaultValue: "cubic-bezier(.25,.75,.25,1)"
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger (ms)",
        min: 0,
        max: 300,
        step: 2,
        defaultValue: 18
    },
})