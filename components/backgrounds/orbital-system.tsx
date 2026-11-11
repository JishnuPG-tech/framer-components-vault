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
 * Orbital System Background
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 */

interface OrbitalSystemProps {
    nodeColor?: string
    connectionColor?: string
    accentColor?: string
    animationSpeed?: number
    nodeSize?: number
    connectionOpacity?: number
    glowIntensity?: number
    glowOpacity?: number
    lineWidth?: number
    showGrid?: boolean
    gridColor?: string
}

function OrbitalSystem({
    nodeColor = "#3b82f6",
    connectionColor = "#3b82f6",
    accentColor = "#818cf8",
    animationSpeed = 1,
    nodeSize = 6,
    connectionOpacity = 0.22,
    glowIntensity = 0.75,
    glowOpacity = 0.35,
    lineWidth = 0.6,
    showGrid = true,
    gridColor = "rgba(0,0,0,0.08)",
}: OrbitalSystemProps) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>()
    const isVisibleRef = useRef(false)

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const width = container.clientWidth
            const height = container.clientHeight

            canvas.width = width * dpr
            canvas.height = height * dpr

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(container)

        // Shared draw function used for both static frame and animation loop
        const drawFrame = (T: number) => {
            const W = container.clientWidth
            const H = container.clientHeight

            ctx.clearRect(0, 0, W, H)

            /* subtle background grid */
            if (showGrid) {
                const step = 28
                ctx.fillStyle = gridColor
                for (let x = step; x < W; x += step) {
                    for (let y = step; y < H; y += step) {
                        ctx.beginPath()
                        ctx.arc(x, y, 0.75, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            }

            /* orbital nodes */
            const centerX = W / 2
            const centerY = H / 2
            const orbitCount = 4

            for (let i = 0; i < orbitCount; i++) {
                const radius = (Math.min(W, H) / 5) * (i + 1) * 0.7
                const nodes = 6 + i * 2

                for (let j = 0; j < nodes; j++) {
                    const angle =
                        (j / nodes) * Math.PI * 2 + T * (0.2 + i * 0.05)

                    const x = centerX + Math.cos(angle) * radius
                    const y = centerY + Math.sin(angle) * radius

                    /* connections to center */
                    ctx.beginPath()
                    ctx.moveTo(centerX, centerY)
                    ctx.lineTo(x, y)
                    ctx.strokeStyle = connectionColor
                    ctx.globalAlpha = connectionOpacity
                    ctx.lineWidth = lineWidth
                    ctx.stroke()
                    ctx.globalAlpha = 1

                    /* glow */
                    if (glowIntensity > 0 && glowOpacity > 0) {
                        const glowRadius = nodeSize * 4 * glowIntensity

                        const grd = ctx.createRadialGradient(
                            x,
                            y,
                            0,
                            x,
                            y,
                            glowRadius
                        )

                        // Parse accentColor into an rgba string at the chosen opacity
                        grd.addColorStop(0, accentColor)
                        grd.addColorStop(1, "transparent")

                        ctx.globalAlpha = glowOpacity
                        ctx.beginPath()
                        ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
                        ctx.fillStyle = grd
                        ctx.fill()
                        ctx.globalAlpha = 1
                    }

                    /* node */
                    ctx.beginPath()
                    ctx.arc(x, y, nodeSize, 0, Math.PI * 2)
                    ctx.fillStyle = nodeColor
                    ctx.fill()
                }
            }
        }

        // Static renderer: draw one frame at T=0 and exit — no rAF loop
        if (isStatic) {
            drawFrame(0)
            ro.disconnect()
            return
        }

        // Animated path: only run the loop while the component is visible
        let accTime = 0
        let lastTs: number | null = null

        const tick = (ts: number) => {
            if (!isVisibleRef.current) {
                lastTs = null
                rafRef.current = requestAnimationFrame(tick)
                return
            }

            accTime += lastTs !== null ? ts - lastTs : 0
            lastTs = ts

            drawFrame(accTime * 0.001 * animationSpeed)

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)

        // Pause / resume based on viewport visibility
        const io = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                if (!entry.isIntersecting) {
                    lastTs = null // reset timestamp gap on re-entry
                }
            },
            { threshold: 0 }
        )
        io.observe(container)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            io.disconnect()
        }
    }, [
        isStatic,
        nodeColor,
        connectionColor,
        accentColor,
        animationSpeed,
        nodeSize,
        connectionOpacity,
        glowIntensity,
        glowOpacity,
        lineWidth,
        showGrid,
        gridColor,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 300,
                minHeight: 200,
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

OrbitalSystem.displayName = "Orbital System"

addPropertyControls(OrbitalSystem, {
    nodeColor: {
        type: ControlType.Color,
        title: "Node Color",
        defaultValue: "#3b82f6",
    },

    connectionColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#3b82f6",
    },

    accentColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#818cf8",
    },

    nodeSize: {
        type: ControlType.Number,
        title: "Node Size",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 6,
    },

    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 0.2,
        max: 4,
        step: 0.2,
        defaultValue: 0.6,
    },

    connectionOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.22,
    },

    glowIntensity: {
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
        step: 0.05,
        defaultValue: 0.35,
    },

    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1,
    },

    showGrid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: true,
    },

    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "rgba(0,0,0,0.08)",
        hidden(props) {
            return !props.showGrid
        },
    },
})

export default OrbitalSystem
