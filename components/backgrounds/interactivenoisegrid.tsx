// Interactive Noise Grid - A subtle animated grid of dots with noise distortion and mouse repulsion
import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface InteractiveNoiseGridProps {
    dotSize: number
    gridSpacing: number
    noiseIntensity: number
    animationSpeed: number
    mouseRadius: number
    dotColor: string
    backgroundColor: string
    shapeType: "dot" | "plus" | "line" | "square" | "diamond" | "cross" | "star"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function InteractiveNoiseGrid(props: InteractiveNoiseGridProps) {
    const {
        dotSize = 3,
        gridSpacing = 30,
        noiseIntensity = 0,
        animationSpeed = 3,
        mouseRadius = 160,
        dotColor = "#FFFFFF",
        backgroundColor = "#000000",
        shapeType = "dot",
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const targetMouseRef = useRef({ x: -1000, y: -1000 })
    const isMouseOverRef = useRef(false)
    const animationFrameRef = useRef<number>()
    const timeRef = useRef(0)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        // Simple noise function (Perlin-like)
        const noise = (x: number, y: number, t: number) => {
            const X = Math.floor(x) & 255
            const Y = Math.floor(y) & 255
            const T = Math.floor(t) & 255

            const hash = (i: number) => {
                i = (i << 13) ^ i
                return ((i * (i * i * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff
            }

            const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

            const xf = x - Math.floor(x)
            const yf = y - Math.floor(y)
            const tf = t - Math.floor(t)

            const u = fade(xf)
            const v = fade(yf)
            const w = fade(tf)

            const a = hash(X + hash(Y + hash(T)))
            const b = hash(X + 1 + hash(Y + hash(T)))
            const c = hash(X + hash(Y + 1 + hash(T)))
            const d = hash(X + 1 + hash(Y + 1 + hash(T)))

            const x1 = a + u * (b - a)
            const x2 = c + u * (d - c)

            return x1 + v * (x2 - x1)
        }

        const animate = () => {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Smooth mouse position interpolation only when mouse is over canvas
            if (isMouseOverRef.current) {
                mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.2
                mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.2
            }

            const cols = Math.ceil(canvas.width / gridSpacing)
            const rows = Math.ceil(canvas.height / gridSpacing)

            timeRef.current += 0.03 * animationSpeed

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const baseX = i * gridSpacing
                    const baseY = j * gridSpacing

                    // Noise offset
                    const noiseX = noise(i * 0.1, j * 0.1, timeRef.current) * noiseIntensity
                    const noiseY = noise(i * 0.1 + 100, j * 0.1 + 100, timeRef.current) * noiseIntensity

                    let x = baseX + noiseX
                    let y = baseY + noiseY

                    // Mouse repulsion with smooth easing (only when mouse is over canvas)
                    if (isMouseOverRef.current) {
                        const dx = x - mouseRef.current.x
                        const dy = y - mouseRef.current.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance < mouseRadius && distance > 0) {
                            const normalizedDistance = distance / mouseRadius
                            // Smooth easing function (ease-out quadratic)
                            const easing = 1 - Math.pow(normalizedDistance, 2)
                            const force = easing * 30
                            x += (dx / distance) * force
                            y += (dy / distance) * force
                        }
                    }

                    // Draw shape based on type
                    ctx.fillStyle = dotColor
                    ctx.strokeStyle = dotColor
                    ctx.lineWidth = dotSize * 0.5

                    switch (shapeType) {
                        case "plus":
                            ctx.beginPath()
                            ctx.moveTo(x - dotSize * 2, y)
                            ctx.lineTo(x + dotSize * 2, y)
                            ctx.moveTo(x, y - dotSize * 2)
                            ctx.lineTo(x, y + dotSize * 2)
                            ctx.stroke()
                            break
                        case "line":
                            ctx.beginPath()
                            ctx.moveTo(x - dotSize * 2, y)
                            ctx.lineTo(x + dotSize * 2, y)
                            ctx.stroke()
                            break
                        case "square":
                            ctx.fillRect(x - dotSize, y - dotSize, dotSize * 2, dotSize * 2)
                            break
                        case "diamond":
                            ctx.beginPath()
                            ctx.moveTo(x, y - dotSize * 1.5)
                            ctx.lineTo(x + dotSize * 1.5, y)
                            ctx.lineTo(x, y + dotSize * 1.5)
                            ctx.lineTo(x - dotSize * 1.5, y)
                            ctx.closePath()
                            ctx.fill()
                            break
                        case "cross":
                            ctx.beginPath()
                            ctx.moveTo(x - dotSize * 1.5, y - dotSize * 1.5)
                            ctx.lineTo(x + dotSize * 1.5, y + dotSize * 1.5)
                            ctx.moveTo(x + dotSize * 1.5, y - dotSize * 1.5)
                            ctx.lineTo(x - dotSize * 1.5, y + dotSize * 1.5)
                            ctx.stroke()
                            break
                        case "star":
                            ctx.beginPath()
                            for (let k = 0; k < 5; k++) {
                                const angle = (k * 4 * Math.PI) / 5 - Math.PI / 2
                                const sx = x + Math.cos(angle) * dotSize * 2
                                const sy = y + Math.sin(angle) * dotSize * 2
                                if (k === 0) ctx.moveTo(sx, sy)
                                else ctx.lineTo(sx, sy)
                            }
                            ctx.closePath()
                            ctx.fill()
                            break
                        default: // dot
                            ctx.beginPath()
                            ctx.arc(x, y, dotSize, 0, Math.PI * 2)
                            ctx.fill()
                            break
                    }
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [dotSize, gridSpacing, noiseIntensity, animationSpeed, mouseRadius, dotColor, backgroundColor, shapeType, isStatic])

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            targetMouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
        }

        const handleMouseLeave = () => {
            isMouseOverRef.current = false
        }

        const handleMouseEnter = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            // Snap mouse position to entry point to avoid animation jumping from far away
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
            targetMouseRef.current = mouseRef.current
            isMouseOverRef.current = true
        }

        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("mouseleave", handleMouseLeave)
        canvas.addEventListener("mouseenter", handleMouseEnter)

        return () => {
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("mouseleave", handleMouseLeave)
            canvas.removeEventListener("mouseenter", handleMouseEnter)
        }
    }, [isStatic])

    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: dotColor,
                    fontSize: 14,
                    fontFamily: "sans-serif",
                }}
            >
                Interactive Noise Grid
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    )
}

addPropertyControls(InteractiveNoiseGrid, {
    dotSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    shapeType: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["dot", "plus", "line", "square", "diamond", "cross", "star"],
        optionTitles: ["Dot", "Plus", "Line", "Square", "Diamond", "Cross", "Star"],
        defaultValue: "dot",
    },
    gridSpacing: {
        type: ControlType.Number,
        title: "Grid Spacing",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    noiseIntensity: {
        type: ControlType.Number,
        title: "Noise Intensity",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 3,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    mouseRadius: {
        type: ControlType.Number,
        title: "Mouse Radius",
        defaultValue: 160,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})