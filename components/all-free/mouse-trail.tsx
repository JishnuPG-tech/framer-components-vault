import { useEffect, useRef, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

/**
 * MouseTrail
 * Interactive mouse trail effect with multiple visual styles.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

// --- Types ---

interface TrailPoint {
    x: number
    y: number
    life: number
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    size: number
}

type Blend = GlobalCompositeOperation

interface Props {
    variant: "line" | "dots" | "particles" | "pixel"
    fillType: "solid" | "gradient"
    trailColor: string
    trailColorEnd: string
    trailLength: number
    lineWidth: number
    fadeOut: boolean
    smoothing: number
    dotSize: number
    dotSpacing: number
    particleCount: number
    particleSize: number
    spreadAngle: number
    drift: number
    pixelSize: number
    snapToGrid: boolean
    blendMode: Blend
    autoFade: boolean
    fadeDuration: number
    playInCanvas: boolean
    style?: CSSProperties
}

// --- Helpers ---

function parseColor(col: string): { r: number; g: number; b: number } {
    if (col.startsWith("#")) {
        let hex = col.slice(1)
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        }
    } else if (col.startsWith("rgb")) {
        const m = col.match(/\d+/g)
        return m ? { r: +m[0], g: +m[1], b: +m[2] } : { r: 0, g: 0, b: 0 }
    }
    return { r: 0, g: 0, b: 0 }
}

function resolveColor(color: string, container: HTMLElement): string {
    if (color.startsWith("var(")) {
        try {
            container.style.color = color
            const computed = getComputedStyle(container).color
            container.style.color = ""
            return computed || color
        } catch {
            return color
        }
    }
    return color
}

export default function MouseTrail(props: Props) {
    const {
        variant = "line",
        fillType = "solid",
        trailColor = "#0099FF",
        trailColorEnd = "#FF00FF",
        trailLength = 20,
        lineWidth = 3,
        fadeOut = true,
        smoothing = 0.3,
        dotSize = 6,
        dotSpacing = 10,
        particleCount = 6,
        particleSize = 3,
        spreadAngle = 30,
        drift = 0.4,
        pixelSize = 6,
        snapToGrid = true,
        blendMode = "source-over",
        autoFade = true,
        fadeDuration = 2.0,
        playInCanvas = true,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const trailPointsRef = useRef<TrailPoint[]>([])
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number>()
    const timeRef = useRef<number>(performance.now())
    const resolvedColorsRef = useRef({ start: "#0099FF", end: "#FF00FF" })

    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { amount: 0.1 })

    const shouldAnimate = isStatic ? playInCanvas : isInView
    const shouldHide = isStatic && !playInCanvas

    // Store props in ref so animation loop stays stable
    const propsRef = useRef(props)
    useEffect(() => {
        propsRef.current = props
    }, [props])

    // Resolve Framer CSS var tokens
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        resolvedColorsRef.current.start = resolveColor(trailColor, container)
        resolvedColorsRef.current.end = resolveColor(trailColorEnd, container)
    }, [trailColor, trailColorEnd])

    // Reset particles on variant change
    useEffect(() => {
        if (variant !== "particles") particlesRef.current = []
    }, [variant])

    // --- Resize ---
    useEffect(() => {
        if (shouldHide) return
        const canvas = canvasRef.current
        if (!canvas) return

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
        }
        resize()
        window.addEventListener("resize", resize)
        return () => window.removeEventListener("resize", resize)
    }, [shouldHide])

    // --- Pointer events ---
    useEffect(() => {
        if (shouldHide) return
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const handlePointerMove = (e: PointerEvent) => {
            const containerRect = container.getBoundingClientRect()
            if (
                e.clientX >= containerRect.left &&
                e.clientX <= containerRect.right &&
                e.clientY >= containerRect.top &&
                e.clientY <= containerRect.bottom
            ) {
                const canvasRect = canvas.getBoundingClientRect()
                const x = e.clientX - canvasRect.left
                const y = e.clientY - canvasRect.top

                const p = propsRef.current
                const points = trailPointsRef.current
                const last = points[points.length - 1]

                // Debounce dots based on spacing
                if (p.variant === "dots" && last) {
                    const dx = x - last.x
                    const dy = y - last.y
                    if (Math.hypot(dx, dy) < p.dotSpacing) return
                }

                // Smoothing
                const s = Math.max(0.001, 1 - p.smoothing)
                const sx = last ? last.x + (x - last.x) * s : x
                const sy = last ? last.y + (y - last.y) * s : y

                points.push({ x: sx, y: sy, life: 1 })

                // Trim length
                if (points.length > p.trailLength) {
                    points.splice(0, points.length - p.trailLength)
                }

                // Spawn particles
                if (p.variant === "particles" && last) {
                    const dx = sx - last.x
                    const dy = sy - last.y
                    const speed = Math.hypot(dx, dy)

                    if (speed > 2) {
                        const angle = Math.atan2(dy, dx)
                        const spread = (p.spreadAngle * Math.PI) / 180
                        for (let i = 0; i < p.particleCount; i++) {
                            const a = angle + (Math.random() - 0.5) * spread
                            const v = speed * 0.1 + Math.random() * 2
                            particlesRef.current.push({
                                x: sx,
                                y: sy,
                                vx: Math.cos(a) * v,
                                vy: Math.sin(a) * v,
                                life: 0.8 + Math.random() * 0.4,
                                size: p.particleSize + Math.random() * 1.5,
                            })
                        }
                    }
                }
            }
        }

        document.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })

        return () => {
            document.removeEventListener("pointermove", handlePointerMove)
        }
    }, [shouldHide])

    // --- Animation loop (stable — reads props from ref) ---
    useEffect(() => {
        if (!shouldAnimate) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = undefined
            }
            return
        }

        timeRef.current = performance.now()

        const animate = () => {
            const now = performance.now()
            let dt = (now - timeRef.current) / 1000
            dt = Math.max(0, Math.min(dt, 0.05))
            timeRef.current = now

            const canvas = canvasRef.current
            if (!canvas) {
                rafRef.current = requestAnimationFrame(animate)
                return
            }
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                rafRef.current = requestAnimationFrame(animate)
                return
            }

            const p = propsRef.current
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            // Reset transform each frame to avoid compound scaling
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)
            ctx.globalCompositeOperation = p.blendMode
            ctx.clearRect(0, 0, rect.width, rect.height)

            const colors = resolvedColorsRef.current
            const rgbStart = parseColor(colors.start)
            const rgbEnd = parseColor(colors.end)

            const rgba = (a: number, t: number) => {
                if (p.fillType === "gradient") {
                    const r = rgbStart.r + (rgbEnd.r - rgbStart.r) * t
                    const g = rgbStart.g + (rgbEnd.g - rgbStart.g) * t
                    const b = rgbStart.b + (rgbEnd.b - rgbStart.b) * t
                    return `rgba(${r | 0},${g | 0},${b | 0},${Math.max(0, Math.min(1, a))})`
                }
                return `rgba(${rgbStart.r},${rgbStart.g},${rgbStart.b},${Math.max(0, Math.min(1, a))})`
            }

            const points = trailPointsRef.current

            // Age points
            if (p.autoFade && points.length) {
                const decay = dt / Math.max(0.001, p.fadeDuration)
                for (let i = points.length - 1; i >= 0; i--) {
                    points[i].life -= decay
                    if (points[i].life <= 0) points.splice(i, 1)
                }
            }

            if (points.length < 1) {
                // Still update particles even if no trail points
                if (p.variant === "particles") {
                    const particles = particlesRef.current
                    const damping = Math.pow(0.98, dt * 60)
                    const g = p.drift * 60 * 0.001 * dt * 60
                    const decayP = 1.6 * dt
                    for (let i = particles.length - 1; i >= 0; i--) {
                        const pt = particles[i]
                        pt.x += pt.vx * dt * 60
                        pt.y += pt.vy * dt * 60
                        pt.vx *= damping
                        pt.vy = pt.vy * damping + g
                        pt.life -= decayP
                        if (pt.life <= 0) {
                            // Swap-and-pop
                            particles[i] = particles[particles.length - 1]
                            particles.pop()
                        } else {
                            ctx.fillStyle = rgba(pt.life, 1 - pt.life)
                            ctx.beginPath()
                            ctx.arc(
                                pt.x,
                                pt.y,
                                pt.size * pt.life,
                                0,
                                Math.PI * 2
                            )
                            ctx.fill()
                        }
                    }
                }
                rafRef.current = requestAnimationFrame(animate)
                return
            }

            const indexAlpha = (i: number, n: number) => {
                if (!p.fadeOut) return 1
                const t = n <= 1 ? 1 : i / (n - 1)
                return 1 - (1 - t) * (1 - t)
            }

            // --- Render variants ---

            if (p.variant === "dots") {
                for (let i = 0; i < points.length; i++) {
                    const pt = points[i]
                    const t = i / (points.length - 1 || 1)
                    const a =
                        indexAlpha(i, points.length) *
                        (p.autoFade ? pt.life : 1)
                    const r = p.dotSize * (p.fadeOut ? 0.3 + 0.7 * a : 1)

                    ctx.fillStyle = rgba(a, t)
                    ctx.beginPath()
                    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
                    ctx.fill()
                }
            } else if (p.variant === "pixel") {
                for (let i = 0; i < points.length; i++) {
                    let { x, y } = points[i]
                    if (p.snapToGrid) {
                        x = Math.round(x / p.pixelSize) * p.pixelSize
                        y = Math.round(y / p.pixelSize) * p.pixelSize
                    }
                    const t = i / (points.length - 1 || 1)
                    const a =
                        indexAlpha(i, points.length) *
                        (p.autoFade ? points[i].life : 1)
                    const s = p.pixelSize * (p.fadeOut ? 0.6 + 0.4 * a : 1)

                    ctx.fillStyle = rgba(a, t)
                    ctx.fillRect(x - s / 2, y - s / 2, s, s)
                }
            } else if (p.variant === "particles") {
                const particles = particlesRef.current
                const damping = Math.pow(0.98, dt * 60)
                const g = p.drift * 60 * 0.001 * dt * 60
                const decayP = 1.6 * dt

                for (let i = particles.length - 1; i >= 0; i--) {
                    const pt = particles[i]
                    pt.x += pt.vx * dt * 60
                    pt.y += pt.vy * dt * 60
                    pt.vx *= damping
                    pt.vy = pt.vy * damping + g
                    pt.life -= decayP

                    if (pt.life <= 0) {
                        // Swap-and-pop
                        particles[i] = particles[particles.length - 1]
                        particles.pop()
                    } else {
                        ctx.fillStyle = rgba(pt.life, 1 - pt.life)
                        ctx.beginPath()
                        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }

                // Connecting lines
                if (points.length > 1) {
                    for (let i = 1; i < points.length; i++) {
                        const p1 = points[i - 1]
                        const p2 = points[i]
                        const lifeFactor = p.autoFade ? points[i].life : 1
                        const a =
                            0.15 * indexAlpha(i, points.length) * lifeFactor

                        ctx.strokeStyle = rgba(a, i / (points.length - 1 || 1))
                        ctx.lineWidth = Math.max(1, p.lineWidth * 0.5 * a)
                        ctx.beginPath()
                        ctx.moveTo(p1.x, p1.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.stroke()
                    }
                }
            } else {
                // Line variant
                if (points.length < 2) {
                    const pt = points[0]
                    const a = p.autoFade ? pt.life : 1
                    ctx.fillStyle = rgba(a, 0)
                    ctx.beginPath()
                    ctx.arc(
                        pt.x,
                        pt.y,
                        Math.max(1, p.lineWidth / 2),
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                } else {
                    for (let i = 1; i < points.length; i++) {
                        const p1 = points[i - 1]
                        const p2 = points[i]
                        const t = i / (points.length - 1 || 1)
                        const lifeFactor = p.autoFade ? points[i].life : 1
                        const a = indexAlpha(i, points.length) * lifeFactor
                        const widthScale = p.fadeOut ? 0.3 + 0.7 * a : 1

                        ctx.strokeStyle = rgba(a, t)
                        ctx.lineWidth = Math.max(1, p.lineWidth * widthScale)
                        ctx.beginPath()
                        ctx.moveTo(p1.x, p1.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.stroke()
                    }
                }
            }

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [shouldAnimate])

    if (shouldHide) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    visibility: "hidden",
                }}
            />
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
                aria-label="Interactive mouse trail animation"
                role="img"
            />
        </div>
    )
}

addPropertyControls(MouseTrail, {
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["line", "dots", "particles", "pixel"],
        optionTitles: ["Line", "Dots", "Particles", "Pixel"],
        defaultValue: "line",
    },
    fillType: {
        type: ControlType.Enum,
        title: "Fill",
        options: ["solid", "gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "solid",
    },
    trailColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0099FF",
    },
    trailColorEnd: {
        type: ControlType.Color,
        title: "Color End",
        defaultValue: "#FF00FF",
        hidden: (p) => p.fillType !== "gradient",
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 20,
        min: 5,
        max: 120,
        displayStepper: true,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 3,
        min: 1,
        max: 20,
        displayStepper: true,
        hidden: (p) => p.variant === "pixel",
    },
    fadeOut: {
        type: ControlType.Boolean,
        title: "Fade Trail",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoFade: {
        type: ControlType.Boolean,
        title: "Time Fade",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade Duration",
        defaultValue: 2.0,
        min: 0.2,
        max: 10,
        step: 0.1,
        displayStepper: true,
        hidden: (p) => !p.autoFade,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 6,
        min: 2,
        max: 20,
        displayStepper: true,
        hidden: (p) => p.variant !== "dots",
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 10,
        min: 5,
        max: 40,
        displayStepper: true,
        hidden: (p) => p.variant !== "dots",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 6,
        min: 1,
        max: 40,
        displayStepper: true,
        hidden: (p) => p.variant !== "particles",
    },
    particleSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 3,
        min: 1,
        max: 10,
        displayStepper: true,
        hidden: (p) => p.variant !== "particles",
    },
    spreadAngle: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 30,
        min: 0,
        max: 180,
        displayStepper: true,
        hidden: (p) => p.variant !== "particles",
    },
    drift: {
        type: ControlType.Number,
        title: "Drift",
        defaultValue: 0.4,
        min: -2,
        max: 2,
        step: 0.1,
        displayStepper: true,
        hidden: (p) => p.variant !== "particles",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 6,
        min: 2,
        max: 24,
        displayStepper: true,
        hidden: (p) => p.variant !== "pixel",
    },
    snapToGrid: {
        type: ControlType.Boolean,
        title: "Snap Grid",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.variant !== "pixel",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "source-over",
        options: ["source-over", "lighter", "screen"],
        optionTitles: ["Normal", "Lighter", "Screen"],
    },
    playInCanvas: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: false,
        enabledTitle: "Play",
        disabledTitle: "Hide",
    },
})
