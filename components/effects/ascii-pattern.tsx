// Dynamic ASCII patterns with customizable characters, speed, and colors
// Optimized with offscreen canvas rendering for better performance
// Individual character animations: fading, scaling, rotating
// Text-to-ASCII art conversion with animation options

import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AsciiPatternProps {
    pattern: "matrix" | "wave" | "spiral" | "random" | "rain" | "custom" | "image" | "text"
    characterSet: "binary" | "numeric" | "alphanumeric" | "symbols" | "blocks" | "custom"
    customCharacters: string
    speed: number
    density: number
    colorScheme: "matrix" | "retro" | "ocean" | "fire" | "monochrome" | "custom"
    backgroundColor: string
    textColor: string
    characterColorMode: "solid" | "gradient" | "rainbow" | "random"
    gradientStartColor: string
    gradientEndColor: string
    font: CSSProperties
    customPattern: string
    imageMask: { src: string; alt?: string }
    imageThreshold: number
    blendMode: "normal" | "multiply" | "screen" | "overlay" | "difference" | "lighten" | "darken" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "exclusion"
    performanceMode: "quality" | "balanced" | "performance"
    showFPS: boolean
    enableCharacterAnimation: boolean
    animationType: "fade" | "scale" | "rotate" | "pulse" | "wave-scale" | "combined"
    animationSpeed: number
    animationIntensity: number
    textInput: string
    textAnimation: "static" | "scroll" | "typewriter" | "wave"
    textSize: "small" | "medium" | "large"
    textAlign: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AsciiPattern(props: AsciiPatternProps) {
    const {
        pattern = "matrix",
        characterSet = "binary",
        customCharacters = "01",
        speed = 50,
        density = 20,
        colorScheme = "matrix",
        backgroundColor = "#000000",
        textColor = "#00FF00",
        font,
        customPattern = "",
        imageMask = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        imageThreshold = 128,
        blendMode = "normal",
        performanceMode = "balanced",
        showFPS = false,
        enableCharacterAnimation = false,
        animationType = "fade",
        animationSpeed = 1,
        animationIntensity = 1,
        textInput = "HELLO",
        textAnimation = "static",
        textSize = "medium",
        textAlign = "center",
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null)
    const animationRef = useRef<number>()
    const columnsRef = useRef<number[]>([])
    const spiralAngleRef = useRef(0)
    const waveOffsetRef = useRef(0)
    const customPatternLinesRef = useRef<string[]>([])
    const customPatternOffsetRef = useRef(0)
    const imageDataRef = useRef<ImageData | null>(null)
    const isStatic = useIsStaticRenderer()
    const animationTimeRef = useRef(0)
    const textScrollOffsetRef = useRef(0)
    const typewriterIndexRef = useRef(0)
    
    // Character animation state
    interface CharacterState {
        char: string
        x: number
        y: number
        age: number
        phase: number
    }
    const characterStatesRef = useRef<Map<string, CharacterState>>(new Map())
    
    // Performance monitoring
    const fpsRef = useRef<number[]>([])
    const lastFrameTimeRef = useRef(performance.now())
    const [currentFPS, setCurrentFPS] = useState(0)
    const qualityScaleRef = useRef(1)

    // Get characters based on character set
    const getCharacters = () => {
        switch (characterSet) {
            case "binary":
                return "01"
            case "numeric":
                return "0123456789"
            case "alphanumeric":
                return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            case "symbols":
                return "!@#$%^&*()_+-=[]{}|;:,.<>?/~`"
            case "blocks":
                return "█▓▒░▄▀■□▪▫"
            case "custom":
                return customCharacters || "01"
            default:
                return "01"
        }
    }

    const characters = getCharacters()

    // Get colors based on scheme
    const getColors = () => {
        switch (colorScheme) {
            case "matrix":
                return { bg: "#000000", text: "#00FF00" }
            case "retro":
                return { bg: "#1a0033", text: "#ff00ff" }
            case "ocean":
                return { bg: "#001a33", text: "#00ccff" }
            case "fire":
                return { bg: "#1a0000", text: "#ff6600" }
            case "monochrome":
                return { bg: "#ffffff", text: "#000000" }
            case "custom":
                return { bg: backgroundColor, text: textColor }
            default:
                return { bg: backgroundColor, text: textColor }
        }
    }

    const colors = getColors()

    // Get character color based on position and mode
    const getCharacterColor = (x: number, y: number, canvasWidth: number, canvasHeight: number): string => {
        switch (props.characterColorMode) {
            case "solid":
                return colors.text
            case "gradient": {
                const ratio = isHorizontal ? x / canvasWidth : y / canvasHeight
                return interpolateColor(props.gradientStartColor || colors.text, props.gradientEndColor || colors.text, ratio)
            }
            case "rainbow": {
                const hue = ((x + y) * 2) % 360
                return `hsl(${hue}, 100%, 50%)`
            }
            case "random": {
                const hue = Math.random() * 360
                return `hsl(${hue}, 70%, 60%)`
            }
            default:
                return colors.text
        }
    }

    // Helper to determine if gradient is horizontal or vertical based on pattern
    const isHorizontal = pattern === "wave" || pattern === "matrix" || pattern === "rain"

    // Interpolate between two colors
    const interpolateColor = (color1: string, color2: string, ratio: number): string => {
        const hex1 = color1.replace("#", "")
        const hex2 = color2.replace("#", "")
        
        const r1 = parseInt(hex1.substring(0, 2), 16)
        const g1 = parseInt(hex1.substring(2, 4), 16)
        const b1 = parseInt(hex1.substring(4, 6), 16)
        
        const r2 = parseInt(hex2.substring(0, 2), 16)
        const g2 = parseInt(hex2.substring(2, 4), 16)
        const b2 = parseInt(hex2.substring(4, 6), 16)
        
        const r = Math.round(r1 + (r2 - r1) * ratio)
        const g = Math.round(g1 + (g2 - g1) * ratio)
        const b = Math.round(b1 + (b2 - b1) * ratio)
        
        return `rgb(${r}, ${g}, ${b})`
    }

    // Calculate quality scale based on performance mode
    const getQualityScale = () => {
        switch (performanceMode) {
            case "quality":
                return 1
            case "balanced":
                return 0.75
            case "performance":
                return 0.5
            default:
                return 1
        }
    }

    // Update FPS counter
    const updateFPS = () => {
        const now = performance.now()
        const delta = now - lastFrameTimeRef.current
        lastFrameTimeRef.current = now
        
        const fps = 1000 / delta
        fpsRef.current.push(fps)
        
        // Keep only last 30 frames
        if (fpsRef.current.length > 30) {
            fpsRef.current.shift()
        }
        
        // Calculate average FPS
        const avgFPS = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
        
        if (showFPS && fpsRef.current.length % 10 === 0) {
            startTransition(() => setCurrentFPS(Math.round(avgFPS)))
        }
        
        // Adaptive quality: reduce quality if FPS drops below 30
        if (performanceMode === "balanced") {
            if (avgFPS < 30 && qualityScaleRef.current > 0.5) {
                qualityScaleRef.current = Math.max(0.5, qualityScaleRef.current - 0.05)
            } else if (avgFPS > 50 && qualityScaleRef.current < 0.75) {
                qualityScaleRef.current = Math.min(0.75, qualityScaleRef.current + 0.05)
            }
        } else {
            qualityScaleRef.current = getQualityScale()
        }
    }

    // Get character animation transform
    const getCharacterTransform = (x: number, y: number, age: number, phase: number) => {
        if (!enableCharacterAnimation) {
            return { opacity: 1, scale: 1, rotation: 0 }
        }

        const time = animationTimeRef.current * animationSpeed
        const localPhase = phase + time
        
        let opacity = 1
        let scale = 1
        let rotation = 0

        switch (animationType) {
            case "fade":
                opacity = 0.3 + 0.7 * (Math.sin(localPhase + age * 0.1) * 0.5 + 0.5)
                opacity = Math.max(0.2, Math.min(1, opacity))
                break
            
            case "scale":
                scale = 1 + (Math.sin(localPhase + age * 0.1) * 0.5 + 0.5) * 0.5 * animationIntensity
                scale = Math.max(0.5, Math.min(1.5, scale))
                break
            
            case "rotate":
                rotation = Math.sin(localPhase + age * 0.1) * 45 * animationIntensity
                break
            
            case "pulse":
                const pulse = Math.sin(localPhase + age * 0.1) * 0.5 + 0.5
                scale = 1 + pulse * 0.3 * animationIntensity
                opacity = 0.5 + pulse * 0.5
                break
            
            case "wave-scale":
                const wavePhase = Math.sin(x * 0.05 + y * 0.05 + localPhase)
                scale = 1 + wavePhase * 0.4 * animationIntensity
                opacity = 0.6 + wavePhase * 0.4
                break
            
            case "combined":
                opacity = 0.4 + 0.6 * (Math.sin(localPhase + age * 0.1) * 0.5 + 0.5)
                scale = 1 + (Math.sin(localPhase * 1.3 + age * 0.15) * 0.5 + 0.5) * 0.3 * animationIntensity
                rotation = Math.sin(localPhase * 0.7 + age * 0.08) * 20 * animationIntensity
                break
        }

        return { opacity, scale, rotation }
    }

    // Draw character with animation
    const drawAnimatedChar = (
        drawCtx: CanvasRenderingContext2D,
        char: string,
        x: number,
        y: number,
        color: string,
        fontSize: number
    ) => {
        const key = `${Math.floor(x)}-${Math.floor(y)}`
        
        // Get or create character state
        let state = characterStatesRef.current.get(key)
        if (!state) {
            state = {
                char,
                x,
                y,
                age: Math.random() * 100,
                phase: Math.random() * Math.PI * 2,
            }
            characterStatesRef.current.set(key, state)
        }
        
        state.age += 0.1
        state.char = char

        const { opacity, scale, rotation } = getCharacterTransform(x, y, state.age, state.phase)

        drawCtx.save()
        
        // Apply transformations
        drawCtx.translate(x, y)
        
        if (rotation !== 0) {
            drawCtx.rotate((rotation * Math.PI) / 180)
        }
        
        if (scale !== 1) {
            drawCtx.scale(scale, scale)
        }
        
        drawCtx.globalAlpha = opacity
        drawCtx.fillStyle = color
        drawCtx.fillText(char, 0, 0)
        
        drawCtx.restore()
    }

    // Load image mask
    useEffect(() => {
        if (pattern !== "image" || isStatic) return

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const tempCanvas = document.createElement("canvas")
            const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })
            if (!tempCtx) return

            tempCanvas.width = img.width
            tempCanvas.height = img.height
            tempCtx.drawImage(img, 0, 0)

            try {
                imageDataRef.current = tempCtx.getImageData(0, 0, img.width, img.height)
            } catch (e) {
                console.error("Failed to load image data:", e)
            }
        }
        img.onerror = () => {
            console.error("Failed to load image")
        }
        img.src = imageMask.src
    }, [imageMask.src, pattern, isStatic])

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) return

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
            
            // Create offscreen canvas with same dimensions
            if (!offscreenCanvasRef.current) {
                offscreenCanvasRef.current = document.createElement("canvas")
            }
            offscreenCanvasRef.current.width = rect.width
            offscreenCanvasRef.current.height = rect.height
            offscreenCtxRef.current = offscreenCanvasRef.current.getContext("2d", { alpha: false })
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        const fontSize = parseInt(font.fontSize as string) || 14
        const scaledFontSize = fontSize * qualityScaleRef.current
        const columns = Math.floor(canvas.width / scaledFontSize)
        const rows = Math.floor(canvas.height / scaledFontSize)

        if (columnsRef.current.length === 0) {
            columnsRef.current = Array(columns).fill(0)
        }

        // Parse custom pattern
        if (pattern === "custom" && customPattern) {
            customPatternLinesRef.current = customPattern.split("\n").filter((line) => line.trim())
        }

        const getRandomChar = () => {
            return characters[Math.floor(Math.random() * characters.length)]
        }

        const drawMatrix = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            
            drawCtx.fillStyle = colors.bg + "20"
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            const cols = Math.floor(canvas.width / scaledFontSize)
            
            // Adjust columns array if needed
            if (columnsRef.current.length !== cols) {
                columnsRef.current = Array(cols).fill(0)
            }

            for (let i = 0; i < columnsRef.current.length; i++) {
                const char = getRandomChar()
                const x = i * scaledFontSize
                const y = columnsRef.current[i] * scaledFontSize

                const color = getCharacterColor(x, y, canvas.width, canvas.height)
                
                if (enableCharacterAnimation) {
                    drawAnimatedChar(drawCtx, char, x, y, color, scaledFontSize)
                } else {
                    drawCtx.fillStyle = color
                    drawCtx.fillText(char, x, y)
                }

                if (y > canvas.height && Math.random() > 0.975) {
                    columnsRef.current[i] = 0
                } else {
                    columnsRef.current[i]++
                }
            }
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawWave = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            const cols = Math.floor(canvas.width / scaledFontSize)
            const rows = Math.floor(canvas.height / scaledFontSize)
            
            drawCtx.fillStyle = colors.bg
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const wave = Math.sin((x * 0.1) + (y * 0.1) + waveOffsetRef.current) * 5
                    if (Math.abs(wave) < 1) {
                        const char = getRandomChar()
                        const xPos = x * scaledFontSize
                        const yPos = y * scaledFontSize
                        const color = getCharacterColor(xPos, yPos, canvas.width, canvas.height)
                        
                        if (enableCharacterAnimation) {
                            drawAnimatedChar(drawCtx, char, xPos, yPos, color, scaledFontSize)
                        } else {
                            drawCtx.fillStyle = color
                            drawCtx.fillText(char, xPos, yPos)
                        }
                    }
                }
            }
            waveOffsetRef.current += 0.05
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawSpiral = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            
            drawCtx.fillStyle = colors.bg
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const maxRadius = Math.min(centerX, centerY)

            for (let r = 0; r < maxRadius; r += scaledFontSize) {
                const angle = spiralAngleRef.current + (r * 0.1)
                const x = centerX + Math.cos(angle) * r
                const y = centerY + Math.sin(angle) * r

                if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    const char = getRandomChar()
                    const color = getCharacterColor(x, y, canvas.width, canvas.height)
                    
                    if (enableCharacterAnimation) {
                        drawAnimatedChar(drawCtx, char, x, y, color, scaledFontSize)
                    } else {
                        drawCtx.fillStyle = color
                        drawCtx.fillText(char, x, y)
                    }
                }
            }
            spiralAngleRef.current += 0.02
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawRandom = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            const cols = Math.floor(canvas.width / scaledFontSize)
            const rows = Math.floor(canvas.height / scaledFontSize)
            
            drawCtx.fillStyle = colors.bg
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            const charCount = Math.floor((cols * rows * density) / 100)

            for (let i = 0; i < charCount; i++) {
                const x = Math.floor(Math.random() * cols) * scaledFontSize
                const y = Math.floor(Math.random() * rows) * scaledFontSize
                const char = getRandomChar()
                const color = getCharacterColor(x, y, canvas.width, canvas.height)
                
                if (enableCharacterAnimation) {
                    drawAnimatedChar(drawCtx, char, x, y, color, scaledFontSize)
                } else {
                    drawCtx.fillStyle = color
                    drawCtx.fillText(char, x, y)
                }
            }
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawRain = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            const cols = Math.floor(canvas.width / scaledFontSize)
            
            drawCtx.fillStyle = colors.bg + "40"
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            // Adjust columns array if needed
            if (columnsRef.current.length !== cols) {
                columnsRef.current = Array(cols).fill(0)
            }

            for (let i = 0; i < columnsRef.current.length; i++) {
                if (Math.random() > 0.95) {
                    const char = getRandomChar()
                    const x = i * scaledFontSize
                    const y = columnsRef.current[i] * scaledFontSize

                    const color = getCharacterColor(x, y, canvas.width, canvas.height)
                    
                    if (enableCharacterAnimation) {
                        drawAnimatedChar(drawCtx, char, x, y, color, scaledFontSize)
                    } else {
                        drawCtx.fillStyle = color
                        drawCtx.fillText(char, x, y)
                    }
                }

                if (columnsRef.current[i] * scaledFontSize > canvas.height && Math.random() > 0.95) {
                    columnsRef.current[i] = 0
                } else {
                    columnsRef.current[i]++
                }
            }
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawCustom = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            const cols = Math.floor(canvas.width / scaledFontSize)
            const rows = Math.floor(canvas.height / scaledFontSize)
            
            drawCtx.fillStyle = colors.bg
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            if (customPatternLinesRef.current.length === 0) {
                drawCtx.fillStyle = colors.text
                drawCtx.fillText("Enter custom pattern...", 10, canvas.height / 2)
                drawCtx.globalCompositeOperation = "source-over"
                return
            }

            const patternHeight = customPatternLinesRef.current.length
            const startY = Math.floor(customPatternOffsetRef.current) % (patternHeight + rows)

            for (let y = 0; y < rows + patternHeight; y++) {
                const lineIndex = (y - startY + patternHeight * 100) % patternHeight
                const line = customPatternLinesRef.current[lineIndex]
                if (!line) continue

                const yPos = ((y - startY) * scaledFontSize) % (canvas.height + patternHeight * scaledFontSize)
                if (yPos < -scaledFontSize || yPos > canvas.height) continue

                for (let x = 0; x < line.length && x < cols; x++) {
                    const char = line[x]
                    if (char && char !== " ") {
                        const xPos = x * scaledFontSize
                        const color = getCharacterColor(xPos, yPos, canvas.width, canvas.height)
                        
                        if (enableCharacterAnimation) {
                            drawAnimatedChar(drawCtx, char, xPos, yPos, color, scaledFontSize)
                        } else {
                            drawCtx.fillStyle = color
                            drawCtx.fillText(char, xPos, yPos)
                        }
                    }
                }
            }

            customPatternOffsetRef.current += 0.1
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawImage = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            const cols = Math.floor(canvas.width / scaledFontSize)
            const rows = Math.floor(canvas.height / scaledFontSize)
            
            drawCtx.fillStyle = colors.bg
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`

            if (!imageDataRef.current) {
                drawCtx.fillStyle = colors.text
                drawCtx.fillText("Loading image...", 10, canvas.height / 2)
                drawCtx.globalCompositeOperation = "source-over"
                return
            }

            const imgData = imageDataRef.current
            const scaleX = imgData.width / cols
            const scaleY = imgData.height / rows

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const imgX = Math.floor(x * scaleX)
                    const imgY = Math.floor(y * scaleY)
                    const pixelIndex = (imgY * imgData.width + imgX) * 4

                    const r = imgData.data[pixelIndex]
                    const g = imgData.data[pixelIndex + 1]
                    const b = imgData.data[pixelIndex + 2]
                    const brightness = (r + g + b) / 3

                    if (brightness > imageThreshold) {
                        const char = getRandomChar()
                        const xPos = x * scaledFontSize
                        const yPos = y * scaledFontSize
                        const color = getCharacterColor(xPos, yPos, canvas.width, canvas.height)
                        
                        if (enableCharacterAnimation) {
                            drawAnimatedChar(drawCtx, char, xPos, yPos, color, scaledFontSize)
                        } else {
                            drawCtx.fillStyle = color
                            drawCtx.fillText(char, xPos, yPos)
                        }
                    }
                }
            }
            drawCtx.globalCompositeOperation = "source-over"
        }

        const drawText = (drawCtx: CanvasRenderingContext2D) => {
            const scaledFontSize = fontSize * qualityScaleRef.current
            
            drawCtx.fillStyle = colors.bg
            drawCtx.fillRect(0, 0, canvas.width, canvas.height)

            drawCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation
            
            // Get text size multiplier
            const sizeMultiplier = textSize === "small" ? 1 : textSize === "medium" ? 2 : 3
            const textFontSize = scaledFontSize * sizeMultiplier
            drawCtx.font = `bold ${textFontSize}px ${font.fontFamily || "monospace"}`

            if (!textInput || textInput.trim() === "") {
                drawCtx.fillStyle = colors.text
                drawCtx.font = `${scaledFontSize}px ${font.fontFamily || "monospace"}`
                drawCtx.fillText("Enter text to display...", 10, canvas.height / 2)
                drawCtx.globalCompositeOperation = "source-over"
                return
            }

            const lines = textInput.split("\n")
            const lineHeight = textFontSize * 1.2

            // Calculate text dimensions
            const maxLineWidth = Math.max(...lines.map(line => drawCtx.measureText(line).width))
            const totalHeight = lines.length * lineHeight

            // Calculate starting position based on alignment
            let startX = 0
            switch (textAlign) {
                case "left":
                    startX = 20
                    break
                case "center":
                    startX = (canvas.width - maxLineWidth) / 2
                    break
                case "right":
                    startX = canvas.width - maxLineWidth - 20
                    break
            }

            const startY = (canvas.height - totalHeight) / 2 + textFontSize

            // Handle different text animations
            switch (textAnimation) {
                case "static":
                    lines.forEach((line, lineIndex) => {
                        const lineWidth = drawCtx.measureText(line).width
                        let xPos = startX
                        if (textAlign === "center") {
                            xPos = (canvas.width - lineWidth) / 2
                        } else if (textAlign === "right") {
                            xPos = canvas.width - lineWidth - 20
                        }
                        
                        const yPos = startY + lineIndex * lineHeight
                        
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i]
                            if (char !== " ") {
                                const charX = xPos + drawCtx.measureText(line.substring(0, i)).width
                                const color = getCharacterColor(charX, yPos, canvas.width, canvas.height)
                                
                                if (enableCharacterAnimation) {
                                    drawAnimatedChar(drawCtx, char, charX, yPos, color, textFontSize)
                                } else {
                                    drawCtx.fillStyle = color
                                    drawCtx.fillText(char, charX, yPos)
                                }
                            }
                        }
                    })
                    break

                case "scroll":
                    const scrollY = startY + textScrollOffsetRef.current
                    lines.forEach((line, lineIndex) => {
                        const lineWidth = drawCtx.measureText(line).width
                        let xPos = startX
                        if (textAlign === "center") {
                            xPos = (canvas.width - lineWidth) / 2
                        } else if (textAlign === "right") {
                            xPos = canvas.width - lineWidth - 20
                        }
                        
                        let yPos = scrollY + lineIndex * lineHeight
                        
                        // Wrap around
                        if (yPos > canvas.height + lineHeight) {
                            yPos -= totalHeight + canvas.height + lineHeight * 2
                        }
                        
                        if (yPos > -lineHeight && yPos < canvas.height + lineHeight) {
                            for (let i = 0; i < line.length; i++) {
                                const char = line[i]
                                if (char !== " ") {
                                    const charX = xPos + drawCtx.measureText(line.substring(0, i)).width
                                    const color = getCharacterColor(charX, yPos, canvas.width, canvas.height)
                                    
                                    if (enableCharacterAnimation) {
                                        drawAnimatedChar(drawCtx, char, charX, yPos, color, textFontSize)
                                    } else {
                                        drawCtx.fillStyle = color
                                        drawCtx.fillText(char, charX, yPos)
                                    }
                                }
                            }
                        }
                    })
                    textScrollOffsetRef.current -= 1
                    break

                case "typewriter":
                    const fullText = lines.join("\n")
                    const visibleLength = Math.floor(typewriterIndexRef.current)
                    let charCount = 0
                    
                    lines.forEach((line, lineIndex) => {
                        const lineWidth = drawCtx.measureText(line).width
                        let xPos = startX
                        if (textAlign === "center") {
                            xPos = (canvas.width - lineWidth) / 2
                        } else if (textAlign === "right") {
                            xPos = canvas.width - lineWidth - 20
                        }
                        
                        const yPos = startY + lineIndex * lineHeight
                        
                        for (let i = 0; i < line.length; i++) {
                            if (charCount >= visibleLength) break
                            
                            const char = line[i]
                            if (char !== " ") {
                                const charX = xPos + drawCtx.measureText(line.substring(0, i)).width
                                const color = getCharacterColor(charX, yPos, canvas.width, canvas.height)
                                
                                if (enableCharacterAnimation) {
                                    drawAnimatedChar(drawCtx, char, charX, yPos, color, textFontSize)
                                } else {
                                    drawCtx.fillStyle = color
                                    drawCtx.fillText(char, charX, yPos)
                                }
                            }
                            charCount++
                        }
                        charCount++ // Count newline
                    })
                    
                    typewriterIndexRef.current += 0.5
                    if (typewriterIndexRef.current > fullText.length + 30) {
                        typewriterIndexRef.current = 0
                    }
                    break

                case "wave":
                    lines.forEach((line, lineIndex) => {
                        const lineWidth = drawCtx.measureText(line).width
                        let xPos = startX
                        if (textAlign === "center") {
                            xPos = (canvas.width - lineWidth) / 2
                        } else if (textAlign === "right") {
                            xPos = canvas.width - lineWidth - 20
                        }
                        
                        const baseY = startY + lineIndex * lineHeight
                        
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i]
                            if (char !== " ") {
                                const charX = xPos + drawCtx.measureText(line.substring(0, i)).width
                                const waveY = baseY + Math.sin(charX * 0.02 + waveOffsetRef.current) * 20
                                const color = getCharacterColor(charX, waveY, canvas.width, canvas.height)
                                
                                if (enableCharacterAnimation) {
                                    drawAnimatedChar(drawCtx, char, charX, waveY, color, textFontSize)
                                } else {
                                    drawCtx.fillStyle = color
                                    drawCtx.fillText(char, charX, waveY)
                                }
                            }
                        }
                    })
                    waveOffsetRef.current += 0.1
                    break
            }

            drawCtx.globalCompositeOperation = "source-over"
        }

        const animate = () => {
            updateFPS()
            animationTimeRef.current += 0.016 // Approximate frame time
            
            // Draw to offscreen canvas first
            const drawCtx = offscreenCtxRef.current
            if (!drawCtx) return

            switch (pattern) {
                case "matrix":
                    drawMatrix(drawCtx)
                    break
                case "wave":
                    drawWave(drawCtx)
                    break
                case "spiral":
                    drawSpiral(drawCtx)
                    break
                case "random":
                    drawRandom(drawCtx)
                    break
                case "rain":
                    drawRain(drawCtx)
                    break
                case "custom":
                    drawCustom(drawCtx)
                    break
                case "image":
                    drawImage(drawCtx)
                    break
                case "text":
                    drawText(drawCtx)
                    break
            }

            // Copy offscreen canvas to visible canvas
            if (offscreenCanvasRef.current) {
                ctx.drawImage(offscreenCanvasRef.current, 0, 0)
            }

            animationRef.current = setTimeout(() => {
                requestAnimationFrame(animate)
            }, 1000 / speed)
        }

        animate()

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current)
            }
            window.removeEventListener("resize", resizeCanvas)
        }
    }, [pattern, characters, speed, density, colorScheme, backgroundColor, textColor, font, customPattern, imageThreshold, blendMode, performanceMode, isStatic, props.characterColorMode, props.gradientStartColor, props.gradientEndColor, enableCharacterAnimation, animationType, animationSpeed, animationIntensity, textInput, textAnimation, textSize, textAlign])

    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    backgroundColor: colors.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.text,
                    ...font,
                }}
            >
                ASCII Pattern Preview
            </div>
        )
    }

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <canvas
                ref={canvasRef}
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            {showFPS && (
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "#00FF00",
                        padding: "5px 10px",
                        borderRadius: 4,
                        fontFamily: "monospace",
                        fontSize: 12,
                        pointerEvents: "none",
                    }}
                >
                    FPS: {currentFPS}
                </div>
            )}
        </div>
    )
}

addPropertyControls(AsciiPattern, {
    pattern: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["matrix", "wave", "spiral", "random", "rain", "custom", "image", "text"],
        optionTitles: ["Matrix", "Wave", "Spiral", "Random", "Rain", "Custom", "Image", "Text"],
        defaultValue: "matrix",
        displaySegmentedControl: false,
    },
    customPattern: {
        type: ControlType.String,
        title: "Custom Pattern",
        defaultValue: "  /\\_/\\\n ( o.o )\n  > ^ <",
        displayTextArea: true,
        placeholder: "Enter ASCII art...",
        hidden: ({ pattern }) => pattern !== "custom",
    },
    imageMask: {
        type: ControlType.ResponsiveImage,
        title: "Image Mask",
        hidden: ({ pattern }) => pattern !== "image",
    },
    imageThreshold: {
        type: ControlType.Number,
        title: "Threshold",
        defaultValue: 128,
        min: 0,
        max: 255,
        step: 1,
        hidden: ({ pattern }) => pattern !== "image",
    },
    textInput: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HELLO",
        displayTextArea: true,
        placeholder: "Enter your text...",
        hidden: ({ pattern }) => pattern !== "text",
    },
    textAnimation: {
        type: ControlType.Enum,
        title: "Text Animation",
        options: ["static", "scroll", "typewriter", "wave"],
        optionTitles: ["Static", "Scroll", "Typewriter", "Wave"],
        defaultValue: "static",
        displaySegmentedControl: true,
        hidden: ({ pattern }) => pattern !== "text",
    },
    textSize: {
        type: ControlType.Enum,
        title: "Text Size",
        options: ["small", "medium", "large"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "medium",
        displaySegmentedControl: true,
        hidden: ({ pattern }) => pattern !== "text",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: ({ pattern }) => pattern !== "text",
    },
    characterSet: {
        type: ControlType.Enum,
        title: "Character Set",
        options: ["binary", "numeric", "alphanumeric", "symbols", "blocks", "custom"],
        optionTitles: ["Binary (01)", "Numeric (0-9)", "Alphanumeric", "Symbols", "Blocks", "Custom"],
        defaultValue: "binary",
        displaySegmentedControl: false,
    },
    customCharacters: {
        type: ControlType.String,
        title: "Custom Chars",
        defaultValue: "01",
        placeholder: "Enter characters...",
        hidden: ({ characterSet }) => characterSet !== "custom",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 50,
        min: 1,
        max: 120,
        step: 1,
        unit: "fps",
        displayStepper: false,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        defaultValue: 20,
        min: 1,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ pattern }) => pattern !== "random",
    },
    colorScheme: {
        type: ControlType.Enum,
        title: "Color Scheme",
        options: ["matrix", "retro", "ocean", "fire", "monochrome", "custom"],
        optionTitles: ["Matrix", "Retro", "Ocean", "Fire", "Monochrome", "Custom"],
        defaultValue: "matrix",
        displaySegmentedControl: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: ({ colorScheme }) => colorScheme !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#00FF00",
        hidden: ({ colorScheme }) => colorScheme !== "custom",
    },
    characterColorMode: {
        type: ControlType.Enum,
        title: "Character Color",
        options: ["solid", "gradient", "rainbow", "random"],
        optionTitles: ["Solid", "Gradient", "Rainbow", "Random"],
        defaultValue: "solid",
        displaySegmentedControl: true,
    },
    gradientStartColor: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#00FF00",
        hidden: ({ characterColorMode }) => characterColorMode !== "gradient",
    },
    gradientEndColor: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#0000FF",
        hidden: ({ characterColorMode }) => characterColorMode !== "gradient",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["normal", "multiply", "screen", "overlay", "difference", "lighten", "darken", "color-dodge", "color-burn", "hard-light", "soft-light", "exclusion"],
        optionTitles: ["Normal", "Multiply", "Screen", "Overlay", "Difference", "Lighten", "Darken", "Color Dodge", "Color Burn", "Hard Light", "Soft Light", "Exclusion"],
        defaultValue: "normal",
        displaySegmentedControl: false,
    },
    performanceMode: {
        type: ControlType.Enum,
        title: "Performance",
        options: ["quality", "balanced", "performance"],
        optionTitles: ["Quality", "Balanced", "Performance"],
        defaultValue: "balanced",
        displaySegmentedControl: true,
    },
    showFPS: {
        type: ControlType.Boolean,
        title: "Show FPS",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableCharacterAnimation: {
        type: ControlType.Boolean,
        title: "Character Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["fade", "scale", "rotate", "pulse", "wave-scale", "combined"],
        optionTitles: ["Fade", "Scale", "Rotate", "Pulse", "Wave Scale", "Combined"],
        defaultValue: "fade",
        displaySegmentedControl: false,
        hidden: ({ enableCharacterAnimation }) => !enableCharacterAnimation,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: false,
        hidden: ({ enableCharacterAnimation }) => !enableCharacterAnimation,
    },
    animationIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
        displayStepper: false,
        hidden: ({ enableCharacterAnimation }) => !enableCharacterAnimation,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
        },
    },
})