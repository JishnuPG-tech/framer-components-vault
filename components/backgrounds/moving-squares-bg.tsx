// Animated squares grid with hover effects and customizable movement direction
import React, { useRef, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface GridOffset {
  x: number
  y: number
}

interface MovingSquaresBackgroundProps {
  direction: "diagonal" | "up" | "right" | "down" | "left"
  speed: number
  borderColor: string
  squareSize: number
  hoverFillColor: string
  backgroundColor: string
  style?: CSSProperties
}

/**
 * Animated MovingSquaresBackground Grid
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MovingSquaresBackground(props: MovingSquaresBackgroundProps) {
  const {
    direction = "right",
    speed = 1,
    borderColor = "#999999",
    squareSize = 40,
    hoverFillColor = "#222222",
    backgroundColor = "#000000",
  } = props

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number | null>(null)
  const numMovingSquaresBackgroundX = useRef<number>(0)
  const numMovingSquaresBackgroundY = useRef<number>(0)
  const gridOffset = useRef<GridOffset>({ x: 0, y: 0 })
  const hoveredSquareRef = useRef<GridOffset | null>(null)
  const isStatic = useIsStaticRenderer()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      numMovingSquaresBackgroundX.current = Math.ceil(canvas.width / squareSize) + 1
      numMovingSquaresBackgroundY.current = Math.ceil(canvas.height / squareSize) + 1
    }

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fill background with user-selected color
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize)
          const squareY = y - (gridOffset.current.y % squareSize)

          if (
            hoveredSquareRef.current &&
            Math.floor((x - startX) / squareSize) === hoveredSquareRef.current.x &&
            Math.floor((y - startY) / squareSize) === hoveredSquareRef.current.y
          ) {
            ctx.fillStyle = hoverFillColor
            ctx.fillRect(squareX, squareY, squareSize, squareSize)
          }

          ctx.strokeStyle = borderColor
          ctx.lineWidth = 1
          ctx.strokeRect(squareX, squareY, squareSize, squareSize)
        }
      }

      // Add radial gradient overlay
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      )
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
      gradient.addColorStop(1, "rgba(6, 0, 16, 0.8)")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const updateAnimation = () => {
      if (isStatic) {
        drawGrid()
        return
      }

      const effectiveSpeed = Math.max(speed, 0.1)
      switch (direction) {
        case "right":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          break
        case "left":
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize
          break
        case "up":
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize
          break
        case "down":
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        default:
          break
      }

      drawGrid()
      if (!isStatic) {
        requestRef.current = requestAnimationFrame(updateAnimation)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isStatic) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      const hoveredSquareX = Math.floor((mouseX + gridOffset.current.x - startX) / squareSize)
      const hoveredSquareY = Math.floor((mouseY + gridOffset.current.y - startY) / squareSize)

      if (
        !hoveredSquareRef.current ||
        hoveredSquareRef.current.x !== hoveredSquareX ||
        hoveredSquareRef.current.y !== hoveredSquareY
      ) {
        startTransition(() => {
          hoveredSquareRef.current = { x: hoveredSquareX, y: hoveredSquareY }
        })
      }
    }

    const handleMouseLeave = () => {
      startTransition(() => {
        hoveredSquareRef.current = null
      })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", resizeCanvas)
      canvas.addEventListener("mousemove", handleMouseMove)
      canvas.addEventListener("mouseleave", handleMouseLeave)
    }

    resizeCanvas()
    requestRef.current = requestAnimationFrame(updateAnimation)

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", resizeCanvas)
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseleave", handleMouseLeave)
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [direction, speed, borderColor, hoverFillColor, squareSize, isStatic])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        border: "none",
        backgroundColor: "transparent",
      }}
    />
  )
}

addPropertyControls(MovingSquaresBackground, {
  direction: {
    type: ControlType.Enum,
    title: "Direction",
    options: ["diagonal", "up", "right", "down", "left"],
    optionTitles: ["Diagonal", "Up", "Right", "Down", "Left"],
    defaultValue: "right",
    displaySegmentedControl: true,
  },
  speed: {
    type: ControlType.Number,
    title: "Animation Speed",
    defaultValue: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background Color",
    defaultValue: "#000000",
  },
  borderColor: {
    type: ControlType.Color,
    title: "Border Color",
    defaultValue: "#999999",
  },
  squareSize: {
    type: ControlType.Number,
    title: "Square Size",
    defaultValue: 40,
    min: 10,
    max: 100,
    step: 1,
    unit: "px",
  },
  hoverFillColor: {
    type: ControlType.Color,
    title: "Hover Color",
    defaultValue: "#222222",
  },
})