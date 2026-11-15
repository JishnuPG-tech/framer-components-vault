// Text scratch effect that works like a scratch card
import {
    useEffect,
    useRef,
    useState,
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


interface ScratchRevealProps {
    text: {
        revealType: "text" | "image"
        content: string
        revealFont: CSSProperties
        textColor: string
        revealImage: {
            src: string
            alt?: string
        }
    }
    backgroundColor: string
    cover: {
        coverType: "solid" | "gradient" | "pattern" | "image"
        scratchColor: string
        gradientStart: string
        gradientEnd: string
        gradientAngle: number
        patternType: "dots" | "lines" | "grid" | "waves"
        patternColor: string
        patternBackground: string
        patternSize: number
        coverImage: {
            src: string
            alt?: string
        }
        coverTexture:
            | "none"
            | "noise"
            | "grain"
            | "fabric"
            | "paper"
            | "scratch"
            | "metallic"
            | "emboss"
        showText: boolean
        coverText: string
        coverFont: CSSProperties
        coverTextColor: string
        particles: {
            enabled: boolean
            size: number
            life: number
            duration: number
            fallType: "gravity" | "float" | "spiral" | "drift" | "bounce"
            speed: number
        }
    }
    brush: {
        size: number
        shape:
            | "default"
            | "circle"
            | "square"
            | "star"
            | "heart"
            | "image"
            | "disintegrate"
        texture: "smooth" | "grainy" | "speckled" | "dotted" | "crosshatch"
        image: {
            src: string
            alt?: string
        }
        shadow: {
            enabled: boolean
            color: string
            blur: number
            offsetX: number
            offsetY: number
        }
    }
    revealPercentage: number
    autoReveal: boolean
    scratchEffect:
        | "scratch"
        | "peel"
        | "dissolve"
        | "pixelate"
        | "shatter"
        | "disintegrate"
        | "particle"
    dissolve: {
        particleCount: number
        particleSize: number
        disintegrationType:
            | "gravity"
            | "explode"
            | "float"
            | "spiral"
            | "drift"
            | "bounce"
        animationSpeed: number
        life: number
    }
    revealAnimation: {
        easing:
            | "linear"
            | "ease"
            | "ease-in"
            | "ease-out"
            | "ease-in-out"
            | "ease-in-back"
            | "ease-out-back"
            | "ease-in-out-back"
            | "ease-in-elastic"
            | "ease-out-elastic"
            | "ease-in-out-elastic"
            | "ease-in-bounce"
            | "ease-out-bounce"
        duration: number
    }
    borderRadius: number
    style?: CSSProperties
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    life: number
    maxLife: number
    color: string
    active: boolean
}

interface CoverParticle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    alpha: number
    life: number
    maxLife: number
}



/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScratchReveal(props: ScratchRevealProps) {
    const {
        text = {
            revealType: "text",
            content:
                "You've successful revealed this text, now try revealing an image and have fun",
            revealFont: {
                fontSize: "24px",
                fontFamily: "sans-serif",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                lineHeight: "1.5em",
            },
            textColor: "#000000",
            revealImage: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Reveal image",
            },
        },
        backgroundColor = "#FFFFFF",
        cover = {
            coverType: "solid",
            scratchColor: "#CCCCCC",
            gradientStart: "#CCCCCC",
            gradientEnd: "#999999",
            gradientAngle: 45,
            patternType: "dots",
            patternColor: "#999999",
            patternBackground: "#CCCCCC",
            patternSize: 20,
            coverImage: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Cover image",
            },
            coverTexture: "none",
            coverText: "",
            coverFont: {
                fontSize: "24px",
                fontFamily: "sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            coverTextColor: "#FFFFFF",
            particles: {
                enabled: true,
                size: 3,
                life: 60,
                duration: 2,
                fallType: "gravity",
                speed: 1,
            },
            showText: true,
        },
        brush = {
            size: 30,
            shape: "default",
            texture: "smooth",
            image: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Brush image",
            },
        },
        revealPercentage = 70,
        autoReveal = true,
        scratchEffect = "scratch",
        dissolve = {
            particleCount: 20,
            particleSize: 4,
            disintegrationType: "gravity",
            animationSpeed: 1,
            life: 60,
        },
        revealAnimation = {
            easing: "ease-out",
            duration: 1.2,
        },
        borderRadius = 0,
    } = props

    const {
        particleCount,
        particleSize,
        disintegrationType,
        animationSpeed,
        life: particleLife,
    } = dissolve
    const {
        revealType,
        content,
        revealFont,
        textColor,
        revealImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Reveal image",
        },
    } = text
    const {
        coverType,
        scratchColor,
        gradientStart,
        gradientEnd,
        gradientAngle,
        patternType,
        patternColor,
        patternBackground,
        patternSize,
        coverImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Cover image",
        },
        coverTexture = "noise",
        coverText = "Scratch",
        coverFont = {
            fontSize: "24px",
            fontFamily: "sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        coverTextColor = "#FFFFFF",
        particles: coverParticlesConfig = {
            enabled: true,
            size: 3,
            life: 60,
            duration: 2,
            fallType: "gravity",
            speed: 1,
        },
    } = cover
    const showText = cover.showText !== undefined ? cover.showText : true
    const {
        size: brushSize,
        shape: brushShape,
        texture: brushTexture,
        image: brushImage,
    } = brush
    const brushShadow =
        "shadow" in brush
            ? brush.shadow
            : {
                  enabled: true,
                  color: "#000000",
                  blur: 5,
                  offsetX: 2,
                  offsetY: 2,
              }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particleCanvasRef = useRef<HTMLCanvasElement>(null)
    const coverTextCanvasRef = useRef<HTMLCanvasElement>(null)
    const coverParticleCanvasRef = useRef<HTMLCanvasElement>(null)
    const [isScratching, setIsScratching] = useState(false)
    const [isRevealed, setIsRevealed] = useState(false)
    const [revealOpacity, setRevealOpacity] = useState(0)
    const scratchedPixelsRef = useRef(0)
    const totalPixelsRef = useRef(0)
    const particleTimeRef = useRef(0)
    const particlesRef = useRef<Particle[]>([])
    const coverParticlesRef = useRef<CoverParticle[]>([])
    const animationFrameRef = useRef<number>()
    const coverParticleAnimationRef = useRef<number>()
    const textEndPositionRef = useRef<{ x: number; y: number } | null>(null)
    const hasScratched = useRef(false)
    const isStatic = useIsStaticRenderer()
    const [isInView, setIsInView] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)

    const particlePoolRef = useRef<Particle[]>([])

    // Add IntersectionObserver to detect viewport visibility
    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    startTransition(() => setIsInView(entry.isIntersecting))
                })
            },
            {
                threshold: 0,
                rootMargin: "50px",
            }
        )

        observer.observe(container)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    useEffect(() => {
        if (typeof window === "undefined") return
        
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size to match container
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height

        // Draw cover based on type
        switch (coverType) {
            case "solid":
                ctx.fillStyle = scratchColor
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                break

            case "gradient":
                const angleRad = (gradientAngle * Math.PI) / 180
                const x1 =
                    canvas.width / 2 - (Math.cos(angleRad) * canvas.width) / 2
                const y1 =
                    canvas.height / 2 - (Math.sin(angleRad) * canvas.height) / 2
                const x2 =
                    canvas.width / 2 + (Math.cos(angleRad) * canvas.width) / 2
                const y2 =
                    canvas.height / 2 + (Math.sin(angleRad) * canvas.height) / 2
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
                gradient.addColorStop(0, gradientStart)
                gradient.addColorStop(1, gradientEnd)
                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                break

            case "pattern":
                // Fill background
                ctx.fillStyle = patternBackground
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // Draw pattern
                ctx.fillStyle = patternColor
                ctx.strokeStyle = patternColor
                ctx.lineWidth = 2

                switch (patternType) {
                    case "dots":
                        const dotSpacing = patternSize
                        const dotRadius = patternSize * 0.15
                        for (let x = 0; x < canvas.width; x += dotSpacing) {
                            for (
                                let y = 0;
                                y < canvas.height;
                                y += dotSpacing
                            ) {
                                ctx.beginPath()
                                ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
                                ctx.fill()
                            }
                        }
                        break

                    case "lines":
                        const lineSpacing = patternSize * 0.75
                        for (let x = 0; x < canvas.width; x += lineSpacing) {
                            ctx.beginPath()
                            ctx.moveTo(x, 0)
                            ctx.lineTo(x, canvas.height)
                            ctx.stroke()
                        }
                        break

                    case "grid":
                        const gridSpacing = patternSize
                        for (let x = 0; x < canvas.width; x += gridSpacing) {
                            ctx.beginPath()
                            ctx.moveTo(x, 0)
                            ctx.lineTo(x, canvas.height)
                            ctx.stroke()
                        }
                        for (let y = 0; y < canvas.height; y += gridSpacing) {
                            ctx.beginPath()
                            ctx.moveTo(0, y)
                            ctx.lineTo(canvas.width, y)
                            ctx.stroke()
                        }
                        break

                    case "waves":
                        const waveSpacing = patternSize
                        const amplitude = patternSize * 0.5
                        const frequency = 0.05 * (20 / patternSize)
                        for (let y = 0; y < canvas.height; y += waveSpacing) {
                            ctx.beginPath()
                            ctx.moveTo(0, y)
                            for (let x = 0; x < canvas.width; x++) {
                                const waveY =
                                    y + Math.sin(x * frequency) * amplitude
                                ctx.lineTo(x, waveY)
                            }
                            ctx.stroke()
                        }
                        break
                }
                break

            case "image":
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    // Apply texture after image loads
                    applyTexture(ctx, canvas.width, canvas.height)
                    // Draw cover text after texture
                    if (coverText && showText) {
                        drawCoverText(ctx, canvas.width, canvas.height)
                    }
                }
                img.onerror = () => {
                    // Fallback to solid color if image fails to load
                    ctx.fillStyle = scratchColor
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    applyTexture(ctx, canvas.width, canvas.height)
                    // Draw cover text after texture
                    if (coverText && showText) {
                        drawCoverText(ctx, canvas.width, canvas.height)
                    }
                }
                img.src = coverImage.src
                return // Exit early for image type
        }

        // Apply texture overlay
        applyTexture(ctx, canvas.width, canvas.height)

        // Draw cover text on top
        if (coverText && showText) {
            drawCoverText(ctx, canvas.width, canvas.height)
        }

        totalPixelsRef.current = canvas.width * canvas.height
        scratchedPixelsRef.current = 0
    }, [
        coverType,
        scratchColor,
        gradientStart,
        gradientEnd,
        gradientAngle,
        patternType,
        patternColor,
        patternBackground,
        patternSize,
        coverImage.src,
        coverTexture,
        coverText,
        coverFont,
        coverTextColor,
        showText,
    ])

    // Function to apply texture overlay
    const applyTexture = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        if (coverTexture === "none") return

        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        switch (coverTexture) {
            case "noise":
                // Random noise texture
                for (let i = 0; i < data.length; i += 4) {
                    const noise = (Math.random() - 0.5) * 50
                    data[i] += noise // R
                    data[i + 1] += noise // G
                    data[i + 2] += noise // B
                }
                break

            case "grain":
                // Film grain texture
                for (let i = 0; i < data.length; i += 4) {
                    if (Math.random() > 0.95) {
                        const grain = (Math.random() - 0.5) * 100
                        data[i] += grain // R
                        data[i + 1] += grain // G
                        data[i + 2] += grain // B
                    }
                }
                break

            case "fabric":
                // Fabric weave texture
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4
                        const weave = Math.sin(x * 0.1) * Math.sin(y * 0.1) * 15
                        data[i] += weave // R
                        data[i + 1] += weave // G
                        data[i + 2] += weave // B
                    }
                }
                break

            case "paper":
                // Paper texture with subtle variations
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4
                        const paper =
                            (Math.sin(x * 0.05) + Math.cos(y * 0.05)) * 8 +
                            (Math.random() - 0.5) * 10
                        data[i] += paper // R
                        data[i + 1] += paper // G
                        data[i + 2] += paper // B
                    }
                }
                break

            case "scratch":
                // Scratch card texture with fine random scratches
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4
                        // Base texture variation
                        const base = (Math.random() - 0.5) * 15
                        data[i] += base
                        data[i + 1] += base
                        data[i + 2] += base
                    }
                }
                // Add scratch lines
                for (let s = 0; s < 100; s++) {
                    const startX = Math.random() * width
                    const startY = Math.random() * height
                    const angle = Math.random() * Math.PI * 2
                    const length = Math.random() * 30 + 10
                    const endX = startX + Math.cos(angle) * length
                    const endY = startY + Math.sin(angle) * length
                    const steps = Math.floor(length)
                    for (let step = 0; step < steps; step++) {
                        const t = step / steps
                        const x = Math.floor(startX + (endX - startX) * t)
                        const y = Math.floor(startY + (endY - startY) * t)
                        if (x >= 0 && x < width && y >= 0 && y < height) {
                            const i = (y * width + x) * 4
                            const scratch = (Math.random() - 0.5) * 40
                            data[i] += scratch
                            data[i + 1] += scratch
                            data[i + 2] += scratch
                        }
                    }
                }
                break

            case "metallic":
                // Metallic texture with brushed metal effect
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4
                        // Horizontal brushed metal lines
                        const brushed =
                            Math.sin(y * 0.5) * 12 + (Math.random() - 0.5) * 8
                        // Add some vertical variation
                        const vertical = Math.sin(x * 0.1) * 5
                        // Metallic highlights
                        const highlight = Math.sin(x * 0.02 + y * 0.02) * 20
                        const metallic = brushed + vertical + highlight

                        // Apply with slight color shift for metallic look
                        data[i] += metallic + 10 // R - slightly warmer
                        data[i + 1] += metallic // G
                        data[i + 2] += metallic - 5 // B - slightly cooler
                    }
                }
                // Add random metallic specks
                for (let s = 0; s < 200; s++) {
                    const x = Math.floor(Math.random() * width)
                    const y = Math.floor(Math.random() * height)
                    const i = (y * width + x) * 4
                    const speck = Math.random() * 40 + 20
                    data[i] += speck
                    data[i + 1] += speck
                    data[i + 2] += speck
                }
                break

            case "emboss":
                // Emboss texture with 3D raised effect
                // Create a temporary copy for edge detection
                const tempData = new Uint8ClampedArray(data)

                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const i = (y * width + x) * 4

                        // Get surrounding pixels for edge detection
                        const topLeft = ((y - 1) * width + (x - 1)) * 4
                        const bottomRight = ((y + 1) * width + (x + 1)) * 4

                        // Calculate emboss effect using edge detection
                        const diffR = tempData[topLeft] - tempData[bottomRight]
                        const diffG =
                            tempData[topLeft + 1] - tempData[bottomRight + 1]
                        const diffB =
                            tempData[topLeft + 2] - tempData[bottomRight + 2]

                        // Average the differences
                        const emboss = (diffR + diffG + diffB) / 3

                        // Apply emboss effect with bias to keep it visible
                        const embossValue = emboss * 1.5 + 128

                        data[i] = embossValue // R
                        data[i + 1] = embossValue // G
                        data[i + 2] = embossValue // B
                    }
                }

                // Add subtle noise for texture
                for (let i = 0; i < data.length; i += 4) {
                    const noise = (Math.random() - 0.5) * 15
                    data[i] += noise
                    data[i + 1] += noise
                    data[i + 2] += noise
                }
                break
        }

        ctx.putImageData(imageData, 0, 0)
    }

    const drawCoverText = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        ctx.save()
        ctx.fillStyle = coverTextColor

        // Parse font size properly - handle both string and number formats
        let fontSize = 24
        if (typeof coverFont.fontSize === "string") {
            fontSize = parseFloat(coverFont.fontSize)
        } else if (typeof coverFont.fontSize === "number") {
            fontSize = coverFont.fontSize
        }

        // Build font string with proper formatting
        const fontWeight = coverFont.fontWeight || 400
        const fontFamily = coverFont.fontFamily || "sans-serif"
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Word wrap for cover text
        const maxWidth = width * 0.9
        const words = coverText.split(" ")
        const lines: string[] = []
        let currentLine = words[0]

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + " " + words[i]
            const metrics = ctx.measureText(testLine)
            if (metrics.width > maxWidth) {
                lines.push(currentLine)
                currentLine = words[i]
            } else {
                currentLine = testLine
            }
        }
        lines.push(currentLine)

        // Calculate line height properly
        let lineHeightMultiplier = 1.2
        if (typeof coverFont.lineHeight === "string") {
            const parsed = parseFloat(coverFont.lineHeight)
            if (!isNaN(parsed)) {
                lineHeightMultiplier = parsed
            }
        } else if (typeof coverFont.lineHeight === "number") {
            lineHeightMultiplier = coverFont.lineHeight
        }

        const lineHeight = fontSize * lineHeightMultiplier
        const totalHeight = lines.length * lineHeight
        const startY = (height - totalHeight) / 2 + lineHeight / 2

        lines.forEach((line, index) => {
            ctx.fillText(line, width / 2, startY + index * lineHeight)
        })

        // Calculate the end position of the last letter for particle spawning
        const lastLine = lines[lines.length - 1]
        const lastLineY = startY + (lines.length - 1) * lineHeight
        const lastLineWidth = ctx.measureText(lastLine).width
        const endX = width / 2 + lastLineWidth / 2
        const endY = lastLineY

        textEndPositionRef.current = { x: endX, y: endY }

        ctx.restore()
    }

    // Cover particle animation loop
    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return // Skip animation in static renderer
        if (!isInView) return // Skip animation when offscreen
        if (
            !coverParticlesConfig.enabled ||
            !coverText ||
            hasScratched.current ||
            !showText
        )
            return

        const canvas = coverParticleCanvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size to match cover text canvas
        canvas.width = 400
        canvas.height = 300

        let lastSpawnTime = 0
        const spawnInterval = (coverParticlesConfig.duration * 1000) / 60 // Convert duration to ms per frame

        const animate = (timestamp: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Spawn new particles at the end of the text
            if (
                textEndPositionRef.current &&
                timestamp - lastSpawnTime > spawnInterval
            ) {
                const { x, y } = textEndPositionRef.current
                const particleLife = coverParticlesConfig.life

                for (let i = 0; i < 2; i++) {
                    const angle = Math.random() * Math.PI * 2
                    const speed =
                        (Math.random() * 0.5 + 0.2) * coverParticlesConfig.speed
                    coverParticlesRef.current.push({
                        x,
                        y,
                        vx: Math.cos(angle) * speed,
                        vy:
                            Math.sin(angle) * speed -
                            0.5 * coverParticlesConfig.speed, // Slight upward bias
                        size:
                            Math.random() * coverParticlesConfig.size +
                            coverParticlesConfig.size * 0.5,
                        alpha: 1,
                        life: particleLife,
                        maxLife: particleLife,
                    })
                }
                lastSpawnTime = timestamp
            }

            // Update and draw particles
            coverParticlesRef.current = coverParticlesRef.current.filter(
                (particle) => {
                    // Update physics based on fall type
                    switch (coverParticlesConfig.fallType) {
                        case "gravity":
                            particle.vy += 0.02 * coverParticlesConfig.speed // Gentle gravity
                            particle.vx *= 0.98
                            particle.vy *= 0.98
                            break
                        case "float":
                            particle.vy -= 0.015 * coverParticlesConfig.speed // Float upward
                            particle.vx *= 0.99
                            particle.vy *= 0.99
                            break
                        case "spiral":
                            const angle = Math.atan2(particle.vy, particle.vx)
                            const speed = Math.sqrt(
                                particle.vx ** 2 + particle.vy ** 2
                            )
                            const newAngle =
                                angle + 0.08 * coverParticlesConfig.speed
                            particle.vx = Math.cos(newAngle) * speed * 0.99
                            particle.vy = Math.sin(newAngle) * speed * 0.99
                            break
                        case "drift":
                            // Gentle horizontal drift with slight vertical movement
                            particle.vx *= 0.995
                            particle.vy =
                                Math.sin(timestamp * 0.002 + particle.x * 0.1) *
                                0.1 *
                                coverParticlesConfig.speed
                            break
                        case "bounce":
                            particle.vy += 0.03 * coverParticlesConfig.speed // Gravity
                            particle.vx *= 0.98
                            // Bounce off bottom
                            if (particle.y > canvas.height - particle.size) {
                                particle.y = canvas.height - particle.size
                                particle.vy *= -0.6 // Bounce with energy loss
                            }
                            // Bounce off sides
                            if (
                                particle.x < particle.size ||
                                particle.x > canvas.width - particle.size
                            ) {
                                particle.vx *= -0.8
                            }
                            break
                    }

                    particle.x += particle.vx
                    particle.y += particle.vy
                    particle.life--
                    particle.alpha = particle.life / particle.maxLife

                    // Draw particle
                    ctx.globalAlpha = particle.alpha
                    ctx.fillStyle = coverTextColor
                    ctx.beginPath()
                    ctx.arc(
                        particle.x,
                        particle.y,
                        particle.size,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()

                    return particle.life > 0
                }
            )

            ctx.globalAlpha = 1
            coverParticleAnimationRef.current = requestAnimationFrame(animate)
        }

        coverParticleAnimationRef.current = requestAnimationFrame(animate)

        return () => {
            if (coverParticleAnimationRef.current) {
                cancelAnimationFrame(coverParticleAnimationRef.current)
            }
        }
    }, [coverParticlesConfig, coverText, coverTextColor, showText])

    // Stop cover particles when scratching starts
    useEffect(() => {
        if (isScratching && !hasScratched.current) {
            hasScratched.current = true
            coverParticlesRef.current = []
            if (coverParticleAnimationRef.current) {
                cancelAnimationFrame(coverParticleAnimationRef.current)
            }
        }
    }, [isScratching])

    // Particle animation loop
    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return // Skip animation in static renderer
        if (!isInView) return // Skip animation when offscreen
        
        const particleCanvas = particleCanvasRef.current
        if (!particleCanvas) return

        const ctx = particleCanvas.getContext("2d", {
            alpha: true,
            desynchronized: true,
        })
        if (!ctx) return

        let lastTimestamp = 0

        const animate = (timestamp: number) => {
            const deltaTime = lastTimestamp
                ? Math.min((timestamp - lastTimestamp) / 16.67, 2)
                : 1
            lastTimestamp = timestamp

            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height)

            // Batch particle rendering
            const particlesByAlpha: Map<number, Particle[]> = new Map()

            // Update particles
            let activeCount = 0
            for (let i = 0; i < particlesRef.current.length; i++) {
                const particle = particlesRef.current[i]
                if (!particle.active) continue

                // Update particle physics based on disintegration type
                const speedMultiplier = animationSpeed * deltaTime

                switch (disintegrationType) {
                    case "gravity":
                        particle.vy += 0.5 * speedMultiplier
                        particle.vx *= Math.pow(0.98, deltaTime)
                        particle.vy *= Math.pow(0.98, deltaTime)
                        break
                    case "explode":
                        particle.vx *= Math.pow(0.95, deltaTime)
                        particle.vy *= Math.pow(0.95, deltaTime)
                        break
                    case "float":
                        particle.vy -= 0.3 * speedMultiplier
                        particle.vx *= Math.pow(0.99, deltaTime)
                        particle.vy *= Math.pow(0.99, deltaTime)
                        break
                    case "spiral":
                        const angle = Math.atan2(particle.vy, particle.vx)
                        const speed = Math.sqrt(
                            particle.vx ** 2 + particle.vy ** 2
                        )
                        const newAngle = angle + 0.1 * speedMultiplier
                        particle.vx =
                            Math.cos(newAngle) *
                            speed *
                            Math.pow(0.98, deltaTime)
                        particle.vy =
                            Math.sin(newAngle) *
                            speed *
                            Math.pow(0.98, deltaTime)
                        break
                    case "drift":
                        particle.vx *= Math.pow(0.995, deltaTime)
                        particle.vy =
                            Math.sin(timestamp * 0.002 + particle.x * 0.1) *
                            0.2 *
                            speedMultiplier
                        break
                    case "bounce":
                        particle.vy += 0.5 * speedMultiplier
                        particle.vx *= Math.pow(0.98, deltaTime)
                        if (
                            particle.y >
                            particleCanvas.height - particle.size
                        ) {
                            particle.y = particleCanvas.height - particle.size
                            particle.vy *= -0.6
                        }
                        if (
                            particle.x < particle.size ||
                            particle.x > particleCanvas.width - particle.size
                        ) {
                            particle.vx *= -0.8
                        }
                        break
                }

                particle.x += particle.vx * speedMultiplier
                particle.y += particle.vy * speedMultiplier
                particle.life -= deltaTime

                if (particle.life <= 0) {
                    particle.active = false
                    particlePoolRef.current.push(particle)
                    continue
                }

                activeCount++
                const alpha = particle.life / particle.maxLife
                const alphaKey = Math.floor(alpha * 10) / 10

                if (!particlesByAlpha.has(alphaKey)) {
                    particlesByAlpha.set(alphaKey, [])
                }
                particlesByAlpha.get(alphaKey)!.push(particle)
            }

            // Batch render particles by alpha
            particlesByAlpha.forEach((particles, alpha) => {
                ctx.globalAlpha = alpha
                ctx.fillStyle = particles[0].color
                ctx.beginPath()

                for (const particle of particles) {
                    const renderSize = particle.size * alpha
                    ctx.moveTo(particle.x + renderSize, particle.y)
                    ctx.arc(particle.x, particle.y, renderSize, 0, Math.PI * 2)
                }

                ctx.fill()
            })

            ctx.globalAlpha = 1

            // Clean up inactive particles
            if (particlesRef.current.length > activeCount * 2) {
                particlesRef.current = particlesRef.current.filter(
                    (p) => p.active
                )
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [disintegrationType, animationSpeed])

    // Set particle canvas size
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const canvas = particleCanvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
    }, [])

    const spawnParticles = (x: number, y: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const canvasX = (x - rect.left) * scaleX
        const canvasY = (y - rect.top) * scaleY

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2
            let speed = 0

            switch (disintegrationType) {
                case "gravity":
                    speed = Math.random() * 3 + 2
                    break
                case "explode":
                    speed = Math.random() * 8 + 4
                    break
                case "float":
                    speed = Math.random() * 2 + 1
                    break
                case "spiral":
                    speed = Math.random() * 4 + 2
                    break
                case "drift":
                    speed = Math.random() * 2 + 1
                    break
                case "bounce":
                    speed = Math.random() * 3 + 2
                    break
            }

            // Try to reuse particle from pool
            let particle = particlePoolRef.current.pop()

            if (particle) {
                particle.x = canvasX
                particle.y = canvasY
                particle.vx = Math.cos(angle) * speed
                particle.vy = Math.sin(angle) * speed
                particle.size =
                    Math.random() * particleSize + particleSize * 0.5
                particle.life = particleLife
                particle.maxLife = particleLife
                particle.color = scratchColor
                particle.active = true
            } else {
                particle = {
                    x: canvasX,
                    y: canvasY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * particleSize + particleSize * 0.5,
                    life: particleLife,
                    maxLife: particleLife,
                    color: scratchColor,
                    active: true,
                }
            }

            particlesRef.current.push(particle)
        }
    }

    const scratch = (x: number, y: number) => {
        const canvas = canvasRef.current
        if (!canvas || isRevealed) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const canvasX = (x - rect.left) * scaleX
        const canvasY = (y - rect.top) * scaleY
        const scaledBrushSize = brushSize * Math.max(scaleX, scaleY)

        // Spawn particles when scratching (for all brush types)
        spawnParticles(x, y)

        ctx.globalCompositeOperation = "destination-out"

        // Add shadow to create depth on scratch edges
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
        ctx.shadowBlur = 8
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        // Apply shadow to create depth on scratch edges (if enabled)
        if (brushShadow.enabled) {
            ctx.shadowColor = brushShadow.color
            ctx.shadowBlur = brushShadow.blur
            ctx.shadowOffsetX = brushShadow.offsetX
            ctx.shadowOffsetY = brushShadow.offsetY
        }

        // Apply brush texture
        const applyTexture = (baseX: number, baseY: number, size: number) => {
            switch (brushTexture) {
                case "smooth":
                    // No texture modification
                    break

                case "grainy":
                    // Add grainy texture with random dots
                    for (let i = 0; i < 50; i++) {
                        const angle = Math.random() * Math.PI * 2
                        const distance = Math.random() * size
                        const dotSize = Math.random() * 2 + 0.5
                        const offsetX = Math.cos(angle) * distance
                        const offsetY = Math.sin(angle) * distance
                        ctx.globalAlpha = Math.random() * 0.5 + 0.5
                        ctx.beginPath()
                        ctx.arc(
                            baseX + offsetX,
                            baseY + offsetY,
                            dotSize,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()
                    }
                    ctx.globalAlpha = 1
                    break

                case "speckled":
                    // Add speckled texture with larger random spots
                    for (let i = 0; i < 30; i++) {
                        const angle = Math.random() * Math.PI * 2
                        const distance = Math.random() * size
                        const spotSize = Math.random() * 4 + 2
                        const offsetX = Math.cos(angle) * distance
                        const offsetY = Math.sin(angle) * distance
                        if (Math.random() > 0.3) {
                            ctx.beginPath()
                            ctx.arc(
                                baseX + offsetX,
                                baseY + offsetY,
                                spotSize,
                                0,
                                Math.PI * 2
                            )
                            ctx.fill()
                        }
                    }
                    break

                case "dotted":
                    // Add dotted pattern texture
                    const dotSpacing = size / 5
                    for (let dx = -size; dx <= size; dx += dotSpacing) {
                        for (let dy = -size; dy <= size; dy += dotSpacing) {
                            const distance = Math.sqrt(dx * dx + dy * dy)
                            if (distance <= size && Math.random() > 0.2) {
                                ctx.beginPath()
                                ctx.arc(
                                    baseX + dx,
                                    baseY + dy,
                                    dotSpacing * 0.3,
                                    0,
                                    Math.PI * 2
                                )
                                ctx.fill()
                            }
                        }
                    }
                    break

                case "crosshatch":
                    // Add crosshatch texture with lines
                    ctx.lineWidth = 2
                    const lineSpacing = size / 8
                    for (let i = -size; i <= size; i += lineSpacing) {
                        // Horizontal lines
                        ctx.beginPath()
                        ctx.moveTo(baseX - size, baseY + i)
                        ctx.lineTo(baseX + size, baseY + i)
                        ctx.stroke()
                        // Vertical lines
                        ctx.beginPath()
                        ctx.moveTo(baseX + i, baseY - size)
                        ctx.lineTo(baseX + i, baseY + size)
                        ctx.stroke()
                    }
                    break
            }
        }

        // Apply brush shape with scratch effect integrated
        ctx.save()

        // Different scratch effects modify how the brush erases
        switch (scratchEffect) {
            case "scratch":
                // Standard brush shape erasure
                applyBrushShape(ctx, canvasX, canvasY, scaledBrushSize)
                break

            case "peel":
                // Curved peel effect with gradient
                const peelGradient = ctx.createRadialGradient(
                    canvasX,
                    canvasY,
                    0,
                    canvasX,
                    canvasY,
                    scaledBrushSize * 1.5
                )
                peelGradient.addColorStop(0, "rgba(0,0,0,1)")
                peelGradient.addColorStop(0.6, "rgba(0,0,0,0.6)")
                peelGradient.addColorStop(1, "rgba(0,0,0,0)")
                ctx.fillStyle = peelGradient
                ctx.beginPath()
                ctx.arc(canvasX, canvasY, scaledBrushSize * 1.5, 0, Math.PI * 2)
                ctx.fill()
                break

            case "dissolve":
                // Random particle dissolve effect
                for (let i = 0; i < 30; i++) {
                    const offsetX = (Math.random() - 0.5) * scaledBrushSize * 2.5
                    const offsetY = (Math.random() - 0.5) * scaledBrushSize * 2.5
                    const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2)
                    if (distance < scaledBrushSize * 1.2) {
                        const size = Math.random() * 8 + 3
                        ctx.globalAlpha = 1 - (distance / (scaledBrushSize * 1.2)) * 0.5
                        ctx.beginPath()
                        ctx.arc(
                            canvasX + offsetX,
                            canvasY + offsetY,
                            size,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()
                    }
                }
                ctx.globalAlpha = 1
                break

            case "pixelate":
                // Pixelated block removal
                const pixelSize = 12
                const startX = Math.floor((canvasX - scaledBrushSize) / pixelSize) * pixelSize
                const startY = Math.floor((canvasY - scaledBrushSize) / pixelSize) * pixelSize
                const blocks = Math.ceil((scaledBrushSize * 2) / pixelSize)
                for (let i = 0; i < blocks; i++) {
                    for (let j = 0; j < blocks; j++) {
                        const blockX = startX + i * pixelSize
                        const blockY = startY + j * pixelSize
                        const dx = blockX + pixelSize / 2 - canvasX
                        const dy = blockY + pixelSize / 2 - canvasY
                        const distance = Math.sqrt(dx ** 2 + dy ** 2)
                        if (distance < scaledBrushSize && Math.random() > 0.2) {
                            ctx.fillRect(blockX, blockY, pixelSize, pixelSize)
                        }
                    }
                }
                break

            case "shatter":
                // Shattered glass effect with angular shapes
                const shards = 12
                for (let i = 0; i < shards; i++) {
                    const angle = (Math.PI * 2 * i) / shards + Math.random() * 0.3
                    const length = scaledBrushSize * (0.6 + Math.random() * 0.6)
                    const width = scaledBrushSize * 0.4
                    ctx.save()
                    ctx.translate(canvasX, canvasY)
                    ctx.rotate(angle)
                    ctx.beginPath()
                    ctx.moveTo(0, 0)
                    ctx.lineTo(length, -width / 2)
                    ctx.lineTo(length * 0.9, 0)
                    ctx.lineTo(length, width / 2)
                    ctx.closePath()
                    ctx.fill()
                    ctx.restore()
                }
                break

            case "disintegrate":
                // Disintegration effect with expanding particles
                const disintegrateCount = 50
                for (let i = 0; i < disintegrateCount; i++) {
                    const angle = Math.random() * Math.PI * 2
                    const distance = Math.random() * scaledBrushSize * 1.3
                    const size = Math.random() * 7 + 2
                    const offsetX = Math.cos(angle) * distance
                    const offsetY = Math.sin(angle) * distance
                    ctx.globalAlpha = Math.max(0, 1 - (distance / (scaledBrushSize * 1.3)) * 0.7)
                    ctx.beginPath()
                    ctx.arc(
                        canvasX + offsetX,
                        canvasY + offsetY,
                        size,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                }
                ctx.globalAlpha = 1
                break

            case "particle":
                // Particle burst effect with velocity trails
                particleTimeRef.current = (particleTimeRef.current || 0) + 1
                const burstCount = 35
                for (let i = 0; i < burstCount; i++) {
                    const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.2
                    const velocity = 2 + Math.random() * 2
                    const time = Math.min(particleTimeRef.current * 0.3, 8)
                    const distance = velocity * time
                    const size = Math.random() * 6 + 2
                    const offsetX = Math.cos(angle) * distance
                    const offsetY = Math.sin(angle) * distance
                    const totalDist = Math.sqrt(offsetX ** 2 + offsetY ** 2)
                    const alpha = Math.max(0, 1 - (totalDist / (scaledBrushSize * 2)))
                    if (alpha > 0) {
                        ctx.globalAlpha = alpha
                        ctx.beginPath()
                        ctx.arc(
                            canvasX + offsetX,
                            canvasY + offsetY,
                            size,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()
                    }
                }
                ctx.globalAlpha = 1
                if (particleTimeRef.current > 20) particleTimeRef.current = 0
                break
        }

        ctx.restore()

        function applyBrushShape(
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            size: number
        ) {
            switch (brushShape) {
                case "default":
                case "circle":
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                    applyTexture(x, y, size)
                    break

                case "square":
                    ctx.fillRect(x - size, y - size, size * 2, size * 2)
                    applyTexture(x, y, size)
                    break

                case "star":
                    ctx.beginPath()
                    const spikes = 5
                    const outerRadius = size
                    const innerRadius = size * 0.5
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius
                        const angle = (i * Math.PI) / spikes - Math.PI / 2
                        const px = x + Math.cos(angle) * radius
                        const py = y + Math.sin(angle) * radius
                        if (i === 0) {
                            ctx.moveTo(px, py)
                        } else {
                            ctx.lineTo(px, py)
                        }
                    }
                    ctx.closePath()
                    ctx.fill()
                    applyTexture(x, y, size)
                    break

                case "heart":
                    ctx.beginPath()
                    const heartSize = size
                    ctx.moveTo(x, y + heartSize * 0.3)
                    ctx.bezierCurveTo(
                        x - heartSize * 0.5,
                        y - heartSize * 0.3,
                        x - heartSize,
                        y + heartSize * 0.1,
                        x,
                        y + heartSize * 0.9
                    )
                    ctx.bezierCurveTo(
                        x + heartSize,
                        y + heartSize * 0.1,
                        x + heartSize * 0.5,
                        y - heartSize * 0.3,
                        x,
                        y + heartSize * 0.3
                    )
                    ctx.closePath()
                    ctx.fill()
                    applyTexture(x, y, size)
                    break

                case "disintegrate":
                    // Disintegrate brush creates scattered particle-like removal
                    const disintegrateParticles = 40
                    for (let i = 0; i < disintegrateParticles; i++) {
                        const angle = Math.random() * Math.PI * 2
                        const distance = Math.random() * size
                        const particleSize = Math.random() * 6 + 2
                        const offsetX = Math.cos(angle) * distance
                        const offsetY = Math.sin(angle) * distance
                        const alpha = 1 - (distance / size) * 0.5
                        ctx.globalAlpha = alpha
                        ctx.beginPath()
                        ctx.arc(x + offsetX, y + offsetY, particleSize, 0, Math.PI * 2)
                        ctx.fill()
                    }
                    ctx.globalAlpha = 1
                    break

                case "image":
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.src = brushImage.src
                    try {
                        ctx.drawImage(img, x - size, y - size, size * 2, size * 2)
                    } catch (e) {
                        // Fallback to circle if image fails
                        ctx.beginPath()
                        ctx.arc(x, y, size, 0, Math.PI * 2)
                        ctx.fill()
                    }
                    applyTexture(x, y, size)
                    break
            }
        }

        // Reset shadow after drawing
        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        // Check scratch percentage
        if (autoReveal) {
            checkScratchPercentage()
        }
    }

    const checkScratchPercentage = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let transparentPixels = 0

        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] < 128) {
                transparentPixels++
            }
        }

        const percentage = (transparentPixels / totalPixelsRef.current) * 100

        if (percentage >= revealPercentage && !isRevealed) {
            startTransition(() => {
                setIsRevealed(true)
            })
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        startTransition(() => setIsScratching(true))
        scratch(e.clientX, e.clientY)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isScratching) {
            scratch(e.clientX, e.clientY)
        }
    }

    const handleMouseUp = () => {
        startTransition(() => setIsScratching(false))
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        startTransition(() => setIsScratching(true))
        const touch = e.touches[0]
        scratch(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        scratch(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
        startTransition(() => setIsScratching(false))
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        
        const handleGlobalMouseUp = () => {
            startTransition(() => setIsScratching(false))
        }

        if (isScratching) {
            window.addEventListener("mouseup", handleGlobalMouseUp)
        }

        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isScratching])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                cursor: isScratching ? "grabbing" : "grab",
                userSelect: "none",
                touchAction: "none",
                borderRadius: `${borderRadius}px`,
            }}
        >
            {/* Hidden content underneath */}
            {revealType === "text" ? (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        ...revealFont,
                        color: textColor,
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        opacity: 1,
                    }}
                >
                    {content}
                </div>
            ) : (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 1,
                    }}
                >
                    <img
                        src={revealImage.src}
                        alt={revealImage.alt || "Reveal image"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            )}

            {/* Scratch canvas overlay */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: isRevealed ? "none" : "auto",
                    opacity: isRevealed ? 0 : 1,
                    transition: `opacity ${revealAnimation.duration}s ${revealAnimation.easing}`,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Cover text canvas overlay */}
            {coverText && showText && (
                <canvas
                    ref={coverTextCanvasRef}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "400px",
                        height: "300px",
                        pointerEvents: "none",
                        opacity:
                            isRevealed || hasScratched.current || isScratching || isStatic
                                ? isStatic ? 1 : 0
                                : 1,
                        transition: `opacity ${revealAnimation.duration}s ${revealAnimation.easing}`,
                    }}
                />
            )}

            {/* Cover particle canvas overlay */}
            {coverText && coverParticlesConfig.enabled && showText && !isStatic && (
                <canvas
                    ref={coverParticleCanvasRef}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "400px",
                        height: "300px",
                        pointerEvents: "none",
                        opacity:
                            isRevealed || hasScratched.current || isScratching
                                ? 0
                                : 1,
                        transition: `opacity ${revealAnimation.duration}s ${revealAnimation.easing}`,
                    }}
                />
            )}

            {/* Particle canvas overlay */}
            {!isStatic && (
                <canvas
                    ref={particleCanvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(ScratchReveal, {
    text: {
        type: ControlType.Object,
        title: "Reveal",
        description: "Content shown after scratching away the cover",
        controls: {
            revealType: {
                type: ControlType.Enum,
                title: "Reveal Type",
                description: "Choose what to reveal underneath",
                options: ["text", "image"],
                optionTitles: ["Text", "Image"],
                defaultValue: "text",
                displaySegmentedControl: true,
            },
            content: {
                type: ControlType.String,
                title: "Text",
                description: "The hidden message to reveal",
                defaultValue:
                    "You've successful revealed this text, now try revealing an image and have fun",
                displayTextArea: true,
                hidden: ({ revealType }) => revealType !== "text",
            },
            revealFont: {
                type: ControlType.Font,
                title: "Reveal Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayFontSize: true,
                defaultValue: {
                    fontSize: "24px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.5em",
                },
                hidden: ({ revealType }) => revealType !== "text",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#000000",
                hidden: ({ revealType }) => revealType !== "text",
            },
            revealImage: {
                type: ControlType.ResponsiveImage,
                title: "Reveal Image",
                hidden: ({ revealType }) => revealType !== "image",
            },
        },
    },
    scratchEffect: {
        type: ControlType.Enum,
        title: "Effect",
        description: "Visual effect when scratching the cover",
        options: [
            "scratch",
            "peel",
            "dissolve",
            "pixelate",
            "shatter",
            "disintegrate",
            "particle",
        ],
        optionTitles: [
            "Scratch",
            "Peel",
            "Dissolve",
            "Pixelate",
            "Shatter",
            "Disintegrate",
            "Particle",
        ],
        defaultValue: "scratch",
    },
    cover: {
        type: ControlType.Object,
        title: "Cover",
        description: "Appearance of the scratchable surface",
        controls: {
            coverType: {
                type: ControlType.Enum,
                title: "Cover Type",
                description: "Style of the cover layer",
                options: ["solid", "gradient", "pattern", "image"],
                optionTitles: ["Solid", "Gradient", "Pattern", "Image"],
                defaultValue: "solid",
            },
            scratchColor: {
                type: ControlType.Color,
                title: "Cover Color",
                defaultValue: "#CCCCCC",
                hidden: ({ coverType }) => coverType !== "solid",
            },
            gradientStart: {
                type: ControlType.Color,
                title: "Gradient Start",
                defaultValue: "#CCCCCC",
                hidden: ({ coverType }) => coverType !== "gradient",
            },
            gradientEnd: {
                type: ControlType.Color,
                title: "Gradient End",
                defaultValue: "#999999",
                hidden: ({ coverType }) => coverType !== "gradient",
            },
            gradientAngle: {
                type: ControlType.Number,
                title: "Gradient Angle",
                defaultValue: 45,
                min: 0,
                max: 360,
                step: 15,
                unit: "deg",
                hidden: ({ coverType }) => coverType !== "gradient",
            },
            patternType: {
                type: ControlType.Enum,
                title: "Pattern Type",
                options: ["dots", "lines", "grid", "waves"],
                optionTitles: ["Dots", "Lines", "Grid", "Waves"],
                defaultValue: "dots",
                hidden: ({ coverType }) => coverType !== "pattern",
            },
            patternColor: {
                type: ControlType.Color,
                title: "Pattern Color",
                defaultValue: "#999999",
                hidden: ({ coverType }) => coverType !== "pattern",
            },
            patternBackground: {
                type: ControlType.Color,
                title: "Pattern Background",
                defaultValue: "#CCCCCC",
                hidden: ({ coverType }) => coverType !== "pattern",
            },
            patternSize: {
                type: ControlType.Number,
                title: "Pattern Size",
                defaultValue: 20,
                min: 5,
                max: 100,
                step: 5,
                hidden: ({ coverType }) => coverType !== "pattern",
            },
            coverImage: {
                type: ControlType.ResponsiveImage,
                title: "Cover Image",
                hidden: ({ coverType }) => coverType !== "image",
            },
            coverTexture: {
                type: ControlType.Enum,
                title: "Texture",
                description: "Surface texture overlay for realism",
                options: [
                    "none",
                    "noise",
                    "grain",
                    "fabric",
                    "paper",
                    "scratch",
                    "metallic",
                    "emboss",
                ],
                optionTitles: [
                    "None",
                    "Noise",
                    "Grain",
                    "Fabric",
                    "Paper",
                    "Scratch",
                    "Metallic",
                    "Emboss",
                ],
                defaultValue: "noise",
            },
            showText: {
                type: ControlType.Boolean,
                title: "Show Text",
                description: "Display text on the cover surface",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            coverText: {
                type: ControlType.String,
                title: "Cover Text",
                description: "Text displayed on the cover",
                defaultValue: "Scratch",
                displayTextArea: true,
                hidden: ({ showText }) => !showText,
            },
            coverFont: {
                type: ControlType.Font,
                title: "Cover Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayFontSize: true,
                defaultValue: {
                    fontSize: "24px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
                hidden: ({ coverText, showText }) => !coverText || !showText,
            },
            coverTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: ({ coverText, showText }) => !coverText || !showText,
            },
            particles: {
                type: ControlType.Object,
                title: "C.Particles",
                description: "Animated particles on cover text",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Enabled",
                        defaultValue: true,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                    },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        defaultValue: 3,
                        min: 1,
                        max: 20,
                        step: 0.5,
                    },
                    life: {
                        type: ControlType.Number,
                        title: "Life",
                        defaultValue: 60,
                        min: 10,
                        max: 200,
                        step: 10,
                    },
                    duration: {
                        type: ControlType.Number,
                        title: "Duration",
                        defaultValue: 2,
                        min: 0.5,
                        max: 10,
                        step: 0.5,
                        unit: "s",
                    },
                    fallType: {
                        type: ControlType.Enum,
                        title: "Fall Type",
                        description: "Movement pattern of particles",
                        options: [
                            "gravity",
                            "float",
                            "spiral",
                            "drift",
                            "bounce",
                        ],
                        optionTitles: [
                            "Gravity",
                            "Float",
                            "Spiral",
                            "Drift",
                            "Bounce",
                        ],
                        defaultValue: "gravity",
                    },
                    speed: {
                        type: ControlType.Number,
                        title: "Speed",
                        defaultValue: 1,
                        min: 0.1,
                        max: 5,
                        step: 0.1,
                    },
                },
                hidden: ({ coverText, showText }) => !coverText || !showText,
            },
        },
    },
    brush: {
        type: ControlType.Object,
        title: "Brush",
        description: "Customize the scratching tool",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                description: "Diameter of the brush",
                defaultValue: 30,
                min: 10,
                max: 100,
                step: 5,
            },
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                description: "Shape of the brush stroke",
                options: [
                    "default",
                    "circle",
                    "square",
                    "star",
                    "heart",
                    "image",
                    "disintegrate",
                ],
                optionTitles: [
                    "Default",
                    "Circle",
                    "Square",
                    "Star",
                    "Heart",
                    "Image",
                    "Disintegrate",
                ],
                defaultValue: "default",
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                hidden: ({ shape }) => shape !== "image",
            },
            texture: {
                type: ControlType.Enum,
                title: "Texture",
                description: "Surface texture of brush strokes",
                options: [
                    "smooth",
                    "grainy",
                    "speckled",
                    "dotted",
                    "crosshatch",
                ],
                optionTitles: [
                    "Smooth",
                    "Grainy",
                    "Speckled",
                    "Dotted",
                    "Crosshatch",
                ],
                defaultValue: "smooth",
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                description: "Add depth to scratch edges",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Enabled",
                        defaultValue: true,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#000000",
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        defaultValue: 5,
                        min: 0,
                        max: 20,
                        step: 1,
                    },
                    offsetX: {
                        type: ControlType.Number,
                        title: "Offset X",
                        defaultValue: 2,
                        min: -10,
                        max: 10,
                        step: 1,
                    },
                    offsetY: {
                        type: ControlType.Number,
                        title: "Offset Y",
                        defaultValue: 2,
                        min: -10,
                        max: 10,
                        step: 1,
                    },
                },
            },
        },
    },
    dissolve: {
        type: ControlType.Object,
        title: "Dissolve",
        description: "Particle effects when scratching",
        controls: {
            particleCount: {
                type: ControlType.Number,
                title: "Count",
                description: "Number of particles per scratch",
                defaultValue: 20,
                min: 5,
                max: 500,
                step: 5,
            },
            particleSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 4,
                min: 1,
                max: 10,
                step: 0.5,
            },
            disintegrationType: {
                type: ControlType.Enum,
                title: "Fall",
                description: "How particles move and fall",
                options: [
                    "gravity",
                    "explode",
                    "float",
                    "spiral",
                    "drift",
                    "bounce",
                ],
                optionTitles: [
                    "Gravity",
                    "Explode",
                    "Float",
                    "Spiral",
                    "Drift",
                    "Bounce",
                ],
                defaultValue: "gravity",
            },
            animationSpeed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
            },
            life: {
                type: ControlType.Number,
                title: "Life",
                description: "How long particles last (frames)",
                defaultValue: 60,
                min: 10,
                max: 200,
                step: 10,
            },
        },
    },
    revealAnimation: {
        type: ControlType.Object,
        title: "Animation",
        description: "Auto-reveal animation settings",
        controls: {
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                description: "Animation timing function",
                options: [
                    "linear",
                    "ease",
                    "ease-in",
                    "ease-out",
                    "ease-in-out",
                    "ease-in-back",
                    "ease-out-back",
                    "ease-in-out-back",
                    "ease-in-elastic",
                    "ease-out-elastic",
                    "ease-in-out-elastic",
                    "ease-in-bounce",
                    "ease-out-bounce",
                ],
                optionTitles: [
                    "Linear",
                    "Ease",
                    "Ease In",
                    "Ease Out",
                    "Ease In Out",
                    "Ease In Back",
                    "Ease Out Back",
                    "Ease In Out Back",
                    "Ease In Elastic",
                    "Ease Out Elastic",
                    "Ease In Out Elastic",
                    "Ease In Bounce",
                    "Ease Out Bounce",
                ],
                defaultValue: "ease-out",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 1.2,
                min: 0.1,
                max: 5,
                step: 0.1,
                unit: "s",
            },
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    autoReveal: {
        type: ControlType.Boolean,
        title: "Auto Reveal",
        description: "Automatically reveal when threshold reached",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    revealPercentage: {
        type: ControlType.Number,
        title: "Reveal At",
        description: "Percentage scratched before auto-reveal",
        defaultValue: 70,
        min: 10,
        max: 100,
        step: 5,
        unit: "%",
        hidden: ({ autoReveal }) => !autoReveal,
    },
})
