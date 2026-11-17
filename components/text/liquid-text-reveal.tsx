import * as React from "react"
import { motion, useInView, useAnimationFrame } from "framer-motion"
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

interface LiquidTextRevealProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string
    font: any
    emptyColor: string
    fillType: "solid" | "gradient"
    fillColor: string
    gradientStart: string
    gradientEnd: string
    gradientAngle: number
    fillMode: "animate" | "static"
    fillPercentage: number
    riseDuration: number
    waveSpeed: number
    waveDirection: "left" | "right"
    waveAmplitude: number
    waveScale: number
    delay: number
    disableAnimation: boolean
    hasShadow: boolean
    shadowColor: string
    shadowX: number
    shadowY: number
    shadowBlur: number
    hasBorder: boolean
    borderWidth: number
    borderColor: string
    style?: CSSProperties
}

/**
 * Liquid Text Reveal
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LiquidTextReveal(props: LiquidTextRevealProps) {
    const {
        text = "Liquid",
        font = {},
        emptyColor = "#EEEEEE",
        fillType = "solid",
        fillColor = "#0099FF",
        gradientStart = "#0099FF",
        gradientEnd = "#00FF99",
        gradientAngle = 90,
        fillMode = "animate",
        fillPercentage = 100,
        riseDuration = 2.5,
        waveSpeed = 1.0,
        waveDirection = "right",
        waveAmplitude = 15,
        waveScale = 100,
        delay = 0.2,
        disableAnimation = false,
        hasShadow = false,
        shadowColor = "rgba(0,0,0,0.2)",
        shadowX = 0,
        shadowY = 10,
        shadowBlur = 20,
        hasBorder = false,
        borderWidth = 2,
        borderColor = "#000000",
        style,
        ...rest
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })

    // Safety clamps
    const A = Math.max(0.1, waveAmplitude)
    const W = Math.max(1, waveScale)
    const SOLID_HEIGHT = 10000

    // SVG Wave Data URI
    const svgWave = React.useMemo(() => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${A}" preserveAspectRatio="none"><path d="M 0 ${A / 2} Q ${W / 4} ${-A / 2} ${W / 2} ${A / 2} T ${W} ${A / 2} L ${W} ${A} L 0 ${A} Z" fill="black" /></svg>`
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    }, [W, A])

    // Calculates the CSS mask positions based on a fill fraction (0 = empty, 1 = full)
    const getFillVars = (F: number) => ({
        "--wy-wave": `calc(${(1 - F) * 100}% + ${A - 2 * A * F}px)`,
        "--wy-solid": `calc(${(1 - F) * 100}% + ${(SOLID_HEIGHT + A) * (1 - F)}px)`,
    })

    const showStatic = fillMode === "static" || disableAnimation || isStatic
    const targetFill = fillPercentage / 100

    const startFill = showStatic ? targetFill : 0
    const endFill = isInView || isCanvas ? targetFill : startFill

    const shouldAnimateWaveX = !disableAnimation && !isStatic
    const shouldAnimateY = !showStatic && !isCanvas

    const backgroundStyle =
        fillType === "gradient"
            ? `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`
            : fillColor

    const foregroundRef = React.useRef<HTMLDivElement>(null)
    const wx = React.useRef(0)

    useAnimationFrame((time, delta) => {
        if (!shouldAnimateWaveX || !foregroundRef.current) return
        const speedInPxPerMs = (waveSpeed * 100) / 1000
        const dir = waveDirection === "right" ? 1 : -1
        wx.current = (wx.current + delta * speedInPxPerMs * dir) % W
        foregroundRef.current.style.setProperty("--wx", `${wx.current}px`)
    })

    const textStyles: CSSProperties = {
        ...font,
        width: "100%",
        margin: 0,
        padding: 0,
        textAlign: font.textAlign || "center",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
            {...rest}
        >
            {/* Inner Wrapper ensures text layers overlap perfectly and dictates natural height */}
            <div style={{ position: "relative", width: "100%" }}>
                {/* Background (Empty) Text */}
                <div
                    style={{
                        ...textStyles,
                        color: emptyColor,
                        WebkitTextStroke: hasBorder
                            ? `${borderWidth}px ${borderColor}`
                            : undefined,
                        textShadow: hasShadow
                            ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
                            : undefined,
                    }}
                >
                    {text}
                </div>

                {/* Foreground (Liquid Filled) Text Container */}
                <motion.div
                    ref={foregroundRef}
                    initial={{ ...getFillVars(startFill) } as any}
                    animate={{ ...getFillVars(endFill) } as any}
                    transition={
                        {
                            "--wy-wave": {
                                duration: shouldAnimateY ? riseDuration : 0,
                                delay: shouldAnimateY ? delay : 0,
                                ease: "easeInOut",
                            },
                            "--wy-solid": {
                                duration: shouldAnimateY ? riseDuration : 0,
                                delay: shouldAnimateY ? delay : 0,
                                ease: "easeInOut",
                            },
                        } as any
                    }
                    style={
                        {
                            position: "absolute",
                            top: "-40px",
                            bottom: "-40px",
                            left: 0,
                            right: 0,
                            padding: "40px 0",
                            zIndex: 2,
                            WebkitMaskImage: `url('${svgWave}'), linear-gradient(black, black)`,
                            WebkitMaskSize: `${W}px ${A}px, 100% ${SOLID_HEIGHT}px`,
                            WebkitMaskRepeat: `repeat-x, no-repeat`,
                            WebkitMaskPosition: `var(--wx, 0px) var(--wy-wave), 0px var(--wy-solid)`,
                            maskImage: `url('${svgWave}'), linear-gradient(black, black)`,
                            maskSize: `${W}px ${A}px, 100% ${SOLID_HEIGHT}px`,
                            maskRepeat: `repeat-x, no-repeat`,
                            maskPosition: `var(--wx, 0px) var(--wy-wave), 0px var(--wy-solid)`,
                            pointerEvents: "none",
                        } as any
                    }
                >
                    {/* Inner Text Node handles the color/gradient clipping */}
                    <div style={textStyles}>
                        <span
                            style={
                                fillType === "solid"
                                    ? {
                                          color: fillColor,
                                          WebkitTextStroke: hasBorder
                                              ? `${borderWidth}px ${borderColor}`
                                              : undefined,
                                      }
                                    : {
                                          backgroundImage: backgroundStyle,
                                          WebkitBackgroundClip: "text",
                                          WebkitTextFillColor: "transparent",
                                          backgroundClip: "text",
                                          color: "transparent",
                                          WebkitTextStroke: hasBorder
                                              ? `${borderWidth}px ${borderColor}`
                                              : undefined,
                                      }
                            }
                        >
                            {text}
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

addPropertyControls(LiquidTextReveal, {
    text: { type: ControlType.String, title: "Text", defaultValue: "Liquid" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 80,
            variant: "Bold",
            lineHeight: "1.2em",
            letterSpacing: "-0.02em",
            textAlign: "center",
        },
    },
    emptyColor: {
        type: ControlType.Color,
        title: "Empty Color",
        defaultValue: "#EEEEEE",
    },
    fillType: {
        type: ControlType.Enum,
        title: "Fill Type",
        options: ["solid", "gradient"],
        optionTitles: ["Solid Color", "Gradient"],
        defaultValue: "solid",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0099FF",
        hidden: (props) => props.fillType !== "solid",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#0099FF",
        hidden: (props) => props.fillType !== "gradient",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "End Color",
        defaultValue: "#00FF99",
        hidden: (props) => props.fillType !== "gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        min: 0,
        max: 360,
        defaultValue: 90,
        unit: "°",
        hidden: (props) => props.fillType !== "gradient",
    },
    fillMode: {
        type: ControlType.Enum,
        title: "Behavior",
        options: ["animate", "static"],
        optionTitles: ["Fill on Appear", "Static Fill"],
        defaultValue: "animate",
    },
    fillPercentage: {
        type: ControlType.Number,
        title: "Fill (%)",
        min: 0,
        max: 100,
        defaultValue: 100,
        unit: "%",
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Height",
        min: 0,
        max: 100,
        defaultValue: 15,
        unit: "px",
    },
    waveScale: {
        type: ControlType.Number,
        title: "Wave Width",
        min: 10,
        max: 500,
        defaultValue: 100,
        unit: "px",
    },
    waveDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["right", "left"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "right",
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.0,
        description: "Velocity multiplier for the horizontal wave flow.",
    },
    riseDuration: {
        type: ControlType.Number,
        title: "Fill Duration",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 2.5,
        unit: "s",
        hidden: (props) => props.fillMode === "static",
    },
    delay: {
        type: ControlType.Number,
        title: "Entry Delay",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.2,
        unit: "s",
        hidden: (props) => props.fillMode === "static",
    },
    disableAnimation: {
        type: ControlType.Boolean,
        title: "Disable Anim.",
        defaultValue: false,
        description:
            "Disables all movement, including the continuous liquid wave.",
    },
    hasShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.2)",
        hidden: (p) => !p.hasShadow,
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        hidden: (p) => !p.hasShadow,
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 10,
        hidden: (p) => !p.hasShadow,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        min: 0,
        defaultValue: 20,
        hidden: (p) => !p.hasShadow,
    },
    hasBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 20,
        defaultValue: 2,
        hidden: (p) => !p.hasBorder,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
        hidden: (p) => !p.hasBorder,
    },
})
