import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// SparklesCore Component (inlined)
interface SparklesCoreProps {
    id?: string
    className?: string
    background?: string
    minSize?: number
    maxSize?: number
    speed?: number
    particleColor?: string
    particleColor2?: string
    particleColor3?: string
    particleDensity?: number
    particleShape?: "circle" | "star" | "square" | "diamond" | "heart"
    enableTrail?: boolean
    enableTwinkle?: boolean
}

const SparklesCore: React.FC<SparklesCoreProps> = ({
    id = "sparkles",
    className = "",
    background = "transparent",
    minSize = 0.4,
    maxSize = 1,
    speed = 1,
    particleColor = "#FFFFFF",
    particleColor2 = "#FFFFFF",
    particleColor3 = "#FFFFFF",
    particleDensity = 100,
    particleShape = "circle",
    enableTrail = false,
    enableTwinkle = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [canvasSize, setCanvasSize] = useState({ w: 100, h: 100 })
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!canvasContainerRef.current) return

        const updateCanvasSize = () => {
            if (canvasContainerRef.current) {
                const { offsetWidth, offsetHeight } = canvasContainerRef.current
                setCanvasSize({ w: offsetWidth, h: offsetHeight })
            }
        }

        // Initial size
        updateCanvasSize()

        // Observe container size changes
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize()
        })

        resizeObserver.observe(canvasContainerRef.current)

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const particles: Particle[] = []
        const colors = [particleColor, particleColor2, particleColor3]
        let animationFrameId: number = 0

        class Particle {
            x: number
            y: number
            size: number
            speedX: number
            speedY: number
            opacity: number
            color: string
            twinklePhase: number
            twinkleSpeed: number

            constructor() {
                this.x = Math.random() * canvasSize.w
                this.y = Math.random() * canvasSize.h
                this.size = Math.random() * (maxSize - minSize) + minSize
                this.speedX = (Math.random() - 0.5) * speed * 0.5
                this.speedY = Math.random() * speed * 0.5 + 0.5
                this.opacity = Math.random()
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.twinklePhase = Math.random() * Math.PI * 2
                this.twinkleSpeed = 0.02 + Math.random() * 0.03
            }

            update() {
                this.y += this.speedY
                this.x += this.speedX

                // Twinkle effect
                if (enableTwinkle) {
                    this.twinklePhase += this.twinkleSpeed
                    this.opacity =
                        0.3 + Math.abs(Math.sin(this.twinklePhase)) * 0.7
                } else {
                    // Fade in/out effect
                    this.opacity += (Math.random() - 0.5) * 0.05
                    this.opacity = Math.max(0, Math.min(1, this.opacity))
                }

                // Reset particle when it goes off screen
                if (this.y > canvasSize.h) {
                    this.y = 0
                    this.x = Math.random() * canvasSize.w
                }
                if (this.x > canvasSize.w) {
                    this.x = 0
                } else if (this.x < 0) {
                    this.x = canvasSize.w
                }
            }

            drawStar(
                x: number,
                y: number,
                spikes: number,
                outerRadius: number,
                innerRadius: number
            ) {
                if (!ctx) return
                let rot = (Math.PI / 2) * 3
                let step = Math.PI / spikes

                ctx.beginPath()
                ctx.moveTo(x, y - outerRadius)
                for (let i = 0; i < spikes; i++) {
                    ctx.lineTo(
                        x + Math.cos(rot) * outerRadius,
                        y + Math.sin(rot) * outerRadius
                    )
                    rot += step
                    ctx.lineTo(
                        x + Math.cos(rot) * innerRadius,
                        y + Math.sin(rot) * innerRadius
                    )
                    rot += step
                }
                ctx.lineTo(x, y - outerRadius)
                ctx.closePath()
                ctx.fill()
            }

            drawDiamond(x: number, y: number, size: number) {
                if (!ctx) return
                ctx.beginPath()
                ctx.moveTo(x, y - size)
                ctx.lineTo(x + size, y)
                ctx.lineTo(x, y + size)
                ctx.lineTo(x - size, y)
                ctx.closePath()
                ctx.fill()
            }

            drawHeart(x: number, y: number, size: number) {
                if (!ctx) return
                ctx.beginPath()
                ctx.moveTo(x, y + size / 4)
                ctx.bezierCurveTo(
                    x,
                    y,
                    x - size / 2,
                    y - size / 2,
                    x - size / 2,
                    y
                )
                ctx.bezierCurveTo(
                    x - size / 2,
                    y + size / 4,
                    x,
                    y + size / 2,
                    x,
                    y + size
                )
                ctx.bezierCurveTo(
                    x,
                    y + size / 2,
                    x + size / 2,
                    y + size / 4,
                    x + size / 2,
                    y
                )
                ctx.bezierCurveTo(
                    x + size / 2,
                    y - size / 2,
                    x,
                    y,
                    x,
                    y + size / 4
                )
                ctx.closePath()
                ctx.fill()
            }

            draw() {
                if (!ctx) return

                ctx.fillStyle = this.color
                ctx.globalAlpha = this.opacity

                // Draw based on shape
                switch (particleShape) {
                    case "circle":
                        ctx.beginPath()
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                        ctx.fill()
                        break
                    case "star":
                        this.drawStar(
                            this.x,
                            this.y,
                            5,
                            this.size,
                            this.size * 0.5
                        )
                        break
                    case "square":
                        ctx.fillRect(
                            this.x - this.size,
                            this.y - this.size,
                            this.size * 2,
                            this.size * 2
                        )
                        break
                    case "diamond":
                        this.drawDiamond(this.x, this.y, this.size)
                        break
                    case "heart":
                        this.drawHeart(this.x, this.y, this.size)
                        break
                }
            }
        }

        const init = () => {
            const particleCount = Math.floor(
                ((canvasSize.w * canvasSize.h) / 10000) *
                    (particleDensity / 100)
            )
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle())
            }
        }

        const animate = () => {
            if (!ctx) return

            // Trail effect - fade instead of clear
            if (enableTrail) {
                // Parse the background color and create a semi-transparent version
                // Using 0.05 alpha for more visible trails
                let bgColor: string
                if (background === "transparent") {
                    bgColor = "rgba(0, 0, 0, 0.05)"
                } else if (background.startsWith("#")) {
                    bgColor = hexToRgba(background, 0.05)
                } else if (background.startsWith("rgb(")) {
                    // Convert rgb() to rgba()
                    bgColor = background
                        .replace("rgb(", "rgba(")
                        .replace(")", ", 0.05)")
                } else if (background.startsWith("rgba(")) {
                    // Replace existing alpha with 0.05
                    bgColor = background.replace(/[\d.]+\)$/, "0.05)")
                } else {
                    bgColor = "rgba(0, 0, 0, 0.05)"
                }
                ctx.fillStyle = bgColor
                ctx.fillRect(0, 0, canvasSize.w, canvasSize.h)
            } else {
                ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)
            }

            particles.forEach((particle) => {
                particle.update()
                particle.draw()
            })
            animationFrameId = requestAnimationFrame(animate)
        }

        // Helper function to convert hex to rgba
        function hexToRgba(hex: string, alpha: number) {
            // Remove # if present
            hex = hex.replace("#", "")

            // Handle 3-character hex codes
            if (hex.length === 3) {
                hex = hex
                    .split("")
                    .map((char) => char + char)
                    .join("")
            }

            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        if (canvasSize.w > 0 && canvasSize.h > 0) {
            // Clear and initialize canvas with background
            ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)
            if (background !== "transparent") {
                ctx.fillStyle = background
                ctx.fillRect(0, 0, canvasSize.w, canvasSize.h)
            }
            init()
            animate()
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
            particles.length = 0
            // Clear canvas on cleanup
            ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)
        }
    }, [
        canvasSize,
        minSize,
        maxSize,
        speed,
        particleColor,
        particleColor2,
        particleColor3,
        particleDensity,
        particleShape,
        enableTrail,
        enableTwinkle,
        background,
    ])

    return (
        <div
            ref={canvasContainerRef}
            className={className}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
            }}
        >
            <canvas
                ref={canvasRef}
                id={id}
                width={canvasSize.w}
                height={canvasSize.h}
                style={{
                    display: "block",
                    background: "transparent",
                }}
            />
        </div>
    )
}

// Main Framer Component
export default function SparklesPreview(props: any) {
    const {
        background = "#000000",
        particleColor = "#FFFFFF",
        particleColor2 = "#FFFFFF",
        particleColor3 = "#FFFFFF",
        particleDensity = 1200,
        minSize = 0.4,
        maxSize = 1,
        speed = 1,
        showControls = false,
        particleShape = "circle",
        enableTrail = false,
        enableTwinkle = false,
    } = props

    const [density, setDensity] = useState(particleDensity)
    const [minParticleSize, setMinParticleSize] = useState(minSize)
    const [maxParticleSize, setMaxParticleSize] = useState(maxSize)
    const [particleSpeed, setParticleSpeed] = useState(speed)
    const [shape, setShape] = useState(particleShape)
    const [trail, setTrail] = useState(enableTrail)
    const [twinkle, setTwinkle] = useState(enableTwinkle)

    // Update state when props change
    useEffect(() => {
        setDensity(particleDensity)
    }, [particleDensity])

    useEffect(() => {
        setMinParticleSize(minSize)
    }, [minSize])

    useEffect(() => {
        setMaxParticleSize(maxSize)
    }, [maxSize])

    useEffect(() => {
        setParticleSpeed(speed)
    }, [speed])

    useEffect(() => {
        setShape(particleShape)
    }, [particleShape])

    useEffect(() => {
        setTrail(enableTrail)
    }, [enableTrail])

    useEffect(() => {
        setTwinkle(enableTwinkle)
    }, [enableTwinkle])

    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                backgroundColor: background,
                overflow: "hidden",
                borderRadius: "0.375rem",
                position: "relative",
            }}
        >
            <SparklesCore
                id="tsparticlesfullpage"
                background={background}
                minSize={minParticleSize}
                maxSize={maxParticleSize}
                particleDensity={density}
                className="w-full h-full"
                particleColor={particleColor}
                particleColor2={particleColor2}
                particleColor3={particleColor3}
                speed={particleSpeed}
                particleShape={shape}
                enableTrail={trail}
                enableTwinkle={twinkle}
            />

            {/* Interactive Controls Overlay */}
            {showControls && (
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        right: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(10px)",
                        padding: "12px",
                        borderRadius: "8px",
                        zIndex: 100,
                        maxWidth: "280px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#fff",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Particle Controls
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "9px",
                                color: "rgba(255, 255, 255, 0.5)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                fontStyle: "italic",
                            }}
                        >
                            Can be hidden
                        </p>
                    </div>

                    {/* Particle Density */}
                    <div style={{ marginBottom: "10px" }}>
                        <label
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            <span>Density</span>
                            <span style={{ color: "#fff", fontWeight: "500" }}>
                                {Math.round(density)}
                            </span>
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="5000"
                            step="100"
                            value={density}
                            onChange={(e) => setDensity(Number(e.target.value))}
                            style={{
                                width: "100%",
                                height: "4px",
                                borderRadius: "2px",
                                outline: "none",
                                appearance: "none",
                                background: `linear-gradient(to right, ${particleColor} 0%, ${particleColor} ${
                                    ((density - 100) / 4900) * 100
                                }%, rgba(255, 255, 255, 0.2) ${
                                    ((density - 100) / 4900) * 100
                                }%, rgba(255, 255, 255, 0.2) 100%)`,
                                cursor: "pointer",
                            }}
                        />
                    </div>

                    {/* Min Size */}
                    <div style={{ marginBottom: "10px" }}>
                        <label
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            <span>Min Size</span>
                            <span style={{ color: "#fff", fontWeight: "500" }}>
                                {minParticleSize.toFixed(1)}
                            </span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={minParticleSize}
                            onChange={(e) =>
                                setMinParticleSize(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                height: "4px",
                                borderRadius: "2px",
                                outline: "none",
                                appearance: "none",
                                background: `linear-gradient(to right, ${particleColor} 0%, ${particleColor} ${
                                    ((minParticleSize - 0.1) / 4.9) * 100
                                }%, rgba(255, 255, 255, 0.2) ${
                                    ((minParticleSize - 0.1) / 4.9) * 100
                                }%, rgba(255, 255, 255, 0.2) 100%)`,
                                cursor: "pointer",
                            }}
                        />
                    </div>

                    {/* Max Size */}
                    <div style={{ marginBottom: "10px" }}>
                        <label
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            <span>Max Size</span>
                            <span style={{ color: "#fff", fontWeight: "500" }}>
                                {maxParticleSize.toFixed(1)}
                            </span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={maxParticleSize}
                            onChange={(e) =>
                                setMaxParticleSize(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                height: "4px",
                                borderRadius: "2px",
                                outline: "none",
                                appearance: "none",
                                background: `linear-gradient(to right, ${particleColor} 0%, ${particleColor} ${
                                    ((maxParticleSize - 0.1) / 9.9) * 100
                                }%, rgba(255, 255, 255, 0.2) ${
                                    ((maxParticleSize - 0.1) / 9.9) * 100
                                }%, rgba(255, 255, 255, 0.2) 100%)`,
                                cursor: "pointer",
                            }}
                        />
                    </div>

                    {/* Speed */}
                    <div style={{ marginBottom: "10px" }}>
                        <label
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            <span>Speed</span>
                            <span style={{ color: "#fff", fontWeight: "500" }}>
                                {particleSpeed.toFixed(1)}
                            </span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={particleSpeed}
                            onChange={(e) =>
                                setParticleSpeed(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                height: "4px",
                                borderRadius: "2px",
                                outline: "none",
                                appearance: "none",
                                background: `linear-gradient(to right, ${particleColor} 0%, ${particleColor} ${
                                    ((particleSpeed - 0.1) / 4.9) * 100
                                }%, rgba(255, 255, 255, 0.2) ${
                                    ((particleSpeed - 0.1) / 4.9) * 100
                                }%, rgba(255, 255, 255, 0.2) 100%)`,
                                cursor: "pointer",
                            }}
                        />
                    </div>

                    {/* Particle Shape */}
                    <div style={{ marginBottom: "10px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "4px",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Shape
                        </label>
                        <select
                            value={shape}
                            onChange={(e) => setShape(e.target.value as any)}
                            style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "4px",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                color: "#fff",
                                fontSize: "11px",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            <option
                                value="circle"
                                style={{ backgroundColor: "#000" }}
                            >
                                Circle
                            </option>
                            <option
                                value="star"
                                style={{ backgroundColor: "#000" }}
                            >
                                Star
                            </option>
                            <option
                                value="square"
                                style={{ backgroundColor: "#000" }}
                            >
                                Square
                            </option>
                            <option
                                value="diamond"
                                style={{ backgroundColor: "#000" }}
                            >
                                Diamond
                            </option>
                            <option
                                value="heart"
                                style={{ backgroundColor: "#000" }}
                            >
                                Heart
                            </option>
                        </select>
                    </div>

                    {/* Trail Effect */}
                    <div style={{ marginBottom: "8px" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                cursor: "pointer",
                            }}
                        >
                            <span>Trail Effect</span>
                            <input
                                type="checkbox"
                                checked={trail}
                                onChange={(e) => setTrail(e.target.checked)}
                                style={{
                                    width: "14px",
                                    height: "14px",
                                    cursor: "pointer",
                                    accentColor: particleColor,
                                }}
                            />
                        </label>
                    </div>

                    {/* Twinkle Effect */}
                    <div style={{ marginBottom: "0" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                cursor: "pointer",
                            }}
                        >
                            <span>Twinkle Effect</span>
                            <input
                                type="checkbox"
                                checked={twinkle}
                                onChange={(e) => setTwinkle(e.target.checked)}
                                style={{
                                    width: "14px",
                                    height: "14px",
                                    cursor: "pointer",
                                    accentColor: particleColor,
                                }}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Custom slider styles */}
            <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${particleColor};
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${particleColor};
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.2);
        }
      `}</style>
        </div>
    )
}

// Framer Property Controls
addPropertyControls(SparklesPreview, {
    showControls: {
        type: ControlType.Boolean,
        title: "Show Controls",
        defaultValue: false,
        description: "Display interactive sliders in the preview",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    particleShape: {
        type: ControlType.Enum,
        title: "Particle Shape",
        options: ["circle", "star", "square", "diamond", "heart"],
        optionTitles: ["Circle", "Star", "Square", "Diamond", "Heart"],
        defaultValue: "circle",
    },
    particleColor: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#FFFFFF",
    },
    particleColor2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#FFFFFF",
    },
    particleColor3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#FFFFFF",
    },
    particleDensity: {
        type: ControlType.Number,
        title: "Particle Density",
        min: 100,
        max: 5000,
        step: 100,
        defaultValue: 1200,
    },
    minSize: {
        type: ControlType.Number,
        title: "Min Particle Size",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.4,
    },
    maxSize: {
        type: ControlType.Number,
        title: "Max Particle Size",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 1,
    },
    speed: {
        type: ControlType.Number,
        title: "Particle Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
    },
    enableTrail: {
        type: ControlType.Boolean,
        title: "Trail Effect",
        defaultValue: false,
    },
    enableTwinkle: {
        type: ControlType.Boolean,
        title: "Twinkle Effect",
        defaultValue: false,
    },
})
