import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Props = {
    images: string[]
    itemCount: number
    speed: number
    baseSize: number
    enableSpin: boolean
    centerSpace: number
    direction: "inward" | "outward"
}

export default function BlackHoleVortex(props: Props) {
    const {
        images = [
            "https://framerusercontent.com/images/4Kq8mY56747bX05Y5Y1Y5Y1Y5Y.png",
        ],
        itemCount = 80,
        speed = 2,
        baseSize = 45,
        enableSpin = true,
        centerSpace = 35,
        direction = "inward",
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStatic = useIsStaticRenderer()

    const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([])
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const validUrls = images.filter((url) => url && url.trim() !== "")

        if (validUrls.length === 0) {
            setIsReady(false)
            setLoadedImages([])
            return
        }

        setIsReady(false)
        let loadedCount = 0
        const tempImages: HTMLImageElement[] = []

        validUrls.forEach((url, idx) => {
            const img = new Image()
            img.src = url
            img.crossOrigin = "Anonymous"

            img.onload = () => {
                tempImages[idx] = img
                loadedCount++
                if (loadedCount === validUrls.length) {
                    setLoadedImages(tempImages.filter(Boolean))
                    setIsReady(true)
                }
            }

            img.onerror = () => {
                console.error("Failed to load vortex image:", url)
                loadedCount++
                if (loadedCount === validUrls.length) {
                    setLoadedImages(tempImages.filter(Boolean))
                    setIsReady(tempImages.filter(Boolean).length > 0)
                }
            }
        })
    }, [images])

    useEffect(() => {
        if (!isReady || loadedImages.length === 0) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        let animationFrameId: number
        let isIntersecting = true

        const particles = Array.from({ length: itemCount }, () => {
            const angle = Math.random() * Math.PI * 2

            const radiusNorm = 0.15 + Math.random() * 0.85
            return {
                angle: angle,
                radiusNorm: radiusNorm,
                rotation: Math.random() * Math.PI * 2,
                spinSpeed: (Math.random() - 0.5) * 0.05,
                imageIndex: Math.floor(Math.random() * loadedImages.length),
                orbitSpeedRatio: 0.8 + Math.random() * 0.4,
            }
        })

        const renderFrame = () => {
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height

            if (width === 0 || height === 0) return

            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            if (
                canvas.width !== width * dpr ||
                canvas.height !== height * dpr
            ) {
                canvas.width = width * dpr
                canvas.height = height * dpr
            }

            ctx.save()
            ctx.scale(dpr, dpr)
            ctx.clearRect(0, 0, width, height)

            const cx = width / 2
            const cy = height / 2
            const maxRadius = Math.hypot(cx, cy)
            const minCenterRatio = centerSpace / 100

            particles.forEach((p) => {
                if (!isStatic) {
                    const step = 0.0015 * speed

                    if (direction === "inward") {
                        p.radiusNorm -= step

                        p.angle +=
                            (step * 8 * p.orbitSpeedRatio) /
                            Math.max(p.radiusNorm, 0.1)

                        if (p.radiusNorm <= minCenterRatio) {
                            p.radiusNorm = 1.05
                            p.angle = Math.random() * Math.PI * 2
                            p.imageIndex = Math.floor(
                                Math.random() * loadedImages.length
                            )
                        }
                    } else {
                        p.radiusNorm += step
                        p.angle +=
                            (step * 8 * p.orbitSpeedRatio) /
                            Math.max(p.radiusNorm, 0.1)

                        if (p.radiusNorm >= 1.1) {
                            p.radiusNorm = minCenterRatio + 0.02
                            p.angle = Math.random() * Math.PI * 2
                            p.imageIndex = Math.floor(
                                Math.random() * loadedImages.length
                            )
                        }
                    }

                    if (enableSpin) {
                        p.rotation += p.spinSpeed * speed
                    }
                }

                const currentRadius = p.radiusNorm * maxRadius
                const px = cx + Math.cos(p.angle) * currentRadius
                const py = cy + Math.sin(p.angle) * currentRadius

                const distanceFromCenter = currentRadius / maxRadius
                const fadeZone = 0.15

                let opacity = 1
                if (distanceFromCenter < minCenterRatio + fadeZone) {
                    opacity = Math.max(
                        0,
                        (distanceFromCenter - minCenterRatio) / fadeZone
                    )
                }

                if (opacity > 0.02 && p.radiusNorm >= minCenterRatio) {
                    const scaleFactor = Math.min(
                        1.2,
                        Math.max(0.2, p.radiusNorm)
                    )
                    const size = baseSize * scaleFactor

                    ctx.globalAlpha = opacity

                    const currentImage = loadedImages[p.imageIndex]

                    if (currentImage) {
                        ctx.save()
                        ctx.translate(px, py)
                        if (enableSpin) {
                            ctx.rotate(p.rotation)
                        }

                        ctx.drawImage(
                            currentImage,
                            -size / 2,
                            -size / 2,
                            size,
                            size
                        )

                        ctx.restore()
                    }
                }
            })

            ctx.restore()
        }

        const handleResize = () => renderFrame()
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(canvas)

        const initialFrame = requestAnimationFrame(renderFrame)

        if (isStatic) {
            return () => {
                cancelAnimationFrame(initialFrame)
                resizeObserver.disconnect()
            }
        }

        const draw = () => {
            renderFrame()
            if (isIntersecting) {
                animationFrameId = requestAnimationFrame(draw)
            }
        }

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                const wasIntersecting = isIntersecting
                isIntersecting = entry.isIntersecting
                if (isIntersecting && !wasIntersecting) {
                    cancelAnimationFrame(animationFrameId)
                    animationFrameId = requestAnimationFrame(draw)
                }
            },
            { threshold: 0.05 }
        )

        intersectionObserver.observe(canvas)
        animationFrameId = requestAnimationFrame(draw)

        return () => {
            cancelAnimationFrame(initialFrame)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            cancelAnimationFrame(animationFrameId)
        }
    }, [
        isReady,
        loadedImages,
        itemCount,
        speed,
        baseSize,
        enableSpin,
        centerSpace,
        direction,
        isStatic,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                backgroundColor: "transparent",
                pointerEvents: "none",
            }}
        />
    )
}

addPropertyControls(BlackHoleVortex, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Image,
        },
        defaultValue: [
            "https://framerusercontent.com/images/4Kq8mY56747bX05Y5Y1Y5Y1Y5Y.png",
        ],
    },
    centerSpace: {
        type: ControlType.Number,
        title: "Center Space",
        defaultValue: 35,
        min: 10,
        max: 75,
        unit: "%",
        step: 5,
        description:
            "The radius limit of the center area that is left blank for content.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Flow",
        options: ["inward", "outward"],
        optionTitles: ["Inward (Suction)", "Outward (Explosion)"],
        defaultValue: "inward",
    },
    itemCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 80,
        min: 10,
        max: 250,
    },
    speed: {
        type: ControlType.Number,
        title: "Vortex Speed",
        defaultValue: 2,
        min: 0.2,
        max: 8,
        step: 0.2,
    },
    baseSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 45,
        min: 10,
        max: 200,
    },
    enableSpin: {
        type: ControlType.Boolean,
        title: "Self Rotate",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
