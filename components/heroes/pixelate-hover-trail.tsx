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


/**
 * Pixelated Trail Hover Component with Animated Trail
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */

interface TrailPoint {
    x: number
    y: number
    timestamp: number
    opacity: number
}

export default function PixelatedTrailHover(props) {
    const {
        media,
        pixelSize,
        effectRadius,
        trailLength,
        trailSpacing,
        easingType,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isImageLoaded, setIsImageLoaded] = useState(false)
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
    const trailPoints = useRef<TrailPoint[]>([])
    const animationFrameRef = useRef<number | null>(null)
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null)

    // Helper function to calculate cover positioning (like object-fit: cover)
    const drawMediaCover = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            media: HTMLImageElement | HTMLVideoElement,
            canvasWidth: number,
            canvasHeight: number
        ) => {
            const mediaWidth =
                media instanceof HTMLVideoElement
                    ? media.videoWidth
                    : media.width
            const mediaHeight =
                media instanceof HTMLVideoElement
                    ? media.videoHeight
                    : media.height

            if (!mediaWidth || !mediaHeight) return

            // Calculate aspect ratios
            const canvasAspect = canvasWidth / canvasHeight
            const mediaAspect = mediaWidth / mediaHeight

            let sourceX = 0,
                sourceY = 0,
                sourceWidth = mediaWidth,
                sourceHeight = mediaHeight

            if (mediaAspect > canvasAspect) {
                // Media is wider - crop sides
                sourceWidth = mediaHeight * canvasAspect
                sourceX = (mediaWidth - sourceWidth) / 2
            } else {
                // Media is taller - crop top/bottom
                sourceHeight = mediaWidth / canvasAspect
                sourceY = (mediaHeight - sourceHeight) / 2
            }

            // Draw cropped media to fill canvas
            ctx.drawImage(
                media,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight, // Source crop
                0,
                0,
                canvasWidth,
                canvasHeight // Destination (full canvas)
            )
        },
        []
    )

    // Easing functions for elegant trail fade
    const easingFunctions = {
        linear: (t: number) => t,
        easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
        easeInOut: (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
        easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        easeOutCirc: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
        easeOutBack: (t: number) => {
            const c1 = 1.70158
            const c3 = c1 + 1
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
        },
    }

    // Load and draw the media (image or video)
    useEffect(() => {
        if (!media || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        // Reset states
        setIsImageLoaded(false)
        setIsVideoLoaded(false)
        setMediaType(null)

        // Determine if it's an image or video
        const fileExtension = media.toLowerCase().split(".").pop()
        const videoExtensions = ["mp4", "webm", "ogg", "mov"]
        const isVideo = videoExtensions.includes(fileExtension || "")

        if (isVideo) {
            // Handle video
            const video = document.createElement("video")
            video.crossOrigin = "anonymous"
            video.loop = true
            video.muted = true
            video.playsInline = true

            video.onloadeddata = () => {
                videoRef.current = video
                setIsVideoLoaded(true)
                setMediaType("video")
                video.play()
            }

            video.onerror = () => {
                console.error("Failed to load video")
            }

            video.src = media
        } else {
            // Handle image
            const img = new Image()
            img.crossOrigin = "anonymous"

            img.onload = () => {
                imageRef.current = img
                setIsImageLoaded(true)
                setMediaType("image")
            }

            img.onerror = () => {
                console.error("Failed to load image")
            }

            img.src = media
        }
    }, [media])

    // Pixelate a specific area with opacity
    const pixelateArea = useCallback(
        (canvasX: number, canvasY: number, opacity: number) => {
            if (!canvasRef.current) return

            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (!ctx) return

            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            // Calculate pixelation area
            const radius = effectRadius * Math.min(scaleX, scaleY)
            const startX = Math.max(0, canvasX - radius)
            const startY = Math.max(0, canvasY - radius)
            const endX = Math.min(canvas.width, canvasX + radius)
            const endY = Math.min(canvas.height, canvasY + radius)

            // Pixelate the area
            for (let blockY = startY; blockY < endY; blockY += pixelSize) {
                for (let blockX = startX; blockX < endX; blockX += pixelSize) {
                    // Check if pixel is within circular radius
                    const dx = blockX - canvasX
                    const dy = blockY - canvasY
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance <= radius) {
                        // Fade based on distance from center for smoother effect
                        const distanceOpacity = 1 - (distance / radius) * 0.3

                        // Get the average color of the pixel block
                        const imageData = ctx.getImageData(
                            blockX,
                            blockY,
                            Math.min(pixelSize, endX - blockX),
                            Math.min(pixelSize, endY - blockY)
                        )

                        const pixels = imageData.data
                        let r = 0,
                            g = 0,
                            b = 0,
                            a = 0
                        const pixelCount = pixels.length / 4

                        for (let i = 0; i < pixels.length; i += 4) {
                            r += pixels[i]
                            g += pixels[i + 1]
                            b += pixels[i + 2]
                            a += pixels[i + 3]
                        }

                        r = Math.round(r / pixelCount)
                        g = Math.round(g / pixelCount)
                        b = Math.round(b / pixelCount)
                        a = Math.round(a / pixelCount)

                        // Apply opacity to the pixelated block
                        const finalOpacity =
                            (a / 255) * opacity * distanceOpacity
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`
                        ctx.fillRect(
                            blockX,
                            blockY,
                            Math.min(pixelSize, endX - blockX),
                            Math.min(pixelSize, endY - blockY)
                        )
                    }
                }
            }
        },
        [pixelSize, effectRadius]
    )

    // Animation loop for trail effect
    const animate = useCallback(() => {
        if (!canvasRef.current) return
        if (!isImageLoaded && !isVideoLoaded) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        const currentTime = Date.now()

        // Clear and redraw original media with cover behavior
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (mediaType === "video" && videoRef.current) {
            drawMediaCover(ctx, videoRef.current, canvas.width, canvas.height)
        } else if (mediaType === "image" && imageRef.current) {
            drawMediaCover(ctx, imageRef.current, canvas.width, canvas.height)
        }

        // Get canvas scale
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        // Get easing function
        const easingFn = easingFunctions[easingType] || easingFunctions.easeOut

        // Update and draw trail points
        trailPoints.current = trailPoints.current.filter((point) => {
            const age = currentTime - point.timestamp
            const maxAge = trailLength * 1000 // Convert to milliseconds

            if (age > maxAge) return false

            // Calculate opacity based on age with elegant easing
            const ageRatio = age / maxAge
            const easedRatio = easingFn(ageRatio)
            point.opacity = Math.max(0, 1 - easedRatio)

            if (point.opacity > 0.01) {
                // Convert screen coordinates to canvas coordinates
                const canvasX = (point.x - rect.left) * scaleX
                const canvasY = (point.y - rect.top) * scaleY

                pixelateArea(canvasX, canvasY, point.opacity)
            }

            return point.opacity > 0.01
        })

        // Continue animation if hovering, trail points exist, or video is playing
        if (
            isHovering ||
            trailPoints.current.length > 0 ||
            mediaType === "video"
        ) {
            animationFrameRef.current = requestAnimationFrame(animate)
        }
    }, [
        isImageLoaded,
        isVideoLoaded,
        isHovering,
        trailLength,
        easingType,
        mediaType,
        pixelateArea,
        easingFunctions,
        drawMediaCover,
    ])

    // Start animation loop
    useEffect(() => {
        if (
            isHovering ||
            trailPoints.current.length > 0 ||
            mediaType === "video"
        ) {
            animate()
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isHovering, mediaType, animate])

    // Handle dynamic canvas resizing
    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height

            // Force immediate redraw when resized
            if (isImageLoaded || isVideoLoaded) {
                const ctx = canvas.getContext("2d", {
                    willReadFrequently: true,
                })
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)

                    if (mediaType === "video" && videoRef.current) {
                        drawMediaCover(
                            ctx,
                            videoRef.current,
                            canvas.width,
                            canvas.height
                        )
                    } else if (mediaType === "image" && imageRef.current) {
                        drawMediaCover(
                            ctx,
                            imageRef.current,
                            canvas.width,
                            canvas.height
                        )
                    }
                }
            }
        }

        // Set initial size
        updateCanvasSize()

        // Watch for size changes
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize()
        })

        resizeObserver.observe(canvas)

        return () => {
            resizeObserver.disconnect()
        }
    }, [isImageLoaded, isVideoLoaded, mediaType, drawMediaCover])

    // Cleanup video on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current) {
                videoRef.current.pause()
                videoRef.current.src = ""
            }
        }
    }, [])

    // Handle mouse move - add trail points
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!isHovering) return

            const currentPos = { x: e.clientX, y: e.clientY }

            // Check distance from last point to control trail density
            if (lastMousePosRef.current) {
                const dx = currentPos.x - lastMousePosRef.current.x
                const dy = currentPos.y - lastMousePosRef.current.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                // Only add point if moved enough distance (based on trailSpacing)
                if (distance < trailSpacing) {
                    return
                }
            }

            // Add new trail point
            trailPoints.current.push({
                x: currentPos.x,
                y: currentPos.y,
                timestamp: Date.now(),
                opacity: 1,
            })

            lastMousePosRef.current = currentPos

            // Limit trail points to prevent memory issues
            if (trailPoints.current.length > 50) {
                trailPoints.current.shift()
            }
        },
        [isHovering, trailSpacing]
    )

    // Handle mouse enter
    const handleMouseEnter = useCallback(() => {
        setIsHovering(true)
    }, [])

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
        setIsHovering(false)
        lastMousePosRef.current = null
        // Trail will naturally fade out through animation loop
    }, [])

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {!media ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f0f0f0",
                        color: "#999",
                        fontSize: "14px",
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    Upload an image or video
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        cursor: "default",
                    }}
                />
            )}
        </div>
    )
}

PixelatedTrailHover.defaultProps = {
    pixelSize: 10,
    effectRadius: 60,
    trailLength: 1.5,
    trailSpacing: 15,
    easingType: "easeOut",
}

addPropertyControls(PixelatedTrailHover, {
    media: {
        type: ControlType.File,
        title: "Media",
        allowedFileTypes: ["image/*", "video/mp4", "video/webm", "video/ogg"],
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        description: "Size of pixelation blocks",
        min: 2,
        max: 50,
        step: 1,
        defaultValue: 10,
        unit: "px",
        displayStepper: true,
    },
    effectRadius: {
        type: ControlType.Number,
        title: "Effect Radius",
        description: "Radius of pixelation area around cursor",
        min: 20,
        max: 200,
        step: 10,
        defaultValue: 60,
        unit: "px",
        displayStepper: true,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Duration",
        description: "How long the trail lasts (seconds)",
        min: 0.5,
        max: 5,
        step: 0.5,
        defaultValue: 1.5,
        unit: "s",
        displayStepper: true,
    },
    easingType: {
        type: ControlType.Enum,
        title: "Easing Type",
        description: "Animation easing for trail fade",
        options: [
            "linear",
            "easeOut",
            "easeInOut",
            "easeOutQuart",
            "easeOutExpo",
            "easeOutCirc",
            "easeOutBack",
        ],
        optionTitles: [
            "Linear",
            "Ease Out",
            "Ease In/Out",
            "Ease Out Quart",
            "Ease Out Expo",
            "Ease Out Circ",
            "Ease Out Back",
        ],
        defaultValue: "easeOut",
        displaySegmentedControl: false,
    },
    trailSpacing: {
        type: ControlType.Number,
        title: "Trail Spacing",
        description: "Spacing between trail points (lower=denser)",
        min: 5,
        max: 50,
        step: 5,
        defaultValue: 15,
        unit: "px",
        displayStepper: true,
    },
})
