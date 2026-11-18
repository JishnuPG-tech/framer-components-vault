import { startTransition, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

// User request: Create a new Framer code component named "JumpingText" as a self-contained animated text widget using React + framer-motion, per-letter staggered jump animation, preserved fixed-width spaces, in-view + mounted animation gating, and full property controls for typography and transition behavior.

interface MyComponentProps {
    text: string
    font: {
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number
        fontStyle?: "normal" | "italic"
        letterSpacing?: number | string
        lineHeight?: number | string
    }
    fontFamily: string
    fontWeight: number
    color: string
    jump: number
    duration: number
    stagger: number
    loop: boolean
    transitionType: "Tween" | "Spring"
    ease:
        | "Ease In Out"
        | "Ease In"
        | "Ease Out"
        | "Linear"
        | "Anticipate"
        | "Circ In Out"
        | "Back In Out"
        | "Custom"
    p1x: number
    p1y: number
    p2x: number
    p2y: number
    bounce: number
    repeatDelay: number
    repeatType: "Loop" | "Mirror"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function JumpingText(props: MyComponentProps) {
    const {
        text,
        font,
        fontFamily,
        fontWeight,
        color,
        jump,
        duration,
        stagger,
        loop,
        transitionType,
        ease,
        p1x,
        p1y,
        p2x,
        p2y,
        bounce,
        repeatDelay,
        repeatType,
        style,
    } = props

    const [mounted, setMounted] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const inView = useInView(containerRef, { amount: 0.2 })
    const isStaticRenderer = useIsStaticRenderer()

    useEffect(() => {
        startTransition(() => setMounted(true))
    }, [])

    const shouldAnimate = mounted && inView && !isStaticRenderer

    const resolvedEase = useMemo(() => {
        if (ease === "Custom") return [p1x, p1y, p2x, p2y] as [number, number, number, number]
        if (ease === "Ease In") return "easeIn"
        if (ease === "Ease Out") return "easeOut"
        if (ease === "Linear") return "linear"
        if (ease === "Anticipate") return "anticipate"
        if (ease === "Circ In Out") return "circInOut"
        if (ease === "Back In Out") return "backInOut"
        return "easeInOut"
    }, [ease, p1x, p1y, p2x, p2y])

    const resolvedRepeatType = useMemo(() => {
        return repeatType === "Mirror" ? "mirror" : "loop"
    }, [repeatType])

    const characters = useMemo(() => text.split(""), [text])

    const resolvedFontFamily = font?.fontFamily ?? fontFamily
    const resolvedFontWeight = font?.fontWeight ?? fontWeight

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "inline-flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                width: "fit-content",
                maxWidth: "100%",
                color,
                fontFamily: resolvedFontFamily,
                fontSize: font?.fontSize,
                fontWeight: resolvedFontWeight,
                fontStyle: font?.fontStyle,
                letterSpacing: font?.letterSpacing,
                lineHeight: font?.lineHeight,
                ...style,
            }}
        >
            {characters.map((char, index) => {
                if (char === " ") {
                    return (
                        <span
                            key={`space-${index}`}
                            aria-hidden="true"
                            style={{
                                display: "inline-block",
                                width: "0.3em",
                                minWidth: "0.3em",
                            }}
                        />
                    )
                }

                if (!shouldAnimate) {
                    return (
                        <span
                            key={`char-static-${index}`}
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                transform: "translateY(0px)",
                            }}
                        >
                            {char}
                        </span>
                    )
                }

                if (transitionType === "Spring") {
                    return (
                        <motion.span
                            key={`char-spring-${index}`}
                            style={{ display: "inline-block", whiteSpace: "pre" }}
                            initial={{ y: 0 }}
                            animate={{ y: -jump }}
                            transition={{
                                type: "spring",
                                bounce,
                                duration,
                                delay: index * stagger,
                                repeat: loop ? Infinity : 0,
                                repeatType: "mirror",
                                repeatDelay,
                            }}
                        >
                            {char}
                        </motion.span>
                    )
                }

                return (
                    <motion.span
                        key={`char-tween-${index}`}
                        style={{ display: "inline-block", whiteSpace: "pre" }}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -jump, 0] }}
                        transition={{
                            type: "tween",
                            ease: resolvedEase,
                            duration,
                            delay: index * stagger,
                            repeat: loop ? Infinity : 0,
                            repeatType: resolvedRepeatType,
                            repeatDelay,
                        }}
                    >
                        {char}
                    </motion.span>
                )
            })}
        </div>
    )
}

addPropertyControls(JumpingText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Jumping Text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 48,
            variant: "Bold",
            lineHeight: "1.1em",
            letterSpacing: "-0.02em",
        },
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family Fallback",
        defaultValue: "Inter",
        hidden: () => true,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight Fallback",
        defaultValue: 700,
        min: 100,
        max: 900,
        step: 100,
        hidden: () => true,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    jump: {
        type: ControlType.Number,
        title: "Jump",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.05,
        min: 0,
        max: 2,
        step: 0.01,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition",
        defaultValue: "Tween",
        options: ["Tween", "Spring"],
    },
    ease: {
        type: ControlType.Enum,
        title: "Ease",
        defaultValue: "Ease In Out",
        options: [
            "Ease In Out",
            "Ease In",
            "Ease Out",
            "Linear",
            "Anticipate",
            "Circ In Out",
            "Back In Out",
            "Custom",
        ],
        hidden: (props) => props.transitionType !== "Tween",
    },
    p1x: {
        type: ControlType.Number,
        title: "P1 X",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.transitionType !== "Tween" || props.ease !== "Custom",
    },
    p1y: {
        type: ControlType.Number,
        title: "P1 Y",
        defaultValue: 0.1,
        min: -2,
        max: 2,
        step: 0.01,
        hidden: (props) => props.transitionType !== "Tween" || props.ease !== "Custom",
    },
    p2x: {
        type: ControlType.Number,
        title: "P2 X",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.transitionType !== "Tween" || props.ease !== "Custom",
    },
    p2y: {
        type: ControlType.Number,
        title: "P2 Y",
        defaultValue: 1,
        min: -2,
        max: 2,
        step: 0.01,
        hidden: (props) => props.transitionType !== "Tween" || props.ease !== "Custom",
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.transitionType !== "Spring",
    },
    repeatDelay: {
        type: ControlType.Number,
        title: "Repeat Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
    },
    repeatType: {
        type: ControlType.Enum,
        title: "Repeat",
        defaultValue: "Loop",
        options: ["Loop", "Mirror"],
    },
})