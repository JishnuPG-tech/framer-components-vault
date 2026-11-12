import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
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
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */
export default function PixelateHoverImage(props) {
    const {
        image,
        pixelateAmount,
        transitionDuration,
        transitionEasing,
        reverseEffect,
        scaleOnHover,
        brightnessChange,
        borderRadius,
        objectFit,
        style,
    } = props

    // State
    const [isHovered, setIsHovered] = useState(false)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [imageLoaded, setImageLoaded] = useState(false)

    // Refs
    const canvasRef = useRef(null)
    const imageRef = useRef(null)
    const containerRef = useRef(null)
    const animationFrameRef = useRef(null)

    // Calculate target pixelation based on hover state
    const targetPixelation = useMemo(() => {
        return reverseEffect
            ? isHovered
                ? pixelateAmount
                : 0
            : isHovered
              ? 0
              : pixelateAmount
    }, [isHovered, pixelateAmount, reverseEffect])

    // Load and cache image
    useEffect(() => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = image.src || image

        img.onload = () => {
            imageRef.current = img
            setImageLoaded(true)
        }

        img.onerror = () => {
            console.error("Failed to load image:", image.src || image)
        }

        return () => {
            img.onload = null
            img.onerror = null
        }
    }, [image])

    // Handle dimension updates efficiently
    const updateDimensions = useCallback(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const newWidth = Math.floor(rect.width)
        const newHeight = Math.floor(rect.height)

        if (newWidth > 0 && newHeight > 0) {
            setDimensions((prev) => {
                const widthChanged = Math.abs(prev.width - newWidth) > 1
                const heightChanged = Math.abs(prev.height - newHeight) > 1

                if (widthChanged || heightChanged || prev.width === 0) {
                    return { width: newWidth, height: newHeight }
                }
                return prev
            })
        }
    }, [])

    // Setup dimension tracking
    useEffect(() => {
        updateDimensions()

        const resizeObserver = new ResizeObserver(updateDimensions)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        window.addEventListener("resize", updateDimensions)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", updateDimensions)
        }
    }, [updateDimensions])

    // Calculate object fit positioning
    const calculateObjectFit = useCallback(
        (img, canvasWidth, canvasHeight) => {
            const imgRatio = img.width / img.height
            const containerRatio = canvasWidth / canvasHeight

            let sx = 0,
                sy = 0,
                sWidth = img.width,
                sHeight = img.height
            let dx = 0,
                dy = 0,
                dWidth = canvasWidth,
                dHeight = canvasHeight

            switch (objectFit) {
                case "cover":
                    if (imgRatio > containerRatio) {
                        sWidth = img.height * containerRatio
                        sx = (img.width - sWidth) / 2
                    } else {
                        sHeight = img.width / containerRatio
                        sy = (img.height - sHeight) / 2
                    }
                    break

                case "contain":
                    if (imgRatio > containerRatio) {
                        dHeight = canvasWidth / imgRatio
                        dy = (canvasHeight - dHeight) / 2
                    } else {
                        dWidth = canvasHeight * imgRatio
                        dx = (canvasWidth - dWidth) / 2
                    }
                    break

                case "none":
                    dWidth = img.width
                    dHeight = img.height
                    dx = (canvasWidth - img.width) / 2
                    dy = (canvasHeight - img.height) / 2
                    break

                case "scale-down":
                    if (
                        img.width <= canvasWidth &&
                        img.height <= canvasHeight
                    ) {
                        dWidth = img.width
                        dHeight = img.height
                        dx = (canvasWidth - img.width) / 2
                        dy = (canvasHeight - img.height) / 2
                    } else {
                        if (imgRatio > containerRatio) {
                            dHeight = canvasWidth / imgRatio
                            dy = (canvasHeight - dHeight) / 2
                        } else {
                            dWidth = canvasHeight * imgRatio
                            dx = (canvasWidth - dWidth) / 2
                        }
                    }
                    break

                case "fill":
                default:
                    // Use defaults
                    break
            }

            return { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight }
        },
        [objectFit]
    )

    // Render canvas with pixelation
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const img = imageRef.current

        if (
            !canvas ||
            !img ||
            !imageLoaded ||
            dimensions.width === 0 ||
            dimensions.height === 0
        ) {
            return
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const width = dimensions.width
        const height = dimensions.height

        // Set canvas resolution
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Calculate positioning
        const coords = calculateObjectFit(img, width, height)

        if (targetPixelation === 0) {
            // Render sharp image
            ctx.imageSmoothingEnabled = true
            ctx.drawImage(
                img,
                coords.sx,
                coords.sy,
                coords.sWidth,
                coords.sHeight,
                coords.dx,
                coords.dy,
                coords.dWidth,
                coords.dHeight
            )
        } else {
            // Render pixelated image
            ctx.imageSmoothingEnabled = false

            const pixelSize = Math.max(
                1,
                Math.floor((targetPixelation / 100) * 50)
            )
            const smallWidth = Math.max(1, Math.ceil(coords.dWidth / pixelSize))
            const smallHeight = Math.max(
                1,
                Math.ceil(coords.dHeight / pixelSize)
            )

            // Use off-screen canvas for pixelation
            const tempCanvas = document.createElement("canvas")
            const tempCtx = tempCanvas.getContext("2d")
            tempCanvas.width = smallWidth
            tempCanvas.height = smallHeight

            // Draw small version
            tempCtx.drawImage(
                img,
                coords.sx,
                coords.sy,
                coords.sWidth,
                coords.sHeight,
                0,
                0,
                smallWidth,
                smallHeight
            )

            // Scale back up
            ctx.drawImage(
                tempCanvas,
                0,
                0,
                smallWidth,
                smallHeight,
                coords.dx,
                coords.dy,
                coords.dWidth,
                coords.dHeight
            )
        }
    }, [imageLoaded, dimensions, targetPixelation, calculateObjectFit])

    // Update canvas when dependencies change
    useEffect(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            renderCanvas()
        })

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [renderCanvas])

    // Event handlers
    const handleHoverStart = useCallback(() => setIsHovered(true), [])
    const handleHoverEnd = useCallback(() => setIsHovered(false), [])

    return (
        <motion.div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
                cursor: "pointer",
                width: "100%",
                height: "100%",
            }}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
        >
            <motion.canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                animate={{
                    scale: isHovered && scaleOnHover ? 1.05 : 1,
                    filter: `brightness(${isHovered ? brightnessChange : 100}%)`,
                }}
                transition={{
                    duration: transitionDuration,
                    ease: transitionEasing,
                }}
            />

            {/* Loading state indicator (optional) */}
            {!imageLoaded && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: 0.5,
                        fontSize: "14px",
                    }}
                >
                    Loading...
                </div>
            )}
        </motion.div>
    )
}

PixelateHoverImage.defaultProps = {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    pixelateAmount: 50,
    transitionDuration: 0.3,
    transitionEasing: "easeInOut",
    reverseEffect: false,
    scaleOnHover: false,
    brightnessChange: 100,
    borderRadius: 0,
    objectFit: "cover",
}

addPropertyControls(PixelateHoverImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "None", "Scale Down"],
        defaultValue: "cover",
    },
    pixelateAmount: {
        type: ControlType.Number,
        title: "Pixelate Amount",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        unit: "%",
        displayStepper: true,
    },
    reverseEffect: {
        type: ControlType.Boolean,
        title: "Reverse Effect",
        defaultValue: false,
        enabledTitle: "Clear → Pixelate",
        disabledTitle: "Pixelate → Clear",
    },
    brightnessChange: {
        type: ControlType.Number,
        title: "Hover Brightness",
        min: 0,
        max: 200,
        step: 10,
        defaultValue: 100,
        unit: "%",
        displayStepper: true,
    },
    scaleOnHover: {
        type: ControlType.Boolean,
        title: "Scale on Hover",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Speed",
        min: 0.1,
        max: 2,
        step: 0.1,
        defaultValue: 0.3,
        unit: "s",
        displayStepper: true,
    },
    transitionEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "linear",
            "easeIn",
            "easeOut",
            "easeInOut",
            "circIn",
            "circOut",
            "circInOut",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Circ In",
            "Circ Out",
            "Circ In Out",
        ],
        defaultValue: "easeInOut",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
        unit: "px",
        displayStepper: true,
    },
})
