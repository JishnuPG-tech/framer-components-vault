// Made with 💛 by Karim Saif
import * as React from "react"
import { useEffect, useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Polarity = "attract" | "repel"

type Options = {
    particleColor: string
    count: number
    particleSize: number
    pullStrength: number
    magnetRange: number
    polarity: Polarity
    clickBurst: boolean
    burstPower: number
    touch: boolean
    respectReducedMotion: boolean
}

type Props = Options & { style?: React.CSSProperties }

const PI = Math.PI

const seeded = (seed: number) => {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const wrapAxial = (d: number) => ((((d + PI / 2) % PI) + PI) % PI) - PI / 2

const fieldAngle = (dx: number, dy: number) => {
    const d = Math.hypot(dx, dy) || 1
    const rx = dx / d
    const ry = dy / d
    return Math.atan2(3 * rx * ry, 3 * rx * rx - 1)
}

function initDust(root: HTMLElement, canvas: HTMLCanvasElement, O: Options) {
    const noop = { destroy() {} }
    if (typeof window === "undefined" || !window.matchMedia) return noop
    const ctx = canvas.getContext("2d")
    if (!ctx) return noop
    const still =
        O.respectReducedMotion &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const probe = canvas.style.color
    canvas.style.color = O.particleColor
    const color = getComputedStyle(canvas).color || "#3a3f4b"
    canvas.style.color = probe

    let alive = true
    let visible = true
    let raf = 0
    let last = 0
    let W = 1
    let H = 1
    let dpr = 1
    let n = 0
    let hx = new Float32Array(0)
    let hy = new Float32Array(0)
    let px = new Float32Array(0)
    let py = new Float32Array(0)
    let vx = new Float32Array(0)
    let vy = new Float32Array(0)
    let ang = new Float32Array(0)
    let rest = new Float32Array(0)
    let mx = -1e9
    let my = -1e9
    let inside = false
    let lastMove = 0
    const pol = O.polarity === "repel" ? -1 : 1
    const R = Math.max(20, O.magnetRange)

    function build() {
        W = Math.max(1, root.clientWidth)
        H = Math.max(1, root.clientHeight)
        dpr = Math.min(2, window.devicePixelRatio || 1)
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
        n = Math.max(1, Math.min(2000, Math.round(O.count)))
        const cols = Math.max(1, Math.round(Math.sqrt((n * W) / H)))
        const rows = Math.max(1, Math.ceil(n / cols))
        const cw = W / cols
        const ch = H / rows
        const rnd = seeded(7)
        hx = new Float32Array(n)
        hy = new Float32Array(n)
        rest = new Float32Array(n)
        for (let i = 0; i < n; i++) {
            const c = i % cols
            const r = Math.floor(i / cols)
            hx[i] = (c + 0.5 + (rnd() - 0.5) * 0.8) * cw
            hy[i] = (r + 0.5 + (rnd() - 0.5) * 0.8) * ch
            rest[i] = rnd() * PI
        }
        px = Float32Array.from(hx)
        py = Float32Array.from(hy)
        vx = new Float32Array(n)
        vy = new Float32Array(n)
        ang = Float32Array.from(rest)
        draw()
        if (!still) wake()
    }

    function draw() {
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx!.clearRect(0, 0, W, H)
        ctx!.strokeStyle = color
        ctx!.lineWidth = Math.max(1, O.particleSize * 0.14)
        ctx!.lineCap = "round"
        const half = O.particleSize / 2
        ctx!.beginPath()
        for (let i = 0; i < n; i++) {
            const c = Math.cos(ang[i]) * half
            const s = Math.sin(ang[i]) * half
            ctx!.moveTo(px[i] - c, py[i] - s)
            ctx!.lineTo(px[i] + c, py[i] + s)
        }
        ctx!.stroke()
    }

    function frame(now: number) {
        raf = 0
        if (!alive) return
        const dt = Math.min((now - (last || now)) / 1000, 1 / 30)
        last = now
        const pull = O.pullStrength * R * 0.3
        let energy = 0
        const k = 70
        const c = 11
        for (let i = 0; i < n; i++) {
            let tx = hx[i]
            let ty = hy[i]
            let ta = rest[i]
            let w = 0
            if (inside) {
                const dx = mx - px[i]
                const dy = my - py[i]
                const d = Math.hypot(dx, dy)
                if (d < R) {
                    const f = 1 - d / R
                    w = f * f
                    const off = Math.min(pull * w * 3, d * 0.85) * pol
                    const inv = 1 / (d || 1)
                    tx = hx[i] + dx * inv * off
                    ty = hy[i] + dy * inv * off
                    ta = fieldAngle(mx - hx[i], my - hy[i])
                }
            }
            const ax = k * (tx - px[i]) - c * vx[i]
            const ay = k * (ty - py[i]) - c * vy[i]
            vx[i] += ax * dt
            vy[i] += ay * dt
            px[i] += vx[i] * dt
            py[i] += vy[i] * dt
            const blend = w > 0.005 ? Math.min(1, Math.sqrt(w) * 1.6) : 0
            const goal =
                blend > 0 ? rest[i] + wrapAxial(ta - rest[i]) * blend : rest[i]
            ang[i] += wrapAxial(goal - ang[i]) * Math.min(1, dt * 14)
            energy +=
                vx[i] * vx[i] +
                vy[i] * vy[i] +
                (tx - px[i]) * (tx - px[i]) +
                (ty - py[i]) * (ty - py[i])
        }
        draw()
        if (
            (energy > n * 0.001 || (inside && now - lastMove < 500)) &&
            alive &&
            visible &&
            !document.hidden
        )
            raf = requestAnimationFrame(frame)
    }

    function wake() {
        if (alive && !still && !raf && visible && !document.hidden) {
            last = 0
            raf = requestAnimationFrame(frame)
        }
    }

    function local(e: PointerEvent) {
        const r = root.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        const ok = x >= 0 && y >= 0 && x <= r.width && y <= r.height
        return { x, y, ok }
    }

    const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" && !O.touch) return
        const p = local(e)
        if (!p.ok) {
            inside = false
            wake()
            return
        }
        inside = true
        mx = p.x
        my = p.y
        lastMove = performance.now()
        wake()
    }

    const onDown = (e: PointerEvent) => {
        if (e.pointerType === "touch" && !O.touch) return
        const p = local(e)
        if (!p.ok) return
        onMove(e)
        if (!O.clickBurst) return
        const power = 120 + O.burstPower * 1100
        const reach = R * 1.4
        const rnd = Math.random
        for (let i = 0; i < n; i++) {
            const dx = px[i] - p.x
            const dy = py[i] - p.y
            const d = Math.hypot(dx, dy)
            if (d > reach) continue
            const f = 1 - d / reach
            const inv = 1 / (d || 1)
            const j = power * f * (0.6 + rnd() * 0.8)
            vx[i] += dx * inv * j + (rnd() - 0.5) * power * 0.15
            vy[i] += dy * inv * j + (rnd() - 0.5) * power * 0.15
            ang[i] += (rnd() - 0.5) * PI
        }
        lastMove = performance.now()
        wake()
    }

    const onLeave = () => {
        inside = false
        wake()
    }

    const ro =
        typeof ResizeObserver === "undefined" ? null : new ResizeObserver(build)
    if (ro) ro.observe(root)
    const io =
        typeof IntersectionObserver === "undefined"
            ? null
            : new IntersectionObserver((list) => {
                  visible = list[list.length - 1].isIntersecting
                  if (visible) wake()
              })
    if (io) io.observe(root)

    if (!still) {
        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("pointerdown", onDown, { passive: true })
        document.addEventListener("mouseleave", onLeave)
        window.addEventListener("blur", onLeave)
    }
    build()

    return {
        destroy() {
            if (!alive) return
            alive = false
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerdown", onDown)
            document.removeEventListener("mouseleave", onLeave)
            window.removeEventListener("blur", onLeave)
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        },
    }
}

export default function MagnetDust(props: Props) {
    const {
        particleColor,
        count,
        particleSize,
        pullStrength,
        magnetRange,
        polarity,
        clickBurst,
        burstPower,
        touch,
        respectReducedMotion,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()
    const target = RenderTarget.current()
    const isEditor =
        isStatic ||
        target === RenderTarget.canvas ||
        target === RenderTarget.thumbnail ||
        target === RenderTarget.export

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (isEditor || !root || !canvas) return
        const dust = initDust(root, canvas, {
            particleColor,
            count,
            particleSize,
            pullStrength,
            magnetRange,
            polarity,
            clickBurst,
            burstPower,
            touch,
            respectReducedMotion,
        })
        return () => dust.destroy()
    }, [
        isEditor,
        particleColor,
        count,
        particleSize,
        pullStrength,
        magnetRange,
        polarity,
        clickBurst,
        burstPower,
        touch,
        respectReducedMotion,
    ])

    const preview = useMemo(() => {
        if (!isEditor) return null
        const rnd = seeded(7)
        const total = Math.min(420, Math.max(40, Math.round(count)))
        const cols = Math.round(Math.sqrt(total * 1.55))
        const rows = Math.ceil(total / cols)
        const half = particleSize / 2
        let d = ""
        for (let i = 0; i < total; i++) {
            const c = i % cols
            const r = Math.floor(i / cols)
            const x = ((c + 0.5 + (rnd() - 0.5) * 0.8) / cols) * 400
            const y = ((r + 0.5 + (rnd() - 0.5) * 0.8) / rows) * 260
            const near = Math.hypot(x - 200, y - 130) < 130
            const a = near ? fieldAngle(x - 200, y - 130) : rnd() * PI
            const cx = Math.cos(a) * half
            const cy = Math.sin(a) * half
            d += `M${(x - cx).toFixed(1)} ${(y - cy).toFixed(1)}L${(x + cx).toFixed(1)} ${(y + cy).toFixed(1)}`
        }
        return d
    }, [isEditor, count, particleSize])

    const base: React.CSSProperties = {
        ...style,
        position: "relative",
        overflow: "hidden",
        pointerEvents: "none",
    }

    if (isEditor) {
        return (
            <div style={base}>
                <svg
                    aria-hidden="true"
                    width="100%"
                    height="100%"
                    viewBox="0 0 400 260"
                    preserveAspectRatio="xMidYMid slice"
                    style={{ position: "absolute", inset: 0 }}
                >
                    <path
                        d={preview || ""}
                        fill="none"
                        stroke={particleColor}
                        strokeWidth={Math.max(1, particleSize * 0.14)}
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        )
    }

    return (
        <div ref={rootRef} style={base}>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}

MagnetDust.displayName = "Magnet Dust"

MagnetDust.defaultProps = {
    width: 400,
    height: 260,
    particleColor: "#3A3F4B",
    count: 700,
    particleSize: 12,
    pullStrength: 0.6,
    magnetRange: 200,
    polarity: "attract",
    clickBurst: true,
    burstPower: 0.6,
    touch: true,
    respectReducedMotion: true,
}

addPropertyControls(MagnetDust, {
    particleColor: {
        type: ControlType.Color,
        title: "Particle Color",
        defaultValue: "#3A3F4B",
        description:
            "Color of the tiny iron filings. Dark gray looks like real iron dust on a light background, light colors work on dark backgrounds.",
    },
    count: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 700,
        min: 50,
        max: 2000,
        step: 50,
        description:
            "How many filings cover the frame. More filings make the field lines clearer but use more power on slower devices.",
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 12,
        min: 4,
        max: 30,
        step: 1,
        unit: "px",
        description:
            "Length of each filing. Short ones look like fine dust, long ones look like needles.",
    },
    pullStrength: {
        type: ControlType.Number,
        title: "Pull Strength",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "How strongly the pointer pulls the filings toward it. At zero they only rotate to line up with the field.",
    },
    magnetRange: {
        type: ControlType.Number,
        title: "Magnet Range",
        defaultValue: 200,
        min: 60,
        max: 500,
        step: 10,
        unit: "px",
        description:
            "How far from the pointer the magnet reaches. Larger ranges create wide, sweeping field lines.",
    },
    polarity: {
        type: ControlType.Enum,
        title: "Polarity",
        defaultValue: "attract",
        options: ["attract", "repel"],
        optionTitles: ["Attract", "Repel"],
        displaySegmentedControl: true,
        description:
            "Attract pulls the filings toward the pointer. Repel pushes them away and leaves a clear hole around it.",
    },
    clickBurst: {
        type: ControlType.Boolean,
        title: "Click Burst",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Clicking or tapping throws the nearby filings outward, and they settle back into place afterward.",
    },
    burstPower: {
        type: ControlType.Number,
        title: "Burst Power",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.clickBurst,
        description:
            "How hard the burst throws the filings. Low values give a small nudge, high values scatter them across the frame.",
    },
    touch: {
        type: ControlType.Boolean,
        title: "Touch",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Lets a finger act as the magnet on phones and tablets. Turn off to use the effect with a mouse or pen only.",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
    },
})
