// 3D Box with Interactive Rotation
// Rotating Box with Interactive Rotation
import {
    useRef,
    useState,
    useEffect,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface RotatingBoxProps {
    frontImage?: { src: string; alt: string }
    backImage?: { src: string; alt: string }
    topImage?: { src: string; alt: string }
    bottomImage?: { src: string; alt: string }
    leftImage?: { src: string; alt: string }
    rightImage?: { src: string; alt: string }
    autoRotate?: boolean
    rotationSpeed?: number
    staticRotationX?: number
    staticRotationY?: number
    sizePreset?: "Playing Cards" | "Shoe Box" | "Cereal" | "Tissue" | "Custom"
    boxWidth?: number
    boxHeight?: number
    boxDepth?: number
    style?: CSSProperties
}

/**
 *
 * Rotating Box
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 *
 * @framerDisableUnlink
 *
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RotatingBox(props: RotatingBoxProps) {
    const {
        frontImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Front",
        },
        backImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Back",
        },
        topImage = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Top",
        },
        bottomImage = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Bottom",
        },
        leftImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Left",
        },
        rightImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Right",
        },
        autoRotate = true,
        rotationSpeed = 0.5,
        staticRotationX = -10,
        staticRotationY = 20,
        sizePreset = "Playing Cards",
        boxWidth: propBoxWidth = 160,
        boxHeight: propBoxHeight = 240,
        boxDepth: propBoxDepth = 45,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
    const [rotation, setRotation] = useState({ x: -10, y: 20 })
    const [isHovered, setIsHovered] = useState(false)
    const [autoRotation, setAutoRotation] = useState({ x: 0, y: 0 })

    // Auto rotation effect
    useEffect(() => {
        if (isStatic || isDragging || !autoRotate) return

        const interval = setInterval(() => {
            startTransition(() => {
                setAutoRotation((prev) => ({
                    x: prev.x + rotationSpeed,
                    y: prev.y + rotationSpeed * 0.6,
                }))
            })
        }, 50)

        return () => clearInterval(interval)
    }, [isStatic, isDragging, autoRotate, rotationSpeed])

    // Set initial rotation when autoRotate changes
    useEffect(() => {
        if (!autoRotate) {
            startTransition(() => {
                setRotation({ x: staticRotationX, y: staticRotationY })
            })
        }
    }, [autoRotate, staticRotationX, staticRotationY])

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isStatic) return
            e.preventDefault()
            startTransition(() => {
                setIsDragging(true)
                setLastMousePos({ x: e.clientX, y: e.clientY })
            })
        },
        [isStatic]
    )

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return

            const deltaX = e.clientX - lastMousePos.x
            const deltaY = e.clientY - lastMousePos.y

            startTransition(() => {
                setRotation((prev) => ({
                    x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
                    y: prev.y + deltaX * 0.5,
                }))
                setLastMousePos({ x: e.clientX, y: e.clientY })
            })
        },
        [isDragging, lastMousePos]
    )

    const handleMouseUp = useCallback(() => {
        startTransition(() => setIsDragging(false))
    }, [])

    const handleMouseEnter = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsHovered(true))
    }, [isStatic])

    const handleMouseLeave = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsHovered(false))
    }, [isStatic])

    useEffect(() => {
        if (typeof window === "undefined") return

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)

            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isStatic) return

        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault()
                startTransition(() =>
                    setRotation((r) => ({ ...r, y: r.y - 15 }))
                )
                break
            case "ArrowRight":
                e.preventDefault()
                startTransition(() =>
                    setRotation((r) => ({ ...r, y: r.y + 15 }))
                )
                break
            case "ArrowUp":
                e.preventDefault()
                startTransition(() =>
                    setRotation((r) => ({ ...r, x: Math.max(-90, r.x - 15) }))
                )
                break
            case "ArrowDown":
                e.preventDefault()
                startTransition(() =>
                    setRotation((r) => ({ ...r, x: Math.min(90, r.x + 15) }))
                )
                break
        }
    }

    // Box dimensions based on preset or custom values
    const getBoxDimensions = () => {
        switch (sizePreset) {
            case "Playing Cards":
                return { width: 160, height: 240, depth: 45 }
            case "Shoe Box":
                return { width: 320, height: 120, depth: 200 }
            case "Cereal":
                return { width: 320, height: 480, depth: 80 }
            case "Tissue":
                return { width: 240, height: 120, depth: 120 }
            case "Custom":
                return {
                    width: propBoxWidth,
                    height: propBoxHeight,
                    depth: propBoxDepth,
                }
            default:
                return { width: 160, height: 240, depth: 45 }
        }
    }

    const boxDimensions = getBoxDimensions()
    const boxWidth = boxDimensions.width
    const boxHeight = boxDimensions.height
    const boxDepth = boxDimensions.depth

    const faces = [
        {
            image: frontImage,
            transform: `translateZ(${boxDepth / 2}px)`,
            width: boxWidth,
            height: boxHeight,
        },
        {
            image: backImage,
            transform: `rotateY(180deg) translateZ(${boxDepth / 2}px)`,
            width: boxWidth,
            height: boxHeight,
        },
        {
            image: topImage,
            transform: `rotateX(90deg) translateZ(${boxDepth / 2}px)`,
            width: boxWidth,
            height: boxDepth,
        },
        {
            image: bottomImage,
            transform: `rotateX(-90deg) translateZ(${boxHeight - boxDepth / 2}px)`,
            width: boxWidth,
            height: boxDepth,
        },
        {
            image: leftImage,
            transform: `rotateY(-90deg) translateZ(${boxDepth / 2}px)`,
            width: boxDepth,
            height: boxHeight,
        },
        {
            image: rightImage,
            transform: `rotateY(90deg) translateZ(${boxWidth - boxDepth / 2}px)`,
            width: boxDepth,
            height: boxHeight,
        },
    ]

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                perspective: "800px",
                background: "transparent",
                overflow: "hidden",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                touchAction: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="img"
            aria-label="3D Box - Drag to rotate or use arrow keys"
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `${boxWidth}px`,
                    height: `${boxHeight}px`,
                    transformStyle: "preserve-3d",
                    transform: `translate(-50%, -50%) rotateX(${autoRotate ? rotation.x + autoRotation.x : rotation.x}deg) rotateY(${autoRotate ? rotation.y + autoRotation.y : rotation.y}deg) ${isHovered ? "translateZ(10px)" : ""}`,
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
            >
                {faces.map((face, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            width: `${face.width}px`,
                            height: `${face.height}px`,
                            transform: face.transform,
                            backfaceVisibility: "hidden",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={face.image.src}
                            alt={face.image.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                            draggable={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(RotatingBox, {
    frontImage: {
        type: ControlType.ResponsiveImage,
        title: "Front Image",
    },
    backImage: {
        type: ControlType.ResponsiveImage,
        title: "Back Image",
    },
    topImage: {
        type: ControlType.ResponsiveImage,
        title: "Top Image",
    },
    bottomImage: {
        type: ControlType.ResponsiveImage,
        title: "Bottom Image",
    },
    leftImage: {
        type: ControlType.ResponsiveImage,
        title: "Left Image",
    },
    rightImage: {
        type: ControlType.ResponsiveImage,
        title: "Right Image",
    },

    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 2.0,
        step: 0.1,
        hidden: ({ autoRotate }) => !autoRotate,
    },
    staticRotationX: {
        type: ControlType.Number,
        title: "Static Rotation X",
        defaultValue: -10,
        min: -90,
        max: 90,
        step: 1,
        unit: "deg",
        hidden: ({ autoRotate }) => autoRotate,
    },
    staticRotationY: {
        type: ControlType.Number,
        title: "Static Rotation Y",
        defaultValue: 20,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        hidden: ({ autoRotate }) => autoRotate,
    },
    sizePreset: {
        type: ControlType.Enum,
        title: "Size Preset",
        defaultValue: "Playing Cardss",
        options: ["Playing Cards", "Shoe Box", "Cereal", "Tissue", "Custom"],
        optionTitles: [
            "Playing Cards",
            "Shoe Box",
            "Cereal Box",
            "Tissue Box",
            "Custom",
        ],
    },
    boxWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 160,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
        hidden: ({ sizePreset }) => sizePreset !== "Custom",
    },
    boxHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 240,
        min: 50,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ sizePreset }) => sizePreset !== "Custom",
    },
    boxDepth: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 45,
        min: 20,
        max: 200,
        step: 5,
        unit: "px",
        hidden: ({ sizePreset }) => sizePreset !== "Custom",
    },
})
