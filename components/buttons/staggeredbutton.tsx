// Button component with staggered letter animation on hover
// Each letter slides up and is replaced by a duplicate sliding in from below
// Staggered timing creates a wave effect across the text

import { motion } from "framer-motion"
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

interface StaggeredButtonProps {
    text: string
    font: CSSProperties
    backgroundColor: string
    textColor: string
    paddingX: number
    paddingY: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    animationDuration: number
    staggerDelay: number
    easing: string
    direction: "up" | "down"
    variant: "desktop" | "tablet" | "mobile"
    link?: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function StaggeredButton(props: StaggeredButtonProps) {
    const {
        text,
        font,
        backgroundColor,
        textColor,
        paddingX,
        paddingY,
        borderRadius,
        borderWidth,
        borderColor,
        animationDuration,
        staggerDelay,
        easing,
        direction,
        variant,
        link,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const letters = text.split("")

    const isFillWidth = style && style.width === "100%"
    const isFillHeight = style && style.height === "100%"

    const containerStyle: CSSProperties = {
        ...style,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        ...(isFillWidth ? {} : { width: "max-content" }),
        ...(isFillHeight ? {} : { height: "max-content" }),
    }

    // Static button for tablet/mobile (no animation)
    if (variant === "tablet" || variant === "mobile") {
        const staticButtonContent = (
            <button
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingLeft: paddingX,
                    paddingRight: paddingX,
                    paddingTop: paddingY,
                    paddingBottom: paddingY,
                    borderRadius,
                    border: `${borderWidth}px solid ${borderColor}`,
                    cursor: "pointer",
                    backgroundColor,
                    ...font,
                    color: textColor,
                }}
            >
                {text}
            </button>
        )

        const wrappedStatic = link ? (
            <a href={link} style={{ textDecoration: "none", display: "inline-block" }} target="_blank" rel="noopener noreferrer">
                {staticButtonContent}
            </a>
        ) : (
            staticButtonContent
        )

        return <div style={containerStyle}>{wrappedStatic}</div>
    }

    // Animated button for desktop
    const buttonContent = (
        <motion.button
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: paddingX,
                paddingRight: paddingX,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                borderRadius,
                border: `${borderWidth}px solid ${borderColor}`,
                cursor: "pointer",
                overflow: "visible",
                backgroundColor,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    ...font,
                }}
            >
                {letters.map((letter, index) => (
                    <div
                        key={index}
                        style={{
                            position: "relative",
                            display: "inline-block",
                            overflow: "hidden",
                        }}
                    >
                        <span
                            style={{
                                visibility: "hidden",
                                display: "inline-block",
                                whiteSpace: letter === " " ? "pre" : "normal",
                                color: textColor,
                            }}
                            aria-hidden="true"
                        >
                            {letter === " " ? "\u00A0" : letter}
                        </span>
                        <motion.span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: textColor,
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                            initial={{
                                y: "0%",
                            }}
                            animate={{
                                y: isHovered
                                    ? direction === "up"
                                        ? "-120%"
                                        : "120%"
                                    : "0%",
                            }}
                            transition={{
                                duration: animationDuration,
                                ease: easing === "easeInOut" ? [0.25, 0.1, 0.25, 1] : easing,
                                delay: index * staggerDelay,
                            }}
                        >
                            {letter === " " ? "\u00A0" : letter}
                        </motion.span>
                        <motion.span
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: textColor,
                            }}
                            initial={{
                                y: direction === "up" ? "120%" : "-120%",
                            }}
                            animate={{
                                y: isHovered
                                    ? "0%"
                                    : direction === "up"
                                    ? "120%"
                                    : "-120%",
                            }}
                            transition={{
                                duration: animationDuration,
                                ease: easing === "easeInOut" ? [0.25, 0.1, 0.25, 1] : easing,
                                delay: index * staggerDelay,
                            }}
                        >
                            {letter === " " ? "\u00A0" : letter}
                        </motion.span>
                    </div>
                ))}
            </div>
        </motion.button>
    )

    const wrappedAnimated = link ? (
        <a href={link} style={{ textDecoration: "none", display: "inline-block" }} target="_blank" rel="noopener noreferrer">
            {buttonContent}
        </a>
    ) : (
        buttonContent
    )

    return <div style={containerStyle}>{wrappedAnimated}</div>
}

addPropertyControls(StaggeredButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Contact",
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        defaultValue: "desktop",
        options: ["desktop", "tablet", "mobile"],
        optionTitles: ["Desktop", "Tablet", "Mobile"],
        displaySegmentedControl: true,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ variant }) => variant === "tablet" || variant === "mobile",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.03,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: "s",
        hidden: ({ variant }) => variant === "tablet" || variant === "mobile",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeInOut",
        options: [
            "linear",
            "easeIn",
            "easeOut",
            "easeInOut",
            "circIn",
            "circOut",
            "circInOut",
            "backIn",
            "backOut",
            "backInOut",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Circ In",
            "Circ Out",
            "Circ In Out",
            "Back In",
            "Back Out",
            "Back In Out",
        ],
        hidden: ({ variant }) => variant === "tablet" || variant === "mobile",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "up",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        displaySegmentedControl: true,
        hidden: ({ variant }) => variant === "tablet" || variant === "mobile",
    },
})