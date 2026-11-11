// ==========================================
// Text Stagger Hover Component
// Made with 💛 by Karim Saif
// ==========================================

import * as React from "react"
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


export type StaggerDirection = "start" | "middle" | "end"
export type AnimationType =
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "zoom"
    | "blur"
export type CursorType = "pointer" | "default" | "text"

/**
 * Calculates symmetric stagger delay across individual characters.
 */
function calculateStaggerDelay(
    direction: StaggerDirection = "start",
    staggerValue: number = 0.02,
    totalItems: number,
    index: number
): number {
    if (totalItems <= 1) return 0

    switch (direction) {
        case "start":
            return index * staggerValue
        case "middle": {
            const center = (totalItems - 1) / 2
            return Math.abs(index - center) * staggerValue
        }
        case "end":
            return (totalItems - 1 - index) * staggerValue
        default:
            return 0
    }
}

// Module-level cached segmenter instance to avoid recreation on re-renders
const graphemeSegmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null

/**
 * Grapheme-safe string splitter preserving combined emojis and complex characters.
 */
function getCharacters(text: string): string[] {
    if (!text) return []
    if (graphemeSegmenter) {
        return Array.from(
            graphemeSegmenter.segment(text),
            (item) => item.segment
        )
    }
    return Array.from(text)
}

function useAnimationVariants(
    animation: AnimationType,
    blurAmount: number = 8
) {
    return React.useMemo(
        () => ({
            hidden: {
                x:
                    animation === "left"
                        ? "-100%"
                        : animation === "right"
                          ? "100%"
                          : 0,
                y:
                    animation === "top"
                        ? "-100%"
                        : animation === "bottom"
                          ? "100%"
                          : 0,
                scale: animation === "zoom" ? 0 : 1,
                filter:
                    animation === "blur"
                        ? `blur(${blurAmount}px)`
                        : "blur(0px)",
                opacity: 0,
            },
            visible: {
                x: 0,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                opacity: 1,
            },
        }),
        [animation, blurAmount]
    )
}

// ==========================================
// Main Component Engine
// Made with 💛 by Karim Saif
// ==========================================

interface FramerTextStaggerProps {
    text: string
    exitAnimation: AnimationType
    enterAnimation: AnimationType
    staggerDirection: StaggerDirection
    staggerDelay: number
    duration: number
    blurAmount: number
    textColor: string
    hoverColor: string
    fontSize: number
    fontWeight: number
    letterSpacing: number
    textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
    cursor: CursorType
    focusable: boolean
    selectable: boolean
    ariaLabel: string
    style?: React.CSSProperties
}

export default function TextStaggerHover(props: FramerTextStaggerProps) {
    const {
        text = "Hover Effect",
        exitAnimation = "top",
        enterAnimation = "bottom",
        staggerDirection = "start",
        staggerDelay = 0.02,
        duration = 0.3,
        blurAmount = 8,
        textColor = "#1e293b",
        hoverColor = "#6366f1",
        fontSize = 32,
        fontWeight = 700,
        letterSpacing = 0,
        textTransform = "uppercase",
        cursor = "pointer",
        focusable = false,
        selectable = false,
        ariaLabel = "",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [isHovered, setIsHovered] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const isActive = isHovered || (focusable && isFocused)
    const shouldAnimate = !isStatic && isActive

    const characters = React.useMemo(() => getCharacters(text), [text])
    const totalItems = characters.length

    const delays = React.useMemo(() => {
        return characters.map((_, index) =>
            calculateStaggerDelay(
                staggerDirection,
                staggerDelay,
                totalItems,
                index
            )
        )
    }, [staggerDirection, staggerDelay, totalItems, characters])

    const exitVariants = useAnimationVariants(exitAnimation, blurAmount)
    const enterVariants = useAnimationVariants(enterAnimation, blurAmount)

    const containerStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        display: "inline-flex",
        overflow: "hidden",
        cursor,
        fontSize: `${fontSize}px`,
        fontWeight,
        letterSpacing: `${letterSpacing}px`,
        textTransform,
        userSelect: selectable ? "text" : "none",
        WebkitUserSelect: selectable ? "text" : "none",
        lineHeight: 1.2,
    }

    const layerStyle: React.CSSProperties = {
        display: "inline-flex",
        whiteSpace: "pre",
    }

    const charStyle: React.CSSProperties = {
        display: "inline-block",
        transformOrigin: "center center",
    }

    return (
        <span
            style={containerStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={focusable ? () => setIsFocused(true) : undefined}
            onBlur={focusable ? () => setIsFocused(false) : undefined}
            tabIndex={focusable ? 0 : undefined}
            aria-label={ariaLabel || text}
        >
            {/* Exit Layer (Base) */}
            <span
                style={{ ...layerStyle, color: textColor }}
                aria-hidden="true"
            >
                {characters.map((char, index) => (
                    <motion.span
                        key={`exit-${char}-${index}`}
                        style={charStyle}
                        variants={exitVariants}
                        animate={shouldAnimate ? "hidden" : "visible"}
                        transition={{
                            delay: delays[index],
                            ease: [0.25, 0.46, 0.45, 0.94],
                            duration,
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </span>

            {/* Enter Layer (Target) */}
            <span
                style={{
                    ...layerStyle,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    color: hoverColor,
                }}
                aria-hidden="true"
            >
                {characters.map((char, index) => (
                    <motion.span
                        key={`enter-${char}-${index}`}
                        style={charStyle}
                        variants={enterVariants}
                        animate={shouldAnimate ? "visible" : "hidden"}
                        transition={{
                            delay: delays[index],
                            ease: [0.25, 0.46, 0.45, 0.94],
                            duration,
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </span>
        </span>
    )
}

// ==========================================
// Property Controls Configuration
// Made with 💛 by Karim Saif
// ==========================================

addPropertyControls(TextStaggerHover, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover Effect",
        description:
            "Text string to animate. Best suited for short titles, buttons, and navigation items.",
    },
    exitAnimation: {
        type: ControlType.Enum,
        title: "Exit",
        defaultValue: "top",
        options: ["top", "bottom", "left", "right", "zoom", "blur"],
        optionTitles: [
            "Up (Top)",
            "Down (Bottom)",
            "Left",
            "Right",
            "Zoom",
            "Blur",
        ],
        description: "Animation style for the exiting text.",
    },
    enterAnimation: {
        type: ControlType.Enum,
        title: "Enter",
        defaultValue: "bottom",
        options: ["top", "bottom", "left", "right", "zoom", "blur"],
        optionTitles: [
            "Up (Top)",
            "Down (Bottom)",
            "Left",
            "Right",
            "Zoom",
            "Blur",
        ],
        description: "Animation style for the incoming text.",
    },
    staggerDirection: {
        type: ControlType.Enum,
        title: "Stagger",
        defaultValue: "start",
        options: ["start", "middle", "end"],
        optionTitles: ["Start to End", "Center Out", "End to Start"],
        description: "Flow direction of the staggered letter transitions.",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.02,
        min: 0,
        max: 0.2,
        step: 0.005,
        displayStepper: true,
        unit: "s",
        description: "Delay increment applied to each adjacent letter.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.3,
        min: 0.05,
        max: 2,
        step: 0.05,
        displayStepper: true,
        unit: "s",
        description:
            "Duration of the transition for each individual character.",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Size",
        defaultValue: 8,
        min: 1,
        max: 30,
        step: 1,
        unit: "px",
        description: "Radius in pixels used when Blur animation is selected.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Default Color",
        defaultValue: "#1e293b",
        description: "Initial resting color of the text.",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#6366f1",
        description: "Accent color when hovered or focused.",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 32,
        min: 8,
        max: 120,
        step: 1,
        unit: "px",
        description: "Size of the typography.",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 700,
        min: 100,
        max: 900,
        step: 100,
        description: "Thickness of the font typeface.",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        defaultValue: "uppercase",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        description: "Letter casing transformation applied to the content.",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 0,
        min: -5,
        max: 20,
        step: 0.5,
        unit: "px",
        description: "Horizontal tracking between characters.",
    },
    cursor: {
        type: ControlType.Enum,
        title: "Cursor",
        defaultValue: "pointer",
        options: ["pointer", "default", "text"],
        optionTitles: ["Pointer", "Default", "Text"],
        description: "Mouse cursor appearance on hover.",
    },
    selectable: {
        type: ControlType.Boolean,
        title: "Selectable",
        defaultValue: false,
        description: "Allow visitors to highlight and copy the text.",
    },
    focusable: {
        type: ControlType.Boolean,
        title: "Focusable",
        defaultValue: false,
        description: "Allow keyboard focus to trigger the hover animation.",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Text Stagger",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
