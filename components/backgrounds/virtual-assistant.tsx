// User request: add viewport visibility detection so requestAnimationFrame only runs while visible, pause/cancel when hidden, and fully clean up observer + RAF with SSR-safe guards.
// Animated circular waveform similar to audio visualizer with transparent background
import { useEffect, useMemo, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AudioCircleProps {
    lineColor: string
    glowColor: string
    lineCount: number
    waveSpeed: number
    waveAmplitude: number
    baseRadius: number
    lineWidth: number
    glowIntensity: number
    rotationSpeed: number
    strandCount: number
    strandSpread: number
    taper: number
    highlightCount: number
    highlightSize: number
    useCustomSize: boolean
    customSize: number
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AudioCircle(props: AudioCircleProps) {
    const {
        lineColor = "#00BFFF",
        glowColor = "#00BFFF",
        lineCount = 720,
        waveSpeed = 1.6,
        waveAmplitude = 22,
        baseRadius = 150,
        lineWidth = 1,
        glowIntensity = 18,
        rotationSpeed = 0.45,
        strandCount = 26,
        strandSpread = 30,
        taper = 0.75,
        highlightCount = 10,
        highlightSize = 2.2,
        useCustomSize = false,
        customSize = 600,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    const timeRef = useRef(0)
    const isStatic = useIsStaticRenderer()

    const [canvasSize, setCanvasSize] = useState({ w: 600, h: 600, dpr: 1 })
    const [isInViewport, setIsInViewport] = useState(true)

    const highlights = useMemo(() => {
        // Deterministic pseudo-random points (stable between renders)
        const pts: { a: number; p: number; s: number }[] = []
        let seed = 1337
        const rand = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296
            return seed / 4294967296
        }
        for (let i = 0; i < Math.max(0, highlightCount); i++) {
            pts.push({ a: rand() * Math.PI * 2, p: rand() * Math.PI * 2, s: 0.6 + rand() * 1.2 })
        }
        return pts
    }, [highlightCount])

    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        // Resize canvas to match rendered size (for crisp lines)
        if (typeof window !== "undefined") {
            const ro = new ResizeObserver((entries) => {
                const entry = entries[0]
                if (!entry) return
                const cr = entry.contentRect
                const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
                const w = Math.max(1, Math.round(cr.width * dpr))
                const h = Math.max(1, Math.round(cr.height * dpr))
                startTransition(() => setCanvasSize({ w, h, dpr }))
            })
            ro.observe(wrapper)
            return () => ro.disconnect()
        }
    }, [])

    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return

        if (typeof window === "undefined") return

        if (typeof IntersectionObserver === "undefined") {
            startTransition(() => setIsInViewport(true))
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                startTransition(() => setIsInViewport(entry.isIntersecting))
            },
            {
                threshold: 0.01,
            }
        )

        observer.observe(wrapper)

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!useCustomSize) return
        const s = Math.max(1, Math.round(customSize))
        startTransition(() => setCanvasSize((prev) => ({ ...prev, w: s * Math.max(1, prev.dpr), h: s * Math.max(1, prev.dpr) })))
    }, [customSize, useCustomSize])

    const drawFrame = (t: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const centerX = width / 2
        const centerY = height / 2

        ctx.clearRect(0, 0, width, height)

        const minDim = Math.min(width, height)
        const maxRadius = minDim * 0.5 - 6 * canvasSize.dpr
        const r0 = Math.max(10, Math.min(baseRadius * canvasSize.dpr, maxRadius))

        // Soft glow settings
        ctx.shadowBlur = glowIntensity * canvasSize.dpr
        ctx.shadowColor = glowColor
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        const steps = Math.max(120, Math.floor(lineCount))
        const rot = t * rotationSpeed * 0.35

        // Multiple interwoven strands (similar to the reference image)
        for (let s = 0; s < Math.max(1, Math.floor(strandCount)); s++) {
            const u = strandCount <= 1 ? 0 : s / (strandCount - 1)
            const spread = (u - 0.5) * strandSpread
            const alpha = 0.06 + (1 - Math.abs(u - 0.5) * 2) * 0.12

            ctx.globalAlpha = alpha
            ctx.strokeStyle = lineColor
            ctx.lineWidth = Math.max(0.25, lineWidth * canvasSize.dpr * (1 - u * (1 - taper)))

            const phase = s * 0.33
            const wobbleA = waveAmplitude * canvasSize.dpr * (0.75 + u * 0.5)

            ctx.beginPath()
            for (let i = 0; i <= steps; i++) {
                const a = (i / steps) * Math.PI * 2

                // Compound waveform around a circle (audio-like)
                const w1 = Math.sin(a * 2 + t * 1.2 + phase)
                const w2 = Math.sin(a * 3 - t * 0.9 + phase * 1.7) * 0.6
                const w3 = Math.sin(a * 5 + t * 0.55 - phase * 1.2) * 0.35
                const w4 = Math.sin(a * 1 + t * 1.8 + phase * 0.9) * 0.25

                const r = r0 + spread * canvasSize.dpr + (w1 + w2 + w3 + w4) * wobbleA
                const x = centerX + Math.cos(a + rot) * r
                const y = centerY + Math.sin(a + rot) * r

                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.stroke()
        }

        // Bright highlights (glowing dots)
        ctx.shadowBlur = (glowIntensity * 1.2 + 4) * canvasSize.dpr
        ctx.fillStyle = glowColor
        ctx.globalAlpha = 0.9
        for (const h of highlights) {
            const a = h.a + rot
            const p = t * 1.15 + h.p
            const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p))

            const w = Math.sin(a * 2 + t * 1.2) + Math.sin(a * 3 - t * 0.9) * 0.6 + Math.sin(a * 5 + t * 0.55) * 0.35
            const r = r0 + w * waveAmplitude * canvasSize.dpr * 0.85

            const x = centerX + Math.cos(a) * r
            const y = centerY + Math.sin(a) * r
            const rr = highlightSize * canvasSize.dpr * h.s * pulse

            ctx.beginPath()
            ctx.arc(x, y, rr, 0, Math.PI * 2)
            ctx.fill()
        }

        ctx.globalAlpha = 1
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const animate = () => {
            timeRef.current += 0.016 * waveSpeed
            drawFrame(timeRef.current)
            if (typeof window !== "undefined") {
                animationRef.current = window.requestAnimationFrame(animate)
            }
        }

        if (isStatic) {
            drawFrame(0)
            return
        }

        if (typeof window === "undefined") return

        if (!isInViewport) {
            if (animationRef.current !== undefined) {
                window.cancelAnimationFrame(animationRef.current)
                animationRef.current = undefined
            }
            return
        }

        animate()

        return () => {
            if (typeof window !== "undefined" && animationRef.current !== undefined) {
                window.cancelAnimationFrame(animationRef.current)
                animationRef.current = undefined
            }
        }
    }, [
        lineColor,
        glowColor,
        lineCount,
        waveSpeed,
        waveAmplitude,
        baseRadius,
        lineWidth,
        glowIntensity,
        rotationSpeed,
        isStatic,
        canvasSize,
        strandCount,
        strandSpread,
        taper,
        highlights,
        highlightSize,
        isInViewport,
    ])

    return (
        <div
            ref={wrapperRef}
            style={{
                width: useCustomSize ? customSize : "100%",
                height: useCustomSize ? customSize : "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "transparent",
                }}
            />
        </div>
    )
}

addPropertyControls(AudioCircle, {
    useCustomSize: {
        type: ControlType.Boolean,
        title: "Custom Size",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    customSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 600,
        min: 100,
        max: 1600,
        step: 10,
        unit: "px",
        hidden: ({ useCustomSize }) => !useCustomSize,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#00BFFF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#00BFFF",
    },
    strandCount: {
        type: ControlType.Number,
        title: "Strands",
        defaultValue: 26,
        min: 4,
        max: 80,
        step: 1,
    },
    strandSpread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 30,
        min: 0,
        max: 120,
        step: 1,
    },
    taper: {
        type: ControlType.Number,
        title: "Taper",
        defaultValue: 0.75,
        min: 0.2,
        max: 1,
        step: 0.05,
    },
    lineCount: {
        type: ControlType.Number,
        title: "Detail",
        defaultValue: 720,
        min: 180,
        max: 2000,
        step: 20,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 1.6,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Amp",
        defaultValue: 22,
        min: 2,
        max: 120,
        step: 1,
    },
    baseRadius: {
        type: ControlType.Number,
        title: "Base Radius",
        defaultValue: 150,
        min: 30,
        max: 400,
        step: 5,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 1,
        min: 0.25,
        max: 5,
        step: 0.25,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
    },
    highlightCount: {
        type: ControlType.Number,
        title: "Highlights",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
    },
    highlightSize: {
        type: ControlType.Number,
        title: "Highlight Size",
        defaultValue: 2.2,
        min: 0.5,
        max: 10,
        step: 0.1,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0.45,
        min: 0,
        max: 5,
        step: 0.05,
    },
})