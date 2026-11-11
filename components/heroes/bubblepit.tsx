// BubblePit — Framer Code Component

// @framerDisableUnlink
// @framerIntrinsicWidth 600
// @framerIntrinsicHeight 600
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useRef, useState } from "react"
import Matter from "matter-js"

// ─── Texture cache + baker ────────────────────────────────────────────────────

const textureCache = new Map<string, Promise<string>>()

const createGlassyTexture = (url: string, size: number): Promise<string> => {
    const key = `${url}__${size}`
    if (textureCache.has(key)) return textureCache.get(key)!

    const p = new Promise<string>((resolve) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = url

        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext("2d")
            if (!ctx) return resolve(url)

            const cx = size / 2
            const cy = size / 2
            const r = size / 2 - 1

            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.clip()

            const warpScale = 1.18
            const wo = (size * (warpScale - 1)) / 2
            ctx.drawImage(img, -wo, -wo, size * warpScale, size * warpScale)

            const rimGrad = ctx.createRadialGradient(
                cx,
                cy,
                r * 0.75,
                cx,
                cy,
                r
            )
            rimGrad.addColorStop(0, "rgba(0,0,0,0)")
            rimGrad.addColorStop(0.3, "rgba(0,0,0,0.08)")
            rimGrad.addColorStop(0.62, "rgba(0,0,0,0.32)")
            rimGrad.addColorStop(0.85, "rgba(0,0,0,0.62)")
            rimGrad.addColorStop(1, "rgba(0,0,0,0.80)")
            ctx.fillStyle = rimGrad
            ctx.fillRect(0, 0, size, size)
            ctx.restore()

            ctx.save()
            ctx.beginPath()
            ctx.arc(cx, cy, r - Math.max(size * 0.015, 1), 0, Math.PI * 2)
            const ringGrad = ctx.createLinearGradient(
                cx - r * 0.8,
                cy - r * 0.8,
                cx + r * 0.55,
                cy + r * 0.55
            )
            ringGrad.addColorStop(0, "rgba(255,255,255,0.75)")
            ringGrad.addColorStop(0.15, "rgba(225,240,255,0.45)")
            ringGrad.addColorStop(0.35, "rgba(180,215,255,0.14)")
            ringGrad.addColorStop(0.55, "rgba(120,170,230,0.04)")
            ringGrad.addColorStop(0.75, "rgba(160,200,255,0.06)")
            ringGrad.addColorStop(1, "rgba(210,235,255,0.22)")
            ctx.strokeStyle = ringGrad
            ctx.lineWidth = Math.max(size * 0.015, 1)
            ctx.stroke()
            ctx.restore()

            ctx.save()
            const hlX = cx - r * 0.2
            const hlY = cy - r * 0.35
            const hlRx = r * 0.45
            const hlRy = r * 0.24
            const primaryHL = ctx.createRadialGradient(
                hlX,
                hlY,
                0,
                hlX,
                hlY,
                hlRx
            )
            primaryHL.addColorStop(0, "rgba(255,255,255,0.42)")
            primaryHL.addColorStop(0.3, "rgba(255,255,255,0.20)")
            primaryHL.addColorStop(0.6, "rgba(255,255,255,0.05)")
            primaryHL.addColorStop(1, "rgba(255,255,255,0)")
            ctx.beginPath()
            ctx.ellipse(hlX, hlY, hlRx, hlRy, -Math.PI * 0.12, 0, Math.PI * 2)
            ctx.fillStyle = primaryHL
            ctx.fill()
            ctx.restore()

            ctx.save()
            const dotX = cx - r * 0.33
            const dotY = cy - r * 0.46
            const dotR = r * 0.065
            const dotGrad = ctx.createRadialGradient(
                dotX,
                dotY,
                0,
                dotX,
                dotY,
                dotR
            )
            dotGrad.addColorStop(0, "rgba(255,255,255,1.0)")
            dotGrad.addColorStop(0.35, "rgba(255,255,255,0.70)")
            dotGrad.addColorStop(0.75, "rgba(255,255,255,0.12)")
            dotGrad.addColorStop(1, "rgba(255,255,255,0)")
            ctx.beginPath()
            ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
            ctx.fillStyle = dotGrad
            ctx.fill()
            ctx.restore()

            ctx.save()
            const secX = cx + r * 0.36
            const secY = cy + r * 0.42
            const secGrad = ctx.createRadialGradient(
                secX,
                secY,
                0,
                secX,
                secY,
                r * 0.2
            )
            secGrad.addColorStop(0, "rgba(255,255,255,0.16)")
            secGrad.addColorStop(0.6, "rgba(255,255,255,0.05)")
            secGrad.addColorStop(1, "rgba(255,255,255,0)")
            ctx.beginPath()
            ctx.ellipse(
                secX,
                secY,
                r * 0.2,
                r * 0.11,
                Math.PI * 0.25,
                0,
                Math.PI * 2
            )
            ctx.fillStyle = secGrad
            ctx.fill()
            ctx.restore()

            resolve(canvas.toDataURL())
        }

        img.onerror = () => resolve(url)
    })

    textureCache.set(key, p)
    return p
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BubbleImage {
    src: string
}

interface BubblePitProps {
    images: BubbleImage[]
    bubbleCount: number
    restitution: number
    gravity: number
    minRadius: number
    maxRadius: number
    spawnDuration: number
    triggerId: string
    spawnOnClick: boolean
    spawnCount: number
    background: string
    showVignette: boolean
    animationEnabled: boolean
    airPressure: number
    width?: number
    height?: number
    style?: React.CSSProperties
}

/**
 * BubblePit Component
 * @framerDisableUnlink
 *
 * Physics-based bubble pit with glassy image spheres.
 * Bubbles fall, bounce, and react to cursor hover like air pressure.
 *
 * @author Mrframer
 */

export default function BubblePit({
    images = [],
    bubbleCount = 28,
    restitution = 0.8,
    gravity = 1,
    minRadius = 32,
    maxRadius = 56,
    spawnDuration = 4200,
    triggerId = "",
    spawnOnClick = true,
    spawnCount = 3,
    background = "#050505",
    showVignette = true,
    animationEnabled = true,
    airPressure = 0.012,
    style,
}: BubblePitProps) {
    const sceneRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderRef = useRef<Matter.Render | null>(null)
    const runnerRef = useRef<Matter.Runner | null>(null)
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
    const animEnabledRef = useRef(animationEnabled)
    const spawnRef = useRef({
        minRadius,
        maxRadius,
        restitution,
        bubbleCount,
        spawnDuration,
        spawnCount,
    })

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [srcTextures, setSrcTextures] = useState<string[]>([])
    const [isEngineReady, setIsEngineReady] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    const resolvedSrcs: string[] = images
        .map((img) => (typeof img === "string" ? img : img?.src))
        .filter(Boolean)

    useEffect(() => {
        spawnRef.current = {
            minRadius,
            maxRadius,
            restitution,
            bubbleCount,
            spawnDuration,
            spawnCount,
        }
    }, [
        minRadius,
        maxRadius,
        restitution,
        bubbleCount,
        spawnDuration,
        spawnCount,
    ])

    useEffect(() => {
        animEnabledRef.current = animationEnabled
    }, [animationEnabled])

    // ── Dimensions ───────────────────────────────────────────────────────────
    useEffect(() => {
        const update = () => {
            if (sceneRef.current)
                setDimensions({
                    width: sceneRef.current.clientWidth,
                    height: sceneRef.current.clientHeight,
                })
        }
        update()
        const ro = new ResizeObserver(update)
        if (sceneRef.current) ro.observe(sceneRef.current)
        return () => ro.disconnect()
    }, [])

    // ── Visibility trigger ───────────────────────────────────────────────────
    useEffect(() => {
        const target =
            (triggerId ? document.getElementById(triggerId) : null) ??
            sceneRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(target)
        return () => observer.disconnect()
    }, [triggerId])

    // ── Image srcs ───────────────────────────────────────────────────────────
    useEffect(() => {
        setSrcTextures(resolvedSrcs)
    }, [resolvedSrcs.join(",")])

    // ── Engine ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (
            dimensions.width === 0 ||
            dimensions.height === 0 ||
            !sceneRef.current
        )
            return

        const engine = Matter.Engine.create({ gravity: { x: 0, y: gravity } })
        engineRef.current = engine

        const render = Matter.Render.create({
            element: sceneRef.current,
            engine,
            options: {
                width: dimensions.width,
                height: dimensions.height,
                wireframes: false,
                background: "transparent",
            },
        })
        renderRef.current = render

        // ── FIX: pull canvas out of normal flow so it doesn't push container height
        render.canvas.style.position = "absolute"
        render.canvas.style.top = "0"
        render.canvas.style.left = "0"

        const walls = [
            Matter.Bodies.rectangle(
                dimensions.width / 2,
                dimensions.height + 50,
                dimensions.width,
                100,
                { isStatic: true, render: { visible: false } }
            ),
            Matter.Bodies.rectangle(
                -50,
                dimensions.height / 2,
                100,
                dimensions.height,
                { isStatic: true, render: { visible: false } }
            ),
            Matter.Bodies.rectangle(
                dimensions.width + 50,
                dimensions.height / 2,
                100,
                dimensions.height,
                { isStatic: true, render: { visible: false } }
            ),
        ]
        Matter.Composite.add(engine.world, walls)

        const mouse = Matter.Mouse.create(render.canvas)
        const mc = Matter.MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.2, render: { visible: false } },
        })
        Matter.Composite.add(engine.world, mc)

        const runner = Matter.Runner.create()
        runnerRef.current = runner
        Matter.Runner.run(runner, engine)
        Matter.Render.run(render)

        setIsEngineReady(true)

        const handleClick = (e: { offsetX: number; offsetY: number }) => {
            if (!animEnabledRef.current) return
            const { minRadius, maxRadius, restitution, spawnCount } =
                spawnRef.current
            if (srcTextures.length === 0) return
            for (let i = 0; i < spawnCount; i++) {
                const radius =
                    minRadius + Math.random() * (maxRadius - minRadius)
                const src =
                    srcTextures[Math.floor(Math.random() * srcTextures.length)]
                createGlassyTexture(src, Math.round(radius * 2)).then((tex) => {
                    addBubble(engine, tex, {
                        x: e.offsetX + (Math.random() - 0.5) * 20,
                        y: e.offsetY + (Math.random() - 0.5) * 20,
                        radius,
                        restitution,
                        velocityY: -(Math.random() * 15 + 10),
                    })
                })
            }
        }

        const handleTouch = (e: TouchEvent) => {
            if (!animEnabledRef.current) return
            const rect = render.canvas.getBoundingClientRect()
            const touch = e.touches[0]
            handleClick({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top,
            })
        }

        if (spawnOnClick) {
            render.canvas.addEventListener("mousedown", handleClick as any)
            render.canvas.addEventListener("touchstart", handleTouch)
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!animEnabledRef.current) return

            const rect = render.canvas.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top

            const bodies = Matter.Composite.allBodies(engine.world).filter(
                (b) => !b.isStatic
            )

            for (const body of bodies) {
                const dx = body.position.x - mx
                const dy = body.position.y - my
                const dist = Math.sqrt(dx * dx + dy * dy)
                const bodyRadius = Math.sqrt(body.area / Math.PI)
                const influence = bodyRadius * 2.8

                if (dist < influence && dist > 1) {
                    const proximity = 1 - dist / influence
                    const smooth = proximity * proximity
                    const nx = dx / dist
                    const ny = dy / dist
                    const strength = smooth * airPressure * body.mass

                    Matter.Body.applyForce(body, body.position, {
                        x: nx * strength,
                        y: ny * strength,
                    })
                }
            }
        }

        render.canvas.addEventListener("mousemove", handleMouseMove)

        return () => {
            setIsEngineReady(false)
            timersRef.current.forEach(clearTimeout)
            timersRef.current = []
            render.canvas.removeEventListener("mousedown", handleClick as any)
            render.canvas.removeEventListener("touchstart", handleTouch)
            render.canvas.removeEventListener("mousemove", handleMouseMove)
            Matter.Runner.stop(runner)
            Matter.Render.stop(render)
            Matter.Engine.clear(engine)
            render.canvas.remove()
            render.textures = {}
        }
    }, [dimensions, gravity])

    // ── Spawn ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (
            !isEngineReady ||
            !isVisible ||
            !animationEnabled ||
            srcTextures.length === 0 ||
            !engineRef.current
        )
            return

        const engine = engineRef.current

        timersRef.current.forEach(clearTimeout)
        timersRef.current = []

        const toRemove = Matter.Composite.allBodies(engine.world).filter(
            (b) => !b.isStatic
        )
        Matter.Composite.remove(engine.world, toRemove)

        const stagger = bubbleCount > 1 ? spawnDuration / bubbleCount : 0

        for (let i = 0; i < bubbleCount; i++) {
            const t = setTimeout(() => {
                if (!engineRef.current) return
                const radius =
                    minRadius + Math.random() * (maxRadius - minRadius)
                const src =
                    srcTextures[Math.floor(Math.random() * srcTextures.length)]
                createGlassyTexture(src, Math.round(radius * 2)).then((tex) => {
                    addBubble(engineRef.current!, tex, {
                        x: Math.random() * dimensions.width,
                        y: -radius * 2,
                        radius,
                        restitution,
                        velocityY: 0,
                    })
                })
            }, i * stagger)
            timersRef.current.push(t)
        }
    }, [
        isEngineReady,
        isVisible,
        animationEnabled,
        srcTextures,
        dimensions.width,
        bubbleCount,
        minRadius,
        maxRadius,
        restitution,
        spawnDuration,
    ])

    // ── Clear bubbles when animationEnabled toggled OFF ──────────────────────
    useEffect(() => {
        if (!animationEnabled && engineRef.current) {
            timersRef.current.forEach(clearTimeout)
            timersRef.current = []
            const toRemove = Matter.Composite.allBodies(
                engineRef.current.world
            ).filter((b) => !b.isStatic)
            Matter.Composite.remove(engineRef.current.world, toRemove)
        }
    }, [animationEnabled])

    return (
        <div
            ref={sceneRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: "250px",
                minHeight: "250px",
                position: "relative",
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            {showVignette && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 1,
                        background:
                            "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.55))",
                    }}
                />
            )}
            {resolvedSrcs.length === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "sans-serif",
                        fontSize: 14,
                        textAlign: "center",
                        padding: 24,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                >
                    Add images via the&nbsp;
                    <strong style={{ color: "rgba(255,255,255,0.6)" }}>
                        Images
                    </strong>
                    &nbsp;property →
                </div>
            )}
        </div>
    )
}

// ─── Default Props ────────────────────────────────────────────────────────────

BubblePit.defaultProps = {
    width: 600,
    height: 600,
}

// ─── Add single bubble ────────────────────────────────────────────────────────

function addBubble(
    engine: Matter.Engine,
    texture: string,
    opts: {
        x: number
        y: number
        radius: number
        restitution: number
        velocityY: number
    }
) {
    const bubble = Matter.Bodies.circle(opts.x, opts.y, opts.radius, {
        restitution: opts.restitution,
        friction: 0.05,
        render: {
            sprite: { texture, xScale: 1, yScale: 1 },
        },
    })
    Matter.Body.setVelocity(bubble, {
        x: (Math.random() - 0.5) * 15,
        y: opts.velocityY,
    })
    Matter.Composite.add(engine.world, bubble)
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(BubblePit, {
    animationEnabled: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: [],
        maxCount: 20,
    },
    bubbleCount: {
        type: ControlType.Number,
        title: "Bubble Count",
        defaultValue: 28,
        min: 5,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    spawnDuration: {
        type: ControlType.Number,
        title: "Spawn Duration (ms)",
        defaultValue: 4200,
        min: 500,
        max: 15000,
        step: 100,
        displayStepper: true,
    },
    triggerId: {
        type: ControlType.String,
        title: "Trigger ID",
        defaultValue: "",
        placeholder: "e.g. bubble-section",
        description:
            "ID of any element on the page. Bubbles start falling when that element enters the viewport. Leave empty to trigger when this component itself is visible.",
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },
    restitution: {
        type: ControlType.Number,
        title: "Bounciness",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    minRadius: {
        type: ControlType.Number,
        title: "Min Radius",
        defaultValue: 32,
        min: 10,
        max: 120,
        step: 2,
        displayStepper: true,
    },
    maxRadius: {
        type: ControlType.Number,
        title: "Max Radius",
        defaultValue: 56,
        min: 20,
        max: 160,
        step: 2,
        displayStepper: true,
    },
    spawnOnClick: {
        type: ControlType.Boolean,
        title: "Spawn on Click",
        defaultValue: true,
    },
    spawnCount: {
        type: ControlType.Number,
        title: "Spawn Count",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.spawnOnClick,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050505",
    },
    showVignette: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: true,
    },
    airPressure: {
        type: ControlType.Number,
        title: "Air Pressure",
        defaultValue: 0.012,
        min: 0,
        max: 0.05,
        step: 0.001,
        displayStepper: true,
        description:
            "Cursor air push strength. 0 = none, 0.05 = strong.\n\nBuilt by [Mr.Framer](https://www.linkedin.com/in/aptitus/)",
    },
})
