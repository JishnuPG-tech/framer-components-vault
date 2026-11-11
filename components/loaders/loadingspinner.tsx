// Loading Animation Component with multiple style variants, including Dual Tail Spinner with glowing tails
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

import { useMemo } from "react"
import React from "react"

const VARIANTS = [
    "spinner",
    "dualRing",
    "dottedRing",
    "bouncingDots",
    "scalingDots",
    "triangleDots",
    "fadeDots",
    "innerFade",
    "outlinePulse",
    "multiPulse",
    // "clockLines",
    // "circleBorderSpinner", // <-- add new variant
    "twoDotSwap",
]

const VARIANT_TITLES = [
    "Spinner (Circle)",
    "Dual Ring (Circle)",
    "Dotted Ring (Circle)",
    "Bouncing Dots",
    "Scaling Dots",
    "Triangle Dots",
    "Fade Dots",
    "Inner Fade",
    "Outline Pulse",
    "Multi Pulse",
    // "Clock Lines",
    // "Circle Border Spinner", // <-- add new title
    "Two Dot Swap",
]

function Spinner({ size, color, speed }) {
    const stroke = size * 0.12
    const r = (size - stroke) / 2
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={Math.PI * r * 1.5}
                strokeDashoffset={Math.PI * r * 0.5}
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                initial={{ rotate: 0 }}
                transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
                style={{ originX: 0.5, originY: 0.5 }}
            />
        </svg>
    )
}

function DualRing({ size, color, speed }) {
    const stroke = size * 0.12
    const r1 = (size - stroke) / 2
    const r2 = r1 * 0.7
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r1}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={Math.PI * r1 * 1.2}
                strokeDashoffset={Math.PI * r1 * 0.3}
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                initial={{ rotate: 0 }}
                transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
                style={{ originX: 0.5, originY: 0.5 }}
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r2}
                fill="none"
                stroke={color}
                strokeWidth={stroke * 0.7}
                strokeDasharray={Math.PI * r2 * 1.2}
                strokeDashoffset={Math.PI * r2 * 0.3}
                strokeLinecap="round"
                animate={{ rotate: -360 }}
                initial={{ rotate: 0 }}
                transition={{ repeat: Infinity, duration: speed * 1.2, ease: "linear" }}
                style={{ originX: 0.5, originY: 0.5 }}
            />
        </svg>
    )
}

function DottedRing({ size, color, speed }) {
    const dotCount = 8
    const r = size * 0.38
    const dotR = size * 0.09
    const dots = Array.from({ length: dotCount })
    return (
        <motion.svg width={size} height={size} style={{ display: "block", originX: 0.5, originY: 0.5, overflow: "visible" }}
            animate={{ rotate: 360 }}
            initial={{ rotate: 0 }}
            transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        >
            {dots.map((_, i) => {
                const angle = (i / dotCount) * 2 * Math.PI
                const cx = size / 2 + r * Math.cos(angle)
                const cy = size / 2 + r * Math.sin(angle)
                return <circle key={i} cx={cx} cy={cy} r={dotR} fill={color} />
            })}
        </motion.svg>
    )
}

function BouncingDots({ size, color, speed }) {
    const dotR = size * 0.13
    const gap = size * 0.36
    return (
        <svg width={size} height={size / 2} style={{ display: "block", overflow: "visible" }}>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={size / 2 + (i - 1) * gap}
                    cy={size / 4}
                    r={dotR}
                    fill={color}
                    animate={{
                        cy: [size / 4, size / 4 - size * 0.18, size / 4],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: speed,
                        ease: "easeInOut",
                        delay: (speed / 3) * i,
                    }}
                />
            ))}
        </svg>
    )
}

function ScalingDots({ size, color, speed }) {
    const dotR = size * 0.13
    const gap = size * 0.36
    return (
        <svg width={size} height={size / 2} style={{ display: "block", overflow: "visible" }}>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={size / 2 + (i - 1) * gap}
                    cy={size / 4}
                    r={dotR}
                    fill={color}
                    animate={{
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: speed,
                        ease: "easeInOut",
                        delay: (speed / 3) * i,
                    }}
                    style={{ originX: 0.5, originY: 0.5 }}
                />
            ))}
        </svg>
    )
}

function TriangleDots({ size, color, speed }) {
    const dotR = size * 0.11
    const r = size * 0.22
    const center = size / 2
    const points = [0, 1, 2].map((i) => {
        const angle = (i / 3) * 2 * Math.PI - Math.PI / 2
        return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
    })
    return (
        <motion.svg
            width={size}
            height={size}
            animate={{ rotate: 360 }}
            initial={{ rotate: 0 }}
            transition={{ repeat: Infinity, duration: speed * 1.5, ease: "linear" }}
            style={{ originX: 0.5, originY: 0.5, display: "block", overflow: "visible" }}
        >
            {points.map(([cx, cy], i) => (
                <motion.circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={dotR}
                    fill={color}
                    animate={{
                        scale: [1, 1.4, 1],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: speed * 1.2,
                        ease: "easeInOut",
                        delay: (speed / 3) * i,
                    }}
                    style={{ originX: 0.5, originY: 0.5 }}
                />
            ))}
        </motion.svg>
    )
}

function FadeDots({ size, color, speed }) {
    const dotR = size * 0.11
    const gap = size * 0.28
    return (
        <svg width={size} height={size / 2} style={{ display: "block", overflow: "visible" }}>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={size / 2 + (i - 1) * gap}
                    cy={size / 4}
                    r={dotR}
                    fill={color}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{
                        repeat: Infinity,
                        duration: speed,
                        ease: "easeInOut",
                        delay: (speed / 3) * i,
                    }}
                />
            ))}
        </svg>
    )
}

function PulseCircle({ size, color, speed }) {
    const r = size * 0.32
    return null
}

function InnerFade({ size, color, speed }) {
    const r = size * 0.18
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill={color}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: speed, ease: "easeInOut" }}
            />
        </svg>
    )
}

function OutlinePulse({ size, color, speed }) {
    const r = size * 0.32
    const stroke = size * 0.13
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: speed, ease: "easeInOut" }}
                style={{ originX: 0.5, originY: 0.5 }}
            />
        </svg>
    )
}

function MultiPulse({ size, color, speed }) {
    const r1 = size * 0.22
    const r2 = size * 0.32
    const r3 = size * 0.42
    const stroke = size * 0.09
    // MultiPulse: circles scale with bounce, fade out, next appears from inside, loops
    // We'll use a single animated value and stagger the circles
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={[r1, r2, r3][i]}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    animate={{
                        scale: [0.7, 1.2, 1.4, 0.7],
                        opacity: [0, 1, 0, 0],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: speed * 2,
                        ease: [0.68, -0.6, 0.32, 1.6], // bounce
                        delay: speed * (i * 0.5),
                    }}
                    style={{ originX: 0.5, originY: 0.5 }}
                />
            ))}
        </svg>
    )
}

function ClockLines({ size, color, speed }) {
    // 2 lines like clock hands, different speeds, rotating around center
    const r = size * 0.38
    const lineW = size * 0.09
    const lineLen = r
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            <motion.line
                x1={size / 2}
                y1={size / 2}
                x2={size / 2}
                y2={size / 2 - lineLen}
                stroke={color}
                strokeWidth={lineW}
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                initial={{ rotate: 0 }}
                transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
                style={{ originX: 0.5, originY: 0.5 }}
            />
            <motion.line
                x1={size / 2}
                y1={size / 2}
                x2={size / 2}
                y2={size / 2 - lineLen * 0.8}
                stroke={color}
                strokeWidth={lineW * 0.7}
                strokeLinecap="round"
                animate={{ rotate: 360 }}
                initial={{ rotate: 180 }}
                transition={{ repeat: Infinity, duration: speed * 1.7, ease: "linear" }}
                style={{ originX: 0.5, originY: 0.5 }}
            />
        </svg>
    )
}

function CircleBorderSpinner({ size, color, speed }) {
    // White filled circle, with a partial border (arc) inside, rotating
    const stroke = size * 0.13
    const r = (size - stroke) / 2
    const arcLen = Math.PI * r * 0.7 // 40% of the circle
    return (
        <motion.svg
            width={size}
            height={size}
            style={{ display: "block", overflow: "visible" }}
            animate={{ rotate: 360 }}
            initial={{ rotate: 0 }}
            transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="#fff"
                stroke="none"
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r * 0.78}
                fill="none"
                stroke={color}
                strokeWidth={stroke * 0.7}
                strokeDasharray={arcLen + "," + Math.PI * r * 2}
                strokeDashoffset={0}
                strokeLinecap="round"
                animate={{}}
                transition={{}}
                style={{ originX: 0.5, originY: 0.5 }}
            />
        </motion.svg>
    )
}

function FourDotBounce({ size, color, speed }) {
    // 4 dots: left, right, top, bottom. They rotate, bounce to center, then back, loop.
    const dotR = size * 0.13
    const center = size / 2
    const offset = size * 0.32
    // Animation: 0% (at offset), 40% (at center), 60% (at center), 100% (at offset)
    // All dots rotate together
    return (
        <motion.svg
            width={size}
            height={size}
            style={{ display: "block", overflow: "visible" }}
            animate={{ rotate: 360 }}
            initial={{ rotate: 0 }}
            transition={{ repeat: Infinity, duration: speed * 1.6, ease: "linear" }}
        >
            {/* Left */}
            <motion.circle
                cx={center - offset}
                cy={center}
                r={dotR}
                fill={color}
                animate={{
                    cx: [center - offset, center, center, center - offset],
                }}
                transition={{
                    repeat: Infinity,
                    duration: speed * 1.6,
                    times: [0, 0.4, 0.6, 1],
                    ease: [0.68, -0.6, 0.32, 1.6],
                }}
            />
            {/* Right */}
            <motion.circle
                cx={center + offset}
                cy={center}
                r={dotR}
                fill={color}
                animate={{
                    cx: [center + offset, center, center, center + offset],
                }}
                transition={{
                    repeat: Infinity,
                    duration: speed * 1.6,
                    times: [0, 0.4, 0.6, 1],
                    ease: [0.68, -0.6, 0.32, 1.6],
                }}
            />
            {/* Top */}
            <motion.circle
                cx={center}
                cy={center - offset}
                r={dotR}
                fill={color}
                animate={{
                    cy: [center - offset, center, center, center - offset],
                }}
                transition={{
                    repeat: Infinity,
                    duration: speed * 1.6,
                    times: [0, 0.4, 0.6, 1],
                    ease: [0.68, -0.6, 0.32, 1.6],
                }}
            />
            {/* Bottom */}
            <motion.circle
                cx={center}
                cy={center + offset}
                r={dotR}
                fill={color}
                animate={{
                    cy: [center + offset, center, center, center + offset],
                }}
                transition={{
                    repeat: Infinity,
                    duration: speed * 1.6,
                    times: [0, 0.4, 0.6, 1],
                    ease: [0.68, -0.6, 0.32, 1.6],
                }}
            />
        </motion.svg>
    )
}

function TwoDotSwap({ size, color, speed }) {
    // 2 dots, left and right, swap positions smoothly
    const dotR = size * 0.15
    const centerY = size / 2
    const gap = size * 0.42 // increased gap for better separation
    return (
        <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
            {/* Left dot */}
            <motion.circle
                cx={[size / 2 - gap, size / 2 + gap, size / 2 - gap]}
                cy={centerY}
                r={dotR}
                fill={color}
                animate={{ cx: [size / 2 - gap, size / 2 + gap, size / 2 - gap] }}
                transition={{
                    repeat: Infinity,
                    duration: speed * 1.2,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                }}
            />
            {/* Right dot */}
            <motion.circle
                cx={[size / 2 + gap, size / 2 - gap, size / 2 + gap]}
                cy={centerY}
                r={dotR}
                fill={color}
                animate={{ cx: [size / 2 + gap, size / 2 - gap, size / 2 + gap] }}
                transition={{
                    repeat: Infinity,
                    duration: speed * 1.2,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                }}
            />
        </svg>
    )
}

const VARIANT_COMPONENTS = {
    spinner: Spinner,
    dualRing: DualRing,
    dottedRing: DottedRing,
    bouncingDots: BouncingDots,
    scalingDots: ScalingDots,
    triangleDots: TriangleDots,
    fadeDots: FadeDots,
    innerFade: InnerFade,
    outlinePulse: OutlinePulse,
    multiPulse: MultiPulse,
    fourDotBounce: FourDotBounce,
    twoDotSwap: TwoDotSwap,
    // clockLines: ClockLines,
    // circleBorderSpinner: CircleBorderSpinner, // <-- add new variant
}

/**
 * Loading Animation Component
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LoadingSpinner(props) {
    const {
        variant = "spinner",
        size = 40,
        color = "#fff",
        speed = 1,
        background = "#181A1B",
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const Comp = VARIANT_COMPONENTS[variant] || Spinner
    // For static renderer, show a static frame
    const staticFrame = useMemo(() => {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background,
                    borderRadius: "50%",
                }}
            >
                <svg width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={size * 0.32}
                        fill={color}
                        opacity={0.7}
                    />
                </svg>
            </div>
        )
    }, [size, color, background])
    return (
        <div
            style={{
                ...style,
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background,
                borderRadius: "50%",
                overflow: "visible",
            }}
        >
            {isStatic || RenderTarget.current() === RenderTarget.thumbnail ? (
                staticFrame
            ) : (
                <Comp size={size} color={color} speed={speed} />
            )}
        </div>
    )
}

addPropertyControls(LoadingSpinner, {
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: [
            ...VARIANTS,
            "fourDotBounce",
            "twoDotSwap",
        ],
        optionTitles: [
            ...VARIANT_TITLES,
            "Four Dot Bounce",
            "Two Dot Swap",
        ],
        defaultValue: "spinner",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 40,
        min: 16,
        max: 128,
        step: 1,
        unit: "px",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#fff",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.3,
        max: 4,
        step: 0.1,
        unit: "s",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#181A1B",
        optional: true,
    },
})