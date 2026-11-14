import React, { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function TypographicMorphGrid(props) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        let animationFrameId
        let particles = []

        const resolveColor = (color) => {
            if (!color || !color.startsWith("var(")) return color
            const varName = color.match(/var\((--[^,)]+)/)?.[1] || ""
            const computed = getComputedStyle(canvas)
                .getPropertyValue(varName)
                .trim()
            if (computed) return computed
            return color.match(/,\s*([^)]+)\)/)?.[1]?.trim() || "#000000"
        }

        const resolvedBg = resolveColor(props.backgroundColor)
        const resolvedColor = resolveColor(props.color)

        let mouse = { x: -1000, y: -1000 }

        const handleMouseMove = (e) => {
            if (!canvasRef.current) return
            const rect = canvasRef.current.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top
        }

        const handleMouseLeave = () => {
            mouse.x = -1000
            mouse.y = -1000
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseleave", handleMouseLeave)

        const createPolygon = (corners) => {
            let pts = []
            let numCorners = corners.length
            let pointsPerEdge = 24 / numCorners
            for (let i = 0; i < numCorners; i++) {
                let c1 = corners[i]
                let c2 = corners[(i + 1) % numCorners]
                for (let j = 0; j < pointsPerEdge; j++) {
                    let t = j / pointsPerEdge
                    pts.push({
                        x: c1.x * (1 - t) + c2.x * t,
                        y: c1.y * (1 - t) + c2.y * t,
                    })
                }
            }
            return pts
        }

        const circlePoints = []
        for (let i = 0; i < 24; i++) {
            let a = (i * (Math.PI * 2)) / 24 - Math.PI / 2
            circlePoints.push({ x: Math.cos(a) * 0.9, y: Math.sin(a) * 0.9 })
        }

        const baseShapes = [
            createPolygon([
                { x: 0, y: -1.2 },
                { x: 0.15, y: -0.15 },
                { x: 1.2, y: 0 },
                { x: 0.15, y: 0.15 },
                { x: 0, y: 1.2 },
                { x: -0.15, y: 0.15 },
                { x: -1.2, y: 0 },
                { x: -0.15, y: -0.15 },
            ]),
            createPolygon([
                { x: -0.85, y: -0.85 },
                { x: 0.85, y: -0.85 },
                { x: 0.85, y: 0.85 },
                { x: -0.85, y: 0.85 },
            ]),
            createPolygon([
                { x: 0.6, y: -1.2 },
                { x: 0.9, y: -1.2 },
                { x: -0.6, y: 1.2 },
                { x: -0.9, y: 1.2 },
            ]),
            circlePoints,
        ]

        const easeInOutCubic = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        // ✅ CHANGE 1: fallback to parentElement dimensions
        const init = () => {
            canvas.width =
                canvas.offsetWidth || canvas.parentElement?.offsetWidth || 800
            canvas.height =
                canvas.offsetHeight || canvas.parentElement?.offsetHeight || 600
            particles = []

            const cols = Math.ceil(canvas.width / props.gap) + 1
            const rows = Math.ceil(canvas.height / props.gap) + 1
            const offsetX = (canvas.width - (cols - 1) * props.gap) / 2
            const offsetY = (canvas.height - (rows - 1) * props.gap) / 2

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const xPos = offsetX + i * props.gap
                    const yPos = offsetY + j * props.gap
                    particles.push({
                        x: xPos,
                        y: yPos,
                        baseX: xPos,
                        baseY: yPos,
                    })
                }
            }
        }

        const animate = () => {
            const time = Date.now()
            const totalCycleTime = props.morphWaitTime + props.morphDuration

            ctx.fillStyle = resolvedBg
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = resolvedColor

            ctx.beginPath()

            particles.forEach((p) => {
                const xPercent = p.baseX / canvas.width
                const waveDelay = xPercent * props.waveStaggerMs
                const localTime = Math.max(0, time - waveDelay)

                const cycle = Math.floor(localTime / totalCycleTime)
                const timeInCycle = localTime % totalCycleTime

                let rawProgress = 0
                let scaleMultiplier = 1

                if (timeInCycle > props.morphWaitTime) {
                    rawProgress =
                        (timeInCycle - props.morphWaitTime) /
                        props.morphDuration
                    const clampedProgress = Math.min(
                        1,
                        Math.max(0, rawProgress)
                    )

                    scaleMultiplier =
                        1 + Math.sin(clampedProgress * Math.PI) * 0.25
                }

                const progress = easeInOutCubic(
                    Math.min(1, Math.max(0, rawProgress))
                )

                const shape1 = baseShapes[cycle % baseShapes.length]
                const shape2 = baseShapes[(cycle + 1) % baseShapes.length]

                let targetX = p.baseX
                let targetY = p.baseY

                const dx = mouse.x - p.baseX
                const dy = mouse.y - p.baseY
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < props.attractionRadius) {
                    const force =
                        (props.attractionRadius - distance) /
                        props.attractionRadius
                    targetX +=
                        (dx / distance) * force * props.attractionStrength
                    targetY +=
                        (dy / distance) * force * props.attractionStrength
                }

                p.x += (targetX - p.x) * props.easeSpeed
                p.y += (targetY - p.y) * props.easeSpeed

                const currentSize = props.particleSize * scaleMultiplier

                for (let i = 0; i < 24; i++) {
                    const morphX =
                        shape1[i].x * (1 - progress) + shape2[i].x * progress
                    const morphY =
                        shape1[i].y * (1 - progress) + shape2[i].y * progress

                    const px = p.x + morphX * currentSize
                    const py = p.y + morphY * currentSize

                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.closePath()
            })

            ctx.fill()
            animationFrameId = requestAnimationFrame(animate)
        }

        init()
        animate()

        window.addEventListener("resize", init)

        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseleave", handleMouseLeave)
            window.removeEventListener("resize", init)
        }
    }, [props])

    // ✅ CHANGE 2: wrapper div with inset:0 to escape Framer's padding
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                margin: 0,
                padding: 0,
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    backgroundColor: props.backgroundColor,
                }}
            />
        </div>
    )
}

addPropertyControls(TypographicMorphGrid, {
    color: { type: ControlType.Color, title: "Color", defaultValue: "#A9AEB5" },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0B0E",
    },
    gap: {
        type: ControlType.Number,
        title: "Grid Spacing",
        defaultValue: 65,
        min: 20,
        max: 150,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Base Size",
        defaultValue: 6,
        min: 2,
        max: 20,
    },
    morphWaitTime: {
        type: ControlType.Number,
        title: "Idle Time (ms)",
        defaultValue: 3500,
        min: 500,
        max: 10000,
    },
    morphDuration: {
        type: ControlType.Number,
        title: "Morph Speed (ms)",
        defaultValue: 1400,
        min: 200,
        max: 3000,
    },
    waveStaggerMs: {
        type: ControlType.Number,
        title: "Wave Delay (ms)",
        defaultValue: 1800,
        min: 0,
        max: 5000,
    },
    attractionRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        defaultValue: 180,
        min: 50,
        max: 600,
    },
    attractionStrength: {
        type: ControlType.Number,
        title: "Hover Pull",
        defaultValue: 20,
        min: 1,
        max: 80,
    },
    easeSpeed: {
        type: ControlType.Number,
        title: "Easing Smoothness",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.3,
        step: 0.01,
    },
})
