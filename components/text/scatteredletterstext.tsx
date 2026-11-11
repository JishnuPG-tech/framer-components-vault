// Instructions: Create a text component where only the hovered character breaks apart and scatters slightly. Split text into characters, keep spacing, inline layout. Only hovered character animates using repeating offset/rotation pattern. Customizable: text, font size (via Font control), color, hover movement intensity, rotation intensity, duration. No random(), reliable in Framer Workshop.
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

import { motion } from "framer-motion"

type Offset = { x: number; y: number; r: number }

type FontControl = {
    fontSize?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    textAlign?: "left" | "center" | "right"
    fontFamily?: string
    fontWeight?: number
    fontStyle?: string
}

type Props = {
    text: string
    font: FontControl
    color: string
    hoverIntensity: number
    rotationIntensity: number
    duration: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScatteredLettersText(props: Props) {
    const {
        text,
        font,
        color,
        hoverIntensity,
        rotationIntensity,
        duration,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    const pattern = React.useMemo<Offset[]>(
        () => [
            { x: -10, y: -6, r: -10 },
            { x: 8, y: -4, r: 7 },
            { x: -6, y: 9, r: -6 },
            { x: 10, y: 5, r: 9 },
        ],
        []
    )

    const chars = React.useMemo(() => {
        // Keep original spacing intact; whiteSpace: "pre-wrap" handles spaces/newlines.
        // Array.from handles surrogate pairs better than split("").
        return Array.from(text ?? "")
    }, [text])

    const baseTransition = React.useMemo(() => {
        const d = Math.min(0.5, Math.max(0.35, duration || 0.45))
        return { duration: d, ease: "easeOut" as const }
    }, [duration])

    const containerStyle = React.useMemo<React.CSSProperties>(() => {
        return {
            ...style,
            position: "relative",
            display: "inline-block",
            whiteSpace: "pre-wrap",
            color,
            ...font,
        }
    }, [style, color, font])

    const handleCharEnter = React.useCallback(
        (index: number) => {
            if (isStatic) return
            React.startTransition(() => setHoveredIndex(index))
        },
        [isStatic]
    )

    const handleCharLeave = React.useCallback(() => {
        if (isStatic) return
        React.startTransition(() => setHoveredIndex(null))
    }, [isStatic])

    return (
        <span style={containerStyle} role="text" aria-label={text}>
            {chars.map((ch, i) => {
                const off = pattern[i % pattern.length]
                const x = (off.x || 0) * (hoverIntensity || 1)
                const y = (off.y || 0) * (hoverIntensity || 1)
                const r = (off.r || 0) * (rotationIntensity || 1)

                const isHovered = hoveredIndex === i

                return (
                    <motion.span
                        key={`${i}-${ch}`}
                        style={{
                            display: "inline-block",
                            willChange: "transform",
                            transformOrigin: "50% 60%",
                        }}
                        initial={false}
                        animate={isHovered ? { x, y, rotate: r } : { x: 0, y: 0, rotate: 0 }}
                        transition={baseTransition}
                        aria-hidden="true"
                        onMouseEnter={isStatic ? undefined : () => handleCharEnter(i)}
                        onMouseLeave={isStatic ? undefined : handleCharLeave}
                    >
                        {ch}
                    </motion.span>
                )
            })}
        </span>
    )
}

addPropertyControls(ScatteredLettersText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scattered Letters",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    hoverIntensity: {
        type: ControlType.Number,
        title: "Hover Move",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
    },
    rotationIntensity: {
        type: ControlType.Number,
        title: "Hover Rotate",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.45,
        min: 0.35,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
})