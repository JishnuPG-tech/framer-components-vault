// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState, useEffect, useRef } from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function AnimatedGradientText(props) {
    const {
        text = "Beautiful Gradient Text",
        textFont,

        // Accessibility
        semanticTag = "h1",

        // Gradient colors (up to 5 colors)
        color1 = "#ff6b6b",
        color2 = "#4ecdc4",
        color3 = "#45b7d1",
        color4 = "#96ceb4",
        color5 = "#feca57",
        useColor3 = true,
        useColor4 = false,
        useColor5 = false,

        // Animation settings
        animateOnViewport = true,
        animationSpeed = 6,
        gradientDirection = 90,

        // Advanced settings
        pauseOnHover = false,
    } = props

    // Helper function to apply font styles
    const applyFontStyles = (font) => {
        if (!font || typeof font === "string") {
            return {
                fontFamily: font || "Inter",
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                textAlign: "center",
            }
        }

        return {
            fontFamily: font.family || font.fontFamily || "Inter",
            fontSize: font.size || font.fontSize || 48,
            fontWeight: font.weight || font.fontWeight || 700,
            lineHeight: font.lineHeight || 1.2,
            letterSpacing: font.letterSpacing || "-0.02em",
            textAlign: font.alignment || font.textAlign || "center",
        }
    }

    const [isVisible, setIsVisible] = useState(false)
    const [gradientPosition, setGradientPosition] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const textRef = useRef(null)
    const animationRef = useRef(null)

    // Build gradient colors array
    const gradientColors = [color1, color2]
    if (useColor3) gradientColors.push(color3)
    if (useColor4) gradientColors.push(color4)
    if (useColor5) gradientColors.push(color5)

    // Intersection Observer for viewport detection
    useEffect(() => {
        if (!animateOnViewport) {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0.1 }
        )

        if (textRef.current) {
            observer.observe(textRef.current)
        }

        return () => {
            if (textRef.current) {
                observer.unobserve(textRef.current)
            }
        }
    }, [animateOnViewport])

    // Gradient animation
    useEffect(() => {
        if (!isVisible || isPaused) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            return
        }

        let startTime = null
        const animate = (currentTime) => {
            if (startTime === null) startTime = currentTime

            const elapsed = currentTime - startTime
            const progress = (elapsed / (animationSpeed * 1000)) % 1

            const position = Math.sin(progress * Math.PI * 2) * 50
            setGradientPosition(position)

            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isVisible, animationSpeed, isPaused])

    // Create gradient CSS
    const createGradient = () => {
        const colorStops = gradientColors
            .map((color, index) => {
                const position = (index / (gradientColors.length - 1)) * 100
                return `${color} ${position}%`
            })
            .join(", ")

        return `linear-gradient(${gradientDirection}deg, ${colorStops})`
    }

    // Handle mouse events for pause on hover
    const handleMouseEnter = () => {
        if (pauseOnHover) {
            setIsPaused(true)
        }
    }

    const handleMouseLeave = () => {
        if (pauseOnHover) {
            setIsPaused(false)
        }
    }

    // Split text into lines for rendering
    const renderTextWithLineBreaks = () => {
        const lines = text.split("\n")
        return lines.map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < lines.length - 1 && <br />}
            </React.Fragment>
        ))
    }

    const fontStyles = applyFontStyles(textFont)

    // Determine which HTML tag to use
    const TextTag = semanticTag || "h1"

    const containerStyle = {
        display: "inline-block",
        position: "relative",
        textAlign: fontStyles.textAlign,
        width: fontStyles.textAlign === "center" ? "100%" : "auto",
    }

    const textStyle = {
        ...fontStyles,
        margin: 0,
        padding: 0,
        background: createGradient(),
        backgroundSize: `200% 200%`,
        backgroundPosition: `${50 + gradientPosition}% ${50 + gradientPosition}%`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        display: "inline-block",
        transition:
            animateOnViewport && !isVisible ? "opacity 0.6s ease-out" : "none",
        opacity: animateOnViewport ? (isVisible ? 1 : 0.2) : 1,
        cursor: pauseOnHover ? "pointer" : "default",
    }

    return (
        <div
            ref={textRef}
            style={containerStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <TextTag style={textStyle}>{renderTextWithLineBreaks()}</TextTag>
        </div>
    )
}

addPropertyControls(AnimatedGradientText, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "Beautiful Gradient Text",
    },

    semanticTag: {
        type: ControlType.Enum,
        title: "Semantic Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"],
        optionTitles: [
            "H1 (Main Heading)",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "Paragraph",
            "Span",
        ],
        defaultValue: "h1",
    },

    textFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            family: "Inter",
            size: 48,
            weight: "700",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
        },
    },

    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#ff6b6b",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#4ecdc4",
    },
    useColor3: {
        type: ControlType.Boolean,
        title: "Use Color 3",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#45b7d1",
        hidden: (props) => !props.useColor3,
    },
    useColor4: {
        type: ControlType.Boolean,
        title: "Use Color 4",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    color4: {
        type: ControlType.Color,
        title: "Color 4",
        defaultValue: "#96ceb4",
        hidden: (props) => !props.useColor4,
    },
    useColor5: {
        type: ControlType.Boolean,
        title: "Use Color 5",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    color5: {
        type: ControlType.Color,
        title: "Color 5",
        defaultValue: "#feca57",
        hidden: (props) => !props.useColor5,
    },

    animateOnViewport: {
        type: ControlType.Boolean,
        title: "Animate on Viewport",
        defaultValue: true,
        enabledTitle: "On Scroll Into View",
        disabledTitle: "Always Animate",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        min: 2,
        max: 30,
        step: 0.5,
        defaultValue: 6,
        unit: "s",
        displayStepper: true,
    },
    gradientDirection: {
        type: ControlType.Number,
        title: "Gradient Angle",
        min: 0,
        max: 360,
        step: 15,
        defaultValue: 90,
        unit: "°",
        displayStepper: true,
    },

    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
})
