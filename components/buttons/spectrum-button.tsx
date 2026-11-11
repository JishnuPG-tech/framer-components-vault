import { useRef, useEffect } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface GradientBorderButtonProps {
    label: string
    link: string
    newTab: boolean
    color1: string
    color2: string
    color3: string
    useThird: boolean
    speed: number
    borderWidth: number
    background: string
    textColor: string
    cornerRadius: number
    paddingX: number
    paddingY: number
    glow: number
    hoverSpeedUp: boolean
    font: CSSProperties
    style?: CSSProperties
}

/**
 * ANIMATED GRADIENT BORDER BUTTON
 *
 * A button wrapped in a colourful gradient border that continuously rotates
 * around the edge, while the inside stays a solid background. The modern,
 * premium look used by AI and SaaS products. Optional outer glow and an
 * optional speed-up on hover.
 *
 * The rotation is driven by requestAnimationFrame (not CSS keyframes), so it
 * animates reliably everywhere including the Framer canvas. Pure React — no
 * dependencies, no WebGL. Every colour, the speed, thickness, glow and font
 * are editable. Works with Framer's native sizing (Fit or Fixed).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 56
 */
export default function GradientBorderButton(props: GradientBorderButtonProps) {
    const {
        label,
        link,
        newTab,
        color1,
        color2,
        color3,
        useThird,
        speed,
        borderWidth,
        background,
        textColor,
        cornerRadius,
        paddingX,
        paddingY,
        glow,
        hoverSpeedUp,
        font,
        style,
    } = props

    const gradRef = useRef<HTMLDivElement>(null)
    const angle = useRef(0)
    const raf = useRef<number>(0)
    const hovering = useRef(false)

    const stops = useThird
        ? `${color1}, ${color2}, ${color3}, ${color1}`
        : `${color1}, ${color2}, ${color1}`

    useEffect(() => {
        const baseDegPerFrame = speed * 1.5 // tune: speed 1 ≈ 1.5°/frame
        const tick = () => {
            const mult = hoverSpeedUp && hovering.current ? 2.5 : 1
            angle.current = (angle.current + baseDegPerFrame * mult) % 360
            if (gradRef.current) {
                gradRef.current.style.background = `conic-gradient(from ${angle.current}deg, ${stops})`
            }
            raf.current = requestAnimationFrame(tick)
        }
        raf.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf.current)
    }, [stops, speed, hoverSpeedUp])

    const bw = Math.max(1, borderWidth)

    return (
        <a
            href={link || undefined}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => (hovering.current = false)}
            style={{
                ...style,
                position: "relative",
                display: "inline-flex",
                width: "100%",
                height: "100%",
                borderRadius: cornerRadius,
                textDecoration: "none",
                cursor: "pointer",
                boxSizing: "border-box",
                filter:
                    glow > 0 ? `drop-shadow(0 0 ${glow}px ${color2})` : "none",
                isolation: "isolate",
            }}
        >
            {/* rotating gradient layer (clipped to the rounded rect) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: cornerRadius,
                    overflow: "hidden",
                    zIndex: 0,
                }}
            >
                <div
                    ref={gradRef}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "250%",
                        height: "250%",
                        transform: "translate(-50%, -50%)",
                        background: `conic-gradient(from 0deg, ${stops})`,
                    }}
                />
            </div>

            {/* inner surface inset by the border width = the visible button face */}
            <span
                style={{
                    position: "relative",
                    zIndex: 1,
                    margin: bw,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background,
                    color: textColor,
                    borderRadius: Math.max(0, cornerRadius - bw),
                    paddingLeft: paddingX,
                    paddingRight: paddingX,
                    paddingTop: paddingY,
                    paddingBottom: paddingY,
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    ...font,
                }}
            >
                {label}
            </span>
        </a>
    )
}

const defaultProps: GradientBorderButtonProps = {
    label: "Get Started",
    link: "",
    newTab: false,
    color1: "#6C5CE7",
    color2: "#00CEC9",
    color3: "#FD79A8",
    useThird: true,
    speed: 1,
    borderWidth: 2,
    background: "#0E0E12",
    textColor: "#FFFFFF",
    cornerRadius: 14,
    paddingX: 30,
    paddingY: 16,
    glow: 0,
    hoverSpeedUp: true,
    font: { fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 600 },
}

GradientBorderButton.defaultProps = defaultProps

addPropertyControls(GradientBorderButton, {
    label: { type: ControlType.String, title: "Label" },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    color1: { type: ControlType.Color, title: "Color 1" },
    color2: { type: ControlType.Color, title: "Color 2" },
    useThird: {
        type: ControlType.Boolean,
        title: "3rd Color",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        hidden: (p: Partial<GradientBorderButtonProps>) => !p.useThird,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 8,
        step: 0.1,
        description: "Rotation speed (0 = static).",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 1,
        max: 24,
        step: 1,
        unit: "px",
    },
    background: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text Color" },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        description: "Used when width is set to Fit.",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        description: "Used when height is set to Fit.",
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        description: "Outer glow around the button (0 = off).",
    },
    hoverSpeedUp: {
        type: ControlType.Boolean,
        title: "Hover Speed-Up",
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Spin faster while hovered.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
})
