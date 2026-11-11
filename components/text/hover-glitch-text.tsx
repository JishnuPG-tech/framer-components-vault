import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
// Import necessary types and hooks from framer
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"

// --- Interfaces & Types ---
interface RGB {
    r: number
    g: number
    b: number
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    life: number
    maxLife: number
    // Added to store initial color for fire effect fading
    initialColor: RGB
    // Added for turbulence
    turbulenceOffset: number
}
interface WordBoundary {
    index: number
    text: string
    startIndex: number
    endIndex: number
    x: number
    width: number
}
// Updated ParticleShape Type
type ParticleShape =
    | "Square"
    | "Circle"
    | "Triangle"
    | "Star"
    | "Line"
    | "Ring"
    | "Cross"
    | "Heart"
    | "Polygon"
    | "Diamond"
    | "Ellipse"
    | "Pentagon"
    | "Ghost" // Added Pentagon
    | "Image"

type TextFontType = Font | FontStyle

interface FontStyle {
    fontFamily: string
    fontWeight: string | number
    fontStyle: "normal" | "italic"
    letterSpacing: string | number
    lineHeight: string | number
    textAlign: "left" | "center" | "right" | "justify"
    textDecoration: "none" | "underline" | "line-through"
}

// --- Bundled Native Web Audio FM Synthesizer (Zero External Dependencies) ---
const NOTE_FREQS: { [key: string]: number } = {
    C: 0,
    "C#": 1,
    DB: 1,
    D: 2,
    "D#": 3,
    EB: 3,
    E: 4,
    F: 5,
    "F#": 6,
    GB: 6,
    G: 7,
    "G#": 8,
    AB: 8,
    A: 9,
    "A#": 10,
    BB: 10,
    B: 11,
}

function noteToFrequency(note: string): number {
    const match = note
        .trim()
        .toUpperCase()
        .match(/^([A-G][#B]?)(-?\d+)$/)
    if (!match) return 440
    const semitone = NOTE_FREQS[match[1]] ?? 0
    const octave = parseInt(match[2], 10)
    const midi = (octave + 1) * 12 + semitone
    return 440 * Math.pow(2, (midi - 69) / 12)
}

class BundledFMSynth {
    private ctx: AudioContext | null = null

    constructor() {
        if (typeof window !== "undefined") {
            const AudioCtx =
                window.AudioContext || (window as any).webkitAudioContext
            if (AudioCtx) {
                try {
                    this.ctx = new AudioCtx()
                } catch (e) {
                    console.error("AudioContext init error:", e)
                }
            }
        }
    }

    public async resume() {
        if (this.ctx && this.ctx.state === "suspended") {
            try {
                await this.ctx.resume()
            } catch (e) {
                console.error("AudioContext resume error:", e)
            }
        }
    }

    public triggerNote(
        note: string,
        durationSeconds: number = 0.15,
        timeOffsetSeconds: number = 0
    ) {
        if (!this.ctx || this.ctx.state === "closed") return
        try {
            const freq = noteToFrequency(note)
            const now = this.ctx.currentTime + timeOffsetSeconds

            const carrier = this.ctx.createOscillator()
            const modulator = this.ctx.createOscillator()
            const modGain = this.ctx.createGain()
            const mainGain = this.ctx.createGain()

            carrier.type = "sine"
            carrier.frequency.setValueAtTime(freq, now)

            modulator.type = "sawtooth"
            modulator.frequency.setValueAtTime(freq * 2, now)

            modGain.gain.setValueAtTime(freq * 0.5, now)
            modGain.gain.exponentialRampToValueAtTime(
                0.01,
                now + durationSeconds
            )

            modulator.connect(modGain)
            modGain.connect(carrier.frequency)

            mainGain.gain.setValueAtTime(0.12, now)
            mainGain.gain.exponentialRampToValueAtTime(
                0.001,
                now + durationSeconds
            )

            carrier.connect(mainGain)
            mainGain.connect(this.ctx.destination)

            carrier.start(now)
            modulator.start(now)
            carrier.stop(now + durationSeconds)
            modulator.stop(now + durationSeconds)
        } catch (e) {
            console.error("Synth triggerNote error:", e)
        }
    }

    public dispose() {
        if (this.ctx && this.ctx.state !== "closed") {
            try {
                this.ctx.close().catch(() => {})
            } catch (e) {}
            this.ctx = null
        }
    }
}

// --- Memory-Optimized Singletons & Pools ---
const colorCache = new Map<string, RGB>()

// Helper to parse color strings with memory caching
const parseColor = (color: string): RGB => {
    if (!color) return { r: 0, g: 0, b: 0 }
    const cached = colorCache.get(color)
    if (cached) return cached

    let r = 0,
        g = 0,
        b = 0
    if (color.startsWith("#")) {
        let hex = color.slice(1)
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        }
        const val = parseInt(hex, 16)
        if (!isNaN(val)) {
            r = (val >> 16) & 255
            g = (val >> 8) & 255
            b = val & 255
        }
    } else if (color.startsWith("rgb")) {
        const parts = color
            .substring(color.indexOf("(") + 1, color.indexOf(")"))
            .split(",")
        r = parseInt(parts[0], 10) || 0
        g = parseInt(parts[1], 10) || 0
        b = parseInt(parts[2], 10) || 0
    }
    const result: RGB = { r, g, b }
    colorCache.set(color, result)
    return result
}

// Helper for color interpolation
const lerpColor = (color1: RGB, color2: RGB, t: number): RGB => {
    return {
        r: color1.r + (color2.r - color1.r) * t,
        g: color1.g + (color2.g - color1.g) * t,
        b: color1.b + (color2.b - color1.b) * t,
    }
}

// Particle Object Pool to prevent garbage collection spikes & memory bloat
const particlePool: Particle[] = []

const acquireParticle = (
    startX: number,
    startY: number,
    colors: string[],
    minSize: number,
    maxSize: number,
    fireEffectEnabled: boolean,
    fireUpwardSpeed: number,
    fireMinLifespan: number,
    fireMaxLifespan: number
): Particle => {
    let angle: number, speed: number, vy: number, vx: number, maxLife: number

    if (fireEffectEnabled) {
        angle = Math.PI * 1.2 + Math.random() * Math.PI * 0.6
        speed = Math.random() * (fireUpwardSpeed * 0.5) + fireUpwardSpeed * 0.5
        vx = Math.cos(angle) * speed * 0.5
        vy = Math.sin(angle) * speed
        maxLife =
            Math.random() * (fireMaxLifespan - fireMinLifespan) +
            fireMinLifespan
    } else {
        angle = Math.random() * Math.PI * 2
        speed = Math.random() * 2 + 0.5
        vx = Math.cos(angle) * speed
        vy = Math.sin(angle) * speed
        maxLife = Math.random() * 60 + 30
    }

    const color = colors[Math.floor(Math.random() * colors.length)] || "#ffffff"
    const sizeRange = Math.max(0, maxSize - minSize)
    const size = Math.random() * sizeRange + minSize
    const initialColor = parseColor(color)
    const turbulenceOffset = Math.random() * Math.PI * 2

    const p = particlePool.pop()
    if (p) {
        p.x = startX
        p.y = startY
        p.vx = vx
        p.vy = vy
        p.size = size
        p.color = color
        p.life = 0
        p.maxLife = maxLife
        p.initialColor.r = initialColor.r
        p.initialColor.g = initialColor.g
        p.initialColor.b = initialColor.b
        p.turbulenceOffset = turbulenceOffset
        return p
    }

    return {
        x: startX,
        y: startY,
        vx,
        vy,
        size,
        color,
        life: 0,
        maxLife,
        initialColor: { ...initialColor },
        turbulenceOffset,
    }
}

const releaseParticle = (p: Particle) => {
    if (particlePool.length < 1000) {
        particlePool.push(p)
    }
}

// Single reusable measurement canvas to prevent DOM allocation leaks
let sharedMeasureCanvas: HTMLCanvasElement | null = null
let sharedMeasureCtx: CanvasRenderingContext2D | null = null

function getMeasureCtx(): CanvasRenderingContext2D | null {
    if (typeof document === "undefined") return null
    if (!sharedMeasureCanvas) {
        sharedMeasureCanvas = document.createElement("canvas")
        sharedMeasureCtx = sharedMeasureCanvas.getContext("2d")
    }
    return sharedMeasureCtx
}

// --- Component Styles ---
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: "relative",
        display: "block",
        cursor: "pointer",
        verticalAlign: "top",
        width: "400px",
        height: "100px",
        overflow: "hidden",
    },
    input: {
        padding: "12px 15px",
        border: "2px solid transparent",
        borderRadius: "4px",
        fontSize: "inherit",
        outline: "none",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: "inherit",
        caretColor: "#333",
        resize: "none",
        cursor: "pointer",
        backgroundColor: "transparent",
        fontWeight: "inherit",
        fontStyle: "inherit",
        letterSpacing: "inherit",
        lineHeight: "inherit",
        textAlign: "inherit",
    },
    canvas: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
    },
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 */
export default function HoverGlitchText(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = isStaticRenderer || isOnCanvas

    const {
        text,
        placeholder,
        style,
        textFont,
        fontSize,
        glitchColor1,
        glitchColor2,
        glitchColor3,
        normalColor,
        particleCount,
        textBorderEnabled,
        textBorderColor,
        textBorderWidth,
        particleBorderEnabled,
        particleBorderColor,
        particleBorderWidth,
        particleShape,
        minParticleSize,
        maxParticleSize,
        particleImage,
        inputBackgroundColor,
        soundEnabled,
        soundBPM,
        soundNoteCount,
        soundNotePool,
        wordGlitchEnabled,
        wordGlitchIntensity,
        shakeEnabled,
        shakeIntensity,
        fireEffectEnabled,
        fireEmissionRate,
        fireUpwardSpeed,
        fireTurbulenceMagnitude,
        fireTurbulenceFrequency,
        fireShrinkSpeed,
        fireMinLifespan,
        fireMaxLifespan,
        isEditable,
    } = props

    // Ref to track latest props without recreating animation callback
    const propsRef = useRef(props)
    propsRef.current = props

    // --- State Hooks ---
    const [isHovered, setIsHovered] = useState(false)
    const [hoveredWord, setHoveredWord] = useState<WordBoundary | null>(null)
    const [inputValue, setInputValue] = useState(text)
    const [wordBoundaries, setWordBoundaries] = useState<WordBoundary[]>([])
    const [loadedParticleImage, setLoadedParticleImage] =
        useState<HTMLImageElement | null>(null)
    const [isVisible, setIsVisible] = useState(true)
    const [audioReady, setAudioReady] = useState(false)

    // Cached layout metrics to avoid getBoundingClientRect() during animation frame
    const layoutRef = useRef({
        width: 400,
        height: 100,
        dpr: 1,
        paddingTop: 12,
        paddingLeft: 15,
        paddingRight: 15,
        inputHeight: 100,
    })

    // --- Refs ---
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const animationFrameRef = useRef<number | null>(null)
    const particlesRef = useRef<Particle[]>([])
    const hoveredWordRef = useRef<WordBoundary | null>(null)
    const isHoveredRef = useRef(false)
    const isVisibleRef = useRef(true)
    const wordBoundariesRef = useRef<WordBoundary[]>([])
    const synthRef = useRef<BundledFMSynth | null>(null)
    const lastPlayedWordIndexRef = useRef<number | null>(null)
    const loadedImageRef = useRef<HTMLImageElement | null>(null)
    const shakeControls = useAnimation()

    // Measure layout metrics without layout thrashing
    const updateLayoutMetrics = useCallback(() => {
        if (isStatic) return
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        const inputStyle =
            inputRef.current && typeof window !== "undefined"
                ? window.getComputedStyle(inputRef.current)
                : null
        const paddingTop = inputStyle
            ? parseFloat(inputStyle.paddingTop) || 12
            : 12
        const paddingLeft = inputStyle
            ? parseFloat(inputStyle.paddingLeft) || 15
            : 15
        const paddingRight = inputStyle
            ? parseFloat(inputStyle.paddingRight) || 15
            : 15
        const inputHeight = inputRef.current?.offsetHeight || rect.height || 100

        layoutRef.current = {
            width: rect.width || 400,
            height: rect.height || 100,
            dpr,
            paddingTop,
            paddingLeft,
            paddingRight,
            inputHeight,
        }
    }, [isStatic])

    // --- Effects ---
    useEffect(() => {
        setInputValue(text)
    }, [text])

    // Visibility Observer: Pause animations and shake when scrolled out of viewport
    useEffect(() => {
        if (isStatic) return
        const container = containerRef.current
        if (!container || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                setIsVisible(visible)
                isVisibleRef.current = visible

                if (!visible) {
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current)
                        animationFrameRef.current = null
                    }
                    shakeControls.stop()
                } else if (
                    isHoveredRef.current &&
                    hoveredWordRef.current !== null
                ) {
                    if (!animationFrameRef.current) {
                        animationFrameRef.current =
                            requestAnimationFrame(animateCanvas)
                    }
                }
            },
            { threshold: 0 }
        )

        observer.observe(container)
        return () => observer.disconnect()
    }, [isStatic, shakeControls])

    // Resize observer to update cached layout dimensions
    useEffect(() => {
        if (isStatic) return
        updateLayoutMetrics()
        const container = containerRef.current
        if (!container || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => {
            updateLayoutMetrics()
        })
        ro.observe(container)
        return () => ro.disconnect()
    }, [isStatic, updateLayoutMetrics])

    useEffect(() => {
        if (isStatic) return
        /* Load particle image */
        if (particleImage && particleShape === "Image") {
            let isMounted = true
            const img = new Image()
            img.onload = () => {
                if (isMounted) {
                    setLoadedParticleImage(img)
                    loadedImageRef.current = img
                }
            }
            img.onerror = () => {
                if (isMounted) {
                    setLoadedParticleImage(null)
                    loadedImageRef.current = null
                }
                console.error("Failed to load particle image:", particleImage)
            }
            img.src = particleImage
            return () => {
                isMounted = false
            }
        } else {
            setLoadedParticleImage(null)
            loadedImageRef.current = null
        }
    }, [isStatic, particleImage, particleShape])

    useEffect(() => {
        if (isStatic) return
        /* Calculate word boundaries with shared context */
        const ctx = getMeasureCtx()
        const containerWidth =
            containerRef.current?.offsetWidth || layoutRef.current.width
        if (!ctx || !inputValue || !containerWidth) {
            setWordBoundaries([])
            wordBoundariesRef.current = []
            return
        }
        const currentFontSize = fontSize || 16
        const currentFontFamily =
            textFont?.fontFamily || "'Press Start 2P', monospace"
        const currentFontWeight = textFont?.fontWeight || "normal"
        const currentFontStyle = textFont?.fontStyle || "normal"
        ctx.font = `${currentFontStyle} ${currentFontWeight} ${currentFontSize}px ${currentFontFamily}`

        const paddingLeft = layoutRef.current.paddingLeft || 15
        const words = inputValue.split(/(\s+)/)
        let currentX = paddingLeft
        let charIndex = 0
        const boundaries: WordBoundary[] = []
        let wordIndex = 0

        for (let i = 0; i < words.length; i++) {
            const wordText = words[i]
            const partWidth = ctx.measureText(wordText).width
            if (wordText.trim().length > 0) {
                boundaries.push({
                    index: wordIndex++,
                    text: wordText,
                    startIndex: charIndex,
                    endIndex: charIndex + wordText.length,
                    x: currentX,
                    width: partWidth,
                })
            }
            currentX += partWidth
            charIndex += wordText.length
        }
        setWordBoundaries(boundaries)
        wordBoundariesRef.current = boundaries
    }, [isStatic, inputValue, textFont, fontSize])

    // --- Sound Synthesis Trigger (Native Web Audio) ---
    useEffect(() => {
        if (isStatic) return
        if (
            soundEnabled &&
            audioReady &&
            isVisible &&
            hoveredWord !== null &&
            hoveredWord.index !== lastPlayedWordIndexRef.current
        ) {
            lastPlayedWordIndexRef.current = hoveredWord.index
            if (!synthRef.current) {
                synthRef.current = new BundledFMSynth()
            }
            const synth = synthRef.current
            const notes = soundNotePool
                .split(" ")
                .map((n) => n.trim())
                .filter((n) => n.length > 0)

            if (notes.length > 0) {
                const count = Math.max(1, Math.floor(soundNoteCount))
                const secondsPerBeat = 60 / Math.max(30, soundBPM)
                const noteDuration = secondsPerBeat * 0.25 // 16th note

                for (let i = 0; i < count; i++) {
                    const note = notes[Math.floor(Math.random() * notes.length)]
                    const timeOffset =
                        i * noteDuration * (Math.random() * 0.5 + 0.75)
                    synth.triggerNote(
                        note,
                        noteDuration * (Math.random() * 0.5 + 0.5),
                        timeOffset
                    )
                }
            }
        }
        if (hoveredWord === null) {
            lastPlayedWordIndexRef.current = null
        }
    }, [
        isStatic,
        soundEnabled,
        audioReady,
        isVisible,
        hoveredWord,
        soundBPM,
        soundNoteCount,
        soundNotePool,
    ])

    // --- Animation Loop (Canvas Visuals) - In-Place Zero-Allocation Rendering ---
    const animateCanvas = useCallback(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const currentProps = propsRef.current
        const {
            fontSize,
            textFont,
            glitchColor1,
            glitchColor2,
            glitchColor3,
            particleCount,
            textBorderEnabled,
            textBorderColor,
            textBorderWidth,
            particleBorderEnabled,
            particleBorderColor,
            particleBorderWidth,
            particleShape,
            minParticleSize,
            maxParticleSize,
            wordGlitchEnabled,
            wordGlitchIntensity,
            fireEffectEnabled,
            fireEmissionRate,
            fireUpwardSpeed,
            fireTurbulenceMagnitude,
            fireTurbulenceFrequency,
            fireShrinkSpeed,
            fireMinLifespan,
            fireMaxLifespan,
        } = currentProps

        const currentHoveredWord = hoveredWordRef.current
        const activeBoundaries = wordBoundariesRef.current

        if (
            !isVisibleRef.current ||
            !isHoveredRef.current ||
            currentHoveredWord === null ||
            activeBoundaries.length === 0
        ) {
            const pArr = particlesRef.current
            for (let i = 0; i < pArr.length; i++) {
                releaseParticle(pArr[i])
            }
            pArr.length = 0

            const dpr = layoutRef.current.dpr || 1
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
            animationFrameRef.current = null
            return
        }

        const layout = layoutRef.current
        const width = layout.width
        const height = layout.height
        const dpr = layout.dpr || 1

        const targetW = Math.round(width * dpr)
        const targetH = Math.round(height * dpr)
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW
            canvas.height = targetH
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        ctx.clearRect(0, 0, width, height)

        // Setup Text Drawing
        const paddingTop = layout.paddingTop
        const inputHeight = layout.inputHeight
        const currentFontSize = fontSize || 16
        const currentFontFamily =
            textFont?.fontFamily || "'Press Start 2P', monospace"
        const currentFontWeight = textFont?.fontWeight || "normal"
        const currentFontStyle = textFont?.fontStyle || "normal"
        ctx.font = `${currentFontStyle} ${currentFontWeight} ${currentFontSize}px ${currentFontFamily}`
        const textY = paddingTop + (inputHeight - paddingTop * 2) / 2
        ctx.textBaseline = "middle"
        ctx.textAlign = "left"

        const color1Rgb = parseColor(glitchColor1)
        const color2Rgb = parseColor(glitchColor2)
        const color3Rgb = parseColor(glitchColor3)

        // Draw Word Glitch & Spawning
        const glitchColors = [glitchColor1, glitchColor2, glitchColor3].filter(
            Boolean
        )
        const particleColorsSource = fireEffectEnabled
            ? [glitchColor1, glitchColor2, glitchColor3]
            : glitchColors

        const emissionThreshold = fireEffectEnabled ? fireEmissionRate : 0.15

        for (let b = 0; b < activeBoundaries.length; b++) {
            const boundary = activeBoundaries[b]
            if (
                boundary.index === currentHoveredWord.index &&
                wordGlitchEnabled
            ) {
                let currentWordCharX = boundary.x
                const textLen = boundary.text.length
                for (let i = 0; i < textLen; i++) {
                    const char = boundary.text[i]
                    const charWidth = ctx.measureText(char).width

                    if (
                        particlesRef.current.length < particleCount &&
                        Math.random() < emissionThreshold
                    ) {
                        const spawnX = currentWordCharX + charWidth / 2
                        const spawnY = textY
                        particlesRef.current.push(
                            acquireParticle(
                                spawnX,
                                spawnY,
                                particleColorsSource,
                                minParticleSize,
                                maxParticleSize,
                                fireEffectEnabled,
                                fireUpwardSpeed,
                                fireMinLifespan,
                                fireMaxLifespan
                            )
                        )
                    }

                    // Glitch text drawing
                    for (let j = 0; j < 3; j++) {
                        const offX = (Math.random() - 0.5) * wordGlitchIntensity
                        const offY = (Math.random() - 0.5) * wordGlitchIntensity
                        const col =
                            glitchColors[
                                Math.floor(Math.random() * glitchColors.length)
                            ]
                        ctx.save()
                        if (Math.random() < 0.4) {
                            const clipX =
                                boundary.x +
                                (Math.random() - 0.5) * boundary.width * 0.5
                            const clipW =
                                Math.random() * boundary.width * 0.7 +
                                boundary.width * 0.1
                            ctx.beginPath()
                            ctx.rect(clipX, 0, clipW, height)
                            ctx.clip()
                        }
                        if (textBorderEnabled) {
                            ctx.strokeStyle = textBorderColor
                            ctx.lineWidth = Math.max(0.1, textBorderWidth * 0.5)
                            ctx.strokeText(
                                char,
                                currentWordCharX + offX,
                                textY + offY
                            )
                        }
                        ctx.fillStyle = col
                        ctx.fillText(
                            char,
                            currentWordCharX + offX,
                            textY + offY
                        )
                        ctx.restore()
                    }
                    currentWordCharX += charWidth
                }
            }
        }

        // Update Particles In-Place (Zero Allocation Loop)
        const particles = particlesRef.current
        const loadedImg = loadedImageRef.current

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]

            if (fireEffectEnabled) {
                p.vx +=
                    Math.sin(
                        p.life * fireTurbulenceFrequency + p.turbulenceOffset
                    ) * fireTurbulenceMagnitude
                p.vy +=
                    Math.cos(
                        p.life * fireTurbulenceFrequency * 0.5 +
                            p.turbulenceOffset
                    ) *
                        fireTurbulenceMagnitude *
                        0.5 +
                    0.01

                p.size = Math.max(0, p.size * (1 - fireShrinkSpeed))

                const lifeRatio = p.life / p.maxLife
                const alpha = Math.max(0, 1 - lifeRatio) * 0.8

                let r = color1Rgb.r,
                    g = color1Rgb.g,
                    b = color1Rgb.b
                if (lifeRatio <= 0.5) {
                    const t = lifeRatio / 0.5
                    r = color1Rgb.r + (color2Rgb.r - color1Rgb.r) * t
                    g = color1Rgb.g + (color2Rgb.g - color1Rgb.g) * t
                    b = color1Rgb.b + (color2Rgb.b - color1Rgb.b) * t
                } else {
                    const t = (lifeRatio - 0.5) / 0.5
                    r = color2Rgb.r + (color3Rgb.r - color2Rgb.r) * t
                    g = color2Rgb.g + (color3Rgb.g - color2Rgb.g) * t
                    b = color2Rgb.b + (color3Rgb.b - color2Rgb.b) * t
                }
                p.color = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`
            } else {
                p.vy += 0.02
                p.size = Math.max(0, p.size * 0.99)
            }

            p.x += p.vx
            p.y += p.vy
            p.life += 1

            // Removal Check
            if (
                p.life >= p.maxLife ||
                p.size <= 0.1 ||
                p.x <= -p.size ||
                p.x >= width + p.size ||
                p.y <= -p.size ||
                p.y >= height + p.size
            ) {
                releaseParticle(p)
                particles[i] = particles[particles.length - 1]
                particles.pop()
                continue
            }

            // Draw Particle
            ctx.save()
            if (!fireEffectEnabled) {
                ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife) * 0.8
            }

            if (particleShape === "Image" && loadedImg) {
                try {
                    const drawX = p.x - p.size / 2
                    const drawY = p.y - p.size / 2
                    ctx.drawImage(loadedImg, drawX, drawY, p.size, p.size)
                    if (particleBorderEnabled && !fireEffectEnabled) {
                        ctx.strokeStyle = particleBorderColor
                        ctx.lineWidth = particleBorderWidth
                        ctx.strokeRect(drawX, drawY, p.size, p.size)
                    }
                } catch {
                    ctx.fillStyle = p.color
                    ctx.fillRect(
                        p.x - p.size / 2,
                        p.y - p.size / 2,
                        p.size,
                        p.size
                    )
                }
            } else {
                ctx.fillStyle = p.color
                if (particleBorderEnabled && !fireEffectEnabled) {
                    ctx.strokeStyle = particleBorderColor
                    ctx.lineWidth = particleBorderWidth
                }

                ctx.beginPath()
                const x = p.x
                const y = p.y
                const size = p.size
                const halfSize = size / 2
                let skippedFillStroke = false

                switch (particleShape) {
                    case "Circle":
                        ctx.arc(x, y, halfSize, 0, Math.PI * 2)
                        break
                    case "Triangle": {
                        const triH = (Math.sqrt(3) / 2) * size
                        ctx.moveTo(x, y - triH / 2)
                        ctx.lineTo(x - halfSize, y + triH / 2)
                        ctx.lineTo(x + halfSize, y + triH / 2)
                        ctx.closePath()
                        break
                    }
                    case "Star": {
                        const outerRadius = halfSize
                        const innerRadius = outerRadius * 0.4
                        const numPoints = 5
                        const angleStep = (Math.PI * 2) / numPoints
                        const startAngle = -Math.PI / 2

                        ctx.moveTo(
                            x + Math.cos(startAngle) * outerRadius,
                            y + Math.sin(startAngle) * outerRadius
                        )

                        for (let k = 0; k < numPoints; k++) {
                            const currentOuterAngle = startAngle + k * angleStep
                            const currentInnerAngle =
                                currentOuterAngle + angleStep / 2

                            ctx.lineTo(
                                x + Math.cos(currentInnerAngle) * innerRadius,
                                y + Math.sin(currentInnerAngle) * innerRadius
                            )

                            const nextOuterAngle =
                                startAngle + (k + 1) * angleStep
                            ctx.lineTo(
                                x + Math.cos(nextOuterAngle) * outerRadius,
                                y + Math.sin(nextOuterAngle) * outerRadius
                            )
                        }
                        ctx.closePath()
                        break
                    }
                    case "Line":
                        ctx.moveTo(x - halfSize, y)
                        ctx.lineTo(x + halfSize, y)
                        if (particleBorderEnabled && !fireEffectEnabled) {
                            ctx.stroke()
                        } else {
                            ctx.strokeStyle = p.color
                            ctx.lineWidth = Math.max(1, size * 0.2)
                            ctx.stroke()
                        }
                        ctx.closePath()
                        skippedFillStroke = true
                        break
                    case "Ring":
                        ctx.arc(x, y, halfSize, 0, Math.PI * 2)
                        if (particleBorderEnabled && !fireEffectEnabled) {
                            ctx.stroke()
                        } else {
                            ctx.strokeStyle = p.color
                            ctx.lineWidth = Math.max(1, size * 0.15)
                            ctx.stroke()
                        }
                        ctx.closePath()
                        skippedFillStroke = true
                        break
                    case "Cross": {
                        const armWidth = size * 0.2
                        ctx.moveTo(x - halfSize, y - armWidth / 2)
                        ctx.lineTo(x - halfSize, y + armWidth / 2)
                        ctx.lineTo(x - armWidth / 2, y + armWidth / 2)
                        ctx.lineTo(x - armWidth / 2, y + halfSize)
                        ctx.lineTo(x + armWidth / 2, y + halfSize)
                        ctx.lineTo(x + armWidth / 2, y + armWidth / 2)
                        ctx.lineTo(x + halfSize, y + armWidth / 2)
                        ctx.lineTo(x + halfSize, y - armWidth / 2)
                        ctx.lineTo(x + armWidth / 2, y - armWidth / 2)
                        ctx.lineTo(x + armWidth / 2, y - halfSize)
                        ctx.lineTo(x - armWidth / 2, y - halfSize)
                        ctx.lineTo(x - armWidth / 2, y - armWidth / 2)
                        ctx.closePath()
                        break
                    }
                    case "Heart": {
                        const topCurveHeight = size * 0.3
                        const bottomCurveHeight = size * 0.7
                        const curveWidth = size * 0.5
                        ctx.moveTo(x, y + topCurveHeight - halfSize)
                        ctx.bezierCurveTo(
                            x,
                            y - halfSize,
                            x - curveWidth,
                            y - halfSize,
                            x - curveWidth,
                            y + topCurveHeight - halfSize
                        )
                        ctx.bezierCurveTo(
                            x - curveWidth,
                            y +
                                (topCurveHeight + bottomCurveHeight * 0.6) -
                                halfSize,
                            x,
                            y +
                                (topCurveHeight + bottomCurveHeight * 0.8) -
                                halfSize,
                            x,
                            y + bottomCurveHeight - halfSize
                        )
                        ctx.bezierCurveTo(
                            x,
                            y +
                                (topCurveHeight + bottomCurveHeight * 0.8) -
                                halfSize,
                            x + curveWidth,
                            y +
                                (topCurveHeight + bottomCurveHeight * 0.6) -
                                halfSize,
                            x + curveWidth,
                            y + topCurveHeight - halfSize
                        )
                        ctx.bezierCurveTo(
                            x + curveWidth,
                            y - halfSize,
                            x,
                            y - halfSize,
                            x,
                            y + topCurveHeight - halfSize
                        )
                        ctx.closePath()
                        break
                    }
                    case "Polygon": {
                        const sides = 6
                        ctx.moveTo(
                            x + halfSize * Math.cos(0),
                            y + halfSize * Math.sin(0)
                        )
                        for (let s = 1; s <= sides; s += 1) {
                            ctx.lineTo(
                                x +
                                    halfSize *
                                        Math.cos((s * 2 * Math.PI) / sides),
                                y +
                                    halfSize *
                                        Math.sin((s * 2 * Math.PI) / sides)
                            )
                        }
                        ctx.closePath()
                        break
                    }
                    case "Diamond":
                        ctx.moveTo(x, y - halfSize)
                        ctx.lineTo(x + halfSize, y)
                        ctx.lineTo(x, y + halfSize)
                        ctx.lineTo(x - halfSize, y)
                        ctx.closePath()
                        break
                    case "Ellipse":
                        ctx.ellipse(
                            x,
                            y,
                            halfSize,
                            halfSize * 0.6,
                            0,
                            0,
                            Math.PI * 2
                        )
                        break
                    case "Pentagon": {
                        const pentagonSides = 5
                        const angleInc = (Math.PI * 2) / pentagonSides
                        ctx.moveTo(
                            x + halfSize * Math.cos(0),
                            y + halfSize * Math.sin(0)
                        )
                        for (let s = 1; s <= pentagonSides; s += 1) {
                            ctx.lineTo(
                                x + halfSize * Math.cos(s * angleInc),
                                y + halfSize * Math.sin(s * angleInc)
                            )
                        }
                        ctx.closePath()
                        break
                    }
                    case "Ghost": {
                        const w = size
                        const h = size * 1.3
                        const headRadius = w / 2
                        const bodyStartY = y - h / 2 + headRadius
                        const eyeRadius = Math.max(1, size * 0.1)
                        const eyeOffsetX = size * 0.2
                        const eyeCenterY = y - h / 2 + headRadius * 0.6
                        const bottomY = y + h / 2
                        const numJaggedPoints = 5
                        const jaggedness = size * 0.15

                        ctx.beginPath()
                        const startX = x - w / 2
                        ctx.moveTo(startX, bottomY)

                        for (let k = 1; k <= numJaggedPoints; k++) {
                            const pointX = startX + (w / numJaggedPoints) * k
                            const pointY =
                                bottomY +
                                (k % 2 === 0 ? -jaggedness : jaggedness * 0.5)
                            ctx.lineTo(pointX, pointY)
                        }
                        const endX = x + w / 2
                        ctx.lineTo(endX, bottomY)
                        ctx.lineTo(endX, bodyStartY)
                        ctx.arc(x, bodyStartY, headRadius, 0, Math.PI, true)
                        ctx.lineTo(startX, bodyStartY)
                        ctx.closePath()

                        ctx.fillStyle = p.color
                        ctx.fill()

                        if (particleBorderEnabled && !fireEffectEnabled) {
                            ctx.lineWidth = Math.min(
                                particleBorderWidth,
                                size * 0.1
                            )
                            ctx.strokeStyle = particleBorderColor
                            ctx.stroke()
                        }

                        const eyeAlpha = fireEffectEnabled ? 0.8 : 1.0
                        ctx.fillStyle = `rgba(30, 30, 30, ${eyeAlpha})`

                        ctx.beginPath()
                        ctx.arc(
                            x - eyeOffsetX,
                            eyeCenterY,
                            eyeRadius,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()

                        ctx.beginPath()
                        ctx.arc(
                            x + eyeOffsetX,
                            eyeCenterY,
                            eyeRadius,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()

                        skippedFillStroke = true
                        break
                    }
                    case "Square":
                    default:
                        ctx.rect(x - halfSize, y - halfSize, size, size)
                        break
                }

                if (!skippedFillStroke) {
                    ctx.fill()
                    if (particleBorderEnabled && !fireEffectEnabled) {
                        ctx.stroke()
                    }
                }
            }
            ctx.restore()
        }

        if (!fireEffectEnabled) {
            ctx.globalAlpha = 1.0
        }

        if (isHoveredRef.current && hoveredWordRef.current !== null) {
            animationFrameRef.current = requestAnimationFrame(animateCanvas)
        } else {
            animationFrameRef.current = null
        }
    }, [isStatic])

    // --- Event Handlers ---
    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (isEditable) {
            setInputValue(ev.target.value)
        }
        setHoveredWord(null)
        hoveredWordRef.current = null
    }

    const handleMouseMove = (ev: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current
        const boundaries = wordBoundariesRef.current
        if (!container || boundaries.length === 0) {
            if (hoveredWordRef.current !== null) {
                setHoveredWord(null)
                hoveredWordRef.current = null
            }
            return
        }
        const rect = container.getBoundingClientRect()
        const mouseX = ev.clientX - rect.left
        let foundWord: WordBoundary | null = null
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (mouseX >= boundary.x && mouseX < boundary.x + boundary.width) {
                foundWord = boundary
                break
            }
        }
        if (hoveredWordRef.current?.index !== foundWord?.index) {
            setHoveredWord(foundWord)
            hoveredWordRef.current = foundWord
            if (foundWord !== null && !animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(animateCanvas)
            }
        }
    }

    const handleMouseEnter = () => {
        setIsHovered(true)
        isHoveredRef.current = true
        updateLayoutMetrics()
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        isHoveredRef.current = false
        setHoveredWord(null)
        hoveredWordRef.current = null
        shakeControls.start({ x: 0, y: 0 })
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (canvas && ctx) {
            const dpr = layoutRef.current.dpr || 1
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        }
        const pArr = particlesRef.current
        for (let i = 0; i < pArr.length; i++) {
            releaseParticle(pArr[i])
        }
        pArr.length = 0
    }

    const handleClick = async () => {
        if (soundEnabled && !audioReady) {
            if (!synthRef.current) {
                synthRef.current = new BundledFMSynth()
            }
            await synthRef.current.resume()
            setAudioReady(true)
        }
        if (isEditable) {
            inputRef.current?.focus()
        }
    }

    // --- Shake Control Loop (Paused when outside viewport) ---
    useEffect(() => {
        if (isStatic) return
        if (isVisible && isHovered && hoveredWord !== null) {
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(animateCanvas)
            }
            if (shakeEnabled) {
                shakeControls.start({
                    x: [
                        0,
                        Math.random() * shakeIntensity - shakeIntensity / 2,
                        0,
                        Math.random() * shakeIntensity - shakeIntensity / 2,
                        0,
                    ],
                    y: [
                        0,
                        Math.random() * shakeIntensity - shakeIntensity / 2,
                        0,
                        Math.random() * shakeIntensity - shakeIntensity / 2,
                        0,
                    ],
                    transition: {
                        duration: 0.15,
                        repeat: Infinity,
                        ease: "linear",
                    },
                })
            }
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            shakeControls.stop()
            shakeControls.start({ x: 0, y: 0 })
            const canvas = canvasRef.current
            const ctx = canvas?.getContext("2d")
            if (canvas && ctx) {
                const dpr = layoutRef.current.dpr || 1
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
            }
            const pArr = particlesRef.current
            for (let i = 0; i < pArr.length; i++) {
                releaseParticle(pArr[i])
            }
            pArr.length = 0
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
            shakeControls.stop()
        }
    }, [
        isStatic,
        isVisible,
        isHovered,
        hoveredWord,
        animateCanvas,
        shakeEnabled,
        shakeIntensity,
        shakeControls,
    ])

    // --- Framer Motion Variants for Input Text Color ---
    const inputVariants = {
        normal: {
            color: normalColor,
            transition: { duration: 0.1, ease: "easeOut" },
        },
        hover: {
            color: hoveredWord !== null ? "transparent" : normalColor,
            transition: { duration: 0.05, ease: "easeIn" },
        },
    }

    // --- Static Renderer Fallback (Framer Canvas, SSR & Export) ---
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...styles.container,
                    fontFamily: textFont?.fontFamily,
                    fontSize: `${fontSize}px`,
                    fontWeight: textFont?.fontWeight,
                    fontStyle: textFont?.fontStyle,
                    lineHeight: textFont?.lineHeight,
                    letterSpacing: textFont?.letterSpacing,
                    textAlign: textFont?.textAlign,
                    backgroundColor: inputBackgroundColor,
                    cursor: isEditable ? "text" : "default",
                    display: "flex",
                    alignItems: "center",
                    ...style,
                }}
            >
                {textFont?.fontFamily &&
                    ![
                        "Arial",
                        "Helvetica",
                        "Verdana",
                        "Georgia",
                        "Times New Roman",
                        "Courier New",
                        "monospace",
                        "sans-serif",
                        "serif",
                    ].includes(textFont.fontFamily) && (
                        <link
                            href={`https://fonts.googleapis.com/css2?family=${textFont.fontFamily.replace(/\s/g, "+")}:wght@${textFont.fontWeight || 400}&display=swap`}
                            rel="stylesheet"
                        />
                    )}
                <div
                    style={{
                        ...styles.input,
                        color: normalColor,
                        display: "flex",
                        alignItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    {inputValue || placeholder}
                </div>
            </div>
        )
    }

    // --- Interactive Component Render ---
    return (
        <motion.div
            ref={containerRef}
            style={{
                ...styles.container,
                fontFamily: textFont?.fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: textFont?.fontWeight,
                fontStyle: textFont?.fontStyle,
                lineHeight: textFont?.lineHeight,
                letterSpacing: textFont?.letterSpacing,
                textAlign: textFont?.textAlign,
                backgroundColor: inputBackgroundColor,
                cursor: isEditable ? "text" : "default",
                ...style,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            animate={shakeControls}
            layout
        >
            {textFont?.fontFamily &&
                ![
                    "Arial",
                    "Helvetica",
                    "Verdana",
                    "Georgia",
                    "Times New Roman",
                    "Courier New",
                    "monospace",
                    "sans-serif",
                    "serif",
                ].includes(textFont.fontFamily) && (
                    <link
                        href={`https://fonts.googleapis.com/css2?family=${textFont.fontFamily.replace(/\s/g, "+")}:wght@${textFont.fontWeight || 400}&display=swap`}
                        rel="stylesheet"
                    />
                )}
            <canvas ref={canvasRef} style={styles.canvas} />
            <motion.input
                ref={inputRef}
                type="text"
                style={{ ...styles.input, color: normalColor }}
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                variants={inputVariants}
                animate={isHovered ? "hover" : "normal"}
                readOnly={!isEditable}
                onClick={(e) => {
                    if (!isEditable) e.preventDefault()
                    handleClick()
                }}
            />
            {soundEnabled && !audioReady && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "4px",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        color: "#aaa",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        padding: "1px 3px",
                        borderRadius: "2px",
                        pointerEvents: "none",
                        opacity: 0.8,
                        zIndex: 3,
                    }}
                >
                    Click to enable sound
                </div>
            )}
        </motion.div>
    )
}

// --- Prop Types Interface ---
interface Props {
    text: string
    placeholder: string
    textFont: TextFontType
    fontSize: number
    glitchColor1: string
    glitchColor2: string
    glitchColor3: string
    normalColor: string
    particleCount: number
    textBorderEnabled: boolean
    textBorderColor: string
    textBorderWidth: number
    particleBorderEnabled: boolean
    particleBorderColor: string
    particleBorderWidth: number
    particleShape: ParticleShape
    minParticleSize: number
    maxParticleSize: number
    particleImage?: string | null
    inputBackgroundColor: string
    soundEnabled: boolean
    soundBPM: number
    soundNoteCount: number
    soundNotePool: string
    wordGlitchEnabled: boolean
    wordGlitchIntensity: number
    shakeEnabled: boolean
    shakeIntensity: number
    fireEffectEnabled: boolean
    fireEmissionRate: number
    fireUpwardSpeed: number
    fireTurbulenceMagnitude: number
    fireTurbulenceFrequency: number
    fireShrinkSpeed: number
    fireMinLifespan: number
    fireMaxLifespan: number
    isEditable: boolean
    style?: React.CSSProperties
}

// --- Default Props ---
HoverGlitchText.defaultProps = {
    text: "BOUNSHY",
    placeholder: "Enter text...",
    textFont: {
        fontFamily: "New Rocker",
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: "normal",
        lineHeight: "normal",
        textAlign: "left",
        textDecoration: "none",
    },
    fontSize: 50,
    glitchColor1: "#FF00AE",
    glitchColor2: "#FF0055",
    glitchColor3: "#FFB726",
    normalColor: "#000000",
    particleCount: 0,
    textBorderEnabled: false,
    textBorderColor: "#000000",
    textBorderWidth: 1,
    particleBorderEnabled: false,
    particleBorderColor: "#000000",
    particleBorderWidth: 1,
    particleShape: "Circle",
    minParticleSize: 0.1,
    maxParticleSize: 0.1,
    particleImage: null,
    inputBackgroundColor: "#FFFFFF",
    soundEnabled: false,
    soundBPM: 120,
    soundNoteCount: 3,
    soundNotePool: "C4 E4 G4 A4",
    wordGlitchEnabled: true,
    wordGlitchIntensity: 3,
    shakeEnabled: false,
    shakeIntensity: 4,
    fireEffectEnabled: false,
    fireEmissionRate: 0.3,
    fireUpwardSpeed: 2.5,
    fireTurbulenceMagnitude: 0.2,
    fireTurbulenceFrequency: 0.2,
    fireShrinkSpeed: 0.04,
    fireMinLifespan: 20,
    fireMaxLifespan: 40,
    isEditable: false,
}

// --- Framer Property Controls - Updated Particle Shape Options ---
const propertyControls: PropertyControls<Props> = {
    // --- 1. Content & Interaction ---
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: HoverGlitchText.defaultProps.text,
    },
    placeholder: {
        title: "Placeholder",
        type: ControlType.String,
        defaultValue: HoverGlitchText.defaultProps.placeholder,
    },
    isEditable: {
        title: "Editable",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.isEditable,
        enabledTitle: "Yes",
        disabledTitle: "No",
        tooltip:
            "Allow direct text input when running the prototype or on a published site.",
    },

    // --- 2. Typography & Base Styling ---
    textFont: {
        title: "Font Style",
        type: ControlType.Font,
        defaultValue: HoverGlitchText.defaultProps.textFont as any,
    },
    fontSize: {
        title: "Font Size",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fontSize,
        min: 8,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    normalColor: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: HoverGlitchText.defaultProps.normalColor,
    },
    inputBackgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: HoverGlitchText.defaultProps.inputBackgroundColor,
    },

    // --- 3. Text Border ---
    textBorderEnabled: {
        title: "Text Border",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.textBorderEnabled,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    textBorderColor: {
        title: "Color", //  ← label in the UI
        type: ControlType.Color, //  ← tell Framer this is a colour picker
        defaultValue: HoverGlitchText.defaultProps.textBorderColor,
        hidden: (props) => !props.textBorderEnabled,
    },
    textBorderWidth: {
        title: "Width",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.textBorderWidth,
        min: 0.1,
        max: 100,
        step: 0.1,
        unit: "px",
        displayStepper: false,
        hidden: (props) => !props.textBorderEnabled,
    },

    // --- 4. Word Glitch Effect ---
    wordGlitchEnabled: {
        title: "Word Glitch",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.wordGlitchEnabled,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    wordGlitchIntensity: {
        title: "Intensity",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.wordGlitchIntensity,
        min: 0,
        max: 20,
        step: 0.5,
        displayStepper: false,
        hidden: (props) => !props.wordGlitchEnabled,
    },
    glitchColor1: {
        title: "Glitch Color 1",
        type: ControlType.Color,
        defaultValue: HoverGlitchText.defaultProps.glitchColor1,
        // Hidden when fire effect is enabled, these colors are used for fire gradient
        hidden: (props) => props.fireEffectEnabled,
    },
    glitchColor2: {
        title: "Glitch Color 2",
        type: ControlType.Color,
        defaultValue: HoverGlitchText.defaultProps.glitchColor2,
        // Hidden when fire effect is enabled, these colors are used for fire gradient
        hidden: (props) => props.fireEffectEnabled,
    },
    glitchColor3: {
        title: "Glitch Color 3",
        type: ControlType.Color,
        defaultValue: HoverGlitchText.defaultProps.glitchColor3,
        // Hidden when fire effect is enabled, these colors are used for fire gradient
        hidden: (props) => props.fireEffectEnabled,
    },

    // --- 5. Particles (Shape, Size & Borders) ---
    particleCount: {
        title: "Max Particles",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.particleCount,
        min: 0,
        max: 500,
        step: 5,
        displayStepper: true,
    },
    particleShape: {
        title: "Particle Shape",
        type: ControlType.Enum,
        options: [
            "Square",
            "Circle",
            "Triangle",
            "Star",
            "Line",
            "Ring",
            "Cross",
            "Heart",
            "Polygon",
            "Diamond",
            "Ellipse",
            "Pentagon",
            "Ghost",
            "Image",
        ],
        defaultValue: HoverGlitchText.defaultProps.particleShape,
        // Hide particle shape control when fire effect is enabled,
        // as certain shapes are more suitable for fire
        hidden: (props) => props.fireEffectEnabled,
    },
    particleImage: {
        title: "Image",
        type: ControlType.File,
        allowedFileTypes: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
        hidden: (props) => props.particleShape !== "Image",
    },
    minParticleSize: {
        title: "Min Size",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.minParticleSize,
        min: 0.1,
        max: 20,
        step: 0.1,
        unit: "px",
        displayStepper: false,
    },
    maxParticleSize: {
        title: "Max Size",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.maxParticleSize,
        min: 0.1,
        max: 100,
        step: 0.1,
        unit: "px",
        displayStepper: false,
    },
    particleBorderEnabled: {
        title: "Particle Border",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.particleBorderEnabled,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
        // Often not needed for fire particles
        hidden: (props) => props.fireEffectEnabled,
    },
    particleBorderColor: {
        title: "Color",
        type: ControlType.Color,
        defaultValue: HoverGlitchText.defaultProps.particleBorderColor,
        hidden: (props) =>
            !props.particleBorderEnabled || props.fireEffectEnabled, // Hidden if border is disabled or fire effect is on
    },
    particleBorderWidth: {
        title: "Width",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.particleBorderWidth,
        min: 0.1,
        max: 100,
        step: 0.1,
        unit: "px",
        displayStepper: false,
        hidden: (props) =>
            !props.particleBorderEnabled || props.fireEffectEnabled, // Hidden if border is disabled or fire effect is on
    },

    // --- 6. Fire Effect ---
    fireEffectEnabled: {
        title: "Fire Effect",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.fireEffectEnabled,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    fireEmissionRate: {
        title: "Emission Rate",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireEmissionRate,
        min: 0.01,
        max: 1.0,
        step: 0.01,
        displayStepper: false,
        hidden: (props) => !props.fireEffectEnabled,
        tooltip:
            "Probability (0 to 1) of a particle spawning per character per frame when hovered.",
    },
    fireUpwardSpeed: {
        title: "Upward Speed",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireUpwardSpeed,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: false,
        hidden: (props) => !props.fireEffectEnabled,
    },
    fireTurbulenceMagnitude: {
        title: "Turbulence Magnitude",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireTurbulenceMagnitude,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        hidden: (props) => !props.fireEffectEnabled,
    },
    fireTurbulenceFrequency: {
        title: "Turbulence Frequency",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireTurbulenceFrequency,
        min: 0.01,
        max: 1,
        step: 0.01,
        displayStepper: false,
        hidden: (props) => !props.fireEffectEnabled,
    },
    fireShrinkSpeed: {
        title: "Shrink Speed",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireShrinkSpeed,
        min: 0.01,
        max: 0.1,
        step: 0.005,
        displayStepper: false,
        hidden: (props) => !props.fireEffectEnabled,
        tooltip: "Rate at which particle size decreases each frame (0 to 1).",
    },
    fireMinLifespan: {
        title: "Min Lifespan",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireMinLifespan,
        min: 1,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.fireEffectEnabled,
    },
    fireMaxLifespan: {
        title: "Max Lifespan",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.fireMaxLifespan,
        min: 1,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.fireEffectEnabled,
    },

    // --- 7. Shake Effect ---
    shakeEnabled: {
        title: "Shake Effect",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.shakeEnabled,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    shakeIntensity: {
        title: "Intensity",
        type: ControlType.Number,
        defaultValue: HoverGlitchText.defaultProps.shakeIntensity,
        min: 0,
        max: 15,
        step: 0.5,
        displayStepper: false,
        hidden: (props) => !props.shakeEnabled,
    },

    // --- 8. Audio / Sound Effect ---
    soundEnabled: {
        title: "Sound Effect",
        type: ControlType.Boolean,
        defaultValue: HoverGlitchText.defaultProps.soundEnabled,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    soundBPM: {
        title: "BPM",
        type: ControlType.Number,
        min: 30,
        max: 300,
        step: 1,
        defaultValue: HoverGlitchText.defaultProps.soundBPM,
        hidden: (props) => !props.soundEnabled,
    },
    soundNoteCount: {
        title: "Note Count",
        type: ControlType.Number,
        min: 1,
        max: 16,
        step: 1,
        defaultValue: HoverGlitchText.defaultProps.soundNoteCount,
        hidden: (props) => !props.soundEnabled,
    },
    soundNotePool: {
        title: "Note Pool",
        type: ControlType.String,
        tooltip: "Space-separated notes (e.g., C4 E4 G#4 Bb5)",
        defaultValue: HoverGlitchText.defaultProps.soundNotePool,
        hidden: (props) => !props.soundEnabled,
    },
}

addPropertyControls(HoverGlitchText, propertyControls)
