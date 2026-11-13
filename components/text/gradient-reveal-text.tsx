import { useState, useRef, useEffect, type CSSProperties } from "react"
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

interface TextHoverEffectProps {
    text: string
    duration: number
    maskRadius: number
    strokeWidth: number
    fontSize: number
    fontWeight: number
    backgroundStroke: string
    gradientColor1: string
    gradientColor2: string
    gradientColor3: string
    gradientColor4: string
    gradientColor5: string
    strokeAnimationDuration: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TextHoverEffect(props: TextHoverEffectProps) {
    const {
        text = "ACET",
        duration = 0,
        maskRadius = 20,
        strokeWidth = 0.3,
        fontSize = 70,
        fontWeight = 700,
        backgroundStroke = "#e5e5e5",
        gradientColor1 = "#eab308",
        gradientColor2 = "#ef4444",
        gradientColor3 = "#3b82f6",
        gradientColor4 = "#06b6d4",
        gradientColor5 = "#8b5cf6",
        strokeAnimationDuration = 4,
    } = props

    const svgRef = useRef<SVGSVGElement>(null)
    const [cursor, setCursor] = useState({ x: 0, y: 0 })
    const [hovered, setHovered] = useState(false)
    const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" })

    useEffect(() => {
        if (svgRef.current && cursor.x !== 0 && cursor.y !== 0) {
            const svgRect = svgRef.current.getBoundingClientRect()
            const cxPercentage =
                ((cursor.x - svgRect.left) / svgRect.width) * 100
            const cyPercentage =
                ((cursor.y - svgRect.top) / svgRect.height) * 100
            setMaskPosition({
                cx: `${cxPercentage}%`,
                cy: `${cyPercentage}%`,
            })
        }
    }, [cursor])

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 300 100"
            xmlns="http://www.w3.org/2000/svg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
            style={{ display: "block" }}
        >
            <defs>
                <linearGradient
                    id="textGradient"
                    gradientUnits="userSpaceOnUse"
                    cx="50%"
                    cy="50%"
                    r="25%"
                >
                    {hovered && (
                        <>
                            <stop offset="0%" stopColor={gradientColor1} />
                            <stop offset="25%" stopColor={gradientColor2} />
                            <stop offset="50%" stopColor={gradientColor3} />
                            <stop offset="75%" stopColor={gradientColor4} />
                            <stop offset="100%" stopColor={gradientColor5} />
                        </>
                    )}
                </linearGradient>

                <motion.radialGradient
                    id="revealMask"
                    gradientUnits="userSpaceOnUse"
                    r={`${maskRadius}%`}
                    initial={{ cx: "50%", cy: "50%" }}
                    animate={maskPosition}
                    transition={{ duration: duration, ease: "easeOut" }}
                >
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                </motion.radialGradient>
                <mask id="textMask">
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="url(#revealMask)"
                    />
                </mask>
            </defs>
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth={strokeWidth}
                fill="transparent"
                stroke={backgroundStroke}
                style={{
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: `${fontSize}px`,
                    fontWeight: fontWeight,
                    opacity: hovered ? 0.7 : 0,
                }}
            >
                {text}
            </text>
            <motion.text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                strokeWidth={strokeWidth}
                fill="transparent"
                stroke={backgroundStroke}
                style={{
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: `${fontSize}px`,
                    fontWeight: fontWeight,
                }}
                initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
                animate={{
                    strokeDashoffset: 0,
                    strokeDasharray: 1000,
                }}
                transition={{
                    duration: strokeAnimationDuration,
                    ease: "easeInOut",
                }}
            >
                {text}
            </motion.text>
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                stroke="url(#textGradient)"
                strokeWidth={strokeWidth}
                mask="url(#textMask)"
                fill="transparent"
                style={{
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontSize: `${fontSize}px`,
                    fontWeight: fontWeight,
                }}
            >
                {text}
            </text>
        </svg>
    )
}

addPropertyControls(TextHoverEffect, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "FRAMER",
        placeholder: "Enter text...",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 70,
        min: 20,
        max: 150,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 700,
        min: 100,
        max: 900,
        step: 100,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    backgroundStroke: {
        type: ControlType.Color,
        title: "Background Stroke",
        defaultValue: "#757171",
    },
    maskRadius: {
        type: ControlType.Number,
        title: "Mask Radius",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
        unit: "%",
    },
    duration: {
        type: ControlType.Number,
        title: "Mask Transition Duration",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
        unit: "s",
    },
    strokeAnimationDuration: {
        type: ControlType.Number,
        title: "Stroke Animation Duration",
        defaultValue: 4,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    gradientColor1: {
        type: ControlType.Color,
        title: "Gradient Color 1",
        defaultValue: "#eab308",
    },
    gradientColor2: {
        type: ControlType.Color,
        title: "Gradient Color 2",
        defaultValue: "#ef4444",
    },
    gradientColor3: {
        type: ControlType.Color,
        title: "Gradient Color 3",
        defaultValue: "#3b82f6",
    },
    gradientColor4: {
        type: ControlType.Color,
        title: "Gradient Color 4",
        defaultValue: "#06b6d4",
    },
    gradientColor5: {
        type: ControlType.Color,
        title: "Gradient Color 5",
        defaultValue: "#8b5cf6",
    },
})

TextHoverEffect.displayName = "Text Hover Effect"
