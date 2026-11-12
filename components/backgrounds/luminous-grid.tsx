// Animated dot grid background with spotlight effect that highlights dots as it passes through
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    useCallback,
    useMemo,
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


interface LuminousGridProps {
    dotSize: number
    dotSpacing: number
    dotColor: string
    spotlightSize: number
    hoverHighlight: boolean
    borderRadius: number
    backgroundImage?: { src: string; alt?: string }
    imageFit: "cover" | "contain" | "fill" | "none" | "scale-down"
    enableBlinking: boolean
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LuminousGrid(props: LuminousGridProps) {
    const {
        dotSize = 2,
        dotSpacing = 30,
        dotColor = "#CCCCCC",
        spotlightSize = 150,
        hoverHighlight = true,
        borderRadius = 0,
        backgroundImage,
        imageFit = "cover",
        enableBlinking = true,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
        null
    )
    const animationFrameRef = useRef<number>()
    const isAnimatingRef = useRef(false)
    const currentMousePosRef = useRef<{ x: number; y: number } | null>(null)
    const blinkOffsetsRef = useRef<Map<string, number>>(new Map())
    const blinkSpeedsRef = useRef<Map<string, number>>(new Map())
    const blinkIntensitiesRef = useRef<Map<string, number>>(new Map())
    const startTimeRef = useRef<number>(Date.now())
    const lastMouseUpdateRef = useRef<number>(0)
    const dotPositionsRef = useRef<Array<{ x: number; y: number; key: string }>>([])

    // Parse color once and memoize
    const { baseR, baseG, baseB, highlightR, highlightG, highlightB } = useMemo(() => {
        let baseR = 204, baseG = 204, baseB = 204

        if (typeof document !== "undefined") {
            const tempCanvas = document.createElement("canvas")
            tempCanvas.width = 1
            tempCanvas.height = 1
            const tempCtx = tempCanvas.getContext("2d")
            if (tempCtx) {
                tempCtx.fillStyle = dotColor
                tempCtx.fillRect(0, 0, 1, 1)
                const imageData = tempCtx.getImageData(0, 0, 1, 1).data
                baseR = imageData[0]
                baseG = imageData[1]
                baseB = imageData[2]
            }
        }

        const lightenFactor = 0.6
        const highlightR = Math.min(255, baseR + (255 - baseR) * lightenFactor)
        const highlightG = Math.min(255, baseG + (255 - baseG) * lightenFactor)
        const highlightB = Math.min(255, baseB + (255 - baseB) * lightenFactor)

        return { baseR, baseG, baseB, highlightR, highlightG, highlightB }
    }, [dotColor])

    // Centralized drawing function
    const drawDots = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        ctx.clearRect(0, 0, width, height)

        const mouse = currentMousePosRef.current
        const spotlightRadius =
            hoverHighlight && mouse ? spotlightSize * 0.8 : 0

        // Cache dot positions if not already cached or grid changed
        if (dotPositionsRef.current.length === 0) {
            const cols = Math.ceil(width / dotSpacing) + 1
            const rows = Math.ceil(height / dotSpacing) + 1
            const positions: Array<{ x: number; y: number; key: string }> = []
            
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const dotX = i * dotSpacing
                    const dotY = j * dotSpacing
                    const dotKey = `${i}-${j}`
                    positions.push({ x: dotX, y: dotY, key: dotKey })
                    
                    // Initialize blink properties once
                    if (!blinkOffsetsRef.current.has(dotKey)) {
                        blinkOffsetsRef.current.set(dotKey, Math.random() * Math.PI * 2)
                        blinkSpeedsRef.current.set(dotKey, 0.5 + Math.random() * 1.5)
                        blinkIntensitiesRef.current.set(dotKey, 0.5 + Math.random() * 0.5)
                    }
                }
            }
            dotPositionsRef.current = positions
        }

        const currentTime = (Date.now() - startTimeRef.current) / 1000
        const useRoundedCorners = borderRadius > 0

        // Draw all dots using cached positions
        for (const { x: dotX, y: dotY, key: dotKey } of dotPositionsRef.current) {
            const blinkOffset = blinkOffsetsRef.current.get(dotKey) || 0
            const blinkSpeed = blinkSpeedsRef.current.get(dotKey) || 1
            const blinkIntensity = blinkIntensitiesRef.current.get(dotKey) || 1

            const blinkValue = Math.sin(currentTime * blinkSpeed + blinkOffset) * 0.5 + 0.5
            const blinkOpacity = enableBlinking ? 0.2 + blinkValue * blinkIntensity * 0.8 : 1

            let intensity = 0

            if (spotlightRadius > 0 && mouse) {
                const dx = dotX - mouse.x
                const dy = dotY - mouse.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                intensity = Math.max(0, 1 - distance / spotlightRadius)
            }

            const currentSize = intensity > 0 ? dotSize + intensity * dotSize * 1.5 : dotSize

            // Apply color with blink effect combined with highlight
            if (intensity > 0) {
                const finalOpacity = (0.7 + intensity * 0.3) * blinkOpacity
                ctx.fillStyle = `rgba(${highlightR}, ${highlightG}, ${highlightB}, ${finalOpacity})`
            } else {
                ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${blinkOpacity})`
            }

            ctx.beginPath()

            if (useRoundedCorners) {
                // Use arc for rounded corners - much more efficient
                const radius = Math.min(borderRadius * (currentSize / dotSize), currentSize)
                ctx.arc(dotX, dotY, radius, 0, Math.PI * 2)
            } else {
                // Simple rectangle
                ctx.rect(dotX - currentSize, dotY - currentSize, currentSize * 2, currentSize * 2)
            }

            ctx.fill()
        }
    }, [
        dotSize,
        dotSpacing,
        spotlightSize,
        hoverHighlight,
        borderRadius,
        enableBlinking,
        baseR,
        baseG,
        baseB,
        highlightR,
        highlightG,
        highlightB,
    ])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        // Clear cached positions when canvas size changes
        dotPositionsRef.current = []

        // Don't animate in static renderer
        if (isStatic) {
            drawDots()
            return
        }

        // Only animate if blinking is enabled or mouse is hovering
        const shouldAnimate = () => enableBlinking || currentMousePosRef.current !== null

        isAnimatingRef.current = true
        const animate = () => {
            drawDots()
            
            if (isAnimatingRef.current && shouldAnimate()) {
                animationFrameRef.current = requestAnimationFrame(animate)
            } else if (isAnimatingRef.current) {
                // Draw one final frame then stop
                drawDots()
                isAnimatingRef.current = false
            }
        }
        
        if (shouldAnimate()) {
            animationFrameRef.current = requestAnimationFrame(animate)
        } else {
            drawDots()
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            isAnimatingRef.current = false
        }
    }, [drawDots, enableBlinking, isStatic])

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !hoverHighlight) return
        
        // Throttle mouse updates to every 16ms (~60fps)
        const now = Date.now()
        if (now - lastMouseUpdateRef.current < 16) return
        lastMouseUpdateRef.current = now

        const rect = canvasRef.current.getBoundingClientRect()
        const newX = e.clientX - rect.left
        const newY = e.clientY - rect.top

        currentMousePosRef.current = { x: newX, y: newY }

        // Restart animation if it was stopped
        if (!isAnimatingRef.current && !isStatic) {
            isAnimatingRef.current = true
            const animate = () => {
                drawDots()
                if (isAnimatingRef.current && (enableBlinking || currentMousePosRef.current !== null)) {
                    animationFrameRef.current = requestAnimationFrame(animate)
                }
            }
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        startTransition(() => {
            setMousePos({ x: newX, y: newY })
        })
    }

    const handleMouseLeave = () => {
        currentMousePosRef.current = null
        startTransition(() => {
            setMousePos(null)
        })
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {backgroundImage?.src && (
                <img
                    src={backgroundImage.src}
                    alt={backgroundImage.alt || ""}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit,
                        pointerEvents: "none",
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: hoverHighlight ? "auto" : "none",
                    position: "relative",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
        </div>
    )
}

addPropertyControls(LuminousGrid, {
    dotSpacing: {
        type: ControlType.Number,
        title: "Grid Density",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Dot Radius",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#CCCCCC",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        defaultValue: "cover",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "None", "Scale Down"],
    },
    spotlightSize: {
        type: ControlType.Number,
        title: "Hover Size",
        defaultValue: 150,
        min: 50,
        max: 500,
        step: 10,
        unit: "px",
    },
    hoverHighlight: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableBlinking: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
