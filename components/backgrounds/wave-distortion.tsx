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


type Props = {
    dotColor: string
    spacing: number
    radius: number
    force: number
}

export default function WaveDistortion(props: Props) {
    const {
        dotColor = "#6366f1",
        spacing = 25,
        radius = 120,
        force = 0.8,
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        let animationFrameId: number
        let isIntersecting = true
        let mouseX = -1000
        let mouseY = -1000

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top
        }

        if (!isStatic) {
            window.addEventListener("mousemove", handleMouseMove)
        }

        const renderFrame = () => {
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height

            if (width === 0 || height === 0) return

            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            if (
                canvas.width !== width * dpr ||
                canvas.height !== height * dpr
            ) {
                canvas.width = width * dpr
                canvas.height = height * dpr
            }

            ctx.save()
            ctx.scale(dpr, dpr)
            ctx.clearRect(0, 0, width, height)

            ctx.fillStyle = dotColor

            for (let x = spacing / 2; x < width; x += spacing) {
                for (let y = spacing / 2; y < height; y += spacing) {
                    let renderX = x
                    let renderY = y

                    const dx = x - mouseX
                    const dy = y - mouseY
                    const dist = Math.hypot(dx, dy)

                    if (dist < radius && dist > 0) {
                        const angle = Math.atan2(dy, dx)
                        const push = (1 - dist / radius) * force * 40
                        renderX += Math.cos(angle) * push
                        renderY += Math.sin(angle) * push
                    }

                    ctx.beginPath()
                    ctx.arc(renderX, renderY, 1.5, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            ctx.restore()
        }

        const handleResize = () => renderFrame()
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(canvas)

        const initialFrame = requestAnimationFrame(renderFrame)

        if (isStatic) {
            return () => {
                cancelAnimationFrame(initialFrame)
                resizeObserver.disconnect()
            }
        }

        const draw = () => {
            renderFrame()
            if (isIntersecting) {
                animationFrameId = requestAnimationFrame(draw)
            }
        }

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                const wasIntersecting = isIntersecting
                isIntersecting = entry.isIntersecting
                if (isIntersecting && !wasIntersecting) {
                    cancelAnimationFrame(animationFrameId)
                    animationFrameId = requestAnimationFrame(draw)
                }
            },
            { threshold: 0.05 }
        )

        intersectionObserver.observe(canvas)
        animationFrameId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            cancelAnimationFrame(initialFrame)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            cancelAnimationFrame(animationFrameId)
        }
    }, [dotColor, spacing, radius, force, isStatic])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                backgroundColor: "transparent",
                pointerEvents: "none",
            }}
        />
    )
}

addPropertyControls(WaveDistortion, {
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#6366f1",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 25,
        min: 15,
        max: 50,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 120,
        min: 50,
        max: 300,
    },
    force: {
        type: ControlType.Number,
        title: "Repel Force",
        defaultValue: 0.8,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
})
