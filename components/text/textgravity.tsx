// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type PointerEvent,
} from "react"

type TriggerMode = "hover" | "click"

type Body = {
    id: string
    text: string
    x: number
    y: number
    vx: number
    vy: number
    w: number
    h: number
    r: number
    active: boolean
}

type DragState = {
    active: boolean
    bodyIndex: number
    pointerId: number
    offsetX: number
    offsetY: number
}

interface Props {
    text: string
    trigger: TriggerMode
    resetOnLeave: boolean

    background: string
    textColor: string
    font: any

    padding: number
    wordGap: number

    gravity: number
    bounce: number
    airFriction: number
    floorFriction: number
    wallFriction: number
    maxVelocity: number

    spawnMode: "stacked" | "inline"
    spawnY: number

    mouseRadius: number
    dragStrength: number

    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function TextGravityPro(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        text,
        trigger,
        resetOnLeave,

        background,
        textColor,
        font,

        padding,
        wordGap,

        gravity,
        bounce,
        airFriction,
        floorFriction,
        wallFriction,
        maxVelocity,

        spawnMode,
        spawnY,

        mouseRadius,
        dragStrength,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const wordsWrapRef = useRef<HTMLDivElement | null>(null)
    const wordRefs = useRef<Array<HTMLSpanElement | null>>([])
    const rafRef = useRef<number | null>(null)
    const lastTRef = useRef<number>(0)
    const boundsRef = useRef({ w: 0, h: 0 })
    const bodiesRef = useRef<Body[]>([])
    const dragRef = useRef<DragState>({
        active: false,
        bodyIndex: -1,
        pointerId: -1,
        offsetX: 0,
        offsetY: 0,
    })
    const pointerPosRef = useRef<{ x: number; y: number; inside: boolean }>({
        x: 0,
        y: 0,
        inside: false,
    })

    const [armed, setArmed] = useState(false)
    const [layoutReady, setLayoutReady] = useState(false)

    const tokens = useMemo(() => {
        const raw = (text ?? "").trim()
        if (!raw) return ["Text"]
        return raw.split(/\s+/g)
    }, [text])

    const setWordRef = (i: number) => (el: HTMLSpanElement | null) => {
        wordRefs.current[i] = el
    }

    const stop = () => {
        if (rafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
        }
        rafRef.current = null
        lastTRef.current = 0
    }

    const readBounds = () => {
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        boundsRef.current = {
            w: Math.max(1, rect.width),
            h: Math.max(1, rect.height),
        }
    }

    const clamp = (v: number, min: number, max: number) =>
        Math.max(min, Math.min(max, v))

    const applyDom = () => {
        const bodies = bodiesRef.current
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i]
            const node = wordRefs.current[i]
            if (!node) continue
            node.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
        }
    }

    const buildBodiesFromMeasured = () => {
        const w = boundsRef.current.w
        const h = boundsRef.current.h

        const measured: Array<{ w: number; h: number; text: string }> =
            tokens.map((t, i) => {
                const el = wordRefs.current[i]
                if (!el) return { w: 24, h: 16, text: t }
                const r = el.getBoundingClientRect()
                return {
                    w: Math.max(1, r.width),
                    h: Math.max(1, r.height),
                    text: t,
                }
            })

        const bodies: Body[] = []
        const left = padding
        const top = padding

        if (spawnMode === "inline") {
            let cx = left
            let cy = clamp(top + spawnY, top, Math.max(top, h - padding))
            for (let i = 0; i < measured.length; i++) {
                const mw = measured[i].w
                const mh = measured[i].h
                if (cx + mw > w - padding) {
                    cx = left
                    cy += mh + wordGap
                }
                bodies.push({
                    id: `${i}`,
                    text: measured[i].text,
                    x: clamp(cx, left, Math.max(left, w - padding - mw)),
                    y: clamp(cy, top, Math.max(top, h - padding - mh)),
                    vx: 0,
                    vy: 0,
                    w: mw,
                    h: mh,
                    r: 0,
                    active: false,
                })
                cx += mw + wordGap
            }
        } else {
            // stacked
            let cx = left
            let cy = clamp(top + spawnY, top, Math.max(top, h - padding))
            for (let i = 0; i < measured.length; i++) {
                const mw = measured[i].w
                const mh = measured[i].h
                bodies.push({
                    id: `${i}`,
                    text: measured[i].text,
                    x: clamp(cx, left, Math.max(left, w - padding - mw)),
                    y: clamp(
                        cy + i * (mh + wordGap * 0.35),
                        top,
                        Math.max(top, h - padding - mh)
                    ),
                    vx: 0,
                    vy: 0,
                    w: mw,
                    h: mh,
                    r: 0,
                    active: false,
                })
                cx += (mw + wordGap) * 0.25
                if (cx > w - padding - 50) cx = left
            }
        }

        bodiesRef.current = bodies
        applyDom()
    }

    const arm = () => startTransition(() => setArmed(true))
    const disarmAndReset = () => {
        startTransition(() => setArmed(false))
        // keep the DOM stable; we rebuild once layoutReady and armed again
        stop()
    }

    const activateAll = () => {
        const bodies = bodiesRef.current
        for (let i = 0; i < bodies.length; i++) bodies[i].active = true
    }

    const step = (t: number) => {
        if (!containerRef.current) return
        const bounds = boundsRef.current
        const bodies = bodiesRef.current
        if (!bodies.length) return

        const lastT = lastTRef.current || t
        let dt = (t - lastT) / 1000
        lastTRef.current = t

        // clamp dt for stability
        dt = clamp(dt, 1 / 240, 1 / 30)

        const floorY = bounds.h - padding
        const leftX = padding
        const rightX = bounds.w - padding

        const drag = dragRef.current
        const pointer = pointerPosRef.current

        // gentle mouse "field" (repel) when not dragging
        const useField = pointer.inside && mouseRadius > 0 && !drag.active
        const mx = pointer.x
        const my = pointer.y
        const rad2 = mouseRadius * mouseRadius

        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i]
            if (!b.active) continue

            // Skip physics integration for dragged body
            if (drag.active && drag.bodyIndex === i) {
                // let release inherit a bit of velocity (computed by spring-like pull below)
                continue
            }

            // forces
            b.vy += gravity * dt

            // air friction (simple exponential-ish damping)
            const af = clamp(airFriction, 0, 0.999)
            b.vx *= 1 - af
            b.vy *= 1 - af

            if (useField) {
                const cx = b.x + b.w / 2
                const cy = b.y + b.h / 2
                const dx = cx - mx
                const dy = cy - my
                const d2 = dx * dx + dy * dy
                if (d2 > 0.0001 && d2 < rad2) {
                    const d = Math.sqrt(d2)
                    const strength = (1 - d / mouseRadius) * (gravity * 0.45)
                    const nx = dx / d
                    const ny = dy / d
                    b.vx += nx * strength * dt
                    b.vy += ny * strength * dt
                }
            }

            // integrate
            b.vx = clamp(b.vx, -maxVelocity, maxVelocity)
            b.vy = clamp(b.vy, -maxVelocity, maxVelocity)
            b.x += b.vx * dt
            b.y += b.vy * dt

            // collide bounds
            if (b.x < leftX) {
                b.x = leftX
                b.vx = -b.vx * bounce
                b.vx *= 1 - clamp(wallFriction, 0, 0.95)
            } else if (b.x + b.w > rightX) {
                b.x = rightX - b.w
                b.vx = -b.vx * bounce
                b.vx *= 1 - clamp(wallFriction, 0, 0.95)
            }

            if (b.y < padding) {
                b.y = padding
                b.vy = -b.vy * bounce
            } else if (b.y + b.h > floorY) {
                b.y = floorY - b.h
                b.vy = -b.vy * bounce
                // floor friction affects lateral motion on impact
                b.vx *= 1 - clamp(floorFriction, 0, 0.95)
                // stop tiny jitter
                if (Math.abs(b.vy) < 8) b.vy = 0
            }
        }

        // if dragging, spring the dragged body to pointer (for "weighty" feel)
        if (
            drag.active &&
            drag.bodyIndex >= 0 &&
            drag.bodyIndex < bodies.length
        ) {
            const b = bodies[drag.bodyIndex]
            b.active = true
            const targetX = clamp(mx - drag.offsetX, leftX, rightX - b.w)
            const targetY = clamp(my - drag.offsetY, padding, floorY - b.h)

            const k = clamp(dragStrength, 0, 200)
            const dx = targetX - b.x
            const dy = targetY - b.y

            // critically-ish damped pull (simple)
            const damp = 14
            b.vx += dx * k * dt
            b.vy += dy * k * dt
            b.vx *= 1 / (1 + damp * dt)
            b.vy *= 1 / (1 + damp * dt)

            b.vx = clamp(b.vx, -maxVelocity, maxVelocity)
            b.vy = clamp(b.vy, -maxVelocity, maxVelocity)
            b.x += b.vx * dt
            b.y += b.vy * dt
        }

        applyDom()
        rafRef.current = window.requestAnimationFrame(step)
    }

    const start = () => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) return
        lastTRef.current = 0
        rafRef.current = window.requestAnimationFrame(step)
    }

    // Setup measurement/layout rebuild
    useEffect(() => {
        if (typeof window === "undefined") return
        readBounds()

        // Wait for DOM nodes to exist, then measure
        const id = window.setTimeout(() => {
            readBounds()
            buildBodiesFromMeasured()
            startTransition(() => setLayoutReady(true))
        }, 0)

        const onResize = () => {
            readBounds()
            buildBodiesFromMeasured()
        }

        window.addEventListener("resize", onResize)
        return () => {
            window.clearTimeout(id)
            window.removeEventListener("resize", onResize)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        tokens.join("|"),
        padding,
        wordGap,
        spawnMode,
        spawnY,
        font?.fontSize,
        font?.letterSpacing,
        font?.lineHeight,
        font?.fontFamily,
        font?.fontWeight,
        font?.fontStyle,
    ])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!layoutReady) return

        if (!armed) {
            stop()
            return
        }

        // Activate and run
        activateAll()
        start()

        return () => {
            stop()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [armed, layoutReady, isStatic])

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        pointerPosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            inside: true,
        }

        const drag = dragRef.current
        if (drag.active) {
            e.preventDefault()
        }
    }

    const onPointerLeave = () => {
        pointerPosRef.current.inside = false
        if (trigger === "hover" && resetOnLeave) disarmAndReset()
    }

    const pickBodyIndex = (x: number, y: number) => {
        const bodies = bodiesRef.current
        // pick top-most: later nodes are visually later; choose nearest center
        let best = -1
        let bestD2 = Infinity
        for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i]
            const cx = b.x + b.w / 2
            const cy = b.y + b.h / 2
            const dx = cx - x
            const dy = cy - y
            const d2 = dx * dx + dy * dy
            if (d2 < bestD2) {
                bestD2 = d2
                best = i
            }
        }
        return best
    }

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const el = containerRef.current
        if (!el) return

        if (trigger === "click" && !armed) arm()

        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        pointerPosRef.current = { x, y, inside: true }

        if (!armed) return

        // allow dragging on any trigger mode once armed
        const idx = pickBodyIndex(x, y)
        if (idx < 0) return

        const b = bodiesRef.current[idx]
        const offsetX = x - b.x
        const offsetY = y - b.y

        dragRef.current = {
            active: true,
            bodyIndex: idx,
            pointerId: e.pointerId,
            offsetX,
            offsetY,
        }

        b.active = true
        // give a tiny impulse on grab
        b.vx *= 0.2
        b.vy *= 0.2

        try {
            el.setPointerCapture(e.pointerId)
        } catch {}
        e.preventDefault()
    }

    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const el = containerRef.current
        const drag = dragRef.current
        if (!el) return

        if (drag.active && drag.pointerId === e.pointerId) {
            dragRef.current = {
                active: false,
                bodyIndex: -1,
                pointerId: -1,
                offsetX: 0,
                offsetY: 0,
            }
            try {
                el.releasePointerCapture(e.pointerId)
            } catch {}
        }
    }

    const onMouseEnter = () => {
        pointerPosRef.current.inside = true
        if (trigger === "hover") arm()
    }

    const onClick = () => {
        if (trigger === "click") arm()
    }

    // Static renderer fallback
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background,
                    padding,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: textColor,
                    ...font,
                    ...(props.style || {}),
                }}
                aria-label="TextGravity Pro (static)"
            >
                <div
                    style={{
                        width: "100%",
                        textAlign: "center",
                        lineHeight: font?.lineHeight || "1.2em",
                    }}
                >
                    {tokens.join(" ")}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: armed
                    ? "grab"
                    : trigger === "click"
                      ? "pointer"
                      : "default",
                ...(props.style || {}),
            }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            role="application"
            aria-label="Physics text"
        >
            {/* Hidden-ish layout row to measure words (we also animate these spans directly via transforms) */}
            <div
                ref={wordsWrapRef}
                style={{
                    position: "absolute",
                    left: padding,
                    top: padding,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: wordGap,
                    alignItems: "flex-start",
                    pointerEvents: "none",
                }}
            >
                {tokens.map((t, i) => (
                    <span
                        key={`${t}-${i}`}
                        ref={setWordRef(i)}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transform: "translate3d(0,0,0)",
                            willChange: "transform",
                            color: textColor,
                            whiteSpace: "pre",
                            minWidth: "max-content",
                            ...font,
                            padding: 0,
                            margin: 0,
                        }}
                        aria-hidden="true"
                    >
                        {t}
                    </span>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(TextGravityPro, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Words with physics",
        displayTextArea: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "hover",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        displaySegmentedControl: true,
        description: "Start on hover or click.",
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "Reset On Leave",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => p.trigger === "click",
        description: "Hover only: reset on leave.",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1.1em",
        },
    },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 18,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    wordGap: {
        type: ControlType.Number,
        title: "Word Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    spawnMode: {
        type: ControlType.Enum,
        title: "Spawn",
        defaultValue: "inline",
        options: ["inline", "stacked"],
        optionTitles: ["Inline", "Stacked"],
        displaySegmentedControl: true,
        description: "Initial layout: inline or stacked.",
    },
    spawnY: {
        type: ControlType.Number,
        title: "Spawn Y",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 1,
        unit: "px",
        description: "Initial Y offset.",
    },

    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 1800,
        min: 0,
        max: 6000,
        step: 25,
        description: "Fall acceleration.",
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
        description: "Bounce amount.",
    },
    airFriction: {
        type: ControlType.Number,
        title: "Air Friction",
        defaultValue: 0.03,
        min: 0,
        max: 0.25,
        step: 0.005,
        description: "Air drag.",
    },
    floorFriction: {
        type: ControlType.Number,
        title: "Floor Friction",
        defaultValue: 0.12,
        min: 0,
        max: 0.8,
        step: 0.01,
        description: "Less sliding on floor.",
    },
    wallFriction: {
        type: ControlType.Number,
        title: "Wall Friction",
        defaultValue: 0.06,
        min: 0,
        max: 0.8,
        step: 0.01,
        description: "Less sliding on walls.",
    },
    maxVelocity: {
        type: ControlType.Number,
        title: "Max Velocity",
        defaultValue: 2800,
        min: 200,
        max: 12000,
        step: 50,
        description: "Speed limit.",
    },

    mouseRadius: {
        type: ControlType.Number,
        title: "Mouse Radius",
        defaultValue: 120,
        min: 0,
        max: 400,
        step: 5,
        unit: "px",
        description: "Cursor push radius (0 off).",
    },
    dragStrength: {
        type: ControlType.Number,
        title: "Drag Strength",
        defaultValue: 55,
        min: 0,
        max: 200,
        step: 1,
        description: "Spring strength while dragging.",
    },
})

export default TextGravityPro
