// Pattern Generator component with built-in Pattern DNA
import {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
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

interface PatternGeneratorProps {
    patternType: "dots" | "grid" | "diagonal" | "waves" | "triangles"
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    density: number
    thickness: number
    rotation: number
    enableAnimation: boolean
    animationSpeed: number
    animationType: "pulse" | "drift" | "warp" | "wiggle"
    style?: CSSProperties
}

/**
 * Pattern Generator
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Weave(props: PatternGeneratorProps) {
    const {
        patternType = "dots",
        primaryColor = "#000000",
        secondaryColor = "#CCCCCC",
        backgroundColor = "#FFFFFF",
        density = 20,
        thickness = 2,
        rotation = 0,
        enableAnimation = false,
        animationSpeed = 1,
        animationType = "pulse",
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    const resizeObserverRef = useRef<ResizeObserver>()
    const [animationTime, setAnimationTime] = useState(0)
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 })
    const isStatic = useIsStaticRenderer()

    // Update canvas size based on container
    const updateCanvasSize = useCallback(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const newSize = {
            width: Math.max(5, rect.width || 400),
            height: Math.max(5, rect.height || 300),
        }

        if (
            newSize.width !== canvasSize.width ||
            newSize.height !== canvasSize.height
        ) {
            startTransition(() => setCanvasSize(newSize))
        }
    }, [canvasSize.width, canvasSize.height])

    // Setup ResizeObserver for responsive behavior
    useEffect(() => {
        if (typeof window === "undefined") return

        updateCanvasSize()

        if (containerRef.current) {
            resizeObserverRef.current = new ResizeObserver(() => {
                updateCanvasSize()
            })
            resizeObserverRef.current.observe(containerRef.current)
        }

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }
        }
    }, [updateCanvasSize])

    // Animation loop
    useEffect(() => {
        if (!enableAnimation || isStatic) return

        const animate = () => {
            setAnimationTime((prev) => prev + animationSpeed * 0.016)
            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [enableAnimation, animationSpeed, isStatic])

    // Draw pattern
    const drawPattern = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const { width, height } = canvasSize
        const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

        // Set canvas size with device pixel ratio for crisp rendering
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(dpr, dpr)

        // Clear canvas
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)

        // Apply rotation
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-width / 2, -height / 2)

        // Animation modifiers
        let animOffset = 0
        let animScale = 1
        let animOpacity = 1

        if (enableAnimation && !isStatic) {
            switch (animationType) {
                case "pulse":
                    animScale = 1 + Math.sin(animationTime * 2) * 0.1
                    break
                case "drift":
                    animOffset = Math.sin(animationTime) * density * 0.5
                    break
                case "warp":
                    animScale = 1 + Math.sin(animationTime * 3) * 0.05
                    animOffset = Math.cos(animationTime * 2) * 5
                    break
                case "wiggle":
                    animOffset = Math.sin(animationTime * 4) * 2
                    break
            }
        }

        // Responsive density calculation
        const baseSize = Math.min(width, height)
        const responsiveDensity = Math.max(5, (density * baseSize) / 400)
        const spacing = Math.max(5, responsiveDensity * animScale)
        const responsiveThickness = Math.max(1, (thickness * baseSize) / 400)

        ctx.strokeStyle = primaryColor
        ctx.fillStyle = primaryColor
        ctx.lineWidth = responsiveThickness

        switch (patternType) {
            case "dots":
                for (let x = -spacing; x < width + spacing; x += spacing) {
                    for (let y = -spacing; y < height + spacing; y += spacing) {
                        ctx.beginPath()
                        const dotX = x + animOffset
                        const dotY =
                            y +
                            (enableAnimation
                                ? Math.sin((x + animationTime * 50) * 0.01) * 3
                                : 0)
                        ctx.arc(dotX, dotY, responsiveThickness, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
                break

            case "grid":
                ctx.strokeStyle = primaryColor
                for (let x = 0; x < width; x += spacing) {
                    ctx.beginPath()
                    ctx.moveTo(x + animOffset, 0)
                    ctx.lineTo(x + animOffset, height)
                    ctx.stroke()
                }
                ctx.strokeStyle = secondaryColor
                for (let y = 0; y < height; y += spacing) {
                    ctx.beginPath()
                    ctx.moveTo(0, y + animOffset)
                    ctx.lineTo(width, y + animOffset)
                    ctx.stroke()
                }
                break

            case "diagonal":
                ctx.strokeStyle = primaryColor
                const diagonalSpacing = spacing * 1.5
                for (
                    let i = -height;
                    i < width + height;
                    i += diagonalSpacing
                ) {
                    ctx.beginPath()
                    ctx.moveTo(i + animOffset, 0)
                    ctx.lineTo(i + height + animOffset, height)
                    ctx.stroke()
                }
                break

            case "waves":
                ctx.strokeStyle = primaryColor
                const waveHeight = spacing * 0.5
                const waveLength = spacing * 2
                for (let y = 0; y < height; y += spacing) {
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    for (let x = 0; x <= width; x += 2) {
                        const waveY =
                            y +
                            Math.sin(
                                (x / waveLength + animationTime) * Math.PI * 2
                            ) *
                                waveHeight
                        ctx.lineTo(x, waveY)
                    }
                    ctx.stroke()
                }
                break

            case "triangles":
                ctx.fillStyle = primaryColor
                const triSize = spacing * 0.8
                for (let x = 0; x < width; x += spacing) {
                    for (let y = 0; y < height; y += spacing) {
                        const centerX = x + animOffset
                        const centerY =
                            y +
                            (enableAnimation
                                ? Math.sin(animationTime + x * 0.01) * 3
                                : 0)

                        ctx.beginPath()
                        ctx.moveTo(centerX, centerY - triSize / 2)
                        ctx.lineTo(centerX - triSize / 2, centerY + triSize / 2)
                        ctx.lineTo(centerX + triSize / 2, centerY + triSize / 2)
                        ctx.closePath()
                        ctx.fill()
                    }
                }
                break
        }

        ctx.restore()
    }, [
        canvasSize,
        patternType,
        primaryColor,
        secondaryColor,
        backgroundColor,
        density,
        thickness,
        rotation,
        enableAnimation,
        animationType,
        animationTime,
        isStatic,
    ])

    // Redraw when dependencies change
    useEffect(() => {
        drawPattern()
    }, [drawPattern])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 5,
                minHeight: 5,
                overflow: "hidden",
                backgroundColor,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "100%",
                }}
            />
        </div>
    )
}

addPropertyControls(Weave, {
    patternType: {
        type: ControlType.Enum,
        title: "Pattern Type",
        options: ["dots", "grid", "diagonal", "waves", "triangles"],
        optionTitles: [
            "Dots",
            "Grid",
            "Diagonal Stripes",
            "Waves",
            "Triangles",
        ],
        defaultValue: "dots",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#000000",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#CCCCCC",
        hidden: ({ patternType }) => patternType !== "grid",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    density: {
        type: ControlType.Number,
        title: "Density / Spacing",
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 1,
    },
    thickness: {
        type: ControlType.Number,
        title: "Line/Stroke Thickness",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["pulse", "drift", "warp", "wiggle"],
        optionTitles: ["Pulse", "Drift", "Warp", "Wiggle"],
        defaultValue: "pulse",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
})
