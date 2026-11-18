// Orbit Glow Card — FREE Framer component from Orbit Kit
// A card whose border and surface light up where the cursor is (spotlight hover).
// More motion components: https://rasareka.gumroad.com/l/orbit-kit
import * as React from "react"
import { useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    emoji: string
    title: string
    text: string
    link: string
    glowColor: string
    glowSize: number
    background: string
    borderColor: string
    borderWidth: number
    radius: number
    padding: number
    titleColor: string
    textColor: string
    titleFont: React.CSSProperties
    textFont: React.CSSProperties
    surfaceGlow: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 220
 */
export default function OrbitSpotlightCard(props: Props) {
    const {
        emoji = "✨",
        title = "Spotlight hover",
        text = "Move your cursor over this card. The border and surface light up right where you point.",
        link = "",
        glowColor = "#7c5cff",
        glowSize = 260,
        background = "#111116",
        borderColor = "rgba(255,255,255,0.08)",
        borderWidth = 1.5,
        radius = 20,
        padding = 28,
        titleColor = "#ffffff",
        textColor = "rgba(255,255,255,0.65)",
        titleFont,
        textFont,
        surfaceGlow = 0.22,
        style,
    } = props
    const ref = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState({ x: -9999, y: -9999, on: false })
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // In the editor, show the glow at the top-left so the effect is visible while designing
    const p = isCanvas ? { x: 60, y: 40, on: true } : pos

    const onMove = (e: React.PointerEvent) => {
        const b = ref.current?.getBoundingClientRect()
        if (!b) return
        setPos({ x: e.clientX - b.left, y: e.clientY - b.top, on: true })
    }
    const glow = p.on
        ? `radial-gradient(${glowSize}px circle at ${p.x}px ${p.y}px, ${glowColor}, transparent 70%)`
        : "none"
    const surface = p.on
        ? `radial-gradient(${glowSize * 1.4}px circle at ${p.x}px ${p.y}px, ${hexA(glowColor, surfaceGlow)}, transparent 70%)`
        : "none"

    const body = (
        <div
            ref={ref}
            onPointerMove={onMove}
            onPointerLeave={() => setPos((s) => ({ ...s, on: false }))}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: radius,
                padding: borderWidth,
                background: `${glow}, ${borderColor}`,
                boxSizing: "border-box",
                transition: "background 0.15s",
                cursor: link ? "pointer" : "default",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: Math.max(0, radius - borderWidth),
                    background: `${surface}, ${background}`,
                    padding,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    overflow: "hidden",
                }}
            >
                {emoji && (
                    <div style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</div>
                )}
                {title && (
                    <div
                        style={{
                            color: titleColor,
                            fontSize: 20,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            ...titleFont,
                        }}
                    >
                        {title}
                    </div>
                )}
                {text && (
                    <div
                        style={{
                            color: textColor,
                            fontSize: 15,
                            lineHeight: 1.5,
                            ...textFont,
                        }}
                    >
                        {text}
                    </div>
                )}
            </div>
        </div>
    )
    if (link && !isCanvas) {
        return (
            <a
                href={link}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    textDecoration: "none",
                }}
            >
                {body}
            </a>
        )
    }
    return body
}

// Accepts #rgb/#rrggbb/rgb()/rgba() and returns rgba() with the given alpha
function hexA(c: string, a: number): string {
    if (c.startsWith("#")) {
        let h = c.slice(1)
        if (h.length === 3)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
    }
    const m = c.match(/[\d.]+/g)
    if (m && m.length >= 3) return `rgba(${m[0]},${m[1]},${m[2]},${a})`
    return c
}

addPropertyControls(OrbitSpotlightCard, {
    emoji: { type: ControlType.String, title: "Emoji", defaultValue: "✨" },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Spotlight hover",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "Move your cursor over this card. The border and surface light up right where you point.",
    },
    link: { type: ControlType.Link, title: "Link" },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#7c5cff",
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        min: 60,
        max: 800,
        step: 10,
        unit: "px",
        defaultValue: 260,
    },
    surfaceGlow: {
        type: ControlType.Number,
        title: "Surface Glow",
        min: 0,
        max: 0.6,
        step: 0.01,
        defaultValue: 0.22,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111116",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        min: 0,
        max: 8,
        step: 0.5,
        unit: "px",
        defaultValue: 1.5,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        unit: "px",
        defaultValue: 20,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 80,
        unit: "px",
        defaultValue: 28,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgba(255,255,255,0.65)",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
