import { useEffect, useState, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation, useMotionValue } from "framer-motion"

interface HoverGlitchImageProps {
    image: { src: string; alt: string }
    intensity: number
    speed: number
    borderRadius?: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HoverGlitchImage(props: HoverGlitchImageProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Glitch Image",
        },
        intensity = 50,
        speed = 50,
        borderRadius = "0px",
    } = props

    const isStatic = useIsStaticRenderer()
    const [isHovered, setIsHovered] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number>()
    const previousTimeRef = useRef<number>()

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = image.src

        img.onload = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
    }, [image.src, isStatic])

    // Draws the original image to the canvas
    const drawOriginal = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.src = image.src
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
    }

    // Glitch effect loop
    useEffect(() => {
        if (isStatic) return
        let running = true
        let frame = 0
        let img: HTMLImageElement | null = null
        let lastGlitch = 0
        let lastDraw = 0
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Preload image
        img = new window.Image()
        img.crossOrigin = "anonymous"
        img.src = image.src
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img!, 0, 0, canvas.width, canvas.height)
        }

        // Map speed (0-100) to FPS (2-60)
        const minFPS = 2
        const maxFPS = 60
        const fps = minFPS + ((maxFPS - minFPS) * (speed / 100))
        const frameInterval = 1000 / fps
        let lastGlitchTime = 0

        function glitchFrame(now: number) {
            if (!running) return
            if (!img) return
            // Always redraw original first
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            if (isHovered) {
                if (now - lastGlitchTime >= frameInterval) {
                    // Apply several glitch slices per frame for a more continuous effect
                    const slices = Math.floor(2 + intensity / 20)
                    for (let i = 0; i < slices; i++) {
                        const y = Math.random() * canvas.height
                        const h = Math.random() * (canvas.height / 8) + 1
                        const dx = (Math.random() - 0.5) * intensity
                        const imageData = ctx.getImageData(0, y, canvas.width, h)
                        ctx.putImageData(imageData, dx, y)
                    }
                    // Occasionally add RGB channel split
                    if (Math.random() < 0.3) {
                        const y = Math.random() * canvas.height
                        const h = Math.random() * (canvas.height / 6) + 1
                        const imageData = ctx.getImageData(0, y, canvas.width, h)
                        // Red channel
                        ctx.globalCompositeOperation = "lighter"
                        ctx.putImageData(imageData, 5, y)
                        // Blue channel
                        ctx.putImageData(imageData, -5, y)
                        ctx.globalCompositeOperation = "source-over"
                    }
                    lastGlitchTime = now
                }
            }
            frame++
            requestRef.current = requestAnimationFrame(glitchFrame)
        }
        requestRef.current = requestAnimationFrame(glitchFrame)
        return () => {
            running = false
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [isHovered, intensity, speed, image.src, isStatic])

    // On mouse leave, restore original image
    const handleMouseLeave = () => {
        setIsHovered(false)
        drawOriginal()
    }

    if (isStatic) {
        return (
            <img
                src={image.src}
                alt={image.alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: borderRadius,
                    overflow: borderRadius !== "0px" ? "hidden" : undefined,
                }}
            />
        )
    }

    return (
        <canvas
            ref={canvasRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                width: "100%",
                height: "100%",
                cursor: "pointer",
                display: "block",
                borderRadius: borderRadius,
                overflow: borderRadius !== "0px" ? "hidden" : undefined,
            }}
        />
    )
}

addPropertyControls(HoverGlitchImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "The image to display and glitch on hover.",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        description: "How strong the glitch distortion is (0 = none, 100 = max)",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "How frequently the glitch effect updates (0 = slow, 100 = fast)",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Corner Radius",
        description: "Corner radius for the image (in px)\n\nMade with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harshworks.framer.website)",
        defaultValue: "0px",
    },
})