import { useRef, useEffect, useMemo, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CubeTextGridProps {
    text: string
    gridSize: number
    fontSize: number
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    cubeColor: string
    pulseSpeed: number
    rotationSpeed: number
    cubeSize: number
    style?: React.CSSProperties
}

/**
 * 3D Cube with Animated Text Grid
 * 
 * Each face displays a pulsating grid of letters that animate.
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CubeTextGrid(props: CubeTextGridProps) {
    const {
        text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        gridSize = 8,
        fontSize = 24,
        primaryColor = "#00FFFF",
        secondaryColor = "#FF00FF",
        backgroundColor = "#000000",
        cubeColor = "#111111",
        pulseSpeed = 1,
        rotationSpeed = 0.5,
        cubeSize = 200,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const hitAreaRef = useRef<HTMLDivElement>(null)
    const [rotation, setRotation] = useState({ x: -25, y: 45 })
    const [isDragging, setIsDragging] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const rotationRef = useRef({ x: -25, y: 45 })
    const frameRef = useRef<number>(0)
    const isStatic = useIsStaticRenderer()

    const letters = useMemo(() => text.split(""), [text])

    // Auto-rotation animation
    useEffect(() => {
        if (isStatic || isDragging || isHovering) return

        let lastTime = performance.now()
        
        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastTime
            lastTime = currentTime

            rotationRef.current.y += rotationSpeed * deltaTime * 0.05
            
            startTransition(() => {
                setRotation({ ...rotationRef.current })
            })

            frameRef.current = requestAnimationFrame(animate)
        }

        frameRef.current = requestAnimationFrame(animate)

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current)
            }
        }
    }, [rotationSpeed, isDragging, isHovering, isStatic])

    // Mouse/touch handlers for manual rotation
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (isStatic) return
        e.preventDefault()
        setIsDragging(true)
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        
        dragStartRef.current = {
            x: clientX - rotationRef.current.y,
            y: clientY - rotationRef.current.x
        }
    }

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isStatic) return
        
        // Use hit area for cursor tracking (extends outside canvas)
        const targetRef = hitAreaRef.current || containerRef.current
        if (!targetRef) return
        
        const rect = targetRef.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        
        if (isDragging) {
            rotationRef.current = {
                x: (clientY - dragStartRef.current.y) * 0.5,
                y: (clientX - dragStartRef.current.x) * 0.5
            }
            
            startTransition(() => {
                setRotation({ ...rotationRef.current })
            })
        } else {
            // Follow cursor on hover - calculate based on expanded hit area
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            
            // Calculate rotation based on cursor position relative to center
            // Range: -30 to 30 degrees for X (vertical), -45 to 45 for Y (horizontal)
            const rotateX = ((clientY - centerY) / (rect.height / 2)) * -30
            const rotateY = ((clientX - centerX) / (rect.width / 2)) * 45
            
            rotationRef.current = { x: rotateX, y: rotateY }
            
            startTransition(() => {
                setRotation({ x: rotateX, y: rotateY })
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleMouseEnter = () => {
        if (!isStatic) {
            setIsHovering(true)
        }
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        setIsDragging(false)
    }

    // Generate grid content for each face
    const generateFaceContent = (faceIndex: number) => {
        const cells = []
        const letterOffset = faceIndex * Math.floor(letters.length / 6)
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const letterIndex = (letterOffset + row * gridSize + col) % letters.length
                cells.push({
                    key: `${faceIndex}-${row}-${col}`,
                    letter: letters[letterIndex],
                    row,
                    col,
                })
            }
        }
        
        return cells
    }

    const faces = [
        { transform: `translateZ(${cubeSize / 2}px)`, name: "front" },
        { transform: `translateZ(-${cubeSize / 2}px) rotateY(180deg)`, name: "back" },
        { transform: `translateX(-${cubeSize / 2}px) rotateY(-90deg)`, name: "left" },
        { transform: `translateX(${cubeSize / 2}px) rotateY(90deg)`, name: "right" },
        { transform: `translateY(-${cubeSize / 2}px) rotateX(90deg)`, name: "top" },
        { transform: `translateY(${cubeSize / 2}px) rotateX(-90deg)`, name: "bottom" },
    ]

    if (isStatic) {
        return (
            <div
                style={{
                    ...props.style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: backgroundColor,
                    color: primaryColor,
                    fontFamily: "monospace",
                    fontSize: 24,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
                    <div>Cube Text Grid</div>
                    <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>Preview in canvas</div>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={hitAreaRef}
            style={{
                position: "absolute",
                top: -100,
                left: -100,
                right: -100,
                bottom: -100,
                zIndex: 1,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={containerRef}
                style={{
                    ...props.style,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background: backgroundColor,
                    perspective: "800px",
                    cursor: isDragging ? "grabbing" : isHovering ? "crosshair" : "grab",
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                <style>{`
                    @keyframes pulse {
                        0% {
                            transform: scale(0.7);
                            opacity: 0.5;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                `}</style>
                <div
                    style={{
                        width: cubeSize,
                        height: cubeSize,
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginLeft: -cubeSize / 2,
                        marginTop: -cubeSize / 2,
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        transition: isDragging ? "none" : "transform 0.1s ease-out",
                    }}
                >
                    {faces.map((face, faceIndex) => (
                        <div
                            key={face.name}
                            style={{
                                position: "absolute",
                                width: cubeSize,
                                height: cubeSize,
                                transform: face.transform,
                                background: cubeColor,
                                border: `1px solid ${primaryColor}33`,
                                display: "grid",
                                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                                overflow: "hidden",
                                backfaceVisibility: "hidden",
                            }}
                        >
                            {generateFaceContent(faceIndex).map((cell, i) => (
                                <PulsingLetter
                                    key={cell.key}
                                    letter={cell.letter}
                                    fontSize={fontSize}
                                    primaryColor={primaryColor}
                                    secondaryColor={secondaryColor}
                                    pulseSpeed={pulseSpeed}
                                    index={i + faceIndex * 100}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Separate component for pulsing animation - now using CSS for performance
function PulsingLetter({
    letter,
    fontSize,
    primaryColor,
    secondaryColor,
    pulseSpeed,
    index,
}: {
    letter: string
    fontSize: number
    primaryColor: string
    secondaryColor: string
    pulseSpeed: number
    index: number
}) {
    const animationDuration = pulseSpeed > 0 ? `${2 / pulseSpeed}s` : '2s'
    const delay = `${(index % 20) * 0.1}s`
    
    // Use CSS color-mix for reliable cross-browser color interpolation
    const totalCells = 64 // 8x8 grid
    const colorFactor = (index % totalCells) / totalCells
    const percentage = Math.round(colorFactor * 100)

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
                fontSize: fontSize,
                fontWeight: "bold",
                color: `color-mix(in srgb, ${primaryColor} ${100 - percentage}%, ${secondaryColor} ${percentage}%)`,
                textShadow: `0 0 10px ${primaryColor}80`,
                animation: `pulse ${animationDuration} ease-in-out ${delay} infinite alternate`,
            }}
            className="pulsing-letter"
        >
            {letter}
        </div>
    )
}

// Remove or keep the helper for potential future use - keeping but making it handle edge cases
function interpolateColor(color1: string, color2: string, factor: number): string {
    // Fallback: just return primary color if parsing fails
    try {
        // Check if colors are in expected hex format
        if (!color1.startsWith('#') || !color2.startsWith('#') || color1.length < 7 || color2.length < 7) {
            return color1
        }
        
        const r1 = parseInt(color1.slice(1, 3), 16)
        const g1 = parseInt(color1.slice(3, 5), 16)
        const b1 = parseInt(color1.slice(5, 7), 16)
        
        const r2 = parseInt(color2.slice(1, 3), 16)
        const g2 = parseInt(color2.slice(3, 5), 16)
        const b2 = parseInt(color2.slice(5, 7), 16)
        
        if (isNaN(r1) || isNaN(g1) || isNaN(b1) || isNaN(r2) || isNaN(g2) || isNaN(b2)) {
            return color1
        }
        
        const r = Math.round(r1 + (r2 - r1) * factor)
        const g = Math.round(g1 + (g2 - g1) * factor)
        const b = Math.round(b1 + (b2 - b1) * factor)
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    } catch {
        return color1
    }
}

addPropertyControls(CubeTextGrid, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        description: "Letters to display in the grid",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 8,
        min: 4,
        max: 16,
        step: 1,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 24,
        min: 12,
        max: 48,
        step: 2,
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#00FFFF",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#FF00FF",
    },
    cubeColor: {
        type: ControlType.Color,
        title: "Cube Color",
        defaultValue: "#111111",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    pulseSpeed: {
        type: ControlType.Number,
        title: "Pulse Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
    },
    cubeSize: {
        type: ControlType.Number,
        title: "Cube Size",
        defaultValue: 200,
        min: 100,
        max: 300,
        step: 10,
        unit: "px",
    },
})