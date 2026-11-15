// Image reveal component with eraser hover effect
// Smoothly erases/reveals underlying image with soft-edged feathering
// Includes mouse tracking, smooth animations, and automatic reset on mouse leave
// Mobile and tablet: displays as slideshow without eraser effect

import {
    useRef,
    useState,
    useEffect,
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


interface ImageTouchRevealProps {
    topImage: { src: string; alt: string }
    bottomImage: { src: string; alt: string }
    eraserSize: number
    featherAmount: number
    resetDuration: number
    cursorBorderColor: string
    cursorBorderWidth: number
    slideshowDuration: number
    imageFit: "fill" | "fit" | "cover" | "contain" | "stretch" | "tile"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageTouchReveal(props: ImageTouchRevealProps) {
    const {
        topImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Top Image",
        },
        bottomImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Bottom Image",
        },
        eraserSize = 80,
        featherAmount = 30,
        resetDuration = 800,
        cursorBorderColor = "#FFFFFF",
        cursorBorderWidth = 2,
        slideshowDuration = 3000,
        imageFit = "fill",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const topImageRef = useRef<HTMLImageElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const erasedPixels = useRef<Set<string>>(new Set())
    const animationFrameRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()
    const lastMousePos = useRef({ x: 0, y: 0 })
    const erasedPositions = useRef<Array<{ x: number; y: number }>>([])
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    const getObjectFit = () => {
        switch (imageFit) {
            case "fill":
                return "cover"
            case "fit":
                return "contain"
            case "cover":
                return "cover"
            case "contain":
                return "contain"
            case "stretch":
                return "fill"
            case "tile":
                return "none"
            default:
                return "cover"
        }
    }

    const getBackgroundStyle = () => {
        if (imageFit === "tile") {
            return {
                backgroundImage: `url(${bottomImage.src})`,
                backgroundRepeat: "repeat",
                backgroundSize: "auto",
            }
        }
        return {}
    }

    const getTopBackgroundStyle = () => {
        if (imageFit === "tile") {
            return {
                backgroundImage: `url(${topImage.src})`,
                backgroundRepeat: "repeat",
                backgroundSize: "auto",
            }
        }
        return {}
    }

    useEffect(() => {
        if (typeof window === "undefined") return

        const checkDevice = () => {
            const isTouchDevice =
                "ontouchstart" in window || navigator.maxTouchPoints > 0
            const isSmallScreen = window.innerWidth <= 1024
            startTransition(() =>
                setIsMobileOrTablet(isTouchDevice || isSmallScreen)
            )
        }

        checkDevice()
        window.addEventListener("resize", checkDevice)

        return () => window.removeEventListener("resize", checkDevice)
    }, [])

    useEffect(() => {
        if (!isMobileOrTablet || isStatic) return

        const interval = setInterval(() => {
            startTransition(() => setCurrentSlide((prev) => (prev + 1) % 2))
        }, slideshowDuration)

        return () => clearInterval(interval)
    }, [isMobileOrTablet, slideshowDuration, isStatic])

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!containerRef.current || isMobileOrTablet) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            startTransition(() => setMousePos({ x, y }))
        },
        [isMobileOrTablet]
    )

    const handleMouseEnter = useCallback(() => {
        if (isMobileOrTablet) return
        startTransition(() => setIsHovering(true))
    }, [isMobileOrTablet])

    const handleMouseLeave = useCallback(() => {
        if (isMobileOrTablet) return
        startTransition(() => setIsHovering(false))
    }, [isMobileOrTablet])

    const drawEraser = useCallback(
        (ctx: CanvasRenderingContext2D, x: number, y: number) => {
            const radius = eraserSize / 2
            const feather = featherAmount

            ctx.globalCompositeOperation = "destination-out"

            const gradient = ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                radius + feather
            )
            gradient.addColorStop(0, "rgba(0, 0, 0, 1)")
            gradient.addColorStop(
                Math.max(0, radius / (radius + feather)),
                "rgba(0, 0, 0, 1)"
            )
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(x, y, radius + feather, 0, Math.PI * 2)
            ctx.fill()
        },
        [eraserSize, featherAmount]
    )

    const interpolatePoints = useCallback(
        (x1: number, y1: number, x2: number, y2: number) => {
            const points: Array<{ x: number; y: number }> = []
            const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            const steps = Math.max(1, Math.floor(distance / 5))

            for (let i = 0; i <= steps; i++) {
                const t = i / steps
                points.push({
                    x: x1 + (x2 - x1) * t,
                    y: y1 + (y2 - y1) * t,
                })
            }

            return points
        },
        []
    )

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const topImg = topImageRef.current
        if (!canvas || !topImg) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        erasedPositions.current.forEach((pos) => {
            drawEraser(ctx, pos.x, pos.y)
        })

        const dataUrl = canvas.toDataURL()
        topImg.style.maskImage = `url(${dataUrl})`
        topImg.style.webkitMaskImage = `url(${dataUrl})`
    }, [drawEraser])

    const resetCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const topImg = topImageRef.current
        if (!canvas || !topImg) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        erasedPixels.current.clear()
        erasedPositions.current = []
        lastMousePos.current = { x: 0, y: 0 }

        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL()
        topImg.style.maskImage = `url(${dataUrl})`
        topImg.style.webkitMaskImage = `url(${dataUrl})`
    }, [])

    useEffect(() => {
        if (isStatic || isMobileOrTablet) return

        const canvas = canvasRef.current
        const container = containerRef.current
        const topImg = topImageRef.current
        if (!canvas || !container || !topImg) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = container.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (isHovering) {
            if (lastMousePos.current.x !== 0 || lastMousePos.current.y !== 0) {
                const distance = Math.sqrt(
                    (mousePos.x - lastMousePos.current.x) ** 2 +
                        (mousePos.y - lastMousePos.current.y) ** 2
                )

                if (distance < 100) {
                    const interpolated = interpolatePoints(
                        lastMousePos.current.x,
                        lastMousePos.current.y,
                        mousePos.x,
                        mousePos.y
                    )
                    erasedPositions.current.push(...interpolated)
                } else {
                    erasedPositions.current.push(mousePos)
                }
            } else {
                erasedPositions.current.push(mousePos)
            }

            lastMousePos.current = mousePos
            redrawCanvas()
        } else {
            resetCanvas()
        }
    }, [
        mousePos,
        isHovering,
        drawEraser,
        resetCanvas,
        isStatic,
        interpolatePoints,
        redrawCanvas,
        isMobileOrTablet,
    ])

    useEffect(() => {
        if (isStatic || isMobileOrTablet) return

        const container = containerRef.current
        if (!container) return

        container.addEventListener("mousemove", handleMouseMove)
        container.addEventListener("mouseenter", handleMouseEnter)
        container.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            container.removeEventListener("mousemove", handleMouseMove)
            container.removeEventListener("mouseenter", handleMouseEnter)
            container.removeEventListener("mouseleave", handleMouseLeave)
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        handleMouseMove,
        handleMouseEnter,
        handleMouseLeave,
        isStatic,
        isMobileOrTablet,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isHovering && !isMobileOrTablet ? "none" : "default",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: isMobileOrTablet
                        ? currentSlide === 0
                            ? 1
                            : 0
                        : 1,
                    transition: isMobileOrTablet
                        ? "opacity 0.5s ease-in-out"
                        : "none",
                    ...getBackgroundStyle(),
                }}
            >
                {imageFit !== "tile" && (
                    <img
                        src={bottomImage.src}
                        alt={bottomImage.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: getObjectFit(),
                        }}
                    />
                )}
            </div>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: isMobileOrTablet
                        ? currentSlide === 1
                            ? 1
                            : 0
                        : 1,
                    transition: isMobileOrTablet
                        ? "opacity 0.5s ease-in-out"
                        : "none",
                    ...getTopBackgroundStyle(),
                }}
            >
                {imageFit !== "tile" && (
                    <img
                        ref={topImageRef}
                        src={topImage.src}
                        alt={topImage.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: getObjectFit(),
                        }}
                    />
                )}
            </div>
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    maskImage: "url()",
                    WebkitMaskImage: "url()",
                    display: isMobileOrTablet ? "none" : "none",
                }}
            />
            {isHovering && !isStatic && !isMobileOrTablet && (
                <div
                    style={{
                        position: "absolute",
                        left: mousePos.x,
                        top: mousePos.y,
                        width: eraserSize,
                        height: eraserSize,
                        borderRadius: "50%",
                        border: `${cursorBorderWidth}px solid ${cursorBorderColor}`,
                        backgroundColor: "transparent",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(ImageTouchReveal, {
    topImage: {
        type: ControlType.ResponsiveImage,
        title: "Top Image",
    },
    bottomImage: {
        type: ControlType.ResponsiveImage,
        title: "Bottom Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["fill", "fit", "cover", "contain", "stretch", "tile"],
        optionTitles: ["Fill", "Fit", "Cover", "Contain", "Stretch", "Tile"],
        defaultValue: "fill",
        displaySegmentedControl: false,
    },
    eraserSize: {
        type: ControlType.Number,
        title: "Eraser Size",
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 10,
        unit: "px",
    },
    featherAmount: {
        type: ControlType.Number,
        title: "Feather",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    resetDuration: {
        type: ControlType.Number,
        title: "Reset Duration",
        defaultValue: 800,
        min: 200,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    cursorBorderColor: {
        type: ControlType.Color,
        title: "Cursor Border",
        defaultValue: "#FFFFFF",
    },
    cursorBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    slideshowDuration: {
        type: ControlType.Number,
        title: "Responsive Slideshow Duration",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
    },
})