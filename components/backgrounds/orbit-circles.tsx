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

import type { CSSProperties } from "react"

interface AnimatedOrbitCirclesProps {
    circleCount: number
    baseSize: number
    sizeIncrement: number
    strokeWidth: number
    strokeColor1: string
    strokeColor2: string
    backgroundColor: string
    animationDuration: number
    rotationAmount: number
    style?: CSSProperties
}

function OrbitCircles(
    size: number,
    strokeWidth: number,
    index: number,
    color1: string,
    color2: string
) {
    const centerX = size / 2
    const centerY = size / 2
    const radius = (size - strokeWidth * 2) / 2

    const arcConfigs = [
        [
            { start: 45, end: 135 },
            { start: 225, end: 315 },
        ],
        [
            { start: 90, end: 200 },
            { start: 270, end: 20 },
        ],
        [
            { start: 135, end: 225 },
            { start: 315, end: 45 },
        ],
        [
            { start: 180, end: 280 },
            { start: 0, end: 90 },
        ],
        [
            { start: 225, end: 315 },
            { start: 45, end: 135 },
        ],
    ]

    const config = arcConfigs[index % arcConfigs.length]

    return config.map((arc, arcIndex) => {
        const startAngle = (arc.start * Math.PI) / 180
        const endAngle = (arc.end * Math.PI) / 180

        const startX = centerX + radius * Math.cos(startAngle)
        const startY = centerY + radius * Math.sin(startAngle)
        const endX = centerX + radius * Math.cos(endAngle)
        const endY = centerY + radius * Math.sin(endAngle)

        let angleDiff = arc.end - arc.start
        if (angleDiff < 0) angleDiff += 360
        const largeArcFlag = angleDiff > 180 ? 1 : 0

        const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`

        const gradientId = `gradient-${index}-${arcIndex}`
        const startColor = arcIndex % 2 === 0 ? color1 : color2
        const endColor = arcIndex % 2 === 0 ? color2 : color1

        return (
            <g key={arcIndex}>
                <defs>
                    <linearGradient
                        id={gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop
                            offset="0%"
                            stopColor={startColor}
                            stopOpacity={0.3}
                        />
                        <stop
                            offset="50%"
                            stopColor={startColor}
                            stopOpacity={0.9}
                        />
                        <stop
                            offset="100%"
                            stopColor={endColor}
                            stopOpacity={0.3}
                        />
                    </linearGradient>
                </defs>
                <path
                    d={pathData}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    filter={`url(#glow-${index})`}
                    style={{
                        filter: `drop-shadow(0 0 8px ${startColor}) drop-shadow(0 0 6px ${endColor})`,
                    }}
                />
            </g>
        )
    })
}

function generateArcPath(
    size: number,
    strokeWidth: number,
    index: number
): string {
    const centerX = size / 2
    const centerY = size / 2
    const radius = (size - strokeWidth * 2) / 2

    const arcConfigs = [
        [
            { start: 45, end: 135 },
            { start: 225, end: 315 },
        ],
        [
            { start: 90, end: 200 },
            { start: 270, end: 20 },
        ],
        [
            { start: 135, end: 225 },
            { start: 315, end: 45 },
        ],
        [
            { start: 180, end: 280 },
            { start: 0, end: 90 },
        ],
        [
            { start: 225, end: 315 },
            { start: 45, end: 135 },
        ],
    ]

    const config = arcConfigs[index % arcConfigs.length]
    let pathData = ""

    config.forEach((arc) => {
        const startAngle = (arc.start * Math.PI) / 180
        const endAngle = (arc.end * Math.PI) / 180

        const startX = centerX + radius * Math.cos(startAngle)
        const startY = centerY + radius * Math.sin(startAngle)
        const endX = centerX + radius * Math.cos(endAngle)
        const endY = centerY + radius * Math.sin(endAngle)

        let angleDiff = arc.end - arc.start
        if (angleDiff < 0) angleDiff += 360
        const largeArcFlag = angleDiff > 180 ? 1 : 0

        pathData += `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} `
    })

    return pathData
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AnimatedOrbitCircles(props: AnimatedOrbitCirclesProps) {
    const {
        circleCount,
        baseSize,
        sizeIncrement,
        strokeWidth,
        strokeColor1,
        strokeColor2,
        backgroundColor,
        animationDuration,
        rotationAmount,
    } = props

    const isStatic = useIsStaticRenderer()

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {Array.from({ length: circleCount }).map((_, index) => {
                const size = baseSize + index * sizeIncrement
                const delay = index * 0.15
                const rotation =
                    index % 2 === 0 ? rotationAmount : -rotationAmount

                return (
                    <motion.svg
                        key={index}
                        width={size}
                        height={size}
                        style={{
                            position: "absolute",
                            opacity: 0.4 - index * 0.05,
                        }}
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      rotate: [0, rotation, 0],
                                      scale: [1, 1.05, 1],
                                  }
                        }
                        transition={
                            isStatic
                                ? undefined
                                : {
                                      duration: animationDuration,
                                      delay,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                  }
                        }
                    >
                        <defs>
                            <linearGradient
                                id={`gradient-start-${index}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={strokeColor1}
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={strokeColor1}
                                    stopOpacity={0.9}
                                />
                            </linearGradient>
                            <linearGradient
                                id={`gradient-end-${index}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={strokeColor2}
                                    stopOpacity={0.9}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={strokeColor2}
                                    stopOpacity={0.3}
                                />
                            </linearGradient>
                            <filter id={`glow-${index}`}>
                                <feGaussianBlur
                                    stdDeviation="3"
                                    result="coloredBlur"
                                />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {OrbitCircles(
                            size,
                            strokeWidth,
                            index,
                            strokeColor1,
                            strokeColor2
                        )}
                    </motion.svg>
                )
            })}
        </div>
    )
}

addPropertyControls(AnimatedOrbitCircles, {
    circleCount: {
        type: ControlType.Number,
        title: "Circle Count",
        defaultValue: 4,
        min: 2,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    baseSize: {
        type: ControlType.Number,
        title: "Base Size",
        defaultValue: 280,
        min: 50,
        max: 500,
        step: 10,
        unit: "px",
    },
    sizeIncrement: {
        type: ControlType.Number,
        title: "Size Increment",
        defaultValue: 160,
        min: 20,
        max: 200,
        step: 10,
        unit: "px",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "px",
    },
    strokeColor1: {
        type: ControlType.Color,
        title: "Stroke Color 1",
        defaultValue: "#00D9D9",
    },
    strokeColor2: {
        type: ControlType.Color,
        title: "Stroke Color 2",
        defaultValue: "#0099FF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 6,
        min: 2,
        max: 20,
        step: 1,
        unit: "s",
    },
    rotationAmount: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 90,
        min: 0,
        max: 90,
        step: 5,
        unit: "deg",
    },
})
