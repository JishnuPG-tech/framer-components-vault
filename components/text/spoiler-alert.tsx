// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef } from "react"

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SpoilerText({
    text = "This is the hidden content that was behind the spoiler alert!",
    textColor = "#ffffff",
    particleColor = "#ffffff",
    blurAmount = 4,
    font = {
        fontSize: 16,
        textAlign: "left",
    },
    particleCount = 100,
    revealTrigger = "click",
    replayOnHover = true,
}: {
    text?: string
    textColor?: string
    particleColor?: string
    blurAmount?: number
    font?: any
    particleCount?: number
    revealTrigger?: "hover" | "click"
    replayOnHover?: boolean
}) {
    const [isRevealed, setIsRevealed] = useState(false)
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const particlesRef = useRef([])
    const animationFrameRef = useRef<number>()
    const isTouchDeviceRef = useRef(false)

    // Debug logs
    useEffect(() => {
        console.log("=== Component Props ===")
        console.log("text:", text)
    }, [text])

    // Detect touch device
    useEffect(() => {
        if (typeof window !== "undefined") {
            isTouchDeviceRef.current =
                "ontouchstart" in window || navigator.maxTouchPoints > 0
        }
    }, [])

    const handleClick = (e) => {
        if (!isRevealed) {
            // Trigger haptic feedback on touch devices only when revealing
            if (
                isTouchDeviceRef.current &&
                typeof window !== "undefined" &&
                "vibrate" in navigator
            ) {
                navigator.vibrate(50)
            }
            setIsRevealed(true)
        }
    }

    const handleTouchEnd = (e) => {
        e.preventDefault()
        if (!isRevealed) {
            // Trigger haptic feedback on touch devices only when revealing
            if (typeof window !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate(50)
            }
            setIsRevealed(true)
        }
    }

    const handleMouseEnter = () => {
        if (!isRevealed && revealTrigger === "hover") {
            setIsRevealed(true)
        }
    }

    const handleMouseLeave = () => {
        if (revealTrigger === "hover" && replayOnHover) {
            setIsRevealed(false)
        }
    }

    // Generate particles
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return
        if (isRevealed) {
            // Clean up animation when revealed
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = undefined
            }
            return
        }

        const canvas = canvasRef.current
        const container = containerRef.current

        const ctx = canvas.getContext("2d", {
            alpha: true,
            willReadFrequently: false,
        })
        if (!ctx) return

        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`

            // Clear and reset scale
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)

            return { width: rect.width, height: rect.height }
        }

        const { width, height } = updateCanvasSize()
        const totalParticles = Math.max(
            particleCount * ((width * height) / 10000),
            20
        )

        // Initialize particles
        particlesRef.current = Array.from({ length: totalParticles }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.8 + Math.random() * 1.2,
            opacity: 0.3 + Math.random() * 0.4,
        }))

        let lastFlickerTime = 0
        const flickerInterval = 50
        let isAnimating = true
        let currentWidth = width
        let currentHeight = height

        const animate = (timestamp) => {
            if (!isAnimating || !canvas) return

            const currentCtx = canvas.getContext("2d", {
                alpha: true,
                willReadFrequently: false,
            })
            if (!currentCtx) return

            currentCtx.clearRect(0, 0, currentWidth, currentHeight)

            // Throttle particle regeneration
            if (timestamp - lastFlickerTime > flickerInterval) {
                const regenerateCount = Math.floor(totalParticles * 0.15)
                for (let i = 0; i < regenerateCount; i++) {
                    const idx = Math.floor(Math.random() * totalParticles)
                    particlesRef.current[idx] = {
                        x: Math.random() * currentWidth,
                        y: Math.random() * currentHeight,
                        size: 0.8 + Math.random() * 1.2,
                        opacity: 0.3 + Math.random() * 0.4,
                    }
                }
                lastFlickerTime = timestamp
            }

            // Draw particles
            currentCtx.fillStyle = particleColor
            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i]
                currentCtx.globalAlpha = p.opacity
                currentCtx.fillRect(p.x, p.y, p.size, p.size)
            }
            currentCtx.globalAlpha = 1

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animate)

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            const { width: newWidth, height: newHeight } = updateCanvasSize()
            currentWidth = newWidth
            currentHeight = newHeight
            const newTotalParticles = Math.max(
                particleCount * ((newWidth * newHeight) / 10000),
                20
            )
            particlesRef.current = Array.from(
                { length: newTotalParticles },
                () => ({
                    x: Math.random() * newWidth,
                    y: Math.random() * newHeight,
                    size: 0.8 + Math.random() * 1.2,
                    opacity: 0.3 + Math.random() * 0.4,
                })
            )
        })
        resizeObserver.observe(container)

        return () => {
            isAnimating = false
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = undefined
            }
            resizeObserver.disconnect()
        }
    }, [isRevealed, particleCount, particleColor])

    return (
        <div
            ref={containerRef}
            onClick={
                !isTouchDeviceRef.current && revealTrigger === "click"
                    ? handleClick
                    : undefined
            }
            onTouchEnd={isTouchDeviceRef.current ? handleTouchEnd : undefined}
            onMouseEnter={
                !isTouchDeviceRef.current && revealTrigger === "hover"
                    ? handleMouseEnter
                    : undefined
            }
            onMouseLeave={
                !isTouchDeviceRef.current && revealTrigger === "hover"
                    ? handleMouseLeave
                    : undefined
            }
            style={{
                backgroundColor: "transparent",
                padding: "10px",
                cursor: !isRevealed ? "pointer" : "default",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                userSelect: "text",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                    font.textAlign === "center"
                        ? "center"
                        : font.textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
            }}
        >
            {/* Particle canvas */}
            {!isRevealed && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            )}

            {/* Text content */}
            <div
                style={{
                    color: textColor,
                    ...font,
                    lineHeight: font.lineHeight || "1.6",
                    position: "relative",
                    zIndex: 0,
                    width: "100%",
                    filter: isRevealed ? "blur(0px)" : `blur(${blurAmount}px)`,
                    opacity: isRevealed ? 1 : 0.6,
                    transition: "filter 0.4s ease, opacity 0.4s ease",
                    whiteSpace: "pre-wrap",
                }}
            >
                {text}
            </div>
        </div>
    )
}

SpoilerText.displayName = "Spoiler Text"

addPropertyControls(SpoilerText, {
    revealTrigger: {
        type: ControlType.Enum,
        title: "Reveal Trigger",
        options: ["click", "hover"],
        optionTitles: ["Click", "Hover"],
        defaultValue: "click",
        displaySegmentedControl: true,
    },
    replayOnHover: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.revealTrigger !== "hover",
    },
    text: {
        type: ControlType.String,
        title: "Content",
        displayTextArea: true,
        defaultValue:
            "This is the hidden content that was behind the spoiler alert!",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        defaultValue: {
            fontSize: 24,
            textAlign: "left",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 6,
        min: 0,
        max: 100,
        step: 1,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        description:
            "Particle count value larger than 500 can impact performance.",
        defaultValue: 200,
        min: 0,
        max: 1000,
        step: 5,
    },
    particleColor: {
        type: ControlType.Color,
        title: "Particle Color",
        defaultValue: "#ffffff",
        description:
            "[Click here](https://tinyurl.com/avirallakhanpaul) to get more exciting components!",
    },
})
