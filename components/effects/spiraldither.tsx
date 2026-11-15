// Rippling spiral dither effect with animated concentric circles creating a dithered pattern
import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SpiralDitherProps {
    backgroundColor: string
    foregroundColor: string
    ditherAlgorithm: "spiral" | "floydSteinberg" | "ordered"
    spiralCount: number
    rippleSpeed: number
    ditherDensity: number
    rotationSpeed: number
    useCustomImage: boolean
    customImage: { src: string; alt?: string }
    usePreset: boolean
    preset: string
    style?: React.CSSProperties
}

// Preset configurations
const presets = {
    classicNewspaper: {
        ditherAlgorithm: "floydSteinberg" as const,
        backgroundColor: "#FFFFFF",
        foregroundColor: "#000000",
        ditherDensity: 50,
        spiralCount: 8,
        rippleSpeed: 1,
        rotationSpeed: 0.5,
    },
    retroCRT: {
        ditherAlgorithm: "ordered" as const,
        backgroundColor: "#0a0a0a",
        foregroundColor: "#00ff41",
        ditherDensity: 45,
        spiralCount: 12,
        rippleSpeed: 0.8,
        rotationSpeed: 0.3,
    },
    cyberpunkNeon: {
        ditherAlgorithm: "spiral" as const,
        backgroundColor: "#0d0221",
        foregroundColor: "#ff006e",
        ditherDensity: 55,
        spiralCount: 16,
        rippleSpeed: 2.5,
        rotationSpeed: 1.2,
    },
    vintageSepia: {
        ditherAlgorithm: "ordered" as const,
        backgroundColor: "#f4e8d0",
        foregroundColor: "#5c4033",
        ditherDensity: 60,
        spiralCount: 6,
        rippleSpeed: 0.5,
        rotationSpeed: 0.2,
    },
    oceanWaves: {
        ditherAlgorithm: "spiral" as const,
        backgroundColor: "#001f3f",
        foregroundColor: "#7fdbff",
        ditherDensity: 48,
        spiralCount: 10,
        rippleSpeed: 1.5,
        rotationSpeed: 0.7,
    },
    sunsetGradient: {
        ditherAlgorithm: "floydSteinberg" as const,
        backgroundColor: "#ff6b35",
        foregroundColor: "#f7931e",
        ditherDensity: 52,
        spiralCount: 8,
        rippleSpeed: 1.2,
        rotationSpeed: 0.4,
    },
    forestMist: {
        ditherAlgorithm: "ordered" as const,
        backgroundColor: "#1a3a2a",
        foregroundColor: "#90ee90",
        ditherDensity: 58,
        spiralCount: 14,
        rippleSpeed: 0.6,
        rotationSpeed: 0.3,
    },
    cosmicPurple: {
        ditherAlgorithm: "spiral" as const,
        backgroundColor: "#1a0033",
        foregroundColor: "#b19cd9",
        ditherDensity: 50,
        spiralCount: 20,
        rippleSpeed: 2.0,
        rotationSpeed: 1.5,
    },
    minimalistGray: {
        ditherAlgorithm: "floydSteinberg" as const,
        backgroundColor: "#f5f5f5",
        foregroundColor: "#333333",
        ditherDensity: 55,
        spiralCount: 8,
        rippleSpeed: 1,
        rotationSpeed: 0.5,
    },
    electricBlue: {
        ditherAlgorithm: "ordered" as const,
        backgroundColor: "#000428",
        foregroundColor: "#004e92",
        ditherDensity: 47,
        spiralCount: 15,
        rippleSpeed: 1.8,
        rotationSpeed: 0.9,
    },
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SpiralDither(props: SpiralDitherProps) {
    const {
        backgroundColor = "#000000",
        foregroundColor = "#FFFFFF",
        ditherAlgorithm = "spiral",
        spiralCount = 8,
        rippleSpeed = 1,
        ditherDensity = 50,
        rotationSpeed = 0.5,
        useCustomImage = false,
        customImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Default image",
        },
        usePreset = false,
        preset = "classicNewspaper",
    } = props

    // Apply preset values if usePreset is enabled
    const activeConfig = usePreset && presets[preset] ? presets[preset] : {
        ditherAlgorithm,
        backgroundColor,
        foregroundColor,
        ditherDensity,
        spiralCount,
        rippleSpeed,
        rotationSpeed,
    }

    // Use activeConfig for all relevant variables
    const {
        ditherAlgorithm: activeDitherAlgorithm,
        backgroundColor: activeBackgroundColor,
        foregroundColor: activeForegroundColor,
        ditherDensity: activeDitherDensity,
        spiralCount: activeSpiralCount,
        rippleSpeed: activeRippleSpeed,
        rotationSpeed: activeRotationSpeed,
    } = activeConfig

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>()
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 })
    const [isPaused, setIsPaused] = useState(false)
    const loadedImageRef = useRef<HTMLImageElement | null>(null)
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Load custom image
    useEffect(() => {
        if (!useCustomImage || !customImage.src) {
            loadedImageRef.current = null
            setImageError(false)
            setImageLoaded(false)
            return
        }

        const img = new Image()
        img.crossOrigin = "anonymous"
        
        img.onload = () => {
            loadedImageRef.current = img
            startTransition(() => {
                setImageLoaded(true)
                setImageError(false)
            })
        }
        
        img.onerror = () => {
            loadedImageRef.current = null
            startTransition(() => {
                setImageLoaded(false)
                setImageError(true)
            })
        }
        
        img.src = customImage.src

        return () => {
            img.onload = null
            img.onerror = null
        }
    }, [useCustomImage, customImage.src])

    // Handle responsive canvas sizing
    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                startTransition(() => {
                    setDimensions({
                        width: Math.floor(width),
                        height: Math.floor(height),
                    })
                })
            }
        })

        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    // Keyboard navigation handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            startTransition(() => {
                setIsPaused((prev) => !prev)
            })
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        const width = dimensions.width
        const height = dimensions.height
        const centerX = width / 2
        const centerY = height / 2
        let time = 0

        // Calculate pixel size based on screen size for consistent density
        const pixelSize = Math.max(1, Math.floor(Math.min(width, height) / 400))

        // Bayer matrix for ordered dithering (8x8)
        const bayerMatrix = [
            [0, 32, 8, 40, 2, 34, 10, 42],
            [48, 16, 56, 24, 50, 18, 58, 26],
            [12, 44, 4, 36, 14, 46, 6, 38],
            [60, 28, 52, 20, 62, 30, 54, 22],
            [3, 35, 11, 43, 1, 33, 9, 41],
            [51, 19, 59, 27, 49, 17, 57, 25],
            [15, 47, 7, 39, 13, 45, 5, 37],
            [63, 31, 55, 23, 61, 29, 53, 21],
        ]

        const drawFrame = () => {
            ctx.fillStyle = activeBackgroundColor
            ctx.fillRect(0, 0, width, height)

            // If using custom image, get image data first
            let imagePixelData: ImageData | null = null
            if (useCustomImage && loadedImageRef.current) {
                try {
                    // Draw image to canvas to get pixel data
                    ctx.drawImage(loadedImageRef.current, 0, 0, width, height)
                    imagePixelData = ctx.getImageData(0, 0, width, height)
                    // Clear canvas for dithering
                    ctx.fillStyle = activeBackgroundColor
                    ctx.fillRect(0, 0, width, height)
                } catch (e) {
                    console.error("Error loading image data:", e)
                }
            }

            if (activeDitherAlgorithm === "spiral") {
                // Original spiral dither algorithm
                const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)

                for (let y = 0; y < height; y += pixelSize) {
                    for (let x = 0; x < width; x += pixelSize) {
                        let pattern: number

                        if (useCustomImage && imagePixelData) {
                            // Get grayscale value from image
                            const idx = (y * width + x) * 4
                            const r = imagePixelData.data[idx]
                            const g = imagePixelData.data[idx + 1]
                            const b = imagePixelData.data[idx + 2]
                            const grayscale = (r * 0.299 + g * 0.587 + b * 0.114) / 255
                            pattern = grayscale
                        } else {
                            // Generate pattern
                            const dx = x - centerX
                            const dy = y - centerY
                            const distance = Math.sqrt(dx * dx + dy * dy)
                            const angle = Math.atan2(dy, dx)

                            const spiral = (angle + distance * 0.02 + time * activeRotationSpeed * 0.01) * activeSpiralCount
                            const ripple = Math.sin(distance * 0.05 - time * activeRippleSpeed * 0.1) * 0.5 + 0.5

                            pattern = (Math.sin(spiral) * 0.5 + 0.5) * ripple
                        }

                        const threshold = (Math.random() * activeDitherDensity) / 100

                        if (pattern > threshold) {
                            ctx.fillStyle = activeForegroundColor
                            ctx.fillRect(x, y, pixelSize, pixelSize)
                        }
                    }
                }
            } else if (activeDitherAlgorithm === "floydSteinberg") {
                // Floyd-Steinberg error diffusion dithering
                const imageData = ctx.createImageData(width, height)
                const data = imageData.data

                // Create grayscale gradient based on position and time
                const errorBuffer: number[][] = Array(height)
                    .fill(0)
                    .map(() => Array(width).fill(0))

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        let grayscale: number

                        if (useCustomImage && imagePixelData) {
                            // Get grayscale value from image
                            const idx = (y * width + x) * 4
                            const r = imagePixelData.data[idx]
                            const g = imagePixelData.data[idx + 1]
                            const b = imagePixelData.data[idx + 2]
                            grayscale = r * 0.299 + g * 0.587 + b * 0.114
                        } else {
                            // Generate pattern
                            const dx = x - centerX
                            const dy = y - centerY
                            const distance = Math.sqrt(dx * dx + dy * dy)
                            const angle = Math.atan2(dy, dx)

                            // Create animated pattern
                            const pattern =
                                (Math.sin(angle * activeSpiralCount + time * activeRotationSpeed * 0.05) * 0.5 + 0.5) *
                                (Math.sin(distance * 0.02 - time * activeRippleSpeed * 0.05) * 0.5 + 0.5)

                            grayscale = pattern * 255
                        }

                        grayscale = grayscale + errorBuffer[y][x]
                        const newPixel = grayscale < (activeDitherDensity / 100) * 255 ? 0 : 255
                        const error = grayscale - newPixel

                        // Distribute error to neighboring pixels
                        if (x + 1 < width) errorBuffer[y][x + 1] += (error * 7) / 16
                        if (y + 1 < height) {
                            if (x > 0) errorBuffer[y + 1][x - 1] += (error * 3) / 16
                            errorBuffer[y + 1][x] += (error * 5) / 16
                            if (x + 1 < width) errorBuffer[y + 1][x + 1] += (error * 1) / 16
                        }

                        const idx = (y * width + x) * 4
                        if (newPixel === 255) {
                            // Use foreground color
                            const fg = hexToRgb(activeForegroundColor)
                            data[idx] = fg.r
                            data[idx + 1] = fg.g
                            data[idx + 2] = fg.b
                            data[idx + 3] = 255
                        } else {
                            // Use background color
                            const bg = hexToRgb(activeBackgroundColor)
                            data[idx] = bg.r
                            data[idx + 1] = bg.g
                            data[idx + 2] = bg.b
                            data[idx + 3] = 255
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0)
            } else if (activeDitherAlgorithm === "ordered") {
                // Ordered (Bayer) dithering
                for (let y = 0; y < height; y += pixelSize) {
                    for (let x = 0; x < width; x += pixelSize) {
                        let pattern: number

                        if (useCustomImage && imagePixelData) {
                            // Get grayscale value from image
                            const idx = (y * width + x) * 4
                            const r = imagePixelData.data[idx]
                            const g = imagePixelData.data[idx + 1]
                            const b = imagePixelData.data[idx + 2]
                            const grayscale = (r * 0.299 + g * 0.587 + b * 0.114) / 255
                            pattern = grayscale
                        } else {
                            // Generate pattern
                            const dx = x - centerX
                            const dy = y - centerY
                            const distance = Math.sqrt(dx * dx + dy * dy)
                            const angle = Math.atan2(dy, dx)

                            // Create animated pattern
                            pattern =
                                (Math.sin(angle * activeSpiralCount + time * activeRotationSpeed * 0.05) * 0.5 + 0.5) *
                                (Math.sin(distance * 0.02 - time * activeRippleSpeed * 0.05) * 0.5 + 0.5)
                        }

                        const bayerX = Math.floor(x / pixelSize) % 8
                        const bayerY = Math.floor(y / pixelSize) % 8
                        const threshold = (bayerMatrix[bayerY][bayerX] / 64) * (activeDitherDensity / 100)

                        if (pattern > threshold) {
                            ctx.fillStyle = activeForegroundColor
                            ctx.fillRect(x, y, pixelSize, pixelSize)
                        }
                    }
                }
            }

            if (!isStatic && !isPaused && !useCustomImage) {
                time++
                animationRef.current = requestAnimationFrame(drawFrame)
            }
        }

        // Helper function to convert hex to RGB
        function hexToRgb(hex: string): { r: number; g: number; b: number } {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result
                ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16),
                  }
                : { r: 0, g: 0, b: 0 }
        }

        drawFrame()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [backgroundColor, foregroundColor, ditherAlgorithm, spiralCount, rippleSpeed, ditherDensity, rotationSpeed, isStatic, dimensions, isPaused, useCustomImage, imageLoaded])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
            role="img"
            aria-label={`${useCustomImage ? "Custom image with " : "Animated "}${ditherAlgorithm} dither pattern${!useCustomImage ? ` with ${spiralCount} spirals` : ""}. Press space or enter to pause or resume animation.`}
            aria-live="polite"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                aria-hidden="true"
            />
            {imageError && useCustomImage && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: foregroundColor,
                        fontSize: "14px",
                        textAlign: "center",
                        padding: "20px",
                    }}
                >
                    Failed to load image
                </div>
            )}
        </div>
    )
}

addPropertyControls(SpiralDither, {
    usePreset: {
        type: ControlType.Boolean,
        title: "Use Preset",
        defaultValue: false,
        enabledTitle: "Preset",
        disabledTitle: "Custom",
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset Style",
        options: Object.keys(presets),
        optionTitles: [
            "Classic Newspaper",
            "Retro CRT",
            "Cyberpunk Neon",
            "Vintage Sepia",
            "Ocean Waves",
            "Sunset Gradient",
            "Forest Mist",
            "Cosmic Purple",
            "Minimalist Gray",
            "Electric Blue",
        ],
        defaultValue: "classicNewspaper",
        displaySegmentedControl: false,
        hidden: ({ usePreset }) => !usePreset,
    },
    useCustomImage: {
        type: ControlType.Boolean,
        title: "Use Custom Image",
        defaultValue: false,
        enabledTitle: "Image",
        disabledTitle: "Pattern",
    },
    customImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: ({ useCustomImage }) => !useCustomImage,
    },
    ditherAlgorithm: {
        type: ControlType.Enum,
        title: "Algorithm",
        options: ["spiral", "floydSteinberg", "ordered"],
        optionTitles: ["Spiral", "Floyd-Steinberg", "Ordered (Bayer)"],
        defaultValue: "spiral",
        displaySegmentedControl: false,
        hidden: ({ usePreset }) => usePreset,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: ({ usePreset }) => usePreset,
    },
    foregroundColor: {
        type: ControlType.Color,
        title: "Foreground",
        defaultValue: "#FFFFFF",
        hidden: ({ usePreset }) => usePreset,
    },
    spiralCount: {
        type: ControlType.Number,
        title: "Spiral Count",
        defaultValue: 8,
        min: 1,
        max: 20,
        step: 1,
        hidden: ({ useCustomImage, usePreset }) => useCustomImage || usePreset,
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Ripple Speed",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: ({ useCustomImage, usePreset }) => useCustomImage || usePreset,
    },
    ditherDensity: {
        type: ControlType.Number,
        title: "Dither Density",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ usePreset }) => usePreset,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.1,
        hidden: ({ useCustomImage, usePreset }) => useCustomImage || usePreset,
    },
})