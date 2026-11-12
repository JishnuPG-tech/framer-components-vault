import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SpiralLayersProps {
    spiralColor: string
    backgroundColor: string
    appearance: {
        lineWidth: number
        opacity: number
        spiralTightness: number
    }
    layout: {
        layerCount: number
        centerHoleSize: number
    }
    animation: {
        baseSpeed: number
        speedVariation: number
    }
    size: {
        baseSize: number
        sizeVariation: number
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function SpiralLayers(props: SpiralLayersProps) {
    const {
        spiralColor = "#0099FF",
        backgroundColor = "#000000",
        appearance = { lineWidth: 2, opacity: 0.6, spiralTightness: 0.1 },
        layout = { layerCount: 5, centerHoleSize: 0.5 },
        animation = { baseSpeed: 1, speedVariation: 0.5 },
        size = { baseSize: 0.8, sizeVariation: 0.3 },
    } = props

    const { lineWidth, opacity, spiralTightness } = appearance
    const { layerCount, centerHoleSize } = layout
    const { baseSpeed, speedVariation } = animation
    const { baseSize, sizeVariation } = size

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const centerX = width / 2
        const centerY = height / 2

        let time = 0

        const drawSpiral = (
            rotation: number,
            size: number,
            layerOpacity: number,
            color: string,
            layerIndex: number
        ) => {
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(rotation)

            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth + layerIndex * 0.5
            ctx.globalAlpha = layerOpacity

            ctx.beginPath()

            const maxRadius = Math.min(width, height) * size * 0.4
            const turns = 3
            const points = 200

            for (let i = 0; i <= points; i++) {
                const t = i / points
                const angle = t * turns * Math.PI * 2
                const radius =
                    t *
                    maxRadius *
                    (1 + Math.sin(angle * spiralTightness) * 0.2)

                const minRadius = maxRadius * centerHoleSize
                if (radius < minRadius) continue

                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                if (i === 0 || radius === minRadius) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }

            ctx.stroke()
            ctx.restore()
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, width, height)

            for (let i = 0; i < layerCount; i++) {
                const layerProgress = i / (layerCount - 1)
                const speed =
                    baseSpeed * (1 + (layerProgress - 0.5) * speedVariation)
                const size =
                    baseSize * (1 + (layerProgress - 0.5) * sizeVariation)
                const rotation = time * speed * 0.01
                const layerOpacity = opacity * (0.5 + layerProgress * 0.5)

                drawSpiral(rotation, size, layerOpacity, spiralColor, i)
            }

            time += 1
            if (!isStatic) {
                animationRef.current = requestAnimationFrame(animate)
            }
        }

        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [
        layerCount,
        baseSpeed,
        speedVariation,
        baseSize,
        sizeVariation,
        spiralTightness,
        spiralColor,
        backgroundColor,
        lineWidth,
        opacity,
        centerHoleSize,
        isStatic,
    ])

    useEffect(() => {
        if (!isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const centerX = width / 2
        const centerY = height / 2

        const drawSpiral = (
            rotation: number,
            size: number,
            layerOpacity: number,
            color: string,
            layerIndex: number
        ) => {
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(rotation)

            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth + layerIndex * 0.5
            ctx.globalAlpha = layerOpacity

            ctx.beginPath()

            const maxRadius = Math.min(width, height) * size * 0.4
            const turns = 3
            const points = 200

            for (let i = 0; i <= points; i++) {
                const t = i / points
                const angle = t * turns * Math.PI * 2
                const radius =
                    t *
                    maxRadius *
                    (1 + Math.sin(angle * spiralTightness) * 0.2)

                const minRadius = maxRadius * centerHoleSize
                if (radius < minRadius) continue

                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                if (i === 0 || radius === minRadius) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            }

            ctx.stroke()
            ctx.restore()
        }

        ctx.clearRect(0, 0, width, height)

        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)

        for (let i = 0; i < layerCount; i++) {
            const layerProgress = i / (layerCount - 1)
            const speed =
                baseSpeed * (1 + (layerProgress - 0.5) * speedVariation)
            const size = baseSize * (1 + (layerProgress - 0.5) * sizeVariation)
            const rotation = layerProgress * Math.PI * 0.5
            const layerOpacity = opacity * (0.5 + layerProgress * 0.5)

            drawSpiral(rotation, size, layerOpacity, spiralColor, i)
        }
    }, [
        layerCount,
        baseSpeed,
        speedVariation,
        baseSize,
        sizeVariation,
        spiralTightness,
        spiralColor,
        backgroundColor,
        lineWidth,
        opacity,
        centerHoleSize,
        isStatic,
    ])

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={800}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    )
}

addPropertyControls(SpiralLayers, {
    spiralColor: {
        type: ControlType.Color,
        title: "Spiral Color",
        defaultValue: "#0099FF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            lineWidth: {
                type: ControlType.Number,
                title: "Line Width",
                defaultValue: 2,
                min: 1,
                max: 10,
                step: 1,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.6,
                min: 0.1,
                max: 1,
                step: 0.1,
            },
            spiralTightness: {
                type: ControlType.Number,
                title: "Tightness",
                defaultValue: 0.1,
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            layerCount: {
                type: ControlType.Number,
                title: "Layers",
                defaultValue: 5,
                min: 2,
                max: 15,
                step: 1,
            },
            centerHoleSize: {
                type: ControlType.Number,
                title: "Center Hole",
                defaultValue: 0.5,
                min: 0.1,
                max: 0.8,
                step: 0.05,
            },
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            baseSpeed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
            },
            speedVariation: {
                type: ControlType.Number,
                title: "Speed Variation",
                defaultValue: 0.5,
                min: 0,
                max: 2,
                step: 0.1,
            },
        },
    },

    size: {
        type: ControlType.Object,
        title: "Size",
        controls: {
            baseSize: {
                type: ControlType.Number,
                title: "Base Size",
                defaultValue: 0.8,
                min: 0.3,
                max: 1.5,
                step: 0.1,
            },
            sizeVariation: {
                type: ControlType.Number,
                title: "Size Variation",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.1,
            },
        },
    },
})

export default SpiralLayers
