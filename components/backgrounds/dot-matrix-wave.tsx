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
    maxRadius: number
    speed: number
}

export default function DotMatrixWave(props: Props) {
    const {
        dotColor = "#3b82f6",
        spacing = 30,
        maxRadius = 3.5,
        speed = 1,
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        let animationFrameId: number
        let startTime = performance.now()
        let isIntersecting = true

        const renderFrame = (now: number) => {
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
            const elapsed = (now - startTime) * 0.002 * speed

            for (let x = spacing / 2; x < width; x += spacing) {
                for (let y = spacing / 2; y < height; y += spacing) {
                    const dist = Math.hypot(x - width / 2, y - height / 2)

                    const wave = Math.sin(dist * 0.015 - elapsed)
                    const normalizedWave = (wave + 1) / 2

                    const radius = Math.max(0.5, normalizedWave * maxRadius)
                    const alpha = Math.max(0.1, normalizedWave * 0.8)

                    ctx.globalAlpha = alpha
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            ctx.restore()
        }

        const handleResize = () => renderFrame(performance.now())
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(canvas)

        const initialFrame = requestAnimationFrame(() =>
            renderFrame(performance.now())
        )

        if (isStatic) {
            return () => {
                cancelAnimationFrame(initialFrame)
                resizeObserver.disconnect()
            }
        }

        const draw = (now: number) => {
            renderFrame(now)
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
            cancelAnimationFrame(initialFrame)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            cancelAnimationFrame(animationFrameId)
        }
    }, [dotColor, spacing, maxRadius, speed, isStatic])

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

addPropertyControls(DotMatrixWave, {
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#3b82f6",
    },
    spacing: {
        type: ControlType.Number,
        title: "Grid Spacing",
        defaultValue: 30,
        min: 15,
        max: 60,
    },
    maxRadius: {
        type: ControlType.Number,
        title: "Max Radius",
        defaultValue: 3.5,
        min: 1,
        max: 8,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
    },
})
