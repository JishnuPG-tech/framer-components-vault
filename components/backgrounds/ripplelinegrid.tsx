// Ripple Line Grid — grid bends live under the mouse + expanding click waves
import { useEffect, useRef, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface RippleWave {
    x: number
    y: number
    radius: number
    maxRadius: number
    strength: number
}

interface RippleLineGridProps {
    gridSize: number
    lineThickness: number
    lineSharpness: number
    gridRotation: number
    backgroundColor: string
    lineColor: string
    glowColor: string
    lineOpacity: number
    glowIntensity: number
    glowSpread: number
    // Mouse hover distortion
    hoverRadius: number
    hoverIntensity: number
    // Click waves
    waveIntensity: number
    waveSpeed: number
    waveDecay: number
    // Auto waves
    autoRipple: boolean
    autoRippleInterval: number
    // Vignette / edges
    vignetteStrength: number
    vignetteColor: string
    fadeEdges: boolean
    style?: CSSProperties
}

function parseColor(color: string): { r: number; g: number; b: number } {
    if (!color) return { r: 255, g: 255, b: 255 }
    const hex6 = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    if (hex6)
        return {
            r: parseInt(hex6[1], 16),
            g: parseInt(hex6[2], 16),
            b: parseInt(hex6[3], 16),
        }
    const hex3 = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
    if (hex3)
        return {
            r: parseInt(hex3[1] + hex3[1], 16),
            g: parseInt(hex3[2] + hex3[2], 16),
            b: parseInt(hex3[3] + hex3[3], 16),
        }
    const rgb = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
    if (rgb)
        return {
            r: Math.round(+rgb[1]),
            g: Math.round(+rgb[2]),
            b: Math.round(+rgb[3]),
        }
    try {
        const c = document.createElement("canvas")
        c.width = c.height = 1
        const x = c.getContext("2d")!
        x.fillStyle = color
        x.fillRect(0, 0, 1, 1)
        const d = x.getImageData(0, 0, 1, 1).data
        return { r: d[0], g: d[1], b: d[2] }
    } catch {
        return { r: 255, g: 255, b: 255 }
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function RippleLineGrid(props: RippleLineGridProps) {
    const {
        gridSize = 40,
        lineThickness = 1,
        lineSharpness = 1,
        gridRotation = 0,
        backgroundColor = "#050810",
        lineColor = "#FFFFFF",
        glowColor = "#4488FF",
        lineOpacity = 0.15,
        glowIntensity = 0.7,
        glowSpread = 3,
        hoverRadius = 180,
        hoverIntensity = 22,
        waveIntensity = 28,
        waveSpeed = 3,
        waveDecay = 0.012,
        autoRipple = true,
        autoRippleInterval = 4000,
        vignetteStrength = 0.65,
        vignetteColor = "#000000",
        fadeEdges = true,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    // Mouse position in canvas space; -9999 means "off canvas"
    const mouseRef = useRef({ x: -9999, y: -9999, inside: false })
    const wavesRef = useRef<RippleWave[]>([])
    const lastAutoRipple = useRef<number>(0)
    const isStatic = useIsStaticRenderer()
    const propsRef = useRef(props)
    useEffect(() => {
        propsRef.current = props
    })

    const syncSize = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        const rect = container.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = Math.round(rect.width)
            canvas.height = Math.round(rect.height)
        }
    }, [])

    const drawFrame = useCallback((timestamp: number) => {
        const canvas = canvasRef.current
        if (!canvas || canvas.width === 0 || canvas.height === 0) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const {
            gridSize,
            lineThickness,
            lineSharpness,
            gridRotation,
            backgroundColor,
            lineColor,
            glowColor,
            lineOpacity,
            glowIntensity,
            glowSpread,
            hoverRadius,
            hoverIntensity,
            waveIntensity,
            waveSpeed,
            waveDecay,
            autoRipple,
            autoRippleInterval,
            vignetteStrength,
            vignetteColor,
            fadeEdges,
        } = propsRef.current

        const W = canvas.width
        const H = canvas.height
        const mouse = mouseRef.current

        // Background
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, W, H)

        // Advance + cull expanding waves
        wavesRef.current = wavesRef.current.filter((w) => w.strength > 0.005)
        wavesRef.current.forEach((w) => {
            w.radius += waveSpeed
            w.strength -= waveDecay
            if (w.radius > w.maxRadius) w.strength = 0
        })

        // Auto ripple
        if (
            autoRipple &&
            timestamp - lastAutoRipple.current > autoRippleInterval
        ) {
            lastAutoRipple.current = timestamp
            const maxR = Math.hypot(W, H)
            wavesRef.current.push({
                x: W * (0.15 + Math.random() * 0.7),
                y: H * (0.15 + Math.random() * 0.7),
                radius: 0,
                maxRadius: maxR,
                strength: 0.6 + Math.random() * 0.4,
            })
            if (wavesRef.current.length > 14) wavesRef.current.shift()
        }

        // ── Displacement at any canvas point ────────────────
        // Combines: (1) live mouse hover bulge, (2) expanding click waves
        const getDisp = (
            px: number,
            py: number,
            isVertical: boolean
        ): number => {
            let disp = 0

            // 1. Live hover distortion — lines bend AWAY from cursor
            if (mouse.inside) {
                const dx = px - mouse.x
                const dy = py - mouse.y
                const dist = Math.hypot(dx, dy)
                if (dist < hoverRadius && dist > 0) {
                    // Smooth falloff: cos² envelope peaks at center, zero at edge
                    const t = dist / hoverRadius
                    const envelope = Math.cos(t * Math.PI * 0.5) ** 2
                    // Push perpendicular to the line direction
                    // Vertical lines → displace in X; Horizontal lines → displace in Y
                    const push = isVertical ? dx / dist : dy / dist
                    disp += push * envelope * hoverIntensity
                }
            }

            // 2. Expanding click waves (circular ripple)
            wavesRef.current.forEach((w) => {
                const dx = px - w.x
                const dy = py - w.y
                const dist = Math.hypot(dx, dy)
                const delta = dist - w.radius
                const ww = gridSize * 1.8
                if (Math.abs(delta) < ww) {
                    const env = 1 - Math.abs(delta) / ww
                    disp +=
                        Math.sin((delta / ww) * Math.PI) *
                        env *
                        w.strength *
                        waveIntensity
                }
            })

            return disp
        }

        // ── Glow at a line position ──────────────────────────
        const getGlow = (px: number, py: number): number => {
            let g = 0

            // Mouse hover glow
            if (mouse.inside) {
                const dist = Math.hypot(px - mouse.x, py - mouse.y)
                if (dist < hoverRadius) {
                    g += (1 - dist / hoverRadius) * 0.9
                }
            }

            // Wave front glow
            wavesRef.current.forEach((w) => {
                const dist = Math.hypot(px - w.x, py - w.y)
                const delta = dist - w.radius
                const ww = gridSize * 2.5
                if (Math.abs(delta) < ww)
                    g += (1 - Math.abs(delta) / ww) * w.strength
            })

            return Math.min(1, g)
        }

        // ── Draw grid ────────────────────────────────────────
        const lineRgb = parseColor(lineColor)
        const glowRgb = parseColor(glowColor)

        ctx.save()
        ctx.translate(W / 2, H / 2)
        ctx.rotate((gridRotation * Math.PI) / 180)
        ctx.translate(-W / 2, -H / 2)

        const diag = Math.hypot(W, H)
        const extra = (diag - Math.min(W, H)) / 2 + gridSize * 2
        const x0 = -extra,
            y0 = -extra
        const x1 = W + extra,
            y1 = H + extra
        const step = Math.max(2, lineSharpness * 3)

        const drawLine = (isVertical: boolean, fixed: number) => {
            const sampleX = isVertical ? fixed : (x0 + x1) / 2
            const sampleY = isVertical ? (y0 + y1) / 2 : fixed
            const tg = getGlow(sampleX, sampleY)

            const r = Math.round(
                lineRgb.r + (glowRgb.r - lineRgb.r) * tg * glowIntensity
            )
            const g = Math.round(
                lineRgb.g + (glowRgb.g - lineRgb.g) * tg * glowIntensity
            )
            const b = Math.round(
                lineRgb.b + (glowRgb.b - lineRgb.b) * tg * glowIntensity
            )
            const alpha = Math.min(1, lineOpacity + tg * glowIntensity * 0.5)

            ctx.beginPath()
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
            ctx.lineWidth = lineThickness + tg * glowSpread
            ctx.shadowColor = glowColor
            ctx.shadowBlur = tg > 0.05 ? tg * glowSpread * 10 : 0

            let first = true
            const from = isVertical ? y0 : x0
            const to = isVertical ? y1 : x1

            for (let t = from; t <= to; t += step) {
                const px = isVertical ? fixed : t
                const py = isVertical ? t : fixed
                const d = getDisp(px, py, isVertical)
                const cx = isVertical ? fixed + d : t
                const cy = isVertical ? t : fixed + d
                if (first) {
                    ctx.moveTo(cx, cy)
                    first = false
                } else ctx.lineTo(cx, cy)
            }
            ctx.stroke()
        }

        // Vertical lines
        for (let lx = x0; lx <= x1; lx += gridSize) drawLine(true, lx)
        // Horizontal lines
        for (let ly = y0; ly <= y1; ly += gridSize) drawLine(false, ly)

        ctx.restore()

        // ── Vignette ─────────────────────────────────────────
        if (vignetteStrength > 0) {
            const vc = parseColor(vignetteColor)
            const vg = ctx.createRadialGradient(
                W / 2,
                H / 2,
                Math.min(W, H) * 0.2,
                W / 2,
                H / 2,
                Math.max(W, H) * 0.85
            )
            vg.addColorStop(0, `rgba(${vc.r},${vc.g},${vc.b},0)`)
            vg.addColorStop(
                1,
                `rgba(${vc.r},${vc.g},${vc.b},${vignetteStrength})`
            )
            ctx.fillStyle = vg
            ctx.fillRect(0, 0, W, H)
        }

        // ── Edge fade ────────────────────────────────────────
        if (fadeEdges) {
            const bc = parseColor(backgroundColor)
            const es = Math.min(W, H) * 0.1
            const edgeFill = (
                x: number,
                y: number,
                w: number,
                h: number,
                gx1: number,
                gy1: number,
                gx2: number,
                gy2: number
            ) => {
                const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2)
                grad.addColorStop(0, `rgba(${bc.r},${bc.g},${bc.b},1)`)
                grad.addColorStop(1, `rgba(${bc.r},${bc.g},${bc.b},0)`)
                ctx.fillStyle = grad
                ctx.fillRect(x, y, w, h)
            }
            edgeFill(0, 0, W, es, 0, 0, 0, es)
            edgeFill(0, H - es, W, es, 0, H, 0, H - es)
            edgeFill(0, 0, es, H, 0, 0, es, 0)
            edgeFill(W - es, 0, es, H, W, 0, W - es, 0)
        }
    }, [])

    const animate = useCallback(
        (ts: number) => {
            drawFrame(ts)
            animationRef.current = requestAnimationFrame(animate)
        },
        [drawFrame]
    )

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        mouseRef.current = {
            x,
            y,
            inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        mouseRef.current = { x: -9999, y: -9999, inside: false }
    }, [])

    const handleClick = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const maxR = Math.hypot(canvas.width, canvas.height)
        wavesRef.current.push({
            x,
            y,
            radius: 0,
            maxRadius: maxR,
            strength: 1.0,
        })
        if (wavesRef.current.length > 14) wavesRef.current.shift()
    }, [])

    useEffect(() => {
        if (isStatic) return

        syncSize()
        animationRef.current = requestAnimationFrame(animate)

        const container = containerRef.current
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("resize", syncSize)
        container?.addEventListener("mouseleave", handleMouseLeave)
        container?.addEventListener("click", handleClick as EventListener)

        let ro: ResizeObserver | null = null
        if (container && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(syncSize)
            ro.observe(container)
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            ro?.disconnect()
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("resize", syncSize)
            container?.removeEventListener("mouseleave", handleMouseLeave)
            container?.removeEventListener(
                "click",
                handleClick as EventListener
            )
        }
    }, [
        isStatic,
        animate,
        syncSize,
        handleMouseMove,
        handleMouseLeave,
        handleClick,
    ])

    // ── Static preview ───────────────────────────────────────
    if (isStatic) {
        const cols = Math.ceil(800 / gridSize) + 2
        const rows = Math.ceil(600 / gridSize) + 2
        const lc = parseColor(lineColor)
        const ls = `rgba(${lc.r},${lc.g},${lc.b},${lineOpacity})`
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transform: `rotate(${gridRotation}deg)`,
                    }}
                >
                    {Array.from({ length: cols }).map((_, i) => (
                        <div
                            key={`v${i}`}
                            style={{
                                position: "absolute",
                                left: `${(i / (cols - 1)) * 100}%`,
                                top: 0,
                                bottom: 0,
                                width: `${lineThickness}px`,
                                background: ls,
                            }}
                        />
                    ))}
                    {Array.from({ length: rows }).map((_, i) => (
                        <div
                            key={`h${i}`}
                            style={{
                                position: "absolute",
                                top: `${(i / (rows - 1)) * 100}%`,
                                left: 0,
                                right: 0,
                                height: `${lineThickness}px`,
                                background: ls,
                            }}
                        />
                    ))}
                </div>
                {vignetteStrength > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `radial-gradient(ellipse at center, transparent 25%, ${vignetteColor} 100%)`,
                            opacity: vignetteStrength,
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: "crosshair",
            }}
        >
            <canvas
                ref={canvasRef}
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

addPropertyControls(RippleLineGrid, {
    // Grid
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 40,
        min: 10,
        max: 150,
        step: 5,
        unit: "px",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        defaultValue: 1,
        min: 0.5,
        max: 6,
        step: 0.5,
        unit: "px",
    },
    lineSharpness: {
        type: ControlType.Number,
        title: "Line Sharpness",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.25,
    },
    gridRotation: {
        type: ControlType.Number,
        title: "Grid Rotation",
        defaultValue: 0,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
    },
    // Colors
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050810",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#FFFFFF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#4488FF",
    },
    // Opacity & glow
    lineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.15,
        min: 0.01,
        max: 1,
        step: 0.01,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glowSpread: {
        type: ControlType.Number,
        title: "Glow Spread",
        defaultValue: 3,
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
    },
    // Mouse hover
    hoverRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        defaultValue: 180,
        min: 40,
        max: 400,
        step: 10,
        unit: "px",
    },
    hoverIntensity: {
        type: ControlType.Number,
        title: "Hover Intensity",
        defaultValue: 22,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    // Click waves
    waveIntensity: {
        type: ControlType.Number,
        title: "Wave Intensity",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 3,
        min: 0.5,
        max: 12,
        step: 0.5,
    },
    waveDecay: {
        type: ControlType.Number,
        title: "Wave Decay",
        defaultValue: 0.012,
        min: 0.002,
        max: 0.08,
        step: 0.002,
    },
    // Auto waves
    autoRipple: {
        type: ControlType.Boolean,
        title: "Auto Ripple",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRippleInterval: {
        type: ControlType.Number,
        title: "Ripple Interval",
        defaultValue: 4000,
        min: 500,
        max: 12000,
        step: 500,
        unit: "ms",
        hidden: ({ autoRipple }) => !autoRipple,
    },
    // Vignette / edges
    vignetteStrength: {
        type: ControlType.Number,
        title: "Vignette",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.05,
    },
    vignetteColor: {
        type: ControlType.Color,
        title: "Vignette Color",
        defaultValue: "#000000",
    },
    fadeEdges: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
