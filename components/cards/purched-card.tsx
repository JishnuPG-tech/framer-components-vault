import React, { useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"
import { GrainGradient } from "@paper-design/shaders-react"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed-any
 * @framerSupportedLayoutWidth fixed-any
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 230
 */

// Types
type PunchPosition =
    | "none"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "both-horizontal"
    | "both-vertical"
type CardMode = "shader" | "integration" | "image" | "custom"

interface PunchedCardProps {
    mode: CardMode
    punchPosition: PunchPosition
    punchRadius: number
    punchOffsetY: number
    punchOffsetX: number
    borderRadius: number
    cardColor: string
    cardShadow: string
    imageSrc: string
    font: React.CSSProperties
    customContent?: React.ReactNode
    title: string
    subtitle: string
    badgeText: string
    shader: {
        softness: number
        intensity: number
        noise: number
        color1: string
        color2: string
        color3: string
        color4: string
    }
}

export default function PunchedCard(props: PunchedCardProps) {
    const {
        mode,
        punchPosition,
        punchRadius,
        punchOffsetY,
        punchOffsetX,
        borderRadius,
        cardShadow,
        cardColor,
        imageSrc,
        customContent,
        title,
        subtitle,
        badgeText,
        font,
        shader: { intensity, softness, noise, color1, color2, color3, color4 },
    } = props

    // Detect Framer Canvas and Static Exporters
    const isStatic = useIsStaticRenderer()

    // Intersection Observer for Viewport Detection
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef)

    const shouldAnimate = !isStatic && isInView

    // Build CSS radial-gradient mask to "punch out" the edge notches dynamically
    const buildMask = () => {
        const masks: string[] = []
        const r = `${punchRadius}px`
        const xPct = `${punchOffsetX}%`
        const yPct = `${punchOffsetY}%`

        const makeHole = (posX: string, posY: string) =>
            `radial-gradient(circle at ${posX} ${posY}, transparent ${r}, black calc(${r} + 0.5px))`

        if (punchPosition === "none") return "none"

        if (punchPosition === "bottom" || punchPosition === "both-vertical") {
            masks.push(makeHole(xPct, "100%"))
        }
        if (punchPosition === "top" || punchPosition === "both-vertical") {
            masks.push(makeHole(xPct, "0%"))
        }
        if (punchPosition === "left" || punchPosition === "both-horizontal") {
            masks.push(makeHole("0%", yPct))
        }
        if (punchPosition === "right" || punchPosition === "both-horizontal") {
            masks.push(makeHole("100%", yPct))
        }

        return masks.join(", ")
    }

    const maskStyle: React.CSSProperties = {
        WebkitMaskImage: buildMask(),
        maskImage: buildMask(),
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
    }

    // Render Content based on Mode
    const renderModeContent = () => {
        switch (mode) {
            case "shader":
                return (
                    <div
                        style={{
                            boxShadow: cardShadow,
                            width: "100%" || 160,
                            height: "100%" || 230,
                            minWidth: "100px",
                            minHeight: "100px",
                        }}
                    >
                        <GrainGradient
                            speed={shouldAnimate ? 0.4 : 0}
                            scale={1}
                            rotation={0}
                            offsetX={0}
                            offsetY={0}
                            softness={softness}
                            intensity={intensity}
                            noise={noise}
                            shape="corners"
                            frame={164391.589}
                            colors={[color1, color2, color3]}
                            colorBack={color4}
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#000000",
                            }}
                        />
                    </div>
                )

            case "image":
                return (
                    <img
                        src={imageSrc}
                        alt="Card background"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )

            case "integration":
                return (
                    <div
                        style={{
                            boxShadow: cardShadow,
                            width: "100%",
                            height: "100%",
                            minWidth: "100px",
                            minHeight: "100px",
                            backgroundColor: cardColor,
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            justify: "space-between",
                            boxSizing: "border-box",
                            fontFamily: "sans-serif",
                            color: "#111",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    ...font,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    opacity: 0.6,
                                }}
                            >
                                {subtitle}
                            </span>
                            <span
                                style={{
                                    backgroundColor: "#000",
                                    color: "#fff",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "10px",
                                    fontWeight: 600,
                                }}
                            >
                                {badgeText}
                            </span>
                        </div>

                        <div>
                            <h2
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 800,
                                    margin: "0 0 8px 0",
                                    letterSpacing: "-0.5px",
                                }}
                            >
                                {title}
                            </h2>
                            <div
                                style={{
                                    height: "4px",
                                    width: "40px",
                                    backgroundColor: "#111",
                                    borderRadius: "2px",
                                }}
                            />
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    height: "8px",
                                    flex: 1,
                                    backgroundColor: "#E5E5E5",
                                    borderRadius: "4px",
                                }}
                            />
                            <div
                                style={{
                                    height: "8px",
                                    width: "24px",
                                    backgroundColor: "#111",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>
                    </div>
                )

            case "custom":
                return (
                    <div
                        style={{
                            boxShadow: cardShadow,
                            width: "100%",
                            height: "100%",
                            minWidth: "100px",
                            minHeight: "100px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {customContent ? (
                            customContent
                        ) : (
                            <div
                                style={{
                                    color: "#999",
                                    fontSize: "13px",
                                    textAlign: "center",
                                    padding: "20px",
                                }}
                            >
                                Connect a Framer frame via the component slot
                            </div>
                        )}
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                ...maskStyle,
            }}
        >
            {renderModeContent()}
        </div>
    )
}

// Controls configuration for Framer Property Panel
addPropertyControls(PunchedCard, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["shader", "integration", "image", "custom"],
        optionTitles: ["Shader", "Integration", "Image", "Custom Slot"],
        defaultValue: "image",
    },
    punchPosition: {
        type: ControlType.Enum,
        title: "Punch Side",
        options: [
            "none",
            "bottom",
            "top",
            "left",
            "right",
            "both-horizontal",
            "both-vertical",
        ],
        optionTitles: [
            "None",
            "Bottom",
            "Top",
            "Left",
            "Right",
            "Both Sides (H)",
            "Both Sides (V)",
        ],
        defaultValue: "bottom",
    },
    punchRadius: {
        type: ControlType.Number,
        title: "Punch Size",
        min: 4,
        max: 50,
        step: 1,
        defaultValue: 16,
        unit: "px",
    },
    punchOffsetY: {
        type: ControlType.Number,
        title: "Punch Pos Y",
        min: 10,
        max: 90,
        step: 1,
        defaultValue: 50,
        unit: "%",
        hidden: (props) =>
            props.punchPosition === "top" ||
            props.punchPosition === "bottom" ||
            props.punchPosition === "none",
    },
    punchOffsetX: {
        type: ControlType.Number,
        title: "Punch Pos X",
        min: 10,
        max: 90,
        step: 1,
        defaultValue: 50,
        unit: "%",
        hidden: (props) =>
            props.punchPosition === "left" ||
            props.punchPosition === "right" ||
            props.punchPosition === "none",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 20,
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            letterSpacing: "-.01em",
            lineHeight: 1.2,
        },
    },
    cardShadow: {
        title: "Card Shadow",
        type: ControlType.BoxShadow,
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.mode !== "integration",
    },
    imageSrc: {
        type: ControlType.Image,
        title: "Image",
        hidden: (props) => props.mode !== "image",
    },
    customContent: {
        type: ControlType.ComponentInstance,
        title: "Design Slot",
        hidden: (props) => props.mode !== "custom",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "SFO → CDG",
        hidden: (props) => props.mode !== "integration",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "BOARDING PASS",
        hidden: (props) => props.mode !== "integration",
    },
    badgeText: {
        type: ControlType.String,
        title: "Badge",
        defaultValue: "ADMIT 1",
        hidden: (props) => props.mode !== "integration",
    },
    shader: {
        title: "Shader",
        type: ControlType.Object,
        hidden(props) {
            return props.mode !== "shader"
        },
        controls: {
            softness: {
                title: "Softness",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.1,
                defaultValue: 0.5,
            },
            intensity: {
                title: "Intensity",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.1,
                defaultValue: 0,
            },
            noise: {
                title: "Noise",
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.1,
                defaultValue: 0,
            },
            color1: {
                title: "Color Top",
                type: ControlType.Color,
                defaultValue: "#EBA8FF",
            },
            color2: {
                title: "Color Middle",
                type: ControlType.Color,
                defaultValue: "#00BFFF",
            },
            color3: {
                title: "Color Bottom",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
            color4: {
                title: "Color Back",
                type: ControlType.Color,
                defaultValue: "#000000",
            },
        },
    },
})
