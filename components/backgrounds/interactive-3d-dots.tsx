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
    gridGap: number
    dotSize: number
    parallaxStrength: number
    revealRadius: number
}

export default function Interactive3DDotGrid(props: Props) {
    const {
        dotColor = "#666666",
        gridGap = 30,
        dotSize = 1.5,
        parallaxStrength = 0.05,
        revealRadius = 150,
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 })
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        let isIntersecting = true

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouseRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }
        }

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 }
        }

        if (!isStatic) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseleave", handleMouseLeave)
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
                ctx.scale(dpr, dpr)
            }

            ctx.clearRect(0, 0, width, height)

            let offsetX = 0
            let offsetY = 0
            if (mouseRef.current.x > -1000) {
                const centerX = width / 2
                const centerY = height / 2
                offsetX = (mouseRef.current.x - centerX) * parallaxStrength
                offsetY = (mouseRef.current.y - centerY) * parallaxStrength
            }

            const cols = Math.ceil(width / gridGap) + 4
            const rows = Math.ceil(height / gridGap) + 4

            ctx.fillStyle = dotColor

            for (let c = -2; c < cols; c++) {
                for (let r = -2; r < rows; r++) {
                    const baseX = c * gridGap
                    const baseY = r * gridGap

                    const finalX = baseX - offsetX
                    const finalY = baseY - offsetY

                    const dx = finalX - mouseRef.current.x
                    const dy = finalY - mouseRef.current.y
                    const dist = Math.hypot(dx, dy)

                    let opacity = 0.15
                    let currentSize = dotSize

                    if (dist < revealRadius) {
                        const factor = 1 - dist / revealRadius
                        opacity = 0.15 + factor * 0.85
                        currentSize = dotSize + factor * 1
                    }

                    // Gambar Titik
                    ctx.globalAlpha = opacity
                    ctx.beginPath()
                    ctx.arc(finalX, finalY, currentSize, 0, Math.PI * 2)
                    ctx.fill()
                }
            }
        }

        const handleResize = () => renderFrame()
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(canvas)

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                const wasIntersecting = isIntersecting
                isIntersecting = entry.isIntersecting
                if (isIntersecting && !wasIntersecting) {
                    cancelAnimationFrame(animationFrameId)
                    animationFrameId = requestAnimationFrame(draw)
                } else if (!isIntersecting && wasIntersecting) {
                    cancelAnimationFrame(animationFrameId)
                }
            },
            { threshold: 0.05 }
        )

        intersectionObserver.observe(canvas)

        const draw = () => {
            if (isIntersecting) {
                renderFrame()
                animationFrameId = requestAnimationFrame(draw)
            }
        }

        animationFrameId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseleave", handleMouseLeave)
            cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
        }
    }, [dotColor, gridGap, dotSize, parallaxStrength, revealRadius, isStatic])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                backgroundColor: "transparent",
                pointerEvents: "all",
            }}
        />
    )
}

addPropertyControls(Interactive3DDotGrid, {
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#666666",
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        defaultValue: 30,
        min: 15,
        max: 100,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Base Dot Size",
        defaultValue: 1.5,
        min: 0.5,
        max: 5,
        step: 0.1,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Str.",
        defaultValue: 0.05,
        min: 0,
        max: 0.2,
        step: 0.01,
    },
    revealRadius: {
        type: ControlType.Number,
        title: "Reveal Radius",
        defaultValue: 150,
        min: 50,
        max: 400,
    },
})
