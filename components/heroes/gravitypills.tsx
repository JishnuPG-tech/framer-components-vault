import React, {
    startTransition,
    useCallback,
    useEffect,
    useRef,
    useState,
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

// Framer resolves and bundles this npm dependency when the component is built.
// Do not replace this with a CDN URL: marketplace reviews reject runtime imports.
import Matter from "matter-js"

interface CustomColor {
    name: string
    bg: string
    color: string
    border: string
}

interface PhysicsSandboxProps {
    useCustomColors: boolean
    badgesList: string[]
    customBadges: CustomColor[]
    badgeBg: string
    badgeTextColor: string
    badgeBorderColor: string
    paddingX: number
    paddingY: number
    gravity: number
    restitution: number
    friction: number
    throwSensitivity: number
    dragTightness: number
    squishiness: number
    triggerMode: "immediate" | "scroll"
    fontSize: number
    borderRadius: number
    containerBg: string
    enableTilt: boolean
    enableBoundaries: boolean
    enableTopCollision: boolean
    style?: React.CSSProperties
}

interface PointerPosition {
    x: number
    y: number
}

type TiltStatus = "idle" | "requesting" | "enabled" | "denied" | "unavailable"

/**
 * Gravity Pills
 *
 * A highly interactive, 60fps physics-based component powered by Matter.js.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function GravityPills(props: PhysicsSandboxProps) {
    const isStatic = useIsStaticRenderer()

    const {
        useCustomColors = true,
        badgesList = [],
        customBadges = [],
        badgeBg = "#18181B",
        badgeTextColor = "#FFFFFF",
        badgeBorderColor = "rgba(255, 255, 255, 0.12)",
        paddingX = 24,
        paddingY = 16,
        gravity = 0.03,
        restitution = 0.85,
        friction = 0.948,
        throwSensitivity = 0.7,
        dragTightness = 0.44,
        squishiness = 1,
        triggerMode = "scroll",
        fontSize = 24,
        borderRadius = 999,
        containerBg = "#000000",
        enableTilt = false,
        enableBoundaries = true,
        enableTopCollision = true,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const engineRef = useRef<Matter.Engine | null>(null)
    const renderReqRef = useRef<number | null>(null)
    const isTriggeredRef = useRef<boolean>(triggerMode === "immediate")
    const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null)
    const previousMousePosRef = useRef<PointerPosition | null>(null)
    const currentMousePosRef = useRef<PointerPosition | null>(null)
    const releaseVelocityRef = useRef<PointerPosition>({ x: 0, y: 0 })
    const mouseVelocityBufferRef = useRef<PointerPosition[]>([])
    const gravityRef = useRef<number>(gravity)
    const squishinessRef = useRef<number>(squishiness)
    const tiltListenerAttachedRef = useRef<boolean>(false)
    const orientationHandlerRef = useRef<
        ((event: DeviceOrientationEvent) => void) | null
    >(null)
    const endDragHandlerRef = useRef<
        ((event: Matter.IEvent<Matter.MouseConstraint>) => void) | null
    >(null)
    const startDragHandlerRef = useRef<
        ((event: Matter.IEvent<Matter.MouseConstraint>) => void) | null
    >(null)
    const mouseMoveHandlerRef = useRef<
        ((event: Matter.IEvent<Matter.MouseConstraint>) => void) | null
    >(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [tiltStatus, setTiltStatus] = useState<TiltStatus>("idle")

    const badgesStr = JSON.stringify(badgesList)
    const customBadgesStr = JSON.stringify(customBadges)

    const detachTiltListener = useCallback(() => {
        if (typeof window === "undefined") return
        if (tiltListenerAttachedRef.current && orientationHandlerRef.current) {
            window.removeEventListener(
                "deviceorientation",
                orientationHandlerRef.current
            )
            tiltListenerAttachedRef.current = false
        }
    }, [])

    const attachTiltListener = useCallback(() => {
        if (typeof window === "undefined") return
        if (tiltListenerAttachedRef.current) return

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (engineRef.current && e.gamma !== null && e.beta !== null) {
                engineRef.current.world.gravity.x =
                    (e.gamma / 90) * gravityRef.current * 3
                engineRef.current.world.gravity.y =
                    (Math.max(e.beta, 0) / 90) * gravityRef.current * 3
            }
        }

        orientationHandlerRef.current = handleOrientation
        window.addEventListener("deviceorientation", handleOrientation)
        tiltListenerAttachedRef.current = true
    }, [])

    const requestTiltAccess = useCallback(async () => {
        if (typeof window === "undefined") return
        if (!enableTilt || tiltStatus === "enabled") return
        if (tiltStatus === "denied" || tiltStatus === "unavailable") return

        startTransition(() => setTiltStatus("requesting"))

        try {
            const DeviceOrientationEventWithPermission =
                window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
                    requestPermission?: () => Promise<"granted" | "denied">
                }

            if (
                typeof DeviceOrientationEventWithPermission?.requestPermission ===
                "function"
            ) {
                const permission =
                    await DeviceOrientationEventWithPermission.requestPermission()
                if (permission !== "granted") {
                    startTransition(() => setTiltStatus("denied"))
                    return
                }
            }

            attachTiltListener()
            startTransition(() => setTiltStatus("enabled"))
        } catch (_error) {
            startTransition(() => setTiltStatus("unavailable"))
        }
    }, [attachTiltListener, enableTilt, tiltStatus])

    const initPhysics = (width: number, height: number, dpr: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        if (mouseConstraintRef.current && mouseConstraintRef.current.mouse) {
            if (mouseMoveHandlerRef.current) {
                Matter.Events.off(
                    mouseConstraintRef.current,
                    "mousemove",
                    mouseMoveHandlerRef.current
                )
            }
            if (endDragHandlerRef.current) {
                Matter.Events.off(
                    mouseConstraintRef.current,
                    "enddrag",
                    endDragHandlerRef.current
                )
            }
            if (startDragHandlerRef.current) {
                Matter.Events.off(
                    mouseConstraintRef.current,
                    "startdrag",
                    startDragHandlerRef.current
                )
            }
            Matter.Mouse.clearSourceEvents(mouseConstraintRef.current.mouse)
        }
        if (engineRef.current) {
            Matter.Engine.clear(engineRef.current)
            Matter.World.clear(engineRef.current.world, false)
        }

        const engine = Matter.Engine.create({
            enableSleeping: true,
        })
        engine.world.gravity.y = gravity * 3
        engine.world.gravity.x = 0
        engineRef.current = engine

        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

        const bodies: Matter.Body[] = []

        badgesList.forEach((textItem, idx) => {
            const text = textItem.trim()

            const metrics = ctx.measureText(text)
            const pillWidth = Math.max(metrics.width + paddingX * 2, 48)
            const pillHeight = fontSize + paddingY * 2

            let x =
                Math.random() * (width - pillWidth - 40) + 20 + pillWidth / 2

            let y = enableTopCollision
                ? 10 + (idx % 6) * 32 + Math.random() * 16
                : -100 - idx * 80
            let angle = (Math.random() - 0.5) * 0.5

            const colorTheme =
                useCustomColors && customBadges.length > 0
                    ? customBadges[idx % customBadges.length]
                    : null

            const finalBg = colorTheme ? colorTheme.bg : badgeBg
            const finalColor = colorTheme ? colorTheme.color : badgeTextColor
            const finalBorder = colorTheme
                ? colorTheme.border
                : badgeBorderColor

            const body = Matter.Bodies.rectangle(x, y, pillWidth, pillHeight, {
                chamfer: { radius: Math.min(borderRadius, pillHeight / 2) },
                restitution: restitution,
                friction: friction,
                frictionAir: 0.004,
                angle: angle,
                isStatic: false,
                render: {
                    fillStyle: finalBg,
                    strokeStyle: finalBorder,
                },
                plugin: {
                    text: text,
                    color: finalColor,
                    pillWidth: pillWidth,
                    pillHeight: pillHeight,
                    squishX: 1,
                    squishY: 1,
                    targetSquishX: 1,
                    targetSquishY: 1,
                    prevSpeed: 0,
                },
            })

            Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 2,
                y: Math.random() * 1.4,
            })
            Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1)

            bodies.push(body)
        })

        const wallOptions = {
            isStatic: true,
            restitution: restitution * 0.35,
            friction: friction,
        }

        const floor = Matter.Bodies.rectangle(
            width / 2,
            height + 50,
            width * 3,
            100,
            wallOptions
        )

        const ceiling = Matter.Bodies.rectangle(
            width / 2,
            enableTopCollision ? -1000 : -5000,
            width * 3,
            2000,
            wallOptions
        )

        const worldBodies = [...bodies, floor, ceiling]

        if (enableBoundaries) {
            const leftWall = Matter.Bodies.rectangle(
                -50,
                height / 2,
                100,
                height * 3,
                wallOptions
            )
            const rightWall = Matter.Bodies.rectangle(
                width + 50,
                height / 2,
                100,
                height * 3,
                wallOptions
            )
            worldBodies.push(leftWall, rightWall)
        }

        Matter.Composite.add(engine.world, worldBodies)

        const mouse = Matter.Mouse.create(canvas)
        Matter.Mouse.setScale(mouse, { x: 1 / dpr, y: 1 / dpr })

        const mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: dragTightness,
                render: { visible: false },
            },
        })
        mouseConstraintRef.current = mouseConstraint
        previousMousePosRef.current = null
        currentMousePosRef.current = null
        releaseVelocityRef.current = { x: 0, y: 0 }
        mouseVelocityBufferRef.current = []

        const handleStartDrag = () => {
            mouseVelocityBufferRef.current = []
            releaseVelocityRef.current = { x: 0, y: 0 }
        }
        const handleEndDrag = (
            event: Matter.IEvent<Matter.MouseConstraint>
        ) => {
            const body = (
                event as Matter.IEvent<Matter.MouseConstraint> & {
                    body?: Matter.Body
                }
            ).body
            if (!body || body.isStatic) return

            const sampled = releaseVelocityRef.current
            const throwScale = throwSensitivity * 0.12
            const maxThrow = 1.6
            const boostX = Math.max(
                -maxThrow,
                Math.min(maxThrow, sampled.x * throwScale)
            )
            const boostY = Math.max(
                -maxThrow,
                Math.min(maxThrow, sampled.y * throwScale)
            )

            Matter.Body.setVelocity(body, {
                x: body.velocity.x + boostX,
                y: body.velocity.y + boostY,
            })
        }
        const handleMouseMove = (
            event: Matter.IEvent<Matter.MouseConstraint>
        ) => {
            const pos = (
                event as Matter.IEvent<Matter.MouseConstraint> & {
                    mouse?: { position?: PointerPosition }
                }
            ).mouse?.position
            if (!pos) return

            const nextPos = { x: pos.x, y: pos.y }
            const previousPos =
                currentMousePosRef.current || previousMousePosRef.current

            if (previousPos) {
                const buffer = mouseVelocityBufferRef.current
                buffer.push({
                    x: nextPos.x - previousPos.x,
                    y: nextPos.y - previousPos.y,
                })
                if (buffer.length > 5) buffer.shift()

                const summed = buffer.reduce(
                    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
                    { x: 0, y: 0 }
                )
                releaseVelocityRef.current = {
                    x: summed.x / buffer.length,
                    y: summed.y / buffer.length,
                }
            }

            previousMousePosRef.current = currentMousePosRef.current
            currentMousePosRef.current = nextPos
        }
        mouseMoveHandlerRef.current = handleMouseMove
        Matter.Events.on(mouseConstraint, "mousemove", handleMouseMove)
        endDragHandlerRef.current = handleEndDrag
        Matter.Events.on(mouseConstraint, "enddrag", handleEndDrag)
        startDragHandlerRef.current = handleStartDrag
        Matter.Events.on(mouseConstraint, "startdrag", handleStartDrag)

        Matter.Composite.add(engine.world, mouseConstraint)
    }

    const resizeCanvas = () => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        const dpr = window.devicePixelRatio || 1
        const width = rect.width
        const height = rect.height

        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        const ctx = canvas.getContext("2d")
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        initPhysics(width, height, dpr)
    }

    const renderLoop = () => {
        if (isStatic) return

        const canvas = canvasRef.current
        const engine = engineRef.current
        if (!canvas || !engine) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const width = canvas.width / dpr
        const height = canvas.height / dpr

        ctx.clearRect(0, 0, width, height)

        if (!isTriggeredRef.current && !isCanvas) {
            renderReqRef.current = requestAnimationFrame(renderLoop)
            return
        }

        Matter.Engine.update(engine, 1000 / 60)

        const bodies = Matter.Composite.allBodies(engine.world)
        const draggedBody = mouseConstraintRef.current?.body
        const currentSquish = squishinessRef.current

        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        bodies.forEach((b) => {
            if (b.isStatic && b.position.y > height) return
            if (b.isStatic && b.position.y < 0) return
            if (
                b.isStatic &&
                (b.position.x < 0 || b.position.x > width) &&
                !b.plugin.text
            )
                return

            const { x, y } = b.position
            const angle = b.angle
            const isDragged = b === draggedBody
            const speed = b.speed

            let isImpact = false

            if (b.plugin && b.plugin.squishX !== undefined) {
                const prevSpeed = b.plugin.prevSpeed ?? speed
                const deceleration = prevSpeed - speed
                isImpact = !b.isStatic && !isDragged && deceleration > 2

                if (isDragged) {
                    b.plugin.targetSquishX = 1 + 0.1 * currentSquish
                    b.plugin.targetSquishY = 1 - 0.08 * currentSquish
                } else if (isImpact) {
                    const squash =
                        Math.min(deceleration * 0.045, 0.3) * currentSquish
                    b.plugin.targetSquishX = 1 + squash
                    b.plugin.targetSquishY = 1 - squash * 0.85
                } else if (!b.isStatic) {
                    const t =
                        Math.min(Math.max((speed - 1) / 6, 0), 1) *
                        currentSquish
                    b.plugin.targetSquishX = 1 + t * 0.2
                    b.plugin.targetSquishY = 1 - t * 0.15
                } else {
                    b.plugin.targetSquishX = 1
                    b.plugin.targetSquishY = 1
                }

                const responsiveness = isImpact ? 0.4 : 0.18
                b.plugin.squishX +=
                    (b.plugin.targetSquishX - b.plugin.squishX) * responsiveness
                b.plugin.squishY +=
                    (b.plugin.targetSquishY - b.plugin.squishY) * responsiveness

                b.plugin.prevSpeed = speed
            }

            const pillWidth = b.plugin?.pillWidth || 0
            const pillHeight = b.plugin?.pillHeight || 0
            const rad = Math.min(borderRadius, pillHeight / 2)

            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)

            if (b.plugin && b.plugin.squishX !== undefined) {
                ctx.scale(b.plugin.squishX, b.plugin.squishY)
            }

            const lift = b.isStatic ? 0 : Math.min(speed / 9, 1)

            ctx.shadowColor = isDragged
                ? "rgba(0, 0, 0, 0.42)"
                : `rgba(0, 0, 0, ${(0.12 + lift * 0.16).toFixed(3)})`
            ctx.shadowBlur = isDragged ? 24 : 6 + lift * 14
            ctx.shadowOffsetY = isDragged ? 12 : 3 + lift * 9

            ctx.fillStyle = b.render.fillStyle || "#000"
            ctx.beginPath()
            ctx.roundRect(
                -pillWidth / 2,
                -pillHeight / 2,
                pillWidth,
                pillHeight,
                rad
            )
            ctx.fill()

            ctx.shadowColor = "transparent"
            ctx.strokeStyle = b.render.strokeStyle || "transparent"
            ctx.lineWidth = 1
            ctx.stroke()

            if (b.plugin && b.plugin.text) {
                ctx.fillStyle = b.plugin.color || "#FFF"
                ctx.fillText(b.plugin.text, 0, 1)
            }

            ctx.restore()
        })

        renderReqRef.current = requestAnimationFrame(renderLoop)
    }

    useEffect(() => {
        if (isStatic) return

        if (triggerMode === "scroll" && containerRef.current) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        isTriggeredRef.current = true
                    }
                },
                { threshold: 0.2 }
            )
            observer.observe(containerRef.current)
            return () => observer.disconnect()
        }
    }, [triggerMode, isStatic])

    useEffect(() => {
        gravityRef.current = gravity
    }, [gravity])

    useEffect(() => {
        squishinessRef.current = squishiness
    }, [squishiness])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        if (!enableTilt) {
            detachTiltListener()
            if (tiltStatus !== "idle") {
                startTransition(() => setTiltStatus("idle"))
            }
        }
    }, [detachTiltListener, enableTilt, isStatic, tiltStatus])

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const stopPageScroll = (event: TouchEvent) => {
            event.preventDefault()
        }

        canvas.addEventListener("touchstart", stopPageScroll, {
            passive: false,
        })
        canvas.addEventListener("touchmove", stopPageScroll, {
            passive: false,
        })

        return () => {
            canvas.removeEventListener("touchstart", stopPageScroll)
            canvas.removeEventListener("touchmove", stopPageScroll)
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return

        let resizeObserver: ResizeObserver | null = null

        if (typeof window !== "undefined") {
            resizeCanvas()
            window.addEventListener("resize", resizeCanvas)

            if ("ResizeObserver" in window && containerRef.current) {
                resizeObserver = new ResizeObserver(() => resizeCanvas())
                resizeObserver.observe(containerRef.current)
            }

            renderReqRef.current = requestAnimationFrame(renderLoop)
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", resizeCanvas)
            }
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            if (renderReqRef.current) cancelAnimationFrame(renderReqRef.current)

            if (
                mouseConstraintRef.current &&
                mouseConstraintRef.current.mouse
            ) {
                if (mouseMoveHandlerRef.current) {
                    Matter.Events.off(
                        mouseConstraintRef.current,
                        "mousemove",
                        mouseMoveHandlerRef.current
                    )
                }
                if (endDragHandlerRef.current) {
                    Matter.Events.off(
                        mouseConstraintRef.current,
                        "enddrag",
                        endDragHandlerRef.current
                    )
                }
                if (startDragHandlerRef.current) {
                    Matter.Events.off(
                        mouseConstraintRef.current,
                        "startdrag",
                        startDragHandlerRef.current
                    )
                }
                Matter.Mouse.clearSourceEvents(mouseConstraintRef.current.mouse)
            }
            if (engineRef.current) {
                Matter.Engine.clear(engineRef.current)
            }
            detachTiltListener()
        }
    }, [
        detachTiltListener,
        isStatic,
        useCustomColors,
        badgesStr,
        customBadgesStr,
        badgeBg,
        badgeTextColor,
        badgeBorderColor,
        paddingX,
        paddingY,
        gravity,
        restitution,
        friction,
        throwSensitivity,
        dragTightness,
        fontSize,
        borderRadius,
        enableBoundaries,
        enableTopCollision,
    ])

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: style?.width || "100%",
                    height: style?.height || "450px",
                    minWidth: "200px",
                    minHeight: "280px",
                    backgroundColor: containerBg,
                    borderRadius: "20px",
                    overflow: "hidden",
                    ...style,
                }}
            />
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: style?.width || "100%",
                height: style?.height || "450px",
                minWidth: "200px",
                minHeight: "280px",
                backgroundColor: containerBg,
                overflow: "hidden",
                borderRadius: "20px",
                userSelect: "none",
                WebkitUserSelect: "none",
                ...style,
                touchAction: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    cursor: "grab",
                    touchAction: "none",
                }}
            />
            {enableTilt && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "flex-end",
                        pointerEvents: "none",
                    }}
                >
                    {tiltStatus !== "enabled" &&
                        tiltStatus !== "denied" &&
                        tiltStatus !== "unavailable" && (
                            <button
                                type="button"
                                onClick={requestTiltAccess}
                                disabled={tiltStatus === "requesting"}
                                style={{
                                    pointerEvents: "auto",
                                    border: "1px solid rgba(0,0,0,0.14)",
                                    background: "rgba(255,255,255,0.88)",
                                    color: "#111111",
                                    borderRadius: 999,
                                    padding: "8px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    cursor:
                                        tiltStatus === "requesting"
                                            ? "default"
                                            : "pointer",
                                    backdropFilter: "blur(6px)",
                                }}
                                aria-label="Enable device tilt controls"
                            >
                                {tiltStatus === "requesting"
                                    ? "Enabling tilt…"
                                    : "Enable tilt"}
                            </button>
                        )}
                    {(tiltStatus === "denied" ||
                        tiltStatus === "unavailable") && (
                        <span
                            aria-live="polite"
                            style={{
                                pointerEvents: "none",
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "rgba(255,255,255,0.9)",
                                color: "#333333",
                                borderRadius: 999,
                                padding: "6px 10px",
                                fontSize: 11,
                                fontWeight: 500,
                                lineHeight: 1.2,
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            {tiltStatus === "denied"
                                ? "Tilt permission denied"
                                : "Tilt unavailable"}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(GravityPills, {
    useCustomColors: {
        type: ControlType.Boolean,
        title: "Pill Colour",
        defaultValue: true,
    },
    badgesList: {
        type: ControlType.Array,
        title: "Badges List",
        control: {
            type: ControlType.String,
        },
        defaultValue: [
            "✦ Alt3 Studio",
            "Interaction Design",
            "Framer Motion",
            "Design Systems",
            "WebGL Shaders",
            "Prototypes",
            "Physics 2D",
            "React Canvas",
            "Micro-Interactions",
            "Creative Tech",
            "Design Life",
            "Trippy",
            "Flow State",
            "Good Vibes",
            "Code Art",
            "Pixel Perfect",
        ],
    },
    customBadges: {
        type: ControlType.Array,
        title: "Custom Colors",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name" },
                bg: { type: ControlType.Color, title: "Background" },
                color: { type: ControlType.Color, title: "Text" },
                border: { type: ControlType.Color, title: "Border" },
            },
        },
        defaultValue: [
            {
                name: "Pill 1",
                bg: "#C8FC00",
                color: "#000000",
                border: "#D8FF3D",
            },
            {
                name: "Pill 2",
                bg: "#FF3366",
                color: "#FFFFFF",
                border: "#FF5C85",
            },
            {
                name: "Pill 3",
                bg: "#0055FF",
                color: "#FFFFFF",
                border: "#3377FF",
            },
            {
                name: "Pill 4",
                bg: "#18181B",
                color: "#FFFFFF",
                border: "rgba(255, 255, 255, 0.12)",
            },
            {
                name: "Pill 5",
                bg: "#B200FF",
                color: "#FFFFFF",
                border: "#C633FF",
            },
            {
                name: "Pill 6",
                bg: "#FF4D00",
                color: "#FFFFFF",
                border: "#FF7033",
            },
            {
                name: "Pill 7",
                bg: "#00E5FF",
                color: "#000000",
                border: "#33EAFF",
            },
            {
                name: "Pill 8",
                bg: "#FFD700",
                color: "#000000",
                border: "#FFE133",
            },
            {
                name: "Pill 9",
                bg: "#00D084",
                color: "#000000",
                border: "#33D99D",
            },
            {
                name: "Pill 10",
                bg: "#FF003C",
                color: "#FFFFFF",
                border: "#FF3363",
            },
            {
                name: "Pill 11",
                bg: "#FF00FF",
                color: "#FFFFFF",
                border: "#FF66FF",
            },
            {
                name: "Pill 12",
                bg: "#00FF99",
                color: "#000000",
                border: "#66FFB2",
            },
            {
                name: "Pill 13",
                bg: "#FF9900",
                color: "#000000",
                border: "#FFB833",
            },
            {
                name: "Pill 14",
                bg: "#8A2BE2",
                color: "#FFFFFF",
                border: "#A854E8",
            },
            {
                name: "Pill 15",
                bg: "#00CCFF",
                color: "#000000",
                border: "#5CE1E6",
            },
            {
                name: "Pill 16",
                bg: "#FF1493",
                color: "#FFFFFF",
                border: "#FF66B2",
            },
        ],
        hidden(props) {
            return props.useCustomColors === false
        },
    },
    squishiness: {
        type: ControlType.Number,
        title: "Squish Amount",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        description:
            "Controls how much the pills stretch while moving and squash upon impact.",
    },
    throwSensitivity: {
        type: ControlType.Number,
        title: "Throw Power",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.7,
    },
    restitution: {
        type: ControlType.Number,
        title: "Bounce (Restit)",
        min: 0.1,
        max: 0.85,
        step: 0.02,
        defaultValue: 0.85,
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        min: 0.01,
        max: 1.2,
        step: 0.01,
        defaultValue: 0.03,
    },
    dragTightness: {
        type: ControlType.Number,
        title: "Drag Grip",
        min: 0.1,
        max: 0.6,
        step: 0.02,
        defaultValue: 0.44,
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["scroll", "immediate"],
        optionTitles: ["On Scroll Into View", "Immediate on Load"],
        defaultValue: "scroll",
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        min: 0.92,
        max: 0.999,
        step: 0.002,
        defaultValue: 0.948,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 26,
        step: 1,
        defaultValue: 24,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 8,
        max: 64,
        step: 2,
        defaultValue: 24,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 4,
        max: 48,
        step: 2,
        defaultValue: 16,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 4,
        max: 999,
        step: 1,
        defaultValue: 999,
    },
    badgeBg: {
        type: ControlType.Color,
        title: "Badge BG",
        defaultValue: "#18181B",
        hidden(props) {
            return props.useCustomColors === true
        },
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden(props) {
            return props.useCustomColors === true
        },
    },
    badgeBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255, 255, 255, 0.12)",
        hidden(props) {
            return props.useCustomColors === true
        },
    },
    containerBg: {
        type: ControlType.Color,
        title: "Container BG",
        defaultValue: "#000000",
    },
    enableBoundaries: {
        type: ControlType.Boolean,
        title: "Boundaries",
        defaultValue: true,
    },
    enableTopCollision: {
        type: ControlType.Boolean,
        title: "Top Collision",
        defaultValue: true,
        description:
            "When on, pills bounce off the top edge and fall back down. When off, they can fly upward off-screen.",
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Mobile Tilt",
        defaultValue: false,
        description:
            "\u00A0\n\nGravity Pills v1.1\nMade by [Alt3 Studio](https://alt3studio.com/)",
    },
})
