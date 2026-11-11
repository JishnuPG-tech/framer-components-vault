import { useMemo, useCallback, useState, useRef, useEffect } from "react"
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

interface RippleGridProProps {
    rows: number
    columns: number
    cellColor: string
    rippleColor: string
    backgroundColor: string
    buttonColor: string
    buttonIconColor: string
    gap: number
    borderRadius: number
    rippleSpeed: number
    rippleThickness: number
    rippleGrowthSpeed: number
    autoPlay: boolean
    autoPlayMode: "center" | "random" | "corners"
    pulseInterval: number
    soundEnabled: boolean
    soundVolume: number
    soundEffect: "classic" | "chime" | "pulse" | "digital" | "deep"
    rippleShape: "wave" | "star" | "plus" | "diamond" | "hexagon"
    showMiddleButton: boolean
    onClick?: () => void
    style?: React.CSSProperties
}

interface RippleOrigin {
    row: number
    col: number
}

interface ActiveRipple {
    id: number
    origin: RippleOrigin
    timestamp: number
}

/**
 * Ripple Grid Pro
 *
 * An animated grid with ripple effects emanating from the center,
 * featuring a circular button with a sparkle icon.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 350
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RippleGridPro(props: RippleGridProProps) {
    const {
        rows = 7,
        columns = 8,
        cellColor = "#222222",
        rippleColor = "#4f46e5",
        backgroundColor = "#0a0a0a",
        buttonColor = "#333333",
        buttonIconColor = "#ffffff",
        gap = 8,
        borderRadius = 4,
        rippleSpeed = 1,
        rippleThickness = 1,
        rippleGrowthSpeed = 1,
        autoPlay = true,
        autoPlayMode = "center",
        pulseInterval = 4500,
        soundEnabled = false,
        soundVolume = 0.5,
        soundEffect = "classic",
        rippleShape = "wave",
        showMiddleButton = true,
        onClick,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.1 })
    const isVisibleRef = useRef(true)
    const [activeRipples, setActiveRipples] = useState<ActiveRipple[]>([])
    const [buttonScale, setButtonScale] = useState(1)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const isPausedRef = useRef(false)
    const pauseTimeoutRef = useRef<number | null>(null)
    const rippleIdCounter = useRef(Date.now())
    const mountedRef = useRef(true)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const lastSoundPlayRef = useRef(0)
    const rafRef = useRef<number | null>(null)
    const lastTriggerRef = useRef(0)
    const cycleIndexRef = useRef(0)
    const componentIdRef = useRef(`rg-${Math.random().toString(36).substr(2, 9)}`)
    const rippleTimeoutsRef = useRef<Set<number>>(new Set())

    const SOUND_THROTTLE_MS = 150
    const CLICK_THROTTLE_MS = 50
    const MAX_RIPPLES = 5

    useEffect(() => {
        mountedRef.current = true
        isVisibleRef.current = true
        
        const handleVisibilityChange = () => {
            isVisibleRef.current = document.visibilityState === "visible"
            if (!isVisibleRef.current && audioContextRef.current?.state === "running") {
                audioContextRef.current.suspend()
            }
        }
        
        document.addEventListener("visibilitychange", handleVisibilityChange)
        
        return () => {
            mountedRef.current = false
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            
            if (pauseTimeoutRef.current) {
                clearTimeout(pauseTimeoutRef.current)
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
            // Clear all ripple removal timeouts
            rippleTimeoutsRef.current.forEach(id => clearTimeout(id))
            rippleTimeoutsRef.current.clear()
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    useEffect(() => {
        isVisibleRef.current = isInView
    }, [isInView])

    useEffect(() => {
        if (typeof window === "undefined") return
        
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mediaQuery.matches)
        
        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches)
        }
        
        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [])

    const initAudio = useCallback(() => {
        if (isStatic || !soundEnabled || audioContextRef.current) return
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextRef.current = ctx
        } catch {
            // Audio not supported
        }
    }, [isStatic, soundEnabled])

    const playRippleSound = useCallback(() => {
        if (isStatic || !soundEnabled || !audioContextRef.current || !isVisibleRef.current) return
        
        const now = performance.now()
        if (now - lastSoundPlayRef.current < SOUND_THROTTLE_MS) return
        lastSoundPlayRef.current = now
        
        try {
            const ctx = audioContextRef.current
            if (ctx.state === "suspended") {
                ctx.resume()
            }
            
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            
            let freq = 440
            let duration = 0.15
            let type: OscillatorType = "sine"
            
            switch (soundEffect) {
                case "chime":
                    freq = 523
                    duration = 0.3
                    type = "sine"
                    break
                case "pulse":
                    freq = 220
                    duration = 0.2
                    type = "triangle"
                    break
                case "digital":
                    freq = 880
                    duration = 0.1
                    type = "square"
                    break
                case "deep":
                    freq = 110
                    duration = 0.25
                    type = "sine"
                    break
            }
            
            osc.frequency.setValueAtTime(freq, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration)
            osc.type = type
            
            gain.gain.setValueAtTime(Math.max(0, Math.min(1, soundVolume)) * 0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
            
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + duration)
        } catch {
            // Ignore audio errors
        }
    }, [isStatic, soundEnabled, soundVolume, soundEffect])

    const centerRow = Math.floor(rows / 2)
    const centerCol = Math.floor(columns / 2)

    const animDuration = (1000 / rippleSpeed) * rippleThickness
    const travelDuration = (400 / rippleSpeed) * Math.sqrt(rippleThickness) / rippleGrowthSpeed

    const getCellDelay = useCallback((row: number, col: number, originRow: number, originCol: number) => {
        const maxDist = Math.sqrt((rows/2) ** 2 + (columns/2) ** 2)
        const dx = col - originCol
        const dy = row - originRow
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        
        if (rippleShape === "star") {
            const starModulation = 1 - 0.5 * Math.abs(Math.cos(2.5 * angle))
            const effectiveDistance = distance * starModulation
            
            const normalizedDist = effectiveDistance / Math.max(maxDist, 0.001)
            return normalizedDist * normalizedDist * travelDuration
        }
        
        if (rippleShape === "plus") {
            const absDx = Math.abs(dx)
            const absDy = Math.abs(dy)
            
            const distFromCross = Math.min(absDx, absDy)
            const distAlongCross = Math.max(absDx, absDy)
            
            const effectiveDistance = distAlongCross + distFromCross * 2.5
            
            const normalizedDist = effectiveDistance / Math.max(maxDist, 0.001)
            return normalizedDist * normalizedDist * travelDuration
        }
        
        if (rippleShape === "diamond") {
            const absDx = Math.abs(dx)
            const absDy = Math.abs(dy)
            const manhattanDist = absDx + absDy
            
            const maxManhattan = Math.max(rows, columns)
            const normalizedDist = manhattanDist / Math.max(maxManhattan, 0.001)
            
            return normalizedDist * travelDuration
        }
        
        if (rippleShape === "hexagon") {
            const cos3Angle = Math.cos(3 * angle)
            const axialFactor = (1 + cos3Angle) / 2
            
            const effectiveDistance = distance * (1 - 0.6 * axialFactor)
            
            const normalizedDist = effectiveDistance / Math.max(maxDist, 0.001)
            return normalizedDist * normalizedDist * travelDuration
        }
        
        const normalizedDist = distance / Math.max(maxDist, 0.001)
        return normalizedDist * normalizedDist * travelDuration
    }, [rows, columns, travelDuration, rippleShape])

    const triggerRippleFromCell = useCallback((row: number, col: number) => {
        if (isStatic || !mountedRef.current || !isVisibleRef.current || prefersReducedMotion) return

        const now = performance.now()
        if (now - lastTriggerRef.current < CLICK_THROTTLE_MS) return
        lastTriggerRef.current = now

        rippleIdCounter.current += 1
        const newId = rippleIdCounter.current

        setActiveRipples(prev => {
            if (prev.length >= MAX_RIPPLES) {
                return [...prev.slice(1), { id: newId, origin: { row, col }, timestamp: now }]
            }
            return [...prev, { id: newId, origin: { row, col }, timestamp: now }]
        })

        const totalDuration = animDuration + travelDuration
        const removalDelay = Math.max(totalDuration + 2000, totalDuration * 1.5)
        
        const timeoutId = window.setTimeout(() => {
            rippleTimeoutsRef.current.delete(timeoutId)
            if (mountedRef.current) {
                setActiveRipples(prev => prev.filter(r => r.id !== newId))
            }
        }, removalDelay)
        
        rippleTimeoutsRef.current.add(timeoutId)
    }, [isStatic, animDuration, travelDuration, prefersReducedMotion])

    const triggerRipple = useCallback(() => {
        triggerRippleFromCell(centerRow, centerCol)
    }, [centerRow, centerCol, triggerRippleFromCell])

    const getNextOrigin = useCallback((): RippleOrigin => {
        switch (autoPlayMode) {
            case "random":
                return {
                    row: Math.floor(Math.random() * rows),
                    col: Math.floor(Math.random() * columns),
                }
            case "corners": {
                const corners: RippleOrigin[] = [
                    { row: 0, col: 0 },
                    { row: 0, col: columns - 1 },
                    { row: rows - 1, col: 0 },
                    { row: rows - 1, col: columns - 1 },
                ]
                const origin = corners[cycleIndexRef.current % corners.length]
                cycleIndexRef.current += 1
                return origin
            }
            case "center":
            default:
                return { row: centerRow, col: centerCol }
        }
    }, [autoPlayMode, rows, columns, centerRow, centerCol])

    useEffect(() => {
        if (isStatic || !autoPlay || !isInView || prefersReducedMotion) return

        let lastPulse = performance.now()
        
        const tick = () => {
            if (!mountedRef.current || !isVisibleRef.current) {
                rafRef.current = null
                return
            }
            
            const now = performance.now()
            if (now - lastPulse >= pulseInterval && !isPausedRef.current) {
                const origin = getNextOrigin()
                triggerRippleFromCell(origin.row, origin.col)
                lastPulse = now
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        
        rafRef.current = requestAnimationFrame(tick)
        const initialOrigin = autoPlayMode === "center" ? { row: centerRow, col: centerCol } : getNextOrigin()
        triggerRippleFromCell(initialOrigin.row, initialOrigin.col)

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [isStatic, autoPlay, isInView, triggerRippleFromCell, pulseInterval, getNextOrigin, autoPlayMode, centerRow, centerCol, prefersReducedMotion])

    const handleButtonClick = useCallback(() => {
        if (isStatic || !isVisibleRef.current) return
        initAudio()
        playRippleSound()
        triggerRippleFromCell(centerRow, centerCol)
        
        if (autoPlay) {
            isPausedRef.current = true
            if (pauseTimeoutRef.current) {
                clearTimeout(pauseTimeoutRef.current)
            }
            pauseTimeoutRef.current = window.setTimeout(() => {
                if (mountedRef.current) {
                    isPausedRef.current = false
                }
                pauseTimeoutRef.current = null
            }, 2000)
        }
        
        onClick?.()
    }, [isStatic, triggerRippleFromCell, centerRow, centerCol, onClick, autoPlay, initAudio, playRippleSound])

    const handleCellClick = useCallback((row: number, col: number) => {
        if (isStatic || !isVisibleRef.current) return
        initAudio()
        playRippleSound()
        triggerRippleFromCell(row, col)
        
        if (autoPlay) {
            isPausedRef.current = true
            if (pauseTimeoutRef.current) {
                clearTimeout(pauseTimeoutRef.current)
            }
            pauseTimeoutRef.current = window.setTimeout(() => {
                if (mountedRef.current) {
                    isPausedRef.current = false
                }
                pauseTimeoutRef.current = null
            }, 2000)
        }
    }, [isStatic, triggerRippleFromCell, autoPlay, initAudio, playRippleSound])

    // Generate keyframes dynamically - use full ID to avoid collisions
    const keyframeStyles = useMemo(() => {
        if (activeRipples.length === 0) return ""
        const componentId = componentIdRef.current
        
        return activeRipples.map(ripple => {
            const animId = ripple.id
            return `
                @keyframes ${componentId}-pulse-${animId} {
                    0% { background-color: ${cellColor}; }
                    30% { background-color: ${rippleColor}; }
                    40% { background-color: ${rippleColor}; }
                    100% { background-color: ${cellColor}; }
                }
            `
        }).join("\n")
    }, [activeRipples, cellColor, rippleColor])

    // Pre-compute grid cells
    const gridCells = useMemo(() => {
        const cells = []
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const rippleData: { delay: number; animId: number }[] = []
                
                for (const ripple of activeRipples) {
                    const delay = getCellDelay(row, col, ripple.origin.row, ripple.origin.col)
                    rippleData.push({ delay, animId: ripple.id })
                }
                
                cells.push({
                    key: `${row}-${col}`,
                    row,
                    col,
                    rippleData,
                })
            }
        }
        return cells
    }, [activeRipples, rows, columns, getCellDelay])

    const containerStyle = useMemo(() => ({
        ...style,
        position: "relative" as const,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        width: style?.width === "100%" ? "100%" : "auto",
        height: style?.height === "100%" ? "100%" : "auto",
        padding: 16,
        boxSizing: "border-box" as const,
        contain: "layout paint",
    }), [style, backgroundColor])

    const handleButtonMouseEnter = useCallback(() => {
        if (isStatic) return
        setButtonScale(1.05)
    }, [isStatic])

    const handleButtonMouseLeave = useCallback(() => {
        if (isStatic) return
        setButtonScale(1)
    }, [isStatic])

    const handleButtonMouseDown = useCallback(() => {
        if (isStatic) return
        setButtonScale(0.95)
    }, [isStatic])

    const handleButtonMouseUp = useCallback(() => {
        if (isStatic) return
        setButtonScale(1.05)
    }, [isStatic])

    return (
        <div
            ref={containerRef}
            style={containerStyle}
        >
            <style>{keyframeStyles}</style>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: gap,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                {gridCells.map((cell) => {
                    const hasAnimation = cell.rippleData.length > 0 && !prefersReducedMotion
                    
                    const animationStyle: React.CSSProperties = {}
                    
                    if (hasAnimation) {
                        // Support multiple simultaneous animations
                        const animationNames: string[] = []
                        const animationDelays: string[] = []
                        const animationDurations: string[] = []
                        const timingFunctions: string[] = []
                        const fillModes: string[] = []
                        const componentId = componentIdRef.current
                        
                        for (const data of cell.rippleData) {
                            animationNames.push(`${componentId}-pulse-${data.animId}`)
                            animationDelays.push(`${data.delay}ms`)
                            animationDurations.push(`${animDuration}ms`)
                            timingFunctions.push("ease-out")
                            fillModes.push("forwards")
                        }
                        
                        animationStyle.animationName = animationNames.join(", ")
                        animationStyle.animationDuration = animationDurations.join(", ")
                        animationStyle.animationDelay = animationDelays.join(", ")
                        animationStyle.animationTimingFunction = timingFunctions.join(", ")
                        animationStyle.animationFillMode = fillModes.join(", ")
                    }
                    
                    return (
                        <div
                            key={cell.key}
                            onClick={() => handleCellClick(cell.row, cell.col)}
                            style={{
                                backgroundColor: cellColor,
                                borderRadius: borderRadius,
                                cursor: isStatic ? "default" : "pointer",
                                willChange: prefersReducedMotion ? undefined : "background-color",
                                ...animationStyle,
                            }}
                        />
                    )
                })}

                <button
                    ref={buttonRef}
                    onClick={handleButtonClick}
                    onMouseEnter={handleButtonMouseEnter}
                    onMouseLeave={handleButtonMouseLeave}
                    onMouseDown={handleButtonMouseDown}
                    onMouseUp={handleButtonMouseUp}
                    onTouchStart={handleButtonMouseDown}
                    onTouchEnd={handleButtonMouseUp}
                    disabled={isStatic}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) scale(${buttonScale})`,
                        zIndex: 10,
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: buttonColor,
                        border: "none",
                        cursor: isStatic ? "default" : "pointer",
                        display: showMiddleButton ? "flex" : "none",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                        outline: "none",
                        transition: (isStatic || prefersReducedMotion) ? undefined : "transform 0.15s ease, background-color 0.2s ease",
                        pointerEvents: isStatic ? "none" : "auto",
                    }}
                    aria-label="Trigger ripple effect"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="2" fill={buttonIconColor} />
                        <circle cx="12" cy="4" r="1.5" fill={buttonIconColor} />
                        <circle cx="12" cy="20" r="1.5" fill={buttonIconColor} />
                        <circle cx="4" cy="12" r="1.5" fill={buttonIconColor} />
                        <circle cx="20" cy="12" r="1.5" fill={buttonIconColor} />
                        <circle cx="6.5" cy="6.5" r="1.2" fill={buttonIconColor} />
                        <circle cx="17.5" cy="6.5" r="1.2" fill={buttonIconColor} />
                        <circle cx="6.5" cy="17.5" r="1.2" fill={buttonIconColor} />
                        <circle cx="17.5" cy="17.5" r="1.2" fill={buttonIconColor} />
                    </svg>
                </button>
            </div>
        </div>
    )
}

addPropertyControls(RippleGridPro, {
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 7,
        min: 3,
        max: 15,
        step: 1,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 8,
        min: 3,
        max: 15,
        step: 1,
    },
    cellColor: {
        type: ControlType.Color,
        title: "Cell Color",
        defaultValue: "#222222",
    },
    rippleColor: {
        type: ControlType.Color,
        title: "Ripple Color",
        defaultValue: "#4f46e5",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#333333",
    },
    buttonIconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#ffffff",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Cell Radius",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Ripple Speed",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    rippleThickness: {
        type: ControlType.Number,
        title: "Ripple Thickness",
        defaultValue: 1,
        min: 0.3,
        max: 2,
        step: 0.1,
    },
    rippleGrowthSpeed: {
        type: ControlType.Number,
        title: "Ripple Growth Speed",
        defaultValue: 1,
        min: 0.3,
        max: 3,
        step: 0.1,
    },
    rippleShape: {
        type: ControlType.Enum,
        title: "Ripple Shape",
        defaultValue: "wave",
        options: ["wave", "star", "plus", "diamond", "hexagon"],
        optionTitles: ["Wave", "Star", "Plus", "Diamond", "Hexagon"],
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayMode: {
        type: ControlType.Enum,
        title: "Auto Play Mode",
        defaultValue: "center",
        options: ["center", "random", "corners"],
        optionTitles: ["Center", "Random", "Corners"],
        hidden: ({ autoPlay }) => !autoPlay,
    },
    pulseInterval: {
        type: ControlType.Number,
        title: "Pulse Interval",
        defaultValue: 4500,
        min: 1000,
        max: 10000,
        step: 100,
        unit: "ms",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    soundEnabled: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    soundVolume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ soundEnabled }) => !soundEnabled,
    },
    soundEffect: {
        type: ControlType.Enum,
        title: "Sound Effect",
        defaultValue: "classic",
        options: ["classic", "chime", "pulse", "digital", "deep"],
        optionTitles: ["Classic", "Chime", "Pulse", "Digital", "Deep"],
        hidden: ({ soundEnabled }) => !soundEnabled,
    },
    showMiddleButton: {
        type: ControlType.Boolean,
        title: "Middle Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    onClick: {
        type: ControlType.EventHandler,
        title: "On Click",
    },
})