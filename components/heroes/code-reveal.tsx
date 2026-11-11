import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Framer Component: AsciiWaterReveal (Optimized version with speed control and static rendering fallback)
export default function AsciiWaterReveal(props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Framer Requirement: Check if rendering in canvas/export mode
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        let width = 0
        let height = 0
        let cols = 0
        let rows = 0
        let isSleeping = false
        let idleFrames = 0

        const fontSize = props.fontSize || 13
        const densityMultiplier = props.density || 1.0
        const colSpacing = (fontSize * 0.85) / densityMultiplier
        const rowSpacing = (fontSize * 1.15) / densityMultiplier

        let buffer1: Float32Array
        let buffer2: Float32Array

        // Pre-allocate color palette for performance
        const alphaSteps = 14
        const maxOpacity = props.maxOpacity || 0.35
        const colorPalette = Array.from({ length: alphaSteps + 1 }, (_, i) => {
            const alpha = ((i / alphaSteps) * maxOpacity).toFixed(3)
            return `rgba(255, 255, 255, ${alpha})`
        })

        // Physics functions
        function wakeUp() {
            idleFrames = 0
            if (isSleeping && !isStatic) {
                isSleeping = false
                render()
            }
        }

        function initBuffers() {
            const rect = container.getBoundingClientRect()
            width = canvas.width = rect.width
            height = canvas.height = rect.height

            cols = Math.ceil(width / colSpacing) + 2
            rows = Math.ceil(height / rowSpacing) + 2

            const size = cols * rows
            buffer1 = new Float32Array(size)
            buffer2 = new Float32Array(size)

            // In static mode (Framer canvas), simulate a single drop in the center for visual preview
            if (isStatic) {
                const centerX = width / 2
                const centerY = height / 2
                drop(centerX, centerY, 6, 8.0)
            } else {
                wakeUp()
            }
        }

        const resizeObserver = new ResizeObserver(() => initBuffers())
        resizeObserver.observe(container)
        initBuffers()

        const mouse = { x: -1, y: -1, prevX: -1, prevY: -1, isDown: false }

        function drop(x: number, y: number, radius: number, strength: number) {
            const gridX = Math.floor(x / colSpacing)
            const gridY = Math.floor(y / rowSpacing)

            for (let r = -radius; r <= radius; r++) {
                for (let c = -radius; c <= radius; c++) {
                    const nx = gridX + c
                    const ny = gridY + r
                    if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1) {
                        const dist = c * c + r * r
                        const radSq = radius * radius
                        if (dist < radSq) {
                            const index = ny * cols + nx
                            buffer1[index] += strength * (1 - dist / radSq)
                        }
                    }
                }
            }
            if (!isStatic) wakeUp()
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (isStatic) return
            const rect = canvas.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top

            if (mouse.prevX === -1) {
                mouse.prevX = mouse.x
                mouse.prevY = mouse.y
            }

            const dx = mouse.x - mouse.prevX
            const dy = mouse.y - mouse.prevY
            const speedSq = dx * dx + dy * dy

            if (speedSq > 2) {
                const speed = Math.sqrt(speedSq)
                const steps = Math.min(Math.floor(speed / 6), 8)
                const strength =
                    Math.min(speed * 0.12, 3.5) * (mouse.isDown ? 1.8 : 1.0)
                const radius = mouse.isDown ? 3 : 2

                for (let i = 0; i <= steps; i++) {
                    const t = steps === 0 ? 0 : i / steps
                    drop(
                        mouse.prevX + dx * t,
                        mouse.prevY + dy * t,
                        radius,
                        strength
                    )
                }
            }

            mouse.prevX = mouse.x
            mouse.prevY = mouse.y
        }

        const handlePointerDown = () => {
            if (isStatic) return
            mouse.isDown = true
            if (mouse.x !== -1) drop(mouse.x, mouse.y, 5, 7.0)
        }
        const handlePointerUp = () => {
            mouse.isDown = false
        }
        const handlePointerLeave = () => {
            mouse.prevX = -1
            mouse.prevY = -1
        }

        if (!isStatic) {
            container.addEventListener("pointermove", handlePointerMove, {
                passive: true,
            })
            container.addEventListener("pointerdown", handlePointerDown, {
                passive: true,
            })
            window.addEventListener("pointerup", handlePointerUp, {
                passive: true,
            })
            container.addEventListener("pointerleave", handlePointerLeave, {
                passive: true,
            })
        }

        const chars = ["·", ".", "-", "~", "=", "+", "x", "*", "o"]
        const charsLen = chars.length - 1
        const damping = props.damping || 0.96

        const waveSpeed = props.velocity || 0.48

        function render() {
            ctx.clearRect(0, 0, width, height)
            ctx.font = `${fontSize}px monospace`
            ctx.textBaseline = "middle"
            ctx.textAlign = "center"

            let activeCells = 0

            // 1. PHYSICS STEP
            for (let y = 1; y < rows - 1; y++) {
                const rowOffset = y * cols
                for (let x = 1; x < cols - 1; x++) {
                    const i = rowOffset + x

                    buffer2[i] =
                        (buffer1[i - 1] +
                            buffer1[i + 1] +
                            buffer1[i - cols] +
                            buffer1[i + cols]) *
                            waveSpeed -
                        buffer2[i]
                    buffer2[i] *= damping
                }
            }

            // Buffer swap
            const temp = buffer1
            buffer1 = buffer2
            buffer2 = temp

            // 2. RENDER STEP
            for (let y = 1; y < rows - 1; y++) {
                const rowOffset = y * cols
                const posY = y * rowSpacing
                for (let x = 1; x < cols - 1; x++) {
                    const i = rowOffset + x
                    const intensity = Math.abs(buffer1[i])

                    if (intensity > 0.008) {
                        activeCells++
                        const posX = x * colSpacing

                        const charIndex = Math.min(
                            (intensity * 2.2) | 0,
                            charsLen
                        )
                        const colorIndex = Math.min(
                            (intensity * 6) | 0,
                            alphaSteps
                        )

                        ctx.fillStyle = colorPalette[colorIndex]
                        ctx.fillText(chars[charIndex], posX, posY)
                    }
                }
            }

            // Framer Requirement: Stop animation loop if rendering statically
            if (isStatic) return

            // Sleep mode (CPU conservation)
            if (activeCells === 0 && !mouse.isDown) {
                idleFrames++
                if (idleFrames > 30) {
                    isSleeping = true
                    return
                }
            } else {
                idleFrames = 0
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            resizeObserver.disconnect()
            if (!isStatic) {
                container.removeEventListener("pointermove", handlePointerMove)
                container.removeEventListener("pointerdown", handlePointerDown)
                window.removeEventListener("pointerup", handlePointerUp)
                container.removeEventListener(
                    "pointerleave",
                    handlePointerLeave
                )
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [
        props.fontSize,
        props.damping,
        props.maxOpacity,
        props.density,
        props.velocity,
        isStatic,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 50,
                minHeight: 50,
                background: "transparent",
                overflow: "hidden",
                position: "relative",
                userSelect: "none",
                touchAction: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// Framer property controls configuration
addPropertyControls(AsciiWaterReveal, {
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 13,
        min: 8,
        max: 24,
    },
    density: {
        type: ControlType.Number,
        title: "Grid Density",
        defaultValue: 1.0,
        min: 0.6,
        max: 1.5,
        step: 0.1,
    },
    damping: {
        type: ControlType.Number,
        title: "Water Fluidity",
        defaultValue: 0.96,
        min: 0.85,
        max: 0.99,
        step: 0.01,
    },
    velocity: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 0.48,
        min: 0.1,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    maxOpacity: {
        type: ControlType.Number,
        title: "Opacity (Alpha)",
        defaultValue: 0.35,
        min: 0.05,
        max: 1.0,
        step: 0.05,
    },
})
