// Premium Liquid Glass Back Button with Apple-inspired aesthetic
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, type CSSProperties } from "react"

interface LiquidGlassBackButtonProps {
    label: string
    showText: boolean
    iconSize: number
    iconWeight: number
    textSize: number
    textWeight: number
    font: any
    textColor: string
    glassBackground: string
    glassBorderColor: string
    highlightColor: string
    outerShadowColor: string
    innerShadowColor: string
    hoverTint: string
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    gap: number
    borderRadius: number
    blurAmount: number
    glassOpacity: number
    glassTransparency: number
    highlightIntensity: number
    lightDirection: number
    outerShadowIntensity: number
    outerShadowBlur: number
    outerShadowSpread: number
    innerShadowIntensity: number
    innerShadowBlur: number
    innerShadowSpread: number
    noiseOpacity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function LiquidGlassBackButton(
    props: LiquidGlassBackButtonProps
) {
    const {
        label,
        showText,
        iconSize,
        iconWeight,
        textSize,
        textWeight,
        font,
        textColor,
        glassBackground,
        glassBorderColor,
        highlightColor,
        outerShadowColor,
        innerShadowColor,
        hoverTint,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        gap,
        borderRadius,
        blurAmount,
        glassOpacity,
        glassTransparency,
        highlightIntensity,
        lightDirection,
        outerShadowIntensity,
        outerShadowBlur,
        outerShadowSpread,
        innerShadowIntensity,
        innerShadowBlur,
        innerShadowSpread,
        noiseOpacity,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)

    const handleClick = () => {
        if (typeof window !== "undefined") {
            window.history.back()
        }
    }

    // Calculate light position based on direction (0-360 degrees)
    const lightAngleRad = (lightDirection * Math.PI) / 180
    const lightX = 50 + Math.cos(lightAngleRad) * 30 // 30% offset from center
    const lightY = 50 + Math.sin(lightAngleRad) * 30

    // Calculate enhanced glass transparency
    const finalGlassOpacity = glassOpacity * glassTransparency

    // Create more transparent border with enhanced lighting
    const borderOpacity = 0.05 * glassTransparency
    const borderHighlightOpacity = highlightIntensity * 0.4 * glassTransparency

    // Calculate inner border radius (accounts for the 1px border)
    const innerBorderRadius = Math.max(0, borderRadius - 1)

    const buttonStyle: CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: style?.width ?? "auto",
        gap: showText ? gap : 0,
        paddingTop: paddingTop,
        paddingRight: paddingRight,
        paddingBottom: paddingBottom,
        paddingLeft: paddingLeft,
        minWidth: 44,
        minHeight: 44,
        borderRadius,
        border: `1px solid transparent`,
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
        overflow: "hidden",
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        // Replaced circular radial-gradients with linear gradients that respect shape
        background: `
            linear-gradient(${lightDirection}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 0.8})`)} 0%,
                transparent 40%
            ),
            linear-gradient(${lightDirection + 90}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 0.3})`)} 0%,
                transparent 30%
            ),
            linear-gradient(${lightDirection + 135}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 0.6})`)} 0%,
                ${glassBackground.replace(/[\d\.]+\)$/g, `${finalGlassOpacity})`)} 50%,
                ${innerShadowColor.replace(/[\d\.]+\)$/g, `${innerShadowIntensity * 0.3})`)} 100%
            ),
            linear-gradient(to bottom, 
                transparent 0%, 
                ${innerShadowColor.replace(/[\d\.]+\)$/g, `${noiseOpacity})`)} 100%
            )
        `,
        boxShadow: `
            0 ${outerShadowBlur}px ${outerShadowBlur * 1.5}px ${outerShadowSpread}px ${outerShadowColor.replace(/[\d\.]+\)$/g, `${outerShadowIntensity})`)},
            inset 0 0 0 1px ${glassBorderColor.replace(/[\d\.]+\)$/g, `${borderOpacity})`)},
            inset 0 1px 1px 0 ${highlightColor.replace(/[\d\.]+\)$/g, `${borderHighlightOpacity})`)},
            inset 0 -${innerShadowBlur}px ${innerShadowBlur}px ${innerShadowSpread}px ${innerShadowColor.replace(/[\d\.]+\)$/g, `${innerShadowIntensity})`)}
        `,
        transform: `scale(${isPressed ? 0.95 : isHovered ? 1.05 : 1}) translateY(${isHovered ? -2 : 0}px) translateZ(0)`,
        transition: `
            transform 1.2s cubic-bezier(0.23, 1, 0.32, 1),
            background 0.8s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 1.0s cubic-bezier(0.4, 0, 0.2, 1),
            backdrop-filter 0.8s ease-out
        `,
        willChange: "transform, background, box-shadow",
        ...style,
    }

    // Overlay div style for the gradient border effect (replaces ::before pseudo-element)
    const borderOverlayStyle: CSSProperties = {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: borderRadius, // Now synced with main border radius
        padding: 1,
        background: `linear-gradient(${lightDirection}deg, 
            ${highlightColor.replace(/[\d\.]+\)$/g, `${borderHighlightOpacity * 2})`)}, 
            transparent 30%, 
            transparent 70%, 
            ${innerShadowColor.replace(/[\d\.]+\)$/g, `${borderOpacity * 2})`)}
        )`,
        WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        pointerEvents: "none" as const,
    }

    if (isHovered) {
        buttonStyle.background = `
            linear-gradient(${lightDirection}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 1.4})`)} 0%,
                transparent 35%
            ),
            linear-gradient(${lightDirection + 45}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 0.8})`)} 0%,
                transparent 40%
            ),
            linear-gradient(${lightDirection + 90}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 0.5})`)} 0%,
                transparent 35%
            ),
            linear-gradient(${lightDirection + 135}deg, 
                ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 1.1})`)} 0%,
                ${glassBackground.replace(/[\d\.]+\)$/g, `${finalGlassOpacity + 0.15})`)} 50%,
                ${innerShadowColor.replace(/[\d\.]+\)$/g, `${innerShadowIntensity * 0.5})`)} 100%
            ),
            ${hoverTint.replace(/[\d\.]+\)$/g, "0.2)")},
            linear-gradient(to bottom, 
                transparent 0%, 
                ${innerShadowColor.replace(/[\d\.]+\)$/g, `${noiseOpacity * 0.7})`)} 100%
            )
        `
        buttonStyle.boxShadow = `
            0 ${outerShadowBlur * 1.5}px ${outerShadowBlur * 2.5}px ${outerShadowSpread - 1}px ${outerShadowColor.replace(/[\d\.]+\)$/g, `${outerShadowIntensity * 1.6})`)},
            0 ${outerShadowBlur * 0.5}px ${outerShadowBlur}px ${outerShadowSpread + 2}px ${highlightColor.replace(/[\d\.]+\)$/g, `${highlightIntensity * 0.3})`)},
            inset 0 0 0 1px ${glassBorderColor.replace(/[\d\.]+\)$/g, `${borderOpacity * 2})`)},
            inset 0 2px 4px 0 ${highlightColor.replace(/[\d\.]+\)$/g, `${borderHighlightOpacity * 2})`)},
            inset 0 -${innerShadowBlur}px ${innerShadowBlur * 1.5}px ${innerShadowSpread}px ${innerShadowColor.replace(/[\d\.]+\)$/g, `${innerShadowIntensity * 0.7})`)}
        `
        buttonStyle.backdropFilter = `blur(${blurAmount * 1.2}px)`
        buttonStyle.WebkitBackdropFilter = `blur(${blurAmount * 1.2}px)`
    }

    if (isPressed) {
        buttonStyle.transform = `scale(0.96) translateY(0px) translateZ(0)`
        buttonStyle.transition = `
            transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            background 0.08s ease-out,
            filter 0.08s ease-out
        `
    }

    const iconStyle: CSSProperties = {
        width: iconSize,
        height: iconSize,
        color: textColor,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    const textStyle: CSSProperties = {
        ...font,
        color: textColor,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: textSize,
        fontWeight: textWeight,
    }

    const focusStyle: CSSProperties = {
        outline: `2px solid ${textColor.replace(/[\d\.]+\)$/g, "0.5)")}`,
        outlineOffset: "2px",
    }

    return (
        <button
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsPressed(false)
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onClick={handleClick}
            onFocus={(e) => {
                // Only show focus outline when navigating with keyboard, not on click
                if (e.target.matches(":focus-visible")) {
                    Object.assign(e.target.style, focusStyle)
                }
            }}
            onBlur={(e) => {
                e.target.style.outline = "none"
                e.target.style.outlineOffset = "0"
            }}
            aria-label={!showText ? "Go back" : label}
        >
            {/* Border overlay div instead of ::before pseudo-element */}
            <div style={borderOverlayStyle} />

            <div style={iconStyle}>
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={iconWeight}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </div>
            {showText && <span style={textStyle}>{label}</span>}
        </button>
    )
}

addPropertyControls(LiquidGlassBackButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Back",
    },
    showText: {
        type: ControlType.Boolean,
        title: "Show Text",
        defaultValue: true,
        enabledTitle: "With Text",
        disabledTitle: "Icon Only",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 28,
        min: 12,
        max: 150,
        step: 1,
        unit: "px",
    },
    iconWeight: {
        type: ControlType.Number,
        title: "Icon Weight",
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 0.1,
        unit: "px",
    },
    textSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 28,
        min: 10,
        max: 150,
        step: 1,
        unit: "px",
    },
    textWeight: {
        type: ControlType.Number,
        title: "Text Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgba(255, 255, 255, 0.85)",
    },
    glassBackground: {
        type: ControlType.Color,
        title: "Glass Background",
        defaultValue: "rgba(199, 199, 199, 0.45)",
    },
    glassBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255, 255, 255, 0.3)",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "rgba(163, 163, 163, 0.6)",
    },
    outerShadowColor: {
        type: ControlType.Color,
        title: "Outer Shadow Color",
        defaultValue: "rgba(41, 41, 41, 0.1)",
    },
    innerShadowColor: {
        type: ControlType.Color,
        title: "Inner Shadow Color",
        defaultValue: "rgba(255, 255, 255, 0.05)",
    },
    hoverTint: {
        type: ControlType.Color,
        title: "Hover Tint",
        defaultValue: "rgba(209, 209, 209, 0.15)",
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 21,
        min: 8,
        max: 40,
        step: 1,
        unit: "px",
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 21,
        min: 8,
        max: 40,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Icon-Text Gap",
        defaultValue: 2,
        min: 2,
        max: 16,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 21,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 10,
        min: 5,
        max: 50,
        step: 1,
        unit: "px",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 0.25,
        min: 0.1,
        max: 0.9,
        step: 0.05,
    },
    glassTransparency: {
        type: ControlType.Number,
        title: "Glass Transparency",
        defaultValue: 0.5,
        min: 0.3,
        max: 1.5,
        step: 0.1,
    },
    highlightIntensity: {
        type: ControlType.Number,
        title: "Highlight Intensity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
    },
    lightDirection: {
        type: ControlType.Number,
        title: "Light Direction",
        defaultValue: 225,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
    },
    outerShadowIntensity: {
        type: ControlType.Number,
        title: "Outer Shadow Intensity",
        defaultValue: 0.2,
        min: 0,
        max: 0.5,
        step: 0.05,
    },
    outerShadowBlur: {
        type: ControlType.Number,
        title: "Outer Shadow Blur",
        defaultValue: 5,
        min: 5,
        max: 40,
        step: 1,
        unit: "px",
    },
    outerShadowSpread: {
        type: ControlType.Number,
        title: "Outer Shadow Spread",
        defaultValue: -2,
        min: -10,
        max: 10,
        step: 1,
        unit: "px",
    },
    innerShadowIntensity: {
        type: ControlType.Number,
        title: "Inner Shadow Intensity",
        defaultValue: 0.14,
        min: 0,
        max: 0.2,
        step: 0.01,
    },
    innerShadowBlur: {
        type: ControlType.Number,
        title: "Inner Shadow Blur",
        defaultValue: 3,
        min: 2,
        max: 20,
        step: 1,
        unit: "px",
    },
    innerShadowSpread: {
        type: ControlType.Number,
        title: "Inner Shadow Spread",
        defaultValue: -1,
        min: -5,
        max: 5,
        step: 1,
        unit: "px",
    },
    noiseOpacity: {
        type: ControlType.Number,
        title: "Noise Opacity",
        defaultValue: 0.06,
        min: 0,
        max: 0.1,
        step: 0.01,
    },
})
