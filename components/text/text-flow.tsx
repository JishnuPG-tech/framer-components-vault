// Animated particles text component where particles are pushed around by the mouse pointer

import {
    useEffect,
    useRef,
    useState,
    startTransition,
    useMemo,
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


interface Particle {
    x: number
    y: number
    baseX: number
    baseY: number
    vx: number
    vy: number
}

interface ParticleTextProps {
    text: string
    particleColor: string
    backgroundColor: string
    particleSize: number
    particleDensity: number
    mouseRadius: number
    returnSpeed: number
    font: CSSProperties
    verticalAlign: "top" | "center" | "bottom"
    horizontalAlign: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TextFlow(props: ParticleTextProps) {
    const {
        text = "Pola",
        particleColor = "#FFFFFF",
        backgroundColor = "#000000",
        particleSize = 2,
        particleDensity = 3,
        mouseRadius = 100,
        returnSpeed = 0.05,
        font,
        verticalAlign = "center",
        horizontalAlign = "center",
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const animationFrameRef = useRef<number>()
    const isStatic = useIsStaticRenderer()
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize particles
    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        // Use a timeout to prevent blocking
        const timeoutId = setTimeout(() => {
            const dpr =
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
            const rect = canvas.getBoundingClientRect()

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)

            const width = rect.width
            const height = rect.height

            // Draw text to get particle positions
            ctx.fillStyle = particleColor

            // Set horizontal alignment
            if (horizontalAlign === "left") {
                ctx.textAlign = "left"
            } else if (horizontalAlign === "right") {
                ctx.textAlign = "right"
            } else {
                ctx.textAlign = "center"
            }

            // Set vertical baseline
            ctx.textBaseline = "middle"

            const fontSize = parseInt(font.fontSize as string) || 80
            const fontWeight = font.fontWeight || "400"
            const fontStyle = font.fontStyle || "normal"
            const fontFamily = font.fontFamily || "Inter, sans-serif"
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

            // Add padding to prevent text cutoff
            const padding = fontSize * 0.3

            // Calculate maximum text width based on container size
            const maxTextWidth = width - padding * 2

            // Function to wrap text to fit within container width
            const wrapText = (inputText: string): string[] => {
                const inputLines = inputText.split("\n")
                const wrappedLines: string[] = []

                for (const line of inputLines) {
                    // If line is empty or fits, keep it as is
                    if (!line.trim()) {
                        wrappedLines.push("")
                        continue
                    }

                    // Check if line fits in container
                    const metrics = ctx.measureText(line)
                    if (metrics.width <= maxTextWidth) {
                        wrappedLines.push(line)
                        continue
                    }

                    // Split line into words
                    const words = line.split(" ")
                    let currentLine = ""

                    for (const word of words) {
                        const testLine = currentLine
                            ? `${currentLine} ${word}`
                            : word
                        const testMetrics = ctx.measureText(testLine)

                        if (testMetrics.width <= maxTextWidth) {
                            currentLine = testLine
                        } else {
                            if (currentLine) {
                                wrappedLines.push(currentLine)
                                currentLine = word
                            } else {
                                // Single word too long, add it anyway
                                wrappedLines.push(word)
                            }
                        }
                    }

                    if (currentLine) {
                        wrappedLines.push(currentLine)
                    }
                }

                return wrappedLines
            }

            const lines = wrapText(text)
            const lineHeight = fontSize * 1.2
            const totalHeight = lines.length * lineHeight

            // Calculate vertical position
            let startY: number
            if (verticalAlign === "top") {
                startY = lineHeight / 2 + padding
            } else if (verticalAlign === "bottom") {
                startY = height - totalHeight + lineHeight / 2 - padding
            } else {
                startY = (height - totalHeight) / 2 + lineHeight / 2
            }

            // Calculate horizontal position
            let textX: number
            if (horizontalAlign === "left") {
                textX = padding
            } else if (horizontalAlign === "right") {
                textX = width - padding
            } else {
                textX = width / 2
            }

            lines.forEach((line, index) => {
                ctx.fillText(line, textX, startY + index * lineHeight)
            })

            // Get pixel data
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            )
            const pixels = imageData.data

            // Create particles from text pixels
            const particles: Particle[] = []
            const gap = Math.max(2, particleDensity)

            for (let y = 0; y < canvas.height; y += gap) {
                for (let x = 0; x < canvas.width; x += gap) {
                    const index = (y * canvas.width + x) * 4
                    const alpha = pixels[index + 3]

                    if (alpha > 128) {
                        const px = x / dpr
                        const py = y / dpr
                        particles.push({
                            x: px,
                            y: py,
                            baseX: px,
                            baseY: py,
                            vx: 0,
                            vy: 0,
                        })
                    }
                }
            }

            particlesRef.current = particles
            startTransition(() => setIsInitialized(true))
        }, 0)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [
        text,
        particleColor,
        particleDensity,
        font,
        isStatic,
        horizontalAlign,
        verticalAlign,
    ])

    // Animation loop
    useEffect(() => {
        if (isStatic || !isInitialized) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            const mouse = mouseRef.current
            const particles = particlesRef.current

            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i]
                const dx = mouse.x - particle.x
                const dy = mouse.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                // Push particles away from mouse
                if (distance < mouseRadius) {
                    const force = (mouseRadius - distance) / mouseRadius
                    const angle = Math.atan2(dy, dx)
                    particle.vx -= Math.cos(angle) * force * 2
                    particle.vy -= Math.sin(angle) * force * 2
                }

                // Return to base position
                particle.vx += (particle.baseX - particle.x) * returnSpeed
                particle.vy += (particle.baseY - particle.y) * returnSpeed

                // Apply velocity with damping
                particle.vx *= 0.95
                particle.vy *= 0.95

                particle.x += particle.vx
                particle.y += particle.vy

                // Draw particle
                ctx.fillStyle = particleColor
                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2)
                ctx.fill()
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        isInitialized,
        particleColor,
        particleSize,
        mouseRadius,
        returnSpeed,
        isStatic,
    ])

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
    }

    const handleMouseLeave = () => {
        mouseRef.current = { x: -1000, y: -1000 }
    }

    // Static preview
    if (isStatic) {
        // Map alignment values to CSS
        const alignItems =
            verticalAlign === "top"
                ? "flex-start"
                : verticalAlign === "bottom"
                  ? "flex-end"
                  : "center"
        const justifyContent =
            horizontalAlign === "left"
                ? "flex-start"
                : horizontalAlign === "right"
                  ? "flex-end"
                  : "center"
        const textAlign = horizontalAlign

        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems,
                    justifyContent,
                    color: particleColor,
                    textAlign,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    hyphens: "auto",
                    padding: "16px",
                    boxSizing: "border-box",
                    ...font,
                }}
            >
                {text}
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                backgroundColor,
                cursor: "default",
            }}
        />
    )
}

addPropertyControls(TextFlow, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Pola",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "80px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    horizontalAlign: {
        type: ControlType.Enum,
        title: "Horizontal",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    particleColor: {
        type: ControlType.Color,
        title: "Particle Color",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    particleDensity: {
        type: ControlType.Number,
        title: "Density",
        description: "Lower values create more particles (denser text)",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    mouseRadius: {
        type: ControlType.Number,
        title: "Mouse Radius",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        defaultValue: 0.05,
        min: 0.01,
        max: 0.2,
        step: 0.01,
    },
})
