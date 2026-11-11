// Image Trail Effect - Creates a mouse trail of images that follow cursor movement
import { useRef, useCallback, useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageTrailProps {
    images: Array<{ src: string; alt: string }>
    content: string
    trailPattern:
        | "follow"
        | "circular"
        | "wavy"
        | "random"
        | "spiral"
        | "grid"
        | "heart"
        | "star"
        | "figure8"
    triggerDistance: number
    maxTrailImages: number
    useFadeEffect: boolean
    fadeDelay: number
    imageWidth: number
    imageHeight: number
    backgroundColor: string
    textColor: string
    font: any
    borderRadius: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageTrail(props: ImageTrailProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Trail Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Trail Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Trail Image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Trail Image 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Trail Image 5",
            },
        ],
        content = "Move your mouse to see the Image Path effect",
        trailPattern = "follow",
        triggerDistance = 20,
        maxTrailImages = 5,
        useFadeEffect = true,
        fadeDelay = 1500,
        imageWidth = 160,
        imageHeight = 192,
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        font,
        borderRadius = 8,
    } = props

    const wrapperRef = useRef<HTMLDivElement>(null)
    const imageRefs = useRef<Array<HTMLImageElement | null>>([])
    const zIndexCounterRef = useRef(1)
    const imageIndexRef = useRef(0)
    const lastPositionRef = useRef({ x: 0, y: 0 })
    const fadeTimeoutsRef = useRef<Map<number, number>>(new Map())
    const patternStateRef = useRef({ time: 0, centerX: 0, centerY: 0 })
    const isStatic = useIsStaticRenderer()

    const calculatePatternPosition = useCallback(
        (baseX: number, baseY: number, imageIndex: number) => {
            const container = wrapperRef.current
            if (!container) return { x: baseX, y: baseY }

            const containerBounds = container.getBoundingClientRect()
            const centerX = containerBounds.width / 2
            const centerY = containerBounds.height / 2

            switch (trailPattern) {
                case "circular": {
                    const radius = 80
                    const angle =
                        imageIndex * 0.5 + patternStateRef.current.time * 0.02
                    const offsetX = Math.cos(angle) * radius
                    const offsetY = Math.sin(angle) * radius
                    return {
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                    }
                }
                case "wavy": {
                    const amplitude = 60
                    const frequency = 0.1
                    const phase = imageIndex * 0.3
                    const waveOffset =
                        Math.sin(
                            patternStateRef.current.time * frequency + phase
                        ) * amplitude
                    return {
                        x: baseX + waveOffset,
                        y: baseY + Math.cos(phase) * 20,
                    }
                }
                case "random": {
                    const randomRange = 40
                    const seed =
                        imageIndex +
                        Math.floor(patternStateRef.current.time / 100)
                    const randomX = (Math.sin(seed * 12.9898) * 43758.5453) % 1
                    const randomY = (Math.sin(seed * 78.233) * 43758.5453) % 1
                    return {
                        x: baseX + (randomX * randomRange - randomRange / 2),
                        y: baseY + (randomY * randomRange - randomRange / 2),
                    }
                }
                case "spiral": {
                    const spiralRadius = 20 + imageIndex * 8
                    const angle =
                        imageIndex * 0.8 + patternStateRef.current.time * 0.01
                    const offsetX = Math.cos(angle) * spiralRadius
                    const offsetY = Math.sin(angle) * spiralRadius
                    return {
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                    }
                }
                case "grid": {
                    const gridSize = 60
                    const cols = 3
                    const gridX = (imageIndex % cols) * gridSize - gridSize
                    const gridY =
                        Math.floor(imageIndex / cols) * gridSize - gridSize
                    const wobble =
                        Math.sin(
                            patternStateRef.current.time * 0.005 + imageIndex
                        ) * 10
                    return {
                        x: baseX + gridX + wobble,
                        y: baseY + gridY + wobble,
                    }
                }
                case "heart": {
                    const t =
                        imageIndex * 0.3 + patternStateRef.current.time * 0.01
                    const scale = 30
                    const heartX = 16 * Math.pow(Math.sin(t), 3)
                    const heartY = -(
                        13 * Math.cos(t) -
                        5 * Math.cos(2 * t) -
                        2 * Math.cos(3 * t) -
                        Math.cos(4 * t)
                    )
                    return {
                        x: baseX + (heartX * scale) / 16,
                        y: baseY + (heartY * scale) / 16,
                    }
                }
                case "star": {
                    const angle =
                        imageIndex * ((2 * Math.PI) / 5) +
                        patternStateRef.current.time * 0.01
                    const radius = imageIndex % 2 === 0 ? 80 : 40
                    const offsetX = Math.cos(angle) * radius
                    const offsetY = Math.sin(angle) * radius
                    return {
                        x: baseX + offsetX,
                        y: baseY + offsetY,
                    }
                }
                case "figure8": {
                    const t =
                        imageIndex * 0.2 + patternStateRef.current.time * 0.01
                    const scale = 60
                    const figure8X = Math.sin(t) * scale
                    const figure8Y = (Math.sin(2 * t) * scale) / 2
                    return {
                        x: baseX + figure8X,
                        y: baseY + figure8Y,
                    }
                }
                default: // "follow"
                    return { x: baseX, y: baseY }
            }
        },
        [trailPattern]
    )

    const activateImage = useCallback(
        (imgIndex: number, x: number, y: number) => {
            const img = imageRefs.current[imgIndex]
            const container = wrapperRef.current
            if (!img || !container) return

            const containerBounds = container.getBoundingClientRect()
            const relativeX = x - containerBounds.left
            const relativeY = y - containerBounds.top

            // Update pattern state
            patternStateRef.current.time = Date.now()
            patternStateRef.current.centerX = relativeX
            patternStateRef.current.centerY = relativeY

            // Calculate pattern-based position
            const patternPos = calculatePatternPosition(
                relativeX,
                relativeY,
                imgIndex
            )

            // Clear any existing fade timeout for this image
            const existingTimeout = fadeTimeoutsRef.current.get(imgIndex)
            if (existingTimeout) {
                clearTimeout(existingTimeout)
                fadeTimeoutsRef.current.delete(imgIndex)
            }

            img.style.left = `${patternPos.x}px`
            img.style.top = `${patternPos.y}px`

            if (zIndexCounterRef.current > 40) {
                zIndexCounterRef.current = 1
            }

            img.style.zIndex = String(zIndexCounterRef.current++)
            img.style.transform = "translate(-50%, -50%) scale(1)"
            img.style.opacity = "1"

            if (useFadeEffect) {
                const timeoutId = setTimeout(() => {
                    if (img) {
                        img.style.transform = "translate(-50%, -50%) scale(0)"
                        img.style.opacity = "0"
                    }
                    fadeTimeoutsRef.current.delete(imgIndex)
                }, fadeDelay)
                fadeTimeoutsRef.current.set(imgIndex, timeoutId)
            }

            lastPositionRef.current = { x, y }
        },
        [useFadeEffect, fadeDelay, calculatePatternPosition]
    )

    const deactivateImage = useCallback((imgIndex: number) => {
        const img = imageRefs.current[imgIndex]
        if (!img) return

        // Clear any existing fade timeout
        const existingTimeout = fadeTimeoutsRef.current.get(imgIndex)
        if (existingTimeout) {
            clearTimeout(existingTimeout)
            fadeTimeoutsRef.current.delete(imgIndex)
        }

        img.style.transform = "translate(-50%, -50%) scale(0)"
        img.style.opacity = "0"
    }, [])

    const calculateDistance = useCallback((x: number, y: number) => {
        const container = wrapperRef.current
        if (!container) return 0
        
        const containerBounds = container.getBoundingClientRect()
        const relativeX = x - containerBounds.left
        const relativeY = y - containerBounds.top
        
        return Math.hypot(
            relativeX - lastPositionRef.current.x,
            relativeY - lastPositionRef.current.y
        )
    }, [])

    const handleMouseMove = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (isStatic || images.length === 0) return

            const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX
            const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY

            if (!clientX || !clientY) return

            const distance = calculateDistance(clientX, clientY)
            const threshold =
                typeof window !== "undefined"
                    ? window.innerWidth / triggerDistance
                    : 50

            if (distance > threshold) {
                const leadImageIndex = imageIndexRef.current % images.length

                activateImage(leadImageIndex, clientX, clientY)

                // Only deactivate tail image if we have more images than maxTrailImages
                if (imageIndexRef.current >= maxTrailImages) {
                    const tailImageIndex =
                        (imageIndexRef.current - maxTrailImages) % images.length
                    // Handle negative modulo properly
                    const normalizedTailIndex =
                        tailImageIndex < 0
                            ? tailImageIndex + images.length
                            : tailImageIndex
                    deactivateImage(normalizedTailIndex)
                }

                imageIndexRef.current++
            }
        },
        [
            images.length,
            triggerDistance,
            maxTrailImages,
            activateImage,
            deactivateImage,
            calculateDistance,
            isStatic,
        ]
    )

    // Initialize image refs and cleanup timeouts
    useEffect(() => {
        imageRefs.current = imageRefs.current.slice(0, images.length)

        // Cleanup function
        return () => {
            fadeTimeoutsRef.current.forEach((timeoutId) =>
                clearTimeout(timeoutId)
            )
            fadeTimeoutsRef.current.clear()
        }
    }, [images.length])

    // Reset component state when key props change
    useEffect(() => {
        imageIndexRef.current = 0
        lastPositionRef.current = { x: 0, y: 0 }
        zIndexCounterRef.current = 1

        // Clear all active images
        imageRefs.current.forEach((img, index) => {
            if (img) {
                img.style.transform = "translate(-50%, -50%) scale(0)"
                img.style.opacity = "0"
            }
        })

        // Clear all timeouts
        fadeTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
        fadeTimeoutsRef.current.clear()
    }, [triggerDistance, maxTrailImages, useFadeEffect, fadeDelay])

    return (
        <div
            ref={wrapperRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                borderRadius,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isStatic ? "default" : "none",
                ...font,
            }}
        >
            {images.map((image, i) => (
                <img
                    key={i}
                    ref={(el) => (imageRefs.current[i] = el)}
                    src={image.src}
                    alt={image.alt}
                    style={{
                        position: "absolute",
                        width: imageWidth,
                        height: imageHeight,
                        objectFit: "cover",
                        borderRadius: borderRadius * 0.5,
                        transform: "translate(-50%, -50%) scale(0)",
                        opacity: 0,
                        transition:
                            "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            ))}

            <div
                style={{
                    color: textColor,
                    textAlign: "center",
                    zIndex: 0,
                    pointerEvents: "none",
                    padding: "20px",
                }}
            >
                {content}
            </div>
        </div>
    )
}

addPropertyControls(ImageTrail, {
    images: {
        type: ControlType.Array,
        title: "Trail Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Trail Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Trail Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Trail Image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Trail Image 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Trail Image 5",
            },
        ],
        maxCount: 500,
    },
    content: {
        type: ControlType.String,
        title: "Content Text",
        defaultValue: "Move your mouse to see the Image Path effect",
        displayTextArea: true,
    },
    trailPattern: {
        type: ControlType.Enum,
        title: "Trail Pattern",
        options: [
            "follow",
            "circular",
            "wavy",
            "random",
            "spiral",
            "grid",
            "heart",
            "star",
            "figure8",
        ],
        optionTitles: [
            "Follow",
            "Circular",
            "Wavy",
            "Random",
            "Spiral",
            "Grid",
            "Heart",
            "Star",
            "Figure 8",
        ],
        defaultValue: "wavy",
    },
    triggerDistance: {
        type: ControlType.Number,
        title: "Trigger Distance",
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 1,
    },
    maxTrailImages: {
        type: ControlType.Number,
        title: "Max Trail Images",
        defaultValue: 500,
        min: 1,
        max: 500,
        step: 1,
    },
    useFadeEffect: {
        type: ControlType.Boolean,
        title: "Auto Fade",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fadeDelay: {
        type: ControlType.Number,
        title: "Fade Delay",
        defaultValue: 500,
        min: 500,
        max: 5000,
        step: 100,
        unit: "ms",
        hidden: ({ useFadeEffect }) => !useFadeEffect,
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 200,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 200,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
            textAlign: "center",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
})
