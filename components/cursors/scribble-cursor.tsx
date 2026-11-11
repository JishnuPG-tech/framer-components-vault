import * as React from "react"
import * as ReactDOM from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Point = { x: number; y: number; dx: number; dy: number }

type Props = {
    color: string
    strokeWidth: number
    points: number
    tension: number
    friction: number
    jitter: number
    tracking: "hover" | "global"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScribbleTrailCursor({
    color = "#3DA8FF",
    strokeWidth = 2,
    points = 4,
    tension = 0.3,
    friction = 0.5,
    jitter = 50,
    tracking = "global",
    style,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const rafRef = React.useRef<number | null>(null)

    const trailRef = React.useRef<Point[]>([])
    const mouseRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const isMovingRef = React.useRef(false)
    const timerRef = React.useRef<number | null>(null)

    // Clear canvas utility
    const clear = React.useCallback(() => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, c.width, c.height)
    }, [])

    const resizeCanvas = React.useCallback(() => {
        const c = canvasRef.current
        if (!c) return

        const w = window.innerWidth
        const h = window.innerHeight

        const dpr =
            typeof window !== "undefined"
                ? Math.max(1, Math.min(3, window.devicePixelRatio || 1))
                : 1

        const targetW = Math.round(w * dpr)
        const targetH = Math.round(h * dpr)

        if (c.width !== targetW || c.height !== targetH) {
            c.width = targetW
            c.height = targetH
            c.style.width = `${w}px`
            c.style.height = `${h}px`
            const ctx = c.getContext("2d")
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
    }, [])

    const updateMouse = React.useCallback(
        (clientX: number, clientY: number) => {
            // Initialize points to mouse on first move
            if (trailRef.current.length === 0) {
                for (let i = 0; i < Math.max(2, points); i++) {
                    trailRef.current.push({
                        x: clientX,
                        y: clientY,
                        dx: 0,
                        dy: 0,
                    })
                }
            }

            mouseRef.current = {
                x: clientX,
                y: clientY,
            }

            isMovingRef.current = true
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = window.setTimeout(() => {
                isMovingRef.current = false
            }, 100)
        },
        [points]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (isStatic) return
            updateMouse(e.clientX, e.clientY)
        },
        [isStatic, updateMouse]
    )

    const onPointerLeave = React.useCallback(() => {
        isMovingRef.current = false
        if (timerRef.current) clearTimeout(timerRef.current)
        clear()
    }, [clear])

    const draw = React.useCallback(() => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext("2d")
        if (!ctx) return

        if (isMovingRef.current && trailRef.current.length > 0) {
            ctx.clearRect(0, 0, c.width, c.height)
            const trail = trailRef.current
            const mouse = mouseRef.current

            // Update physics (Spring interpolation logic exactly like Blimp.gr)
            trail.forEach((p: Point, i: number) => {
                const target = i === 0 ? mouse : trail[i - 1]
                p.dx += tension * (target.x - p.x) + 2 * Math.random()
                p.dy += tension * (target.y - p.y) + 2 * Math.random()
                p.dx *= friction
                p.dy *= friction
                p.x += p.dx
                p.y += p.dy
            })

            ctx.beginPath()
            ctx.moveTo(
                trail[0].x + Math.random() * 2,
                trail[0].y + Math.random() * 2
            )

            // Replicate the Blimp continuous drawing loop
            for (let i = 0; i < trail.length - 1; i++) {
                const mx =
                    0.5 * (trail[i].x + trail[i + 1].x + Math.random() * 2)
                const my =
                    0.5 * (trail[i].y + trail[i + 1].y + Math.random() * 2)

                ctx.quadraticCurveTo(
                    trail[i].x + Math.random() * jitter - jitter / 2,
                    trail[i].y + Math.random() * jitter - jitter / 2,
                    mx,
                    my
                )

                ctx.strokeStyle = color
                ctx.lineWidth = strokeWidth
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
                ctx.stroke() // Overdraw segments like the original code
            }

            ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y)
            ctx.stroke()
        } else {
            ctx.clearRect(0, 0, c.width, c.height)
        }
    }, [color, strokeWidth, tension, friction, jitter])

    const loop = React.useCallback(() => {
        rafRef.current = null
        if (isStatic) return
        draw()
        rafRef.current = requestAnimationFrame(loop)
    }, [draw, isStatic])

    // Mount setup
    React.useEffect(() => {
        if (isStatic) return
        resizeCanvas()
        const onResize = () => resizeCanvas()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [isStatic, resizeCanvas])

    // Global tracking setup
    React.useEffect(() => {
        if (isStatic) return
        if (tracking !== "global") return

        const onMove = (e: PointerEvent) => updateMouse(e.clientX, e.clientY)
        window.addEventListener("pointermove", onMove, { passive: true })
        return () => window.removeEventListener("pointermove", onMove)
    }, [isStatic, tracking, updateMouse])

    // Raf loop setup
    React.useEffect(() => {
        if (isStatic) return
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(loop)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [isStatic, loop])

    // Trail length dynamic update
    React.useEffect(() => {
        const targetLen = Math.max(2, points)
        if (trailRef.current.length < targetLen) {
            const last =
                trailRef.current[trailRef.current.length - 1] ||
                mouseRef.current
            while (trailRef.current.length < targetLen) {
                trailRef.current.push({ x: last.x, y: last.y, dx: 0, dy: 0 })
            }
        } else if (trailRef.current.length > targetLen) {
            trailRef.current.length = targetLen
        }
    }, [points])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    fontWeight: "bold",
                    opacity: 0,
                    pointerEvents: "none",
                    ...style,
                }}
            />
        )
    }

    const canvasElement = (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 99999,
            }}
        />
    )

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                pointerEvents: tracking === "global" ? "none" : "auto",
            }}
            onPointerMove={tracking === "hover" ? onPointerMove : undefined}
            onPointerDown={tracking === "hover" ? onPointerMove : undefined}
            onPointerLeave={tracking === "hover" ? onPointerLeave : undefined}
            onPointerCancel={tracking === "hover" ? onPointerLeave : undefined}
        >
            {typeof document !== "undefined"
                ? ReactDOM.createPortal(canvasElement, document.body)
                : null}
        </div>
    )
}

addPropertyControls(ScribbleTrailCursor, {
    tracking: {
        type: ControlType.Enum,
        title: "Tracking",
        description:
            "*Global* — follows cursor anywhere on the page. *Hover* — only draws while the cursor is over this component.",
        options: ["hover", "global"],
        optionTitles: ["Hover", "Global"],
        defaultValue: "global",
        displaySegmentedControl: true,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        description: "Stroke color of the trail.",
        defaultValue: "#3DA8FF",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Thickness",
        description: "Line thickness of the trail stroke.",
        defaultValue: 2,
        min: 0.5,
        max: 12,
        step: 0.5,
        unit: "px",
    },
    points: {
        type: ControlType.Number,
        title: "Points",
        description:
            "Number of trailing segments. More points = longer, more flowing tail.",
        defaultValue: 4,
        min: 2,
        max: 20,
        step: 1,
    },
    tension: {
        type: ControlType.Number,
        title: "Tension",
        description:
            "Spring pull strength. Higher values make the trail snap to the cursor faster.",
        defaultValue: 0.3,
        min: 0.05,
        max: 1,
        step: 0.01,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        description:
            "Velocity damping. Higher values reduce overshoot; lower values let the trail swing more.",
        defaultValue: 0.5,
        min: 0.1,
        max: 0.99,
        step: 0.01,
    },
    jitter: {
        type: ControlType.Number,
        title: "Jitter",
        description:
            "Random pixel offset for a hand-drawn feel. *0* = smooth, higher = more chaotic.",
        defaultValue: 50,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
})
