import React, { useRef, useEffect, useState, useLayoutEffect } from "react"
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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ParticleFormation(props) {
    const {
        image,
        layoutMode,
        imageScale,
        imageWidth,
        imageHeight,
        particleCount,
        particleSize,
        duration,
        easing,
        overrideColor,
        particleColor,
        style,
    } = props

    const mainRef = useRef<HTMLDivElement | null>(null) // Ref for the main div
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)
    const [coloredImageSrc, setColoredImageSrc] = useState<string | undefined>(
        image
    )
    // **NEW: State to hold the size measured by ResizeObserver**
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    // **NEW: This effect sets up the ResizeObserver to watch the container**
    useEffect(() => {
        const element = mainRef.current
        if (!element) return

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect
                setContainerSize({ width, height })
            }
        })

        resizeObserver.observe(element)
        return () => resizeObserver.disconnect()
    }, [])

    // **MODIFICATION: This is the main animation effect. It now depends on containerSize.**
    useEffect(() => {
        const { width, height } = containerSize
        if (!canvasRef.current || !imageRef.current || width === 0) return

        const canvas = canvasRef.current
        const finalImage = imageRef.current
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        canvas.style.opacity = "1"
        finalImage.style.opacity = "0"
        let particles: Particle[] = []
        let animationFrameId: number
        let startTime: number | null = null

        const easings = {
            linear: (t) => t,
            easeInQuad: (t) => t * t,
            easeOutQuad: (t) => t * (2 - t),
            easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
            easeOutBounce: (t) => {
                const n1 = 7.5625
                const d1 = 2.75
                if (t < 1 / d1) {
                    return n1 * t * t
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375
                }
            },
        }

        class Particle {
            originX: number
            originY: number
            startX: number
            startY: number
            x: number
            y: number
            color: string
            size: number
            startTimeOffset: number
            constructor(
                originX: number,
                originY: number,
                color: string,
                canvasWidth: number,
                canvasHeight: number
            ) {
                this.originX = originX
                this.originY = originY
                this.color = color
                this.size = particleSize
                const side = Math.floor(Math.random() * 4)
                const margin = 100
                if (side === 0) {
                    this.startX = Math.random() * canvasWidth
                    this.startY = -margin
                } else if (side === 1) {
                    this.startX = canvasWidth + margin
                    this.startY = Math.random() * canvasHeight
                } else if (side === 2) {
                    this.startX = Math.random() * canvasWidth
                    this.startY = canvasHeight + margin
                } else {
                    this.startX = -margin
                    this.startY = Math.random() * canvasHeight
                }
                this.x = this.startX
                this.y = this.startY
                this.startTimeOffset = Math.random() * (duration * 500)
            }
            draw() {
                ctx.fillStyle = this.color
                ctx.fillRect(this.x, this.y, this.size, this.size)
            }
            update(elapsedTime: number) {
                const animationDuration = duration * 1000
                if (elapsedTime <= this.startTimeOffset) return
                const progress = Math.min(
                    1,
                    (elapsedTime - this.startTimeOffset) / animationDuration
                )
                const easedProgress = easings[easing](progress)
                this.x =
                    this.startX + (this.originX - this.startX) * easedProgress
                this.y =
                    this.startY + (this.originY - this.startY) * easedProgress
            }
        }

        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.src = image
        img.onload = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.scale(dpr, dpr)

            let finalImageWidth = width,
                finalImageHeight = height
            const imageAspect = img.naturalWidth / img.naturalHeight
            if (layoutMode === "Fit") {
                const containerAspect = width / height
                if (imageAspect > containerAspect) {
                    finalImageWidth = width
                    finalImageHeight = width / imageAspect
                } else {
                    finalImageHeight = height
                    finalImageWidth = height * imageAspect
                }
            } else if (layoutMode === "Relative") {
                finalImageWidth = width * imageScale
                finalImageHeight = finalImageWidth / imageAspect
            } else if (layoutMode === "Fixed") {
                finalImageWidth = imageWidth
                finalImageHeight = imageHeight
            }
            const imageX = (width - finalImageWidth) / 2
            const imageY = (height - finalImageHeight) / 2

            if (finalImage) {
                finalImage.style.width = `${finalImageWidth}px`
                finalImage.style.height = `${finalImageHeight}px`
            }

            const tempCanvas = document.createElement("canvas")
            tempCanvas.width = img.naturalWidth
            tempCanvas.height = img.naturalHeight
            const tempCtx = tempCanvas.getContext("2d")
            if (!tempCtx) return
            tempCtx.drawImage(img, 0, 0)
            if (overrideColor) {
                const tempPixels = tempCtx.getImageData(
                    0,
                    0,
                    tempCanvas.width,
                    tempCanvas.height
                )
                const data = tempPixels.data
                const s = document.createElement("div")
                s.style.color = particleColor
                document.body.appendChild(s)
                const computedColor = getComputedStyle(s).color
                document.body.removeChild(s)
                const rgb = computedColor.match(/\d+/g)
                if (rgb) {
                    const [r, g, b] = rgb.map(Number)
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] > 0) {
                            data[i] = r
                            data[i + 1] = g
                            data[i + 2] = b
                        }
                    }
                }
                tempCtx.putImageData(tempPixels, 0, 0)
                setColoredImageSrc(tempCanvas.toDataURL("image/png"))
            } else {
                setColoredImageSrc(image)
            }
            const particleCanvas = document.createElement("canvas")
            particleCanvas.width = finalImageWidth * dpr
            particleCanvas.height = finalImageHeight * dpr
            const pctx = particleCanvas.getContext("2d")
            if (!pctx) return
            pctx.drawImage(
                img,
                0,
                0,
                finalImageWidth * dpr,
                finalImageHeight * dpr
            )
            const pixels = pctx.getImageData(
                0,
                0,
                finalImageWidth * dpr,
                finalImageHeight * dpr
            )
            const potentialParticles = []
            const scanStep = Math.max(
                1,
                dpr,
                Math.floor(
                    (finalImageWidth * finalImageHeight) / (particleCount * 5)
                )
            )
            for (let y = 0; y < finalImageHeight * dpr; y += scanStep) {
                for (let x = 0; x < finalImageWidth * dpr; x += scanStep) {
                    const index = (y * (finalImageWidth * dpr) + x) * 4
                    if (pixels.data[index + 3] > 128) {
                        const color = overrideColor
                            ? particleColor
                            : `rgb(${pixels.data[index]},${pixels.data[index + 1]},${pixels.data[index + 2]})`
                        potentialParticles.push({
                            x: x / dpr + imageX,
                            y: y / dpr + imageY,
                            color,
                        })
                    }
                }
            }
            for (let i = potentialParticles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[potentialParticles[i], potentialParticles[j]] = [
                    potentialParticles[j],
                    potentialParticles[i],
                ]
            }
            const finalParticleData = potentialParticles.slice(0, particleCount)
            particles = finalParticleData.map(
                (data) =>
                    new Particle(data.x, data.y, data.color, width, height)
            )
            requestAnimationFrame(animate)
        }
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsedTime = timestamp - startTime
            ctx.clearRect(0, 0, width, height)
            particles.forEach((p) => {
                p.update(elapsedTime)
                p.draw()
            })
            const totalAnimationTime = duration * 1000 + duration * 500
            const imageRevealTime = totalAnimationTime * 0.8
            const fadeDuration = totalAnimationTime - imageRevealTime
            if (elapsedTime > imageRevealTime) {
                const fadeProgress = Math.min(
                    1,
                    (elapsedTime - imageRevealTime) / fadeDuration
                )
                canvas.style.opacity = `${1 - fadeProgress}`
                finalImage.style.opacity = `${fadeProgress}`
            }
            if (elapsedTime >= totalAnimationTime) {
                finalImage.style.opacity = "1"
                cancelAnimationFrame(animationFrameId)
                return
            }
            animationFrameId = requestAnimationFrame(animate)
        }
        return () => cancelAnimationFrame(animationFrameId)
    }, [
        containerSize,
        image,
        layoutMode,
        imageScale,
        imageWidth,
        imageHeight,
        particleCount,
        particleSize,
        duration,
        easing,
        overrideColor,
        particleColor,
    ])

    return (
        <div
            ref={mainRef}
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
            />
            <img
                ref={imageRef}
                src={coloredImageSrc}
                alt="Final logo"
                style={{
                    flexShrink: 0,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

ParticleFormation.defaultProps = {
    width: 800,
    height: 600,
    layoutMode: "Relative",
    imageScale: 0.5,
    imageWidth: 400,
    imageHeight: 400,
    particleCount: 4000,
    particleSize: 1.5,
    duration: 2.5,
    easing: "easeInOutQuad",
    overrideColor: false,
    particleColor: "#0099FF",
}

addPropertyControls(ParticleFormation, {
    layoutMode: {
        type: ControlType.Enum,
        title: "Layout Mode",
        options: ["Fill", "Fit", "Relative", "Fixed"],
        defaultValue: "Relative",
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image Scale",
        defaultValue: 0.5,
        min: 0.1,
        max: 1,
        step: 0.01,
        displayStepper: false,
        unit: "%",
        hidden: (props) => props.layoutMode !== "Relative",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 400,
        min: 50,
        max: 4000,
        step: 10,
        hidden: (props) => props.layoutMode !== "Fixed",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 400,
        min: 50,
        max: 4000,
        step: 10,
        hidden: (props) => props.layoutMode !== "Fixed",
    },
    image: { type: ControlType.Image, title: "Image" },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 2.5,
        min: 0.5,
        max: 10,
        step: 0.1,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Number of Particles",
        defaultValue: 4000,
        min: 100,
        max: 20000,
        step: 100,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 1.5,
        min: 0.5,
        max: 10,
        step: 0.1,
    },
    overrideColor: {
        type: ControlType.Boolean,
        title: "Use Custom Color",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    particleColor: {
        type: ControlType.Color,
        title: "Particle Color",
        defaultValue: "#0099FF",
        hidden: (props) => !props.overrideColor,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "linear",
            "easeInQuad",
            "easeOutQuad",
            "easeInOutQuad",
            "easeOutBounce",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In-Out",
            "Bounce Out",
        ],
        defaultValue: "easeInOutQuad",
    },
})
