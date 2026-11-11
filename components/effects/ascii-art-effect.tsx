// ASCII art shader effect component that converts images/video to ASCII characters
import { useRef, useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AsciiEffectProps {
    image: { src: string; alt?: string }
    characterSize: number
    blackAndWhite: boolean
    backgroundColor: string
    textColor: string
    imageFit: "cover" | "contain" | "fill" | "none"
    style?: React.CSSProperties
}

/**
 * ASCII Art Effect
 * 
 * Transform any image into ASCII art with customizable character density and color modes.
 * Based on the classic "Bitmap to ASCII" shader by movAX13h.
 * 
 * Features:
 * - Real-time ASCII conversion with 40+ character variations
 * - Adjustable character size for different detail levels
 * - Color or black & white rendering modes
 * - Responsive canvas that maintains image aspect ratio
 * - Optimized performance with debounced resize handling
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AsciiEffect(props: AsciiEffectProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient",
        },
        characterSize = 8,
        blackAndWhite = false,
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        imageFit = "cover",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const animationFrameRef = useRef<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const resizeTimeoutRef = useRef<number>(0)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Track container dimensions with debouncing
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                
                // Debounce resize updates
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current)
                }
                
                resizeTimeoutRef.current = window.setTimeout(() => {
                    startTransition(() => {
                        setDimensions({
                            width: Math.max(1, Math.floor(width)),
                            height: Math.max(1, Math.floor(height)),
                        })
                    })
                }, 16) // ~60fps
            }
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        const img = imageRef.current
        if (!canvas || !img) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        const render = () => {
            const width = dimensions.width
            const height = dimensions.height

            if (width === 0 || height === 0 || !img.complete || img.naturalWidth === 0) {
                return
            }

            // Set canvas size to match container
            canvas.width = width
            canvas.height = height

            // Calculate dimensions based on fit mode
            const imgAspect = img.naturalWidth / img.naturalHeight
            const canvasAspect = width / height
            
            let drawWidth, drawHeight, offsetX, offsetY
            
            if (imageFit === "fill") {
                // Stretch to fill entire canvas
                drawWidth = width
                drawHeight = height
                offsetX = 0
                offsetY = 0
            } else if (imageFit === "contain") {
                // Fit entire image within canvas (letterbox/pillarbox)
                if (canvasAspect > imgAspect) {
                    // Canvas is wider - fit to height
                    drawHeight = height
                    drawWidth = height * imgAspect
                    offsetX = (width - drawWidth) / 2
                    offsetY = 0
                } else {
                    // Canvas is taller - fit to width
                    drawWidth = width
                    drawHeight = width / imgAspect
                    offsetX = 0
                    offsetY = (height - drawHeight) / 2
                }
            } else if (imageFit === "none") {
                // Display at natural size, centered
                drawWidth = img.naturalWidth
                drawHeight = img.naturalHeight
                offsetX = (width - drawWidth) / 2
                offsetY = (height - drawHeight) / 2
            } else {
                // Default: cover - fill canvas while maintaining aspect ratio
                if (canvasAspect > imgAspect) {
                    // Canvas is wider than image - fit to width
                    drawWidth = width
                    drawHeight = width / imgAspect
                    offsetX = 0
                    offsetY = (height - drawHeight) / 2
                } else {
                    // Canvas is taller than image - fit to height
                    drawHeight = height
                    drawWidth = height * imgAspect
                    offsetX = (width - drawWidth) / 2
                    offsetY = 0
                }
            }

            // Draw source image with cover behavior
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
            const imageData = ctx.getImageData(0, 0, width, height)
            const data = imageData.data

            // Clear canvas
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, width, height)

            // Process in character-sized blocks
            const blockSize = Math.max(4, characterSize)
            for (let y = 0; y < height; y += blockSize) {
                for (let x = 0; x < width; x += blockSize) {
                    // Sample color from block center
                    const sampleX = Math.min(Math.floor(x + blockSize / 2), width - 1)
                    const sampleY = Math.min(Math.floor(y + blockSize / 2), height - 1)
                    const pixelIndex = (sampleY * width + sampleX) * 4
                    const r = data[pixelIndex] / 255
                    const g = data[pixelIndex + 1] / 255
                    const b = data[pixelIndex + 2] / 255

                    // Calculate grayscale
                    const gray = 0.3 * r + 0.59 * g + 0.11 * b

                    // Select character based on gray value
                    let n = 4096
                    if (gray > 0.0233) n = 4096
                    if (gray > 0.0465) n = 131200
                    if (gray > 0.0698) n = 4329476
                    if (gray > 0.093) n = 459200
                    if (gray > 0.1163) n = 4591748
                    if (gray > 0.1395) n = 12652620
                    if (gray > 0.1628) n = 14749828
                    if (gray > 0.186) n = 18393220
                    if (gray > 0.2093) n = 15239300
                    if (gray > 0.2326) n = 17318431
                    if (gray > 0.2558) n = 32641156
                    if (gray > 0.2791) n = 18393412
                    if (gray > 0.3023) n = 18157905
                    if (gray > 0.3256) n = 17463428
                    if (gray > 0.3488) n = 14954572
                    if (gray > 0.3721) n = 13177118
                    if (gray > 0.3953) n = 6566222
                    if (gray > 0.4186) n = 16269839
                    if (gray > 0.4419) n = 18444881
                    if (gray > 0.4651) n = 18400814
                    if (gray > 0.4884) n = 33061392
                    if (gray > 0.5116) n = 15255086
                    if (gray > 0.5349) n = 32045584
                    if (gray > 0.5581) n = 18405034
                    if (gray > 0.5814) n = 15022158
                    if (gray > 0.6047) n = 15018318
                    if (gray > 0.6279) n = 16272942
                    if (gray > 0.6512) n = 18415153
                    if (gray > 0.6744) n = 32641183
                    if (gray > 0.6977) n = 32540207
                    if (gray > 0.7209) n = 18732593
                    if (gray > 0.7442) n = 18667121
                    if (gray > 0.7674) n = 16267326
                    if (gray > 0.7907) n = 32575775
                    if (gray > 0.814) n = 15022414
                    if (gray > 0.8372) n = 15255537
                    if (gray > 0.8605) n = 32032318
                    if (gray > 0.8837) n = 32045617
                    if (gray > 0.907) n = 33081316
                    if (gray > 0.9302) n = 32045630
                    if (gray > 0.9535) n = 33061407
                    if (gray > 0.9767) n = 11512810

                    // Render character
                    const gridSize = 5
                    for (let py = 0; py < blockSize; py++) {
                        for (let px = 0; px < blockSize; px++) {
                            // Map pixel position to 5x5 character grid
                            const normX = px / blockSize
                            const normY = py / blockSize
                            const charX = Math.floor((1 - normX) * gridSize * 2 - gridSize + 2.5)
                            const charY = Math.floor(normY * gridSize * 2 - gridSize + 2.5)
                            
                            if (charX >= 0 && charX < gridSize && charY >= 0 && charY < gridSize) {
                                const bitIndex = charX + gridSize * charY
                                if (((n >> bitIndex) & 1) === 1) {
                                    const pixX = x + px
                                    const pixY = y + py
                                    if (pixX < width && pixY < height) {
                                        if (blackAndWhite) {
                                            ctx.fillStyle = textColor
                                        } else {
                                            ctx.fillStyle = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`
                                        }
                                        ctx.fillRect(pixX, pixY, 1, 1)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        const handleImageLoad = () => {
            startTransition(() => setImageLoaded(true))
            render()
        }

        if (img.complete && img.naturalWidth > 0) {
            startTransition(() => setImageLoaded(true))
            render()
        } else {
            render()
        }
        
        img.addEventListener("load", handleImageLoad)

        return () => {
            img.removeEventListener("load", handleImageLoad)
        }
    }, [image.src, characterSize, blackAndWhite, backgroundColor, textColor, dimensions, imageLoaded, imageFit])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                minWidth: "1px",
                minHeight: "1px",
            }}
        >
            <img
                ref={imageRef}
                src={image.src}
                alt={image.alt || ""}
                style={{ display: "none" }}
                crossOrigin="anonymous"
            />
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    imageRendering: "pixelated",
                }}
            />
        </div>
    )
}

addPropertyControls(AsciiEffect, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "Source image to convert to ASCII art",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        description: "How the image should fit within the component",
        defaultValue: "cover",
        options: ["cover", "contain", "fill", "none"],
        optionTitles: ["Cover", "Contain", "Fill", "None"],
        displaySegmentedControl: false,
    },
    characterSize: {
        type: ControlType.Number,
        title: "Character Size",
        description: "Size of ASCII characters in pixels (smaller = more detail)",
        defaultValue: 8,
        min: 1,
        max: 32,
        step: 1,
        displayStepper: true,
    },
    blackAndWhite: {
        type: ControlType.Boolean,
        title: "Black & White",
        description: "Toggle between color and monochrome rendering",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color of ASCII characters in black & white mode",
        defaultValue: "#FFFFFF",
        hidden: ({ blackAndWhite }) => !blackAndWhite,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color visible through ASCII characters",
        defaultValue: "#000000",
    },
})

AsciiEffect.displayName = "ASCII Art Effect"