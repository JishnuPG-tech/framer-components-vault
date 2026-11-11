// Get Started: https://www.framer.com/developers

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

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

function makeTextShadow({
    size = 1,
    color = "#000",
}: {
    size?: number
    color?: string
}) {
    const shadows: string[] = []

    for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
            if (x === 0 && y === 0) continue
            shadows.push(`${x}px ${y}px 0 ${color}`)
        }
    }

    return shadows.join(", ")
}

export default function Text_Pop(props) {
    const {
        tint,
        text,
        font,
        outline,
        primary,
        shadow,
        shadowOffsetX,
        shadowOffsetY,
        hoverOffsetX,
        hoverOffsetY,
    } = props

    const characters = Array.from(text || "")
    const total = characters.length

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                fontFamily: font.fontFamily,
                fontWeight: 700,
                fontSize: font.fontSize,
                lineHeight: 1,
                whiteSpace: "nowrap",
            }}
        >
            {characters.map((char, index) => {
                const safeChar = char === " " ? "\u00A0" : char

                return (
                    <span
                        key={index}
                        style={{
                            position: "relative",
                            display: "inline-block",
                            zIndex: total - index,
                        }}
                    >
                        {/* Shadow / back layer (black) – stays fixed */}
                        <span
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                transform: `translate(${shadowOffsetX}px, ${shadowOffsetY}px)`,
                                color: shadow,
                                pointerEvents: "none",
                            }}
                        >
                            {safeChar}
                        </span>

                        {/* Front layer (yellow) – only this moves on hover */}
                        <motion.span
                            style={{
                                position: "relative",
                                color: primary,
                                display: "inline-block",
                                textShadow: makeTextShadow({
                                    size: outline,
                                    color: shadow,
                                }),
                            }}
                            whileHover={{
                                x: hoverOffsetX,
                                y: hoverOffsetY,
                            }}
                            transition={{
                                duration: 0.17,
                                ease: [0.65, 0, 0.35, 1], // cubic-bezier equivalent
                            }}
                        >
                            {safeChar}
                        </motion.span>
                    </span>
                )
            })}
        </div>
    )
}

addPropertyControls(Text_Pop, {
    primary: {
        title: "Primary",
        type: ControlType.Color,
        defaultValue: "#FBCD39",
    },
    shadow: {
        title: "Shadow",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "Hello",
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        controls: "extended",
        defaultValue: {
            fontSize: 128,
            fontFamily: "Bebas Neue",
            fontWeight: 700,
        },
    },
    outline: {
        title: "Outline",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 1,
    },
    shadowOffsetX: {
        title: "Shadow X",
        type: ControlType.Number,
        defaultValue: -4,
        min: -50,
        max: 50,
        step: 1,
    },
    shadowOffsetY: {
        title: "Shadow Y",
        type: ControlType.Number,
        defaultValue: 4,
        min: -50,
        max: 50,
        step: 1,
    },
    hoverOffsetX: {
        title: "Hover X",
        type: ControlType.Number,
        defaultValue: 4,
        min: -50,
        max: 50,
        step: 1,
    },
    hoverOffsetY: {
        title: "Hover Y",
        type: ControlType.Number,
        defaultValue: -4,
        min: -50,
        max: 50,
        step: 1,
    },
})
