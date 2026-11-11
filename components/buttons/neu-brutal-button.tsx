// Button with pink background and black shadow on hover
import React, { useState, useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const COMPONENT_VERSION = "brutal-button-v1.1"

// Centralized basic defaults
const DEFAULT_TEXT = "BUTTON"
const DEFAULT_FONT: any = {
    fontSize: "72px",
    variant: "Extra Bold",
    letterSpacing: "0em",
    lineHeight: "1em",
    fontFamily: "Inter, sans-serif",
}

// Defaults split per group for clarity and future divergence
const DEFAULT_DEFAULT_STYLES: StyleSet & { font: any; padding: string } = {
    font: DEFAULT_FONT,
    padding: "20px 52px 16px 52px",
    colors: {
        textColor: "#141414",
        shadowColor: "#000000",
        backgroundColor: "#F795FC",
        borderColor: "#141414",
    },
    shadow: {
        shadowAngle: 140,
        shadowOffset: 0,
    },
    border: {
        borderRadius: 100,
        borderWidth: 8,
        borderStyle: "solid",
    },
}

const DEFAULT_HOVER_STYLES: StyleSet = {
    colors: {
        textColor: "#141414",
        shadowColor: "#000000",
        backgroundColor: "#F795FC",
        borderColor: "#141414",
    },
    shadow: {
        shadowAngle: 140,
        shadowOffset: 30,
    },
    border: {
        borderRadius: 100,
        borderWidth: 8,
        borderStyle: "solid",
    },
}

const DEFAULT_CLICKED_STYLES: StyleSet = {
    colors: {
        textColor: "#141414",
        shadowColor: "#000000",
        backgroundColor: "#E0A560",
        borderColor: "#141414",
    },
    shadow: {
        shadowAngle: 140,
        shadowOffset: 0,
    },
    border: {
        borderRadius: 100,
        borderWidth: 8,
        borderStyle: "solid",
    },
}

// Typed style building blocks for clarity and safety
type Colors = {
    textColor: string
    shadowColor: string
    backgroundColor: string
    borderColor: string
}

type Shadow = {
    shadowAngle: number
    shadowOffset: number
}

type Border = {
    borderRadius: number
    borderWidth: number
    borderStyle: string
}

type StyleSet = {
    colors: Colors
    shadow: Shadow
    border: Border
}

// Small pure helper: deep clone a StyleSet (no functions inside)
function cloneStyles(styles: StyleSet): StyleSet {
    return {
        colors: { ...styles.colors },
        shadow: { ...styles.shadow },
        border: { ...styles.border },
    }
}

interface NeuBrutalButtonProps {
    text: string
    link: string
    defaultStyles: StyleSet & { font: any; padding: string }
    // Framer places enable flags inside each group; optional for type convenience
    hoverStyles: StyleSet & { hoverEnabled?: boolean }
    clickedStyles: StyleSet & { clickEnabled?: boolean }
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function NeuBrutalButton(props: NeuBrutalButtonProps) {
    const {
        text = DEFAULT_TEXT,
        link = "",
        defaultStyles = DEFAULT_DEFAULT_STYLES,
        hoverStyles = DEFAULT_HOVER_STYLES,
        clickedStyles = DEFAULT_CLICKED_STYLES,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [isClicked, setIsClicked] = useState(false)

    // Add global mouseup listener to handle mouse release outside button
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsClicked(false)
        }

        if (isClicked) {
            document.addEventListener("mouseup", handleGlobalMouseUp)
            return () => {
                document.removeEventListener("mouseup", handleGlobalMouseUp)
            }
        }
    }, [isClicked])

    // Resolve enable flags (default to true when absent)
    const hoverEnabled = (hoverStyles as any)?.hoverEnabled ?? true
    const clickEnabled = (clickedStyles as any)?.clickEnabled ?? true

    // Local mirrors: hold the live editable variants shown on the button
    // - They sync with incoming props while enabled
    // - They reset to defaults when disabled (acting as a reset)
    const [hoverState, setHoverState] = useState<StyleSet>(() =>
        cloneStyles(hoverStyles as unknown as StyleSet)
    )
    const [clickedState, setClickedState] = useState<StyleSet>(() =>
        cloneStyles(clickedStyles as unknown as StyleSet)
    )

    // Track previous enabled values to detect Yes → No transitions
    const prevHoverEnabled = useRef<boolean>(hoverEnabled)
    const prevClickEnabled = useRef<boolean>(clickEnabled)

    // Sync mirrors and reset behavior across enable/disable transitions
    useEffect(() => {
        if (hoverEnabled) {
            // Transition No → Yes: start from current defaults
            if (!prevHoverEnabled.current) {
                setHoverState(cloneStyles(defaultStyles as any))
            } else {
                // While enabled: reflect external edits from controls
                setHoverState(cloneStyles(hoverStyles as any))
            }
        } else {
            // While disabled: mirror is defaults and interaction state off
            setHoverState(cloneStyles(defaultStyles as any))
            setIsHovered(false)
        }
        prevHoverEnabled.current = hoverEnabled
    }, [hoverEnabled, hoverStyles, defaultStyles])

    useEffect(() => {
        if (clickEnabled) {
            if (!prevClickEnabled.current) {
                setClickedState(cloneStyles(defaultStyles as any))
            } else {
                setClickedState(cloneStyles(clickedStyles as any))
            }
        } else {
            setClickedState(cloneStyles(defaultStyles as any))
            setIsClicked(false)
        }
        prevClickEnabled.current = clickEnabled
    }, [clickEnabled, clickedStyles, defaultStyles])

    // Choose effective styles for the current interaction state
    const effectiveHover = hoverEnabled
        ? hoverState
        : (defaultStyles as StyleSet)
    const effectiveClicked = clickEnabled
        ? clickedState
        : (defaultStyles as StyleSet)

    // Gate interactions by Enabled flags so disabled states do nothing
    const isHoverActive = hoverEnabled && isHovered
    const isClickActive = clickEnabled && isClicked

    const currentStyles = isClickActive
        ? effectiveClicked
        : isHoverActive
          ? effectiveHover
          : (defaultStyles as StyleSet)

    // Calculate shadow offset based on angle
    const angleRad = (currentStyles.shadow.shadowAngle * Math.PI) / 180
    const shadowX = Math.cos(angleRad) * currentStyles.shadow.shadowOffset
    const shadowY = Math.sin(angleRad) * currentStyles.shadow.shadowOffset

    const handleMouseEnter = () => {
        if (!hoverEnabled) return
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        if (!hoverEnabled) return
        setIsHovered(false)
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: "20px",
                minWidth: "max-content",
            }}
        >
            {/* Font is served from Framer's Google Fonts catalog; no manual link needed */}

            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    borderRadius: `${currentStyles.border.borderRadius}px`,
                    cursor: "pointer",
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Container that handles hover state for both shadow and button */}
                <div
                    style={{
                        position: "relative",
                        display: "inline-block",
                        zIndex: 0,
                    }}
                >
                    {/* Shadow div positioned behind button (clickable like the button) */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: currentStyles.colors.shadowColor,
                            borderRadius: `${currentStyles.border.borderRadius}px`,
                            zIndex: 0,
                        }}
                        onMouseDown={() => clickEnabled && setIsClicked(true)}
                        onMouseUp={() => clickEnabled && setIsClicked(false)}
                        onClick={() => {
                            if (
                                clickEnabled &&
                                link &&
                                typeof window !== "undefined"
                            ) {
                                window.open(link, "_blank")
                            }
                        }}
                    />

                    {/* Button */}
                    <button
                        style={{
                            position: "relative",
                            zIndex: 1,
                            backgroundColor:
                                currentStyles.colors.backgroundColor,
                            color: currentStyles.colors.textColor,
                            border:
                                currentStyles.border.borderWidth > 0
                                    ? `${currentStyles.border.borderWidth}px ${currentStyles.border.borderStyle} ${currentStyles.colors.borderColor}`
                                    : "none",
                            borderRadius: `${currentStyles.border.borderRadius}px`,
                            padding: defaultStyles.padding,
                            cursor: "pointer",
                            transition: `transform 0.133s ease, background-color 0.2s ease, color 0.2s ease`,
                            transform: `translate(${shadowX}px, ${shadowY}px)`,
                            outline: "none",
                            minWidth: "max-content",
                            display: "flex",
                            alignItems: "center",
                            ...defaultStyles.font,
                        }}
                        onFocus={() => hoverEnabled && setIsHovered(true)}
                        onBlur={() => hoverEnabled && setIsHovered(false)}
                        onMouseDown={() => clickEnabled && setIsClicked(true)}
                        onMouseUp={() => clickEnabled && setIsClicked(false)}
                        onClick={() => {
                            if (link && typeof window !== "undefined") {
                                window.open(link, "_blank")
                            }
                        }}
                    >
                        {text}
                    </button>
                </div>
            </div>
        </div>
    )
}

function createControls_colors(defaults: Colors) {
    return {
        textColor: {
            type: ControlType.Color,
            title: "Text Color",
            defaultValue: defaults.textColor,
        },
        shadowColor: {
            type: ControlType.Color,
            title: "Shadow Color",
            defaultValue: defaults.shadowColor,
        },
        backgroundColor: {
            type: ControlType.Color,
            title: "Background Color",
            defaultValue: defaults.backgroundColor,
        },
        borderColor: {
            type: ControlType.Color,
            title: "Border Color",
            defaultValue: defaults.borderColor,
        },
    }
}

function createControls_shadow(defaults: Shadow) {
    return {
        shadowAngle: {
            type: ControlType.Number,
            title: "Shadow Angle",
            defaultValue: defaults.shadowAngle,
            min: 0,
            max: 360,
            unit: "deg",
        },
        shadowOffset: {
            type: ControlType.Number,
            title: "Shadow Offset",
            defaultValue: defaults.shadowOffset,
            min: 0,
            max: 100,
            unit: "px",
        },
    }
}

function createControls_border(defaults: Border) {
    return {
        borderRadius: {
            type: ControlType.Number,
            title: "Border Radius",
            defaultValue: defaults.borderRadius,
            min: 0,
            max: 100,
            unit: "px",
        },
        borderWidth: {
            type: ControlType.Number,
            title: "Border Width",
            defaultValue: defaults.borderWidth,
            min: 0,
            max: 100,
            unit: "px",
        },
        borderStyle: {
            type: ControlType.Enum,
            title: "Border Style",
            options: ["solid", "dashed", "dotted", "double"],
            defaultValue: defaults.borderStyle,
        },
    }
}

addPropertyControls(NeuBrutalButton, {
    text: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: DEFAULT_TEXT,
    },
    link: {
        type: ControlType.Link,
        title: "Button Link",
        defaultValue: "",
        placeholder: "https://example.com",
        description: "\n*Button Styles:*",
    },
    defaultStyles: {
        type: ControlType.Object,
        title: "Default",
        buttonTitle: "Styles",
        icon: "color", // boolean, object, color, effect or interact
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultFontType: "sans-serif",
                defaultValue: DEFAULT_DEFAULT_STYLES.font,
                controls: "extended",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: DEFAULT_DEFAULT_STYLES.padding,
            },
            colors: {
                type: ControlType.Object,
                title: "Colors",
                controls: createControls_colors(DEFAULT_DEFAULT_STYLES.colors),
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                controls: createControls_shadow(DEFAULT_DEFAULT_STYLES.shadow),
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                controls: createControls_border(DEFAULT_DEFAULT_STYLES.border),
            },
        },
    },
    hoverStyles: {
        type: ControlType.Object,
        title: "Hover",
        buttonTitle: "Styles",
        icon: "color", // boolean, object, color, effect or interact
        controls: {
            hoverEnabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            colors: {
                type: ControlType.Object,
                title: "Colors",
                hidden: ({ hoverEnabled }) => !hoverEnabled,
                controls: createControls_colors(DEFAULT_HOVER_STYLES.colors),
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                hidden: ({ hoverEnabled }) => !hoverEnabled,
                controls: createControls_shadow(DEFAULT_HOVER_STYLES.shadow),
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                hidden: ({ hoverEnabled }) => !hoverEnabled,
                controls: createControls_border(DEFAULT_HOVER_STYLES.border),
            },
        },
    },
    clickedStyles: {
        type: ControlType.Object,
        title: "Clicked",
        buttonTitle: "Styles",
        icon: "color", // boolean, object, color, effect or interact
        controls: {
            clickEnabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            colors: {
                type: ControlType.Object,
                title: "Colors",
                hidden: ({ clickEnabled }) => !clickEnabled,
                controls: createControls_colors(DEFAULT_CLICKED_STYLES.colors),
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                hidden: ({ clickEnabled }) => !clickEnabled,
                controls: createControls_shadow(DEFAULT_CLICKED_STYLES.shadow),
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                hidden: ({ clickEnabled }) => !clickEnabled,
                controls: createControls_border(DEFAULT_CLICKED_STYLES.border),
            },
        },
    },
})
