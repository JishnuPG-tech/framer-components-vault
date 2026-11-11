import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface PixelRevealProps {
    color: string
    cellSize: number
    duration: number
    delay: number
    pattern: "diagonal" | "center" | "random"
    image?: ImageValue
    positionX: number
    positionY: number
    side: "all" | "right" | "left" | "top" | "bottom"
    density: number
    hoverRadius: number
    regrow: number
    drift: boolean
    overlayColor: string
    overlayOpacity: number
    overlayFade: number
    onComplete?: () => void
    style?: CSSProperties
}

/**
 * Pixel Reveal: a solid color layer that breaks into pixels and reveals the
 * image underneath. Give it the same image and each pixel passes through the
 * photo's own color (mosaic) before disappearing. When the reveal ends, a few
 * pixels stay behind; the cursor pushes them away and they come back on their own.
 * Includes a configurable color/opacity overlay below the pixels.
 * On the Framer canvas the pixels are not drawn, so you can edit what's underneath.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PixelReveal(props: PixelRevealProps) {
    const {
        color = "#7EBFFB",
        cellSize = 20,
        duration = 1.4,
        delay = 0.2,
        pattern = "random",
        image,
        positionX = 50,
        positionY = 50,
        side = "right",
        density = 0.18,
        hoverRadius = 2.5,
        regrow = 1.2,
        drift = false,
        overlayColor = "#000000",
        overlayOpacity = 0.35,
        overlayFade = 0.8,
        onComplete,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const completeRef = useRef(onComplete)
    completeRef.current = onComplete
    const [painted, setPainted] = useState(false)
    const [done, setDone] = useState(false)
    const imageSrc = image?.src

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        let disposed = false
        let cols = 0
        let rows = 0
        let size = cellSize
        let width = 0
        let height = 0
        let t = new Float32Array(0) // threshold at which each pixel disappears
        let level = new Float32Array(0) // final level of leftover pixels (0, 0.45 or 1)
        let cur = new Float32Array(0) // current opacity of leftover pixels
        let clearUntil = new Float64Array(0) // pushed away by the cursor until…
        let mosaic: string[] | null = null
        let img: HTMLImageElement | null = null
        let progress = 0
        let revealed = false
        let raf = 0
        let loopRaf = 0
        let visible = true

        const sampleMosaic = () => {
            mosaic = null
            if (!img || !img.naturalWidth || !cols || !rows) return
            try {
                const iw = img.naturalWidth
                const ih = img.naturalHeight
                const s = Math.max(width / iw, height / ih)
                const ox = (width - iw * s) * (positionX / 100)
                const oy = (height - ih * s) * (positionY / 100)
                const SUB = 4
                const off = document.createElement("canvas")
                off.width = cols * SUB
                off.height = rows * SUB
                const octx = off.getContext("2d", { willReadFrequently: true })
                if (!octx) return
                octx.drawImage(img, -ox / s, -oy / s, (cols * size) / s, (rows * size) / s, 0, 0, off.width, off.height)
                const data = octx.getImageData(0, 0, off.width, off.height).data
                const out: string[] = new Array(cols * rows)
                for (let cy = 0; cy < rows; cy++) {
                    for (let cx = 0; cx < cols; cx++) {
                        let r = 0, g = 0, b = 0
                        for (let y = 0; y < SUB; y++) {
                            for (let x = 0; x < SUB; x++) {
                                const i = ((cy * SUB + y) * off.width + cx * SUB + x) * 4
                                r += data[i]
                                g += data[i + 1]
                                b += data[i + 2]
                            }
                        }
                        const n = SUB * SUB
                        out[cy * cols + cx] = "rgb(" + Math.round(r / n) + "," + Math.round(g / n) + "," + Math.round(b / n) + ")"
                    }
                }
                mosaic = out
            } catch {
                mosaic = null // image without CORS: continue without the mosaic
            }
        }

        const windowSize = () => (mosaic ? 0.32 : 0.12)

        const setup = () => {
            const r = canvas.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            width = r.width
            height = r.height
            canvas.width = Math.max(1, Math.round(width * dpr))
            canvas.height = Math.max(1, Math.round(height * dpr))
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            size = width < 600 ? Math.max(24, cellSize * 0.6) : cellSize
            cols = Math.ceil(width / size)
            rows = Math.ceil(height / size)
            const N = cols * rows
            const W = img ? 0.32 : 0.12
            t = new Float32Array(N)
            level = new Float32Array(N)
            cur = new Float32Array(N)
            clearUntil = new Float64Array(N)
            const score = new Float32Array(N)
            const fx = positionX / 100
            const fy = positionY / 100
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x
                    const nx = cols > 1 ? x / (cols - 1) : 0
                    const ny = rows > 1 ? y / (rows - 1) : 0
                    let base = Math.random()
                    if (pattern === "diagonal") base = nx * 0.6 + (1 - ny) * 0.4
                    if (pattern === "center") base = Math.min(1, Math.hypot(nx - 0.5, ny - 0.5) / 0.7071)
                    t[i] = W + (base * 0.55 + Math.random() * 0.45) * (1 - W)
                    // Leftovers: away from the focus point and toward the chosen side.
                    const edge = Math.min(1, Math.hypot(nx - fx, (ny - fy) * 0.8) / 0.65)
                    const bias =
                        side === "right" ? nx : side === "left" ? 1 - nx : side === "top" ? 1 - ny : side === "bottom" ? ny : edge * edge
                    score[i] = Math.random() * 0.4 + edge * edge * 0.25 + bias * 0.35
                }
            }
            const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => score[b] - score[a])
            const count = Math.round(N * Math.min(Math.max(density, 0), 0.8))
            for (let k = 0; k < count; k++) level[order[k]] = Math.random() < 0.3 ? 0.45 : 1
            sampleMosaic()
        }

        const drawReveal = () => {
            ctx.clearRect(0, 0, width, height)
            const W = windowSize()
            for (let i = 0; i < t.length; i++) {
                const ti = t[i]
                const x = (i % cols) * size
                const y = Math.floor(i / cols) * size
                if (level[i] > 0) {
                    ctx.globalAlpha = progress >= ti ? level[i] : 1
                    ctx.fillStyle = color
                    ctx.fillRect(x, y, size + 0.5, size + 0.5)
                    continue
                }
                if (progress >= ti) continue
                if (progress <= ti - W) {
                    ctx.globalAlpha = 1
                    ctx.fillStyle = color
                } else if (mosaic) {
                    const k = (progress - (ti - W)) / W
                    ctx.globalAlpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45
                    ctx.fillStyle = mosaic[i]
                } else {
                    ctx.globalAlpha = 0.45
                    ctx.fillStyle = color
                }
                ctx.fillRect(x, y, size + 0.5, size + 0.5)
            }
            ctx.globalAlpha = 1
        }

        // ---- After the reveal: living leftover pixels ----
        let lastX = -1
        let lastY = -1
        let prev = 0
        let driftAcc = 0

        const push = (px: number, py: number) => {
            const cx = Math.floor(px / size)
            const cy = Math.floor(py / size)
            if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return
            const R = Math.max(hoverRadius, 0.5)
            const until = performance.now() + regrow * 1000
            const r0 = Math.ceil(R)
            for (let dy = -r0; dy <= r0; dy++) {
                for (let dx = -r0; dx <= r0; dx++) {
                    const x = cx + dx
                    const y = cy + dy
                    if (x < 0 || y < 0 || x >= cols || y >= rows) continue
                    // Irregular edge: the radius varies slightly per pixel.
                    if (Math.hypot(dx, dy) > R * (0.75 + Math.random() * 0.4)) continue
                    const i = y * cols + x
                    if (level[i] > 0) clearUntil[i] = until
                }
            }
        }

        // Moves a leftover pixel to an empty neighbor: the pattern slowly breathes.
        const driftOne = () => {
            for (let tries = 0; tries < 6; tries++) {
                const i = Math.floor(Math.random() * level.length)
                if (level[i] <= 0) continue
                const x = (i % cols) + Math.round(Math.random() * 2 - 1)
                const y = Math.floor(i / cols) + Math.round(Math.random() * 2 - 1)
                if (x < 0 || y < 0 || x >= cols || y >= rows) continue
                const j = y * cols + x
                if (j === i || level[j] > 0) continue
                level[j] = level[i]
                level[i] = 0
                clearUntil[j] = clearUntil[i]
                return
            }
        }

        const loop = (now: number) => {
            const dt = Math.min((now - prev) / 1000, 0.05)
            prev = now
            ctx.clearRect(0, 0, width, height)
            if (drift) {
                driftAcc += dt
                while (driftAcc > 0.09) {
                    driftAcc -= 0.09
                    driftOne()
                }
            }
            ctx.fillStyle = color
            for (let i = 0; i < cur.length; i++) {
                const target = now < clearUntil[i] ? 0 : level[i]
                const k = target < cur[i] ? 16 : 3.5 // push away fast, return slowly
                cur[i] += (target - cur[i]) * (1 - Math.exp(-dt * k))
                if (cur[i] < 0.01) continue
                ctx.globalAlpha = cur[i]
                ctx.fillRect((i % cols) * size, Math.floor(i / cols) * size, size + 0.5, size + 0.5)
            }
            ctx.globalAlpha = 1
            loopRaf = visible ? requestAnimationFrame(loop) : 0
        }

        const drawStatic = () => {
            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = color
            for (let i = 0; i < level.length; i++) {
                if (level[i] <= 0) continue
                ctx.globalAlpha = level[i]
                ctx.fillRect((i % cols) * size, Math.floor(i / cols) * size, size + 0.5, size + 0.5)
            }
            ctx.globalAlpha = 1
        }

        const wake = () => {
            if (reduced) return drawStatic()
            if (!loopRaf && revealed && visible) {
                prev = performance.now()
                loopRaf = requestAnimationFrame(loop)
            }
        }

        const onMove = (e: PointerEvent) => {
            if (!revealed) return
            const r = canvas.getBoundingClientRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            if (x < 0 || y < 0 || x > r.width || y > r.height) {
                lastX = -1
                return
            }
            if (lastX >= 0) {
                const steps = Math.ceil(Math.hypot(x - lastX, y - lastY) / (size * 0.5))
                for (let s = 1; s <= steps; s++)
                    push(lastX + ((x - lastX) * s) / steps, lastY + ((y - lastY) * s) / steps)
            } else push(x, y)
            lastX = x
            lastY = y
        }

        const end = () => {
            revealed = true
            for (let i = 0; i < cur.length; i++) cur[i] = level[i]
            setDone(true)
            completeRef.current?.()
            wake()
        }

        let reducedTimer = 0
        const begin = () => {
            if (disposed) return
            setup()
            progress = 0
            drawReveal()
            setPainted(true)
            if (reduced) {
                reducedTimer = window.setTimeout(end, delay * 1000)
                return
            }
            const start = performance.now() + delay * 1000
            const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
            const tick = (now: number) => {
                const p = Math.min(Math.max((now - start) / (duration * 1000), 0), 1)
                progress = ease(p)
                drawReveal()
                if (p >= 1) return end()
                raf = requestAnimationFrame(tick)
            }
            raf = requestAnimationFrame(tick)
        }

        // Paint the solid color right away; wait for the image (max 1.2s) for the mosaic.
        setup()
        drawReveal()
        setPainted(true)
        let started = false
        const go = () => {
            if (started || disposed) return
            started = true
            begin()
        }
        if (imageSrc && !reduced) {
            img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = go
            img.onerror = () => {
                img = null
                go()
            }
            img.src = imageSrc
        } else go()
        const fallback = window.setTimeout(go, 1200)

        // Pause the animation when off-screen or when the tab is hidden.
        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting && !document.hidden
            if (visible) wake()
        })
        io.observe(canvas)
        const onVis = () => {
            visible = !document.hidden
            if (visible) wake()
        }
        document.addEventListener("visibilitychange", onVis)

        const onResize = () => {
            setup()
            if (!revealed) drawReveal()
            else {
                for (let i = 0; i < cur.length; i++) cur[i] = level[i]
                wake()
            }
        }
        window.addEventListener("resize", onResize)
        if (!reduced) window.addEventListener("pointermove", onMove, { passive: true })

        return () => {
            disposed = true
            window.clearTimeout(fallback)
            window.clearTimeout(reducedTimer)
            cancelAnimationFrame(raf)
            cancelAnimationFrame(loopRaf)
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            window.removeEventListener("resize", onResize)
            window.removeEventListener("pointermove", onMove)
        }
    }, [isStatic, color, cellSize, duration, delay, pattern, imageSrc, positionX, positionY, side, density, hoverRadius, regrow, drift])

    const overlay = (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: overlayColor,
                // On the canvas the overlay shows its final value; on the site it fades in after the reveal.
                opacity: isStatic || done ? overlayOpacity : 0,
                transition: `opacity ${overlayFade}s cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
        />
    )

    if (isStatic) {
        return (
            <div style={{ ...style, position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
                {overlay}
            </div>
        )
    }

    return (
        <div
            aria-hidden
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                // Solid from the first render (SSR) so the image never shows too early.
                background: painted ? "transparent" : color,
            }}
        >
            {overlay}
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
            />
        </div>
    )
}

addPropertyControls(PixelReveal, {
    color: { type: ControlType.Color, title: "Color", defaultValue: "#7EBFFB" },
    cellSize: { type: ControlType.Number, title: "Pixel Size", defaultValue: 20, min: 16, max: 160, step: 2, unit: "px" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 1.4, min: 0.4, max: 5, step: 0.1, unit: "s" },
    delay: { type: ControlType.Number, title: "Delay", defaultValue: 0.2, min: 0, max: 3, step: 0.1, unit: "s" },
    pattern: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["diagonal", "center", "random"],
        optionTitles: ["Diagonal", "Center", "Random"],
        defaultValue: "random",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Mosaic Image",
        description: "The same image as underneath. Enables the mosaic stage.",
    },
    positionX: { type: ControlType.Number, title: "Focus X", defaultValue: 50, min: 0, max: 100, unit: "%" },
    positionY: {
        type: ControlType.Number,
        title: "Focus Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
        description: "Match the image position. Leftover pixels avoid this point.",
    },
    side: {
        type: ControlType.Enum,
        title: "Side",
        options: ["all", "right", "left", "top", "bottom"],
        optionTitles: ["Edges", "Right", "Left", "Top", "Bottom"],
        defaultValue: "right",
        description: "Where leftover pixels gather, away from your text.",
    },
    density: { type: ControlType.Number, title: "Density", defaultValue: 0.18, min: 0.05, max: 0.6, step: 0.01 },
    hoverRadius: { type: ControlType.Number, title: "Hover Radius", defaultValue: 2.5, min: 0.5, max: 8, step: 0.5 },
    regrow: { type: ControlType.Number, title: "Return After", defaultValue: 1.2, min: 0.2, max: 6, step: 0.1, unit: "s" },
    drift: { type: ControlType.Boolean, title: "Drift", defaultValue: false, description: "Leftover pixels slowly shift around." },
    overlayColor: { type: ControlType.Color, title: "Overlay", defaultValue: "#000000" },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Overlay on the image, below the pixels.",
    },
    overlayFade: { type: ControlType.Number, title: "Fade In", defaultValue: 0.8, min: 0, max: 3, step: 0.1, unit: "s" },
    onComplete: { type: ControlType.EventHandler, title: "On Complete" },
})
