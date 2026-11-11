// Text Reveal Mask Scroller - Large text that reveals through a moving shape mask as you scroll
import { useEffect, useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion"

interface TextRevealScrollerProps {
    text: string
    maskShape: "circle" | "rectangle" | "diamond" | "wave" | "star"
    textColor: string
    backgroundColor: string
    revealedTextColor: string
    textGradient: boolean
    gradientStart: string
    gradientEnd: string
    maskSize: number
    font: any
    enableTextScaling: boolean
    style?: CSSProperties
}

/**
 * Text Reveal Mask Scroller
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TextRevealScroller(props: TextRevealScrollerProps) {
    const {
        text = "REVEAL",
        maskShape = "circle",
        textColor = "#CCCCCC",
        backgroundColor = "#000000",
        revealedTextColor = "#FFFFFF",
        textGradient = false,
        gradientStart = "#FF6B6B",
        gradientEnd = "#4ECDC4",
        maskSize = 200,
        font,
        enableTextScaling = false
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const textMeasureRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 })
    const [scaledFontSize, setScaledFontSize] = useState<string>("clamp(2rem, 8vw, 8rem)")
    const timeRef = useRef(0)
    
    // Mouse position for cursor following
    const mouseX = useMotionValue(dimensions.width / 2)
    const mouseY = useMotionValue(dimensions.height / 2)
    
    // Smooth mouse following with spring
    const springMouseX = useSpring(mouseX, { stiffness: 200, damping: 20 })
    const springMouseY = useSpring(mouseY, { stiffness: 200, damping: 20 })

    // Animation frame for wave animation
    useAnimationFrame((time) => {
        timeRef.current = time * 0.001 // Convert to seconds
    })

    // Text scaling logic
    useEffect(() => {
        if (!enableTextScaling || !containerRef.current || !textMeasureRef.current || !text.trim()) {
            setScaledFontSize(font?.fontSize || "clamp(2rem, 8vw, 8rem)")
            return
        }

        const measureText = () => {
            const container = containerRef.current
            const measureElement = textMeasureRef.current
            
            if (!container || !measureElement) return

            const containerWidth = container.offsetWidth - 40 // Account for padding
            const baseFontSize = 120 // Start with a large font size
            
            // Set initial large font size
            measureElement.style.fontSize = `${baseFontSize}px`
            measureElement.textContent = text
            
            let currentFontSize = baseFontSize
            let textWidth = measureElement.scrollWidth
            
            // Scale down until text fits
            while (textWidth > containerWidth && currentFontSize > 12) {
                currentFontSize -= 2
                measureElement.style.fontSize = `${currentFontSize}px`
                textWidth = measureElement.scrollWidth
            }
            
            startTransition(() => {
                setScaledFontSize(`${currentFontSize}px`)
            })
        }

        // Measure immediately and on resize
        measureText()
        
        if (typeof window !== "undefined") {
            const resizeObserver = new ResizeObserver(measureText)
            resizeObserver.observe(containerRef.current)
            
            return () => resizeObserver.disconnect()
        }
    }, [text, enableTextScaling, font?.fontSize, dimensions])

    // Create dynamic clipPath based on mouse position and mask shape
    const clipPath = useTransform(
        [springMouseX, springMouseY],
        ([x, y]: [number, number]) => {
            const radius = maskSize / 2
            
            switch (maskShape) {
                case "circle":
                    return `circle(${radius}px at ${x}px ${y}px)`
                case "rectangle":
                    const left = Math.max(0, x - radius)
                    const top = Math.max(0, y - radius)
                    const right = Math.min(dimensions.width, x + radius)
                    const bottom = Math.min(dimensions.height, y + radius)
                    return `inset(${top}px ${dimensions.width - right}px ${dimensions.height - bottom}px ${left}px)`
                case "diamond":
                    return `polygon(${x}px ${y - radius}px, ${x + radius}px ${y}px, ${x}px ${y + radius}px, ${x - radius}px ${y}px)`
                case "star":
                    // Create a 5-pointed star shape
                    const outerRadius = radius
                    const innerRadius = radius * 0.4
                    const points = []
                    
                    for (let i = 0; i < 10; i++) {
                        const angle = (i * Math.PI) / 5 - Math.PI / 2
                        const currentRadius = i % 2 === 0 ? outerRadius : innerRadius
                        const pointX = x + Math.cos(angle) * currentRadius
                        const pointY = y + Math.sin(angle) * currentRadius
                        points.push(`${pointX}px ${pointY}px`)
                    }
                    
                    return `polygon(${points.join(', ')})`
                case "wave":
                    // Enhanced splash/ink spot shape with better animation
                    const time = timeRef.current
                    const baseRadius = radius * 0.7
                    
                    // Generate multiple irregular points for dynamic splash effect
                    const pointsWave = []
                    const numPoints = 16 // More points for smoother shape
                    
                    for (let i = 0; i < numPoints; i++) {
                        const angle = (i / numPoints) * Math.PI * 2
                        
                        // Create complex irregular radius variations
                        let pointRadius = baseRadius
                        
                        // Primary wave patterns
                        pointRadius += Math.sin(angle * 2 + time * 1.5) * radius * 0.4
                        pointRadius += Math.cos(angle * 3 + time * 2.2) * radius * 0.3
                        pointRadius += Math.sin(angle * 5 + time * 1.8) * radius * 0.25
                        
                        // Secondary organic variations
                        pointRadius += Math.cos(angle * 4 + time * 2.5 + i * 0.3) * radius * 0.2
                        pointRadius += Math.sin(angle * 6 + time * 1.3 + i * 0.7) * radius * 0.15
                        
                        // Tertiary fine details
                        pointRadius += Math.sin(angle * 8 + time * 3.1 + i * 0.5) * radius * 0.1
                        pointRadius += Math.cos(angle * 7 + time * 2.8 + i * 0.9) * radius * 0.12
                        
                        // Add some "splatter" effect with random-like variations
                        const splatterOffset = Math.sin(angle * 11 + time * 4.2 + i * 1.3) * radius * 0.08
                        pointRadius += splatterOffset
                        
                        // Ensure minimum and maximum bounds
                        pointRadius = Math.max(pointRadius, baseRadius * 0.3)
                        pointRadius = Math.min(pointRadius, baseRadius * 1.8)
                        
                        const pointX = x + Math.cos(angle) * pointRadius
                        const pointY = y + Math.sin(angle) * pointRadius
                        
                        pointsWave.push(`${pointX}px ${pointY}px`)
                    }
                    
                    return `polygon(${pointsWave.join(', ')})`
                default:
                    return `circle(${radius}px at ${x}px ${y}px)`
            }
        }
    )

    // Handle mouse movement for cursor following
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || isStatic) return
        
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        startTransition(() => {
            mouseX.set(x)
            mouseY.set(y)
        })
    }

    // Handle mouse leave to keep cursor in bounds
    const handleMouseLeave = () => {
        if (!containerRef.current || isStatic) return
        
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        mouseX.set(centerX)
        mouseY.set(centerY)
    }

    // Update dimensions on mount and resize
    useEffect(() => {
        if (!containerRef.current) return
        
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => {
                    setDimensions({ 
                        width: rect.width || 800, 
                        height: rect.height || 400 
                    })
                })
            }
        }
        
        updateDimensions()
        
        if (typeof window !== "undefined") {
            window.addEventListener("resize", updateDimensions)
            return () => window.removeEventListener("resize", updateDimensions)
        }
    }, [])

    // Initialize mouse position to center when dimensions change
    useEffect(() => {
        mouseX.set(dimensions.width / 2)
        mouseY.set(dimensions.height / 2)
    }, [dimensions, mouseX, mouseY])

    // Text gradient style
    const textGradientStyle = textGradient ? {
        background: `linear-gradient(45deg, ${gradientStart}, ${gradientEnd})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text"
    } : {}

    // Determine final font size
    const finalFontSize = enableTextScaling ? scaledFontSize : (font?.fontSize || "clamp(2rem, 8vw, 8rem)")

    // Base text styles
    const baseTextStyles = {
        position: "absolute" as const,
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: finalFontSize,
        fontWeight: "900",
        letterSpacing: "-0.05em",
        lineHeight: "0.9",
        textAlign: "center" as const,
        userSelect: "none" as const,
        ...(enableTextScaling ? {
            whiteSpace: "nowrap" as const,
        } : {
            whiteSpace: "pre-wrap" as const,
            wordBreak: "break-word" as const,
            overflowWrap: "break-word" as const,
            hyphens: "auto" as const,
        }),
        ...font
    }

    // Static fallback for non-interactive environments
    if (isStatic) {
        const staticClipPath = `circle(${maskSize / 2}px at ${dimensions.width / 2}px ${dimensions.height / 2}px)`
        
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...props.style
                }}
            >
                {/* Hidden text measurement element */}
                <div
                    ref={textMeasureRef}
                    style={{
                        position: "absolute",
                        visibility: "hidden",
                        whiteSpace: "nowrap",
                        fontSize: finalFontSize,
                        fontWeight: "900",
                        letterSpacing: "-0.05em",
                        ...font
                    }}
                />

                {/* Background text */}
                <div
                    style={{
                        ...baseTextStyles,
                        color: textColor,
                    }}
                >
                    {text}
                </div>

                {/* Revealed text with static mask */}
                <div
                    style={{
                        ...baseTextStyles,
                        color: textGradient ? "transparent" : revealedTextColor,
                        clipPath: staticClipPath,
                        WebkitClipPath: staticClipPath,
                        ...textGradientStyle
                    }}
                >
                    {text}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "none",
                ...props.style
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Hidden text measurement element */}
            <div
                ref={textMeasureRef}
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: finalFontSize,
                    fontWeight: "900",
                    letterSpacing: "-0.05em",
                    ...font
                }}
            />

            {/* Background text */}
            <div
                style={{
                    ...baseTextStyles,
                    color: textColor,
                }}
            >
                {text}
            </div>

            {/* Revealed text with animated mask */}
            <motion.div
                style={{
                    ...baseTextStyles,
                    color: textGradient ? "transparent" : revealedTextColor,
                    ...textGradientStyle,
                    clipPath
                }}
            >
                {text}
            </motion.div>
        </div>
    )
}

addPropertyControls(TextRevealScroller, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "REVEAL"
    },
    enableTextScaling: {
        type: ControlType.Boolean,
        title: "Fit Text",
        defaultValue: false,
        enabledTitle: "Auto Scale",
        disabledTitle: "Fixed Size"
    },
    maskShape: {
        type: ControlType.Enum,
        title: "Mask Shape",
        options: ["circle", "rectangle", "diamond", "wave", "star"],
        optionTitles: ["Circle", "Rectangle", "Diamond", "Wave", "Star"],
        defaultValue: "circle"
    },
    maskSize: {
        type: ControlType.Number,
        title: "Mask Size",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10,
        unit: "px"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000"
    },
    textColor: {
        type: ControlType.Color,
        title: "Hidden Text Color",
        defaultValue: "#CCCCCC"
    },
    textGradient: {
        type: ControlType.Boolean,
        title: "Gradient Text",
        defaultValue: false,
        enabledTitle: "Gradient",
        disabledTitle: "Solid"
    },
    revealedTextColor: {
        type: ControlType.Color,
        title: "Revealed Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ textGradient }) => textGradient
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#FF6B6B",
        hidden: ({ textGradient }) => !textGradient
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#4ECDC4",
        hidden: ({ textGradient }) => !textGradient
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "clamp(2rem, 8vw, 8rem)",
            variant: "Black",
            letterSpacing: "-0.05em",
            lineHeight: "0.9em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    }
})

TextRevealScroller.displayName = "Text Reveal Lens"