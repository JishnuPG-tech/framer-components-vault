import * as React from "react"
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, createTimer, text, utils } from "https://esm.sh/animejs"

/**
 * GravityTextComponent
 * Applies a “gravity” animation to each letter based on pointer proximity.
 */
function GravityTextComponent(props) {
    const {
        textContent,
        fontFamily,
        fontWeight,
        fontStyle,
        fontSize,
        clampFont,
        fontMin,
        fontMax,
        lineHeight,
        letterSpacing,
        textColor,
        textAlign,
        textTransform,
        maxWidth,
        wrapText,
        radius,
        gravityStrength,
        delay,
        easingFunction,
        animationStagger,
        alignItems,
        justifyContent,
    } = props

    const textRef = useRef()

    useEffect(() => {
        const p = textRef.current
        if (!p) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return

        // Set the paragraph text
        p.innerText = textContent

        // Compute responsive font size if enabled
        const fontSizeValue = clampFont
            ? `clamp(${fontMin}px, 2vw, ${fontMax}px)`
            : `${fontSize}px`

        // Apply main styling to the <p> element
        Object.assign(p.style, {
            fontFamily,
            fontWeight: fontWeight?.toString(),
            fontStyle,
            fontSize: fontSizeValue,
            lineHeight,
            letterSpacing: `${letterSpacing}px`,
            color: textColor,
            textTransform,
            textAlign,
            maxWidth: `${maxWidth}px`,
            whiteSpace: wrapText ? "normal" : "nowrap",
            margin: 0,
        })

        // Split into characters for per-letter animation
        const { chars } = text.split(p, { chars: true })
        const rects = []
        const arts = []

        let pointerX = 0
        let pointerY = 0

        // Measure each letter's position
        const measureChars = ($c, i) => (rects[i] = $c.getBoundingClientRect())

        // Apply per-letter animation when within radius
        const animateChar = ($c, i) => {
            const anim = arts[i]
            if (anim && anim.progress < 0.5) return

            const { left, width, top, height } = rects[i]
            const dx = pointerX - (left + width / 2)
            const dy = pointerY - (top + height / 2)
            const distSq = dx * dx + dy * dy

            if (distSq <= radius * radius) {
                arts[i] = animate($c, {
                    keyframes: [
                        {
                            x: utils.random(-gravityStrength, gravityStrength),
                            y: utils.random(-gravityStrength, gravityStrength),
                        },
                        {
                            x: 0,
                            y: 0,
                            delay,
                            duration: 1000,
                            easing: easingFunction,
                        },
                    ],
                    delay: i * animationStagger,
                })
            }
        }

        // Apply inline block + font styles to chars
        chars.forEach(($c) => {
            Object.assign($c.style, {
                display: "inline-block",
                fontFamily,
                fontWeight: fontWeight?.toString(),
                fontStyle,
                fontSize: fontSizeValue,
                lineHeight,
                letterSpacing: `${letterSpacing}px`,
                color: textColor,
                textTransform,
            })
        })

        chars.forEach(measureChars)
        createTimer({ onUpdate: () => chars.forEach(animateChar) })

        document.addEventListener("pointermove", (e) => {
            pointerX = e.clientX
            pointerY = e.clientY
        })
        window.addEventListener("resize", () => chars.forEach(measureChars))

        return () => {
            document.removeEventListener("pointermove", () => {})
        }
    }, [
        textContent,
        fontFamily,
        fontWeight,
        fontStyle,
        fontSize,
        clampFont,
        fontMin,
        fontMax,
        lineHeight,
        letterSpacing,
        textColor,
        textAlign,
        textTransform,
        maxWidth,
        wrapText,
        radius,
        gravityStrength,
        delay,
        easingFunction,
        animationStagger,
    ])

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems,
                justifyContent,
                width: "100%",
                height: "100%",
                padding: "1rem",
            }}
        >
            <p ref={textRef}></p>
        </div>
    )
}

addPropertyControls(GravityTextComponent, {
    textContent: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true, // Allows multi-line input
        defaultValue: "Gravity affects every letter.",
        description: "Enter the text to animate—supports multiple lines.",
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font Family",
        options: [
            "Inter",
            "Poppins",
            "Montserrat",
            "Playfair Display",
            "Lora",
            "Satoshi",
            "Urbanist",
            "Work Sans",
            "Roboto",
            "Georgia",
            "Arial",
            "Courier New",
        ],
        defaultValue: "Inter",
        description: "Choose from common system or Google fonts.",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 400,
        description: "Thickness of the font. Use standard font-weight numbers.",
    },
    fontStyle: {
        type: ControlType.Enum,
        title: "Font Style",
        options: ["normal", "italic"],
        defaultValue: "normal",
        description: "Normal or italic font style.",
    },
    clampFont: {
        type: ControlType.Boolean,
        title: "Responsive Font",
        defaultValue: false,
        description: "Enable fluid font sizing using clamp().",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Fixed Size (px)",
        min: 8,
        max: 128,
        defaultValue: 24,
        hidden: (props) => props.clampFont,
        description: "When not responsive, this sets font size in pixels.",
    },
    fontMin: {
        type: ControlType.Number,
        title: "Min Size (px)",
        min: 6,
        max: 64,
        defaultValue: 14,
        hidden: (props) => !props.clampFont,
        description: "Minimum size when using clamp().",
    },
    fontMax: {
        type: ControlType.Number,
        title: "Max Size (px)",
        min: 14,
        max: 128,
        defaultValue: 48,
        hidden: (props) => !props.clampFont,
        description: "Maximum size when using clamp().",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.5,
        max: 3,
        step: 0.1,
        defaultValue: 1.5,
        description: "Vertical spacing between lines.",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing (px)",
        min: -5,
        max: 10,
        step: 0.1,
        defaultValue: 0,
        description: "Horizontal space between letters.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        description: "Color of the text.",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        defaultValue: "center",
        description: "Horizontal alignment of text block.",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        defaultValue: "none",
        description: "Text capitalization option.",
    },
    wrapText: {
        type: ControlType.Boolean,
        title: "Wrap Text",
        defaultValue: true,
        description: "Allow lines to wrap within the container.",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width (px)",
        min: 100,
        max: 1600,
        defaultValue: 800,
        description: "Maximum width of the text container.",
    },
    radius: {
        type: ControlType.Number,
        title: "Trigger Radius (px)",
        min: 10,
        max: 300,
        defaultValue: 60,
        description: "Circle radius around pointer that triggers animation.",
    },
    gravityStrength: {
        type: ControlType.Number,
        title: "Gravity Strength (px)",
        min: 1,
        max: 200,
        defaultValue: 40,
        description: "Distance each letter moves when triggered.",
    },
    delay: {
        type: ControlType.Number,
        title: "Return Delay (ms)",
        min: 0,
        max: 3000,
        defaultValue: 500,
        unit: "ms",
        description: "Delay before letters return to original position.",
    },
    easingFunction: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeInOutQuad", "easeOutExpo", "easeInBack"],
        defaultValue: "easeInOutQuad",
        description: "Easing curve for letters returning.",
    },
    animationStagger: {
        type: ControlType.Number,
        title: "Stagger (ms)",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "ms",
        description: "Delay between each letter's animation.",
    },
    alignItems: {
        type: ControlType.SegmentedEnum,
        title: "Align Items",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        description: "Vertical alignment of the wrapped paragraph.",
    },
    justifyContent: {
        type: ControlType.SegmentedEnum,
        title: "Justify Content",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "center",
        description: "Horizontal alignment of the wrapped paragraph.",
    },
})

export default GravityTextComponent
