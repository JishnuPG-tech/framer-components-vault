// Button component with chamfered corners inspired by Nexus Core design
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties } from "react"

interface ChamferedButtonProps {
    label: string
    variant: "primary" | "secondary"
    showIcon: boolean
    iconPosition: "left" | "right"
    iconSize: number
    chamferSize: number
    backgroundColor: string
    textColor: string
    gradientFrom: string
    gradientTo: string
    hoverGlow: boolean
    font: CSSProperties
    onClick?: () => void
    style?: CSSProperties
}

/**
 * Chamfered Button Component
 * 
 * A premium button with diagonal corner cuts and gradient borders,
 * inspired by infrastructure intelligence design systems.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 50
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ChamferedButton(props: ChamferedButtonProps) {
    const {
        label = "Initialize Sequence",
        variant = "primary",
        showIcon = true,
        iconPosition = "right",
        iconSize = 16,
        chamferSize = 12,
        backgroundColor = "#2563EB",
        textColor = "#FFFFFF",
        gradientFrom = "#22D3EE",
        gradientTo = "#1D4ED8",
        hoverGlow = true,
        font,
        onClick,
        style,
    } = props

    const isPrimary = variant === "primary"
    
    // Calculate clip-path based on chamfer size
    const clipPath = `polygon(${chamferSize}px 0, 100% 0, 100% calc(100% - ${chamferSize}px), calc(100% - ${chamferSize}px) 100%, 0 100%, 0 ${chamferSize}px)`
    
    // Clip-path with all corners chamfered for hover state
    const clipPathAllCorners = `polygon(${chamferSize}px 0, calc(100% - ${chamferSize}px) 0, 100% ${chamferSize}px, 100% calc(100% - ${chamferSize}px), calc(100% - ${chamferSize}px) 100%, ${chamferSize}px 100%, 0 calc(100% - ${chamferSize}px), 0 ${chamferSize}px)`

    const outerStyles: CSSProperties = {
        position: "relative",
        display: "inline-flex",
        clipPath,
        background: isPrimary 
            ? `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`
            : `linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), transparent)`,
        padding: "1px",
        transition: "all 0.3s ease",
        cursor: "pointer",
    }

    const innerStyles: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        clipPath,
        background: isPrimary ? backgroundColor : "#04060E",
        paddingLeft: "28px",
        paddingRight: "28px",
        paddingTop: "14px",
        paddingBottom: "14px",
        transition: "all 0.3s ease",
        color: textColor,
        ...font,
        whiteSpace: "nowrap",
        minWidth: "max-content",
    }

    const iconStyles: CSSProperties = {
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        transition: "transform 0.3s ease",
        display: "flex",
        alignItems: "center",
    }

    const ArrowIcon = () => (
        <svg 
            className="button-icon"
            style={iconStyles}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
    )

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "inline-flex",
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                const outer = e.currentTarget.querySelector('.button-outer') as HTMLElement
                const inner = e.currentTarget.querySelector('.button-inner') as HTMLElement
                const iconEl = e.currentTarget.querySelector('.button-icon') as HTMLElement
                
                if (outer) {
                    outer.style.clipPath = clipPathAllCorners
                    if (hoverGlow) {
                        outer.style.boxShadow = isPrimary 
                            ? "0 0 32px rgba(14, 165, 233, 0.3)"
                            : "0 0 16px rgba(255, 255, 255, 0.1)"
                    }
                }
                
                if (inner) {
                    inner.style.clipPath = clipPathAllCorners
                    inner.style.background = isPrimary ? "#3B82F6" : "#070A18"
                }
                
                if (iconEl && iconPosition === "right") {
                    iconEl.style.transform = "translateX(4px)"
                }
            }}
            onMouseLeave={(e) => {
                const outer = e.currentTarget.querySelector('.button-outer') as HTMLElement
                const inner = e.currentTarget.querySelector('.button-inner') as HTMLElement
                const iconEl = e.currentTarget.querySelector('.button-icon') as HTMLElement
                
                if (outer) {
                    outer.style.clipPath = clipPath
                    outer.style.boxShadow = "none"
                }
                
                if (inner) {
                    inner.style.clipPath = clipPath
                    inner.style.background = isPrimary ? backgroundColor : "#04060E"
                }
                
                if (iconEl) {
                    iconEl.style.transform = "translateX(0)"
                }
            }}
        >
            <div className="button-outer" style={outerStyles}>
                <div className="button-inner" style={innerStyles}>
                    {showIcon && iconPosition === "left" && <ArrowIcon />}
                    <span>{label}</span>
                    {showIcon && iconPosition === "right" && <ArrowIcon />}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ChamferedButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Initialize Sequence",
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["primary", "secondary"],
        optionTitles: ["Primary", "Secondary"],
        defaultValue: "primary",
        displaySegmentedControl: true,
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: ({ showIcon }) => !showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 16,
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ showIcon }) => !showIcon,
    },
    chamferSize: {
        type: ControlType.Number,
        title: "Chamfer Size",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#2563EB",
        hidden: ({ variant }) => variant === "secondary",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#22D3EE",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#1D4ED8",
    },
    hoverGlow: {
        type: ControlType.Boolean,
        title: "Hover Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
