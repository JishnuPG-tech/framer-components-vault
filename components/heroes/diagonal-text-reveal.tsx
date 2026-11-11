import React, { useRef, useState, useLayoutEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform } from "framer-motion"

/**
 * DiagonalTextReveal - by Bart Ocieczek | [www.bartocieczek.com](https://www.bartocieczek.com)
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 */
export default function DiagonalTextReveal(props) {
    const {
        text,
        font,
        color,
        dimColor,
        lineHeight,
        align,
        scrollStart,
        scrollEnd,
        revealSpread,
        direction,
        style,
    } = props

    const containerRef = useRef(null)
    const wordRefs = useRef([])

    const words = text.split(" ")

    const [diag, setDiag] = useState([])

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return

        const wy = direction / 100
        const wx = 1 - wy

        const measure = () => {
            const cRect = container.getBoundingClientRect()
            const w = cRect.width || 1
            const h = cRect.height || 1

            const values = wordRefs.current.map((el) => {
                if (!el) return 0
                const r = el.getBoundingClientRect()
                const cx = r.left - cRect.left + r.width / 2
                const cy = r.top - cRect.top + r.height / 2
                return wx * (cx / w) + wy * (cy / h)
            })

            setDiag(values)
        }

        measure()

        const ro = new ResizeObserver(measure)
        ro.observe(container)
        return () => ro.disconnect()
    }, [text, font, lineHeight, align, direction])

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: [`start ${scrollStart}`, `end ${scrollEnd}`],
    })

    const windowSize = revealSpread / 100

    return (
        <div
            ref={containerRef}
            style={{
                ...font,
                color: color,
                lineHeight: lineHeight,
                textAlign: align,
                display: "block",
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            {words.map((word, i) => (
                <Word
                    key={i}
                    ref={(el) => (wordRefs.current[i] = el)}
                    progress={scrollYProgress}
                    diag={diag[i] ?? i / words.length}
                    windowSize={windowSize}
                    color={color}
                    dimColor={dimColor}
                >
                    {word}
                </Word>
            ))}
        </div>
    )
}

const Word = React.forwardRef(function Word(
    { progress, diag, windowSize, color, dimColor, children },
    ref
) {
    const start = diag * (1 - windowSize)
    const end = start + windowSize

    const opacity = useTransform(progress, [start, end], [0.15, 1])
    const wordColor = useTransform(progress, [start, end], [dimColor, color])

    return (
        <motion.span
            ref={ref}
            style={{
                opacity,
                color: wordColor,
                display: "inline-block",
                marginRight: "0.25em",
                whiteSpace: "pre",
            }}
        >
            {children}
        </motion.span>
    )
})

DiagonalTextReveal.defaultProps = {
    text: "Reveal from any direction. Animate text horizontally, vertically, diagonally, or at any custom angle. Fine-tune every movement to create transitions that perfectly match your design.",
    color: "#F5F5F5",
    dimColor: "#3A3A3A",
    lineHeight: 1.2,
    align: "left",
    scrollStart: "0.85",
    scrollEnd: "0.4",
    revealSpread: 30,
    direction: 50,
}

addPropertyControls(DiagonalTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: DiagonalTextReveal.defaultProps.text,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: "-0.02em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#F5F5F5",
    },
    dimColor: {
        type: ControlType.Color,
        title: "Dim Color",
        defaultValue: "#3A3A3A",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.8,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.2,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
    revealSpread: {
        type: ControlType.Number,
        title: "Softness (%)",
        min: 5,
        max: 80,
        step: 1,
        defaultValue: 30,
        description:
            "How wide the reveal wave is. Higher = softer, more overlapping diagonal transition.",
    },
    direction: {
        type: ControlType.Number,
        title: "Direction",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        displayStepper: false,
        description:
            "0 = horizontal (left→right), 50 = diagonal (top-left→bottom-right), 100 = vertical (top→bottom).",
    },
    scrollStart: {
        type: ControlType.Enum,
        title: "Start",
        options: ["1", "0.85", "0.7", "0.5"],
        optionTitles: ["Screen Bottom", "Lower", "Mid-Bottom", "Center"],
        defaultValue: "0.85",
        description: "When the reveal begins (position in viewport).",
    },
    scrollEnd: {
        type: ControlType.Enum,
        title: "End",
        options: ["0.5", "0.4", "0.25", "0"],
        optionTitles: ["Center", "Mid-Top", "Higher", "Screen Top"],
        defaultValue: "0.4",
        description: "When the text is fully revealed.",
    },
})
