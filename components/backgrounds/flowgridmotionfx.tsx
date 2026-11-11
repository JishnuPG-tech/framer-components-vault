// Animated grid of squares that moves in different directions with hover effects
import {
    useRef,
    useEffect,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MovingSquaresProps {
    direction:
        | "right"
        | "left"
        | "up"
        | "down"
        | "diagonal"
        | "diagonal-reverse"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
    speed: number
    borderColor: string
    squareSize: number
    hoverFillColor: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MovingSquares(props: MovingSquaresProps) {
    const {
        direction = "right",
        speed = 1,
        borderColor = "#999999",
        squareSize = 40,
        hoverFillColor = "#222222",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number | null>(null)
    const numMovingSquaresX = useRef<number>(0)
    const numMovingSquaresY = useRef<number>(0)
    const gridOffset = useRef({ x: 0, y: 0 })
    const hoveredSquare = useRef<{ x: number; y: number } | null>(null)
    const isStatic = useIsStaticRenderer()
    const [isClient, setIsClient] = useState(false)

    // SSR Guard: Only render on client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            numMovingSquaresX.current = Math.ceil(canvas.width / squareSize) + 1
            numMovingSquaresY.current =
                Math.ceil(canvas.height / squareSize) + 1
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", resizeCanvas)
        }
        resizeCanvas()

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const startX =
                Math.floor(gridOffset.current.x / squareSize) * squareSize
            const startY =
                Math.floor(gridOffset.current.y / squareSize) * squareSize

            for (
                let x = startX;
                x < canvas.width + squareSize;
                x += squareSize
            ) {
                for (
                    let y = startY;
                    y < canvas.height + squareSize;
                    y += squareSize
                ) {
                    const squareX = x - (gridOffset.current.x % squareSize)
                    const squareY = y - (gridOffset.current.y % squareSize)

                    if (
                        hoveredSquare.current &&
                        Math.floor((x - startX) / squareSize) ===
                            hoveredSquare.current.x &&
                        Math.floor((y - startY) / squareSize) ===
                            hoveredSquare.current.y
                    ) {
                        ctx.fillStyle = hoverFillColor
                        ctx.fillRect(squareX, squareY, squareSize, squareSize)
                    }

                    ctx.strokeStyle = borderColor
                    ctx.strokeRect(squareX, squareY, squareSize, squareSize)
                }
            }

            const gradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
            )
            gradient.addColorStop(0, "rgba(0, 0, 0, 0)")

            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        const updateAnimation = () => {
            const effectiveSpeed = Math.max(speed, 0.1)

            switch (direction) {
                case "right":
                    gridOffset.current.x =
                        (gridOffset.current.x - effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "left":
                    gridOffset.current.x =
                        (gridOffset.current.x + effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "up":
                    gridOffset.current.y =
                        (gridOffset.current.y + effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "down":
                    gridOffset.current.y =
                        (gridOffset.current.y - effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "diagonal":
                    gridOffset.current.x =
                        (gridOffset.current.x + effectiveSpeed + squareSize) %
                        squareSize
                    gridOffset.current.y =
                        (gridOffset.current.y - effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "diagonal-reverse":
                    gridOffset.current.x =
                        (gridOffset.current.x - effectiveSpeed + squareSize) %
                        squareSize
                    gridOffset.current.y =
                        (gridOffset.current.y + effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "top-left":
                    gridOffset.current.x =
                        (gridOffset.current.x + effectiveSpeed + squareSize) %
                        squareSize
                    gridOffset.current.y =
                        (gridOffset.current.y + effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "top-right":
                    gridOffset.current.x =
                        (gridOffset.current.x - effectiveSpeed + squareSize) %
                        squareSize
                    gridOffset.current.y =
                        (gridOffset.current.y + effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "bottom-left":
                    gridOffset.current.x =
                        (gridOffset.current.x + effectiveSpeed + squareSize) %
                        squareSize
                    gridOffset.current.y =
                        (gridOffset.current.y - effectiveSpeed + squareSize) %
                        squareSize
                    break
                case "bottom-right":
                    gridOffset.current.x =
                        (gridOffset.current.x - effectiveSpeed + squareSize) %
                        squareSize
                    gridOffset.current.y =
                        (gridOffset.current.y - effectiveSpeed + squareSize) %
                        squareSize
                    break
            }

            drawGrid()
            requestRef.current = requestAnimationFrame(updateAnimation)
        }

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const mouseX = event.clientX - rect.left
            const mouseY = event.clientY - rect.top

            const startX =
                Math.floor(gridOffset.current.x / squareSize) * squareSize
            const startY =
                Math.floor(gridOffset.current.y / squareSize) * squareSize

            const hoveredSquareX = Math.floor(
                (mouseX + gridOffset.current.x - startX) / squareSize
            )
            const hoveredSquareY = Math.floor(
                (mouseY + gridOffset.current.y - startY) / squareSize
            )

            if (
                !hoveredSquare.current ||
                hoveredSquare.current.x !== hoveredSquareX ||
                hoveredSquare.current.y !== hoveredSquareY
            ) {
                startTransition(() => {
                    hoveredSquare.current = {
                        x: hoveredSquareX,
                        y: hoveredSquareY,
                    }
                })
            }
        }

        const handleMouseLeave = () => {
            startTransition(() => {
                hoveredSquare.current = null
            })
        }

        if (!isStatic) {
            canvas.addEventListener("mousemove", handleMouseMove)
            canvas.addEventListener("mouseleave", handleMouseLeave)
            requestRef.current = requestAnimationFrame(updateAnimation)
        } else {
            drawGrid()
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", resizeCanvas)
            }
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current)
            }
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [
        isClient,
        direction,
        speed,
        borderColor,
        hoverFillColor,
        squareSize,
        isStatic,
    ])

    // Return placeholder during SSR
    if (!isClient) {
        return (
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    backgroundColor: "transparent",
                }}
            />
        )
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    )
}

addPropertyControls(MovingSquares, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: [
            "right",
            "left",
            "up",
            "down",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ],
        defaultValue: "bottom-right",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    squareSize: {
        type: ControlType.Number,
        title: "Square Size",
        defaultValue: 40,
        min: 10,
        max: 200,
        step: 5,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#999999",
    },
    hoverFillColor: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#222222",
    },
})
