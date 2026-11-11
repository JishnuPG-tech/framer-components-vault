import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Mode = "orbit" | "drift"
type Interaction = "off" | "repel" | "attract"
type Tracking = "off" | "global" | "local"

export default function DotBackground(props: {
    mode: Mode
    interaction: Interaction
    tracking: Tracking

    density: number
    speed: number
    dotSize: number
    linkDistance: number

    background: string
    dotColor: string
    lineColor: string

    opacity: number
    alpha: number // multiplier for dot/line alpha (helps on dark BGs)

    interactionRadius: number
    interactionStrength: number

    cursorEase: number // 0–100 UI scale

    style?: React.CSSProperties
}) {
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const mouseRef = useRef({
        targetX: 0,
        targetY: 0,
        x: 0,
        y: 0,
        inside: false,
        hasInit: false,
    })

    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        const speed = isCanvas ? Math.min(props.speed, 0.8) : props.speed

        const prefersReducedMotion =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const motionScale = prefersReducedMotion ? 0.45 : 1.0

        let w = 1
        let h = 1

        const clamp = (v: number, a: number, b: number) =>
            Math.max(a, Math.min(b, v))

        // Map 0–100 to internal lerp factor 0–0.30
        const easeToLerp = (ease: number) =>
            clamp((clamp(ease, 0, 100) / 100) * 0.3, 0, 0.3)

        // Framer Color control can output hex OR rgb/rgba strings.
        const toRgba = (input: string, alpha: number) => {
            const s = (input || "").trim()

            if (s.startsWith("rgba(") || s.startsWith("rgb(")) {
                const nums = s
                    .replace(/rgba?\(/, "")
                    .replace(")", "")
                    .split(",")
                    .map((v) => parseFloat(v.trim()))
                const r = nums[0] ?? 0
                const g = nums[1] ?? 0
                const b = nums[2] ?? 0
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }

            const hx = s.replace("#", "").trim()
            const full =
                hx.length === 3
                    ? hx
                          .split("")
                          .map((c) => c + c)
                          .join("")
                    : hx.slice(0, 6)
            const n = parseInt(full || "000000", 16)
            const r = (n >> 16) & 255
            const g = (n >> 8) & 255
            const b = n & 255
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        const resize = () => {
            const r = wrap.getBoundingClientRect()
            w = Math.max(1, Math.floor(r.width))
            h = Math.max(1, Math.floor(r.height))

            const dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.floor(w * dpr)
            canvas.height = Math.floor(h * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            const m = mouseRef.current
            if (!m.hasInit) {
                m.targetX = w * 0.5
                m.targetY = h * 0.5
                m.x = m.targetX
                m.y = m.targetY
                m.hasInit = true
            }
        }

        const ro = new ResizeObserver(resize)
        ro.observe(wrap)
        resize()

        const rebuildDots = () => {
            const count = clamp(
                Math.floor(((w * h) / 12000) * props.density),
                20,
                320
            )
            const cx = w * 0.5
            const cy = h * 0.5
            return Array.from({ length: count }).map((_, i) => {
                const r = Math.min(w, h) * (0.15 + Math.random() * 0.35)
                const a = Math.random() * Math.PI * 2
                return {
                    i,
                    x: cx + Math.cos(a) * r,
                    y: cy + Math.sin(a) * r,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    baseR: r,
                    baseA: a,
                    phase: Math.random() * Math.PI * 2,
                }
            })
        }

        let dots = rebuildDots()
        let lastArea = w * h

        const onWindowPointerMove = (e: PointerEvent) => {
            if (props.tracking !== "global") return
            const r = wrap.getBoundingClientRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            const inside = x >= 0 && x <= r.width && y >= 0 && y <= r.height

            const m = mouseRef.current
            m.targetX = x
            m.targetY = y
            m.inside = inside
        }

        if (props.tracking === "global") {
            window.addEventListener("pointermove", onWindowPointerMove, {
                passive: true,
            })
        }

        const step = (tMs: number) => {
            const t = (tMs / 1000) * motionScale

            const area = w * h
            if (Math.abs(area - lastArea) / Math.max(1, lastArea) > 0.3) {
                dots = rebuildDots()
                lastArea = area
            }

            // Cursor easing
            const m = mouseRef.current
            const lerp = easeToLerp(props.cursorEase)
            if (lerp > 0) {
                m.x += (m.targetX - m.x) * lerp
                m.y += (m.targetY - m.y) * lerp
            } else {
                m.x = m.targetX
                m.y = m.targetY
            }

            // Background
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = props.background
            ctx.fillRect(0, 0, w, h)

            const cx = w * 0.5
            const cy = h * 0.5

            const interactionEnabled =
                props.interaction !== "off" && props.tracking !== "off"
            const ir = Math.max(10, props.interactionRadius)
            const ir2 = ir * ir
            const strength = props.interactionStrength * motionScale

            const alphaBoost = clamp(props.alpha, 0.2, 3)

            for (const d of dots) {
                if (props.mode === "orbit") {
                    const a =
                        d.baseA +
                        t * speed * 0.7 +
                        Math.sin(t * 0.6 + d.phase) * 0.15
                    const rr =
                        d.baseR * (0.92 + 0.08 * Math.sin(t * 1.2 + d.phase))
                    d.x = cx + Math.cos(a) * rr
                    d.y = cy + Math.sin(a) * rr
                } else {
                    d.x += d.vx * speed * motionScale
                    d.y += d.vy * speed * motionScale
                    if (d.x < -20) d.x = w + 20
                    if (d.x > w + 20) d.x = -20
                    if (d.y < -20) d.y = h + 20
                    if (d.y > h + 20) d.y = -20
                }

                if (interactionEnabled && m.inside) {
                    const dx = d.x - m.x
                    const dy = d.y - m.y
                    const dist2 = dx * dx + dy * dy
                    if (dist2 < ir2) {
                        const dist = Math.sqrt(dist2) || 1
                        const falloff = 1 - dist / ir
                        const dirx = dx / dist
                        const diry = dy / dist
                        const sign = props.interaction === "repel" ? 1 : -1
                        const push = sign * falloff * falloff * strength
                        d.x += dirx * push
                        d.y += diry * push
                    }
                }
            }

            // Links
            const maxD = Math.max(20, props.linkDistance)
            const maxD2 = maxD * maxD
            ctx.lineWidth = 1

            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const a = dots[i]
                    const b = dots[j]
                    const dx = a.x - b.x
                    const dy = a.y - b.y
                    const d2 = dx * dx + dy * dy
                    if (d2 < maxD2) {
                        const d = Math.sqrt(d2)
                        const alpha =
                            (1 - d / maxD) * 0.55 * props.opacity * alphaBoost
                        ctx.strokeStyle = toRgba(
                            props.lineColor,
                            clamp(alpha, 0, 1)
                        )
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.stroke()
                    }
                }
            }

            // Dots
            for (const d of dots) {
                const pulse = 0.8 + 0.2 * Math.sin(t * 2.0 + d.phase)
                const r = Math.max(0.6, props.dotSize * pulse)
                const alpha = 0.95 * props.opacity * alphaBoost
                ctx.fillStyle = toRgba(props.dotColor, clamp(alpha, 0, 1))
                ctx.beginPath()
                ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
                ctx.fill()
            }

            rafRef.current = requestAnimationFrame(step)
        }

        rafRef.current = requestAnimationFrame(step)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            if (props.tracking === "global") {
                window.removeEventListener("pointermove", onWindowPointerMove)
            }
        }
    }, [
        props.mode,
        props.interaction,
        props.tracking,
        props.density,
        props.speed,
        props.dotSize,
        props.linkDistance,
        props.background,
        props.dotColor,
        props.lineColor,
        props.opacity,
        props.alpha,
        props.interactionRadius,
        props.interactionStrength,
        props.cursorEase,
    ])

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (props.tracking !== "local") return
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const m = mouseRef.current
        m.targetX = e.clientX - r.left
        m.targetY = e.clientY - r.top
        m.inside = true
    }

    const onPointerLeave = () => {
        if (props.tracking !== "local") return
        mouseRef.current.inside = false
    }

    return (
        <div
            ref={wrapRef}
            onPointerMove={
                props.tracking === "local" ? onPointerMove : undefined
            }
            onPointerLeave={
                props.tracking === "local" ? onPointerLeave : undefined
            }
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                pointerEvents: props.tracking === "global" ? "none" : "auto",
                touchAction: props.tracking === "local" ? "none" : "auto",
                ...props.style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

DotBackground.defaultProps = {
    mode: "drift" as const, // default changed to drift
    interaction: "repel" as const,
    tracking: "global" as const,

    density: 1,
    speed: 1,
    dotSize: 2,
    linkDistance: 140,

    background: "#000000",
    dotColor: "#ffffff",
    lineColor: "#8a8a8a",

    opacity: 1,
    alpha: 1.4, // renamed from visibility

    interactionRadius: 140,
    interactionStrength: 18,

    cursorEase: 40,
}

addPropertyControls(DotBackground, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["orbit", "drift"],
        optionTitles: ["Orbit", "Drift"],
    },

    tracking: {
        type: ControlType.Enum,
        title: "Tracking",
        options: ["off", "global", "local"],
        optionTitles: ["Off", "Global (click-through)", "Local (captures)"],
    },

    interaction: {
        type: ControlType.Enum,
        title: "Interact",
        options: ["off", "repel", "attract"],
        optionTitles: ["Off", "Repel", "Attract"],
    },

    density: {
        type: ControlType.Number,
        title: "Density",
        min: 0.3,
        max: 3,
        step: 0.1,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 3,
        step: 0.05,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 0.5,
        max: 6,
        step: 0.25,
    },
    linkDistance: {
        type: ControlType.Number,
        title: "Link Dist",
        min: 0,
        max: 260,
        step: 5,
    },

    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
    },

    // Renamed from Visibility -> Alpha (multiplier)
    alpha: {
        type: ControlType.Number,
        title: "Alpha",
        min: 0.2,
        max: 3,
        step: 0.1,
    },

    cursorEase: {
        type: ControlType.Number,
        title: "Cursor Ease",
        min: 0,
        max: 100,
        step: 1,
        hidden: (p) => p.tracking === "off" || p.interaction === "off",
    },

    interactionRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 30,
        max: 420,
        step: 10,
        hidden: (p) => p.tracking === "off" || p.interaction === "off",
    },
    interactionStrength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 60,
        step: 1,
        hidden: (p) => p.tracking === "off" || p.interaction === "off",
    },

    background: { type: ControlType.Color, title: "Background" },
    dotColor: { type: ControlType.Color, title: "Dot Color" },
    lineColor: { type: ControlType.Color, title: "Line Color" },
})
