import { useEffect, useRef, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Pointer {
    x?: number
    y?: number
}

interface Particle {
    ox: number
    oy: number
    cx: number
    cy: number
    or: number
    cr: number
    pv: number
    ov: number
    f: number
    rgb: number[]
    draw: () => void
    move: (interactionRadius: number, hasPointer: boolean) => boolean
}

interface TextBox {
    str: string
    x?: number
    y?: number
    w?: number
    h?: number
}

interface Props {
    text: string
    color1: string
    color2: string
    color3: string
    color4: string
    animationForce: number
    particleDensity: number
    style?: React.CSSProperties
}

/**
 * TextParticleOnHover
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 300
 */
export default function TextParticleOnHover(props: Props) {
    const {
        text = "HOVER ME",
        color1 = "#ff6b6b",
        color2 = "#feca57",
        color3 = "#48dbfb",
        color4 = "#1dd1a1",
        animationForce = 80,
        particleDensity = 4,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const particlesRef = useRef<Particle[]>([])
    const pointerRef = useRef<Pointer>({})
    const hasPointerRef = useRef<boolean>(false)
    const interactionRadiusRef = useRef<number>(100)
    const textBoxRef = useRef<TextBox>({ str: text })
    const isInitializedRef = useRef<boolean>(false)

    const rand = (max = 1, min = 0, dec = 0): number => {
        return +(min + Math.random() * (max - min)).toFixed(dec)
    }

    const hexToRgb = (hex: string): number[] => {
        const clean = hex.replace("#", "")
        const r = parseInt(clean.substring(0, 2), 16)
        const g = parseInt(clean.substring(2, 4), 16)
        const b = parseInt(clean.substring(4, 6), 16)
        return [isNaN(r) ? 128 : r, isNaN(g) ? 128 : g, isNaN(b) ? 128 : b]
    }

    const createParticle = (
        x: number,
        y: number,
        force: number,
        rgb: number[] = [rand(128), rand(128), rand(128)]
    ): Particle => {
        const or = rand(5, 1)
        const particle: Particle = {
            ox: x,
            oy: y,
            cx: x,
            cy: y,
            or,
            cr: or,
            pv: 0,
            ov: 0,
            f: rand(force + 15, force - 15),
            rgb: rgb.map((c) => Math.max(0, Math.min(255, c + rand(13, -13)))),
            draw() {
                const ctx = ctxRef.current
                if (!ctx) return
                ctx.fillStyle = `rgb(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]})`
                ctx.beginPath()
                ctx.arc(
                    this.cx,
                    this.cy,
                    Math.max(0.5, this.cr),
                    0,
                    2 * Math.PI
                )
                ctx.fill()
            },
            move(interactionRadius: number, hasPointer: boolean) {
                let moved = false

                if (
                    hasPointer &&
                    pointerRef.current.x !== undefined &&
                    pointerRef.current.y !== undefined
                ) {
                    const dx = this.cx - pointerRef.current.x
                    const dy = this.cy - pointerRef.current.y
                    const dist = Math.hypot(dx, dy)
                    if (dist < interactionRadius && dist > 0) {
                        const force = Math.min(
                            this.f,
                            ((interactionRadius - dist) / dist) * 2
                        )
                        this.cx += (dx / dist) * force
                        this.cy += (dy / dist) * force
                        moved = true
                    }
                }

                const odx = this.ox - this.cx
                const ody = this.oy - this.cy
                const od = Math.hypot(odx, ody)

                if (od > 1) {
                    const restore = Math.min(od * 0.1, 3)
                    this.cx += (odx / od) * restore
                    this.cy += (ody / od) * restore
                    moved = true
                }

                this.draw()
                return moved
            },
        }
        return particle
    }

    const dottify = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            canvas: HTMLCanvasElement,
            density: number,
            force: number
        ) => {
            const textBox = textBoxRef.current
            if (
                textBox.x === undefined ||
                textBox.y === undefined ||
                !textBox.w ||
                !textBox.h
            )
                return

            // Clamp getImageData to canvas bounds
            const sx = Math.max(0, Math.floor(textBox.x))
            const sy = Math.max(0, Math.floor(textBox.y))
            const sw = Math.min(textBox.w, canvas.width - sx)
            const sh = Math.min(textBox.h, canvas.height - sy)

            if (sw <= 0 || sh <= 0) return

            const data = ctx.getImageData(sx, sy, sw, sh).data
            const pixels: { x: number; y: number; rgb: number[] }[] = []

            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4
                const x = pixelIndex % sw
                const y = Math.floor(pixelIndex / sw)
                if (data[i + 3] > 0 && x % density === 0 && y % density === 0) {
                    pixels.push({
                        x,
                        y,
                        rgb: [data[i], data[i + 1], data[i + 2]],
                    })
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const newParticles: Particle[] = []
            pixels.forEach((p) => {
                const particle = createParticle(
                    sx + p.x,
                    sy + p.y,
                    force,
                    p.rgb
                )
                particle.draw()
                newParticles.push(particle)
            })

            particlesRef.current = newParticles
        },
        []
    )

    const write = useCallback(
        (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
            const textBox = textBoxRef.current
            textBox.str = text

            // Calculate font size based on canvas width and text length
            const maxFontSize = Math.floor(canvas.height * 0.6)
            textBox.h = Math.min(
                maxFontSize,
                Math.floor(canvas.width / Math.max(textBox.str.length, 1))
            )

            if (textBox.h < 8) return // Too small to render

            interactionRadiusRef.current = Math.max(50, textBox.h * 1.5)

            ctx.font = `900 ${textBox.h}px Verdana, sans-serif`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"

            textBox.w = Math.round(ctx.measureText(textBox.str).width)
            textBox.x = Math.max(0, 0.5 * (canvas.width - textBox.w))
            textBox.y = Math.max(0, 0.5 * (canvas.height - textBox.h))

            const colorHexes = [color1, color2, color3, color4]
            const gradient = ctx.createLinearGradient(
                textBox.x,
                textBox.y,
                textBox.x + textBox.w,
                textBox.y + textBox.h
            )
            const N = colorHexes.length - 1
            colorHexes.forEach((hex, i) => {
                gradient.addColorStop(i / N, hex)
            })
            ctx.fillStyle = gradient

            ctx.fillText(textBox.str, 0.5 * canvas.width, 0.5 * canvas.height)
            dottify(ctx, canvas, particleDensity, animationForce)
        },
        [
            text,
            color1,
            color2,
            color3,
            color4,
            particleDensity,
            animationForce,
            dottify,
        ]
    )

    const animate = useCallback(() => {
        const ctx = ctxRef.current
        const canvas = canvasRef.current
        if (!ctx || !canvas) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        let anyMoved = false
        particlesRef.current.forEach((p) => {
            const moved = p.move(
                interactionRadiusRef.current,
                hasPointerRef.current
            )
            if (moved) anyMoved = true
        })

        // Keep animating while pointer is active or particles are still moving
        if (hasPointerRef.current || anyMoved) {
            animationIdRef.current = requestAnimationFrame(animate)
        } else {
            animationIdRef.current = null
        }
    }, [])

    const startAnimation = useCallback(() => {
        if (!animationIdRef.current) {
            animationIdRef.current = requestAnimationFrame(animate)
        }
    }, [animate])

    const getDimensions = useCallback((): { w: number; h: number } => {
        const container = containerRef.current
        if (!container) return { w: 0, h: 0 }

        // Try multiple measurement strategies for Framer compatibility
        const rect = container.getBoundingClientRect()
        let w = Math.round(rect.width)
        let h = Math.round(rect.height)

        // Fallback: offsetWidth/offsetHeight
        if (!w || !h) {
            w = container.offsetWidth || 0
            h = container.offsetHeight || 0
        }

        // Fallback: clientWidth/clientHeight
        if (!w || !h) {
            w = container.clientWidth || 0
            h = container.clientHeight || 0
        }

        // Fallback: walk up parent tree to find dimensions
        if (!w || !h) {
            let parent = container.parentElement
            let depth = 0
            while (parent && (!w || !h) && depth < 10) {
                const pRect = parent.getBoundingClientRect()
                w = w || Math.round(pRect.width)
                h = h || Math.round(pRect.height)
                if (!w) w = parent.offsetWidth || parent.clientWidth || 0
                if (!h) h = parent.offsetHeight || parent.clientHeight || 0
                parent = parent.parentElement
                depth++
            }
        }

        // Last resort: hard fallback
        if (!w) w = 600
        if (!h) h = 300

        return { w, h }
    }, [])

    const initialize = useCallback(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!canvas || !container) return

        const { w, h } = getDimensions()

        if (w < 10 || h < 10) return // Still not laid out

        // Cancel any running animation
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current)
            animationIdRef.current = null
        }

        // Set canvas pixel dimensions to match container
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        ctxRef.current = ctx
        ctx.clearRect(0, 0, w, h)

        write(ctx, canvas)
        isInitializedRef.current = true
    }, [write, getDimensions])

    // Main effect: initialize + observe resize + polling retry
    useEffect(() => {
        let retryCount = 0
        const maxRetries = 20
        let retryTimer: ReturnType<typeof setTimeout> | null = null

        const tryInit = () => {
            initialize()

            // If particles didn't render, keep retrying with backoff
            if (particlesRef.current.length === 0 && retryCount < maxRetries) {
                retryCount++
                const delay = Math.min(100 * retryCount, 500)
                retryTimer = setTimeout(tryInit, delay)
            }
        }

        // Initial attempts: immediate + small delay + medium delay
        tryInit()
        const t1 = setTimeout(tryInit, 50)
        const t2 = setTimeout(tryInit, 200)
        const t3 = setTimeout(tryInit, 500)

        const observer = new ResizeObserver(() => {
            retryCount = maxRetries // Stop polling once resize fires
            initialize()
        })

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        // Also listen for window load in case we're in an iframe
        const onLoad = () => tryInit()
        window.addEventListener("load", onLoad)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            if (retryTimer) clearTimeout(retryTimer)
            window.removeEventListener("load", onLoad)
            observer.disconnect()
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
                animationIdRef.current = null
            }
        }
    }, [initialize])

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) return

            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            pointerRef.current.x = (e.clientX - rect.left) * scaleX
            pointerRef.current.y = (e.clientY - rect.top) * scaleY
            hasPointerRef.current = true

            startAnimation()
        },
        [startAnimation]
    )

    const handlePointerLeave = useCallback(() => {
        hasPointerRef.current = false
        pointerRef.current.x = undefined
        pointerRef.current.y = undefined

        // Start animation so particles return to origin
        startAnimation()
    }, [startAnimation])

    const handlePointerEnter = useCallback(() => {
        hasPointerRef.current = true
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 600,
                minHeight: 200,
                position: "relative",
                overflow: "hidden",
                cursor: "none",
                ...style,
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerEnter={handlePointerEnter}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />
        </div>
    )
}

addPropertyControls(TextParticleOnHover, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HOVER ME",
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#ff6b6b",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#feca57",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#48dbfb",
    },
    color4: {
        type: ControlType.Color,
        title: "Color 4",
        defaultValue: "#1dd1a1",
    },
    animationForce: {
        type: ControlType.Number,
        title: "Animation Force",
        defaultValue: 80,
        min: 10,
        max: 200,
        step: 5,
    },
    particleDensity: {
        type: ControlType.Number,
        title: "Particle Density",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
    },
})
