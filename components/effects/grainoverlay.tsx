import { useEffect, useRef, useCallback, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useSpring, motion } from "framer-motion"

/**
 * GrainOverlay — Animated film grain with hover reveal, vignette, scanlines & scroll fade
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

interface GrainOverlayProps {
    opacity: number
    grainSize: number
    speed: number
    blendMode:
        | "overlay"
        | "soft-light"
        | "multiply"
        | "screen"
        | "color-dodge"
        | "normal"
    useTint: boolean
    tint: string
    mode: "grain" | "scanlines" | "both"
    scanlineSpacing: number
    scanlineOpacity: number
    hoverReveal: boolean
    hoverTransition: number
    showVignette: boolean
    vignetteColor: string
    vignetteStrength: number
    vignetteSize: number
    scrollIntensity: boolean
    style?: React.CSSProperties
}

export default function GrainOverlay(props: GrainOverlayProps) {
    const {
        opacity = 0.15,
        grainSize = 80,
        speed = 12,
        blendMode = "overlay",
        useTint = false,
        tint = "#ffffff",
        mode = "grain",
        scanlineSpacing = 4,
        scanlineOpacity = 0.08,
        hoverReveal = false,
        hoverTransition = 0.4,
        showVignette = false,
        vignetteColor = "#000000",
        vignetteStrength = 0.6,
        vignetteSize = 60,
        scrollIntensity = false,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number | null>(null)
    const lastFrameRef = useRef<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const scrollOpacityValue = useTransform(
        scrollYProgress,
        [0, 0.2, 0.8, 1],
        scrollIntensity
            ? [0, opacity, opacity, 0]
            : [opacity, opacity, opacity, opacity]
    )

    const hexToRgb = useCallback((hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 255, g: 255, b: 255 }
    }, [])

    const drawGrain = useCallback(
        (canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            const { width, height } = canvas

            if (mode === "grain" || mode === "both") {
                const imageData = ctx.createImageData(width, height)
                const data = imageData.data
                const rgb = useTint
                    ? hexToRgb(tint)
                    : { r: 255, g: 255, b: 255 }
                const blockSize = Math.max(1, Math.round(grainSize / 20))

                for (let y = 0; y < height; y += blockSize) {
                    for (let x = 0; x < width; x += blockSize) {
                        const value = Math.random() * 255
                        for (
                            let dy = 0;
                            dy < blockSize && y + dy < height;
                            dy++
                        ) {
                            for (
                                let dx = 0;
                                dx < blockSize && x + dx < width;
                                dx++
                            ) {
                                const index = ((y + dy) * width + (x + dx)) * 4
                                data[index] = (rgb.r * value) / 255
                                data[index + 1] = (rgb.g * value) / 255
                                data[index + 2] = (rgb.b * value) / 255
                                data[index + 3] = 255
                            }
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0)
            } else {
                ctx.clearRect(0, 0, width, height)
            }

            if (mode === "scanlines" || mode === "both") {
                const rgb = useTint ? hexToRgb(tint) : { r: 0, g: 0, b: 0 }
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${scanlineOpacity})`
                for (let y = 0; y < height; y += scanlineSpacing) {
                    ctx.fillRect(0, y, width, 1)
                }
            }
        },
        [
            mode,
            grainSize,
            useTint,
            tint,
            scanlineSpacing,
            scanlineOpacity,
            hexToRgb,
        ]
    )

    const animate = useCallback(
        (timestamp: number) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const interval = 1000 / speed
            if (timestamp - lastFrameRef.current >= interval) {
                lastFrameRef.current = timestamp
                drawGrain(canvas)
            }
            rafRef.current = requestAnimationFrame(animate)
        },
        [speed, drawGrain]
    )

    useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                canvas.width = Math.round(width)
                canvas.height = Math.round(height)
                drawGrain(canvas)
            }
        })
        observer.observe(canvas.parentElement || canvas)
        return () => observer.disconnect()
    }, [isStatic, drawGrain])

    useEffect(() => {
        if (isStatic) return
        rafRef.current = requestAnimationFrame(animate)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isStatic, animate])

    const vignetteGradient = showVignette
        ? `radial-gradient(ellipse at center, transparent ${100 - vignetteSize}%, ${vignetteColor} 100%)`
        : undefined

    // Hover opacity
    const resolvedOpacity = hoverReveal ? (isHovered ? opacity : 0) : opacity

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    ...style,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        opacity,
                        mixBlendMode: blendMode as any,
                    }}
                />
                {showVignette && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: vignetteGradient,
                            opacity: vignetteStrength,
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => hoverReveal && setIsHovered(true)}
            onMouseLeave={() => hoverReveal && setIsHovered(false)}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: hoverReveal ? "all" : "none",
                ...style,
            }}
        >
            {/* Main grain/scanlines canvas */}
            <motion.canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    mixBlendMode: blendMode as any,
                    pointerEvents: "none",
                    display: "block",
                    opacity: scrollIntensity
                        ? scrollOpacityValue
                        : resolvedOpacity,
                    transition: hoverReveal
                        ? `opacity ${hoverTransition}s ease`
                        : undefined,
                }}
            />

            {/* Vignette */}
            {showVignette && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: vignetteGradient,
                        opacity: vignetteStrength,
                        pointerEvents: "none",
                        mixBlendMode: "normal",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(GrainOverlay, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["grain", "scanlines", "both"],
        optionTitles: ["Grain", "Scanlines", "Both"],
        defaultValue: "grain",
        displaySegmentedControl: true,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.15,
        min: 0.01,
        max: 1,
        step: 0.01,
        description: "0.1–0.2 is the sweet spot for grain",
    },
    grainSize: {
        type: ControlType.Number,
        title: "Grain Size",
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 10,
        description: "Lower = finer, higher = chunkier",
        hidden: ({ mode }) => mode === "scanlines",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 12,
        min: 1,
        max: 60,
        step: 1,
        description: "Frames per second — how fast the grain flickers",
        hidden: ({ mode }) => mode === "scanlines",
    },
    scanlineSpacing: {
        type: ControlType.Number,
        title: "Line Spacing",
        defaultValue: 4,
        min: 2,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ mode }) => mode === "grain",
    },
    scanlineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        hidden: ({ mode }) => mode === "grain",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: [
            "overlay",
            "soft-light",
            "multiply",
            "screen",
            "color-dodge",
            "normal",
        ],
        optionTitles: [
            "Overlay",
            "Soft Light",
            "Multiply",
            "Screen",
            "Color Dodge",
            "Normal",
        ],
        defaultValue: "overlay",
    },
    useTint: {
        type: ControlType.Boolean,
        title: "Color Tint",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tint: {
        type: ControlType.Color,
        title: "Tint Color",
        defaultValue: "#ffffff",
        hidden: ({ useTint }) => !useTint,
    },
    hoverReveal: {
        type: ControlType.Boolean,
        title: "Hover Reveal",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Grain hidden by default, fades in on hover",
    },
    hoverTransition: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ hoverReveal }) => !hoverReveal,
    },
    showVignette: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Adds a dark edge around the frame",
    },
    vignetteColor: {
        type: ControlType.Color,
        title: "Vignette Color",
        defaultValue: "#000000",
        hidden: ({ showVignette }) => !showVignette,
    },
    vignetteStrength: {
        type: ControlType.Number,
        title: "Vignette Strength",
        defaultValue: 0.6,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: ({ showVignette }) => !showVignette,
    },
    vignetteSize: {
        type: ControlType.Number,
        title: "Vignette Size",
        defaultValue: 60,
        min: 10,
        max: 90,
        step: 5,
        unit: "%",
        description: "How far the vignette extends inward",
        hidden: ({ showVignette }) => !showVignette,
    },
    scrollIntensity: {
        type: ControlType.Boolean,
        title: "Scroll Fade",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Grain fades in as section enters viewport, fades out as it leaves",
    },
})
