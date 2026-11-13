import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Fit = "cover" | "contain" | "stretch"
type Easing = "smooth" | "easeOut" | "linear"

type Props = {
    image: string
    alt: string
    width: number
    height: number
    fit: Fit
    duration: number
    delay: number
    pixelSize: number
    replayOnHover: boolean
    easing: Easing
    radius: number
    background: string
    borderColor: string
    borderWidth: number
}

const PLACEHOLDER =
    "https://unsplash.com/photos/d4feocYfzAM/download?force=true&w=1200"

function imageUrl(image: unknown) {
    if (!image) return PLACEHOLDER
    if (typeof image === "string") return image

    const asset = image as { src?: string }

    return asset.src || PLACEHOLDER
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function easeProgress(value: number, easing: Easing) {
    const t = clamp(value, 0, 1)

    if (easing === "linear") return t
    if (easing === "easeOut") return 1 - Math.pow(1 - t, 3)

    return t * t * (3 - 2 * t)
}

function imageRect(
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    fit: Fit
) {
    if (fit === "stretch") {
        return {
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
        }
    }

    const imageRatio = imageWidth / imageHeight
    const canvasRatio = canvasWidth / canvasHeight
    const shouldCover = fit === "cover"
    const useWidth = shouldCover
        ? imageRatio < canvasRatio
        : imageRatio > canvasRatio

    if (useWidth) {
        const width = canvasWidth
        const height = width / imageRatio

        return {
            x: 0,
            y: (canvasHeight - height) / 2,
            width,
            height,
        }
    }

    const height = canvasHeight
    const width = height * imageRatio

    return {
        x: (canvasWidth - width) / 2,
        y: 0,
        width,
        height,
    }
}

function drawPixelatedImage(
    canvas: HTMLCanvasElement,
    source: HTMLImageElement,
    pixelSize: number,
    fit: Fit
) {
    const context = canvas.getContext("2d")
    if (!context || !source.naturalWidth || !source.naturalHeight) return

    const width = Math.max(1, canvas.width)
    const height = Math.max(1, canvas.height)
    const cssWidth = Math.max(1, canvas.clientWidth || width)
    const cssHeight = Math.max(1, canvas.clientHeight || height)
    const blockSize = clamp(pixelSize, 1, Math.max(cssWidth, cssHeight))
    const tinyWidth = Math.max(1, Math.round(cssWidth / blockSize))
    const tinyHeight = Math.max(1, Math.round(cssHeight / blockSize))
    const buffer = document.createElement("canvas")
    const bufferContext = buffer.getContext("2d")

    if (!bufferContext) return

    buffer.width = tinyWidth
    buffer.height = tinyHeight
    bufferContext.imageSmoothingEnabled = true
    bufferContext.clearRect(0, 0, tinyWidth, tinyHeight)

    if (fit === "stretch") {
        bufferContext.drawImage(source, 0, 0, tinyWidth, tinyHeight)
    } else if (fit === "contain") {
        const rect = imageRect(
            source.naturalWidth,
            source.naturalHeight,
            tinyWidth,
            tinyHeight,
            fit
        )

        bufferContext.drawImage(source, rect.x, rect.y, rect.width, rect.height)
    } else {
        const sourceRatio = source.naturalWidth / source.naturalHeight
        const targetRatio = cssWidth / cssHeight
        let cropX = 0
        let cropY = 0
        let cropWidth = source.naturalWidth
        let cropHeight = source.naturalHeight

        if (sourceRatio > targetRatio) {
            cropWidth = source.naturalHeight * targetRatio
            cropX = (source.naturalWidth - cropWidth) / 2
        } else {
            cropHeight = source.naturalWidth / targetRatio
            cropY = (source.naturalHeight - cropHeight) / 2
        }

        bufferContext.drawImage(
            source,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            tinyWidth,
            tinyHeight
        )
    }

    context.clearRect(0, 0, width, height)
    context.imageSmoothingEnabled = false
    context.drawImage(buffer, 0, 0, tinyWidth, tinyHeight, 0, 0, width, height)
}

const defaultProps: Props = {
    width: 360,
    height: 520,
    image: PLACEHOLDER,
    alt: "Pixel loaded image",
    fit: "cover",
    duration: 1.8,
    delay: 0.2,
    pixelSize: 28,
    replayOnHover: true,
    easing: "smooth",
    radius: 18,
    background: "#F7F7F7",
    borderColor: "rgba(255,255,255,0.14)",
    borderWidth: 0,
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 520
 */
export default function ImagePixelLoader(props: Partial<Props>) {
    const {
        image,
        alt,
        width,
        height,
        fit,
        duration,
        delay,
        pixelSize,
        replayOnHover,
        easing,
        radius,
        background,
        borderColor,
        borderWidth,
    } = { ...defaultProps, ...props }

    const src = imageUrl(image)
    const isStaticRenderer = useIsStaticRenderer()
    const frameRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const imageRef = React.useRef<HTMLImageElement>(null)
    const animationRef = React.useRef<number | null>(null)
    const [hoverReplay, setHoverReplay] = React.useState(0)
    const [frameSize, setFrameSize] = React.useState({
        width: Math.max(1, width),
        height: Math.max(1, height),
    })
    const [imageReady, setImageReady] = React.useState(false)
    const [sharpOpacity, setSharpOpacity] = React.useState(
        isStaticRenderer ? 1 : 0
    )

    React.useEffect(() => {
        if (!frameRef.current || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(([entry]) => {
            const { width: measuredWidth, height: measuredHeight } =
                entry.contentRect

            if (measuredWidth > 0 && measuredHeight > 0) {
                setFrameSize({
                    width: measuredWidth,
                    height: measuredHeight,
                })
            }
        })

        observer.observe(frameRef.current)

        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        setFrameSize({
            width: Math.max(1, width),
            height: Math.max(1, height),
        })
    }, [width, height])

    React.useEffect(() => {
        setImageReady(false)
        setSharpOpacity(isStaticRenderer ? 1 : 0)

        const imageElement = imageRef.current
        if (imageElement?.complete && imageElement.naturalWidth > 0) {
            setImageReady(true)
        }
    }, [src, isStaticRenderer])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const imageElement = imageRef.current
        if (!canvas || !imageElement) return

        const pixelRatio =
            typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
        const canvasWidth = Math.max(
            1,
            Math.round(frameSize.width * pixelRatio)
        )
        const canvasHeight = Math.max(
            1,
            Math.round(frameSize.height * pixelRatio)
        )

        canvas.width = canvasWidth
        canvas.height = canvasHeight
        canvas.style.width = "100%"
        canvas.style.height = "100%"

        if (!imageReady) return

        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current)
        }

        if (isStaticRenderer) {
            drawPixelatedImage(canvas, imageElement, 1, fit)
            setSharpOpacity(1)
            return
        }

        let startTime: number | null = null
        const durationMs = Math.max(0.1, duration) * 1000
        const delayMs = Math.max(0, delay) * 1000
        const from = clamp(pixelSize, 2, 140)
        const smoothAmount = 0.7
        const to = clamp(3 - smoothAmount * 2, 1, from)
        const fadeStart = clamp(0.78 - smoothAmount * 0.5, 0.16, 0.9)
        const maxSharpBlur = (1 - smoothAmount) * 10

        setSharpOpacity(0)
        if (imageRef.current) {
            imageRef.current.style.opacity = "0"
            imageRef.current.style.filter = `blur(${maxSharpBlur}px)`
        }
        drawPixelatedImage(canvas, imageElement, from, fit)

        const tick = (time: number) => {
            if (startTime === null) startTime = time

            const elapsed = time - startTime

            if (elapsed < delayMs) {
                animationRef.current = requestAnimationFrame(tick)
                return
            }

            const raw = clamp((elapsed - delayMs) / durationMs, 0, 1)
            const eased = easeProgress(raw, easing)
            const animatedPixelSize = from + (to - from) * eased

            drawPixelatedImage(canvas, imageElement, animatedPixelSize, fit)

            const opacity = clamp((raw - fadeStart) / (1 - fadeStart), 0, 1)
            if (imageRef.current) {
                imageRef.current.style.opacity = String(opacity)
                imageRef.current.style.filter = `blur(${maxSharpBlur * (1 - opacity)}px)`
            }

            if (raw < 1) {
                animationRef.current = requestAnimationFrame(tick)
                return
            }

            if (imageRef.current) {
                imageRef.current.style.opacity = "1"
                imageRef.current.style.filter = "blur(0px)"
            }
        }

        animationRef.current = requestAnimationFrame(tick)

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [
        src,
        imageReady,
        frameSize.width,
        frameSize.height,
        fit,
        duration,
        delay,
        pixelSize,
        easing,
        hoverReplay,
        isStaticRenderer,
    ])

    const sharpFit = fit === "stretch" ? "fill" : fit

    return (
        <div
            ref={frameRef}
            onMouseEnter={() => {
                if (!isStaticRenderer && replayOnHover) {
                    setHoverReplay((value) => value + 1)
                }
            }}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                background,
                border: `${borderWidth}px solid ${borderColor}`,
                boxSizing: "border-box",
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                draggable={false}
                onLoad={() => setImageReady(true)}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: sharpFit,
                    opacity: sharpOpacity,
                    filter: "blur(0px)",
                    transition: "opacity 220ms ease, filter 220ms ease",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

ImagePixelLoader.defaultProps = defaultProps

addPropertyControls(ImagePixelLoader, {
    image: {
        type: ControlType.Image,
        title: "Image",
    },
    alt: {
        type: ControlType.String,
        title: "Alt",
        defaultValue: "Pixel loaded image",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "stretch"],
        optionTitles: ["Cover", "Contain", "Stretch"],
        defaultValue: "cover",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 8,
        step: 0.05,
        defaultValue: 1.8,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 0.2,
        unit: "s",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        min: 2,
        max: 96,
        step: 1,
        defaultValue: 28,
        unit: "px",
    },
    easing: {
        type: ControlType.Enum,
        title: "Ease",
        options: ["smooth", "easeOut", "linear"],
        optionTitles: ["Smooth", "Ease Out", "Linear"],
        defaultValue: "smooth",
    },
    replayOnHover: {
        type: ControlType.Boolean,
        title: "Hover Replay",
        defaultValue: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 18,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F7F7F7",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.14)",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 0,
        unit: "px",
    },
})
