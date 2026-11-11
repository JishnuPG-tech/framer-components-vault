// Scroll Velocity Warp — Elastic skew effect driven by scroll speed

import { type CSSProperties } from "react"
import {
    motion,
    useScroll,
    useVelocity,
    useTransform,
    useSpring,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface BorderSettings {
    width?: number
    color?: string
    style?: "solid" | "dashed" | "dotted"
}

interface AnimationSettings {
    intensity?: number
    skewAxis?: "skewY" | "skewX"
    triggerSpeed?: number
    snapSpeed?: number
    damping?: number
    mass?: number
}

interface ScrollVelocityWarpProps {
    animation?: AnimationSettings
    cornerRadius?: number
    border?: BorderSettings
    shadow?: string
    children?: React.ReactNode
    style?: CSSProperties
}

// ── Shared placeholder ────────────────────────────────────────────────────────
function Placeholder({
    style,
    animated,
}: {
    style?: CSSProperties
    animated: boolean
}) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                background: "#0c0c12",
                border: "1px solid #4e62ff40",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                overflow: "hidden",
                position: "relative",
                ...style,
            }}
        >
            {/* Scan lines */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "repeating-linear-gradient(110deg, transparent 0px, transparent 22px, #4e62ff0a 22px, #4e62ff0a 23px)",
                    animation: animated
                        ? "svwScan 3s linear infinite"
                        : undefined,
                    pointerEvents: "none",
                }}
            />

            {/* Warp icon */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: "relative", flexShrink: 0 }}
            >
                <line
                    x1="2"
                    y1="9"
                    x2="30"
                    y2="5"
                    stroke="#4e62ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <line
                    x1="2"
                    y1="16"
                    x2="30"
                    y2="16"
                    stroke="#4e62ff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <line
                    x1="2"
                    y1="23"
                    x2="30"
                    y2="27"
                    stroke="#4e62ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>

            {/* Label */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    position: "relative",
                }}
            >
                <span
                    style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#ffffff",
                        letterSpacing: "-0.01em",
                    }}
                >
                    Scroll Velocity Warp
                </span>
                <span
                    style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        color: "#4e62ff",
                        opacity: 0.75,
                    }}
                >
                    Connect a layer to the Slot ↑
                </span>
            </div>

            {animated && (
                <style>{`
                    @keyframes svwScan {
                        from { background-position-x: 0px; }
                        to   { background-position-x: 46px; }
                    }
                `}</style>
            )}
        </div>
    )
}

// ── Static canvas/export path — no motion hooks, no scroll listeners ──────────
function StaticWarp({
    children,
    cornerRadius,
    borderWidth,
    borderColor,
    borderStyle,
    shadow,
    style,
}: {
    children?: React.ReactNode
    cornerRadius: number
    borderWidth: number
    borderColor: string
    borderStyle: string
    shadow?: string
    style?: CSSProperties
}) {
    if (!children) return <Placeholder style={style} animated={false} />

    const innerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        borderRadius: cornerRadius > 0 ? cornerRadius : undefined,
        overflow: cornerRadius > 0 ? "hidden" : "visible",
        border:
            borderWidth > 0
                ? `${borderWidth}px ${borderStyle} ${borderColor}`
                : undefined,
        boxShadow: shadow || undefined,
        boxSizing: "border-box",
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "visible",
                ...style,
            }}
        >
            <div style={innerStyle}>{children}</div>
        </div>
    )
}

// ── Live preview/published path — scroll-linked skew ─────────────────────────
function LiveWarp({
    children,
    intensity,
    skewAxis,
    triggerSpeed,
    snapSpeed,
    damping,
    mass,
    cornerRadius,
    borderWidth,
    borderColor,
    borderStyle,
    shadow,
    style,
}: {
    children?: React.ReactNode
    intensity: number
    skewAxis: "skewY" | "skewX"
    triggerSpeed: number
    snapSpeed: number
    damping: number
    mass: number
    cornerRadius: number
    borderWidth: number
    borderColor: string
    borderStyle: string
    shadow?: string
    style?: CSSProperties
}) {
    const { scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)

    const rawSkew = useTransform(
        scrollVelocity,
        [-triggerSpeed, 0, triggerSpeed],
        [intensity, 0, -intensity]
    )

    const smoothSkew = useSpring(rawSkew, {
        stiffness: snapSpeed,
        damping,
        mass,
    })

    if (!children) return <Placeholder style={style} animated={true} />

    const innerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        borderRadius: cornerRadius > 0 ? cornerRadius : undefined,
        overflow: cornerRadius > 0 ? "hidden" : "visible",
        border:
            borderWidth > 0
                ? `${borderWidth}px ${borderStyle} ${borderColor}`
                : undefined,
        boxShadow: shadow || undefined,
        boxSizing: "border-box",
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "visible",
                ...style,
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    willChange: "transform",
                    ...(skewAxis === "skewY"
                        ? { skewY: smoothSkew }
                        : { skewX: smoothSkew }),
                }}
            >
                <div style={innerStyle}>{children}</div>
            </motion.div>
        </div>
    )
}

// ── Public export — routes to static or live based on render context ──────────
/**
 *
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollVelocityWarp({
    animation: {
        intensity = 12,
        skewAxis = "skewY",
        triggerSpeed = 2000,
        snapSpeed = 400,
        damping = 30,
        mass = 0.1,
    } = {},
    cornerRadius = 0,
    border: {
        width: borderWidth = 0,
        color: borderColor = "#000000",
        style: borderStyle = "solid",
    } = {},
    shadow,
    children,
    style,
}: ScrollVelocityWarpProps) {
    const isStatic = useIsStaticRenderer()

    const sharedProps = {
        children,
        cornerRadius,
        borderWidth,
        borderColor,
        borderStyle,
        shadow,
        style,
    }

    if (isStatic) {
        return <StaticWarp {...sharedProps} />
    }

    return (
        <LiveWarp
            {...sharedProps}
            intensity={intensity}
            skewAxis={skewAxis}
            triggerSpeed={triggerSpeed}
            snapSpeed={snapSpeed}
            damping={damping}
            mass={mass}
        />
    )
}

addPropertyControls(ScrollVelocityWarp, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Slot",
        description: "Drop any layer here: image, text, section, or component",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        description: "Rounds the corners of the slotted content",
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 0,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                description: "Edit border width",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#000000",
                description: "Edit border color",
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["solid", "dashed", "dotted"],
                optionTitles: ["Solid", "Dashed", "Dotted"],
                defaultValue: "solid",
                description: "Edit Border Style",
            },
        },
        description: "Control border properties",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        description: "Edit Shadow Style",
    },
    animation: {
        type: ControlType.Object,
        title: "Animation Settings",
        description:
            "Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
        controls: {
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 12,
                min: 0,
                max: 30,
                step: 0.5,
                unit: "deg",
                description: "Max skew angle at peak scroll speed",
            },
            skewAxis: {
                type: ControlType.Enum,
                title: "Axis",
                options: ["skewY", "skewX"],
                optionTitles: ["Y — Vertical", "X — Horizontal"],
                defaultValue: "skewY",
                description: "Direction of the warp",
            },
            triggerSpeed: {
                type: ControlType.Number,
                title: "Trigger Speed",
                defaultValue: 2000,
                min: 300,
                max: 5000,
                step: 100,
                description: "Scroll speed (px/s) that hits max skew",
            },
            snapSpeed: {
                type: ControlType.Number,
                title: "Snap Speed",
                defaultValue: 400,
                min: 50,
                max: 1200,
                step: 10,
                description: "How fast it springs back to normal",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: 30,
                min: 5,
                max: 100,
                step: 1,
                description: "Higher = less wobble on the return snap",
            },
            mass: {
                type: ControlType.Number,
                title: "Mass",
                defaultValue: 0.1,
                min: 0.01,
                max: 1,
                step: 0.01,
                description: "Higher = heavier, slower feel",
            },
        },
    },
})
