"use client"

import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * DNA Helix Background
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 */

interface DnaHelixProps {
    speed?: number
    nodeSize?: number
    lineWidth?: number
    glow?: number
    glowOpacity?: number
    connectionOpacity?: number
    nodeColor?: string
    connectionColor?: string
    accentColor?: string
    showGrid?: boolean
}

function DnaHelix({
    speed = 1,
    nodeSize = 6,
    lineWidth = 0.6,
    glow = 0.75,
    glowOpacity = 0.18,
    connectionOpacity = 0.25,
    nodeColor = "#3b82f6",
    connectionColor = "#3b82f6",
    accentColor = "#818cf8",
    showGrid = true,
}: DnaHelixProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>()
    const isVisibleRef = useRef<boolean>(false)

    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const drawFrame = (T: number) => {
            const W = container.clientWidth
            const H = container.clientHeight

            ctx.clearRect(0, 0, W, H)

            if (showGrid) {
                const step = 28
                ctx.fillStyle = "rgba(128,128,128,0.08)"
                for (let x = step; x < W; x += step) {
                    for (let y = step; y < H; y += step) {
                        ctx.beginPath()
                        ctx.arc(x, y, 0.8, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            }

            const strands = 64
            const centerX = W / 2
            const amplitude = W * 0.18
            const spacing = H / strands

            for (let i = 0; i < strands; i++) {
                const y = (i * spacing + T * 25) % H
                const phase = i * 0.28 + T * 2

                const x1 = centerX + Math.sin(phase) * amplitude
                const x2 = centerX + Math.sin(phase + Math.PI) * amplitude

                const depth1 = (Math.cos(phase) + 1) / 2
                const depth2 = (Math.cos(phase + Math.PI) + 1) / 2

                const r1 = nodeSize * (0.6 + depth1 * 0.6)
                const r2 = nodeSize * (0.6 + depth2 * 0.6)

                // Connection line
                ctx.beginPath()
                ctx.moveTo(x1, y)
                ctx.lineTo(x2, y)
                ctx.strokeStyle = connectionColor
                ctx.globalAlpha = connectionOpacity
                ctx.lineWidth = lineWidth
                ctx.stroke()
                ctx.globalAlpha = 1

                // Node 1
                ctx.beginPath()
                ctx.arc(x1, y, r1, 0, Math.PI * 2)
                ctx.fillStyle = nodeColor
                ctx.fill()

                // Node 2
                ctx.beginPath()
                ctx.arc(x2, y, r2, 0, Math.PI * 2)
                ctx.fillStyle = accentColor
                ctx.fill()

                // Glow — use rgba so it composites correctly on any background
                if (glow > 0 && glowOpacity > 0) {
                    const glowR = r1 * 5 * glow

                    // Parse nodeColor hex → rgb for rgba stop
                    const hexToRgb = (hex: string) => {
                        const h = hex.replace("#", "")
                        const full =
                            h.length === 3
                                ? h
                                      .split("")
                                      .map((c) => c + c)
                                      .join("")
                                : h
                        const n = parseInt(full, 16)
                        return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
                    }

                    const [r, g, b] = hexToRgb(nodeColor)
                    const grd = ctx.createRadialGradient(x1, y, 0, x1, y, glowR)
                    grd.addColorStop(0, `rgba(${r},${g},${b},${glowOpacity})`)
                    grd.addColorStop(1, `rgba(${r},${g},${b},0)`)

                    ctx.beginPath()
                    ctx.arc(x1, y, glowR, 0, Math.PI * 2)
                    ctx.fillStyle = grd
                    ctx.fill()
                }
            }
        }

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const width = container.clientWidth
            const height = container.clientHeight
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            if (isStatic) {
                drawFrame(0)
            }
        }

        resize()

        const ro = new ResizeObserver(() => {
            resize()
            if (isStatic) drawFrame(0)
        })
        ro.observe(container)

        if (isStatic) {
            return () => ro.disconnect()
        }

        let accTime = 0
        let lastTs: number | null = null

        const animate = (ts: number) => {
            if (!isVisibleRef.current) {
                rafRef.current = undefined
                lastTs = null
                return
            }
            accTime += lastTs !== null ? ts - lastTs : 0
            lastTs = ts
            drawFrame(accTime * 0.001 * speed)
            rafRef.current = requestAnimationFrame(animate)
        }

        const startLoop = () => {
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(animate)
            }
        }

        const stopLoop = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = undefined
                lastTs = null
            }
        }

        const io = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                if (entry.isIntersecting) {
                    startLoop()
                } else {
                    stopLoop()
                }
            },
            { threshold: 0 }
        )

        io.observe(container)

        return () => {
            stopLoop()
            ro.disconnect()
            io.disconnect()
        }
    }, [
        isStatic,
        speed,
        nodeSize,
        lineWidth,
        glow,
        glowOpacity,
        connectionOpacity,
        nodeColor,
        connectionColor,
        accentColor,
        showGrid,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 120,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

DnaHelix.displayName = "DNA Helix Background"

addPropertyControls(DnaHelix, {
    nodeColor: {
        type: ControlType.Color,
        title: "Node",
        defaultValue: "#3b82f6",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#818cf8",
    },
    connectionColor: {
        type: ControlType.Color,
        title: "Lines",
        defaultValue: "#3b82f6",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1,
    },
    nodeSize: {
        type: ControlType.Number,
        title: "Node Size",
        min: 2,
        max: 20,
        step: 1,
        defaultValue: 6,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.6,
    },
    connectionOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow Size",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 0.75,
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.18,
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: true,
    },
})

export default DnaHelix
