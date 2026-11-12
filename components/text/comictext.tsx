// Convert the provided ComicText React code into a Framer component with property controls and the same comic-book text animation.

import * as React from "react"
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

type ComicTextProps = {
    text: string
    font: any
    fontSizeRem: number
    skewDeg: number

    outlineColor: string
    outlineThicknessFactor: number

    dotColor: string
    fillColor: string
    dotSize: number
    dotSpacing: number

    shadow1: string
    shadow2: string

    animateOnAppear: boolean
    duration: number

    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ComicText(props: ComicTextProps) {
    const {
        text,
        font,
        fontSizeRem,
        skewDeg,
        outlineColor,
        outlineThicknessFactor,
        dotColor,
        fillColor,
        dotSize,
        dotSpacing,
        shadow1,
        shadow2,
        animateOnAppear,
        duration,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = React.useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { amount: 0.3, once: true })

    const safeText = typeof text === "string" ? text : String(text ?? "")

    const strokePx = Math.max(0, fontSizeRem * outlineThicknessFactor)

    const filterValue = React.useMemo(() => {
        const s1 = (shadow1 || "").trim()
        const s2 = (shadow2 || "").trim()

        const parts = [
            s1 ? `drop-shadow(${s1})` : "",
            s2 ? `drop-shadow(${s2})` : "",
        ].filter(Boolean)

        return parts.length ? parts.join(" ") : "none"
    }, [shadow1, shadow2])

    const backgroundImage = React.useMemo(() => {
        const sizePx = Math.max(0, dotSize)
        return `radial-gradient(circle at ${sizePx}px ${sizePx}px, ${dotColor} ${sizePx}px, transparent 0)`
    }, [dotColor, dotSize])

    const backgroundSize = React.useMemo(() => {
        const spacing = Math.max(1, dotSpacing)
        return `${spacing}px ${spacing}px`
    }, [dotSpacing])

    const baseTextStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...font,
            fontSize: `${fontSizeRem}rem`,
            fontWeight: 900,
            textTransform: "uppercase",
            transform: `skewX(${-skewDeg}deg)`,
            WebkitTextStroke: `${strokePx}px ${outlineColor}`,
            filter: filterValue,

            backgroundColor: fillColor,
            backgroundImage,
            backgroundSize,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",

            display: "inline-block",
            lineHeight: "1",
            whiteSpace: "pre",
            width: "max-content",
            userSelect: "none",
        }),
        [
            font,
            fontSizeRem,
            skewDeg,
            strokePx,
            outlineColor,
            filterValue,
            fillColor,
            backgroundImage,
            backgroundSize,
        ]
    )

    const shouldAnimate = animateOnAppear && !isStatic

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width: "max-content",
                height: "max-content",
                textAlign: "center",
                ...style,
            }}
        >
            <motion.div
                style={baseTextStyle}
                initial={shouldAnimate ? { opacity: 0, scale: 0.8, rotate: -2 } : false}
                animate={
                    shouldAnimate
                        ? inView
                            ? { opacity: 1, scale: 1, rotate: 0 }
                            : { opacity: 0, scale: 0.8, rotate: -2 }
                        : { opacity: 1, scale: 1, rotate: 0 }
                }
                transition={
                    shouldAnimate
                        ? {
                              duration: Math.max(0.05, duration),
                              ease: [0.175, 0.885, 0.32, 1.275],
                              type: "spring",
                          }
                        : undefined
                }
                aria-label={safeText}
            >
                {safeText}
            </motion.div>
        </div>
    )
}

addPropertyControls(ComicText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "BANG Bang!",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: false,
        defaultValue: {
            variant: "Black",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },
    fontSizeRem: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 5,
        min: 0.5,
        max: 12,
        step: 0.1,
        unit: "rem",
    },
    skewDeg: {
        type: ControlType.Number,
        title: "Skew",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "deg",
    },

    outlineColor: {
        type: ControlType.Color,
        title: "Outline",
        defaultValue: "#000000",
    },
    outlineThicknessFactor: {
        type: ControlType.Number,
        title: "Outline Thick",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
    },

    fillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#FACC15",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dots",
        defaultValue: "#EF4444",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 0.25,
        unit: "px",
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Dot Space",
        defaultValue: 8,
        min: 2,
        max: 30,
        step: 1,
        unit: "px",
    },

    shadow1: {
        type: ControlType.String,
        title: "Shadow 1",
        defaultValue: "5px 5px 0px #000000",
        placeholder: "e.g. 5px 5px 0px #000",
    },
    shadow2: {
        type: ControlType.String,
        title: "Shadow 2",
        defaultValue: "3px 3px 0px #EF4444",
        placeholder: "e.g. 3px 3px 0px red",
    },

    animateOnAppear: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.6,
        min: 0.05,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: (p) => !p.animateOnAppear,
    },
})