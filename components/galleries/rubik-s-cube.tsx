import React, { useState, useRef, useEffect } from "react"
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


/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 */
export default function RubiksCube(props: RubiksCubeProps) {
    const {
        cubeSize = 60,
        gap = 2,
        rotationSpeed = 0.5,
        shuffleSpeed = 500,
        autoRotate = false,
        showControls = true,
        frontImages = [],
        backImages = [],
        topImages = [],
        bottomImages = [],
        leftImages = [],
        rightImages = [],
        backgroundColor = "#000000",
        borderRadius = 4,
        useImages = false,
    } = props

    // Create image segments for each face
    const createImageSegments = (images: any[]) => {
        const segments = Array(9).fill(null)

        if (useImages && images && images.length > 0) {
            // If we have exactly 9 images, map them directly
            if (images.length === 9) {
                return images
            }
            // If we have 1 image, split it into 9 segments
            else if (images.length === 1 && images[0]) {
                const singleImage = images[0]
                return Array(9)
                    .fill(null)
                    .map((_, index) => ({
                        ...singleImage,
                        segmentIndex: index,
                        totalSegments: 9,
                    }))
            }
            // If we have multiple images but not 9, repeat or fill
            else {
                return Array(9)
                    .fill(null)
                    .map((_, index) => {
                        const imageIndex = index % images.length
                        return images[imageIndex]
                            ? {
                                  ...images[imageIndex],
                                  segmentIndex: index,
                                  totalSegments: 9,
                              }
                            : null
                    })
            }
        }

        // Fallback to default colors if no images
        const defaultColors = [
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#ff9900",
            "#ffffff",
        ]
        return segments.map(
            (_, index) =>
                defaultColors[Math.floor(index / 3) % defaultColors.length]
        )
    }

    // Cube state - 6 faces, each with 9 squares (3x3)
    const [cubeState, setCubeState] = useState({
        front: createImageSegments(frontImages),
        back: createImageSegments(backImages),
        top: createImageSegments(topImages),
        bottom: createImageSegments(bottomImages),
        left: createImageSegments(leftImages),
        right: createImageSegments(rightImages),
    })

    const [rotation, setRotation] = useState({ x: -25, y: 45, z: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isShuffling, setIsShuffling] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Initialize solved cube
    useEffect(() => {
        setCubeState({
            front: createImageSegments(frontImages),
            back: createImageSegments(backImages),
            top: createImageSegments(topImages),
            bottom: createImageSegments(bottomImages),
            left: createImageSegments(leftImages),
            right: createImageSegments(rightImages),
        })
    }, [
        frontImages,
        backImages,
        topImages,
        bottomImages,
        leftImages,
        rightImages,
        useImages,
    ])

    // Auto-rotation effect
    useEffect(() => {
        if (autoRotate && !isDragging && !isShuffling) {
            const interval = setInterval(() => {
                setRotation((prev) => ({ ...prev, y: prev.y + 1 }))
            }, 50)
            return () => clearInterval(interval)
        }
    }, [autoRotate, isDragging, isShuffling])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return

        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        setRotation((prev: any) => ({
            x: prev.x + deltaY * rotationSpeed,
            y: prev.y + deltaX * rotationSpeed,
            z: prev.z,
        }))

        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Global mouse event handlers for drag persistence
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            const deltaX = e.clientX - dragStart.x
            const deltaY = e.clientY - dragStart.y

            setRotation((prev: any) => ({
                x: prev.x + deltaY * rotationSpeed,
                y: prev.y + deltaX * rotationSpeed,
                z: prev.z,
            }))

            setDragStart({ x: e.clientX, y: e.clientY })
        }

        const handleGlobalMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            document.addEventListener("mousemove", handleGlobalMouseMove)
            document.addEventListener("mouseup", handleGlobalMouseUp)
        }

        return () => {
            document.removeEventListener("mousemove", handleGlobalMouseMove)
            document.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isDragging, dragStart, rotationSpeed])

    // Rotate a face clockwise
    const rotateFace = (face: string) => {
        setCubeState((prev: any) => {
            const newState = { ...prev }
            const faceColors = [...prev[face as keyof typeof prev]]

            // Rotate the face itself
            const temp = [
                faceColors[0],
                faceColors[1],
                faceColors[2],
                faceColors[3],
                faceColors[4],
                faceColors[5],
                faceColors[6],
                faceColors[7],
                faceColors[8],
            ]

            faceColors[0] = temp[6]
            faceColors[1] = temp[3]
            faceColors[2] = temp[0]
            faceColors[3] = temp[7]
            faceColors[4] = temp[4]
            faceColors[5] = temp[1]
            faceColors[6] = temp[8]
            faceColors[7] = temp[5]
            faceColors[8] = temp[2]

            newState[face as keyof typeof newState] = faceColors

            // Rotate adjacent edges
            if (face === "front") {
                const temp = [newState.top[6], newState.top[7], newState.top[8]]
                newState.top[6] = newState.left[8]
                newState.top[7] = newState.left[5]
                newState.top[8] = newState.left[2]
                newState.left[2] = newState.bottom[0]
                newState.left[5] = newState.bottom[1]
                newState.left[8] = newState.bottom[2]
                newState.bottom[0] = newState.right[6]
                newState.bottom[1] = newState.right[3]
                newState.bottom[2] = newState.right[0]
                newState.right[0] = temp[0]
                newState.right[3] = temp[1]
                newState.right[6] = temp[2]
            }
            // Add other face rotations here for completeness

            return newState
        })
    }

    // Shuffle the cube
    const shuffleCube = async () => {
        setIsShuffling(true)
        const faces = ["front", "back", "top", "bottom", "left", "right"]
        const shuffleMoves = 20

        for (let i = 0; i < shuffleMoves; i++) {
            const randomFace = faces[Math.floor(Math.random() * faces.length)]
            rotateFace(randomFace)
            await new Promise((resolve) =>
                setTimeout(resolve, shuffleSpeed / shuffleMoves)
            )
        }

        setIsShuffling(false)
    }

    // Reset the cube
    const resetCube = () => {
        setCubeState({
            front: createImageSegments(frontImages),
            back: createImageSegments(backImages),
            top: createImageSegments(topImages),
            bottom: createImageSegments(bottomImages),
            left: createImageSegments(leftImages),
            right: createImageSegments(rightImages),
        })
        setRotation({ x: -25, y: 45, z: 0 })
    }

    const createFace = (faceData: any[], facePosition: string) => {
        const transformMap = {
            front: `translateZ(${cubeSize * 1.5}px)`,
            back: `rotateY(180deg) translateZ(${cubeSize * 1.5}px)`,
            top: `rotateX(90deg) translateZ(${cubeSize * 1.5}px)`,
            bottom: `rotateX(-90deg) translateZ(${cubeSize * 1.5}px)`,
            left: `rotateY(-90deg) translateZ(${cubeSize * 1.5}px)`,
            right: `rotateY(90deg) translateZ(${cubeSize * 1.5}px)`,
        }

        const renderSegment = (segment: any, index: number) => {
            // Check if this is an image object
            if (
                useImages &&
                segment &&
                typeof segment === "object" &&
                segment.src
            ) {
                const { src, segmentIndex, totalSegments } = segment

                // Calculate background position for image segments
                const row = Math.floor(index / 3)
                const col = index % 3

                return (
                    <motion.div
                        key={index}
                        style={{
                            backgroundImage: `url(${src})`,
                            backgroundSize: totalSegments
                                ? `${cubeSize * 3}px ${cubeSize * 3}px`
                                : "cover",
                            backgroundPosition: totalSegments
                                ? `-${col * (cubeSize - gap)}px -${row * (cubeSize - gap)}px`
                                : "center",
                            backgroundRepeat: "no-repeat",
                            borderRadius: `${borderRadius}px`,
                            border: `1px solid rgba(0,0,0,0.1)`,
                            width: "100%",
                            height: "100%",
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                    />
                )
            }

            // Fallback to color if no image
            return (
                <motion.div
                    key={index}
                    style={{
                        backgroundColor:
                            typeof segment === "string" ? segment : "#cccccc",
                        borderRadius: `${borderRadius}px`,
                        border: `1px solid rgba(0,0,0,0.1)`,
                    }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                />
            )
        }

        return (
            <div
                className="face"
                style={{
                    position: "absolute",
                    width: `${cubeSize * 3}px`,
                    height: `${cubeSize * 3}px`,
                    display: "grid",
                    gridTemplateColumns: `repeat(3, ${cubeSize - gap}px)`,
                    gridTemplateRows: `repeat(3, ${cubeSize - gap}px)`,
                    gap: `${gap}px`,
                    padding: `${gap}px`,
                    transform:
                        transformMap[facePosition as keyof typeof transformMap],
                    backgroundColor: backgroundColor,
                }}
            >
                {faceData.map((segment, index) =>
                    renderSegment(segment, index)
                )}
            </div>
        )
    }

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1000px",
    }

    const cubeContainerStyle: React.CSSProperties = {
        width: `${cubeSize * 3}px`,
        height: `${cubeSize * 3}px`,
        position: "relative",
        transformStyle: "preserve-3d",
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging
            ? "none"
            : `transform ${rotationSpeed}s ease-out`,
    }

    const controlsStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        marginTop: "20px",
        flexWrap: "wrap",
        justifyContent: "center",
    }

    const buttonStyle: React.CSSProperties = {
        padding: "8px 16px",
        backgroundColor: "#6366f1",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
        transition: "all 0.2s ease",
    }

    return (
        <div style={containerStyle}>
            <div
                ref={containerRef}
                style={cubeContainerStyle}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => {
                    if (!isDragging) {
                        const quickShuffle = async () => {
                            const faces = [
                                "front",
                                "back",
                                "top",
                                "bottom",
                                "left",
                                "right",
                            ]
                            const quickMoves = 5

                            for (let i = 0; i < quickMoves; i++) {
                                const randomFace =
                                    faces[
                                        Math.floor(Math.random() * faces.length)
                                    ]
                                rotateFace(randomFace)
                                await new Promise((resolve) =>
                                    setTimeout(resolve, 50)
                                )
                            }
                        }
                        quickShuffle()
                    }
                }}
            >
                <motion.div
                    animate={{
                        rotateX: rotation.x,
                        rotateY: rotation.y,
                        rotateZ: rotation.z,
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        transition: isDragging
                            ? "none"
                            : "transform 0.1s ease-out",
                    }}
                >
                    {createFace(cubeState.front, "front")}
                    {createFace(cubeState.back, "back")}
                    {createFace(cubeState.top, "top")}
                    {createFace(cubeState.bottom, "bottom")}
                    {createFace(cubeState.left, "left")}
                    {createFace(cubeState.right, "right")}
                </motion.div>
            </div>

            {showControls && (
                <div style={controlsStyle}>
                    <button
                        style={buttonStyle}
                        onClick={(e: any) => {
                            e.stopPropagation()
                            shuffleCube()
                        }}
                        disabled={isShuffling}
                    >
                        {isShuffling ? "Shuffling..." : "Shuffle"}
                    </button>
                    <button
                        style={buttonStyle}
                        onClick={(e) => {
                            e.stopPropagation()
                            resetCube()
                        }}
                    >
                        Reset
                    </button>
                    <button
                        style={buttonStyle}
                        onClick={(e) => {
                            e.stopPropagation()
                            rotateFace("front")
                        }}
                    >
                        Rotate Front
                    </button>
                    <button
                        style={buttonStyle}
                        onClick={(e) => {
                            e.stopPropagation()
                            setRotation({ x: -25, y: 45, z: 0 })
                        }}
                    >
                        Reset View
                    </button>
                </div>
            )}
        </div>
    )
}

interface RubiksCubeProps {
    cubeSize?: number
    gap?: number
    rotationSpeed?: number
    shuffleSpeed?: number
    autoRotate?: boolean
    showControls?: boolean
    frontImages?: any[]
    backImages?: any[]
    topImages?: any[]
    bottomImages?: any[]
    leftImages?: any[]
    rightImages?: any[]
    backgroundColor?: string
    borderRadius?: number
    useImages?: boolean
}

RubiksCube.defaultProps = {
    cubeSize: 60,
    gap: 2,
    rotationSpeed: 0.5,
    shuffleSpeed: 500,
    autoRotate: false,
    showControls: true,
    frontImages: [],
    backImages: [],
    topImages: [],
    bottomImages: [],
    leftImages: [],
    rightImages: [],
    backgroundColor: "#000000",
    borderRadius: 4,
    useImages: false,
}

addPropertyControls(RubiksCube, {
    cubeSize: {
        type: ControlType.Number,
        title: "Cube Size",
        defaultValue: 60,
        min: 20,
        max: 100,
        step: 5,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap Between Squares",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    shuffleSpeed: {
        type: ControlType.Number,
        title: "Shuffle Speed",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: false,
        description: "Automatically rotate the cube when idle",
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Show Controls",
        defaultValue: true,
        description: "Display control buttons",
    },
    useImages: {
        type: ControlType.Boolean,
        title: "Use Images",
        defaultValue: false,
        description: "Display images instead of colors on cube faces",
    },
    frontImages: {
        type: ControlType.Array,
        title: "Front Face Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 9,
        defaultValue: [],
        hidden: (props: any) => !props.useImages,
    },
    backImages: {
        type: ControlType.Array,
        title: "Back Face Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 9,
        defaultValue: [],
        hidden: (props: any) => !props.useImages,
    },
    topImages: {
        type: ControlType.Array,
        title: "Top Face Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 9,
        defaultValue: [],
        hidden: (props: any) => !props.useImages,
    },
    bottomImages: {
        type: ControlType.Array,
        title: "Bottom Face Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 9,
        defaultValue: [],
        hidden: (props: any) => !props.useImages,
    },
    leftImages: {
        type: ControlType.Array,
        title: "Left Face Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 9,
        defaultValue: [],
        hidden: (props: any) => !props.useImages,
    },
    rightImages: {
        type: ControlType.Array,
        title: "Right Face Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 9,
        defaultValue: [],
        hidden: (props: any) => !props.useImages,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Gap Color",
        defaultValue: "#000000",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Square Border Radius",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
})
