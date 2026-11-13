// Spinning Wheel component with 5 colored segments, realistic spin animation, and result display
import { useState, useRef, startTransition, type CSSProperties } from "react"
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

interface SpinningWheelProps {
    segments: Array<{ label: string; color: string }>
    buttonText: string
    wheelSize: number
    pointerColor: string
    buttonColor: string
    buttonTextColor: string
    segmentTextColor: string
    font: any
    buttonFont: any
    duration: number
    radius: number
    borderColor: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SpinningWheel(props: SpinningWheelProps) {
    const {
        segments,
        buttonText,
        wheelSize,
        pointerColor,
        buttonColor,
        buttonTextColor,
        segmentTextColor,
        font,
        buttonFont,
        duration,
        radius,
        borderColor,
    } = props

    const [isSpinning, setIsSpinning] = useState(false)
    const [result, setResult] = useState("")
    const [rotation, setRotation] = useState(0)
    const wheelRef = useRef<HTMLDivElement>(null)

    const segmentAngle = 360 / segments.length
    const wheelRadius = wheelSize / 2

    const handleSpin = () => {
        if (isSpinning) return

        startTransition(() => {
            setIsSpinning(true)
            setResult("")
        })

        // Generate random rotation (multiple full rotations + random final position)
        const spins = 5 + Math.random() * 5 // 5-10 full rotations
        const finalAngle = Math.random() * 360
        const totalRotation = rotation + spins * 360 + finalAngle

        startTransition(() => setRotation(totalRotation))

        // After duration, determine winner and re-enable button
        setTimeout(() => {
            // Calculate which segment is under the pointer (top center)
            // The pointer points down, so we need to find which segment is at the top
            const normalizedAngle = (360 - (totalRotation % 360)) % 360
            const segmentIndex = Math.floor(normalizedAngle / segmentAngle)
            const winningSegment = segments[segmentIndex]

            startTransition(() => {
                setResult(`${winningSegment.label}`)
                setIsSpinning(false)
            })
        }, duration * 1000)
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: 20,
                borderRadius: 12,
                minWidth: "max-content",
                overflow: "hidden",
                ...font,
            }}
        >
            {/* Wheel Container */}
            <div
                style={{
                    position: "relative",
                    width: wheelSize,
                    height: wheelSize,
                }}
            >
                {/* Wheel */}
                <motion.div
                    ref={wheelRef}
                    style={{
                        width: wheelSize,
                        height: wheelSize,
                        borderRadius: "50%",
                        position: "relative",
                        overflow: "hidden",
                    }}
                    animate={{ rotate: rotation }}
                    transition={{
                        duration: isSpinning ? duration : 0,
                        ease: isSpinning ? [0.17, 0.67, 0.12, 0.99] : "linear",
                    }}
                >
                    {segments.map((segment, index) => {
                        const startAngle = index * segmentAngle
                        const endAngle = (index + 1) * segmentAngle

                        // Calculate path for segment
                        const startAngleRad = (startAngle * Math.PI) / 180
                        const endAngleRad = (endAngle * Math.PI) / 180

                        const x1 =
                            wheelRadius + wheelRadius * Math.cos(startAngleRad)
                        const y1 =
                            wheelRadius + wheelRadius * Math.sin(startAngleRad)
                        const x2 =
                            wheelRadius + wheelRadius * Math.cos(endAngleRad)
                        const y2 =
                            wheelRadius + wheelRadius * Math.sin(endAngleRad)

                        const largeArcFlag = segmentAngle > 180 ? 1 : 0

                        const pathData = [
                            `M ${wheelRadius} ${wheelRadius}`,
                            `L ${x1} ${y1}`,
                            `A ${wheelRadius} ${wheelRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            "Z",
                        ].join(" ")

                        // Calculate text position
                        const textAngle = startAngle + segmentAngle / 2
                        const textAngleRad = (textAngle * Math.PI) / 180
                        const textRadius = wheelRadius * 0.65
                        const textX =
                            wheelRadius + textRadius * Math.cos(textAngleRad)
                        const textY =
                            wheelRadius + textRadius * Math.sin(textAngleRad)

                        return (
                            <div
                                key={index}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                <svg
                                    width={wheelSize}
                                    height={wheelSize}
                                    style={{ position: "absolute" }}
                                >
                                    <path
                                        d={pathData}
                                        fill={segment.color}
                                        stroke={borderColor}
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={textX}
                                        y={textY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill={segmentTextColor}
                                        fontSize={font.fontSize}
                                        fontWeight={font.fontWeight}
                                        fontFamily={font.fontFamily}
                                        fontStyle={font.fontStyle}
                                        letterSpacing={font.letterSpacing}
                                        transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                                        style={{
                                            writingMode: "vertical-rl",
                                            textOrientation: "mixed",
                                            textAlign: "left",
                                        }}
                                    >
                                        {segment.label}
                                    </text>
                                </svg>
                            </div>
                        )
                    })}
                </motion.div>

                {/* Pointer */}
                <div
                    style={{
                        position: "absolute",
                        top: -10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "15px solid transparent",
                        borderRight: "15px solid transparent",
                        borderTop: `20px solid ${pointerColor}`,
                        zIndex: 10,
                    }}
                />
            </div>

            {/* Spin Button */}
            <button
                onClick={handleSpin}
                disabled={isSpinning}
                style={{
                    padding: "16px 24px",
                    backgroundColor: buttonColor,
                    color: buttonTextColor,
                    border: "none",
                    borderRadius: radius,
                    cursor: isSpinning ? "not-allowed" : "pointer",
                    ...buttonFont,
                    opacity: isSpinning ? 0.6 : 1,
                    width: "auto",
                    height: "auto",
                    zIndex: 2,
                }}
            >
                <span style={{ pointerEvents: "none" }}>{buttonText}</span>
            </button>
        </div>
    )
}

addPropertyControls(SpinningWheel, {
    segments: {
        type: ControlType.Array,
        title: "Segments",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Segment",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FF5588",
                },
            },
        },
        defaultValue: [
            { label: "Red", color: "#FF0000" },
            { label: "Orange", color: "#FFA500" },
            { label: "Yellow", color: "#E3E300" },
            { label: "Green", color: "#008000" },
            { label: "Blue", color: "#0000FF" },
            { label: "Indigo", color: "#4B0082" },
            { label: "Violet", color: "#EE82EE" },
        ],
    },
    wheelSize: {
        type: ControlType.Number,
        title: "Wheel Size",
        defaultValue: 500,
        min: 200,
        max: 800,
        step: 25,
        unit: "px",
    },
    duration: {
        type: ControlType.Number,
        title: "Spin Duration",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    pointerColor: {
        type: ControlType.Color,
        title: "Pointer Color",
        defaultValue: "#333333",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.6em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Spin the Wheel",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#FFFFFF",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#0099FF",
    },
    radius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 6,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
    },
    segmentTextColor: {
        type: ControlType.Color,
        title: "Segment Text Color",
        defaultValue: "#ffffff",
    },
    font: {
        type: ControlType.Font,
        title: "Segment Font",
        defaultValue: {
            fontSize: "20px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.6em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Segment Border Color",
        defaultValue: "#000000",
    },
})
