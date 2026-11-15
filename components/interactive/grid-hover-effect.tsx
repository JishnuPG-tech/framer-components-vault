// Big pixel cursor movement component with hover animations
import { useState, useRef, useCallback, useMemo, useEffect, type CSSProperties } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PixelHoverGridProps {
    gridSize: number
    hoverColor: string
    hoverColor2: string
    hoverColor3: string
    hoverColor4: string
    backgroundColor: string
    animationDuration: number
    maxOpacity: number
    borderColor: string
    borderWidth: number
    borderStyle: "solid" | "dashed" | "dotted"
    showCursor: boolean
    cursorColor: string
    cursorSize: number
    style?: CSSProperties
}

/**
 * Big Pixel Cursor Component
 * 
 * Creates a grid of large pixels that animate when hovered.
 * Each pixel fills with color, reduces opacity, and disappears on hover.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PixelHoverGrid(props: PixelHoverGridProps) {
    const {
        gridSize = 20,
        hoverColor = "#FF5588",
        hoverColor2 = "#0099FF",
        hoverColor3 = "#22CC66",
        hoverColor4 = "#FFBB00",
        backgroundColor = "#F5F5F5",
        animationDuration = 0.8,
        maxOpacity = 1,
        borderColor = "#CCCCCC",
        borderWidth = 1,
        borderStyle = "solid",
        showCursor = true,
        cursorColor = "#FF0000",
        cursorSize = 20,
    } = props

    const [hoveredPixels, setHoveredPixels] = useState<Set<string>>(new Set())
    const [animatingPixels, setAnimatingPixels] = useState<Set<string>>(new Set())
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [isMouseInside, setIsMouseInside] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (!containerRef.current) return
        
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setContainerDimensions({ width: rect.width, height: rect.height })
            }
        }
        
        updateDimensions()
        
        const resizeObserver = new ResizeObserver(updateDimensions)
        resizeObserver.observe(containerRef.current)
        
        return () => resizeObserver.disconnect()
    }, [])

    const actualGridSize = Math.min(gridSize, Math.floor(Math.min(containerDimensions.width, containerDimensions.height) / 10)) // Ensure pixels aren't too small

    const pixels = useMemo(() => {
        const pixelArray = []
        for (let row = 0; row < actualGridSize; row++) {
            for (let col = 0; col < actualGridSize; col++) {
                pixelArray.push({ row, col, id: `${row}-${col}` })
            }
        }
        return pixelArray
    }, [actualGridSize])

    const handlePixelHover = useCallback((pixelId: string) => {
        if (isStatic) return
        
        setHoveredPixels(prev => new Set(prev).add(pixelId))
        setAnimatingPixels(prev => new Set(prev).add(pixelId))
    }, [isStatic])

    const handleAnimationComplete = useCallback((pixelId: string) => {
        setHoveredPixels(prev => {
            const newSet = new Set(prev)
            newSet.delete(pixelId)
            return newSet
        })
        setAnimatingPixels(prev => {
            const newSet = new Set(prev)
            newSet.delete(pixelId)
            return newSet
        })
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isStatic || !containerRef.current) return
        
        const rect = containerRef.current.getBoundingClientRect()
        setCursorPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }, [isStatic])

    const handleMouseEnter = useCallback(() => {
        setIsMouseInside(true)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsMouseInside(false)
    }, [])

    const getRandomHoverColor = useCallback(() => {
        const colors = [hoverColor, hoverColor2, hoverColor3, hoverColor4]
        return colors[Math.floor(Math.random() * colors.length)]
    }, [hoverColor, hoverColor2, hoverColor3, hoverColor4])

    const getPixelColor = useCallback((pixelId: string) => {
        const colors = [hoverColor, hoverColor2, hoverColor3, hoverColor4]
        // Use pixel ID to determine consistent color for each cell
        const hash = pixelId.split('-').reduce((acc, val) => acc + parseInt(val), 0)
        return colors[hash % colors.length]
    }, [hoverColor, hoverColor2, hoverColor3, hoverColor4])

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "grid",
                    gridTemplateColumns: `repeat(${actualGridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${actualGridSize}, 1fr)`,
                    gap: 1,
                    position: "relative",
                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                }}
            >
                {pixels.slice(0, Math.min(pixels.length, 100)).map((pixel, index) => (
                    <div
                        key={pixel.id}
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: index % 7 === 0 ? hoverColor : "transparent",
                            opacity: index % 7 === 0 ? 0.3 : 1,
                            border: `1px ${borderStyle} ${borderColor}`,
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                cursor: "default",
                userSelect: "none",
                display: "grid",
                gridTemplateColumns: `repeat(${actualGridSize}, 1fr)`,
                gridTemplateRows: `repeat(${actualGridSize}, 1fr)`,
                gap: 1,
                border: `${borderWidth}px ${borderStyle} ${borderColor}`,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {pixels.map((pixel) => {
                const isAnimating = animatingPixels.has(pixel.id)

                return (
                    <div
                        key={pixel.id}
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            border: `1px ${borderStyle} ${borderColor}`,
                        }}
                        onMouseEnter={() => handlePixelHover(pixel.id)}
                    >
                        <AnimatePresence>
                            {isAnimating && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        scale: 0.8,
                                    }}
                                    animate={{
                                        opacity: [0, maxOpacity, maxOpacity * 0.7, 0],
                                        scale: [0.8, 1, 1.1, 1.2],
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 1.3,
                                    }}
                                    transition={{
                                        duration: animationDuration,
                                        ease: "easeOut",
                                        times: [0, 0.3, 0.7, 1],
                                    }}
                                    onAnimationComplete={() => handleAnimationComplete(pixel.id)}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: getPixelColor(pixel.id),
                                        borderRadius: 2,
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}
            
            {/* Custom Cursor */}
            {showCursor && isMouseInside && (
                <motion.div
                    style={{
                        position: "absolute",
                        width: cursorSize,
                        height: cursorSize,
                        backgroundColor: cursorColor,
                        borderRadius: "50%",
                        pointerEvents: "none",
                        zIndex: 1000,
                        left: cursorPosition.x - cursorSize / 2,
                        top: cursorPosition.y - cursorSize / 2,
                        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                />
            )}
        </div>
    )
}

addPropertyControls(PixelHoverGrid, {
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color 1",
        defaultValue: "#FF5588",
    },
    hoverColor2: {
        type: ControlType.Color,
        title: "Hover Color 2",
        defaultValue: "#0099FF",
    },
    hoverColor3: {
        type: ControlType.Color,
        title: "Hover Color 3",
        defaultValue: "#22CC66",
    },
    hoverColor4: {
        type: ControlType.Color,
        title: "Hover Color 4",
        defaultValue: "#FFBB00",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    maxOpacity: {
        type: ControlType.Number,
        title: "Max Opacity",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#CCCCCC",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        options: ["solid", "dashed", "dotted"],
        optionTitles: ["Solid", "Dashed", "Dotted"],
        defaultValue: "solid",
    },
    showCursor: {
        type: ControlType.Boolean,
        title: "Show Custom Cursor",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#FF0000",
        hidden: ({ showCursor }) => !showCursor,
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 20,
        min: 10,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ showCursor }) => !showCursor,
    },
})