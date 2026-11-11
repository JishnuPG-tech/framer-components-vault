// Animated water ripple effect with concentric waves made of evenly spaced circular dots on a black background
// Features: grid-aligned dots, concentric wave animation, color and speed props, scalable, smooth, performant
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface WaterRippleProps {
    color: string
    speed: number
    dotSize: number
    dotBaseColor: string
    style?: React.CSSProperties
}

/**
 * Ascii Water Ripple
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AsciiWaterRipple(props: WaterRippleProps) {
    const {
        color = "#00BFFF",
        speed = 2,
        dotSize = 1,
        dotBaseColor = "#e0e0e0",
        style,
    } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        if (typeof window === "undefined") return

        let animationFrame: number
        let running = true

        function draw() {
            const dpr = window.devicePixelRatio || 1
            const width = Math.floor(
                (canvas.parentElement?.offsetWidth || 400) * dpr
            )
            const height = Math.floor(
                (canvas.parentElement?.offsetHeight || 400) * dpr
            )
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = "#000"
            ctx.fillRect(0, 0, width, height)

            const dotSpacing = Math.max(Math.min(width, height) / 40, 4)
            const dotRadius = dotSpacing * 0.14 * dotSize
            const cols = Math.floor(width / dotSpacing)
            const rows = Math.floor(height / dotSpacing)
            const cx = width / 2
            const cy = height / 2

            const now = performance.now() / 1000
            const period = Math.max(speed, 0.2)
            const t = (now % period) / period
            const maxDist = Math.hypot(cx, cy)
            const waveCount = 2
            const waveLength = maxDist / (waveCount + 0.5)

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * dotSpacing + dotSpacing / 2
                    const y = j * dotSpacing + dotSpacing / 2
                    const dist = Math.hypot(x - cx, y - cy)

                    const phase = (dist / waveLength - t) * Math.PI * 2
                    const envelope = Math.exp(
                        -Math.pow(dist - t * maxDist, 2) /
                            (2 * Math.pow(maxDist * 0.25, 2))
                    )
                    const intensity = 0.5 + 0.5 * Math.sin(phase) * envelope
                    const fade = Math.max(
                        0,
                        1 - Math.abs(Math.sin(phase)) * 1.5
                    )
                    const alpha = Math.max(0, Math.min(1, intensity * fade))

                    // base dot
                    ctx.globalAlpha = 0.18
                    ctx.beginPath()
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
                    ctx.fillStyle = dotBaseColor
                    ctx.fill()

                    // animated overlay
                    if (alpha > 0.04) {
                        ctx.globalAlpha = alpha
                        ctx.beginPath()
                        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
                        ctx.fillStyle = color
                        ctx.shadowColor = color
                        ctx.shadowBlur = dotRadius * 1.2
                        ctx.fill()
                        ctx.shadowBlur = 0
                    }
                }
            }

            ctx.globalAlpha = 1
            if (running) animationFrame = requestAnimationFrame(draw)
        }

        draw()
        return () => {
            running = false
            cancelAnimationFrame(animationFrame)
        }
    }, [color, speed, dotSize, dotBaseColor])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                background: "#000",
                borderRadius: style?.borderRadius || 8,
                ...style,
            }}
        />
    )
}

addPropertyControls(AsciiWaterRipple, {
    color: {
        type: ControlType.Color,
        title: "Ripple Color",
        defaultValue: "#00BFFF",
    },
    dotBaseColor: {
        type: ControlType.Color,
        title: "Dots Color",
        defaultValue: "#e0e0e0",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 2,
        min: 0.2,
        max: 8,
        step: 0.1,
        displayStepper: true,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
        displayStepper: true,
    },
})
