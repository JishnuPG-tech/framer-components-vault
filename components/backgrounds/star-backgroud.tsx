import * as React from "react"
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
    starCount: number
    starSize: number
    starColor: string
    backgroundColor: string
    interactionRadius: number
    interactionStrength: number
    returnSpeed: number
}

type Star = {
    x: number
    y: number
    baseX: number
    baseY: number
    size: number
    opacity: number
}

export default function InteractiveStars(props: Props) {
    const {
        starCount,
        starSize,
        starColor,
        backgroundColor,
        interactionRadius,
        interactionStrength,
        returnSpeed,
    } = props

    // Framer uses this when rendering the component statically
    // on the Canvas, during export, and for thumbnails.
    const isStaticRenderer = useIsStaticRenderer()

    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const mouse = React.useRef({ x: -9999, y: -9999 })
    const animation = React.useRef<number | null>(null)
    const stars = React.useRef<Star[]>([])

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resize = () => {
            const rect = canvas.getBoundingClientRect()

            if (rect.width <= 0 || rect.height <= 0) return

            const dpr = Math.min(window.devicePixelRatio || 1, 2)

            canvas.width = Math.round(rect.width * dpr)
            canvas.height = Math.round(rect.height * dpr)

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            createStars(rect.width, rect.height)
            drawStatic(rect.width, rect.height)
        }

        const createStars = (width: number, height: number) => {
            stars.current = Array.from({ length: starCount }, () => {
                const x = Math.random() * width
                const y = Math.random() * height

                return {
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    size: Math.random() * starSize * 0.7 + starSize * 0.3,
                    opacity: Math.random() * 0.6 + 0.4,
                }
            })
        }

        // Draw one clean frame for Framer's static renderer.
        const drawStatic = (width: number, height: number) => {
            ctx.clearRect(0, 0, width, height)

            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, width, height)

            ctx.fillStyle = starColor

            stars.current.forEach((star) => {
                ctx.globalAlpha = star.opacity

                ctx.beginPath()

                ctx.arc(star.baseX, star.baseY, star.size, 0, Math.PI * 2)

                ctx.fill()
            })

            ctx.globalAlpha = 1
        }

        const drawAnimated = () => {
            const rect = canvas.getBoundingClientRect()

            if (rect.width <= 0 || rect.height <= 0) {
                animation.current = requestAnimationFrame(drawAnimated)
                return
            }

            ctx.clearRect(0, 0, rect.width, rect.height)

            ctx.fillStyle = backgroundColor

            ctx.fillRect(0, 0, rect.width, rect.height)

            stars.current.forEach((star) => {
                const dx = star.x - mouse.current.x

                const dy = star.y - mouse.current.y

                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < interactionRadius) {
                    const force =
                        (1 - distance / interactionRadius) * interactionStrength

                    const angle = Math.atan2(dy, dx)

                    star.x += Math.cos(angle) * force

                    star.y += Math.sin(angle) * force
                }

                // Smoothly return to original position.
                star.x += (star.baseX - star.x) * returnSpeed

                star.y += (star.baseY - star.y) * returnSpeed

                ctx.beginPath()

                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)

                ctx.fillStyle = starColor
                ctx.globalAlpha = star.opacity

                ctx.fill()
            })

            ctx.globalAlpha = 1

            animation.current = requestAnimationFrame(drawAnimated)
        }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()

            mouse.current.x = e.clientX - rect.left

            mouse.current.y = e.clientY - rect.top
        }

        const handleMouseLeave = () => {
            mouse.current.x = -9999
            mouse.current.y = -9999
        }

        resize()

        // IMPORTANT:
        // Never start requestAnimationFrame when
        // Framer is rendering statically.
        if (!isStaticRenderer) {
            window.addEventListener("mousemove", handleMouseMove)

            canvas.addEventListener("mouseleave", handleMouseLeave)

            animation.current = requestAnimationFrame(drawAnimated)
        }

        window.addEventListener("resize", resize)

        return () => {
            window.removeEventListener("resize", resize)

            if (!isStaticRenderer) {
                window.removeEventListener("mousemove", handleMouseMove)

                canvas.removeEventListener("mouseleave", handleMouseLeave)
            }

            if (animation.current !== null) {
                cancelAnimationFrame(animation.current)

                animation.current = null
            }
        }
    }, [
        starCount,
        starSize,
        starColor,
        backgroundColor,
        interactionRadius,
        interactionStrength,
        returnSpeed,
        isStaticRenderer,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                position: "absolute",
                inset: 0,
            }}
        />
    )
}

InteractiveStars.defaultProps = {
    starCount: 180,
    starSize: 1.5,
    starColor: "#FFFFFF",
    backgroundColor: "#050505",
    interactionRadius: 180,
    interactionStrength: 5,
    returnSpeed: 0.08,
}

addPropertyControls(InteractiveStars, {
    starCount: {
        type: ControlType.Number,
        title: "Stars",
        min: 20,
        max: 1000,
        step: 10,
        defaultValue: 180,
    },

    starSize: {
        type: ControlType.Number,
        title: "Size",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 1.5,
    },

    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050505",
    },

    interactionRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 180,
    },

    interactionStrength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 20,
        step: 0.5,
        defaultValue: 5,
    },

    returnSpeed: {
        type: ControlType.Number,
        title: "Return",
        min: 0.01,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.08,
    },
})
