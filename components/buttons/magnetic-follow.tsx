import React, { useRef, useState, useEffect } from "react"
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
export default function MagneticFollowButton(props) {
    const {
        text,
        link,
        openInNewTab,
        ariaLabel,
        disabled,
        fullWidth,
        font,
        fontSize,
        textColor,
        buttonBg,
        hoverBg,
        borderColor,
        paddingHorizontal,
        paddingVertical,
        borderRadius,
        magneticStrength,
        rotationStrength,
        maxOffset,
        transitionSpeedHover,
        transitionSpeedReset,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const buttonRef = useRef<HTMLDivElement>(null)
    const rafId = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    // Clean destructuring for typography
    const {
        fontFamily = "Inter, sans-serif",
        fontWeight = "600",
        fontStyle = "normal",
        lineHeight = "1.2",
        letterSpacing = "0px",
    } = font ?? {}

    // Check if user has requested reduced motion
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Mouse movement handler with clamping & reduced motion check
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isStatic || disabled || prefersReducedMotion || !buttonRef.current)
            return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        if (rafId.current) cancelAnimationFrame(rafId.current)

        rafId.current = requestAnimationFrame(() => {
            if (!buttonRef.current) return

            // 3. Clamped magnetic offset
            const rawMoveX = x * magneticStrength
            const rawMoveY = y * magneticStrength
            const moveX = Math.max(-maxOffset, Math.min(maxOffset, rawMoveX))
            const moveY = Math.max(-maxOffset, Math.min(maxOffset, rawMoveY))

            const rotateX = -y * rotationStrength
            const rotateY = x * rotationStrength

            buttonRef.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        })
    }

    // Single focus/hover handlers
    const handleEnter = () => {
        if (!isStatic && !disabled) setIsHovered(true)
    }

    const handleLeave = () => {
        if (isStatic || disabled) return
        setIsHovered(false)
        if (rafId.current) cancelAnimationFrame(rafId.current)
        if (buttonRef.current) {
            buttonRef.current.style.transform =
                "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)"
        }
    }

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [])

    // Explicit string validation check
    const hasValidLink =
        typeof link === "string" && link.trim() !== "" && link !== "#"

    // 5. Unified transition style optimization
    const transitionStyle = isStatic
        ? "none"
        : `transform ${isHovered ? transitionSpeedHover : transitionSpeedReset}s ${
              isHovered ? "ease-out" : "cubic-bezier(0.34, 1.56, 0.64, 1)"
          }, background-color 0.2s ease`

    return (
        <a
            href={disabled || !hasValidLink ? undefined : link}
            aria-label={ariaLabel || text}
            target={openInNewTab ? "_blank" : "_self"}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
            aria-disabled={disabled}
            onFocus={handleEnter}
            onBlur={handleLeave}
            style={{
                position: "relative",
                display: fullWidth ? "block" : "inline-block",
                width: fullWidth ? "100%" : "auto",
                textDecoration: "none",
                // 7. Always use pointer cursor unless disabled
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? "none" : "auto",
            }}
        >
            {/* Dotted Outline Placeholder (Behind) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: `${borderRadius}px`,
                    border: `1.5px dashed ${borderColor}`,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* Interactive Magnetic Button Layer */}
            <div
                ref={buttonRef}
                onMouseEnter={handleEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleLeave}
                style={{
                    position: "relative",
                    display: fullWidth ? "flex" : "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: fullWidth ? "100%" : "auto",
                    borderRadius: `${borderRadius}px`,
                    backgroundColor:
                        !isStatic && isHovered && hoverBg ? hoverBg : buttonBg,
                    padding: `${paddingVertical}px ${paddingHorizontal}px`,
                    transition: transitionStyle,
                    // 6. Performance hint for browser composite layer
                    willChange: isHovered ? "transform" : "auto",
                    transformStyle: isStatic ? "flat" : "preserve-3d",
                    zIndex: 2,
                }}
            >
                <span
                    style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        fontFamily,
                        fontWeight,
                        fontStyle,
                        lineHeight,
                        letterSpacing,
                        whiteSpace: "nowrap",
                        userSelect: "none",
                    }}
                >
                    {text}
                </span>
            </div>
        </a>
    )
}

// Default Property Values
MagneticFollowButton.defaultProps = {
    text: "Follow @Karim Saif",
    link: "#",
    openInNewTab: false,
    ariaLabel: "Follow Karim Saif on Twitter",
    disabled: false,
    fullWidth: false,
    fontSize: 15,
    textColor: "#FFFFFF",
    buttonBg: "#2563EB",
    hoverBg: "#1D4ED8",
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    magneticStrength: 0.35,
    rotationStrength: 0.2,
    maxOffset: 20,
    transitionSpeedHover: 0.08,
    transitionSpeedReset: 0.4,
}

// 8. Grouped Property Controls in Framer
addPropertyControls(MagneticFollowButton, {
    // --- CONTENT ---
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Follow @Karim Saif",
    },
    link: {
        type: ControlType.String,
        title: "Link URL",
        defaultValue: "#",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "",
        description: "Accessible name for screen readers",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },

    // --- TYPOGRAPHY ---
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
        title: "Size",
        defaultValue: 15,
        min: 10,
        max: 48,
    },

    // --- APPEARANCE ---
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    buttonBg: {
        type: ControlType.Color,
        title: "Button Bg",
        defaultValue: "#2563EB",
    },
    hoverBg: {
        type: ControlType.Color,
        title: "Hover Bg",
        defaultValue: "#1D4ED8",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Outline Color",
        defaultValue: "rgba(255, 255, 255, 0.4)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
    },

    // --- LAYOUT ---
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 22,
        min: 8,
        max: 80,
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 10,
        min: 4,
        max: 40,
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
    },

    // --- ANIMATION ---
    magneticStrength: {
        type: ControlType.Number,
        title: "Magnetic Power",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
    },
    rotationStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
    },
    maxOffset: {
        type: ControlType.Number,
        title: "Max Offset",
        defaultValue: 20,
        min: 5,
        max: 100,
        unit: "px",
        description: "Clamps the maximum magnetic displacement",
    },
    transitionSpeedHover: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    transitionSpeedReset: {
        type: ControlType.Number,
        title: "Reset Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 1.5,
        step: 0.05,
        unit: "s",
        description: "Made with ❤️ by [@karimsaif](https://x.com/karimsaif0)",
    },
})
