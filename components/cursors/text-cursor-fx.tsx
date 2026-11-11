// Text Cursor
// Created by Frankie from Framer-Expert.com

import * as React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    texts?: string[]
    textColor?: string
    burstColor?: string
    font?: Record<string, any>
    followSpeed?: number
    burstSpeed?: number
    burstSpread?: number
    showHint?: boolean
    backgroundColor?: string
}

interface BurstParticle {
    id: number
    char: string
    x: number
    y: number
    vx: number
    vy: number
    rotation: number
    rotationSpeed: number
    opacity: number
    scale: number
    color: string
}

// Default font styles
const defaultFont = {
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    fontWeight: 700,
    fontStyle: "normal",
    lineHeight: 1.2,
    letterSpacing: 0,
}

export default function TextCursor({
    texts = ["Hello", "Click Me", "Boom!", "Amazing"],
    textColor = "#ffffff",
    burstColor = "#FF6B6B",
    font,
    followSpeed = 0.15,
    burstSpeed = 8,
    burstSpread = 150,
    showHint = true,
    backgroundColor = "#0a0a0f",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [textPos, setTextPos] = useState({ x: 0, y: 0 })
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [particles, setParticles] = useState<BurstParticle[]>([])
    const [isHovering, setIsHovering] = useState(false)

    const rafRef = useRef<number>(0)
    const particleIdRef = useRef(0)

    // Safe font object with fallbacks
    const safeFont = font && typeof font === "object" ? font : defaultFont

    // Extract font properties with defaults
    const fontSize = safeFont.fontSize || 24

    // Build font style object for consistent usage
    const fontStyles: React.CSSProperties = {
        ...safeFont,
    }

    // SSR-safe texts array
    const safeTexts =
        Array.isArray(texts) && texts.length > 0
            ? texts
            : ["Hello", "Click Me", "Boom!", "Amazing"]
    const currentText = safeTexts[currentTextIndex] || "Hello"

    // Animation loop for particles and mouse following
    useEffect(() => {
        let lastTime = performance.now()

        const animate = (time: number) => {
            const dt = Math.min((time - lastTime) / 16.67, 2)
            lastTime = time

            // Smooth follow mouse position when hovering
            if (isHovering) {
                setTextPos((prev) => ({
                    x: prev.x + (mousePos.x - prev.x) * followSpeed * dt,
                    y: prev.y + (mousePos.y - prev.y) * followSpeed * dt,
                }))
            }

            // Update particles
            setParticles((prev) => {
                return prev
                    .map((p) => ({
                        ...p,
                        x: p.x + p.vx * dt,
                        y: p.y + p.vy * dt,
                        vy: p.vy + 0.3 * dt, // gravity
                        rotation: p.rotation + p.rotationSpeed * dt,
                        opacity: p.opacity - 0.02 * dt,
                        scale: p.scale * (1 - 0.01 * dt),
                    }))
                    .filter((p) => p.opacity > 0)
            })

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(rafRef.current)
    }, [isHovering, mousePos, followSpeed])

    // Handle mouse move
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setMousePos({ x, y })
    }, [])

    // Handle mouse enter - show text cursor immediately
    const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Initialize position at entry point
        setMousePos({ x, y })
        setTextPos({ x, y })
        setIsHovering(true)
    }, [])

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
        setIsHovering(false)
    }, [])

    // Handle click - burst effect and cycle to next text
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const clickX = e.clientX - rect.left
            const clickY = e.clientY - rect.top

            // Get current text for burst
            const burstText = safeTexts[currentTextIndex] || "Hello"

            // Create particles from each character
            const chars = burstText.split("")
            const newParticles: BurstParticle[] = chars.map((char, i) => {
                const angle =
                    (Math.PI * 2 * i) / chars.length + Math.random() * 0.5
                const speed = burstSpeed * (0.5 + Math.random() * 0.5)

                return {
                    id: particleIdRef.current++,
                    char,
                    x: clickX,
                    y: clickY,
                    vx: Math.cos(angle) * speed * (burstSpread / 100),
                    vy: Math.sin(angle) * speed * (burstSpread / 100) - 3,
                    rotation: Math.random() * 360,
                    rotationSpeed: (Math.random() - 0.5) * 20,
                    opacity: 1,
                    scale: 1,
                    color: burstColor,
                }
            })

            setParticles((prev) => [...prev, ...newParticles])

            // Cycle to next text
            setCurrentTextIndex((prev) => (prev + 1) % safeTexts.length)
        },
        [currentTextIndex, safeTexts, burstSpeed, burstSpread, burstColor]
    )

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={
                {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minWidth: 100,
                    minHeight: 100,
                    overflow: "hidden",
                    background: backgroundColor,
                    cursor: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                } as React.CSSProperties
            }
        >
            {/* Text cursor - follows mouse on hover */}
            {isHovering && (
                <div
                    style={{
                        position: "absolute",
                        left: textPos.x,
                        top: textPos.y,
                        transform: `translate(-50%, -50%)`,
                        color: textColor,
                        ...fontStyles,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        textShadow: `0 0 20px ${textColor}40, 0 0 40px ${textColor}20`,
                    }}
                >
                    {currentText}
                </div>
            )}

            {/* Burst particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: p.x,
                        top: p.y,
                        transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
                        color: p.color,
                        ...fontStyles,
                        opacity: p.opacity,
                        pointerEvents: "none",
                        textShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}80`,
                    }}
                >
                    {p.char}
                </div>
            ))}

            {/* Hint text - visible when not hovering */}
            {showHint && !isHovering && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: textColor,
                        opacity: 0.6,
                        ...fontStyles,
                        fontSize: fontSize * 0.7,
                        fontWeight: 400,
                        pointerEvents: "none",
                        textAlign: "center",
                    }}
                >
                    Hover & Click
                </div>
            )}
        </div>
    )
}

addPropertyControls(TextCursor, {
    texts: {
        type: ControlType.Array,
        title: "Texts",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Hello", "Click Me", "Boom!", "Amazing"],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0f",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    burstColor: {
        type: ControlType.Color,
        title: "Burst Color",
        defaultValue: "#FF6B6B",
    },
    font: {
        // @ts-ignore - Framer's native font control
        type: "font",
        title: "Font",
        controls: "extended",
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        min: 0.05,
        max: 1,
        step: 0.05,
        defaultValue: 0.15,
    },
    burstSpeed: {
        type: ControlType.Number,
        title: "Burst Speed",
        min: 2,
        max: 20,
        step: 0.5,
        defaultValue: 8,
    },
    burstSpread: {
        type: ControlType.Number,
        title: "Burst Spread",
        min: 50,
        max: 300,
        step: 10,
        defaultValue: 150,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Show Hint",
        defaultValue: true,
    },
})
;(TextCursor as any).defaultProps = {
    width: 400,
    height: 300,
}

TextCursor.displayName = "Text Cursor"
