"use client"

import { useEffect, useRef, useState, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Types ──────────────────────────────────────────────────────

type GradientDir = "horizontal" | "vertical" | "diagonal" | "radial"

// ── UI constants ───────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
    fontSize: 9,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: "0.12em",
    fontFamily: "monospace",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
}

const SECTION_STYLE: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
}

const VALUE_STYLE: React.CSSProperties = {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "monospace",
    minWidth: 16,
    textAlign: "right",
}

// ── Component ──────────────────────────────────────────────────

export default function TiltTextFX({
    text = "WOAH THERE",
    fontSize = 140,
    autoFit = false,
    fitPadding = 8,
    fontWeight = "700",
    fontFamily = "Inter, sans-serif",
    letterSpacing = -3,
    lineHeight = 1.1,
    textColor = "#ffffff",
    backgroundColor = "#0a0a0a",
    useGradient = false,
    gradientColorTo = "#ff55ee",
    gradientDirection = "horizontal" as GradientDir,
    perspectiveDepth = 900,
    tiltStrength = 60,
    smoothing = 0.08,
    scaleOnHover = true,
    scaleAmount = 1.05,
    demoMode = false,
    style = {},
}: {
    text?: string
    fontSize?: number
    autoFit?: boolean
    fitPadding?: number
    fontWeight?: string
    fontFamily?: string
    letterSpacing?: number
    lineHeight?: number
    textColor?: string
    backgroundColor?: string
    useGradient?: boolean
    gradientColorTo?: string
    gradientDirection?: GradientDir
    perspectiveDepth?: number
    tiltStrength?: number
    smoothing?: number
    scaleOnHover?: boolean
    scaleAmount?: number
    demoMode?: boolean
    style?: React.CSSProperties
}) {
    // ── Refs ───────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const mouseRef = useRef({ x: -9999, y: -9999, over: false })
    // Single object for all animated values — updated each frame, never triggers re-render
    const animRef = useRef({
        rotX: 0,
        rotY: 0,
        scale: 1,
    })
    const rafRef = useRef(0)

    const isStatic = useIsStaticRenderer()

    // ── State ──────────────────────────────────────────────────
    const [computedFontSize, setComputedFontSize] = useState(fontSize)
    const [demoTilt, setDemoTilt] = useState(tiltStrength)

    const activeTilt = demoMode ? demoTilt : tiltStrength

    // ── Live config ref — written every render, read in RAF ────
    const live = useRef({
        tiltStrength: activeTilt,
        perspectiveDepth,
        smoothing,
        scaleOnHover,
        scaleAmount,
    })
    const lc = live.current
    lc.tiltStrength = activeTilt
    lc.perspectiveDepth = perspectiveDepth
    lc.smoothing = smoothing
    lc.scaleOnHover = scaleOnHover
    lc.scaleAmount = scaleAmount

    // ── Auto-fit ───────────────────────────────────────────────
    const computeFontSizeFn = useCallback(() => {
        if (!autoFit) return
        const el = containerRef.current
        if (!el) return
        const cw = el.offsetWidth
        const ch = el.offsetHeight
        if (!cw || !ch) return
        const off = document.createElement("canvas")
        const ctx = off.getContext("2d")!
        ctx.font = `${fontWeight} 100px ${fontFamily}`
        const w100 = ctx.measureText(text).width
        if (w100 === 0) return
        const padded = cw * (1 - (fitPadding * 2) / 100)
        setComputedFontSize(
            Math.min(Math.floor((padded / w100) * 100), Math.floor(ch * 0.85))
        )
    }, [autoFit, fontWeight, fontFamily, text, fitPadding])

    useEffect(() => {
        if (!autoFit) {
            setComputedFontSize(fontSize)
            return
        }
        const el = containerRef.current
        if (!el) return
        let timer = 0
        const ro = new ResizeObserver(() => {
            clearTimeout(timer)
            timer = window.setTimeout(computeFontSizeFn, 80)
        })
        ro.observe(el)
        computeFontSizeFn()
        return () => {
            ro.disconnect()
            clearTimeout(timer)
        }
    }, [autoFit, fontSize, computeFontSizeFn])

    // ── Animation loop — mounted once ──────────────────────────
    useEffect(() => {
        if (isStatic) {
            if (sceneRef.current) {
                sceneRef.current.style.transform = `perspective(${live.current.perspectiveDepth}px)`
            }
            return
        }

        let alive = true

        const tick = () => {
            if (!alive) return
            const cfg = live.current
            const anim = animRef.current
            const { x: mx, y: my, over } = mouseRef.current

            let tRotX = 0,
                tRotY = 0,
                tScale = 1

            if (over && mx > -9000 && containerRef.current) {
                const w = containerRef.current.offsetWidth
                const h = containerRef.current.offsetHeight
                // Normalize cursor position to [-1, 1] from element center
                const nx = (mx / w - 0.5) * 2
                const ny = (my / h - 0.5) * 2
                tRotX = -ny * cfg.tiltStrength
                tRotY = nx * cfg.tiltStrength
                tScale = cfg.scaleOnHover ? cfg.scaleAmount : 1
            }

            const sm = Math.min(1, Math.max(0.01, cfg.smoothing))
            anim.rotX += (tRotX - anim.rotX) * sm
            anim.rotY += (tRotY - anim.rotY) * sm
            anim.scale += (tScale - anim.scale) * sm

            // Write directly to DOM — zero React overhead in the hot path
            if (sceneRef.current) {
                sceneRef.current.style.transform = [
                    `perspective(${cfg.perspectiveDepth}px)`,
                    `rotateX(${anim.rotX.toFixed(4)}deg)`,
                    `rotateY(${anim.rotY.toFixed(4)}deg)`,
                    `scale(${anim.scale.toFixed(5)})`,
                ].join(" ")
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            alive = false
            cancelAnimationFrame(rafRef.current)
        }
    }, [isStatic])

    // ── Derived styles ─────────────────────────────────────────
    const gradientDir =
        gradientDirection === "vertical"
            ? "180deg"
            : gradientDirection === "diagonal"
              ? "135deg"
              : "90deg"

    const sharedTextProps: React.CSSProperties = {
        fontSize: computedFontSize,
        fontWeight,
        fontFamily,
        letterSpacing: `${letterSpacing}px`,
        lineHeight,
        whiteSpace: "pre-line",
        textAlign: "center",
        userSelect: "none",
        pointerEvents: "none",
    }

    const mainTextStyle: React.CSSProperties = {
        ...sharedTextProps,
        display: "block",
        position: "relative",
        ...(useGradient
            ? {
                  background:
                      gradientDirection === "radial"
                          ? `radial-gradient(circle, ${textColor}, ${gradientColorTo})`
                          : `linear-gradient(${gradientDir}, ${textColor}, ${gradientColorTo})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
              }
            : { color: textColor }),
    }

    // ── Render ─────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                backgroundColor,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onPointerMove={(e) => {
                const r = containerRef.current!.getBoundingClientRect()
                mouseRef.current = {
                    x: e.clientX - r.left,
                    y: e.clientY - r.top,
                    over: true,
                }
            }}
            onPointerEnter={() => {
                mouseRef.current = { ...mouseRef.current, over: true }
            }}
            onPointerLeave={() => {
                mouseRef.current = { x: -9999, y: -9999, over: false }
            }}
        >
            {/* 3D scene — all transforms applied here */}
            <div
                ref={sceneRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                {/* Main text — sits at Z = 0 */}
                <span style={mainTextStyle}>{text}</span>
            </div>

            {/* Demo control panel */}
            {demoMode && (
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px 14px",
                        padding: "10px 16px",
                        maxWidth: "calc(100% - 32px)",
                        background: "rgba(8,8,8,0.88)",
                        backdropFilter: "blur(18px)",
                        WebkitBackdropFilter: "blur(18px)",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "0 6px 32px rgba(0,0,0,0.5)",
                        zIndex: 10,
                        userSelect: "none",
                        pointerEvents: "auto",
                    }}
                    onPointerEnter={() => {
                        mouseRef.current = { x: -9999, y: -9999, over: false }
                    }}
                    onPointerMove={(e) => e.stopPropagation()}
                >
                    <style>{`
                        input[type=range].demo-slider {
                            -webkit-appearance: none;
                            appearance: none;
                            height: 3px;
                            border-radius: 2px;
                            outline: none;
                            cursor: pointer;
                        }
                        input[type=range].demo-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: #fff;
                            cursor: pointer;
                            box-shadow: 0 1px 4px rgba(0,0,0,0.35);
                        }
                        input[type=range].demo-slider::-moz-range-thumb {
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: #fff;
                            border: none;
                            cursor: pointer;
                            box-shadow: 0 1px 4px rgba(0,0,0,0.35);
                        }
                    `}</style>

                    <div style={SECTION_STYLE}>
                        <span style={LABEL_STYLE}>Tilt</span>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <input
                                type="range"
                                className="demo-slider"
                                min={3}
                                max={80}
                                step={1}
                                value={demoTilt}
                                onChange={(e) => setDemoTilt(+e.target.value)}
                                style={{
                                    width: 80,
                                    background: `linear-gradient(to right, #fff ${((demoTilt - 3) / 77) * 100}%, rgba(255,255,255,0.15) ${((demoTilt - 3) / 77) * 100}%)`,
                                }}
                            />
                            <span style={VALUE_STYLE}>{demoTilt}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Property Controls ──────────────────────────────────────────

addPropertyControls(TiltTextFX, {
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // ── Content
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "WOAH THERE",
        displayTextArea: true,
    },
    autoFit: {
        type: ControlType.Boolean,
        title: "Auto Fit",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fitPadding: {
        type: ControlType.Number,
        title: "  ↳ Padding %",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        displayStepper: true,
        hidden: (props: any) => !props.autoFit,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 140,
        min: 20,
        max: 400,
        step: 2,
        displayStepper: true,
        hidden: (props: any) => props.autoFit,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: [
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
        ],
        optionTitles: [
            "Thin",
            "ExtraLight",
            "Light",
            "Regular",
            "Medium",
            "SemiBold",
            "Bold",
            "ExtraBold",
            "Black",
        ],
        defaultValue: "700",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -3,
        min: -20,
        max: 40,
        step: 0.5,
        displayStepper: true,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.1,
        min: 0.8,
        max: 3,
        step: 0.05,
        displayStepper: true,
    },

    // ── Color
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Gradient",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gradientColorTo: {
        type: ControlType.Color,
        title: "  ↳ Color To",
        defaultValue: "#ff55ee",
        hidden: (props: any) => !props.useGradient,
    },
    gradientDirection: {
        type: ControlType.Enum,
        title: "  ↳ Direction",
        options: ["horizontal", "vertical", "diagonal", "radial"],
        optionTitles: [
            "Horizontal ↔",
            "Vertical ↕",
            "Diagonal ↗",
            "Radial ◎",
        ],
        defaultValue: "horizontal",
        hidden: (props: any) => !props.useGradient,
    },

    // ── 3D Tilt
    perspectiveDepth: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 200,
        max: 2000,
        step: 50,
        displayStepper: true,
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 60,
        min: 1,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    scaleOnHover: {
        type: ControlType.Boolean,
        title: "Scale on Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scaleAmount: {
        type: ControlType.Number,
        title: "  ↳ Scale",
        defaultValue: 1.05,
        min: 1.0,
        max: 1.3,
        step: 0.01,
        displayStepper: true,
        hidden: (props: any) => !props.scaleOnHover,
    },
})
