import React, {
    useRef,
    useState,
    useEffect,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type MouseGravity = "attract" | "repel"
type StarsInteractionType = "bounce" | "merge"

type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    baseOpacity: number
    mass: number
    glowMultiplier?: number
    glowVelocity?: number
    life?: number
    isExplosion?: boolean
    trails?: { x: number; y: number; age: number }[]
}

type GravityStarsProps = {
    star: {
        color: string
        count: number
        size: number
        speed: number
        opacity: number
        collision: boolean
        behaviour: StarsInteractionType
        glow: number
        emitter: boolean
        trails: boolean
        trailDuration: number
    }
    mouseInfluence: number
    mouseGravity: MouseGravity
    gravityStrength: number
    backgroundColor: string
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GravityStars(props: GravityStarsProps) {
    const {
        star = {
            color: "#FFFFFF",
            count: 75,
            size: 2,
            speed: 0.3,
            opacity: 0.75,
            collision: false,
            behaviour: "bounce" as StarsInteractionType,
            glow: 15,
            emitter: false,
            trails: false,
            trailDuration: 1.5,
        },
        mouseInfluence = 100,
        mouseGravity = "attract",
        gravityStrength = 75,
        backgroundColor = "#000000",
        style,
    } = props

    const {
        color,
        count,
        size,
        speed,
        opacity,
        collision,
        behaviour,
        glow,
        emitter,
        trails,
        trailDuration,
    } = star

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animRef = useRef<number | null>(null)
    const starsRef = useRef<Particle[]>([])
    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const [dpr, setDpr] = useState(1)
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
    const lastFrameTimeRef = useRef<number | null>(null)

    const isStatic = useIsStaticRenderer()
    const [isTouchDevice, setIsTouchDevice] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const hasTouch =
            "ontouchstart" in window ||
            (navigator.maxTouchPoints != null &&
                navigator.maxTouchPoints > 0) ||
            (navigator as any).msMaxTouchPoints > 0
        setIsTouchDevice(hasTouch)
    }, [])

    const initStars = useCallback(
        (w: number, h: number) => {
            starsRef.current = Array.from({ length: count }).map(() => {
                const angle = Math.random() * Math.PI * 2
                const velocity = speed * (0.5 + Math.random() * 0.5)
                return {
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    size: Math.random() * size + 1,
                    opacity: opacity,
                    baseOpacity: opacity,
                    mass: Math.random() * 0.5 + 0.5,
                    glowMultiplier: 1,
                    glowVelocity: 0,
                    life: undefined,
                    isExplosion: false,
                }
            })
        },
        [count, speed, opacity, size]
    )

    const redistributeStars = useCallback((w: number, h: number) => {
        starsRef.current.forEach((p) => {
            p.x = Math.random() * w
            p.y = Math.random() * h
        })
    }, [])

    const resizeCanvas = useCallback(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        const rect = container.getBoundingClientRect()
        const nextDpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
        setDpr(nextDpr)
        const backingWidth = Math.max(1, Math.floor(rect.width * nextDpr))
        const backingHeight = Math.max(1, Math.floor(rect.height * nextDpr))
        canvas.width = backingWidth
        canvas.height = backingHeight
        setCanvasSize({ width: backingWidth, height: backingHeight })
        if (
            starsRef.current.length === 0 ||
            starsRef.current.length !== count
        ) {
            initStars(backingWidth, backingHeight)
        } else {
            redistributeStars(backingWidth, backingHeight)
        }
    }, [initStars, redistributeStars, count])

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === "touch") return
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height

            mouseRef.current = {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            }
        },
        []
    )

    const updateStars = useCallback(
        (deltaSeconds: number) => {
            const canvas = canvasRef.current
            const w = canvas?.width || canvasSize.width
            const h = canvas?.height || canvasSize.height
            const mouse = mouseRef.current

            const mouseActive = !isTouchDevice

            for (let i = 0; i < starsRef.current.length; i++) {
                const p = starsRef.current[i]

                if (mouseActive) {
                    const dx = mouse.x - p.x
                    const dy = mouse.y - p.y
                    const dist = Math.hypot(dx, dy)

                    if (dist < mouseInfluence && dist > 0) {
                        const force = (mouseInfluence - dist) / mouseInfluence
                        const nx = dx / dist
                        const ny = dy / dist
                        const g = force * (gravityStrength * 0.001)

                        if (mouseGravity === "attract") {
                            p.vx += nx * g
                            p.vy += ny * g
                        } else if (mouseGravity === "repel") {
                            p.vx -= nx * g
                            p.vy -= ny * g
                        }

                        const targetOpacity = Math.min(
                            1,
                            p.baseOpacity + force * 0.4
                        )
                        const activationEase = 0.18
                        p.opacity =
                            p.opacity +
                            (targetOpacity - p.opacity) * activationEase

                        const targetGlow = 1 + force * 2
                        const currentGlow = p.glowMultiplier || 1
                        const ease = 0.15
                        p.glowMultiplier =
                            currentGlow + (targetGlow - currentGlow) * ease
                    } else {
                        const targetOpacity = Math.max(
                            p.baseOpacity * 0.3,
                            p.opacity - 0.02
                        )
                        const decayEase = 0.12
                        p.opacity =
                            p.opacity + (targetOpacity - p.opacity) * decayEase

                        const targetGlow = 1
                        const currentGlow = p.glowMultiplier || 1
                        const ease = 0.08
                        p.glowMultiplier = Math.max(
                            1,
                            currentGlow + (targetGlow - currentGlow) * ease
                        )
                    }
                } else {
                    const targetOpacity = p.baseOpacity
                    const decayEase = 0.1
                    p.opacity =
                        p.opacity + (targetOpacity - p.opacity) * decayEase

                    const targetGlow = 1
                    const currentGlow = p.glowMultiplier || 1
                    const ease = 0.08
                    p.glowMultiplier =
                        currentGlow + (targetGlow - currentGlow) * ease
                }

                if (collision) {
                    for (let j = i + 1; j < starsRef.current.length; j++) {
                        const o = starsRef.current[j]
                        const dx2 = o.x - p.x
                        const dy2 = o.y - p.y
                        const d = Math.hypot(dx2, dy2)
                        const minD = p.size + o.size + 5
                        if (d < minD && d > 0) {
                            if (behaviour === "bounce") {
                                const nx = dx2 / d
                                const ny = dy2 / d
                                const rvx = p.vx - o.vx
                                const rvy = p.vy - o.vy
                                const speed = rvx * nx + rvy * ny
                                if (speed < 0) continue
                                const impulse = (2 * speed) / (p.mass + o.mass)
                                p.vx -= impulse * o.mass * nx
                                p.vy -= impulse * o.mass * ny
                                o.vx += impulse * p.mass * nx
                                o.vy += impulse * p.mass * ny
                                const overlap = minD - d
                                const sx = nx * overlap * 0.5
                                const sy = ny * overlap * 0.5
                                p.x -= sx
                                p.y -= sy
                                o.x += sx
                                o.y += sy
                            } else {
                                // Merge behaviour: combine two stars into one
                                const totalMass = p.mass + o.mass
                                if (totalMass > 0) {
                                    // New position is mass-weighted average
                                    const newX =
                                        (p.x * p.mass + o.x * o.mass) /
                                        totalMass
                                    const newY =
                                        (p.y * p.mass + o.y * o.mass) /
                                        totalMass

                                    // New velocity conserves momentum
                                    const newVx =
                                        (p.vx * p.mass + o.vx * o.mass) /
                                        totalMass
                                    const newVy =
                                        (p.vy * p.mass + o.vy * o.mass) /
                                        totalMass

                                    // Size grows with combined area (approximation)
                                    const newSize = Math.sqrt(
                                        p.size * p.size + o.size * o.size
                                    )

                                    p.x = newX
                                    p.y = newY
                                    p.vx = newVx
                                    p.vy = newVy
                                    p.size = newSize
                                    p.mass = totalMass
                                    p.baseOpacity = Math.max(
                                        p.baseOpacity,
                                        o.baseOpacity
                                    )
                                    p.opacity = Math.max(p.opacity, o.opacity)
                                    p.glowMultiplier =
                                        Math.max(
                                            p.glowMultiplier || 1,
                                            o.glowMultiplier || 1
                                        ) + 0.3

                                    // Effectively remove the other star
                                    o.size = 0
                                    o.opacity = 0
                                    o.mass = 0
                                    o.vx = 0
                                    o.vy = 0
                                    o.life = 0
                                }
                            }
                        }
                    }
                }

                // Trail history per star
                if (trails) {
                    if (!p.trails) p.trails = []
                    p.trails.push({ x: p.x, y: p.y, age: 0 })
                    const maxTrailAge = Math.max(0.1, trailDuration)
                    p.trails = p.trails
                        .map((t) => ({ ...t, age: t.age + deltaSeconds }))
                        .filter((t) => t.age <= maxTrailAge)
                } else if (p.trails) {
                    // Clear any existing trails if effect is turned off
                    p.trails = undefined
                }

                p.x += p.vx
                p.y += p.vy

                p.vx += (Math.random() - 0.5) * 0.001
                p.vy += (Math.random() - 0.5) * 0.001

                p.vx *= 0.999
                p.vy *= 0.999

                if (p.x < 0) p.x = w
                if (p.x > w) p.x = 0
                if (p.y < 0) p.y = h
                if (p.y > h) p.y = 0

                if (typeof p.life === "number") {
                    p.life -= 1
                    if (p.life < 0) {
                        p.opacity = 0
                        p.size = 0
                    }
                }
            }

            // Remove fully faded or inactive particles
            starsRef.current = starsRef.current.filter(
                (p) => p.size > 0 && p.opacity > 0.01
            )
        },
        [
            canvasSize.width,
            canvasSize.height,
            mouseInfluence,
            mouseGravity,
            gravityStrength,
            collision,
            behaviour,
            opacity,
            speed,
            trails,
            trailDuration,
            isTouchDevice,
        ]
    )

    const drawStars = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            const drawColor = color || "#ffffff"

            // Draw trails first so stars appear on top
            if (trails) {
                for (const p of starsRef.current) {
                    if (!p.trails) continue
                    for (const t of p.trails) {
                        const lifeRatio = Math.max(
                            0,
                            1 - t.age / Math.max(0.1, trailDuration)
                        )
                        if (lifeRatio <= 0) continue
                        ctx.save()
                        ctx.globalAlpha = p.opacity * lifeRatio * 0.6
                        ctx.fillStyle = drawColor
                        ctx.beginPath()
                        ctx.arc(t.x, t.y, p.size / 1.5, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.restore()
                    }
                }
            }

            for (const p of starsRef.current) {
                ctx.save()
                ctx.shadowColor = drawColor
                const baseGlow = trails ? 0 : glow * (p.glowMultiplier || 1) * 2
                ctx.shadowBlur = baseGlow
                ctx.globalAlpha = p.opacity
                ctx.fillStyle = drawColor
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            }
        },
        [backgroundColor, color, trails, trailDuration, glow]
    )

    const animate = useCallback(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const now = window.performance ? window.performance.now() : Date.now()
        const last = lastFrameTimeRef.current
        const deltaSeconds = last != null ? (now - last) / 1000 : 1 / 60
        lastFrameTimeRef.current = now

        updateStars(deltaSeconds)
        drawStars(ctx)
        animRef.current = window.requestAnimationFrame(animate)
    }, [updateStars, drawStars])

    useEffect(() => {
        if (typeof window === "undefined") return

        // Always size the canvas once – both in static and live mode
        resizeCanvas()

        // In static mode we stop here: no ResizeObserver, no window listeners
        if (isStatic) return

        const container = containerRef.current
        const ResizeObs =
            typeof ResizeObserver !== "undefined" ? ResizeObserver : null
        const ro = ResizeObs ? new ResizeObs(() => resizeCanvas()) : null

        if (container && ro) ro.observe(container)

        const onResize = () => resizeCanvas()
        window.addEventListener("resize", onResize)

        return () => {
            window.removeEventListener("resize", onResize)
            if (ro && container) ro.disconnect()
        }
    }, [resizeCanvas, isStatic])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const logicalWidth = canvas.width
        const logicalHeight = canvas.height

        if (
            starsRef.current.length === 0 ||
            starsRef.current.length !== count
        ) {
            initStars(logicalWidth, logicalHeight)
        }

        // Update live properties
        starsRef.current.forEach((p) => {
            p.baseOpacity = opacity
        })

        if (isStatic) {
            // Static snapshot: use existing logical canvas size, create stars if needed, draw once
            if (
                starsRef.current.length === 0 ||
                starsRef.current.length !== count
            ) {
                initStars(logicalWidth, logicalHeight)
            }

            // Ensure stars are fully visible in static mode
            starsRef.current.forEach((p) => {
                p.opacity = p.baseOpacity
                p.glowMultiplier = 1 + glow * 0.05
            })

            drawStars(ctx)
            return
        }

        if (typeof window === "undefined") return

        // Live mode: start animation loop
        if (animRef.current) {
            window.cancelAnimationFrame(animRef.current)
            animRef.current = null
        }
        lastFrameTimeRef.current = null
        animRef.current = window.requestAnimationFrame(animate)

        return () => {
            if (animRef.current) {
                window.cancelAnimationFrame(animRef.current)
                animRef.current = null
            }
            lastFrameTimeRef.current = null
        }
    }, [
        animate,
        canvasSize.width,
        canvasSize.height,
        initStars,
        redistributeStars,
        drawStars,
        isStatic,
        dpr,
        // you can keep these if you want static redraw on change:
        trails,
        trailDuration,
        speed,
        color,
        count,
        size,
        opacity,
        collision,
        behaviour,
        glow,
        emitter,
        mouseInfluence,
        mouseGravity,
        gravityStrength,
        backgroundColor,
    ])

    return (
        <div
            ref={containerRef}
            data-slot="gravity-stars-background"
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
            }}
            onPointerMove={handlePointerMove}
            onPointerDown={(e) => {
                if (e.pointerType === "touch") return
                if (!emitter) return
                const canvas = canvasRef.current
                if (!canvas) return
                const rect = canvas.getBoundingClientRect()
                const scaleX = canvas.width / rect.width
                const scaleY = canvas.height / rect.height
                const x = (e.clientX - rect.left) * scaleX
                const y = (e.clientY - rect.top) * scaleY
                const baseCount = Math.max(
                    3,
                    Math.min(10, Math.round(count / 20))
                )
                for (let i = 0; i < baseCount; i++) {
                    const angle = Math.random() * Math.PI * 2
                    const vel = speed * (2 + Math.random() * 3)
                    starsRef.current.push({
                        x,
                        y,
                        vx: Math.cos(angle) * vel,
                        vy: Math.sin(angle) * vel,
                        size: Math.random() * size + 1,
                        opacity,
                        baseOpacity: opacity,
                        mass: Math.random() * 0.5 + 0.5,
                        glowMultiplier: 1.2,
                        glowVelocity: 0,
                        life: undefined,
                        isExplosion: false,
                    })
                }
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}

GravityStars.displayName = "Gravity Stars"

addPropertyControls(GravityStars, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    star: {
        type: ControlType.Object,
        title: "Star",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            count: {
                type: ControlType.Number,
                title: "Count",
                defaultValue: 75,
                min: 10,
                max: 500,
                step: 5,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 2,
                min: 0.5,
                max: 6,
                step: 0.5,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.3,
                min: 0.1,
                max: 1,
                step: 0.1,
            },
            emitter: {
                type: ControlType.Boolean,
                title: "Emitter",
                description: "Each mouse click will spawn new stars",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.75,
                min: 0.1,
                max: 1,
                step: 0.05,
            },
            collision: {
                type: ControlType.Boolean,
                title: "Collision",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            behaviour: {
                type: ControlType.Enum,
                title: "Behaviour",
                options: ["bounce", "merge"],
                optionTitles: ["Bounce", "Merge"],
                defaultValue: "bounce",
                displaySegmentedControl: true,
                hidden: (p) => !p.collision,
            },
            trails: {
                type: ControlType.Boolean,
                title: "Trail",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            trailDuration: {
                type: ControlType.Number,
                title: "Trail Time",
                defaultValue: 1.5,
                min: 0.1,
                max: 5,
                step: 0.1,
                hidden: (p) => !p.trails,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                defaultValue: 15,
                min: 0,
                max: 40,
                step: 1,
            },
        },
        defaultValue: {
            color: "#FFFFFF",
            count: 75,
            size: 2,
            speed: 0.3,
            opacity: 0.75,
            collision: false,
            behaviour: "bounce",
            glow: 15,
            emitter: false,
            trails: false,
            trailDuration: 1.5,
        },
    },
    mouseInfluence: {
        type: ControlType.Number,
        title: "Mouse Radius",
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 10,
    },
    mouseGravity: {
        type: ControlType.Enum,
        title: "Gravity",
        options: ["attract", "repel"],
        optionTitles: ["Attract", "Repel"],
        defaultValue: "attract",
        displaySegmentedControl: true,
    },
    gravityStrength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 75,
        min: 10,
        max: 200,
        step: 5,
        description:
            "[Click here](https://tinyurl.com/avirallakhanpaul) to get more exciting components!",
    },
})
