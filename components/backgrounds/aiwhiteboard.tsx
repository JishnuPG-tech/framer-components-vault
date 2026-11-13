// AI-powered whiteboard with shape recognition, diagram generation, and smart sticky notes
import { useEffect, useRef, useState, useCallback, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Point {
    x: number
    y: number
}

interface Stroke {
    id: string
    points: Point[]
    color: string
    width: number
    tool: string
}

interface Shape {
    id: string
    type: "rect" | "circle" | "arrow" | "text" | "sticky" | "cleanedShape"
    x: number
    y: number
    width: number
    height: number
    color: string
    text?: string
    rotation?: number
    shapeType?: "circle" | "rectangle" | "triangle" | "arrow" | "star"
}

interface DiagramNode {
    id: string
    label: string
    x: number
    y: number
    width: number
    height: number
}

interface DiagramEdge {
    from: string
    to: string
    label?: string
}

interface AIWhiteboardProps {
    enableAI: boolean
    showAIPanel: boolean
    canvasWidth: number
    canvasHeight: number
    backgroundColor: string
    strokeColor: string
    stickyNoteColors: string[]
    defaultTool: "pen" | "rect" | "circle" | "arrow" | "text" | "sticky" | "select"
    fontSize: number
    strokeWidth: number
    enableShapeRecognition: boolean
    gridEnabled: boolean
    snapToGrid: boolean
    onCanvasChange?: (data: string) => void
    initialCanvas?: string
    style?: CSSProperties
}

/**
 * AI Whiteboard Component
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function AIWhiteboard(props: AIWhiteboardProps) {
    const {
        enableAI,
        showAIPanel,
        canvasWidth,
        canvasHeight,
        backgroundColor,
        strokeColor,
        stickyNoteColors,
        defaultTool,
        fontSize,
        strokeWidth,
        enableShapeRecognition,
        gridEnabled,
        snapToGrid,
        onCanvasChange,
        initialCanvas,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [strokes, setStrokes] = useState<Stroke[]>([])
    const [shapes, setShapes] = useState<Shape[]>([])
    const [currentStroke, setCurrentStroke] = useState<Point[]>([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [tool, setTool] = useState(defaultTool)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [dragStart, setDragStart] = useState<Point | null>(null)
    const [resizeHandle, setResizeHandle] = useState<string | null>(null)
    const [showShapeCleanup, setShowShapeCleanup] = useState(false)
    const [detectedShape, setDetectedShape] = useState<string | null>(null)
    const [lastStrokeId, setLastStrokeId] = useState<string | null>(null)
    const [diagramPrompt, setDiagramPrompt] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedStickyIds, setSelectedStickyIds] = useState<string[]>([])
    const [aiPrompt, setAiPrompt] = useState("")
    const [canvasDimensions, setCanvasDimensions] = useState({ width: canvasWidth, height: canvasHeight })

    // Initialize canvas from initialCanvas prop
    useEffect(() => {
        if (initialCanvas) {
            try {
                const data = JSON.parse(initialCanvas)
                if (data.strokes) setStrokes(data.strokes)
                if (data.shapes) setShapes(data.shapes)
            } catch (e) {
                console.error("Failed to parse initialCanvas", e)
            }
        }
    }, [initialCanvas])

    // Notify parent of canvas changes
    useEffect(() => {
        if (onCanvasChange) {
            const data = JSON.stringify({ strokes, shapes })
            onCanvasChange(data)
        }
    }, [strokes, shapes, onCanvasChange])

    // Handle container resize
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                // Account for AI panel width if visible
                const panelWidth = enableAI && showAIPanel ? 300 : 0
                const availableWidth = Math.max(400, width - panelWidth)
                const availableHeight = Math.max(300, height - 60) // Account for toolbar
                
                startTransition(() => {
                    setCanvasDimensions({
                        width: availableWidth,
                        height: availableHeight,
                    })
                })
            }
        })

        resizeObserver.observe(container)
        return () => resizeObserver.disconnect()
    }, [enableAI, showAIPanel])

    // Draw everything on canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Clear canvas
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height)

        // Draw grid
        if (gridEnabled) {
            ctx.strokeStyle = "#e0e0e0"
            ctx.lineWidth = 1
            const gridSize = 20
            for (let x = 0; x < canvasDimensions.width; x += gridSize) {
                ctx.beginPath()
                ctx.moveTo(x, 0)
                ctx.lineTo(x, canvasDimensions.height)
                ctx.stroke()
            }
            for (let y = 0; y < canvasDimensions.height; y += gridSize) {
                ctx.beginPath()
                ctx.moveTo(0, y)
                ctx.lineTo(canvasDimensions.width, y)
                ctx.stroke()
            }
        }

        // Draw strokes
        strokes.forEach((stroke) => {
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.width
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.beginPath()
            stroke.points.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y)
                } else {
                    ctx.lineTo(point.x, point.y)
                }
            })
            ctx.stroke()
        })

        // Draw current stroke
        if (currentStroke.length > 0) {
            ctx.strokeStyle = strokeColor
            ctx.lineWidth = strokeWidth
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.beginPath()
            currentStroke.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y)
                } else {
                    ctx.lineTo(point.x, point.y)
                }
            })
            ctx.stroke()
        }

        // Draw shapes
        shapes.forEach((shape) => {
            const isSelected = selectedId === shape.id

            if (shape.type === "sticky") {
                // Draw sticky note
                ctx.fillStyle = shape.color
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
                ctx.strokeStyle = isSelected ? "#0099FF" : "#00000020"
                ctx.lineWidth = isSelected ? 3 : 1
                ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)

                // Draw text
                if (shape.text) {
                    ctx.fillStyle = "#000000"
                    ctx.font = `${fontSize}px sans-serif`
                    ctx.textAlign = "left"
                    ctx.textBaseline = "top"
                    const padding = 10
                    const lines = wrapText(ctx, shape.text, shape.width - padding * 2)
                    lines.forEach((line, i) => {
                        ctx.fillText(line, shape.x + padding, shape.y + padding + i * (fontSize + 4))
                    })
                }
            } else if (shape.type === "rect") {
                ctx.strokeStyle = shape.color
                ctx.lineWidth = strokeWidth
                ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
                if (isSelected) {
                    ctx.strokeStyle = "#0099FF"
                    ctx.lineWidth = 2
                    ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4)
                }
            } else if (shape.type === "circle") {
                const centerX = shape.x + shape.width / 2
                const centerY = shape.y + shape.height / 2
                const radius = Math.min(shape.width, shape.height) / 2
                ctx.strokeStyle = shape.color
                ctx.lineWidth = strokeWidth
                ctx.beginPath()
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                ctx.stroke()
                if (isSelected) {
                    ctx.strokeStyle = "#0099FF"
                    ctx.lineWidth = 2
                    ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4)
                }
            } else if (shape.type === "arrow") {
                ctx.strokeStyle = shape.color
                ctx.lineWidth = strokeWidth
                ctx.beginPath()
                ctx.moveTo(shape.x, shape.y)
                ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
                ctx.stroke()

                // Draw arrowhead
                const angle = Math.atan2(shape.height, shape.width)
                const headLength = 15
                ctx.beginPath()
                ctx.moveTo(shape.x + shape.width, shape.y + shape.height)
                ctx.lineTo(
                    shape.x + shape.width - headLength * Math.cos(angle - Math.PI / 6),
                    shape.y + shape.height - headLength * Math.sin(angle - Math.PI / 6)
                )
                ctx.moveTo(shape.x + shape.width, shape.y + shape.height)
                ctx.lineTo(
                    shape.x + shape.width - headLength * Math.cos(angle + Math.PI / 6),
                    shape.y + shape.height - headLength * Math.sin(angle + Math.PI / 6)
                )
                ctx.stroke()

                if (isSelected) {
                    ctx.strokeStyle = "#0099FF"
                    ctx.lineWidth = 2
                    const minX = Math.min(shape.x, shape.x + shape.width)
                    const minY = Math.min(shape.y, shape.y + shape.height)
                    const maxX = Math.max(shape.x, shape.x + shape.width)
                    const maxY = Math.max(shape.y, shape.y + shape.height)
                    ctx.strokeRect(minX - 2, minY - 2, maxX - minX + 4, maxY - minY + 4)
                }
            } else if (shape.type === "text") {
                ctx.fillStyle = shape.color
                ctx.font = `${fontSize}px sans-serif`
                ctx.textAlign = "left"
                ctx.textBaseline = "top"
                ctx.fillText(shape.text || "", shape.x, shape.y)
                if (isSelected) {
                    const metrics = ctx.measureText(shape.text || "")
                    ctx.strokeStyle = "#0099FF"
                    ctx.lineWidth = 2
                    ctx.strokeRect(shape.x - 2, shape.y - 2, metrics.width + 4, fontSize + 4)
                }
            } else if (shape.type === "cleanedShape") {
                ctx.strokeStyle = shape.color
                ctx.lineWidth = strokeWidth
                ctx.fillStyle = shape.color + "20"

                if (shape.shapeType === "circle") {
                    const centerX = shape.x + shape.width / 2
                    const centerY = shape.y + shape.height / 2
                    const radius = Math.min(shape.width, shape.height) / 2
                    ctx.beginPath()
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.stroke()
                } else if (shape.shapeType === "rectangle") {
                    ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
                    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
                } else if (shape.shapeType === "triangle") {
                    ctx.beginPath()
                    ctx.moveTo(shape.x + shape.width / 2, shape.y)
                    ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
                    ctx.lineTo(shape.x, shape.y + shape.height)
                    ctx.closePath()
                    ctx.fill()
                    ctx.stroke()
                } else if (shape.shapeType === "arrow") {
                    ctx.beginPath()
                    ctx.moveTo(shape.x, shape.y + shape.height / 2)
                    ctx.lineTo(shape.x + shape.width * 0.7, shape.y + shape.height / 2)
                    ctx.lineTo(shape.x + shape.width * 0.7, shape.y)
                    ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2)
                    ctx.lineTo(shape.x + shape.width * 0.7, shape.y + shape.height)
                    ctx.lineTo(shape.x + shape.width * 0.7, shape.y + shape.height / 2)
                    ctx.fill()
                    ctx.stroke()
                } else if (shape.shapeType === "star") {
                    const centerX = shape.x + shape.width / 2
                    const centerY = shape.y + shape.height / 2
                    const outerRadius = Math.min(shape.width, shape.height) / 2
                    const innerRadius = outerRadius * 0.4
                    ctx.beginPath()
                    for (let i = 0; i < 10; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius
                        const angle = (i * Math.PI) / 5 - Math.PI / 2
                        const x = centerX + radius * Math.cos(angle)
                        const y = centerY + radius * Math.sin(angle)
                        if (i === 0) {
                            ctx.moveTo(x, y)
                        } else {
                            ctx.lineTo(x, y)
                        }
                    }
                    ctx.closePath()
                    ctx.fill()
                    ctx.stroke()
                }

                if (isSelected) {
                    ctx.strokeStyle = "#0099FF"
                    ctx.lineWidth = 2
                    ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4)
                }
            }

            // Draw resize handles for selected shape
            if (isSelected && tool === "select") {
                const handles = [
                    { x: shape.x, y: shape.y, cursor: "nw-resize" },
                    { x: shape.x + shape.width, y: shape.y, cursor: "ne-resize" },
                    { x: shape.x, y: shape.y + shape.height, cursor: "sw-resize" },
                    { x: shape.x + shape.width, y: shape.y + shape.height, cursor: "se-resize" },
                ]
                handles.forEach((handle) => {
                    ctx.fillStyle = "#0099FF"
                    ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8)
                })
            }
        })
    }, [
        strokes,
        shapes,
        currentStroke,
        selectedId,
        tool,
        backgroundColor,
        strokeColor,
        strokeWidth,
        fontSize,
        gridEnabled,
        canvasDimensions.width,
        canvasDimensions.height,
    ])

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(" ")
        const lines: string[] = []
        let currentLine = ""

        words.forEach((word) => {
            const testLine = currentLine + (currentLine ? " " : "") + word
            const metrics = ctx.measureText(testLine)
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        })
        if (currentLine) {
            lines.push(currentLine)
        }
        return lines
    }

    const snapToGridPoint = (point: Point): Point => {
        if (!snapToGrid) return point
        const gridSize = 20
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize,
        }
    }

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
    }

    const recognizeShape = (points: Point[]): string | null => {
        if (!enableShapeRecognition || points.length < 10) return null

        // Calculate bounding box
        const xs = points.map((p) => p.x)
        const ys = points.map((p) => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const width = maxX - minX
        const height = maxY - minY
        const aspectRatio = width / height

        // Check if closed (start and end points are close)
        const firstPoint = points[0]
        const lastPoint = points[points.length - 1]
        const distance = Math.sqrt(
            Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
        )
        const isClosed = distance < Math.max(width, height) * 0.15

        // Calculate curvature
        let totalAngleChange = 0
        for (let i = 1; i < points.length - 1; i++) {
            const v1x = points[i].x - points[i - 1].x
            const v1y = points[i].y - points[i - 1].y
            const v2x = points[i + 1].x - points[i].x
            const v2y = points[i + 1].y - points[i].y
            const angle = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x)
            totalAngleChange += Math.abs(angle)
        }

        // Circle detection
        if (isClosed && Math.abs(aspectRatio - 1) < 0.3) {
            const centerX = (minX + maxX) / 2
            const centerY = (minY + maxY) / 2
            const avgRadius = (width + height) / 4
            let radiusVariance = 0
            points.forEach((p) => {
                const r = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
                radiusVariance += Math.abs(r - avgRadius)
            })
            radiusVariance /= points.length
            if (radiusVariance < avgRadius * 0.2) {
                return "circle"
            }
        }

        // Rectangle detection
        if (isClosed && totalAngleChange > Math.PI * 3 && totalAngleChange < Math.PI * 5) {
            return "rectangle"
        }

        // Triangle detection
        if (isClosed && totalAngleChange > Math.PI * 2 && totalAngleChange < Math.PI * 4) {
            // Count sharp turns
            let sharpTurns = 0
            for (let i = 1; i < points.length - 1; i++) {
                const v1x = points[i].x - points[i - 1].x
                const v1y = points[i].y - points[i - 1].y
                const v2x = points[i + 1].x - points[i].x
                const v2y = points[i + 1].y - points[i].y
                const angle = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x)
                if (Math.abs(angle) > Math.PI / 3) {
                    sharpTurns++
                }
            }
            if (sharpTurns >= 2 && sharpTurns <= 4) {
                return "triangle"
            }
        }

        // Arrow detection (not closed, relatively straight with direction)
        if (!isClosed && aspectRatio > 1.5) {
            return "arrow"
        }

        // Star detection (multiple sharp points)
        if (isClosed) {
            let peaks = 0
            const avgY = ys.reduce((a, b) => a + b, 0) / ys.length
            for (let i = 1; i < points.length - 1; i++) {
                if (points[i].y < avgY && points[i - 1].y > points[i].y && points[i + 1].y > points[i].y) {
                    peaks++
                }
            }
            if (peaks >= 4 && peaks <= 6) {
                return "star"
            }
        }

        return null
    }

    const cleanUpShape = () => {
        if (!lastStrokeId || !detectedShape) return

        const stroke = strokes.find((s) => s.id === lastStrokeId)
        if (!stroke) return

        const xs = stroke.points.map((p) => p.x)
        const ys = stroke.points.map((p) => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        const cleanedShape: Shape = {
            id: `shape-${Date.now()}`,
            type: "cleanedShape",
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            color: stroke.color,
            shapeType: detectedShape as any,
        }

        startTransition(() => {
            setShapes((prev) => [...prev, cleanedShape])
            setStrokes((prev) => prev.filter((s) => s.id !== lastStrokeId))
            setShowShapeCleanup(false)
            setDetectedShape(null)
            setLastStrokeId(null)
        })
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e)

        if (tool === "select") {
            // Check if clicking on resize handle
            const selected = shapes.find((s) => s.id === selectedId)
            if (selected) {
                const handles = [
                    { x: selected.x, y: selected.y, name: "nw" },
                    { x: selected.x + selected.width, y: selected.y, name: "ne" },
                    { x: selected.x, y: selected.y + selected.height, name: "sw" },
                    { x: selected.x + selected.width, y: selected.y + selected.height, name: "se" },
                ]
                for (const handle of handles) {
                    if (Math.abs(pos.x - handle.x) < 8 && Math.abs(pos.y - handle.y) < 8) {
                        setResizeHandle(handle.name)
                        setDragStart(pos)
                        return
                    }
                }
            }

            // Check if clicking on a shape
            for (let i = shapes.length - 1; i >= 0; i--) {
                const shape = shapes[i]
                if (
                    pos.x >= shape.x &&
                    pos.x <= shape.x + shape.width &&
                    pos.y >= shape.y &&
                    pos.y <= shape.y + shape.height
                ) {
                    setSelectedId(shape.id)
                    setDragStart(pos)
                    return
                }
            }
            setSelectedId(null)
        } else if (tool === "pen") {
            setIsDrawing(true)
            setCurrentStroke([snapToGridPoint(pos)])
        } else if (tool === "rect" || tool === "circle" || tool === "arrow") {
            setIsDrawing(true)
            setDragStart(snapToGridPoint(pos))
        } else if (tool === "text") {
            const text = prompt("Enter text:")
            if (text) {
                const newShape: Shape = {
                    id: `shape-${Date.now()}`,
                    type: "text",
                    x: pos.x,
                    y: pos.y,
                    width: 100,
                    height: fontSize,
                    color: strokeColor,
                    text,
                }
                startTransition(() => {
                    setShapes((prev) => [...prev, newShape])
                })
            }
        } else if (tool === "sticky") {
            const text = prompt("Enter sticky note text:")
            const colorIndex = shapes.filter((s) => s.type === "sticky").length % stickyNoteColors.length
            const newShape: Shape = {
                id: `shape-${Date.now()}`,
                type: "sticky",
                x: pos.x,
                y: pos.y,
                width: 150,
                height: 150,
                color: stickyNoteColors[colorIndex],
                text: text || "",
            }
            startTransition(() => {
                setShapes((prev) => [...prev, newShape])
            })
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e)

        if (tool === "select" && dragStart && selectedId && !resizeHandle) {
            // Move shape
            const dx = pos.x - dragStart.x
            const dy = pos.y - dragStart.y
            startTransition(() => {
                setShapes((prev) =>
                    prev.map((s) =>
                        s.id === selectedId
                            ? {
                                    ...s,
                                    x: s.x + dx,
                                    y: s.y + dy,
                              }
                            : s
                    )
                )
            })
            setDragStart(pos)
        } else if (tool === "select" && dragStart && selectedId && resizeHandle) {
            // Resize shape
            startTransition(() => {
                setShapes((prev) =>
                    prev.map((s) => {
                        if (s.id !== selectedId) return s
                        const newShape = { ...s }
                        if (resizeHandle.includes("e")) {
                            newShape.width = Math.max(20, pos.x - s.x)
                        }
                        if (resizeHandle.includes("w")) {
                            const newWidth = Math.max(20, s.x + s.width - pos.x)
                            newShape.x = s.x + s.width - newWidth
                            newShape.width = newWidth
                        }
                        if (resizeHandle.includes("s")) {
                            newShape.height = Math.max(20, pos.y - s.y)
                        }
                        if (resizeHandle.includes("n")) {
                            const newHeight = Math.max(20, s.y + s.height - pos.y)
                            newShape.y = s.y + s.height - newHeight
                            newShape.height = newHeight
                        }
                        return newShape
                    })
                )
            })
        } else if (isDrawing && tool === "pen") {
            setCurrentStroke((prev) => [...prev, snapToGridPoint(pos)])
        }
    }

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e)

        if (tool === "pen" && isDrawing && currentStroke.length > 0) {
            const newStroke: Stroke = {
                id: `stroke-${Date.now()}`,
                points: currentStroke,
                color: strokeColor,
                width: strokeWidth,
                tool: "pen",
            }
            startTransition(() => {
                setStrokes((prev) => [...prev, newStroke])
                setCurrentStroke([])
                setIsDrawing(false)

                // Check for shape recognition
                if (enableAI && enableShapeRecognition) {
                    const shape = recognizeShape(currentStroke)
                    if (shape) {
                        setDetectedShape(shape)
                        setLastStrokeId(newStroke.id)
                        setShowShapeCleanup(true)
                    }
                }
            })
        } else if (isDrawing && dragStart && (tool === "rect" || tool === "circle" || tool === "arrow")) {
            const snappedPos = snapToGridPoint(pos)
            const newShape: Shape = {
                id: `shape-${Date.now()}`,
                type: tool,
                x: Math.min(dragStart.x, snappedPos.x),
                y: Math.min(dragStart.y, snappedPos.y),
                width: Math.abs(snappedPos.x - dragStart.x),
                height: Math.abs(snappedPos.y - dragStart.y),
                color: strokeColor,
            }
            if (newShape.width > 5 && newShape.height > 5) {
                startTransition(() => {
                    setShapes((prev) => [...prev, newShape])
                })
            }
            setIsDrawing(false)
            setDragStart(null)
        } else {
            setIsDrawing(false)
            setDragStart(null)
            setResizeHandle(null)
        }
    }

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Delete" && selectedId) {
                startTransition(() => {
                    setShapes((prev) => prev.filter((s) => s.id !== selectedId))
                    setStrokes((prev) => prev.filter((s) => s.id !== selectedId))
                    setSelectedId(null)
                })
            }
        },
        [selectedId]
    )

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    const generateDiagram = async () => {
        if (!enableAI || !diagramPrompt.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "YOUR_API_KEY_HERE",
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    messages: [
                        {
                            role: "user",
                            content: `Generate a diagram based on this description: "${diagramPrompt}". Return ONLY a JSON object with this structure: {"nodes": [{"id": "1", "label": "Node 1", "x": 100, "y": 100, "width": 120, "height": 60}], "edges": [{"from": "1", "to": "2", "label": "connects"}]}. Make sure x,y coordinates are spread out nicely within a 800x600 canvas.`,
                        },
                    ],
                }),
            })

            const data = await response.json()
            const content = data.content[0].text

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const diagramData = JSON.parse(jsonMatch[0])

                // Create shapes from nodes
                const newShapes: Shape[] = diagramData.nodes.map((node: DiagramNode) => ({
                    id: `node-${node.id}`,
                    type: "rect" as const,
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height,
                    color: strokeColor,
                }))

                // Create text labels for nodes
                const textShapes: Shape[] = diagramData.nodes.map((node: DiagramNode) => ({
                    id: `text-${node.id}`,
                    type: "text" as const,
                    x: node.x + 10,
                    y: node.y + node.height / 2 - fontSize / 2,
                    width: node.width - 20,
                    height: fontSize,
                    color: strokeColor,
                    text: node.label,
                }))

                // Create arrows for edges
                const edgeShapes: Shape[] = diagramData.edges.map((edge: DiagramEdge, i: number) => {
                    const fromNode = diagramData.nodes.find((n: DiagramNode) => n.id === edge.from)
                    const toNode = diagramData.nodes.find((n: DiagramNode) => n.id === edge.to)
                    if (!fromNode || !toNode) return null

                    return {
                        id: `edge-${i}`,
                        type: "arrow" as const,
                        x: fromNode.x + fromNode.width / 2,
                        y: fromNode.y + fromNode.height / 2,
                        width: toNode.x + toNode.width / 2 - (fromNode.x + fromNode.width / 2),
                        height: toNode.y + toNode.height / 2 - (fromNode.y + fromNode.height / 2),
                        color: strokeColor,
                    }
                }).filter(Boolean) as Shape[]

                startTransition(() => {
                    setShapes((prev) => [...prev, ...newShapes, ...textShapes, ...edgeShapes])
                    setDiagramPrompt("")
                })
            }
        } catch (error) {
            console.error("Failed to generate diagram:", error)
            alert("Failed to generate diagram. Please check your API key and try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const processSelectedStickies = async () => {
        if (!enableAI || selectedStickyIds.length === 0 || !aiPrompt.trim()) return

        setIsLoading(true)
        try {
            const selectedStickies = shapes.filter(
                (s) => s.type === "sticky" && selectedStickyIds.includes(s.id)
            )
            const stickyTexts = selectedStickies.map((s) => s.text).join("\n\n")

            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "YOUR_API_KEY_HERE",
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    messages: [
                        {
                            role: "user",
                            content: `${aiPrompt}\n\nSticky notes:\n${stickyTexts}`,
                        },
                    ],
                }),
            })

            const data = await response.json()
            const responseText = data.content[0].text

            // Create a new sticky note with the response
            const newSticky: Shape = {
                id: `sticky-${Date.now()}`,
                type: "sticky",
                x: 50,
                y: 50,
                width: 200,
                height: 200,
                color: "#FFEB3B",
                text: responseText,
            }

            startTransition(() => {
                setShapes((prev) => [...prev, newSticky])
                setSelectedStickyIds([])
                setAiPrompt("")
            })
        } catch (error) {
            console.error("Failed to process stickies:", error)
            alert("Failed to process sticky notes. Please check your API key and try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleStickySelection = (id: string) => {
        startTransition(() => {
            setSelectedStickyIds((prev) =>
                prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
            )
        })
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f5f5f5",
                position: "relative",
            }}
        >
            {/* Toolbar */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    padding: 12,
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e0e0e0",
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                {["select", "pen", "rect", "circle", "arrow", "text", "sticky"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTool(t as any)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: tool === t ? "#0099FF" : "#ffffff",
                            color: tool === t ? "#ffffff" : "#000000",
                            border: "1px solid #e0e0e0",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 500,
                            minWidth: "fit-content",
                        }}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
                <button
                    onClick={() => {
                        startTransition(() => {
                            setStrokes([])
                            setShapes([])
                            setSelectedId(null)
                        })
                    }}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#ff4444",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                        minWidth: "fit-content",
                    }}
                >
                    Clear
                </button>
            </div>

            <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: enableAI && showAIPanel ? "row" : "column" }}>
                {/* Canvas */}
                <div style={{ flex: 1, overflow: "auto", position: "relative", minWidth: 0 }}>
                    <canvas
                        ref={canvasRef}
                        width={canvasDimensions.width}
                        height={canvasDimensions.height}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        style={{
                            cursor:
                                tool === "pen"
                                    ? "crosshair"
                                    : tool === "select"
                                    ? "default"
                                    : "crosshair",
                            display: "block",
                            maxWidth: "100%",
                            height: "auto",
                        }}
                    />

                    {/* Shape cleanup popup */}
                    {showShapeCleanup && detectedShape && (
                        <div
                            style={{
                                position: "absolute",
                                top: 20,
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "#ffffff",
                                padding: 16,
                                borderRadius: 8,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                display: "flex",
                                gap: 12,
                                alignItems: "center",
                            }}
                        >
                            <span style={{ fontSize: 14 }}>
                                Detected {detectedShape}! Clean it up?
                            </span>
                            <button
                                onClick={cleanUpShape}
                                style={{
                                    padding: "6px 12px",
                                    backgroundColor: "#0099FF",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontSize: 14,
                                }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => {
                                    startTransition(() => {
                                        setShowShapeCleanup(false)
                                        setDetectedShape(null)
                                        setLastStrokeId(null)
                                    })
                                }}
                                style={{
                                    padding: "6px 12px",
                                    backgroundColor: "#e0e0e0",
                                    color: "#000000",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    fontSize: 14,
                                }}
                            >
                                No
                            </button>
                        </div>
                    )}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                backgroundColor: "rgba(255,255,255,0.95)",
                                padding: 24,
                                borderRadius: 8,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                fontSize: 16,
                                fontWeight: 500,
                            }}
                        >
                            Processing with AI...
                        </div>
                    )}
                </div>

                {/* AI Panel */}
                {enableAI && showAIPanel && (
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 300,
                            minWidth: 250,
                            backgroundColor: "#ffffff",
                            borderLeft: "1px solid #e0e0e0",
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            overflowY: "auto",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 600 }}>
                                Generate Diagram
                            </h3>
                            <textarea
                                value={diagramPrompt}
                                onChange={(e) => setDiagramPrompt(e.target.value)}
                                placeholder="Describe a diagram (e.g., 'draw a flowchart for user login')"
                                style={{
                                    width: "100%",
                                    height: 80,
                                    padding: 8,
                                    fontSize: 14,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 4,
                                    resize: "none",
                                    fontFamily: "inherit",
                                }}
                            />
                            <button
                                onClick={generateDiagram}
                                disabled={isLoading || !diagramPrompt.trim()}
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    padding: "8px 16px",
                                    backgroundColor: "#0099FF",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    opacity: isLoading || !diagramPrompt.trim() ? 0.5 : 1,
                                }}
                            >
                                Generate
                            </button>
                        </div>

                        <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 16 }}>
                            <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 600 }}>
                                Smart Sticky Notes
                            </h3>
                            <div style={{ marginBottom: 12 }}>
                                <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px 0" }}>
                                    Select sticky notes:
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {shapes
                                        .filter((s) => s.type === "sticky")
                                        .map((sticky) => (
                                            <label
                                                key={sticky.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    fontSize: 14,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStickyIds.includes(sticky.id)}
                                                    onChange={() => toggleStickySelection(sticky.id)}
                                                />
                                                <span
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {sticky.text?.substring(0, 30) || "Empty note"}
                                                </span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Enter prompt (e.g., 'summarize these notes')"
                                style={{
                                    width: "100%",
                                    height: 60,
                                    padding: 8,
                                    fontSize: 14,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 4,
                                    resize: "none",
                                    fontFamily: "inherit",
                                }}
                            />
                            <button
                                onClick={processSelectedStickies}
                                disabled={isLoading || selectedStickyIds.length === 0 || !aiPrompt.trim()}
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    padding: "8px 16px",
                                    backgroundColor: "#0099FF",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor:
                                        isLoading || selectedStickyIds.length === 0 || !aiPrompt.trim()
                                            ? "not-allowed"
                                            : "pointer",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    opacity:
                                        isLoading || selectedStickyIds.length === 0 || !aiPrompt.trim()
                                            ? 0.5
                                            : 1,
                                }}
                            >
                                Process
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(AIWhiteboard, {
    enableAI: {
        type: ControlType.Boolean,
        title: "Enable AI",
        defaultValue: true,
    },
    showAIPanel: {
        type: ControlType.Boolean,
        title: "Show AI Panel",
        defaultValue: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
    },
    stickyNoteColors: {
        type: ControlType.Array,
        title: "Sticky Colors",
        control: {
            type: ControlType.Color,
        },
        defaultValue: ["#FFEB3B", "#FF9800", "#4CAF50", "#2196F3", "#9C27B0"],
    },
    defaultTool: {
        type: ControlType.Enum,
        title: "Default Tool",
        options: ["pen", "rect", "circle", "arrow", "text", "sticky", "select"],
        defaultValue: "pen",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 48,
        step: 2,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
    },
    enableShapeRecognition: {
        type: ControlType.Boolean,
        title: "Shape Recognition",
        defaultValue: true,
    },
    gridEnabled: {
        type: ControlType.Boolean,
        title: "Show Grid",
        defaultValue: false,
    },
    snapToGrid: {
        type: ControlType.Boolean,
        title: "Snap to Grid",
        defaultValue: false,
    },
    initialCanvas: {
        type: ControlType.String,
        title: "Initial Canvas",
        displayTextArea: true,
        defaultValue: "",
    },
})
