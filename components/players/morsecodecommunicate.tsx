// MorseCodeCommunicator - A fully functional Morse code encoder/decoder with interactive input, audio playback, vibration, oscilloscope, practice mode, flash output, and manual telegraph key
import { useEffect, useState, useRef, useCallback, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

// International Morse Code table
const MORSE_CODE_TABLE: Record<string, string> = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
    I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
    Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
    "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
    "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
    ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
    '"': ".-..-.", "$": "...-..-", "@": ".--.-.", " ": "/"
}

const REVERSE_MORSE_TABLE: Record<string, string> = Object.fromEntries(
    Object.entries(MORSE_CODE_TABLE).map(([k, v]) => [v, k])
)

interface MorseCodeCommunicatorProps {
    inputText: string
    wpm: number
    tone: number
    volume: number
    autoPlay: boolean
    showOscilloscope: boolean
    enableVibration: boolean
    enableFlash: boolean
    practiceMode: boolean
    theme: "dark" | "vintage-telegraph" | "minimal"
    dotColor: string
    dashColor: string
    activeColor: string
    backgroundColor: string
    onDecode?: (text: string) => void
    onPlayComplete?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MorseCodeCommunicator(props: MorseCodeCommunicatorProps) {
    const {
        inputText = "HELLO WORLD",
        wpm = 20,
        tone = 700,
        volume = 0.5,
        autoPlay = false,
        showOscilloscope = true,
        enableVibration = false,
        enableFlash = false,
        practiceMode = false,
        theme = "dark",
        dotColor = "#00FF88",
        dashColor = "#00AAFF",
        activeColor = "#FFFF00",
        backgroundColor = "#1a1a1a",
        onDecode,
        onPlayComplete,
    } = props

    // State
    const [morseCode, setMorseCode] = useState<string>("")
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(-1)
    const [decodedText, setDecodedText] = useState("")
    const [practiceInput, setPracticeInput] = useState("")
    const [practiceSequence, setPracticeSequence] = useState("")
    const [isKeyPressed, setIsKeyPressed] = useState(false)
    const [manualMorse, setManualMorse] = useState<string[]>([])
    const [manualDecoded, setManualDecoded] = useState("")
    const [showFlash, setShowFlash] = useState(false)

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null)
    const oscillatorRef = useRef<OscillatorNode | null>(null)
    const gainNodeRef = useRef<GainNode | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number | null>(null)
    const keyPressStartRef = useRef<number>(0)
    const keyReleaseStartRef = useRef<number>(0)
    const manualBufferRef = useRef<string>("")

    // Calculate timing unit in milliseconds based on WPM
    const unitTime = useMemo(() => 1200 / wpm, [wpm])

    // Encode text to Morse code
    const encodeToMorse = useCallback((text: string): string => {
        return text
            .toUpperCase()
            .split("")
            .map(char => MORSE_CODE_TABLE[char] || "")
            .join(" ")
    }, [])

    // Decode Morse to text
    const decodeFromMorse = useCallback((morse: string): string => {
        return morse
            .split(" / ")
            .map(word =>
                word
                    .split(" ")
                    .map(code => REVERSE_MORSE_TABLE[code] || "")
                    .join("")
            )
            .join(" ")
    }, [])

    // Update Morse code when input changes
    useEffect(() => {
        const encoded = encodeToMorse(inputText)
        startTransition(() => setMorseCode(encoded))
    }, [inputText, encodeToMorse])

    // Initialize Audio Context
    useEffect(() => {
        if (typeof window === "undefined") return

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    // Draw oscilloscope
    const drawOscilloscope = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            if (!analyserRef.current) return
            
            animationFrameRef.current = requestAnimationFrame(draw)
            analyserRef.current.getByteTimeDomainData(dataArray)

            ctx.fillStyle = theme === "vintage-telegraph" ? "#2a1810" : backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.lineWidth = 2
            ctx.strokeStyle = activeColor
            ctx.beginPath()

            const sliceWidth = canvas.width / bufferLength
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = (v * canvas.height) / 2

                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }

                x += sliceWidth
            }

            ctx.lineTo(canvas.width, canvas.height / 2)
            ctx.stroke()
        }

        draw()
    }, [activeColor, backgroundColor, theme])

    // Play tone
    const playTone = useCallback((duration: number) => {
        if (!audioContextRef.current) return Promise.resolve()

        return new Promise<void>((resolve) => {
            const ctx = audioContextRef.current!
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()
            const analyser = ctx.createAnalyser()

            oscillator.type = "sine"
            oscillator.frequency.value = tone
            gainNode.gain.value = volume

            oscillator.connect(gainNode)
            gainNode.connect(analyser)
            analyser.connect(ctx.destination)

            oscillatorRef.current = oscillator
            gainNodeRef.current = gainNode
            analyserRef.current = analyser

            if (showOscilloscope) {
                drawOscilloscope()
            }

            oscillator.start()
            oscillator.stop(ctx.currentTime + duration / 1000)

            oscillator.onended = () => {
                resolve()
            }
        })
    }, [tone, volume, showOscilloscope, drawOscilloscope])

    // Vibrate device
    const vibrateDevice = useCallback((pattern: number[]) => {
        if (enableVibration && typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(pattern)
        }
    }, [enableVibration])

    // Flash screen
    const flashScreen = useCallback((duration: number) => {
        if (!enableFlash) return Promise.resolve()

        return new Promise<void>((resolve) => {
            startTransition(() => setShowFlash(true))
            setTimeout(() => {
                startTransition(() => setShowFlash(false))
                resolve()
            }, duration)
        })
    }, [enableFlash])

    // Play Morse code sequence
    const playMorseSequence = useCallback(async (morse: string) => {
        if (!audioContextRef.current) return

        startTransition(() => {
            setIsPlaying(true)
            setCurrentIndex(0)
        })

        const symbols = morse.split("")
        const vibrationPattern: number[] = []

        for (let i = 0; i < symbols.length; i++) {
            startTransition(() => setCurrentIndex(i))

            const symbol = symbols[i]

            if (symbol === ".") {
                // Dot: 1 unit
                vibrationPattern.push(unitTime, unitTime)
                await Promise.all([
                    playTone(unitTime),
                    flashScreen(unitTime)
                ])
                await new Promise(resolve => setTimeout(resolve, unitTime))
            } else if (symbol === "-") {
                // Dash: 3 units
                vibrationPattern.push(unitTime * 3, unitTime)
                await Promise.all([
                    playTone(unitTime * 3),
                    flashScreen(unitTime * 3)
                ])
                await new Promise(resolve => setTimeout(resolve, unitTime))
            } else if (symbol === " ") {
                // Inter-character gap: 3 units (1 already added after symbol)
                await new Promise(resolve => setTimeout(resolve, unitTime * 2))
            } else if (symbol === "/") {
                // Inter-word gap: 7 units
                await new Promise(resolve => setTimeout(resolve, unitTime * 7))
            }
        }

        if (vibrationPattern.length > 0) {
            vibrateDevice(vibrationPattern)
        }

        startTransition(() => {
            setIsPlaying(false)
            setCurrentIndex(-1)
        })

        if (onPlayComplete) {
            onPlayComplete()
        }
    }, [unitTime, playTone, flashScreen, vibrateDevice, onPlayComplete])

    // Auto-play on mount or input change
    useEffect(() => {
        if (autoPlay && morseCode && !practiceMode) {
            playMorseSequence(morseCode)
        }
    }, [autoPlay, morseCode, practiceMode])

    // Generate practice sequence
    const generatePracticeSequence = useCallback(() => {
        const words = ["SOS", "HELLO", "MORSE", "CODE", "TEST", "RADIO", "SIGNAL"]
        const randomWord = words[Math.floor(Math.random() * words.length)]
        const encoded = encodeToMorse(randomWord)
        startTransition(() => {
            setPracticeSequence(encoded)
            setPracticeInput("")
            setDecodedText(randomWord)
        })
        playMorseSequence(encoded)
    }, [encodeToMorse, playMorseSequence])

    // Manual key press handling
    const handleKeyDown = useCallback(() => {
        if (isKeyPressed) return
        
        startTransition(() => setIsKeyPressed(true))
        keyPressStartRef.current = Date.now()
        
        if (keyReleaseStartRef.current > 0) {
            const gapDuration = Date.now() - keyReleaseStartRef.current
            
            if (gapDuration > unitTime * 5) {
                // Word gap
                manualBufferRef.current += " / "
            } else if (gapDuration > unitTime * 2) {
                // Character gap
                manualBufferRef.current += " "
            }
        }

        if (audioContextRef.current) {
            playTone(10000) // Long duration, will be stopped on key up
        }
    }, [isKeyPressed, unitTime, playTone])

    const handleKeyUp = useCallback(() => {
        if (!isKeyPressed) return
        
        startTransition(() => setIsKeyPressed(false))
        keyReleaseStartRef.current = Date.now()
        
        const duration = Date.now() - keyPressStartRef.current
        
        // Stop audio
        if (oscillatorRef.current) {
            oscillatorRef.current.stop()
            oscillatorRef.current = null
        }

        // Classify as dot or dash
        if (duration < unitTime * 2) {
            manualBufferRef.current += "."
        } else {
            manualBufferRef.current += "-"
        }

        // Update manual morse display
        const symbols = manualBufferRef.current.split("")
        startTransition(() => setManualMorse(symbols))

        // Try to decode
        const decoded = decodeFromMorse(manualBufferRef.current)
        startTransition(() => setManualDecoded(decoded))
        
        if (onDecode) {
            onDecode(decoded)
        }
    }, [isKeyPressed, unitTime, decodeFromMorse, onDecode])

    // Cleanup animation frame
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    // Theme styles
    const themeStyles = useMemo(() => {
        switch (theme) {
            case "vintage-telegraph":
                return {
                    bg: "#3a2820",
                    text: "#f5e6d3",
                    border: "#8b6f47",
                    accent: "#d4af37"
                }
            case "minimal":
                return {
                    bg: "#ffffff",
                    text: "#000000",
                    border: "#e0e0e0",
                    accent: "#0066ff"
                }
            default:
                return {
                    bg: backgroundColor,
                    text: "#ffffff",
                    border: "#333333",
                    accent: activeColor
                }
        }
    }, [theme, backgroundColor, activeColor])

    // Render Morse symbols
    const renderMorseSymbols = (morse: string) => {
        const symbols = morse.split("")
        return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {symbols.map((symbol, index) => {
                    const isActive = isPlaying && index === currentIndex
                    
                    if (symbol === ".") {
                        return (
                            <motion.div
                                key={index}
                                animate={{
                                    scale: isActive ? 1.3 : 1,
                                    opacity: isActive ? 1 : 0.8
                                }}
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor: isActive ? activeColor : dotColor,
                                    boxShadow: isActive ? `0 0 20px ${activeColor}` : "none"
                                }}
                            />
                        )
                    } else if (symbol === "-") {
                        return (
                            <motion.div
                                key={index}
                                animate={{
                                    scale: isActive ? 1.3 : 1,
                                    opacity: isActive ? 1 : 0.8
                                }}
                                style={{
                                    width: 36,
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: isActive ? activeColor : dashColor,
                                    boxShadow: isActive ? `0 0 20px ${activeColor}` : "none"
                                }}
                            />
                        )
                    } else if (symbol === " ") {
                        return <div key={index} style={{ width: 16 }} />
                    } else if (symbol === "/") {
                        return <div key={index} style={{ width: 32 }} />
                    }
                    return null
                })}
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                maxHeight: "100vh",
                overflowY: "auto",
                overflowX: "hidden",
                padding: "clamp(12px, 3vh, 20px)",
                backgroundColor: themeStyles.bg,
                color: themeStyles.text,
                borderRadius: "clamp(8px, 2vw, 12px)",
                fontFamily: theme === "vintage-telegraph" ? "Courier New, monospace" : "Inter, sans-serif",
                position: "relative",
                boxSizing: "border-box"
            }}
        >
            {/* Flash overlay */}
            <AnimatePresence>
                {showFlash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "#ffffff",
                            pointerEvents: "none",
                            zIndex: 9999
                        }}
                    />
                )}
            </AnimatePresence>

            {!practiceMode ? (
                <>
                    {/* Text to Morse Mode */}
                    <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                        <h3 style={{ margin: "0 0 clamp(8px, 1vh, 12px) 0", fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 600 }}>
                            Text Input
                        </h3>
                        <div style={{ 
                            padding: "clamp(8px, 2vw, 12px)", 
                            backgroundColor: theme === "minimal" ? "#f5f5f5" : "rgba(255,255,255,0.05)",
                            borderRadius: "clamp(6px, 1.5vw, 8px)",
                            border: `1px solid ${themeStyles.border}`,
                            wordBreak: "break-word",
                            fontSize: "clamp(13px, 3vw, 15px)",
                            minHeight: "clamp(36px, 8vh, 48px)",
                            maxHeight: "clamp(60px, 12vh, 80px)",
                            overflowY: "auto",
                            display: "flex",
                            alignItems: "center"
                        }}>
                            {inputText || "(Enter text in property controls)"}
                        </div>
                    </div>

                    <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                        <h3 style={{ margin: "0 0 clamp(8px, 1vh, 12px) 0", fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 600 }}>
                            Morse Code
                        </h3>
                        <div style={{ 
                            padding: "clamp(10px, 2.5vw, 14px)", 
                            backgroundColor: theme === "minimal" ? "#f5f5f5" : "rgba(0,0,0,0.3)",
                            borderRadius: "clamp(6px, 1.5vw, 8px)",
                            minHeight: "clamp(44px, 10vh, 56px)",
                            maxHeight: "clamp(80px, 15vh, 100px)",
                            display: "flex",
                            alignItems: "center",
                            overflowX: "auto",
                            overflowY: "auto"
                        }}>
                            {renderMorseSymbols(morseCode)}
                        </div>
                    </div>

                    <button
                        onClick={() => playMorseSequence(morseCode)}
                        disabled={isPlaying}
                        style={{
                            padding: "clamp(8px, 2vh, 12px) clamp(16px, 4vw, 24px)",
                            backgroundColor: themeStyles.accent,
                            color: theme === "minimal" ? "#ffffff" : themeStyles.bg,
                            border: "none",
                            borderRadius: "clamp(6px, 1.5vw, 8px)",
                            fontSize: "clamp(13px, 3vw, 15px)",
                            fontWeight: 600,
                            cursor: isPlaying ? "not-allowed" : "pointer",
                            opacity: isPlaying ? 0.5 : 1,
                            marginBottom: "clamp(12px, 2vh, 20px)",
                            width: "100%",
                            maxWidth: 280,
                            touchAction: "manipulation"
                        }}
                    >
                        {isPlaying ? "Playing..." : "Play Morse Code"}
                    </button>

                    {/* Oscilloscope */}
                    {showOscilloscope && (
                        <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                            <h3 style={{ margin: "0 0 clamp(8px, 1vh, 12px) 0", fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 600 }}>
                                Oscilloscope
                            </h3>
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={200}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "clamp(100px, 15vh, 140px)",
                                    aspectRatio: "4 / 1",
                                    backgroundColor: theme === "vintage-telegraph" ? "#2a1810" : "rgba(0,0,0,0.3)",
                                    borderRadius: "clamp(6px, 1.5vw, 8px)",
                                    border: `1px solid ${themeStyles.border}`,
                                    display: "block"
                                }}
                            />
                        </div>
                    )}

                    {/* Manual Telegraph Key */}
                    <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                        <h3 style={{ margin: "0 0 clamp(8px, 1vh, 12px) 0", fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 600 }}>
                            Manual Telegraph Key
                        </h3>
                        <div
                            onMouseDown={handleKeyDown}
                            onMouseUp={handleKeyUp}
                            onMouseLeave={handleKeyUp}
                            onTouchStart={(e) => {
                                e.preventDefault()
                                handleKeyDown()
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault()
                                handleKeyUp()
                            }}
                            style={{
                                width: "100%",
                                height: "clamp(56px, 12vh, 76px)",
                                backgroundColor: isKeyPressed ? activeColor : themeStyles.accent,
                                borderRadius: "clamp(8px, 2vw, 12px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                WebkitTouchCallout: "none",
                                transition: "all 0.1s",
                                transform: isKeyPressed ? "scale(0.95)" : "scale(1)",
                                boxShadow: isKeyPressed ? `0 0 30px ${activeColor}` : "0 4px 12px rgba(0,0,0,0.2)",
                                fontSize: "clamp(13px, 3.5vw, 17px)",
                                fontWeight: 700,
                                color: theme === "minimal" ? "#ffffff" : themeStyles.bg,
                                touchAction: "none"
                            }}
                        >
                            {isKeyPressed ? "SENDING..." : "PRESS & HOLD"}
                        </div>

                        {manualMorse.length > 0 && (
                            <div style={{ marginTop: "clamp(10px, 2vh, 14px)" }}>
                                <div style={{ 
                                    padding: "clamp(10px, 2.5vw, 14px)", 
                                    backgroundColor: theme === "minimal" ? "#f5f5f5" : "rgba(0,0,0,0.3)",
                                    borderRadius: "clamp(6px, 1.5vw, 8px)",
                                    marginBottom: 10,
                                    overflowX: "auto",
                                    maxHeight: "clamp(60px, 10vh, 80px)",
                                    overflowY: "auto"
                                }}>
                                    {renderMorseSymbols(manualMorse.join(""))}
                                </div>
                                <div style={{ 
                                    padding: "clamp(8px, 2vh, 10px)", 
                                    backgroundColor: theme === "minimal" ? "#e8f5e9" : "rgba(0,255,136,0.1)",
                                    borderRadius: "clamp(6px, 1.5vw, 8px)",
                                    fontSize: "clamp(13px, 3vw, 15px)",
                                    fontWeight: 600,
                                    wordBreak: "break-word"
                                }}>
                                    Decoded: {manualDecoded || "(decoding...)"}
                                </div>
                                <button
                                    onClick={() => {
                                        manualBufferRef.current = ""
                                        startTransition(() => {
                                            setManualMorse([])
                                            setManualDecoded("")
                                        })
                                    }}
                                    style={{
                                        marginTop: 10,
                                        padding: "clamp(6px, 1.5vh, 8px) clamp(12px, 3vw, 16px)",
                                        backgroundColor: "transparent",
                                        color: themeStyles.text,
                                        border: `1px solid ${themeStyles.border}`,
                                        borderRadius: "clamp(4px, 1vw, 6px)",
                                        fontSize: "clamp(12px, 2.5vw, 14px)",
                                        cursor: "pointer",
                                        touchAction: "manipulation"
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Practice Mode */}
                    <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                        <h3 style={{ margin: "0 0 clamp(8px, 1vh, 12px) 0", fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 600 }}>
                            Practice Mode
                        </h3>
                        <p style={{ margin: "0 0 clamp(12px, 2vh, 16px) 0", opacity: 0.7, fontSize: "clamp(12px, 2.8vw, 14px)" }}>
                            Listen to the Morse code and type what you hear
                        </p>
                        
                        <button
                            onClick={generatePracticeSequence}
                            disabled={isPlaying}
                            style={{
                                padding: "clamp(8px, 2vh, 12px) clamp(16px, 4vw, 24px)",
                                backgroundColor: themeStyles.accent,
                                color: theme === "minimal" ? "#ffffff" : themeStyles.bg,
                                border: "none",
                                borderRadius: "clamp(6px, 1.5vw, 8px)",
                                fontSize: "clamp(13px, 3vw, 15px)",
                                fontWeight: 600,
                                cursor: isPlaying ? "not-allowed" : "pointer",
                                opacity: isPlaying ? 0.5 : 1,
                                marginBottom: "clamp(12px, 2vh, 16px)",
                                width: "100%",
                                maxWidth: 280,
                                touchAction: "manipulation"
                            }}
                        >
                            {isPlaying ? "Playing..." : "Play Random Sequence"}
                        </button>

                        {practiceSequence && (
                            <>
                                <input
                                    type="text"
                                    value={practiceInput}
                                    onChange={(e) => {
                                        const newValue = e.target.value.toUpperCase()
                                        startTransition(() => setPracticeInput(newValue))
                                    }}
                                    onKeyDown={(e) => {
                                        // Prevent default behavior for space to avoid scrolling
                                        if (e.key === " ") {
                                            e.preventDefault()
                                            const newValue = practiceInput + " "
                                            startTransition(() => setPracticeInput(newValue))
                                        }
                                    }}
                                    placeholder="Type what you heard..."
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    style={{
                                        width: "100%",
                                        padding: "clamp(8px, 2vh, 12px)",
                                        fontSize: "clamp(13px, 3vw, 15px)",
                                        backgroundColor: theme === "minimal" ? "#f5f5f5" : "rgba(255,255,255,0.05)",
                                        color: themeStyles.text,
                                        border: `1px solid ${themeStyles.border}`,
                                        borderRadius: "clamp(6px, 1.5vw, 8px)",
                                        marginBottom: "clamp(12px, 2vh, 16px)",
                                        fontFamily: "inherit",
                                        boxSizing: "border-box",
                                        outline: "none",
                                        WebkitAppearance: "none"
                                    }}
                                />

                                {practiceInput && (
                                    <div style={{
                                        padding: "clamp(8px, 2vh, 12px)",
                                        backgroundColor: practiceInput === decodedText 
                                            ? (theme === "minimal" ? "#e8f5e9" : "rgba(0,255,136,0.1)")
                                            : (theme === "minimal" ? "#ffebee" : "rgba(255,85,136,0.1)"),
                                        borderRadius: "clamp(6px, 1.5vw, 8px)",
                                        fontSize: "clamp(13px, 3vw, 15px)",
                                        fontWeight: 600
                                    }}>
                                        {practiceInput === decodedText ? "✓ Correct!" : "✗ Try again"}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {showOscilloscope && (
                        <div style={{ marginBottom: "clamp(12px, 2vh, 20px)" }}>
                            <h3 style={{ margin: "0 0 clamp(8px, 1vh, 12px) 0", fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 600 }}>
                                Oscilloscope
                            </h3>
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={200}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "clamp(100px, 15vh, 140px)",
                                    aspectRatio: "4 / 1",
                                    backgroundColor: theme === "vintage-telegraph" ? "#2a1810" : "rgba(0,0,0,0.3)",
                                    borderRadius: "clamp(6px, 1.5vw, 8px)",
                                    border: `1px solid ${themeStyles.border}`,
                                    display: "block"
                                }}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

addPropertyControls(MorseCodeCommunicator, {
    inputText: {
        type: ControlType.String,
        title: "Input Text",
        defaultValue: "HELLO WORLD",
        displayTextArea: true
    },
    wpm: {
        type: ControlType.Number,
        title: "WPM",
        defaultValue: 20,
        min: 5,
        max: 40,
        step: 1
    },
    tone: {
        type: ControlType.Number,
        title: "Tone (Hz)",
        defaultValue: 700,
        min: 400,
        max: 1000,
        step: 50,
        unit: "Hz"
    },
    volume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    showOscilloscope: {
        type: ControlType.Boolean,
        title: "Oscilloscope",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide"
    },
    enableVibration: {
        type: ControlType.Boolean,
        title: "Vibration",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableFlash: {
        type: ControlType.Boolean,
        title: "Flash",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    practiceMode: {
        type: ControlType.Boolean,
        title: "Practice Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "vintage-telegraph", "minimal"],
        optionTitles: ["Dark", "Vintage Telegraph", "Minimal"],
        defaultValue: "dark",
        displaySegmentedControl: true
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#00FF88"
    },
    dashColor: {
        type: ControlType.Color,
        title: "Dash Color",
        defaultValue: "#00AAFF"
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#FFFF00"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#1a1a1a"
    },
    onDecode: {
        type: ControlType.EventHandler
    },
    onPlayComplete: {
        type: ControlType.EventHandler
    }
})
