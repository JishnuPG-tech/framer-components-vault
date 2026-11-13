/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Color parser ──────────────────────────────────────────────────────────────
function toRGB(c: string): [number, number, number] {
    if (!c) return [140, 60, 255]
    if (c.startsWith("#")) {
        const h = c.replace("#", "")
        if (h.length === 3)
            return [
                parseInt(h[0] + h[0], 16),
                parseInt(h[1] + h[1], 16),
                parseInt(h[2] + h[2], 16),
            ]
        return [
            parseInt(h.slice(0, 2), 16),
            parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16),
        ]
    }
    const m = c.match(/[\d.]+/g)
    return m ? [+m[0], +m[1], +m[2]] : [140, 60, 255]
}

// ── Noise (position-based → fluxo coerente) ───────────────────────────────────
const nh = (n: number) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5
    return s - Math.floor(s)
}
const vn = (x: number, y: number) => {
    const ix = Math.floor(x),
        iy = Math.floor(y),
        fx = x - ix,
        fy = y - iy
    const ux = fx * fx * (3 - 2 * fx),
        uy = fy * fy * (3 - 2 * fy)
    return (
        nh(ix + iy * 57) * (1 - ux) * (1 - uy) +
        nh(ix + 1 + iy * 57) * ux * (1 - uy) +
        nh(ix + (iy + 1) * 57) * (1 - ux) * uy +
        nh(ix + 1 + (iy + 1) * 57) * ux * uy
    )
}
const fbm = (x: number, y: number) =>
    vn(x, y) -
    0.5 +
    (vn(x * 2.1, y * 2.1) - 0.5) * 0.5 +
    (vn(x * 4.3, y * 4.3) - 0.5) * 0.25

// ── Types ─────────────────────────────────────────────────────────────────────
interface Blob {
    ox: number
    oy: number
    bs: number
    rot: number
    rv: number
    sx: number
    sy: number
}
interface Puff {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    life: number
    maxLife: number
    blobs: Blob[]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AuraCursorTrail(props: any) {
    const {
        auraColor = "#9D5CFF",
        intensity = 0.8,
        auraSize = 65,
        turbulence = 0.5,
        drift = 0.4,
        spread = 0.65,
    } = props

    const isStatic = useIsStaticRenderer()
    const inEditor = RenderTarget.current() === RenderTarget.canvas
    const [rdy, setRdy] = useState(false)

    const rootRef = useRef<HTMLDivElement>(null)
    const cvRef = useRef<HTMLCanvasElement>(null)
    const psRef = useRef<Puff[]>([])
    const mRef = useRef({ x: -9999, y: -9999 })
    const rafRef = useRef(0)
    const tRef = useRef(0)
    const lpRef = useRef({ x: -9999, y: -9999 })
    const rgbRef = useRef<[number, number, number]>([140, 60, 255])

    useEffect(() => {
        setRdy(true)
    }, [])
    useEffect(() => {
        rgbRef.current = toRGB(auraColor)
    }, [auraColor])

    useEffect(() => {
        if (!rdy || isStatic || inEditor) return

        const canvas = cvRef.current
        const root = rootRef.current
        if (!canvas || !root) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        // Dimensões do componente em CSS px (atualizadas pelo ResizeObserver)
        let W_css = 0,
            H_css = 0

        // SCOPING FIX: ResizeObserver no elemento do componente
        // (antes: window.addEventListener("resize"))
        function resize() {
            const rect = root.getBoundingClientRect()
            W_css = rect.width
            H_css = rect.height
            canvas.width = Math.round(W_css * dpr)
            canvas.height = Math.round(H_css * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        const ro = new ResizeObserver(resize)
        ro.observe(root)
        resize()

        // SCOPING FIX: mouse em coordenadas locais ao componente
        // (antes: window.addEventListener("mousemove") com coords globais)
        function onMove(e: PointerEvent) {
            const rect = root.getBoundingClientRect()
            mRef.current.x = e.clientX - rect.left
            mRef.current.y = e.clientY - rect.top
        }
        function onLeave() {
            mRef.current.x = -9999
            mRef.current.y = -9999
        }

        function spawnPuff(x: number, y: number) {
            const sz = auraSize * (0.6 + Math.random() * 0.72)
            const nb = 2 + Math.floor(Math.random() * 2)
            const blobs: Blob[] = []
            for (let i = 0; i < nb; i++) {
                const ang = Math.random() * Math.PI * 2
                const d = sz * (0.08 + Math.random() * 0.34) * spread
                blobs.push({
                    ox: Math.cos(ang) * d,
                    oy: Math.sin(ang) * d,
                    bs: sz * (0.65 + Math.random() * 0.72),
                    rot: Math.random() * Math.PI * 2,
                    rv: (Math.random() - 0.5) * 0.006,
                    sx: 0.4 + Math.random() * 0.85,
                    sy: 0.38 + Math.random() * 0.52,
                })
            }
            psRef.current.push({
                x: x + (Math.random() - 0.5) * 14,
                y: y + (Math.random() - 0.5) * 14,
                vx: (Math.random() - 0.5) * 0.55,
                vy: (Math.random() - 0.5) * 0.55 - 0.12,
                size: sz,
                life: 0,
                maxLife: 3.5 + Math.random() * 2.0,
                blobs,
            })
            if (psRef.current.length > 130)
                psRef.current.splice(0, psRef.current.length - 130)
        }

        let lastT = performance.now()

        function loop(now: number) {
            const dt = Math.min((now - lastT) / 1000, 0.05)
            lastT = now
            const dtF = dt * 60
            tRef.current += dt

            const t = tRef.current
            const ps = psRef.current
            const m = mRef.current
            const [cr, cg, cb] = rgbRef.current

            // Limpa na dimensão do componente (não do viewport)
            ctx.clearRect(0, 0, W_css, H_css)

            const dx = m.x - lpRef.current.x,
                dy = m.y - lpRef.current.y
            const d = Math.sqrt(dx * dx + dy * dy)
            if (m.x > -5000 && d > 3) {
                const n = Math.min(4, Math.ceil(d * 0.06) + 1)
                for (let k = 0; k < n; k++) spawnPuff(m.x, m.y)
                lpRef.current = { x: m.x, y: m.y }
            }

            for (let i = ps.length - 1; i >= 0; i--) {
                const p = ps[i]
                const sc = 0.0028
                const nx = fbm(p.x * sc + t * 0.07, p.y * sc)
                const ny = fbm(p.x * sc, p.y * sc + t * 0.07)
                p.vx += (nx * 2 - 1) * turbulence * 0.012 * dtF
                p.vy += (ny * 2 - 1) * turbulence * 0.012 * dtF
                p.vy -= drift * 0.028 * dtF
                const drag = Math.pow(0.972, dtF)
                p.vx *= drag
                p.vy *= drag
                p.x += p.vx * dtF
                p.y += p.vy * dtF
                p.life += dt
                if (p.life >= p.maxLife) {
                    ps.splice(i, 1)
                    continue
                }

                const lifeRatio = 1 - p.life / p.maxLife
                const fadeIn = Math.min(1, p.life * 3.3)
                const alBase =
                    (fadeIn * lifeRatio * intensity * 0.13) / p.blobs.length

                for (const b of p.blobs) {
                    ctx.save()
                    ctx.translate(p.x + b.ox, p.y + b.oy)
                    ctx.rotate(b.rot + b.rv * p.life * 60)
                    ctx.scale(b.sx, b.sy)
                    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.bs)
                    g.addColorStop(0, `rgba(${cr},${cg},${cb},${alBase})`)
                    g.addColorStop(
                        0.38,
                        `rgba(${cr},${cg},${cb},${alBase * 0.45})`
                    )
                    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
                    ctx.fillStyle = g
                    ctx.beginPath()
                    ctx.arc(0, 0, b.bs, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        function stopAll() {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
            }
            // SCOPING FIX: remove eventos do elemento, não do window
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            ctx.clearRect(0, 0, W_css, H_css)
        }

        function startAll() {
            root.addEventListener("pointermove", onMove, { passive: true })
            root.addEventListener("pointerleave", onLeave)
            if (!rafRef.current) {
                lastT = performance.now()
                rafRef.current = requestAnimationFrame(loop)
            }
        }

        // SCOPING FIX: IntersectionObserver pausa/resume baseado em visibilidade
        // (antes: animação rodava sempre, mesmo fora do viewport)
        let isVisible = false
        const io = new IntersectionObserver(
            (entries) => {
                isVisible = entries[0]?.isIntersecting ?? false
                isVisible ? startAll() : stopAll()
            },
            { threshold: 0 }
        )
        io.observe(root)

        // Pausa quando tab vai para background
        function onVis() {
            if (document.hidden) {
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current)
                    rafRef.current = 0
                }
            } else if (isVisible) {
                if (!rafRef.current) {
                    lastT = performance.now()
                    rafRef.current = requestAnimationFrame(loop)
                }
            }
        }
        document.addEventListener("visibilitychange", onVis)

        return () => {
            stopAll()
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            psRef.current = []
            lpRef.current = { x: -9999, y: -9999 }
        }
    }, [
        rdy,
        isStatic,
        inEditor,
        intensity,
        auraSize,
        turbulence,
        drift,
        spread,
    ])

    const [cr, cg, cb] = toRGB(auraColor)
    const ui = (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `rgba(${cr},${cg},${cb},.12)`,
                borderRadius: 8,
                border: `1px dashed rgba(${cr},${cg},${cb},.45)`,
                color: `rgba(${cr},${cg},${cb},.85)`,
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: ".08em",
                userSelect: "none",
            }}
        >
            ◈ Aura Trail — drag to cover the desired area
        </div>
    )

    if (!rdy || inEditor) return ui

    // Canvas position:absolute dentro do componente (não fixed, não portal)
    // O efeito cobre exatamente a área definida pelo usuário no Framer
    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={cvRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

AuraCursorTrail.defaultProps = {
    auraColor: "#9D5CFF",
    intensity: 0.8,
    auraSize: 65,
    turbulence: 0.5,
    drift: 0.4,
    spread: 0.65,
}

addPropertyControls(AuraCursorTrail, {
    auraColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#9D5CFF",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.8,
        min: 0.1,
        max: 1.5,
        step: 0.05,
        displayStepper: true,
    },
    auraSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 65,
        min: 20,
        max: 220,
        step: 5,
        unit: "px",
    },
    turbulence: {
        type: ControlType.Number,
        title: "Turbulence",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    drift: {
        type: ControlType.Number,
        title: "Drift ↑",
        defaultValue: 0.4,
        min: 0,
        max: 2,
        step: 0.1,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 0.65,
        min: 0,
        max: 1.5,
        step: 0.05,
        description: "0 = rounder  |  1.5 = more abstract",
    },
})
