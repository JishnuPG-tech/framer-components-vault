// Paint Reveal Effect Component using Canvas API - fully customizable with brush painting interaction
import {
    useRef,
    useEffect,
    useState,
    useCallback,
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


interface PaintRevealProps {
    revealImage: { src: string; alt?: string }
    coverColor: string
    brushSize: number
    brushOpacity: number
    autoReveal: boolean
    autoRevealDuration: number
    resetOnHover: boolean
    revealText: string
    textColor: string
    textFont: CSSProperties
    showText: boolean
    brushColor: string
    textMaxWidth: number
    style?: CSSProperties
}

/**
 * Paint Reveal Effect Component
 *
 * Interactive canvas-based paint reveal effect that allows users to "paint away"
 * a cover layer to reveal an underlying image. Features customizable brush size,
 * opacity, and auto-reveal options.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PaintReveal(props: PaintRevealProps) {
    const {
        revealImage = {
            src: "",
            alt: "Reveal Image",
        },
        coverColor = "#000000",
        brushSize = 50,
        brushOpacity = 1,
        autoReveal = false,
        autoRevealDuration = 3,
        resetOnHover = false,
        revealText = "OLIVIER LAROSE\nFRONT END DEVELOPER\nBASED IN MONTREAL\nPORTFOLIO@2024",
        textColor = "#FFFFFF",
        textFont,
        showText = true,
        brushColor = "#FFFFFF",
        textMaxWidth = 800,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [revealProgress, setRevealProgress] = useState(0)
    const animationFrameRef = useRef<number | null>(null)
    const isStatic = RenderTarget.current() === RenderTarget.thumbnail

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Fill the entire canvas with cover color (this is what users will paint away)
        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = coverColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }, [coverColor])

    const resetCanvas = useCallback(() => {
        startTransition(() => setRevealProgress(0))
        initCanvas()
    }, [initCanvas])

    useEffect(() => {
        const image = imageRef.current
        if (!image) return

        const handleLoad = () => {
            startTransition(() => setImageLoaded(true))
        }

        if (image.complete) {
            handleLoad()
        } else {
            image.addEventListener("load", handleLoad)
            return () => image.removeEventListener("load", handleLoad)
        }
    }, [revealImage.src])

    useEffect(() => {
        // Initialize canvas on mount and when dependencies change
        initCanvas()

        // Set up resize observer to handle canvas resizing
        const resizeObserver = new ResizeObserver(() => {
            initCanvas()
        })

        const canvas = canvasRef.current
        if (canvas) {
            resizeObserver.observe(canvas)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [initCanvas])

    useEffect(() => {
        if (autoReveal && imageLoaded && !isStatic) {
            const startTime = Date.now()
            const duration = autoRevealDuration * 1000

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)

                const canvas = canvasRef.current
                if (!canvas) return

                const ctx = canvas.getContext("2d")
                if (!ctx) return

                ctx.globalCompositeOperation = "destination-out"
                ctx.fillStyle = `rgba(0, 0, 0, ${brushOpacity})`

                const numCircles = 20
                for (let i = 0; i < numCircles; i++) {
                    const x = Math.random() * canvas.width
                    const y = Math.random() * canvas.height
                    ctx.beginPath()
                    ctx.arc(x, y, brushSize, 0, Math.PI * 2)
                    ctx.fill()
                }

                startTransition(() => setRevealProgress(progress))

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate)
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate)

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current)
                }
            }
        }
    }, [
        autoReveal,
        autoRevealDuration,
        imageLoaded,
        brushSize,
        brushOpacity,
        isStatic,
    ])

    const draw = useCallback(
        (x: number, y: number) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            // Erase parts of the canvas to reveal the background and text underneath
            ctx.globalCompositeOperation = "destination-out"

            // Use opacity for erasing effect with destination-out
            ctx.fillStyle = `rgba(0, 0, 0, ${brushOpacity})`
            ctx.beginPath()
            const canvasX = (x - rect.left) * scaleX
            const canvasY = (y - rect.top) * scaleY
            ctx.arc(canvasX, canvasY, brushSize, 0, Math.PI * 2)
            ctx.fill()
        },
        [brushSize, brushOpacity]
    )

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (isStatic) return
            startTransition(() => setIsDrawing(true))
            draw(e.clientX, e.clientY)
        },
        [draw, isStatic]
    )

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!isDrawing || isStatic) return
            draw(e.clientX, e.clientY)
        },
        [isDrawing, draw, isStatic]
    )

    const handleMouseUp = useCallback(() => {
        startTransition(() => setIsDrawing(false))
    }, [])

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLCanvasElement>) => {
            if (isStatic) return
            e.preventDefault()
            startTransition(() => setIsDrawing(true))
            const touch = e.touches[0]
            draw(touch.clientX, touch.clientY)
        },
        [draw, isStatic]
    )

    const handleTouchMove = useCallback(
        (e: React.TouchEvent<HTMLCanvasElement>) => {
            if (!isDrawing || isStatic) return
            e.preventDefault()
            const touch = e.touches[0]
            draw(touch.clientX, touch.clientY)
        },
        [isDrawing, draw, isStatic]
    )

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault()
            startTransition(() => setIsDrawing(false))
        },
        []
    )

    const handleMouseEnter = useCallback(() => {
        if (resetOnHover && !autoReveal) {
            resetCanvas()
        }
    }, [resetOnHover, resetCanvas, autoReveal])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isStatic ? "default" : "crosshair",
                ...props.style,
            }}
            onMouseEnter={handleMouseEnter}
        >
            {/* Hidden image element for loading */}
            <img
                ref={imageRef}
                src={revealImage.src}
                alt={revealImage.alt || ""}
                style={{ display: "none" }}
                crossOrigin="anonymous"
            />

            {/* White background layer that gets revealed through painting */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: brushColor, // Use the brush color as the revealed background
                }}
            />

            {/* Background layer - the reveal image (only if image is set) */}
            {revealImage.src && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${revealImage.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#000", // fallback color
                        zIndex: 1,
                    }}
                />
            )}

            {/* Text layer - visible through erased areas */}
            {showText && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        padding: "40px",
                        textAlign: "center",
                        zIndex: 2,
                    }}
                >
                    <div
                        style={{
                            color: textColor,
                            whiteSpace: "pre-line",
                            maxWidth: `${textMaxWidth}px`,
                            ...textFont,
                        }}
                    >
                        {revealText}
                    </div>
                </div>
            )}

            {/* Canvas cover layer - what gets erased to reveal what's underneath */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                    zIndex: 3,
                    mixBlendMode: "normal",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />
        </div>
    )
}

addPropertyControls(PaintReveal, {
    revealImage: {
        type: ControlType.ResponsiveImage,
        title: "Reveal Image",
    },
    coverColor: {
        type: ControlType.Color,
        title: "Cover Color",
        defaultValue: "#000000",
    },
    brushSize: {
        type: ControlType.Number,
        title: "Brush Size",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 5,
        unit: "px",
    },
    brushOpacity: {
        type: ControlType.Number,
        title: "Brush Opacity",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
    brushColor: {
        type: ControlType.Color,
        title: "Brush Color",
        defaultValue: "#FFFFFF",
    },
    autoReveal: {
        type: ControlType.Boolean,
        title: "Auto Reveal",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRevealDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: (props) => !props.autoReveal,
    },
    resetOnHover: {
        type: ControlType.Boolean,
        title: "Reset on Hover",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.autoReveal,
    },
    showText: {
        type: ControlType.Boolean,
        title: "Show Text",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    revealText: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "OLIVIER LAROSE\nFRONT END DEVELOPER\nBASED IN MONTREAL\nPORTFOLIO@2024",
        displayTextArea: true,
        hidden: (props) => !props.showText,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showText,
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        hidden: (props) => !props.showText,
    },
    textMaxWidth: {
        type: ControlType.Number,
        title: "Text Max Width",
        defaultValue: 800,
        min: 100,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: (props) => !props.showText,
    },
})
