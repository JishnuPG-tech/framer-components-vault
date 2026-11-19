import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

// Made with 💛 by Karim Saif

interface Props {
    spacing: number
    interactive: boolean
    seed: number
    dotColor: string
    backgroundColor: string
    dotOpacity: number
    dotSize: number
    noiseScale: number
    noiseSpeed: number
    pointerRadius: number
    pointerStrength: number
    shockwaveStrength: number
    shockwaveSpeed: number
    maxDpr: number
    style?: React.CSSProperties
}

interface Shock {
    x: number
    y: number
    age: number
}

interface Pointer {
    x: number
    y: number
    lastX: number
    lastY: number
    inside: boolean
}

interface Field {
    cols: number
    rows: number
    spacing: number
    originX: number
    originY: number
    tone: Float32Array
    coarse: Float32Array
    ox: Float32Array
    oy: Float32Array
    vx: Float32Array
    vy: Float32Array
    ax: Float32Array
    ay: Float32Array
}

const ANCHOR = 26
const COUPLING = 340
const DAMPING = 2.4
const STEP = 1 / 120
const TONE_STEP = 3
const SHOCK_WIDTH = 34
const SHOCK_LIFE = 1.3
const POINTER_MAX_SPEED = 2600
const POINTER_PART = 0.45
const BUCKETS = 10

function createNoise(seed: number) {
    const p = Array.from({ length: 256 }, (_, i) => i)
    let state = seed >>> 0 || 1

    const random = () => {
        state = (state * 1664525 + 1013904223) >>> 0
        return state / 4294967296
    }

    for (let i = 255; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[p[i], p[j]] = [p[j], p[i]]
    }

    const perm = new Uint8Array(512)

    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255]
    }

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const grad = (hash: number, x: number, y: number, z: number) => {
        const h = hash & 15
        const u = h < 8 ? x : y
        let v = z

        if (h < 4) v = y
        else if (h === 12 || h === 14) v = x

        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
    }

    return (x: number, y: number, z: number) => {
        const X = Math.floor(x) & 255
        const Y = Math.floor(y) & 255
        const Z = Math.floor(z) & 255

        const fx = x - Math.floor(x)
        const fy = y - Math.floor(y)
        const fz = z - Math.floor(z)

        const u = fade(fx)
        const v = fade(fy)
        const w = fade(fz)

        const A = perm[X] + Y
        const AA = perm[A] + Z
        const AB = perm[A + 1] + Z
        const B = perm[X + 1] + Y
        const BA = perm[B] + Z
        const BB = perm[B + 1] + Z

        return lerp(
            lerp(
                lerp(
                    grad(perm[AA], fx, fy, fz),
                    grad(perm[BA], fx - 1, fy, fz),
                    u
                ),
                lerp(
                    grad(perm[AB], fx, fy - 1, fz),
                    grad(perm[BB], fx - 1, fy - 1, fz),
                    u
                ),
                v
            ),
            lerp(
                lerp(
                    grad(perm[AA + 1], fx, fy, fz - 1),
                    grad(perm[BA + 1], fx - 1, fy, fz - 1),
                    u
                ),
                lerp(
                    grad(perm[AB + 1], fx, fy - 1, fz - 1),
                    grad(perm[BB + 1], fx - 1, fy - 1, fz - 1),
                    u
                ),
                v
            ),
            w
        )
    }
}

function createField(width: number, height: number, spacing: number): Field {
    const cols = Math.ceil(width / spacing) + 3
    const rows = Math.ceil(height / spacing) + 3
    const size = cols * rows

    const coarseCols = Math.ceil((cols - 1) / TONE_STEP) + 1
    const coarseRows = Math.ceil((rows - 1) / TONE_STEP) + 1

    return {
        cols,
        rows,
        spacing,
        originX: (width - (cols - 1) * spacing) / 2,
        originY: (height - (rows - 1) * spacing) / 2,
        tone: new Float32Array(size),
        coarse: new Float32Array(coarseCols * coarseRows),
        ox: new Float32Array(size),
        oy: new Float32Array(size),
        vx: new Float32Array(size),
        vy: new Float32Array(size),
        ax: new Float32Array(size),
        ay: new Float32Array(size),
    }
}

function sampleTone(
    field: Field,
    noise: (x: number, y: number, z: number) => number,
    time: number,
    noiseScale: number,
    noiseSpeed: number
) {
    const { cols, rows, spacing, originX, originY, tone, coarse } = field

    const z = time * noiseSpeed
    const step = spacing * TONE_STEP

    const coarseCols = Math.ceil((cols - 1) / TONE_STEP) + 1
    const coarseRows = Math.ceil((rows - 1) / TONE_STEP) + 1

    for (let j = 0; j < coarseRows; j++) {
        const ny = (originY + j * step) / noiseScale

        for (let i = 0; i < coarseCols; i++) {
            const nx = (originX + i * step) / noiseScale

            const n =
                noise(nx, ny, z) * 0.75 +
                noise(nx * 2.1 + 9.3, ny * 2.1 + 3.7, z * 1.3) * 0.25

            coarse[j * coarseCols + i] = Math.max(0, Math.min(1, 0.5 + n * 1.1))
        }
    }

    for (let j = 0; j < rows; j++) {
        const cj = Math.min(Math.floor(j / TONE_STEP), coarseRows - 2)

        const fy = j / TONE_STEP - cj

        for (let i = 0; i < cols; i++) {
            const ci = Math.min(Math.floor(i / TONE_STEP), coarseCols - 2)

            const fx = i / TONE_STEP - ci
            const a = cj * coarseCols + ci

            const top = coarse[a] + (coarse[a + 1] - coarse[a]) * fx

            const bottom =
                coarse[a + coarseCols] +
                (coarse[a + coarseCols + 1] - coarse[a + coarseCols]) * fx

            tone[j * cols + i] = top + (bottom - top) * fy
        }
    }
}

function neighbours(values: Float32Array, field: Field, i: number, j: number) {
    const { cols, rows } = field
    const k = j * cols + i

    let sum = 0

    if (i > 0) sum += values[k - 1]
    if (i < cols - 1) sum += values[k + 1]
    if (j > 0) sum += values[k - cols]
    if (j < rows - 1) sum += values[k + cols]

    return sum
}

function accelerate(field: Field) {
    const { cols, rows, ox, oy, vx, vy, ax, ay } = field

    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const k = j * cols + i

            const sx = neighbours(ox, field, i, j)
            const sy = neighbours(oy, field, i, j)

            ax[k] +=
                -ANCHOR * ox[k] + COUPLING * (sx - 4 * ox[k]) - DAMPING * vx[k]

            ay[k] +=
                -ANCHOR * oy[k] + COUPLING * (sy - 4 * oy[k]) - DAMPING * vy[k]
        }
    }
}

function applyShocks(
    field: Field,
    shocks: Shock[],
    strength: number,
    speed: number
) {
    const { cols, rows, spacing, originX, originY, ax, ay } = field

    for (const shock of shocks) {
        const reach = shock.age * speed
        const fade = 1 - shock.age / SHOCK_LIFE
        const force = strength * fade * fade

        const outer = reach + SHOCK_WIDTH
        const inner = Math.max(0, reach - SHOCK_WIDTH)

        const i0 = Math.max(
            0,
            Math.floor((shock.x - outer - originX) / spacing)
        )

        const i1 = Math.min(
            cols - 1,
            Math.ceil((shock.x + outer - originX) / spacing)
        )

        const j0 = Math.max(
            0,
            Math.floor((shock.y - outer - originY) / spacing)
        )

        const j1 = Math.min(
            rows - 1,
            Math.ceil((shock.y + outer - originY) / spacing)
        )

        for (let j = j0; j <= j1; j++) {
            const dy = originY + j * spacing - shock.y

            for (let i = i0; i <= i1; i++) {
                const dx = originX + i * spacing - shock.x
                const dist = Math.hypot(dx, dy)

                if (dist < inner || dist > outer || dist === 0) continue

                const band = 1 - Math.abs(dist - reach) / SHOCK_WIDTH

                const k = j * cols + i

                ax[k] += (dx / dist) * force * band
                ay[k] += (dy / dist) * force * band
            }
        }
    }
}

function applyPointer(
    field: Field,
    pointer: Pointer,
    dt: number,
    radius: number,
    strength: number
) {
    const segX = pointer.x - pointer.lastX
    const segY = pointer.y - pointer.lastY

    pointer.lastX = pointer.x
    pointer.lastY = pointer.y

    const length = Math.hypot(segX, segY)

    if (!pointer.inside || length < 0.5 || dt <= 0) {
        return false
    }

    const speed = Math.min(length / dt, POINTER_MAX_SPEED)

    const pvx = (segX / length) * speed
    const pvy = (segY / length) * speed

    const { cols, rows, spacing, originX, originY, vx, vy } = field

    const startX = pointer.x - segX
    const startY = pointer.y - segY

    const i0 = Math.max(
        0,
        Math.floor((Math.min(startX, pointer.x) - radius - originX) / spacing)
    )

    const i1 = Math.min(
        cols - 1,
        Math.ceil((Math.max(startX, pointer.x) + radius - originX) / spacing)
    )

    const j0 = Math.max(
        0,
        Math.floor((Math.min(startY, pointer.y) - radius - originY) / spacing)
    )

    const j1 = Math.min(
        rows - 1,
        Math.ceil((Math.max(startY, pointer.y) + radius - originY) / spacing)
    )

    const lengthSq = length * length
    const gain = Math.min(1, strength * dt)

    for (let j = j0; j <= j1; j++) {
        const py = originY + j * spacing

        for (let i = i0; i <= i1; i++) {
            const px = originX + i * spacing

            const t = Math.max(
                0,
                Math.min(
                    1,
                    ((px - startX) * segX + (py - startY) * segY) / lengthSq
                )
            )

            const awayX = px - startX - segX * t
            const awayY = py - startY - segY * t

            const dist = Math.hypot(awayX, awayY)

            if (dist >= radius) continue

            const falloff = 1 - dist / radius
            const k = j * cols + i

            const amount = gain * falloff * falloff

            const side = dist > 0 ? (speed * POINTER_PART) / dist : 0

            vx[k] += (pvx + awayX * side - vx[k]) * amount

            vy[k] += (pvy + awayY * side - vy[k]) * amount
        }
    }

    return true
}

function integrate(
    field: Field,
    shocks: Shock[],
    h: number,
    shockStrength: number,
    shockSpeed: number
) {
    const { ox, oy, vx, vy, ax, ay } = field

    ax.fill(0)
    ay.fill(0)

    applyShocks(field, shocks, shockStrength, shockSpeed)

    accelerate(field)

    let moving = false

    for (let k = 0; k < ox.length; k++) {
        vx[k] += ax[k] * h
        vy[k] += ay[k] * h

        ox[k] += vx[k] * h
        oy[k] += vy[k] * h

        if (
            !moving &&
            (Math.abs(vx[k]) > 2 ||
                Math.abs(vy[k]) > 2 ||
                Math.abs(ox[k]) > 0.15 ||
                Math.abs(oy[k]) > 0.15)
        ) {
            moving = true
        }
    }

    return moving
}

function compression(field: Field, i: number, j: number) {
    const { cols, rows, spacing, ox, oy } = field

    const k = j * cols + i

    const left = i > 0 ? ox[k - 1] : 0
    const right = i < cols - 1 ? ox[k + 1] : 0
    const up = j > 0 ? oy[k - cols] : 0
    const down = j < rows - 1 ? oy[k + cols] : 0

    return -(right - left + down - up) / (2 * spacing)
}

function draw(
    ctx: CanvasRenderingContext2D,
    field: Field,
    width: number,
    height: number,
    color: string,
    opacity: number,
    dotSize: number,
    moving: boolean
) {
    const { cols, rows, spacing, originX, originY, tone, ox, oy } = field

    const paths = Array.from({ length: BUCKETS }, () => new Path2D())

    const filled = new Uint8Array(BUCKETS)

    const maxRadius = spacing * 0.42 * dotSize

    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const k = j * cols + i

            let amount = 0.12 + 0.6 * tone[k]

            if (moving) {
                amount *= 1 + 3 * compression(field, i, j)
            }

            const bucket = Math.round(
                Math.max(0, Math.min(1, amount)) * (BUCKETS - 1)
            )

            if (bucket === 0) continue

            const radius = (maxRadius * bucket) / (BUCKETS - 1)

            const x = originX + i * spacing + ox[k]
            const y = originY + j * spacing + oy[k]

            const path = paths[bucket]

            path.moveTo(x + radius, y)
            path.arc(x, y, radius, 0, Math.PI * 2)

            filled[bucket] = 1
        }
    }

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = color

    for (let b = 1; b < BUCKETS; b++) {
        if (!filled[b]) continue

        ctx.globalAlpha = opacity * (0.2 + (0.32 * b) / (BUCKETS - 1))

        ctx.fill(paths[b])
    }

    ctx.globalAlpha = 1
}

export default function KarimSaifInteractiveDotField(props: Props) {
    const {
        spacing,
        interactive,
        seed,
        dotColor,
        backgroundColor,
        dotOpacity,
        dotSize,
        noiseScale,
        noiseSpeed,
        pointerRadius,
        pointerStrength,
        shockwaveStrength,
        shockwaveSpeed,
        maxDpr,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const staticRenderer = useIsStaticRenderer()

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current

        const ctx = canvas?.getContext("2d", {
            alpha: true,
        })

        if (!root || !canvas || !ctx) return

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

        const staticMode = staticRenderer || reducedMotion

        const noise = createNoise(seed)
        const gap = Math.max(6, spacing)

        const size = {
            width: 0,
            height: 0,
        }

        let field = createField(0, 0, gap)

        const pointer: Pointer = {
            x: 0,
            y: 0,
            lastX: 0,
            lastY: 0,
            inside: false,
        }

        const shocks: Shock[] = []

        let time = 0
        let last = 0
        let lastTone = 0
        let carry = 0
        let awake = false
        let raf = 0
        let visible = true
        let onScreen = true
        let destroyed = false

        const resize = () => {
            const rect = canvas.getBoundingClientRect()

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                Math.max(1, maxDpr)
            )

            size.width = rect.width
            size.height = rect.height

            canvas.width = Math.max(1, Math.round(size.width * dpr))

            canvas.height = Math.max(1, Math.round(size.height * dpr))

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            field = createField(size.width, size.height, gap)

            sampleTone(field, noise, time, Math.max(40, noiseScale), noiseSpeed)

            awake = false
            shocks.length = 0
        }

        const render = (moving: boolean) => {
            draw(
                ctx,
                field,
                size.width,
                size.height,
                dotColor,
                Math.max(0, Math.min(1, dotOpacity)),
                Math.max(0.1, dotSize),
                moving
            )
        }

        const physics = (dt: number) => {
            const pushed = applyPointer(
                field,
                pointer,
                dt,
                Math.max(1, pointerRadius),
                Math.max(0, pointerStrength)
            )

            carry = Math.min(carry + dt, STEP * 6)

            while (carry >= STEP) {
                carry -= STEP

                for (const shock of shocks) {
                    shock.age += STEP
                }

                while (shocks.length > 0 && shocks[0].age > SHOCK_LIFE) {
                    shocks.shift()
                }

                awake = integrate(
                    field,
                    shocks,
                    STEP,
                    shockwaveStrength,
                    shockwaveSpeed
                )
            }

            if (!pushed && !awake && shocks.length === 0) {
                field.ox.fill(0)
                field.oy.fill(0)
                field.vx.fill(0)
                field.vy.fill(0)
            }
        }

        const frame = (now: number) => {
            raf = 0

            if (!visible || destroyed) return

            const dt = last ? Math.min((now - last) / 1000, 0.05) : 0

            last = now
            time += dt

            const wasAwake = awake

            if (awake || shocks.length > 0) {
                physics(dt)
            }

            const toneDue = now - lastTone >= 33

            if (toneDue) {
                sampleTone(
                    field,
                    noise,
                    time,
                    Math.max(40, noiseScale),
                    noiseSpeed
                )

                lastTone = now
            }

            if (wasAwake || toneDue) {
                render(wasAwake || shocks.length > 0)
            }

            if (!staticMode) {
                raf = requestAnimationFrame(frame)
            }
        }

        const start = () => {
            if (!raf && visible && !staticMode && !destroyed) {
                last = 0
                raf = requestAnimationFrame(frame)
            }
        }

        const wake = () => {
            awake = true
            carry = 0
            start()
        }

        const redraw = () => {
            resize()
            render(false)
        }

        resize()
        render(false)

        const resizeObserver = new ResizeObserver(redraw)
        resizeObserver.observe(root)

        const updateVisible = () => {
            visible = onScreen && document.visibilityState === "visible"

            if (visible) {
                start()
            } else {
                cancelAnimationFrame(raf)
                raf = 0
                last = 0
            }
        }

        const intersection = new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting
            updateVisible()
        })

        intersection.observe(root)

        document.addEventListener("visibilitychange", updateVisible)

        let dprQuery: MediaQueryList | null = null

        const watchDpr = () => {
            dprQuery?.removeEventListener("change", onDpr)

            dprQuery = window.matchMedia(
                `(resolution: ${window.devicePixelRatio}dppx)`
            )

            dprQuery.addEventListener("change", onDpr)
        }

        const onDpr = () => {
            redraw()
            watchDpr()
        }

        watchDpr()

        const local = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()

            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }
        }

        const onMove = (event: PointerEvent) => {
            const point = local(event)

            if (!pointer.inside) {
                pointer.lastX = point.x
                pointer.lastY = point.y
                pointer.inside = true
            }

            pointer.x = point.x
            pointer.y = point.y

            if (
                Math.abs(pointer.x - pointer.lastX) > 0.5 ||
                Math.abs(pointer.y - pointer.lastY) > 0.5
            ) {
                wake()
            }
        }

        const onLeave = () => {
            pointer.inside = false
        }

        const onDown = (event: PointerEvent) => {
            if (
                event.button !== 0 ||
                (event.target as HTMLElement).closest(
                    "a, button, input, textarea, select, label, [role='button']"
                )
            ) {
                return
            }

            const point = local(event)

            pointer.x = point.x
            pointer.y = point.y
            pointer.lastX = point.x
            pointer.lastY = point.y
            pointer.inside = true

            shocks.push({
                ...point,
                age: 0,
            })

            if (shocks.length > 3) {
                shocks.shift()
            }

            wake()
        }

        if (interactive && !staticMode) {
            root.addEventListener("pointermove", onMove)
            root.addEventListener("pointerleave", onLeave)
            root.addEventListener("pointerdown", onDown)
        }

        if (!staticMode) start()

        return () => {
            destroyed = true

            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            intersection.disconnect()

            dprQuery?.removeEventListener("change", onDpr)

            document.removeEventListener("visibilitychange", updateVisible)

            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onDown)
        }
    }, [
        spacing,
        interactive,
        seed,
        dotColor,
        dotOpacity,
        dotSize,
        noiseScale,
        noiseSpeed,
        pointerRadius,
        pointerStrength,
        shockwaveStrength,
        shockwaveSpeed,
        maxDpr,
        staticRenderer,
    ])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 100,
                overflow: "hidden",
                background: backgroundColor,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                    color: dotColor,
                    maskImage:
                        "radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%)",
                }}
            />
        </div>
    )
}

KarimSaifInteractiveDotField.defaultProps = {
    spacing: 16,
    interactive: true,
    seed: 7,
    dotColor: "#181818",
    backgroundColor: "#FFFFFF",
    dotOpacity: 1,
    dotSize: 1,
    noiseScale: 240,
    noiseSpeed: 0.07,
    pointerRadius: 72,
    pointerStrength: 14,
    shockwaveStrength: 5200,
    shockwaveSpeed: 620,
    maxDpr: 2,
}

addPropertyControls(KarimSaifInteractiveDotField, {
    spacing: {
        type: ControlType.Number,
        title: "Dot Spacing",
        defaultValue: 16,
        min: 6,
        max: 50,
        step: 1,
        description:
            "Controls the distance between dots. Smaller values create a denser dot field.",
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interaction",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Enables cursor movement distortion and click-triggered shockwaves.",
    },
    seed: {
        type: ControlType.Number,
        title: "Pattern Seed",
        defaultValue: 7,
        min: 1,
        max: 9999,
        step: 1,
        description:
            "Changes the procedural noise pattern while keeping it consistent between renders.",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#181818",
        description: "Sets the color of the animated dots.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
        description: "Sets the background color behind the dot field.",
    },
    dotOpacity: {
        type: ControlType.Number,
        title: "Dot Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Controls the overall transparency of the dots.",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 1,
        min: 0.2,
        max: 2,
        step: 0.05,
        description:
            "Scales the radius of every dot without changing grid spacing.",
    },
    noiseScale: {
        type: ControlType.Number,
        title: "Noise Scale",
        defaultValue: 240,
        min: 50,
        max: 800,
        step: 10,
        description:
            "Controls the size of the organic light and dark halftone regions. Higher values create larger regions.",
    },
    noiseSpeed: {
        type: ControlType.Number,
        title: "Noise Speed",
        defaultValue: 0.07,
        min: 0,
        max: 0.5,
        step: 0.01,
        description:
            "Controls how quickly the procedural halftone pattern evolves. Set to zero for a stationary pattern.",
    },
    pointerRadius: {
        type: ControlType.Number,
        title: "Cursor Radius",
        defaultValue: 72,
        min: 10,
        max: 250,
        step: 1,
        description:
            "Sets the area around the cursor that influences nearby dots.",
    },
    pointerStrength: {
        type: ControlType.Number,
        title: "Cursor Strength",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        description:
            "Controls how strongly cursor movement pushes and distorts the dots.",
    },
    shockwaveStrength: {
        type: ControlType.Number,
        title: "Wave Strength",
        defaultValue: 5200,
        min: 500,
        max: 12000,
        step: 100,
        description:
            "Controls the force applied to dots when a click creates a shockwave.",
    },
    shockwaveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 620,
        min: 100,
        max: 1500,
        step: 20,
        description:
            "Sets how quickly the expanding shockwave travels through the dot field.",
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max Pixel Ratio",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.5,
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
    },
})
