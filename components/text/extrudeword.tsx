// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

const LAYER_COUNT = 12

function FauxLayer({ char, layerIndex, depth, color, style }) {
    const x = useTransform(depth, (d: number) => layerIndex * (d / LAYER_COUNT))
    const y = useTransform(
        depth,
        (d: number) => -layerIndex * (d / LAYER_COUNT)
    )
    return (
        <motion.span
            aria-hidden="true"
            style={{
                ...style,
                color,
                zIndex: LAYER_COUNT - layerIndex,
                x,
                y,
            }}
        >
            {char}
        </motion.span>
    )
}

function FaceLayer({ char, depth, color, style }) {
    const x = useTransform(depth, (d: number) => d)
    const y = useTransform(depth, (d: number) => -d)
    return (
        <motion.span
            aria-hidden="true"
            style={{
                ...style,
                color,
                zIndex: LAYER_COUNT + 2,
                x,
                y,
            }}
        >
            {char}
        </motion.span>
    )
}

function Letter({
    char,
    index,
    total,
    hoveredIndex,
    defaultDepth,
    hoverDepth,
    falloff,
    extrudeColor,
    faceColor,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    letterSpacing,
    lineHeight,
    stiffness,
    damping,
    mass,
    onMouseEnter,
    onMouseLeave,
}) {
    const getTargetDepth = () => {
        if (hoveredIndex === null) return defaultDepth
        const dist = Math.abs(index - hoveredIndex)
        const factor = Math.max(0, 1 - dist / falloff)
        return defaultDepth + (hoverDepth - defaultDepth) * factor
    }

    const depth = useSpring(defaultDepth, { stiffness, damping, mass })

    useEffect(() => {
        depth.set(getTargetDepth())
    }, [hoveredIndex, defaultDepth, hoverDepth, stiffness, damping, mass])

    const sharedStyle = {
        position: "absolute" as const,
        top: 0,
        left: 0,
        fontFamily,
        fontWeight,
        fontStyle,
        fontSize,
        letterSpacing,
        lineHeight,
        userSelect: "none" as const,
        pointerEvents: "none" as const,
        whiteSpace: "nowrap" as const,
    }

    return (
        <span
            style={{
                position: "relative",
                display: "inline-block",
                zIndex: total - index,
                cursor: "default",
                lineHeight,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <span
                style={{
                    display: "inline-block",
                    fontFamily,
                    fontWeight,
                    fontStyle,
                    fontSize,
                    letterSpacing,
                    lineHeight,
                    visibility: "hidden",
                    whiteSpace: "nowrap",
                }}
            >
                {char}
            </span>

            <span
                style={{
                    ...sharedStyle,
                    color: extrudeColor,
                    zIndex: 0,
                    transform: "translateX(0px) translateY(0px)",
                }}
            >
                {char}
            </span>

            {Array.from({ length: LAYER_COUNT }, (_, i) => (
                <FauxLayer
                    key={i}
                    char={char}
                    layerIndex={i + 1}
                    depth={depth}
                    color={extrudeColor}
                    style={sharedStyle}
                />
            ))}

            <FaceLayer
                char={char}
                depth={depth}
                color={faceColor}
                style={sharedStyle}
            />
        </span>
    )
}

export default function ExtrudeWord({
    word,
    font,
    fontSize,
    defaultDepth,
    hoverDepth,
    falloff,
    extrudeColor,
    faceColor,
    letterSpacing,
    lineHeight,
    stiffness,
    damping,
    mass,
}) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const letters = word.split("")

    const fontFamily = font?.fontFamily ?? "Inter"
    const fontWeight = font?.fontWeight ?? 900
    const fontStyle = font?.fontStyle ?? "normal"

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "flex-end",
                paddingTop: hoverDepth + 8,
                paddingRight: hoverDepth + 8,
                gap: letterSpacing,
                lineHeight,
            }}
        >
            {letters.map((char, i) => (
                <Letter
                    key={i}
                    char={char}
                    index={i}
                    total={letters.length}
                    hoveredIndex={hoveredIndex}
                    defaultDepth={defaultDepth}
                    hoverDepth={hoverDepth}
                    falloff={falloff}
                    extrudeColor={extrudeColor}
                    faceColor={faceColor}
                    fontFamily={fontFamily}
                    fontWeight={fontWeight}
                    fontStyle={fontStyle}
                    fontSize={fontSize}
                    letterSpacing={letterSpacing}
                    lineHeight={lineHeight}
                    stiffness={stiffness}
                    damping={damping}
                    mass={mass}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                />
            ))}
        </div>
    )
}

ExtrudeWord.defaultProps = {
    word: "STAND",
    font: {
        fontFamily: "Inter",
        fontWeight: 900,
        fontStyle: "normal",
    },
    fontSize: 120,
    defaultDepth: 8,
    hoverDepth: 20,
    falloff: 2.5,
    extrudeColor: "#000000",
    faceColor: "#ffffff",
    letterSpacing: 0,
    lineHeight: 1,
    stiffness: 259,
    damping: 7,
    mass: 1.6,
}

addPropertyControls(ExtrudeWord, {
    word: {
        type: ControlType.String,
        title: "Word",
        defaultValue: "STAND",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 120,
        min: 10,
        max: 400,
        step: 1,
        displayStepper: true,
    },
    defaultDepth: {
        type: ControlType.Number,
        title: "Default Depth",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
    },
    hoverDepth: {
        type: ControlType.Number,
        title: "Hover Depth",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
    },
    falloff: {
        type: ControlType.Number,
        title: "Wave Falloff",
        defaultValue: 2.5,
        min: 1,
        max: 6,
        step: 0.1,
    },
    extrudeColor: {
        type: ControlType.Color,
        title: "Extrude Color",
        defaultValue: "#000000",
    },
    faceColor: {
        type: ControlType.Color,
        title: "Face Color",
        defaultValue: "#ffffff",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -20,
        max: 40,
        step: 1,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 259,
        min: 20,
        max: 500,
        step: 10,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 7,
        min: 1,
        max: 60,
        step: 1,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 1.6,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
})
