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
 * ContactButton
 *
 * Staggered letter-slide hover button, recreated from an inspected
 * "CONTACT" nav link. Each letter is a masked cell holding two stacked
 * copies of the character; on hover the primary letter slides out to the
 * left (skewed) while a duplicate slides in from the right, with an
 * incremental delay per letter so the motion ripples across the word.
 *
 * All colors — button background, text, and their hover states — plus
 * the label itself, are exposed as Framer property controls.
 */
export default function ContactButton(props) {
    const {
        text,
        link,
        openInNewTab,
        backgroundColor,
        textColor,
        hoverBackgroundColor,
        hoverTextColor,
        borderRadius,
        fontSize,
        fontWeight,
        paddingX,
        height,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hoverState, setHoverState] = useState(false)
    // Force the resting (non-hover) look whenever we're rendering statically
    // (canvas thumbnail, export, PDF, etc.) so no transition ever kicks in.
    const isHovered = isStatic ? false : hoverState
    const letters = text.split("")

    const currentBg = isHovered ? hoverBackgroundColor : backgroundColor
    const currentText = isHovered ? hoverTextColor : textColor

    const bgTransition = isStatic
        ? "none"
        : "background-color 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
    const letterTransition = isStatic
        ? "none"
        : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), color 0.4s ease"

    return (
        <a
            href={link}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
            onMouseEnter={isStatic ? undefined : () => setHoverState(true)}
            onMouseLeave={isStatic ? undefined : () => setHoverState(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height,
                padding: `0 ${paddingX}px`,
                textDecoration: "none",
                cursor: "pointer",
                backgroundColor: currentBg,
                borderRadius,
                transition: bgTransition,
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", flexDirection: "row" }}>
                {letters.map((char, i) => {
                    const delay = `${i * 0.015}s`
                    // Alternate direction per letter: even index (0, 2, 4…)
                    // flips to the right, odd index (1, 3, 5…) flips to the left.
                    const goesRight = i % 2 === 0
                    const outTransform = goesRight
                        ? "translateX(105%) skewX(-10deg)"
                        : "translateX(-105%) skewX(10deg)"
                    const inStartTransform = goesRight
                        ? "translateX(-105%) skewX(10deg)"
                        : "translateX(105%) skewX(-10deg)"

                    return (
                        <span
                            key={i}
                            style={{
                                position: "relative",
                                overflow: "hidden",
                                display: "block",
                                height: fontSize * 1.5,
                            }}
                        >
                            {/* Primary letter, visible by default */}
                            <span
                                style={{
                                    display: "inline-block",
                                    color: currentText,
                                    fontSize,
                                    fontWeight,
                                    fontFamily: "inherit",
                                    lineHeight: `${fontSize * 1.5}px`,
                                    transition: letterTransition,
                                    transitionDelay: isStatic ? "0s" : delay,
                                    transform: isHovered
                                        ? outTransform
                                        : "translateX(0%) skewX(0deg)",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>

                            {/* Duplicate letter, slides in from the opposite side */}
                            <span
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    display: "inline-block",
                                    color: currentText,
                                    fontSize,
                                    fontWeight,
                                    fontFamily: "inherit",
                                    lineHeight: `${fontSize * 1.5}px`,
                                    transition: letterTransition,
                                    transitionDelay: isStatic ? "0s" : delay,
                                    transform: isHovered
                                        ? "translateX(0%) skewX(0deg)"
                                        : inStartTransform,
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>
                        </span>
                    )
                })}
            </div>
        </a>
    )
}

ContactButton.defaultProps = {
    text: "CONTACT",
    link: "#",
    openInNewTab: false,
    backgroundColor: "rgba(0,0,0,0)",
    textColor: "#faf5f0",
    hoverBackgroundColor: "#f40c3f",
    hoverTextColor: "#faf5f0",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    paddingX: 10,
    height: 50,
}

addPropertyControls(ContactButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "CONTACT",
    },
    link: {
        type: ControlType.String,
        title: "Link",
        defaultValue: "#",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#faf5f0",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#f40c3f",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#faf5f0",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        defaultValue: 999,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 48,
        defaultValue: 12,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: [400, 500, 600, 700, 800],
        optionTitles: ["Regular", "Medium", "Semibold", "Bold", "Extrabold"],
        defaultValue: 600,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 80,
        defaultValue: 10,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 24,
        max: 120,
        defaultValue: 50,
    },
})
