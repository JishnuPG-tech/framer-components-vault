import * as React from "react"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

interface CipherMorphProps {
    text: string
    font?: React.CSSProperties
    alignment: "left" | "center" | "right"
    htmlTag: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"
    color: string
    glowColor: string
    glowBlur: number
    useDualTone: boolean
    scrambleColor: string
    scrambleGlowColor: string
    characterSet:
        | "matrix"
        | "binary"
        | "alphanumeric"
        | "symbols"
        | "katakana"
        | "runes"
        | "custom"
    customChars: string
    preserveSpaces: boolean
    revealMode: "wave" | "scatter" | "typewriter" | "glitch"
    duration: number
    speed: number
    delay: number
    triggerMode: "viewAndHover" | "view" | "hover" | "click" | "loop"
    loopInterval: number
    showCursor: boolean
    cursorChar: string
    cursorBlink: boolean
    cursorAutoHide: boolean
    soundEffect: boolean
    soundVolume: number
    style?: React.CSSProperties
}

const PRESET_CHARS: Record<string, string> = {
    matrix: "0123456789ABCDEF",
    binary: "01",
    alphanumeric:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?~",
    katakana:
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
    runes: "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠵⠾⠯",
}

/**
 * CipherMorph - Kinetic Decryption & Scramble Text
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 440
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CipherMorph(props: CipherMorphProps) {
    const {
        text = "DECRYPTING SYSTEM...",
        font,
        alignment = "left",
        htmlTag = "div",
        color = "#ffffff",
        glowColor = "rgba(0, 255, 128, 0.4)",
        glowBlur = 0,
        useDualTone = true,
        scrambleColor = "#00ff7f",
        scrambleGlowColor = "rgba(0, 255, 127, 0.8)",
        characterSet = "matrix",
        customChars = "",
        preserveSpaces = true,
        revealMode = "wave",
        duration = 1.5,
        speed = 0.5,
        delay = 0,
        triggerMode = "viewAndHover",
        loopInterval = 3.0,
        showCursor = true,
        cursorChar = "█",
        cursorBlink = true,
        cursorAutoHide = true,
        soundEffect = false,
        soundVolume = 0.2,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.3 })
    const isInViewRef = useRef<boolean>(true)

    // Reduced motion tracking (stable ref + state for reactive styles)
    const prefersReducedMotionRef = useRef<boolean>(false)
    const [prefersReducedMotion, setPrefersReducedMotion] =
        useState<boolean>(false)

    // Animation & timer tracking refs
    const rafIdRef = useRef<number | null>(null)
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const lastTickTimeRef = useRef<number>(0)
    const wasInViewRef = useRef<boolean>(false)

    // Invariant buffer, scatter permutation, and glitch thresholds
    const tailCipherRef = useRef<string[]>([])
    const scatterOrderRef = useRef<number[]>([])
    const glitchThresholdsRef = useRef<number[]>([])

    // Render payload state
    const [renderPayload, setRenderPayload] = useState<{
        resolvedText: string
        frontierChar: string
        tailText: string
        scatterChunks?: { text: string; isResolved: boolean }[]
        isComplete: boolean
    }>(() => ({
        resolvedText: text,
        frontierChar: "",
        tailText: "",
        scatterChunks: [{ text, isResolved: true }],
        isComplete: true,
    }))

    const [isAnimating, setIsAnimating] = useState(false)

    // Active character set
    const activeCharset = useMemo(() => {
        if (characterSet === "custom" && customChars.trim().length > 0) {
            return customChars
        }
        return PRESET_CHARS[characterSet] || PRESET_CHARS.matrix
    }, [characterSet, customChars])

    const getRandomGlyph = useCallback(() => {
        return activeCharset[Math.floor(Math.random() * activeCharset.length)]
    }, [activeCharset])

    // Minimal Web Audio click/blip synthesizer (zero external assets)
    const playTickSound = useCallback(() => {
        if (
            !soundEffect ||
            isStatic ||
            prefersReducedMotionRef.current ||
            typeof window === "undefined"
        )
            return
        try {
            if (!audioCtxRef.current) {
                interface WindowWithWebkitAudio extends Window {
                    webkitAudioContext?: typeof AudioContext
                }
                const AudioCtxClass =
                    window.AudioContext ||
                    (window as unknown as WindowWithWebkitAudio)
                        .webkitAudioContext
                if (AudioCtxClass) {
                    audioCtxRef.current = new AudioCtxClass()
                }
            }
            const ctx = audioCtxRef.current
            if (!ctx || ctx.state === "suspended") {
                ctx?.resume()
            }
            if (ctx && ctx.state === "running") {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "sine"
                const now = ctx.currentTime
                osc.frequency.setValueAtTime(1400 + Math.random() * 400, now)
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.03)
                gain.gain.setValueAtTime(soundVolume * 0.15, now)
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.start(now)
                osc.stop(now + 0.035)
            }
        } catch (_) {}
    }, [soundEffect, soundVolume])

    const clearTimers = useCallback(() => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
        }
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current)
            delayTimerRef.current = null
        }
        if (loopTimerRef.current) {
            clearTimeout(loopTimerRef.current)
            loopTimerRef.current = null
        }
    }, [])

    // Smooth Kinetic Animation Engine
    const startScramble = useCallback(() => {
        clearTimers()

        if (isStatic || prefersReducedMotionRef.current) {
            setRenderPayload({
                resolvedText: text,
                frontierChar: "",
                tailText: "",
                scatterChunks: [{ text, isResolved: true }],
                isComplete: true,
            })
            setIsAnimating(false)
            return
        }

        const totalChars = text.length
        if (totalChars === 0) return

        const totalMs = Math.max(duration * 1000, 150)
        // Controlled flip cadence
        const flipInterval = Math.max(35, Math.round(110 - speed * 80))

        // Pre-compute fresh stable cipher tail
        tailCipherRef.current = text.split("").map((ch) => {
            if (preserveSpaces && (ch === " " || ch === "\n" || ch === "\t")) {
                return ch
            }
            return getRandomGlyph()
        })

        // True randomized permutation for scatter mode on every cycle
        const nonSpaceIndices: number[] = []
        for (let i = 0; i < totalChars; i++) {
            if (
                !preserveSpaces ||
                (text[i] !== " " && text[i] !== "\n" && text[i] !== "\t")
            ) {
                nonSpaceIndices.push(i)
            }
        }
        for (let i = nonSpaceIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const temp = nonSpaceIndices[i]
            nonSpaceIndices[i] = nonSpaceIndices[j]
            nonSpaceIndices[j] = temp
        }
        scatterOrderRef.current = nonSpaceIndices

        // Glitch resolve thresholds: distributed across 0.15 to 0.85 progress
        glitchThresholdsRef.current = text.split("").map((_, i) => {
            const base = (i / totalChars) * 0.5 + 0.15
            const jitter = (Math.random() - 0.5) * 0.3
            return Math.min(Math.max(base + jitter, 0.1), 0.85)
        })

        setIsAnimating(true)

        // Set initial frame state based on mode
        if (revealMode === "typewriter") {
            setRenderPayload({
                resolvedText: "",
                frontierChar: showCursor ? cursorChar : getRandomGlyph(),
                tailText: "",
                isComplete: false,
            })
        } else if (revealMode === "wave") {
            setRenderPayload({
                resolvedText: "",
                frontierChar: showCursor ? cursorChar : getRandomGlyph(),
                tailText: tailCipherRef.current.slice(1).join(""),
                isComplete: false,
            })
        } else {
            // Scatter and Glitch both start with full scrambling cipher chunks
            setRenderPayload({
                resolvedText: "",
                frontierChar: "",
                tailText: "",
                scatterChunks: [
                    { text: tailCipherRef.current.join(""), isResolved: false },
                ],
                isComplete: false,
            })
        }

        const executeAnimation = () => {
            const startTime = performance.now()
            lastTickTimeRef.current = startTime
            let lastStepIndex = -1

            const animateFrame = (now: number) => {
                const elapsed = now - startTime
                const progress = Math.min(elapsed / totalMs, 1)

                // Current frontier step
                const currentStep = Math.min(
                    Math.floor(progress * totalChars),
                    totalChars
                )

                const shouldFlip = now - lastTickTimeRef.current >= flipInterval

                if (shouldFlip || currentStep !== lastStepIndex) {
                    lastTickTimeRef.current = now
                    lastStepIndex = currentStep
                    playTickSound()
                }

                // -------------------------------------------------------------
                // 1. SMOOTH WAVE (L-to-R: Invariant string length, zero jitter)
                // -------------------------------------------------------------
                if (revealMode === "wave") {
                    const resolved = text.slice(0, currentStep)
                    let frontier = ""
                    let tail = ""

                    if (currentStep < totalChars) {
                        const targetChar = text[currentStep]
                        if (preserveSpaces && targetChar === " ") {
                            frontier = " "
                        } else {
                            frontier = showCursor
                                ? cursorChar
                                : shouldFlip
                                  ? getRandomGlyph()
                                  : tailCipherRef.current[currentStep]
                        }

                        if (currentStep + 1 < totalChars) {
                            tail = tailCipherRef.current
                                .slice(currentStep + 1)
                                .join("")
                        }
                    }

                    setRenderPayload({
                        resolvedText: resolved,
                        frontierChar: frontier,
                        tailText: tail,
                        isComplete: progress >= 1,
                    })
                }

                // -------------------------------------------------------------
                // 2. SMOOTH SCATTER (Organic non-linear resolve, repeating seamlessly)
                // -------------------------------------------------------------
                else if (revealMode === "scatter") {
                    const totalNonSpaces = scatterOrderRef.current.length
                    const resolvedCount = Math.min(
                        Math.floor(progress * (totalNonSpaces + 1)),
                        totalNonSpaces
                    )

                    const resolvedSet = new Set<number>()
                    for (let i = 0; i < resolvedCount; i++) {
                        resolvedSet.add(scatterOrderRef.current[i])
                    }

                    // Build grouped chunks of resolved vs cipher text to maintain stable DOM
                    const chunks: { text: string; isResolved: boolean }[] = []
                    let currentChunk = ""
                    let currentStatus: boolean | null = null

                    for (let i = 0; i < totalChars; i++) {
                        const isCharResolved =
                            progress >= 1 ||
                            (preserveSpaces && text[i] === " ") ||
                            resolvedSet.has(i)

                        const charToDisplay = isCharResolved
                            ? text[i]
                            : tailCipherRef.current[i]

                        if (currentStatus === null) {
                            currentStatus = isCharResolved
                            currentChunk = charToDisplay
                        } else if (currentStatus === isCharResolved) {
                            currentChunk += charToDisplay
                        } else {
                            chunks.push({
                                text: currentChunk,
                                isResolved: currentStatus,
                            })
                            currentStatus = isCharResolved
                            currentChunk = charToDisplay
                        }
                    }
                    if (currentChunk.length > 0 && currentStatus !== null) {
                        chunks.push({
                            text: currentChunk,
                            isResolved: currentStatus,
                        })
                    }

                    setRenderPayload({
                        resolvedText: "",
                        frontierChar: "",
                        tailText: "",
                        scatterChunks: chunks,
                        isComplete: progress >= 1,
                    })
                }

                // -------------------------------------------------------------
                // 3. SMOOTH TYPEWRITER (Clean progressive decode)
                // -------------------------------------------------------------
                else if (revealMode === "typewriter") {
                    const resolved = text.slice(0, currentStep)
                    let active = ""

                    if (currentStep < totalChars) {
                        const targetChar = text[currentStep]
                        if (preserveSpaces && targetChar === " ") {
                            active = " "
                        } else {
                            active = shouldFlip
                                ? getRandomGlyph()
                                : tailCipherRef.current[currentStep]
                        }
                    }

                    setRenderPayload({
                        resolvedText: resolved,
                        frontierChar: active,
                        tailText: "",
                        isComplete: progress >= 1,
                    })
                }

                // -------------------------------------------------------------
                // 4. CYBER GLITCH (Progressive in-place character reveal)
                // -------------------------------------------------------------
                else {
                    const chunks: { text: string; isResolved: boolean }[] = []
                    let currentChunk = ""
                    let currentStatus: boolean | null = null

                    for (let i = 0; i < totalChars; i++) {
                        const threshold = glitchThresholdsRef.current[i] || 0.65
                        const isResolved =
                            progress >= 1 || progress >= threshold

                        let charToDisplay = ""
                        if (
                            preserveSpaces &&
                            (text[i] === " " ||
                                text[i] === "\n" ||
                                text[i] === "\t")
                        ) {
                            charToDisplay = text[i]
                        } else if (isResolved) {
                            // Occasional micro-glitch flicker before 85% progress
                            if (progress < 0.85 && Math.random() < 0.04) {
                                charToDisplay = getRandomGlyph()
                            } else {
                                charToDisplay = text[i]
                            }
                        } else {
                            charToDisplay = shouldFlip
                                ? getRandomGlyph()
                                : tailCipherRef.current[i]
                        }

                        const status = isResolved && charToDisplay === text[i]

                        if (currentStatus === null) {
                            currentStatus = status
                            currentChunk = charToDisplay
                        } else if (currentStatus === status) {
                            currentChunk += charToDisplay
                        } else {
                            chunks.push({
                                text: currentChunk,
                                isResolved: currentStatus,
                            })
                            currentStatus = status
                            currentChunk = charToDisplay
                        }
                    }

                    if (currentChunk.length > 0 && currentStatus !== null) {
                        chunks.push({
                            text: currentChunk,
                            isResolved: currentStatus,
                        })
                    }

                    setRenderPayload({
                        resolvedText: "",
                        frontierChar: "",
                        tailText: "",
                        scatterChunks: chunks,
                        isComplete: progress >= 1,
                    })
                }

                if (progress < 1) {
                    rafIdRef.current = requestAnimationFrame(animateFrame)
                } else {
                    // Final complete state: 100% clean target text (CANNOT disappear!)
                    setRenderPayload({
                        resolvedText: text,
                        frontierChar: "",
                        tailText: "",
                        scatterChunks: [{ text, isResolved: true }],
                        isComplete: true,
                    })
                    setIsAnimating(false)

                    // Re-trigger loop only while visible on screen, and motion is allowed
                    if (
                        triggerMode === "loop" &&
                        isInViewRef.current &&
                        !isStatic &&
                        !prefersReducedMotionRef.current
                    ) {
                        loopTimerRef.current = setTimeout(
                            () => {
                                if (
                                    isInViewRef.current &&
                                    !isStatic &&
                                    !prefersReducedMotionRef.current
                                ) {
                                    startScramble()
                                }
                            },
                            Math.max(loopInterval * 1000, 300)
                        )
                    }
                }
            }

            rafIdRef.current = requestAnimationFrame(animateFrame)
        }

        if (delay > 0) {
            delayTimerRef.current = setTimeout(executeAnimation, delay * 1000)
        } else {
            executeAnimation()
        }
    }, [
        text,
        duration,
        speed,
        delay,
        revealMode,
        activeCharset,
        preserveSpaces,
        triggerMode,
        loopInterval,
        showCursor,
        cursorChar,
        getRandomGlyph,
        playTickSound,
        clearTimers,
        isStatic,
    ])

    // Comprehensive Reduced Motion support (auto-detect & reactive media query)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        prefersReducedMotionRef.current = mq.matches
        setPrefersReducedMotion(mq.matches)

        if (mq.matches) {
            clearTimers()
            setIsAnimating(false)
            setRenderPayload({
                resolvedText: text,
                frontierChar: "",
                tailText: "",
                scatterChunks: [{ text, isResolved: true }],
                isComplete: true,
            })
        }

        const handleMotionChange = (e: MediaQueryListEvent) => {
            prefersReducedMotionRef.current = e.matches
            setPrefersReducedMotion(e.matches)
            if (e.matches) {
                clearTimers()
                setIsAnimating(false)
                setRenderPayload({
                    resolvedText: text,
                    frontierChar: "",
                    tailText: "",
                    scatterChunks: [{ text, isResolved: true }],
                    isComplete: true,
                })
            }
        }

        if (mq.addEventListener) {
            mq.addEventListener("change", handleMotionChange)
            return () => mq.removeEventListener("change", handleMotionChange)
        } else if (mq.addListener) {
            mq.addListener(handleMotionChange)
            return () => mq.removeListener(handleMotionChange)
        }
    }, [clearTimers, text])

    // Viewport visibility & offscreen pause (cancels animation frames & loop timers offscreen)
    useEffect(() => {
        const justEnteredView = isInView && !wasInViewRef.current
        wasInViewRef.current = isInView
        isInViewRef.current = isInView

        if (isStatic || prefersReducedMotionRef.current) return

        if (!isInView) {
            // Cancel active timers and animation frames when scrolled offscreen (saves CPU & battery)
            clearTimers()
            setIsAnimating(false)
            setRenderPayload({
                resolvedText: text,
                frontierChar: "",
                tailText: "",
                scatterChunks: [{ text, isResolved: true }],
                isComplete: true,
            })
        } else if (justEnteredView) {
            // Trigger ONLY when entering the viewport, not repeatedly on state updates
            const canTriggerView =
                triggerMode === "view" ||
                triggerMode === "viewAndHover" ||
                triggerMode === "loop"

            if (canTriggerView) {
                startScramble()
            }
        }
    }, [isInView, triggerMode, text, isStatic, clearTimers, startScramble])

    // Trigger immediately on property change in Framer (text, revealMode, characterSet, duration)
    const isFirstMountRef = useRef<boolean>(true)
    useEffect(() => {
        if (isStatic || prefersReducedMotionRef.current) return
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false
            const canAutoTrigger =
                triggerMode === "view" ||
                triggerMode === "viewAndHover" ||
                triggerMode === "loop"
            if (canAutoTrigger) {
                startScramble()
            }
            return
        }
        // When user switches revealMode, text, or characterSet in Framer properties panel, preview immediately!
        startScramble()
    }, [
        text,
        revealMode,
        characterSet,
        duration,
        isStatic,
        startScramble,
        triggerMode,
    ])

    // Cleanup
    useEffect(() => {
        return () => {
            clearTimers()
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.close().catch(() => {})
            }
        }
    }, [clearTimers])

    const handleMouseEnter = () => {
        if (isStatic || prefersReducedMotionRef.current) return
        if (
            (triggerMode === "hover" || triggerMode === "viewAndHover") &&
            !isAnimating
        ) {
            startScramble()
        }
    }

    const handleClick = () => {
        if (isStatic || prefersReducedMotionRef.current) return
        if (triggerMode === "click" && !isAnimating) {
            startScramble()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isStatic || prefersReducedMotionRef.current) return
        if (triggerMode === "click" && !isAnimating) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                startScramble()
            }
        }
    }

    const Tag = htmlTag as React.ElementType

    const getShadow = (blurVal: number, colorVal: string) => {
        return blurVal > 0 ? `0 0 ${blurVal}px ${colorVal}` : "none"
    }

    const activeScrambleColor = useDualTone ? scrambleColor : color
    const activeScrambleGlow = useDualTone
        ? getShadow(glowBlur, scrambleGlowColor)
        : getShadow(glowBlur, glowColor)
    const resolvedGlow = getShadow(glowBlur, glowColor)

    const isClickTrigger = triggerMode === "click"

    // 1. Static fallback for Framer's static renderer (canvas previews, exports, SSR)
    if (isStatic) {
        return (
            <Tag
                ref={containerRef}
                aria-label={text}
                style={{
                    ...style,
                    display: "inline-block",
                    textAlign: alignment,
                    color: color,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    ...font,
                }}
            >
                <span
                    style={{
                        color: color,
                        textShadow: resolvedGlow,
                    }}
                >
                    {text}
                </span>
                {showCursor && !cursorAutoHide && (
                    <span
                        style={{
                            marginLeft: "2px",
                            color: activeScrambleColor,
                            textShadow: activeScrambleGlow,
                        }}
                    >
                        {cursorChar}
                    </span>
                )}
            </Tag>
        )
    }

    const { resolvedText, frontierChar, tailText, scatterChunks, isComplete } =
        renderPayload

    return (
        <>
            <Tag
                ref={containerRef}
                className={
                    isClickTrigger ? "cipher-morph-interactive" : undefined
                }
                onMouseEnter={handleMouseEnter}
                onClick={handleClick}
                onKeyDown={isClickTrigger ? handleKeyDown : undefined}
                role={isClickTrigger ? "button" : undefined}
                tabIndex={isClickTrigger ? 0 : undefined}
                aria-label={text}
                aria-pressed={isClickTrigger ? isAnimating : undefined}
                style={{
                    ...style,
                    display: "inline-block",
                    textAlign: alignment,
                    color: color,
                    fontVariantNumeric: "tabular-nums",
                    cursor: isClickTrigger
                        ? "pointer"
                        : triggerMode === "hover" ||
                            triggerMode === "viewAndHover"
                          ? "default"
                          : "inherit",
                    userSelect: "none",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    ...font,
                }}
            >
                {/* 1. ALWAYS render complete solid text when finished or during loop pause */}
                {isComplete ? (
                    <>
                        <span
                            style={{
                                color: color,
                                textShadow: resolvedGlow,
                            }}
                        >
                            {text}
                        </span>
                        {showCursor && !cursorAutoHide && (
                            <span
                                style={{
                                    marginLeft: "2px",
                                    color: activeScrambleColor,
                                    textShadow: activeScrambleGlow,
                                    animation:
                                        cursorBlink && !prefersReducedMotion
                                            ? "cipherMorphCursor 0.9s steps(2, start) infinite"
                                            : "none",
                                }}
                            >
                                {cursorChar}
                                {cursorBlink && !prefersReducedMotion && (
                                    <style>{`
                                    @keyframes cipherMorphCursor {
                                        0%, 100% { opacity: 1; }
                                        50% { opacity: 0; }
                                    }
                                `}</style>
                                )}
                            </span>
                        )}
                    </>
                ) : (
                    /* 2. Active animation states */
                    <>
                        {/* SCATTER & GLITCH MODES (Chunk-based dual tone) */}
                        {(revealMode === "scatter" ||
                            revealMode === "glitch") &&
                            scatterChunks && (
                                <>
                                    {scatterChunks.map((chunk, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                color: chunk.isResolved
                                                    ? color
                                                    : activeScrambleColor,
                                                textShadow: chunk.isResolved
                                                    ? resolvedGlow
                                                    : activeScrambleGlow,
                                                opacity: chunk.isResolved
                                                    ? 1
                                                    : 0.85,
                                            }}
                                        >
                                            {chunk.text}
                                        </span>
                                    ))}
                                    {showCursor && (
                                        <span
                                            style={{
                                                marginLeft: "1px",
                                                color: activeScrambleColor,
                                                textShadow: activeScrambleGlow,
                                                animation:
                                                    cursorBlink &&
                                                    !prefersReducedMotion
                                                        ? "cipherMorphCursor 0.9s steps(2, start) infinite"
                                                        : "none",
                                            }}
                                        >
                                            {cursorChar}
                                            {cursorBlink &&
                                                !prefersReducedMotion && (
                                                    <style>{`
                                            @keyframes cipherMorphCursor {
                                                0%, 100% { opacity: 1; }
                                                50% { opacity: 0; }
                                            }
                                        `}</style>
                                                )}
                                        </span>
                                    )}
                                </>
                            )}

                        {/* WAVE / TYPEWRITER MODE */}
                        {revealMode !== "scatter" &&
                            revealMode !== "glitch" && (
                                <>
                                    {/* Resolved text */}
                                    <span
                                        style={{
                                            color: color,
                                            textShadow: resolvedGlow,
                                        }}
                                    >
                                        {resolvedText}
                                    </span>

                                    {/* Frontier character */}
                                    {frontierChar && (
                                        <span
                                            style={{
                                                color: activeScrambleColor,
                                                textShadow: activeScrambleGlow,
                                            }}
                                        >
                                            {frontierChar}
                                        </span>
                                    )}

                                    {/* Typewriter active cursor */}
                                    {showCursor &&
                                        revealMode === "typewriter" && (
                                            <span
                                                style={{
                                                    marginLeft: "1px",
                                                    color: activeScrambleColor,
                                                    textShadow:
                                                        activeScrambleGlow,
                                                    animation:
                                                        cursorBlink &&
                                                        !prefersReducedMotion
                                                            ? "cipherMorphCursor 0.9s steps(2, start) infinite"
                                                            : "none",
                                                }}
                                            >
                                                {cursorChar}
                                                {cursorBlink &&
                                                    !prefersReducedMotion && (
                                                        <style>{`
                                            @keyframes cipherMorphCursor {
                                                0%, 100% { opacity: 1; }
                                                50% { opacity: 0; }
                                            }
                                        `}</style>
                                                    )}
                                            </span>
                                        )}

                                    {/* Tail cipher text */}
                                    {tailText && (
                                        <span
                                            style={{
                                                color: activeScrambleColor,
                                                textShadow: activeScrambleGlow,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {tailText}
                                        </span>
                                    )}
                                </>
                            )}
                    </>
                )}
            </Tag>
            {isClickTrigger && (
                <style>{`
                .cipher-morph-interactive:focus-visible {
                    outline: 2px solid ${activeScrambleColor};
                    outline-offset: 3px;
                    border-radius: 4px;
                }
            `}</style>
            )}
        </>
    )
}

addPropertyControls(CipherMorph, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "DECRYPTING SYSTEM...",
        displayTextArea: true,
    },
    revealMode: {
        type: ControlType.Enum,
        title: "Reveal Mode",
        options: ["wave", "scatter", "typewriter", "glitch"],
        optionTitles: [
            "Matrix Wave (Smooth L-R)",
            "Matrix Scatter (Smooth)",
            "Typewriter (Clean)",
            "Cyber Glitch (In-Place)",
        ],
        defaultValue: "wave",
        description:
            "Wave sequentially resolves L-to-R. Scatter resolves organically in a smooth random order.",
    },
    htmlTag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "h4", "p", "span", "div"],
        optionTitles: ["H1", "H2", "H3", "H4", "Paragraph", "Span", "Div"],
        defaultValue: "div",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayTextAlignment: false,
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 32,
            letterSpacing: "0.05em",
        },
    },
    characterSet: {
        type: ControlType.Enum,
        title: "Glyphs",
        options: [
            "matrix",
            "binary",
            "alphanumeric",
            "symbols",
            "katakana",
            "runes",
            "custom",
        ],
        optionTitles: [
            "Hex Matrix (0-F)",
            "Binary (0/1)",
            "Alphanumeric",
            "Cyber Symbols",
            "Japanese Katakana",
            "Tech Runes",
            "Custom Set",
        ],
        defaultValue: "matrix",
    },
    customChars: {
        type: ControlType.String,
        title: "Custom Glyphs",
        defaultValue: "01X#",
        hidden(props: Partial<CipherMorphProps>) {
            return props.characterSet !== "custom"
        },
    },
    preserveSpaces: {
        type: ControlType.Boolean,
        title: "Keep Spaces",
        defaultValue: true,
        description: "Preserve layout spacing during decode",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Text Glow",
        defaultValue: "rgba(0, 255, 128, 0.4)",
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 0,
        min: 0,
        max: 60,
        step: 1,
        description: "Set to 0 for crisp typography, or increase for neon glow",
    },
    useDualTone: {
        type: ControlType.Boolean,
        title: "Dual Tone",
        defaultValue: true,
        description: "Distinct highlight color for active scrambling character",
    },
    scrambleColor: {
        type: ControlType.Color,
        title: "Scramble Color",
        defaultValue: "#00FF7F",
        hidden(props: Partial<CipherMorphProps>) {
            return !props.useDualTone
        },
    },
    scrambleGlowColor: {
        type: ControlType.Color,
        title: "Scramble Glow",
        defaultValue: "rgba(0, 255, 127, 0.8)",
        hidden(props: Partial<CipherMorphProps>) {
            return !props.useDualTone
        },
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.5,
        min: 0.2,
        max: 10,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Cadence",
        defaultValue: 0.5,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        displayStepper: true,
        description: "Controlled character flip speed",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["viewAndHover", "view", "hover", "click", "loop"],
        optionTitles: [
            "View + Hover",
            "On View",
            "On Hover",
            "On Click",
            "Continuous Loop",
        ],
        defaultValue: "viewAndHover",
    },
    loopInterval: {
        type: ControlType.Number,
        title: "Loop Pause",
        defaultValue: 3.0,
        min: 0.5,
        max: 15,
        step: 0.5,
        unit: "s",
        hidden(props: Partial<CipherMorphProps>) {
            return props.triggerMode !== "loop"
        },
    },
    showCursor: {
        type: ControlType.Boolean,
        title: "Show Cursor",
        defaultValue: true,
    },
    cursorChar: {
        type: ControlType.String,
        title: "Cursor Symbol",
        defaultValue: "█",
        hidden(props: Partial<CipherMorphProps>) {
            return !props.showCursor
        },
    },
    cursorBlink: {
        type: ControlType.Boolean,
        title: "Cursor Blink",
        defaultValue: true,
        hidden(props: Partial<CipherMorphProps>) {
            return !props.showCursor
        },
    },
    cursorAutoHide: {
        type: ControlType.Boolean,
        title: "Auto-Hide",
        defaultValue: true,
        description: "Hide cursor when decrypt completes",
        hidden(props: Partial<CipherMorphProps>) {
            return !props.showCursor
        },
    },
    soundEffect: {
        type: ControlType.Boolean,
        title: "Audio FX",
        defaultValue: false,
        description:
            "via [Tanzil Rayhan](https://www.framer.com/%40tanzilrayhan/)",
    },
    soundVolume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 0.2,
        min: 0.01,
        max: 1.0,
        step: 0.05,
        hidden(props: Partial<CipherMorphProps>) {
            return !props.soundEffect
        },
    },
})
