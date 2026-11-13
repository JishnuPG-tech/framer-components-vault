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


interface Props {
    glowColor: string
    shiftColor: string
    glowSize: number
    glowIntensity: number
    pulseEnabled: boolean
    pulseSpeed: number
    mouseReactive: boolean
    colorShift: boolean
    colorShiftSpeed: number
    cornerGlow: boolean
    borderRadius: number
}

function parseColor(color: string): [number, number, number] {
    if (!color) return [255, 255, 255]
    if (color.startsWith("#")) {
        let hex = color.slice(1)
        if (hex.length === 8) hex = hex.slice(0, 6)
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        const n = parseInt(hex, 16)
        if (isNaN(n)) return [255, 255, 255]
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const match = color.match(/[\d.]+/g)
    if (match && match.length >= 3) {
        return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])]
    }
    return [255, 255, 255]
}

function toRgba(color: string, alpha: number): string {
    const [r, g, b] = parseColor(color)
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`
}

function lerpRgba(
    colorA: string,
    colorB: string,
    t: number,
    alpha: number
): string {
    const [r1, g1, b1] = parseColor(colorA)
    const [r2, g2, b2] = parseColor(colorB)
    return `rgba(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)},${Math.max(0, Math.min(1, alpha))})`
}

export default function AuraFrame({
    glowColor = "#FFFFFF",
    shiftColor = "#AA44FF",
    glowSize = 52,
    glowIntensity = 0.55,
    pulseEnabled = true,
    pulseSpeed = 1.5,
    mouseReactive = true,
    colorShift = false,
    colorShiftSpeed = 1,
    cornerGlow = false,
    borderRadius = 0,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: 0.5, y: 0.5, inside: false })
    const rafRef = useRef(0)

    const isCanvas =
        typeof window !== "undefined" &&
        window.location.href.includes("framer.com")

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resize = () => {
            if (isCanvas) {
                canvas.width = canvas.offsetWidth
                canvas.height = canvas.offsetHeight
            } else {
                canvas.width = window.innerWidth
                canvas.height = window.innerHeight
            }
        }
        resize()

        const onMove = (e: MouseEvent) => {
            if (isCanvas) {
                const rect = canvas.getBoundingClientRect()
                mouseRef.current = {
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height,
                    inside: true,
                }
            } else {
                mouseRef.current = {
                    x: e.clientX / window.innerWidth,
                    y: e.clientY / window.innerHeight,
                    inside: true,
                }
            }
        }
        const onLeave = () => {
            mouseRef.current.inside = false
        }

        if (isCanvas) {
            canvas.addEventListener("mousemove", onMove)
            canvas.addEventListener("mouseleave", onLeave)
        } else {
            window.addEventListener("mousemove", onMove)
            window.addEventListener("mouseleave", onLeave)
            window.addEventListener("resize", resize)
        }

        const draw = (ts: number) => {
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)

            const t = ts / 1000
            const pulse = pulseEnabled
                ? 0.55 + 0.45 * Math.sin(t * pulseSpeed * Math.PI)
                : 1

            const blendT = colorShift
                ? (Math.sin(t * colorShiftSpeed * 0.5) + 1) / 2
                : 0

            const mc = (alpha: number) =>
                colorShift
                    ? lerpRgba(glowColor, shiftColor, blendT, alpha)
                    : toRgba(glowColor, alpha)

            const mx =
                mouseReactive && mouseRef.current.inside
                    ? mouseRef.current.x
                    : 0.5
            const my =
                mouseReactive && mouseRef.current.inside
                    ? mouseRef.current.y
                    : 0.5
            const eL = mouseReactive ? 0.3 + (1 - mx) * 0.7 : 1
            const eR = mouseReactive ? 0.3 + mx * 0.7 : 1
            const eT = mouseReactive ? 0.3 + (1 - my) * 0.7 : 1
            const eB = mouseReactive ? 0.3 + my * 0.7 : 1

            const a = glowIntensity * pulse
            const gs = glowSize
            const br = borderRadius

            // Top
            const tg = ctx.createLinearGradient(0, 0, 0, gs)
            tg.addColorStop(0, mc(a * eT))
            tg.addColorStop(1, mc(0))
            ctx.fillStyle = tg
            ctx.fillRect(br, 0, w - br * 2, gs)

            // Bottom
            const bg = ctx.createLinearGradient(0, h, 0, h - gs)
            bg.addColorStop(0, mc(a * eB))
            bg.addColorStop(1, mc(0))
            ctx.fillStyle = bg
            ctx.fillRect(br, h - gs, w - br * 2, gs)

            // Left
            const lg = ctx.createLinearGradient(0, 0, gs, 0)
            lg.addColorStop(0, mc(a * eL))
            lg.addColorStop(1, mc(0))
            ctx.fillStyle = lg
            ctx.fillRect(0, br, gs, h - br * 2)

            // Right
            const rg = ctx.createLinearGradient(w, 0, w - gs, 0)
            rg.addColorStop(0, mc(a * eR))
            rg.addColorStop(1, mc(0))
            ctx.fillStyle = rg
            ctx.fillRect(w - gs, br, gs, h - br * 2)

            // Corners
            if (cornerGlow) {
                const corners: [number, number][] = [
                    [0, 0],
                    [w, 0],
                    [0, h],
                    [w, h],
                ]
                corners.forEach(([cx, cy]) => {
                    const r = gs * 2
                    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
                    cg.addColorStop(0, mc(Math.min(1, a * 2.5)))
                    cg.addColorStop(0.25, mc(Math.min(1, a * 1.5)))
                    cg.addColorStop(0.6, mc(a * 0.4))
                    cg.addColorStop(1, mc(0))
                    ctx.fillStyle = cg
                    ctx.beginPath()
                    ctx.arc(cx, cy, r, 0, Math.PI * 2)
                    ctx.fill()
                })
            }

            rafRef.current = requestAnimationFrame(draw)
        }

        rafRef.current = requestAnimationFrame(draw)

        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        return () => {
            cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            if (isCanvas) {
                canvas.removeEventListener("mousemove", onMove)
                canvas.removeEventListener("mouseleave", onLeave)
            } else {
                window.removeEventListener("mousemove", onMove)
                window.removeEventListener("mouseleave", onLeave)
                window.removeEventListener("resize", resize)
            }
        }
    }, [
        glowColor,
        shiftColor,
        glowSize,
        glowIntensity,
        pulseEnabled,
        pulseSpeed,
        mouseReactive,
        colorShift,
        colorShiftSpeed,
        cornerGlow,
        borderRadius,
        isCanvas,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: isCanvas ? "relative" : "fixed",
                top: isCanvas ? "auto" : 0,
                left: isCanvas ? "auto" : 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: isCanvas ? "auto" : 9999,
                background: "transparent",
            }}
        />
    )
}

addPropertyControls(AuraFrame, {
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#FFFFFF",
    },
    colorShift: {
        type: ControlType.Boolean,
        title: "Color Shift",
        defaultValue: false,
    },
    shiftColor: {
        type: ControlType.Color,
        title: "Shift Color",
        defaultValue: "#AA44FF",
        hidden: (props) => !props.colorShift,
    },
    colorShiftSpeed: {
        type: ControlType.Number,
        title: "Shift Speed",
        defaultValue: 1,
        min: 0.5,
        max: 10,
        step: 0.5,
        displayStepper: true,
        hidden: (props) => !props.colorShift,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 52,
        min: 8,
        max: 160,
        step: 1,
        displayStepper: true,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.55,
        min: 0.1,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    pulseEnabled: {
        type: ControlType.Boolean,
        title: "Pulse",
        defaultValue: true,
    },
    pulseSpeed: {
        type: ControlType.Number,
        title: "Pulse Speed",
        defaultValue: 1.5,
        min: 0.2,
        max: 8,
        step: 0.1,
        displayStepper: true,
        hidden: (props) => !props.pulseEnabled,
    },
    mouseReactive: {
        type: ControlType.Boolean,
        title: "Mouse Reactive",
        defaultValue: true,
    },
    cornerGlow: {
        type: ControlType.Boolean,
        title: "Corner Glow",
        defaultValue: false,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        displayStepper: true,
    },
})
