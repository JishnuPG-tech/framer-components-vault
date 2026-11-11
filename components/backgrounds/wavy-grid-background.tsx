// Responsive background with a wavy distorted grid pattern
import {
    useMemo,
    useCallback,
    useRef,
    useEffect,
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


interface WavyGridBackgroundProps {
    backgroundColor: string
    gridColor: string
    gridSize: number
    gridOpacity: number
    waveAmplitude: number
    waveFrequency: number
    animationSpeed: number
    enableAnimation: boolean
    gridThickness: number
    enableSideMask: boolean
    maskColor: string
    maskWidth: number
    enableTopBottomMask: boolean
    topBottomMaskColor: string
    topBottomMaskHeight: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WavyGridBackground(props: WavyGridBackgroundProps) {
    const {
        backgroundColor = "#000000",
        gridColor = "#333333",
        gridSize = 30,
        gridOpacity = 0.8,
        waveAmplitude = 20,
        waveFrequency = 0.02,
        animationSpeed = 2,
        enableAnimation = false,
        gridThickness = 1,
        enableSideMask = false,
        maskColor = "#000000",
        maskWidth = 100,
        enableTopBottomMask = false,
        topBottomMaskColor = "#000000",
        topBottomMaskHeight = 100,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)

    const drawGrid = useCallback(
        (canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const parent = canvas.parentElement
            if (!parent) return

            // Get dimensions from parent container
            const width = parent.clientWidth
            const height = parent.clientHeight

            if (width <= 0 || height <= 0) return

            const dpr = window.devicePixelRatio || 1

            // Set actual size in memory (scaled to account for extra pixel density)
            canvas.width = width * dpr
            canvas.height = height * dpr

            // Scale the drawing context so everything draws at the correct size
            ctx.scale(dpr, dpr)

            // Set display size (css pixels)
            canvas.style.width = width + "px"
            canvas.style.height = height + "px"

            ctx.clearRect(0, 0, width, height)
            ctx.strokeStyle = gridColor
            ctx.lineWidth = gridThickness
            ctx.globalAlpha = gridOpacity

            // Draw wavy grid with responsive sizing
            const effectiveGridSize = Math.max(
                gridSize * Math.min(width / 800, height / 600),
                10
            )

            for (let x = 0; x <= width; x += effectiveGridSize) {
                ctx.beginPath()
                for (let y = 0; y <= height; y += 2) {
                    const waveX =
                        x + Math.sin(y * waveFrequency) * waveAmplitude
                    if (y === 0) {
                        ctx.moveTo(waveX, y)
                    } else {
                        ctx.lineTo(waveX, y)
                    }
                }
                ctx.stroke()
            }

            for (let y = 0; y <= height; y += effectiveGridSize) {
                ctx.beginPath()
                for (let x = 0; x <= width; x += 2) {
                    const waveY =
                        y + Math.sin(x * waveFrequency) * waveAmplitude
                    if (x === 0) {
                        ctx.moveTo(x, waveY)
                    } else {
                        ctx.lineTo(x, waveY)
                    }
                }
                ctx.stroke()
            }
        },
        [
            gridSize,
            gridColor,
            gridThickness,
            gridOpacity,
            waveAmplitude,
            waveFrequency,
        ]
    )

    // Redraw when any visual property changes
    useEffect(() => {
        if (canvasRef.current) {
            drawGrid(canvasRef.current)
        }
    }, [
        gridColor,
        gridSize,
        gridOpacity,
        waveAmplitude,
        waveFrequency,
        gridThickness,
        drawGrid,
    ])

    const setupCanvas = useCallback(
        (canvas: HTMLCanvasElement | null) => {
            if (!canvas) return

            // Clean up previous observer
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }

            // Delay initial draw to ensure parent has proper dimensions
            setTimeout(() => {
                drawGrid(canvas)
            }, 0)

            // Handle resize
            resizeObserverRef.current = new ResizeObserver(() => {
                drawGrid(canvas)
            })

            const parent = canvas.parentElement
            if (parent) {
                resizeObserverRef.current.observe(parent)
            }
        },
        [drawGrid]
    )

    useEffect(() => {
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }
        }
    }, [])

    if (typeof window === "undefined") {
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    overflow: "hidden",
                    minWidth: 0,
                    minHeight: 0,
                }}
            />
        )
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                minWidth: 0,
                minHeight: 0,
            }}
        >
            <canvas
                ref={(canvas) => {
                    canvasRef.current = canvas
                    setupCanvas(canvas)
                }}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
            {enableSideMask && (
                <>
                    {/* Left gradient mask */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: `${maskWidth}px`,
                            height: "100%",
                            background: `linear-gradient(to right, ${maskColor}, transparent)`,
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    />
                    {/* Right gradient mask */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: `${maskWidth}px`,
                            height: "100%",
                            background: `linear-gradient(to left, ${maskColor}, transparent)`,
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    />
                </>
            )}
            {enableTopBottomMask && (
                <>
                    {/* Top gradient mask */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${topBottomMaskHeight}px`,
                            background: `linear-gradient(to bottom, ${topBottomMaskColor}, transparent)`,
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    />
                    {/* Bottom gradient mask */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "100%",
                            height: `${topBottomMaskHeight}px`,
                            background: `linear-gradient(to top, ${topBottomMaskColor}, transparent)`,
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    />
                </>
            )}
        </div>
    )
}

addPropertyControls(WavyGridBackground, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
        description:
            "Created by [Caio Calderari](https://www.calderari.com.br)",
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "#333333",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    gridThickness: {
        type: ControlType.Number,
        title: "Grid Thickness",
        defaultValue: 1,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "px",
    },
    gridOpacity: {
        type: ControlType.Number,
        title: "Grid Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Amplitude",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 2,
        unit: "px",
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Frequency",
        defaultValue: 0.02,
        min: 0.005,
        max: 0.1,
        step: 0.005,
    },
    enableSideMask: {
        type: ControlType.Boolean,
        title: "Side Mask",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    maskColor: {
        type: ControlType.Color,
        title: "Mask Color",
        defaultValue: "#000000",
        hidden: ({ enableSideMask }) => !enableSideMask,
    },
    maskWidth: {
        type: ControlType.Number,
        title: "Mask Width",
        defaultValue: 100,
        min: 20,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ enableSideMask }) => !enableSideMask,
    },
    enableTopBottomMask: {
        type: ControlType.Boolean,
        title: "Top/Bottom Mask",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    topBottomMaskColor: {
        type: ControlType.Color,
        title: "Top/Bottom Mask Color",
        defaultValue: "#000000",
        hidden: ({ enableTopBottomMask }) => !enableTopBottomMask,
    },
    topBottomMaskHeight: {
        type: ControlType.Number,
        title: "Top/Bottom Mask Height",
        defaultValue: 100,
        min: 20,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ enableTopBottomMask }) => !enableTopBottomMask,
    },
})
