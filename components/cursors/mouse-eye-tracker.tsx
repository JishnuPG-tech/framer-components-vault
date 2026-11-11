import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
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

import { useInView, useReducedMotion } from "framer-motion"

type ShapeName = "Ball" | "Circle" | "Cube" | "Pill" | "Hexagon" | "Hex Flat"
type EyeStyle = "Slant" | "Dots" | "Squares"

interface Props {
    shape?: ShapeName
    eyeStyle?: EyeStyle
    follow?: number
    bounce?: number
    reach?: number
    idle?: boolean
    blink?: boolean
    eyeScale?: number
    eyeWidth?: number
    eyeHeight?: number
    eyeRound?: number
    bodyColor?: string
    eyeColor?: string
    style?: CSSProperties
}

type Point = { x: number; y: number }

type EyeSize = { w: number; h: number; r: number }

type Motion = {
    x: number // where the face points, as a fraction of the radius
    y: number
    vx: number
    vy: number
    tx: number // where it wants to point
    ty: number
    blinkAt: number
    raf: number
    last: number
}

const SHAPES: ShapeName[] = [
    "Ball",
    "Circle",
    "Cube",
    "Pill",
    "Hexagon",
    "Hex Flat",
]
const EYE_STYLES: EyeStyle[] = ["Slant", "Dots", "Squares"]

// Eye presets in viewBox units: width, height, corner
const EYE_PRESETS: Record<EyeStyle, EyeSize> = {
    Slant: { w: 9, h: 15, r: 4.5 },
    Dots: { w: 11, h: 11, r: 5.5 },
    Squares: { w: 12, h: 12, r: 3.5 },
}

const RADIUS = 50 // sphere radius inside the 100 unit viewBox
const CENTER = 50
const EYE_SPREAD = 0.19 // half the distance between eyes, of the radius
const LEAN = 64 // degrees the pair leans on a diagonal look
const MAX_TURN = 0.92 // how far the face can rotate toward the rim
const MAX_REACH = 0.85 // furthest the face travels toward the pointer
const BLINK_MS = 160
const MORPH_MS = 520
const SAMPLES = 144 // points around each outline

const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v

/* ── Shape geometry ──────────────────────────────────────
   Every body is described by an inside test centred on (0, 0).
   Its outline is found by marching a ray out from the centre at
   evenly spaced angles until it leaves the shape. Because every
   shape becomes the same list of distances, any two can be
   blended into each other for the morph. */

function insideRoundedRect(
    p: Point,
    hw: number,
    hh: number,
    r: number
): boolean {
    const ax = Math.abs(p.x)
    const ay = Math.abs(p.y)
    if (ax > hw || ay > hh) return false
    const ox = Math.max(ax - (hw - r), 0)
    const oy = Math.max(ay - (hh - r), 0)
    return ox * ox + oy * oy <= r * r
}

function hexCorners(startDeg: number, circumradius: number): Point[] {
    const pts: Point[] = []
    for (let i = 0; i < 6; i++) {
        const a = ((startDeg + i * 60) * Math.PI) / 180
        pts.push({
            x: Math.cos(a) * circumradius,
            y: Math.sin(a) * circumradius,
        })
    }
    return pts
}

function segmentDistance(p: Point, a: Point, b: Point): number {
    const abx = b.x - a.x
    const aby = b.y - a.y
    const t = clamp(
        ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby),
        0,
        1
    )
    const cx = a.x + abx * t - p.x
    const cy = a.y + aby * t - p.y
    return Math.sqrt(cx * cx + cy * cy)
}

// A convex polygon grown outward by `round` gives soft corners
function insideSoftPolygon(p: Point, corners: Point[], round: number): boolean {
    let positive = 0
    let negative = 0
    for (let i = 0; i < corners.length; i++) {
        const a = corners[i]
        const b = corners[(i + 1) % corners.length]
        const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
        if (cross >= 0) positive++
        else negative++
    }
    if (positive === corners.length || negative === corners.length) return true
    let nearest = Infinity
    for (let i = 0; i < corners.length; i++) {
        nearest = Math.min(
            nearest,
            segmentDistance(p, corners[i], corners[(i + 1) % corners.length])
        )
    }
    return nearest <= round
}

const HEX_ROUND = 10
const HEX_CORE = 30.7 / Math.cos(Math.PI / 6) // inner hexagon before rounding
const HEX_POINT_UP = hexCorners(-90, HEX_CORE)
const HEX_FLAT_TOP = hexCorners(0, HEX_CORE)

const INSIDE: Record<ShapeName, (p: Point) => boolean> = {
    Ball: (p) => p.x * p.x + p.y * p.y <= 50 * 50,
    Circle: (p) => p.x * p.x + p.y * p.y <= 43 * 43,
    Cube: (p) => insideRoundedRect(p, 44, 44, 24),
    Pill: (p) => insideRoundedRect(p, 49, 33, 33),
    Hexagon: (p) => insideSoftPolygon(p, HEX_POINT_UP, HEX_ROUND),
    "Hex Flat": (p) => insideSoftPolygon(p, HEX_FLAT_TOP, HEX_ROUND),
}

const profileCache = new Map<ShapeName, number[]>()

function profileOf(shape: ShapeName): number[] {
    const cached = profileCache.get(shape)
    if (cached) return cached
    const inside = INSIDE[shape] ?? INSIDE.Ball
    const distances: number[] = []
    for (let i = 0; i < SAMPLES; i++) {
        const angle = (i / SAMPLES) * Math.PI * 2 - Math.PI / 2
        const dx = Math.cos(angle)
        const dy = Math.sin(angle)
        let inner = 0
        let outer = 52
        for (let step = 0; step < 18; step++) {
            const mid = (inner + outer) / 2
            if (inside({ x: dx * mid, y: dy * mid })) inner = mid
            else outer = mid
        }
        distances.push(inner)
    }
    profileCache.set(shape, distances)
    return distances
}

function outlinePath(distances: number[]): string {
    let d = ""
    for (let i = 0; i < distances.length; i++) {
        const angle = (i / distances.length) * Math.PI * 2 - Math.PI / 2
        const x = CENTER + Math.cos(angle) * distances[i]
        const y = CENTER + Math.sin(angle) * distances[i]
        d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    }
    return d + "Z"
}

// Ease out with a small overshoot so a morph lands with a settle
const easeOutSettle = (u: number): number => {
    const s = 1.3
    const v = u - 1
    return 1 + (s + 1) * v * v * v + s * v * v
}

/**
 * Eye Tracker
 * A body with two eyes that turns to follow the cursor. The eyes
 * sit on a sphere, so the one nearer the edge shrinks and narrows
 * as it turns away. Blinks on its own, can idle and glance around,
 * and morphs smoothly between shapes.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 */
export default function EyeTracker(props: Props) {
    const {
        shape = "Cube",
        eyeStyle = "Slant",
        follow = 60,
        bounce = 30,
        reach = 240,
        idle = false,
        blink = true,
        eyeScale = 1,
        eyeWidth = 1,
        eyeHeight = 1,
        eyeRound = 1,
        bodyColor = "#1C1C1E",
        eyeColor = "#FFFFFF",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()

    const rootRef = useRef<HTMLDivElement>(null)
    const bodyRef = useRef<SVGPathElement>(null)
    const clipRef = useRef<SVGPathElement>(null)
    const eyeRefs = useRef<(SVGRectElement | null)[]>([null, null])
    const groupRefs = useRef<(SVGGElement | null)[]>([null, null])

    const inView = useInView(rootRef, { amount: 0 })
    const [pageVisible, setPageVisible] = useState(true)
    const active = !isStatic && inView && pageVisible

    const clipId = `eye-clip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    // Eye size from the preset and the panel multipliers
    const preset = EYE_PRESETS[eyeStyle] ?? EYE_PRESETS.Slant
    const eye: EyeSize = {
        w: preset.w * eyeScale * eyeWidth,
        h: preset.h * eyeScale * eyeHeight,
        r: preset.r * eyeScale * eyeWidth * eyeRound,
    }

    // Latest settings, read by the loop without restarting it
    const settings = useRef({
        follow,
        bounce,
        reach,
        eyeScale,
        eye,
        still: false,
    })
    settings.current = {
        follow,
        bounce,
        reach,
        eyeScale,
        eye,
        still: !!reduceMotion || isStatic,
    }

    const motion = useRef<Motion>({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        tx: 0,
        ty: 0,
        blinkAt: -Infinity,
        raf: 0,
        last: 0,
    })

    /* ── Draw the eyes for the current turn ───────────────── */
    const drawEyes = (now: number) => {
        const m = motion.current
        const cfg = settings.current

        // Lid: a quick squash down and back up
        const sinceBlink = now - m.blinkAt
        const lid =
            sinceBlink >= 0 && sinceBlink < BLINK_MS
                ? 1 - 0.9 * Math.sin((sinceBlink / BLINK_MS) * Math.PI)
                : 1

        // The face direction becomes a rotation of the sphere
        const yaw = Math.asin(clamp(m.x, -MAX_TURN, MAX_TURN))
        const pitch = -Math.asin(clamp(m.y, -MAX_TURN, MAX_TURN))
        const cosYaw = Math.cos(yaw)
        const sinYaw = Math.sin(yaw)
        const cosPitch = Math.cos(pitch)
        const sinPitch = Math.sin(pitch)

        const lean = LEAN * m.x * m.y
        const spread = EYE_SPREAD * Math.max(1, cfg.eyeScale * 0.8)

        for (let side = 0; side < 2; side++) {
            const group = groupRefs.current[side]
            const rect = eyeRefs.current[side]
            if (!group || !rect) continue

            // Eye resting on the front of the sphere, left or right
            const ex = side === 0 ? -spread : spread
            const ez = Math.sqrt(1 - ex * ex)

            // Turn left and right, then up and down
            const afterYawX = ex * cosYaw + ez * sinYaw
            const afterYawZ = -ex * sinYaw + ez * cosYaw
            const screenY = -afterYawZ * sinPitch
            const depth = afterYawZ * cosPitch

            // Further round the sphere: smaller, and narrower still
            const facing = clamp(depth, 0, 1)
            const scale = 0.45 + 0.55 * facing
            const squeeze = scale * (0.7 + 0.3 * facing)

            // Size written directly so corners never stretch
            const w = cfg.eye.w * squeeze
            const h = Math.max(0.6, cfg.eye.h * scale * lid)
            rect.setAttribute("x", (-w / 2).toFixed(2))
            rect.setAttribute("y", (-h / 2).toFixed(2))
            rect.setAttribute("width", w.toFixed(2))
            rect.setAttribute("height", h.toFixed(2))
            rect.setAttribute(
                "rx",
                Math.min(cfg.eye.r, w / 2, h / 2).toFixed(2)
            )

            const px = CENTER + afterYawX * RADIUS
            const py = CENTER + screenY * RADIUS
            group.setAttribute(
                "transform",
                `translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${lean.toFixed(2)})`
            )
            group.style.opacity = depth < 0.05 ? "0" : "1"
        }
    }

    /* ── Animation loop: runs only while something moves ──── */
    const step = (now: number) => {
        const m = motion.current
        const cfg = settings.current
        const dt = m.last ? Math.min(2.5, (now - m.last) / 16.67) : 1
        m.last = now

        if (cfg.still) {
            m.x = m.tx
            m.y = m.ty
            m.vx = m.vy = 0
        } else {
            // One spring for both axes, measured in 60fps frames
            const pull = 0.06
            const damping = 0.34 - (clamp(cfg.bounce, 0, 100) / 100) * 0.22
            m.vx += ((m.tx - m.x) * pull - m.vx * damping) * dt
            m.vy += ((m.ty - m.y) * pull - m.vy * damping) * dt
            m.x += m.vx * dt
            m.y += m.vy * dt
        }

        drawEyes(now)

        const resting =
            Math.abs(m.tx - m.x) < 0.0005 &&
            Math.abs(m.ty - m.y) < 0.0005 &&
            Math.abs(m.vx) < 0.0005 &&
            Math.abs(m.vy) < 0.0005
        const blinking = now - m.blinkAt < BLINK_MS

        if (resting && !blinking) {
            m.x = m.tx
            m.y = m.ty
            m.vx = m.vy = 0
            m.raf = 0
            m.last = 0
            drawEyes(now)
            return
        }
        m.raf = requestAnimationFrame(step)
    }

    const wake = () => {
        const m = motion.current
        if (m.raf) return
        m.last = 0
        m.raf = requestAnimationFrame(step)
    }

    // Track whether the tab is visible
    useEffect(() => {
        if (typeof document === "undefined") return
        const update = () =>
            setPageVisible(document.visibilityState === "visible")
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])

    // Redraw whenever the eye settings change
    useLayoutEffect(() => {
        drawEyes(typeof performance !== "undefined" ? performance.now() : 0)
    }, [eyeStyle, eyeScale, eyeWidth, eyeHeight, eyeRound])

    /* ── Watching, idling and blinking ─────────────────────
       Everything here only exists while the component is on
       screen, the tab is visible, and it is not a static render. */
    useEffect(() => {
        const m = motion.current

        if (!active) {
            if (m.raf) cancelAnimationFrame(m.raf)
            m.raf = 0
            m.tx = m.ty = 0
            m.x = m.y = m.vx = m.vy = 0
            drawEyes(0)
            return
        }

        const timers: number[] = []
        const later = (fn: () => void, ms: number) => {
            timers.push(window.setTimeout(fn, ms))
        }

        // Blinks: regular when idle, irregular when following
        if (blink) {
            const nextGap = () => (idle ? 2000 : 2600 + Math.random() * 3200)
            const doBlink = () => {
                m.blinkAt = performance.now()
                wake()
                later(doBlink, nextGap())
            }
            later(doBlink, 2200)
        }

        const lookHome = () => {
            m.tx = 0
            m.ty = 0
            wake()
        }

        // Idle: face forward, glance somewhere every five seconds
        if (idle) {
            const glance = () => {
                const angle = Math.random() * Math.PI * 2
                const distance = 0.45 + Math.random() * 0.25
                m.tx = Math.cos(angle) * distance
                m.ty = Math.sin(angle) * distance
                wake()
                later(() => {
                    lookHome()
                    later(glance, 4100)
                }, 900)
            }
            lookHome()
            later(glance, 5000)
            return () => {
                timers.forEach((t) => window.clearTimeout(t))
                if (m.raf) cancelAnimationFrame(m.raf)
                m.raf = 0
            }
        }

        // Following: point the face toward the cursor
        const onMove = (e: PointerEvent) => {
            const el = rootRef.current
            if (!el) return
            const box = el.getBoundingClientRect()
            const dx = e.clientX - (box.left + box.width / 2)
            const dy = e.clientY - (box.top + box.height / 2)
            const dist = Math.hypot(dx, dy) || 1
            const cfg = settings.current
            const amount = Math.min(
                MAX_REACH,
                Math.tanh(dist / Math.max(40, cfg.reach)) *
                    (clamp(cfg.follow, 0, 100) / 100) *
                    1.5
            )
            m.tx = (dx / dist) * amount
            m.ty = (dy / dist) * amount
            wake()
        }

        window.addEventListener("pointermove", onMove, { passive: true })
        document.documentElement.addEventListener("pointerleave", lookHome)

        return () => {
            timers.forEach((t) => window.clearTimeout(t))
            window.removeEventListener("pointermove", onMove)
            document.documentElement.removeEventListener(
                "pointerleave",
                lookHome
            )
            if (m.raf) cancelAnimationFrame(m.raf)
            m.raf = 0
        }
    }, [active, idle, blink])

    /* ── Shape morph ───────────────────────────────────────
       A new shape blends from the outline currently on screen to
       the new one in about half a second. */
    const shownOutline = useRef<number[]>(profileOf(shape))
    const lastShape = useRef<ShapeName>(shape)

    useLayoutEffect(() => {
        if (lastShape.current === shape) return
        lastShape.current = shape
        const from = shownOutline.current
        const to = profileOf(shape)

        const apply = (distances: number[]) => {
            shownOutline.current = distances
            const d = outlinePath(distances)
            bodyRef.current?.setAttribute("d", d)
            clipRef.current?.setAttribute("d", d)
        }

        if (settings.current.still || !active) {
            apply(to)
            return
        }

        const startTime = performance.now()
        let frame = 0
        const morph = (now: number) => {
            const u = Math.min(1, (now - startTime) / MORPH_MS)
            const e = easeOutSettle(u)
            apply(from.map((a, i) => a + (to[i] - a) * e))
            if (u < 1) frame = requestAnimationFrame(morph)
        }
        frame = requestAnimationFrame(morph)
        return () => {
            cancelAnimationFrame(frame)
            apply(to)
        }
    }, [shape])

    const outline = outlinePath(shownOutline.current)

    // Fit passes no size in, so fall back to the default size
    const frameWidth = style?.width ?? 100
    const frameHeight = style?.height ?? 100

    return (
        <div
            ref={rootRef}
            role="img"
            aria-label="A character with two eyes that follows the cursor"
            style={{
                ...style,
                width: frameWidth,
                height: frameHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                style={{ display: "block", overflow: "visible" }}
            >
                <defs>
                    <clipPath id={clipId}>
                        <path ref={clipRef} d={outline} />
                    </clipPath>
                </defs>
                <path ref={bodyRef} d={outline} fill={bodyColor} />
                <g clipPath={`url(#${clipId})`}>
                    {[0, 1].map((i) => (
                        <g
                            key={i}
                            ref={(node) => {
                                groupRefs.current[i] = node
                            }}
                            transform={`translate(${CENTER + (i === 0 ? -1 : 1) * EYE_SPREAD * RADIUS} ${CENTER})`}
                        >
                            <rect
                                ref={(node) => {
                                    eyeRefs.current[i] = node
                                }}
                                x={-eye.w / 2}
                                y={-eye.h / 2}
                                width={eye.w}
                                height={eye.h}
                                rx={Math.min(eye.r, eye.w / 2, eye.h / 2)}
                                fill={eyeColor}
                            />
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    )
}

EyeTracker.displayName = "Eye Tracker"

addPropertyControls(EyeTracker, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: SHAPES,
        optionTitles: SHAPES,
        defaultValue: "Cube",
    },
    eyeStyle: {
        type: ControlType.Enum,
        title: "Eyes",
        options: EYE_STYLES,
        optionTitles: EYE_STYLES,
        defaultValue: "Slant",
        displaySegmentedControl: true,
    },
    idle: {
        type: ControlType.Boolean,
        title: "Mode",
        defaultValue: false,
        enabledTitle: "Idle",
        disabledTitle: "Follow",
        description: "Idle looks ahead and glances around every few seconds",
    },
    follow: {
        type: ControlType.Number,
        title: "Follow",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        description: "How far the face turns toward the cursor",
        hidden: (p: Props) => !!p.idle,
    },
    reach: {
        type: ControlType.Number,
        title: "Reach",
        defaultValue: 240,
        min: 40,
        max: 1200,
        step: 20,
        unit: "px",
        description: "Cursor distance at which the eyes reach the edge",
        hidden: (p: Props) => !!p.idle,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
        description: "How much the turn overshoots before settling",
    },
    blink: { type: ControlType.Boolean, title: "Blink", defaultValue: true },
    eyeScale: {
        type: ControlType.Number,
        title: "Eye Scale",
        defaultValue: 1,
        min: 0.4,
        max: 2.5,
        step: 0.05,
    },
    eyeWidth: {
        type: ControlType.Number,
        title: "Eye Width",
        defaultValue: 1,
        min: 0.3,
        max: 2.5,
        step: 0.05,
    },
    eyeHeight: {
        type: ControlType.Number,
        title: "Eye Height",
        defaultValue: 1,
        min: 0.3,
        max: 2.5,
        step: 0.05,
    },
    eyeRound: {
        type: ControlType.Number,
        title: "Eye Round",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        description: "1 is fully round, lower squares off the corners",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body",
        defaultValue: "#1C1C1E",
    },
    eyeColor: {
        type: ControlType.Color,
        title: "Eyes Color",
        defaultValue: "#FFFFFF",
    },
})
