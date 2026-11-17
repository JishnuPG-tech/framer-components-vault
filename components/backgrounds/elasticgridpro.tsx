import React, { useRef, useEffect, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ────────────────────────────────────────────────
// Enums & Types

export enum InteractionMode {
    PULL = "pull",
    PUSH = "push",
    WAVE = "wave",
    NONE = "none",
}

export enum TriggerMode {
    HOVER = "hover",
    HOLD = "hold",
}

interface Props {
    cellSize: number
    elasticStrength: number
    damping: number
    interactionRadius: number
    interactionStrength: number
    interactionMode: InteractionMode
    triggerMode: TriggerMode
    lineColor: string
    baseOpacity: number
    glowColor: string
    glowIntensity: number
    glowRadius: number
    lineWidth: number
    showDots: boolean
    dotRadius: number
    ambientWaveAmplitude: number
    ambientWaveFrequency: number
    perspective: number
    pointerEvents?: "auto" | "none"
    width?: number
    height?: number
    style?: React.CSSProperties
}

// ────────────────────────────────────────────────
// Main Component

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function ElasticGridPro(props: Props) {
    const {
        cellSize = 50,
        elasticStrength = 0.12,
        damping = 0.88,
        interactionRadius = 350,
        interactionStrength = 2.5,
        interactionMode = InteractionMode.PUSH,
        triggerMode = TriggerMode.HOVER,
        lineColor = "rgba(255, 255, 255, 0.1)",
        baseOpacity = 0.2,
        glowColor = "#00f2ff",
        glowIntensity = 20,
        glowRadius = 300,
        lineWidth = 1.0,
        showDots = true,
        dotRadius = 1.5,
        ambientWaveAmplitude = 8,
        ambientWaveFrequency = 0.001,
        perspective = 0,
        pointerEvents = "none",
        width,
        height,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const pointsData = useRef<Float32Array | null>(null)
    const gridDim = useRef({ cols: 0, rows: 0 })

    const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 })
    const isPointerDownRef = useRef(false)
    const rafRef = useRef<number | null>(null)
    const isVisibleRef = useRef(false)

    const safeCellSize = Math.max(10, cellSize)

    const initGrid = useCallback(() => {
        const container = containerRef.current
        if (!container) return

        const { width, height } = container.getBoundingClientRect()
        const cols = Math.ceil(width / safeCellSize) + 4
        const rows = Math.ceil(height / safeCellSize) + 4
        gridDim.current = { cols, rows }

        const data = new Float32Array(cols * rows * 6)
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const idx = (y * cols + x) * 6
                const px = x * safeCellSize - safeCellSize * 2
                const py = y * safeCellSize - safeCellSize * 2
                data[idx] = px
                data[idx + 1] = py
                data[idx + 2] = px
                data[idx + 3] = py
                data[idx + 4] = 0
                data[idx + 5] = 0
            }
        }
        pointsData.current = data
    }, [safeCellSize])

    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx || !containerRef.current || !pointsData.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const time = Date.now() * ambientWaveFrequency
        const data = pointsData.current
        const { cols, rows } = gridDim.current
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        const isInteracting =
            triggerMode === TriggerMode.HOVER || isPointerDownRef.current
        const rSq = interactionRadius * interactionRadius

        // Physics update
        for (let i = 0; i < data.length; i += 6) {
            const xIdx = (i / 6) % cols
            const yIdx = Math.floor(i / 6 / cols)

            const waveX = Math.sin(time + xIdx * 0.4) * ambientWaveAmplitude
            const waveY = Math.cos(time + yIdx * 0.4) * ambientWaveAmplitude

            const tx = data[i] + waveX
            const ty = data[i + 1] + waveY

            let fx = (tx - data[i + 2]) * elasticStrength
            let fy = (ty - data[i + 3]) * elasticStrength

            if (
                isInteracting &&
                interactionMode !== InteractionMode.NONE &&
                interactionRadius > 0
            ) {
                const dx = data[i + 2] - mx
                const dy = data[i + 3] - my
                const distSq = dx * dx + dy * dy

                if (distSq < rSq) {
                    const dist = Math.sqrt(distSq) || 0.001
                    const influence =
                        (1 - dist / interactionRadius) * interactionStrength

                    if (interactionMode === InteractionMode.PULL) {
                        fx -= (dx / dist) * influence * 15
                        fy -= (dy / dist) * influence * 15
                    } else if (interactionMode === InteractionMode.PUSH) {
                        fx += (dx / dist) * influence * 20
                        fy += (dy / dist) * influence * 20
                    } else if (interactionMode === InteractionMode.WAVE) {
                        const ripple =
                            Math.sin(dist * 0.05 - Date.now() * 0.001) *
                            influence *
                            8
                        fx += (dx / dist) * ripple
                        fy += (dy / dist) * ripple
                    }
                }
            }

            data[i + 4] += fx
            data[i + 5] += fy
            data[i + 4] *= damping
            data[i + 5] *= damping
            data[i + 2] += data[i + 4]
            data[i + 3] += data[i + 5]
        }

        ctx.clearRect(0, 0, rect.width, rect.height)
        ctx.lineWidth = lineWidth
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        const drawGridLines = (isGlowPass: boolean) => {
            if (isGlowPass) {
                const gradient = ctx.createRadialGradient(
                    mx,
                    my,
                    0,
                    mx,
                    my,
                    glowRadius
                )
                gradient.addColorStop(0, glowColor)
                gradient.addColorStop(1, "transparent")
                ctx.strokeStyle = gradient
                ctx.globalAlpha = 1
                ctx.shadowBlur = glowIntensity
                ctx.shadowColor = glowColor
            } else {
                ctx.strokeStyle = lineColor
                ctx.globalAlpha = baseOpacity
                ctx.shadowBlur = 0
            }

            for (let y = 0; y < rows; y++) {
                ctx.beginPath()
                const startIdx = y * cols * 6
                ctx.moveTo(data[startIdx + 2], data[startIdx + 3])
                for (let x = 1; x < cols; x++) {
                    const idx = (y * cols + x) * 6
                    const prevIdx = idx - 6
                    const midX = (data[prevIdx + 2] + data[idx + 2]) / 2
                    const midY = (data[prevIdx + 3] + data[idx + 3]) / 2
                    ctx.quadraticCurveTo(
                        data[prevIdx + 2],
                        data[prevIdx + 3],
                        midX,
                        midY
                    )
                }
                ctx.stroke()
            }

            for (let x = 0; x < cols; x++) {
                ctx.beginPath()
                const startIdx = x * 6
                ctx.moveTo(data[startIdx + 2], data[startIdx + 3])
                for (let y = 1; y < rows; y++) {
                    const idx = (y * cols + x) * 6
                    const prevIdx = ((y - 1) * cols + x) * 6
                    const midX = (data[prevIdx + 2] + data[idx + 2]) / 2
                    const midY = (data[prevIdx + 3] + data[idx + 3]) / 2
                    ctx.quadraticCurveTo(
                        data[prevIdx + 2],
                        data[prevIdx + 3],
                        midX,
                        midY
                    )
                }
                ctx.stroke()
            }
        }

        drawGridLines(false)

        if (glowIntensity > 0 && glowRadius > 0 && mx > -5000) {
            drawGridLines(true)
        }

        if (showDots) {
            ctx.shadowBlur = 0
            ctx.globalAlpha = baseOpacity
            ctx.fillStyle = lineColor
            for (let i = 0; i < data.length; i += 6) {
                ctx.beginPath()
                ctx.arc(data[i + 2], data[i + 3], dotRadius, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }, [
        elasticStrength,
        damping,
        interactionRadius,
        interactionStrength,
        interactionMode,
        triggerMode,
        lineColor,
        baseOpacity,
        glowColor,
        glowIntensity,
        glowRadius,
        lineWidth,
        showDots,
        dotRadius,
        ambientWaveAmplitude,
        ambientWaveFrequency,
    ])

    // RAF loop — extracted so IntersectionObserver can start/stop it cleanly
    const animate = useCallback(() => {
        drawFrame()
        rafRef.current = requestAnimationFrame(animate)
    }, [drawFrame])

    // Resize + init
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return

            const rect = container.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`

            const ctx = canvas.getContext("2d")
            ctx?.scale(dpr, dpr)

            initGrid()

            // Static: draw one frame after resize so the canvas isn't blank
            if (isStatic) drawFrame()
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [initGrid, drawFrame, isStatic])

    // Animation loop — skipped entirely when static; gated by IntersectionObserver otherwise
    useEffect(() => {
        if (isStatic) {
            // Single still frame for canvas/export previews
            drawFrame()
            return
        }

        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                if (entry.isIntersecting) {
                    // Start loop when scrolled into view
                    if (rafRef.current === null) {
                        rafRef.current = requestAnimationFrame(animate)
                    }
                } else {
                    // Pause loop when scrolled out of view
                    if (rafRef.current !== null) {
                        cancelAnimationFrame(rafRef.current)
                        rafRef.current = null
                    }
                }
            },
            { threshold: 0 }
        )

        observer.observe(container)

        return () => {
            observer.disconnect()
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [isStatic, animate, drawFrame])

    // Static fallback: draw a still frame whenever props change
    useEffect(() => {
        if (isStatic) drawFrame()
    }, [isStatic, drawFrame])

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handlePointerDown = () => {
        isPointerDownRef.current = true
    }
    const handlePointerUp = () => {
        isPointerDownRef.current = false
    }
    const handlePointerLeave = () => {
        mouseRef.current = { x: -9999, y: -9999 }
        isPointerDownRef.current = false
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: isStatic ? "none" : pointerEvents,
                touchAction: "pan-y",
                WebkitUserSelect: "none",
                userSelect: "none",
                perspective: `${1200 + perspective * 10}px`,
                ...style,
            }}
            onPointerMove={isStatic ? undefined : handlePointerMove}
            onPointerDown={isStatic ? undefined : handlePointerDown}
            onPointerUp={isStatic ? undefined : handlePointerUp}
            onPointerLeave={isStatic ? undefined : handlePointerLeave}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    transform: `rotateX(${perspective}deg)`,
                    transformOrigin: "50% 50%",
                }}
            />
        </div>
    )
}

// ────────────────────────────────────────────────
// Defaults & Property Controls

ElasticGridPro.defaultProps = {
    width: 800,
    height: 600,
    cellSize: 50,
    elasticStrength: 0.12,
    damping: 0.88,
    interactionRadius: 350,
    interactionStrength: 2.5,
    interactionMode: InteractionMode.PUSH,
    triggerMode: TriggerMode.HOVER,
    lineColor: "rgba(255, 255, 255, 0.1)",
    baseOpacity: 0.2,
    glowColor: "#00f2ff",
    glowIntensity: 20,
    glowRadius: 300,
    lineWidth: 1.0,
    showDots: true,
    dotRadius: 1.5,
    ambientWaveAmplitude: 8,
    ambientWaveFrequency: 0.001,
    perspective: 0,
    pointerEvents: "none",
}

addPropertyControls(ElasticGridPro, {
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        description: "Space between grid lines in pixels.",
        min: 10,
        max: 200,
        displayStepper: true,
        defaultValue: 150,
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        description:
            "Choose if the grid reacts on mouse hover or click and hold.",
        options: [TriggerMode.HOVER, TriggerMode.HOLD],
        optionTitles: ["Hover", "Click & Hold"],
        defaultValue: TriggerMode.HOVER,
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Effect",
        description: "The physics behavior of the grid around the pointer.",
        options: [
            InteractionMode.PULL,
            InteractionMode.PUSH,
            InteractionMode.WAVE,
            InteractionMode.NONE,
        ],
        optionTitles: ["Pull", "Push", "Wave", "None"],
        defaultValue: InteractionMode.PUSH,
    },
    elasticStrength: {
        type: ControlType.Number,
        title: "Elasticity",
        description: "How quickly points snap back to their original position.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.05,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        description:
            "Friction of the movement. Lower values make it 'wobble' longer.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.6,
    },
    interactionRadius: {
        type: ControlType.Number,
        title: "Radius",
        description: "The area of influence around the cursor.",
        min: 0,
        max: 2000,
        displayStepper: true,
        defaultValue: 200,
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Strength",
        description: "How much the pointer displaces the grid lines.",
        min: 0,
        max: 20,
        step: 0.1,
        defaultValue: 6,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    baseOpacity: {
        type: ControlType.Number,
        title: "Base Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#00f2ff",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        description: "Brightness of the radial glow around the cursor.",
        min: 0,
        max: 120,
        defaultValue: 2,
    },
    glowRadius: {
        type: ControlType.Number,
        title: "Glow Spread",
        min: 50,
        max: 1200,
        defaultValue: 404,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Thickness",
        min: 0.5,
        max: 12,
        step: 0.5,
        defaultValue: 0.5,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: false,
    },
    dotRadius: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 0.5,
        max: 12,
        defaultValue: 2,
    },
    ambientWaveAmplitude: {
        type: ControlType.Number,
        title: "Wave Amplitude",
        description: "Amount of automatic movement when the mouse is idle.",
        min: 0,
        max: 80,
        defaultValue: 0,
    },
    ambientWaveFrequency: {
        type: ControlType.Number,
        title: "Wave Speed",
        min: 0,
        max: 0.01,
        step: 0.0001,
        defaultValue: 0,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective Tilt (°)",
        description: "Rotates the grid on the X-axis for a 3D effect.",
        min: -60,
        max: 60,
        step: 1,
        defaultValue: 0,
    },
    pointerEvents: {
        type: ControlType.Enum,
        title: "Pointer Events",
        description:
            "Set to 'Capture' if you want the grid to be the main interactive layer.",
        options: ["none", "auto"],
        optionTitles: ["Pass Through (Background)", "Capture (Interactive)"],
        defaultValue: "auto",
    },
})
