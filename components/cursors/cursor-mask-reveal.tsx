// Cursor Follow Mask Reveal: Foreground cutout with PNG/SVG mask, revealing background, mask follows cursor
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


interface CursorMaskRevealProps {
    backgroundImage: { src: string; alt: string }
    foregroundImage: { src: string; alt: string }
    maskType: "png" | "svg"
    maskImagePNG: string
    maskImageSVG: string
    maskWidth: number
    overlayColor: string
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 *
 * Cursor Follow Mask Reveal
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 350
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function CursorMaskReveal(props: CursorMaskRevealProps) {
    const {
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Background",
        },
        foregroundImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Foreground",
        },
        maskType = "png",
        maskImagePNG = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        maskImageSVG = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        maskWidth = 120,
        overlayColor = "#000000",
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [maskAspect, setMaskAspect] = React.useState(1)
    const [containerSize, setContainerSize] = React.useState({ w: 500, h: 350 })
    const [maskPos, setMaskPos] = React.useState({ x: 0.5, y: 0.5 })
    const [isInside, setIsInside] = React.useState(false)
    const isOnCanvas = useIsOnFramerCanvas()

    // Get current mask source based on type
    const currentMaskSrc = maskType === "png" ? maskImagePNG : maskImageSVG

    // Load images
    const [images, setImages] = React.useState({
        bg: null,
        fg: null,
        mask: null,
    })

    React.useEffect(() => {
        if (typeof window === "undefined") return

        let loaded = { bg: null as HTMLImageElement | null, fg: null as HTMLImageElement | null, mask: null as HTMLImageElement | null }
        let done = 0
        
        function check() {
            done++
            if (done === 3) setImages(loaded)
        }

        const bg = new window.Image()
        bg.crossOrigin = "anonymous"
        bg.onload = check
        bg.onerror = check
        bg.src = backgroundImage.src
        loaded.bg = bg

        const fg = new window.Image()
        fg.crossOrigin = "anonymous"
        fg.onload = check
        fg.onerror = check
        fg.src = foregroundImage.src
        loaded.fg = fg

        const mask = new window.Image()
        mask.crossOrigin = "anonymous"
        mask.onload = () => {
            setMaskAspect(mask.width / mask.height)
            loaded.mask = mask
            check()
        }
        mask.onerror = () => {
            setMaskAspect(1)
            loaded.mask = mask
            check()
        }
        mask.src = currentMaskSrc
        loaded.mask = mask
    }, [backgroundImage.src, foregroundImage.src, currentMaskSrc])

    // Track container size with ResizeObserver
    React.useLayoutEffect(() => {
        if (!containerRef.current || typeof window === "undefined") return
        
        const ref = containerRef.current
        
        function updateSize() {
            const rect = ref.getBoundingClientRect()
            setContainerSize({
                w: Math.round(rect.width),
                h: Math.round(rect.height),
            })
        }
        
        updateSize()
        
        const ro = new window.ResizeObserver(updateSize)
        ro.observe(ref)
        
        return () => ro.disconnect()
    }, [])

    // Mouse move handler
    React.useEffect(() => {
        if (isOnCanvas || typeof window === "undefined") return
        
        const ref = containerRef.current
        if (!ref) return
        
        let lastMouse = { x: null as number | null, y: null as number | null }
        
        function updateMaskFromPointer(clientX: number, clientY: number) {
            lastMouse.x = clientX
            lastMouse.y = clientY
            const rect = ref.getBoundingClientRect()
            let x = clientX - rect.left
            let y = clientY - rect.top
            
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                setIsInside(true)
                setMaskPos({ x: x / rect.width, y: y / rect.height })
            } else {
                setIsInside(false)
            }
        }
        
        function handlePointerMove(e: PointerEvent) {
            updateMaskFromPointer(e.clientX, e.clientY)
        }
        
        function handlePointerLeave() {
            setIsInside(false)
        }
        
        function handleScroll() {
            if (lastMouse.x !== null && lastMouse.y !== null) {
                const rect = ref.getBoundingClientRect()
                let x = lastMouse.x - rect.left
                let y = lastMouse.y - rect.top
                
                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    setIsInside(true)
                    setMaskPos({ x: x / rect.width, y: y / rect.height })
                } else {
                    setIsInside(false)
                }
            }
        }
        
        ref.addEventListener("pointermove", handlePointerMove)
        ref.addEventListener("pointerleave", handlePointerLeave)
        window.addEventListener("scroll", handleScroll, true)
        
        return () => {
            ref.removeEventListener("pointermove", handlePointerMove)
            ref.removeEventListener("pointerleave", handlePointerLeave)
            window.removeEventListener("scroll", handleScroll, true)
        }
    }, [isOnCanvas])

    // Draw to canvas
    React.useEffect(() => {
        const { w, h } = containerSize
        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx || !images.bg || !images.fg || !images.mask) return
        
        ctx.clearRect(0, 0, w, h)
        
        // Draw foreground (cover)
        drawCover(ctx, images.fg, w, h)
        
        // Overlay color on foreground (now using alpha from overlayColor)
        if (overlayColor && overlayColor.length > 0) {
            ctx.save()
            ctx.globalAlpha = 1
            ctx.globalCompositeOperation = "source-over"
            ctx.fillStyle = overlayColor
            ctx.fillRect(0, 0, w, h)
            ctx.restore()
        }
        
        // Prepare mask size/pos
        const maskW = maskWidth
        const maskH = maskWidth / maskAspect
        const halfW = maskW / 2
        const halfH = maskH / 2
        
        if (isInside) {
            let cx = maskPos.x * w
            let cy = maskPos.y * h
            
            // Set composite to destination-out to punch hole (including overlay)
            ctx.save()
            ctx.globalCompositeOperation = "destination-out"
            ctx.drawImage(images.mask, cx - halfW, cy - halfH, maskW, maskH)
            ctx.restore()
            
            // Draw background only in the hole
            ctx.save()
            ctx.globalCompositeOperation = "destination-over"
            drawCover(ctx, images.bg, w, h)
            ctx.restore()
        }
    }, [images, containerSize, maskPos, maskWidth, maskAspect, isInside, overlayColor])

    // Helper: draw image with object-fit: cover
    function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
        const iw = img.width
        const ih = img.height
        if (iw === 0 || ih === 0) return
        
        const scale = Math.max(w / iw, h / ih)
        const dw = iw * scale
        const dh = ih * scale
        const dx = (w - dw) / 2
        const dy = (h - dh) / 2
        
        ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh)
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                width: props.style && props.style.width !== undefined ? props.style.width : 500,
                height: props.style && props.style.height !== undefined ? props.style.height : 350,
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
                userSelect: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                width={containerSize.w}
                height={containerSize.h}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

addPropertyControls(CursorMaskReveal, {
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background",
    },
    foregroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Foreground",
    },
    maskType: {
        type: ControlType.Enum,
        title: "Mask Type",
        options: ["png", "svg"],
        optionTitles: ["PNG", "SVG"],
        defaultValue: "png",
        displaySegmentedControl: true,
    },
    maskImagePNG: {
        type: ControlType.File,
        allowedFileTypes: ["png", "svg"],
        title: "Mask Upload",
        hidden: ({ maskType }) => maskType !== "png",
    },
    maskImageSVG: {
        type: ControlType.File,
        allowedFileTypes: ["svg", "png"],
        title: "Mask Upload",
        hidden: ({ maskType }) => maskType !== "svg",
    },
    maskWidth: {
        type: ControlType.Number,
        title: "Mask Width",
        defaultValue: 120,
        min: 20,
        max: 800,
        step: 1,
        unit: "px",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#00000000", // transparent by default
    },
})

export default CursorMaskReveal
