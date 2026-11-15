/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

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

/* ---------- Pulse keyframes ---------- */

const pulseKeyframes = `
@keyframes autocover-pulse {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.6; }
}
`

type Props = {
    text: string
    highlightWord?: string
    textAlign: "left" | "center" | "right"
    highlightTextColor: string
    coverColor: string
    hoverCoverColor: string
    beamColor: string
    hoverBeamColor: string
    particles: {
        count: number
        size: number
        color: string
    }
    dots: {
        size: number
        color: string
    }
    font: React.CSSProperties
}

/* ---------- REAL FLOATING SPARKLES ---------- */

function HoverSparkles({
    active,
    particles,
}: {
    active: boolean
    particles: Props["particles"]
}) {
    if (!active) return null

    const items = React.useMemo(() => {
        return Array.from({ length: particles.count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 0.6 + particles.size,
            opacity: Math.random() * 0.35 + 0.45,
            duration: Math.random() * 3 + 4,
            delay: Math.random() * 1.2,
            dx: Math.random() * 18 - 9,
            dy: Math.random() * 18 - 9,
        }))
    }, [particles])

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {items.map((p) => (
                <motion.span
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        backgroundColor: particles.color,
                        opacity: p.opacity,
                    }}
                    animate={{
                        x: [0, p.dx, -p.dx * 0.6, 0],
                        y: [0, -p.dy, p.dy * 0.6, 0],
                        opacity: [p.opacity, p.opacity * 0.6, p.opacity],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    )
}

/* ---------- MAIN COMPONENT ---------- */

export default function AutoCover(props: Props) {
    const {
        text,
        highlightWord,
        textAlign,
        highlightTextColor,
        coverColor,
        hoverCoverColor,
        beamColor,
        hoverBeamColor,
        particles,
        dots,
        font,
    } = props

    const [hovered, setHovered] = React.useState(false)

    const maskRef = React.useRef<HTMLSpanElement>(null)
    const [width, setWidth] = React.useState(0)
    const [beamPositions, setBeamPositions] = React.useState<number[]>([])

    const words = text.trim().split(/\s+/)
    let targetIndex = -1

    if (highlightWord?.trim()) {
        targetIndex = words.findIndex(
            (w) => w.toLowerCase() === highlightWord.toLowerCase()
        )
    }
    if (targetIndex === -1) targetIndex = words.length - 1

    const beforeText = words.slice(0, targetIndex).join(" ")
    const highlightedWord = words[targetIndex]
    const afterText = words.slice(targetIndex + 1).join(" ")

    React.useLayoutEffect(() => {
        if (!maskRef.current) return
        const rect = maskRef.current.getBoundingClientRect()
        const h = rect.height
        setWidth(rect.width)

        const count = Math.max(1, Math.floor(h / 10))
        setBeamPositions(
            Array.from({ length: count }, (_, i) => ((i + 1) * h) / (count + 1))
        )
    }, [text, font, coverColor, highlightWord])

    return (
        <>
            <style>{pulseKeyframes}</style>

            <div style={{ width: "100%", textAlign }}>
                <div style={{ display: "inline-block" }}>
                    {beforeText && <span style={font}>{beforeText + " "}</span>}

                    <span style={{ ...font, position: "relative" }}>
                        <span
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                            style={{
                                position: "relative",
                                display: "inline-block",
                            }}
                        >
                            <motion.span
                                ref={maskRef}
                                animate={{
                                    backgroundColor: hovered
                                        ? hoverCoverColor
                                        : coverColor,
                                }}
                                transition={{
                                    duration: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    position: "relative",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                }}
                            >
                                <HoverSparkles
                                    active={hovered}
                                    particles={particles}
                                />

                                {beamPositions.map((y, i) => (
                                    <Beam
                                        key={i}
                                        y={y}
                                        width={width}
                                        color={
                                            hovered ? hoverBeamColor : beamColor
                                        }
                                        duration={
                                            hovered
                                                ? 0.45
                                                : Math.random() * 1 + 0.7
                                        }
                                    />
                                ))}

                                <motion.span
                                    animate={{
                                        scale: hovered ? 0.83 : 1,
                                        x: hovered
                                            ? [0, -0.6, 0.6, -0.6, 0.6, 0]
                                            : 0,
                                        y: hovered
                                            ? [0, 0.4, -0.4, 0.4, -0.4, 0]
                                            : 0,
                                        color: hovered
                                            ? "#ffffff"
                                            : highlightTextColor,
                                    }}
                                    transition={{
                                        scale: {
                                            duration: 0.9,
                                            ease: [0.22, 1, 0.36, 1],
                                        },
                                        x: {
                                            duration: 0.28,
                                            delay: 0.15,
                                            repeat: hovered ? Infinity : 0,
                                        },
                                        y: {
                                            duration: 0.28,
                                            delay: 0.15,
                                            repeat: hovered ? Infinity : 0,
                                        },
                                    }}
                                    style={{
                                        position: "relative",
                                        zIndex: 2,
                                        display: "inline-block",
                                    }}
                                >
                                    {highlightedWord}
                                </motion.span>
                            </motion.span>

                            {!hovered && (
                                <>
                                    <Dot
                                        size={dots.size}
                                        color={dots.color}
                                        style={{ top: -2, left: -2 }}
                                        delay={0}
                                    />
                                    <Dot
                                        size={dots.size}
                                        color={dots.color}
                                        style={{ top: -2, right: -2 }}
                                        delay={0.4}
                                    />
                                    <Dot
                                        size={dots.size}
                                        color={dots.color}
                                        style={{ bottom: -2, right: -2 }}
                                        delay={0.8}
                                    />
                                    <Dot
                                        size={dots.size}
                                        color={dots.color}
                                        style={{ bottom: -2, left: -2 }}
                                        delay={1.2}
                                    />
                                </>
                            )}
                        </span>
                    </span>

                    {afterText && <span style={font}>{" " + afterText}</span>}
                </div>
            </div>
        </>
    )
}

/* ---------- Beam ---------- */

function Beam({
    y,
    width,
    color,
    duration,
}: {
    y: number
    width: number
    color: string
    duration: number
}) {
    const id = React.useId()

    return (
        <motion.svg
            width={width}
            height={1}
            style={{ position: "absolute", top: y, left: 0 }}
        >
            <motion.line
                x1="0"
                y1="0.5"
                x2={width}
                y2="0.5"
                stroke={`url(#beam-${id})`}
            />
            <defs>
                <motion.linearGradient
                    id={`beam-${id}`}
                    gradientUnits="userSpaceOnUse"
                    initial={{ x1: "-10%", x2: "0%" }}
                    animate={{ x1: "110%", x2: "100%" }}
                    transition={{ duration, ease: "linear", repeat: Infinity }}
                >
                    <stop offset="0%" stopColor={color} stopOpacity="0" />
                    <stop offset="50%" stopColor={color} stopOpacity="1" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </motion.linearGradient>
            </defs>
        </motion.svg>
    )
}

/* ---------- Dot ---------- */

function Dot({
    size,
    color,
    style,
    delay,
}: {
    size: number
    color: string
    style: React.CSSProperties
    delay: number
}) {
    return (
        <span
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "50%",
                backgroundColor: color,
                animation: "autocover-pulse 1.6s ease-in-out infinite",
                animationDelay: `${delay}s`,
                ...style,
            }}
        />
    )
}

/* ---------- Defaults (FIXED, WARNING-FREE) ---------- */

AutoCover.defaultProps = {
    text: "Build amazing websites at warp speed",
    highlightWord: "",
    textAlign: "left",
    highlightTextColor: "#111827",
    coverColor: "#e5e7eb",
    hoverCoverColor: "#111827",
    beamColor: "#3b82f6",
    hoverBeamColor: "#60a5fa",
    particles: {
        count: 70,
        size: 1.2,
        color: "#ffffff",
    },
    dots: {
        size: 6,
        color: "rgba(0,0,0,0.35)",
    },
    font: {
        fontFamily: "Inter",
        fontSize: 56,
        fontWeight: 600,
        lineHeight: "1.1em",
        letterSpacing: "-0.02em",
    },
} as const satisfies Partial<Props>

/* ---------- Controls ---------- */

addPropertyControls(AutoCover, {
    text: { type: ControlType.String },
    highlightWord: { type: ControlType.String },
    highlightTextColor: { type: ControlType.Color },
    textAlign: {
        type: ControlType.Enum,
        options: ["left", "center", "right"],
    },
    coverColor: { type: ControlType.Color },
    hoverCoverColor: { type: ControlType.Color },
    beamColor: { type: ControlType.Color },
    hoverBeamColor: { type: ControlType.Color },
    particles: {
        type: ControlType.Object,
        controls: {
            count: { type: ControlType.Number, min: 10, max: 150 },
            size: { type: ControlType.Number, min: 0.5, max: 4 },
            color: { type: ControlType.Color },
        },
    },
    dots: {
        type: ControlType.Object,
        controls: {
            size: { type: ControlType.Number, min: 2, max: 12 },
            color: { type: ControlType.Color },
        },
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
    },
})
