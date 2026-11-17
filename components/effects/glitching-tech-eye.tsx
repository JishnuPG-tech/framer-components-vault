// TheGlitchingTechEye.tsx — single-file Framer code component
// Paste into: Assets → Code → Create Code File → TheGlitchingTechEye.tsx
// Exports one default component with Property Controls.

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


/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */
export default function TheGlitchingTechEye(props: Props) {
    const {
        bg,
        hueBase,
        rotationSpeed,
        glitchiness,
        grainStrength,
        asciiDensity,
        maxAsciiCols,
        maxAsciiRows,
        eyeFollow,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const grainCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const tRef = React.useRef(0)
    const scrollProgressRef = React.useRef(0)

    const mouseRef = React.useRef<{ x: number; y: number; inside: boolean }>({
        x: 0,
        y: 0,
        inside: false,
    })
    const eyeOffsetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })

    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const onScroll = () => {
            const rect = el.getBoundingClientRect()
            const viewportH = window.innerHeight || 1
            const total = rect.height - viewportH
            const progressed = Math.min(
                1,
                Math.max(0, (0 - rect.top) / (total || 1))
            )
            scrollProgressRef.current = progressed
        }

        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            mouseRef.current = {
                x,
                y,
                inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
            }
        }

        const onLeave = () => {
            mouseRef.current.inside = false
        }

        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        window.addEventListener("mousemove", onMove, { passive: true })
        window.addEventListener("mouseout", onLeave, { passive: true })

        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            window.removeEventListener("mousemove", onMove as any)
            window.removeEventListener("mouseout", onLeave as any)
        }
    }, [])

    React.useEffect(() => {
        const canvas = canvasRef.current!
        const grainCanvas = grainCanvasRef.current!
        if (!canvas || !grainCanvas) return
        const ctx = canvas.getContext("2d")!
        const gctx = grainCanvas.getContext("2d")!

        const density = asciiDensity || " .:-=+*#%@"
        const GRAIN_SCALE = 0.5

        const render = () => {
            tRef.current += 0.016
            const t = tRef.current
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
            const wCss = canvas.clientWidth || window.innerWidth
            const hCss = canvas.clientHeight || window.innerHeight
            const w = Math.floor(wCss * dpr)
            const h = Math.floor(hCss * dpr)
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            const gw = Math.max(2, Math.floor(w * GRAIN_SCALE))
            const gh = Math.max(2, Math.floor(h * GRAIN_SCALE))
            if (grainCanvas.width !== gw || grainCanvas.height !== gh) {
                grainCanvas.width = gw
                grainCanvas.height = gh
            }

            ctx.save()
            ctx.scale(dpr, dpr)
            ctx.fillStyle = bg
            ctx.fillRect(0, 0, wCss, hCss)

            const cx = wCss / 2
            const cy = hCss / 2
            const radius = Math.min(wCss, hCss) * 0.2

            const hueShift = (Math.sin(t * 0.5) * 0.5 + 0.5) * 60
            const hue = (hueBase + hueShift) % 360
            const bgGrad = ctx.createRadialGradient(
                cx,
                cy - 50,
                0,
                cx,
                cy,
                Math.max(wCss, hCss) * 0.8
            )
            bgGrad.addColorStop(0, `hsla(${hue + 40}, 80%, 60%, 0.4)`)
            bgGrad.addColorStop(0.3, `hsla(${hue}, 60%, 40%, 0.3)`)
            bgGrad.addColorStop(0.6, `hsla(${hue - 20}, 40%, 20%, 0.2)`)
            bgGrad.addColorStop(1, "rgba(0,0,0,0.9)")
            ctx.fillStyle = bgGrad
            ctx.fillRect(0, 0, wCss, hCss)

            const rotation = t * rotationSpeed * Math.PI * 0.5
            const shouldGlitch = Math.random() < 0.08 * glitchiness
            const gOffset = shouldGlitch
                ? (Math.random() - 0.5) * 20 * glitchiness
                : 0
            const gScale = shouldGlitch
                ? 1 + (Math.random() - 0.5) * 0.25 * glitchiness
                : 1

            ctx.save()
            if (shouldGlitch) {
                ctx.translate(gOffset, gOffset * 0.8)
                ctx.scale(gScale, 1 / (gScale || 1))
            }
            const orbGrad = ctx.createRadialGradient(
                cx,
                cy,
                0,
                cx,
                cy,
                radius * 1.5
            )
            orbGrad.addColorStop(0, `hsla(${hue + 10}, 100%, 95%, 0.9)`)
            orbGrad.addColorStop(0.2, `hsla(${hue + 20}, 90%, 80%, 0.7)`)
            orbGrad.addColorStop(0.5, `hsla(${hue}, 70%, 50%, 0.4)`)
            orbGrad.addColorStop(1, "rgba(0,0,0,0)")
            ctx.fillStyle = orbGrad
            ctx.fillRect(0, 0, wCss, hCss)

            const target = mouseRef.current
            const maxOffset = radius * 0.18 * eyeFollow
            let tx = 0,
                ty = 0
            if (target.inside) {
                const dx = target.x - cx
                const dy = target.y - cy
                const len = Math.hypot(dx, dy) || 1
                const k = Math.min(1, len / (radius * 1.2))
                tx = (dx / len) * maxOffset * k
                ty = (dy / len) * maxOffset * k
            }
            const lerp = (a: number, b: number, t: number) => a + (b - a) * t
            eyeOffsetRef.current.x = lerp(
                eyeOffsetRef.current.x,
                tx,
                0.12 + 0.2 * eyeFollow
            )
            eyeOffsetRef.current.y = lerp(
                eyeOffsetRef.current.y,
                ty,
                0.12 + 0.2 * eyeFollow
            )

            const cRad = radius * 0.3
            ctx.fillStyle = `hsla(${hue + 20}, 100%, 95%, 0.85)`
            ctx.beginPath()
            ctx.arc(
                cx + eyeOffsetRef.current.x,
                cy + eyeOffsetRef.current.y,
                cRad,
                0,
                Math.PI * 2
            )
            ctx.fill()

            ctx.strokeStyle = `hsla(${hue + 20}, 80%, 70%, 0.6)`
            ctx.lineWidth = 2
            if (shouldGlitch) {
                const segments = 8
                for (let i = 0; i < segments; i++) {
                    const a0 = (i / segments) * Math.PI * 2
                    const a1 = ((i + 1) / segments) * Math.PI * 2
                    const rr =
                        radius * 1.2 + (Math.random() - 0.5) * 10 * glitchiness
                    ctx.beginPath()
                    ctx.arc(cx, cy, rr, a0, a1)
                    ctx.stroke()
                }
            } else {
                ctx.beginPath()
                ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2)
                ctx.stroke()
            }
            ctx.restore()

            ctx.font = `${Math.max(8, Math.floor(10 * dpr))}px "JetBrains Mono", monospace`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"

            const spacing = 9
            const cols = Math.min(maxAsciiCols, Math.floor(wCss / spacing))
            const rows = Math.min(maxAsciiRows, Math.floor(hCss / spacing))
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = (i - cols / 2) * spacing + cx
                    const y = (j - rows / 2) * spacing + cy
                    const dx = x - cx
                    const dy = y - cy
                    const dist = Math.hypot(dx, dy)
                    if (dist < radius && Math.random() > 0.4) {
                        const z = Math.sqrt(
                            Math.max(0, radius * radius - dx * dx - dy * dy)
                        )
                        const rotZ =
                            dx * Math.sin(rotation) + z * Math.cos(rotation)
                        const bright = (rotZ + radius) / (radius * 2)
                        if (rotZ > -radius * 0.3) {
                            let idx = Math.floor(bright * (density.length - 1))
                            idx = Math.min(density.length - 1, Math.max(0, idx))
                            let ch = density[idx]
                            if (
                                dist < radius * 0.8 &&
                                glitchiness > 0.8 &&
                                Math.random() < 0.3
                            ) {
                                const glitchChars = [
                                    "█",
                                    "▓",
                                    "▒",
                                    "░",
                                    "▄",
                                    "▀",
                                    "■",
                                    "□",
                                ]
                                ch =
                                    glitchChars[
                                        Math.floor(
                                            Math.random() * glitchChars.length
                                        )
                                    ]
                            }
                            const alpha = Math.max(0.2, bright)
                            ctx.fillStyle = `rgba(255,255,255,${alpha})`
                            ctx.fillText(ch, x, y)
                        }
                    }
                }
            }

            gctx.clearRect(0, 0, gw, gh)
            const img = gctx.createImageData(gw, gh)
            const data = img.data
            const base = 128
            const amp = Math.floor(255 * (0.1 + grainStrength * 0.35))
            for (let p = 0; p < data.length; p += 4) {
                const n = (Math.random() - 0.5) * amp
                const v = Math.max(0, Math.min(255, base + n))
                data[p] = v
                data[p + 1] = v
                data[p + 2] = v
                data[p + 3] = Math.max(0, Math.min(255, Math.abs(n) * 3))
            }
            gctx.putImageData(img, 0, 0)
            if (glitchiness > 0.5) {
                gctx.globalCompositeOperation = "screen"
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * gw
                    const y = Math.random() * gh
                    const r = Math.random() * 2 + 0.5
                    const op = Math.random() * 0.4 * glitchiness
                    gctx.fillStyle = `rgba(255,255,255,${op})`
                    gctx.beginPath()
                    gctx.arc(x, y, r, 0, Math.PI * 2)
                    gctx.fill()
                }
                gctx.globalCompositeOperation = "source-over"
            }

            ctx.globalAlpha = 0.4 + grainStrength * 0.6
            ctx.imageSmoothingEnabled = true
            ctx.drawImage(grainCanvas, 0, 0, wCss, hCss)
            ctx.globalAlpha = 1

            ctx.restore()

            rafRef.current = requestAnimationFrame(render)
        }

        rafRef.current = requestAnimationFrame(render)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [
        bg,
        hueBase,
        rotationSpeed,
        glitchiness,
        grainStrength,
        asciiDensity,
        maxAsciiCols,
        maxAsciiRows,
        eyeFollow,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                background: bg,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: "100vh",
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
                <canvas
                    ref={grainCanvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        mixBlendMode: "overlay",
                    }}
                />
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>
        </div>
    )
}

type Props = {
    bg: string
    hueBase: number
    rotationSpeed: number
    glitchiness: number
    grainStrength: number
    asciiDensity: string
    maxAsciiCols: number
    maxAsciiRows: number
    eyeFollow: number
    style?: React.CSSProperties
}

TheGlitchingTechEye.defaultProps = {
    width: 800,
    height: 800,
    bg: "#000000",
    hueBase: 180,
    rotationSpeed: 1.0,
    glitchiness: 0.7,
    grainStrength: 0.5,
    asciiDensity: " .:-=+*#%@",
    maxAsciiCols: 150,
    maxAsciiRows: 100,
    eyeFollow: 0.9,
}

addPropertyControls(TheGlitchingTechEye, {
    bg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Background color of the canvas",
    },
    hueBase: {
        type: ControlType.Number,
        title: "Hue Base",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 180,
        displayStepper: true,
        description: "Starting hue for the color gradients",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 1.0,
        description: "Orb rotation speed",
    },
    glitchiness: {
        type: ControlType.Number,
        title: "Glitch",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.7,
        description: "Controls visual glitch frequency",
    },
    grainStrength: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
        description: "Amount of grain texture on screen",
    },
    asciiDensity: {
        type: ControlType.String,
        title: "ASCII Set",
        defaultValue: " .:-=+*#%@",
        description: "Characters used to render ASCII particles",
    },
    maxAsciiCols: {
        type: ControlType.Number,
        title: "Max Cols",
        min: 20,
        max: 200,
        step: 1,
        defaultValue: 150,
        description: "Maximum number of ASCII columns",
    },
    maxAsciiRows: {
        type: ControlType.Number,
        title: "Max Rows",
        min: 20,
        max: 200,
        step: 1,
        defaultValue: 100,
        description: "Maximum number of ASCII rows",
    },
    eyeFollow: {
        type: ControlType.Number,
        title: "Eye Follow",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.9,
        description: "How much the center follows the cursor",
    },
})
