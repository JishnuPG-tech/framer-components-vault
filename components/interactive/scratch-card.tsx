// Scratch Card interactive component with HTML Canvas for realistic scratch effect
import { useRef, useEffect, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScratchCardProps {
    bottomImage: { src: string; alt: string }
    backgroundColor: string
    useImage: boolean
    topText: string
    hoverText: string
    clickText: string
    textColor: string
    scratchLayerColor: string
    topLayerColor: string
    brushSize: number
    resetButtonText: string
    buttonColor: string
    buttonTextColor: string
    font: any
    buttonFont: any
    scratchMode: "scratch" | "hover" | "click"
    borderRadius: number
    style?: CSSProperties
}

/**
 * Scratch Card Component
 * 
 * Interactive scratch card with HTML Canvas that reveals content underneath
 * 
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScratchCard(props: ScratchCardProps) {
    const {
        bottomImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Revealed content"
        },
        backgroundColor = "#FFD700",
        useImage = true,
        topText = "Scratch to reveal",
        hoverText = "Hover to reveal",
        clickText = "Click to reveal",
        textColor = "#666666",
        scratchLayerColor = "#FFFFFF",
        topLayerColor = "#C0C0C0",
        brushSize = 30,
        resetButtonText = "Reset",
        buttonColor = "#333333",
        buttonTextColor = "#FFFFFF",
        font,
        buttonFont,
        scratchMode = "scratch",
        borderRadius = 8,
        style
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isScratching, setIsScratching] = useState(false)
    const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 })
    const [isRevealed, setIsRevealed] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [maskImageUrl, setMaskImageUrl] = useState<string>('')
    const [isInitialized, setIsInitialized] = useState(false)
    const [lastPosition, setLastPosition] = useState<{x: number, y: number} | null>(null)
    const isStatic = useIsStaticRenderer()

    // Initialize canvas with scratch surface
    const initializeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        canvas.width = canvasSize.width
        canvas.height = canvasSize.height

        // Create scratch surface with texture
        ctx.fillStyle = topLayerColor
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

        // Add subtle texture
        ctx.globalAlpha = 0.1
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#FFF'
            ctx.fillRect(
                Math.random() * canvasSize.width,
                Math.random() * canvasSize.height,
                2, 2
            )
        }
        ctx.globalAlpha = 1

        // Update mask image URL after canvas changes
        if (typeof window !== "undefined") {
            try {
                const dataUrl = canvas.toDataURL()
                setMaskImageUrl(dataUrl)
                setIsInitialized(true)
            } catch (error) {
                console.warn('Failed to generate canvas data URL:', error)
                setMaskImageUrl('')
            }
        }
    }, [canvasSize, topLayerColor])

    // Update canvas size when container size changes
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setCanvasSize({ width: rect.width, height: rect.height })
            }
        }

        updateSize()
        
        if (typeof window !== "undefined") {
            window.addEventListener('resize', updateSize)
            return () => window.removeEventListener('resize', updateSize)
        }
    }, [])

    // Initialize canvas when size changes
    useEffect(() => {
        initializeCanvas()
    }, [initializeCanvas])

    // Get coordinates relative to canvas
    const getCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return null

        const rect = canvas.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY

        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        }
    }, [])

    // Scratch function
    const scratch = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (lastPosition) {
            // Draw line from last position to current position
            ctx.beginPath()
            ctx.moveTo(lastPosition.x, lastPosition.y)
            ctx.lineTo(x, y)
            ctx.stroke()
        } else {
            // First point, draw a circle
            ctx.beginPath()
            ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI)
            ctx.fill()
        }

        setLastPosition({ x, y })

        // Update mask image URL after scratching
        if (typeof window !== "undefined") {
            try {
                const dataUrl = canvas.toDataURL()
                setMaskImageUrl(dataUrl)
            } catch (error) {
                console.warn('Failed to generate canvas data URL:', error)
            }
        }
    }, [brushSize, lastPosition])

    // Mouse events
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (isStatic) return
        
        e.preventDefault()
        
        if (scratchMode === "click") {
            startTransition(() => setIsRevealed(!isRevealed))
            return
        }
        
        if (scratchMode === "scratch") {
            startTransition(() => setIsScratching(true))
            
            const coords = getCoordinates(e.nativeEvent)
            if (coords) {
                scratch(coords.x, coords.y)
            }
        }
    }, [isStatic, scratchMode, isRevealed, getCoordinates, scratch])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isScratching || isStatic) return
        
        const coords = getCoordinates(e)
        if (coords) {
            scratch(coords.x, coords.y)
        }
    }, [isScratching, isStatic, getCoordinates, scratch])

    const handleMouseUp = useCallback(() => {
        startTransition(() => {
            setIsScratching(false)
            setLastPosition(null)
        })
    }, [])

    // Touch events
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (isStatic) return
        
        e.preventDefault()
        startTransition(() => setIsScratching(true))
        
        const coords = getCoordinates(e.nativeEvent)
        if (coords) {
            scratch(coords.x, coords.y)
        }
    }, [isStatic, getCoordinates, scratch])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isScratching || isStatic) return
        
        e.preventDefault()
        const coords = getCoordinates(e)
        if (coords) {
            scratch(coords.x, coords.y)
        }
    }, [isScratching, isStatic, getCoordinates, scratch])

    // Global event listeners
    useEffect(() => {
        if (isStatic) return

        const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e)
        const handleGlobalMouseUp = () => handleMouseUp()
        const handleGlobalTouchMove = (e: TouchEvent) => handleTouchMove(e)
        const handleGlobalTouchEnd = () => handleMouseUp()

        if (isScratching) {
            document.addEventListener('mousemove', handleGlobalMouseMove)
            document.addEventListener('mouseup', handleGlobalMouseUp)
            document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
            document.addEventListener('touchend', handleGlobalTouchEnd)
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove)
            document.removeEventListener('mouseup', handleGlobalMouseUp)
            document.removeEventListener('touchmove', handleGlobalTouchMove)
            document.removeEventListener('touchend', handleGlobalTouchEnd)
        }
    }, [isScratching, handleMouseMove, handleMouseUp, handleTouchMove, isStatic])

    // Handle hover mode
    const handleMouseEnter = useCallback(() => {
        if (scratchMode === "hover") {
            startTransition(() => setIsHovering(true))
        }
    }, [scratchMode])

    const handleMouseLeave = useCallback(() => {
        if (scratchMode === "hover") {
            startTransition(() => setIsHovering(false))
        }
    }, [scratchMode])

    // Reset function
    const handleReset = useCallback(() => {
        if (scratchMode === "scratch") {
            initializeCanvas()
        } else {
            startTransition(() => {
                setIsRevealed(false)
                setIsHovering(false)
            })
        }
    }, [initializeCanvas, scratchMode])

    // Determine canvas opacity based on mode
    const getCanvasOpacity = () => {
        if (scratchMode === "hover") {
            return isHovering ? 0 : 1
        }
        if (scratchMode === "click") {
            return isRevealed ? 0 : 1
        }
        return 1 // scratch mode uses normal canvas behavior
    }

    // Determine text overlay opacity - should be hidden initially for scratch mode
    const getTextOpacity = () => {
        if (scratchMode === "scratch") {
            return isInitialized && maskImageUrl ? 1 : 0
        }
        return getCanvasOpacity()
    }

    // Update text based on mode
    const getDisplayText = () => {
        if (scratchMode === "hover") {
            return hoverText
        }
        if (scratchMode === "click") {
            return clickText
        }
        return topText
    }

    return (
        <div
            style={{
                ...style,
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: `${borderRadius}px`,
                overflow: 'hidden',
                userSelect: 'none',
                touchAction: 'none'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Bottom layer - revealed content */}
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: useImage ? 'transparent' : backgroundColor,
                    backgroundImage: useImage ? `url(${bottomImage.src})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
            </div>

            {/* Top layer - scratch canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: isStatic ? 'default' : scratchMode === "scratch" ? 'crosshair' : 'pointer',
                    zIndex: 1,
                    opacity: getCanvasOpacity(),
                    transition: scratchMode !== "scratch" ? 'opacity 0.3s ease' : 'none'
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            />

            {/* Text overlay - smooth HTML text that gets masked by canvas */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: textColor,
                    fontSize: font.fontSize,
                    fontFamily: font.fontFamily,
                    fontWeight: font.fontWeight,
                    fontStyle: font.fontStyle,
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 2,
                    opacity: getTextOpacity(),
                    transition: scratchMode !== "scratch" ? 'opacity 0.3s ease' : 'none',
                    maskImage: scratchMode === "scratch" && maskImageUrl ? `url(${maskImageUrl})` : 'none',
                    WebkitMaskImage: scratchMode === "scratch" && maskImageUrl ? `url(${maskImageUrl})` : 'none',
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat'
                }}
            >
                {getDisplayText()}
            </div>
        </div>
    )
}

addPropertyControls(ScratchCard, {
    scratchMode: {
        type: ControlType.Enum,
        title: "Reveal Mode",
        options: ["scratch", "hover", "click"],
        optionTitles: ["Scratch", "Hover", "Click"],
        defaultValue: "scratch",
        displaySegmentedControl: true
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px"
    },
    useImage: {
        type: ControlType.Boolean,
        title: "Bottom Layer",
        enabledTitle: "Image",
        disabledTitle: "Color",
        defaultValue: true
    },
    bottomImage: {
        type: ControlType.ResponsiveImage,
        title: "Bottom Image",
        hidden: ({ useImage }) => !useImage
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bottom Color",
        defaultValue: "#FFD700",
        hidden: ({ useImage }) => useImage
    },
    topLayerColor: {
        type: ControlType.Color,
        title: "Top Layer Color",
        defaultValue: "#C0C0C0"
    },
    topText: {
        type: ControlType.String,
        title: "Scratch Text",
        defaultValue: "Scratch to reveal",
        placeholder: "Enter text...",
        hidden: ({ scratchMode }) => scratchMode !== "scratch"
    },
    hoverText: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "Hover to reveal",
        placeholder: "Enter text...",
        hidden: ({ scratchMode }) => scratchMode !== "hover"
    },
    clickText: {
        type: ControlType.String,
        title: "Click Text",
        defaultValue: "Click to reveal",
        placeholder: "Enter text...",
        hidden: ({ scratchMode }) => scratchMode !== "click"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#666666"
    },
    font: {
        type: ControlType.Font,
        title: "Text Font",
        defaultValue: {
            fontSize: "16px"
        },
        controls: "basic",
        defaultFontType: "sans-serif",
        displayFontSize: true
    },
    brushSize: {
        type: ControlType.Number,
        title: "Brush Size",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
        hidden: ({ scratchMode }) => scratchMode !== "scratch"
    }
})