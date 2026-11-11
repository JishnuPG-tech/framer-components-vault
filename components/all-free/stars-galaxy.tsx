import * as React from "react"
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


type Star = {
    x: number
    y: number
    z: number
    tw: number
}

export default function Starfield(props: any) {
    const {
        stars = 600,
        speed = 2,
        spread = 5,
        focal = 1,
        twinkle = 0.2,
        trail = 0.75,
        size = 0.5,
        fadeInRange = 3,
        reverseFly = false,
        followCursor = true,
        stopInEditor = true,
        background = "#000000",
        starColor = "#ffffff",
    } = props || {}

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouse = useRef({ x: 0.5, y: 0.5 })
    const starsRef = useRef<Star[]>([])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")!
        const DPR = window.devicePixelRatio || 1
        const isEditor = RenderTarget.current() === RenderTarget.canvas

        const clamp = (v: number, min: number, max: number) =>
            Math.max(min, Math.min(max, v))

        const createStar = (): Star => ({
            x: (Math.random() - 0.5) * spread,
            y: (Math.random() - 0.5) * spread,
            z: Math.random(),
            tw: Math.random() * Math.PI * 2,
        })

        const resize = () => {
            const rect = canvas.parentElement!.getBoundingClientRect()
            canvas.width = rect.width * DPR
            canvas.height = rect.height * DPR
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
        }

        resize()
        window.addEventListener("resize", resize)

        starsRef.current = Array.from({ length: stars }, createStar)

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouse.current.x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
            mouse.current.y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
        }

        window.addEventListener("mousemove", onMouseMove)

        let raf = 0

        const animate = () => {
            const w = canvas.width / DPR
            const h = canvas.height / DPR

            ctx.globalAlpha = 1
            ctx.fillStyle = background
            ctx.fillRect(0, 0, w, h)

            if (trail < 1) {
                ctx.globalAlpha = 1 - trail
                ctx.fillStyle = background
                ctx.fillRect(0, 0, w, h)
            }

            ctx.globalAlpha = 1
            ctx.fillStyle = starColor

            const cx = followCursor ? mouse.current.x * w : w / 2
            const cy = followCursor ? mouse.current.y * h : h / 2

            for (const s of starsRef.current) {
                const depth = s.z * clamp(focal, 0.01, 10) + 0.001
                const px = cx + (s.x / depth) * w
                const py = cy + (s.y / depth) * h

                s.z += reverseFly
                    ? clamp(speed, 0, 10) * 0.002
                    : -clamp(speed, 0, 10) * 0.002

                if (s.z <= 0 || s.z > 1) Object.assign(s, createStar())

                s.tw += clamp(twinkle, 0, 1) * 0.05

                const alpha = Math.max(0, 1 - s.z / clamp(fadeInRange, 0.1, 10))

                const radius =
                    clamp(size, 0.1, 5) *
                    (1 - s.z) *
                    (1 + Math.sin(s.tw) * clamp(twinkle, 0, 1))

                ctx.globalAlpha = alpha
                ctx.beginPath()
                ctx.arc(px, py, radius, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.globalAlpha = 1

            if (!isEditor || !stopInEditor) {
                raf = requestAnimationFrame(animate)
            }
        }

        animate()

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("resize", resize)
            window.removeEventListener("mousemove", onMouseMove)
        }
    }, [
        stars,
        speed,
        spread,
        focal,
        twinkle,
        trail,
        size,
        fadeInRange,
        reverseFly,
        followCursor,
        stopInEditor,
        background,
        starColor,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                background,
            }}
        />
    )
}

addPropertyControls(Starfield, {
    stars: {
        type: ControlType.Number,
        min: 0,
        max: 2000,
        step: 1,
        defaultValue: 1000,
    },
    speed: {
        type: ControlType.Number,
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 2,
    },
    spread: {
        type: ControlType.Number,
        min: 0,
        max: 20,
        step: 0.1,
        defaultValue: 5,
    },
    focal: {
        type: ControlType.Number,
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 2,
    },
    twinkle: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.35,
    },
    trail: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.75,
    },
    size: {
        type: ControlType.Number,
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 2,
    },
    fadeInRange: {
        type: ControlType.Number,
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
    },
    reverseFly: { type: ControlType.Boolean, defaultValue: true },
    followCursor: { type: ControlType.Boolean, defaultValue: false },
    stopInEditor: { type: ControlType.Boolean, defaultValue: true },
    background: { type: ControlType.Color, defaultValue: "#000000" },
    starColor: { type: ControlType.Color, defaultValue: "#ffffff" },
})
