// User instructions: create this component without the container with the texts (canvas-only Gravity Grid effect from avathiery.com)

import React, { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

type Props = {
    gridSize: number
    mass: number
    softening: number
    backgroundColor: string
    gridColor: string
    gridOpacity: number
    starColor: string
    starOpacity: number
    starDensity: number
    maxDpr: number
    glowRadius: number
    glowCoreRadius: number
    glowCoreOpacity: number
    glowStrength: number
    cursorEnabled: boolean
    cursor: "crosshair" | "default" | "none"
    style?: CSSProperties
}

type Star = {
    x: number
    y: number
    r: number
    alpha: number
    twinkle: number
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n))
}

/**
 * Gravity Grid (Canvas)
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GravityGridCanvas(props: Props) {
    const {
        gridSize,
        mass,
        softening,
        backgroundColor,
        gridColor,
        gridOpacity,
        starColor,
        starOpacity,
        starDensity,
        maxDpr,
        glowRadius,
        glowCoreRadius,
        glowCoreOpacity,
        glowStrength,
        cursorEnabled,
        cursor,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const isInView = useInView(wrapperRef, { margin: "200px" })

    // Render-time refs (no state updates needed)
    const rafRef = useRef<number | null>(null)
    const lastRef = useRef<number>(0)

    const dprRef = useRef<number>(1)
    const wRef = useRef<number>(0)
    const hRef = useRef<number>(0)
    const cellWRef = useRef<number>(0)
    const cellHRef = useRef<number>(0)

    const starsRef = useRef<Star[]>([])

    const targetRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 })
    const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 })

    const computedGridStroke = useMemo(() => {
        // Using rgba string allows opacity control without external color libs.
        // Expect gridColor to be any CSS color; we apply opacity via globalAlpha during stroke.
        return gridColor
    }, [gridColor])

    const computeStarCount = useCallback(
        (W: number, H: number) => {
            const area = Math.max(0, W * H)
            // Original heuristic: area / 6000. Provide user density multiplier.
            const base = Math.floor(area / 6000)
            return Math.floor(base * starDensity)
        },
        [starDensity]
    )

    const resize = useCallback(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        const wrapper = wrapperRef.current
        if (!canvas || !wrapper) return

        const rect = wrapper.getBoundingClientRect()
        const W = Math.max(1, Math.floor(rect.width))
        const H = Math.max(1, Math.floor(rect.height))

        const dpr = clamp(Math.min(window.devicePixelRatio || 1, maxDpr), 1, 4)

        wRef.current = W
        hRef.current = H
        dprRef.current = dpr

        canvas.width = Math.floor(W * dpr)
        canvas.height = Math.floor(H * dpr)
        canvas.style.width = "100%"
        canvas.style.height = "100%"

        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        cellWRef.current = W / Math.max(1, gridSize)
        cellHRef.current = H / Math.max(1, gridSize)

        // Stars
        const stars: Star[] = []
        const starCount = computeStarCount(W, H)
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 0.9 + 0.2,
                alpha: Math.random() * 0.6 + 0.2,
                twinkle: Math.random() * Math.PI * 2,
            })
        }
        starsRef.current = stars
    }, [computeStarCount, gridSize, maxDpr])

    const displace = useCallback(
        (gx: number, gy: number) => {
            const mx = mouseRef.current.x
            const my = mouseRef.current.y
            if (mx < -9000) return [gx, gy] as const

            const dx = gx - mx
            const dy = gy - my
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 0.001) return [gx, gy] as const

            const SOFT = Math.max(0.0001, softening)
            const MASS = Math.max(0, mass)

            // Pull magnitude: capped so points don't fly through cursor.
            const pull = Math.min((MASS / (dist * dist + SOFT * SOFT)) * dist, dist * 0.9)
            const ux = dx / dist
            const uy = dy / dist
            return [gx - ux * pull, gy - uy * pull] as const
        },
        [mass, softening]
    )

    const draw = useCallback(
        (dt: number) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const W = wRef.current
            const H = hRef.current
            if (W <= 0 || H <= 0) return

            // Smooth cursor follow
            const lerp = 1 - Math.pow(0.002, dt)
            const t = targetRef.current
            const m = mouseRef.current
            m.x += (t.x - m.x) * lerp
            m.y += (t.y - m.y) * lerp

            // Background
            ctx.globalAlpha = 1
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, W, H)

            // Stars
            const stars = starsRef.current
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i]
                s.twinkle += dt * 1.5
                const a = s.alpha * (0.6 + Math.sin(s.twinkle) * 0.4)

                ctx.globalAlpha = clamp(a * starOpacity, 0, 1)
                ctx.fillStyle = starColor
                ctx.beginPath()
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
                ctx.fill()
            }

            // Pre-compute displaced points
            const cols = Math.max(2, gridSize + 1)
            const rows = Math.max(2, gridSize + 1)
            const cellW = cellWRef.current
            const cellH = cellHRef.current

            const pts = new Array<readonly [number, number]>(cols * rows)
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const gx = c * cellW
                    const gy = r * cellH
                    pts[r * cols + c] = displace(gx, gy)
                }
            }

            // Grid lines
            ctx.globalAlpha = clamp(gridOpacity, 0, 1)
            ctx.strokeStyle = computedGridStroke
            ctx.lineWidth = 1
            ctx.lineCap = "round"
            ctx.lineJoin = "round"

            // Horizontal
            for (let r = 0; r < rows; r++) {
                ctx.beginPath()
                for (let c = 0; c < cols; c++) {
                    const [px, py] = pts[r * cols + c]
                    if (c === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()
            }

            // Vertical
            for (let c = 0; c < cols; c++) {
                ctx.beginPath()
                for (let r = 0; r < rows; r++) {
                    const [px, py] = pts[r * cols + c]
                    if (r === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()
            }

            // Gravity well glow
            if (m.x > -9000) {
                const radius = Math.max(0, glowRadius)
                if (radius > 0) {
                    const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, radius)
                    const strength = clamp(glowStrength, 0, 1)

                    glow.addColorStop(0, `rgba(255, 255, 255, ${0.35 * strength})`)
                    glow.addColorStop(0.3, `rgba(180, 220, 255, ${0.15 * strength})`)
                    glow.addColorStop(1, "rgba(255, 255, 255, 0)")

                    ctx.globalAlpha = 1
                    ctx.fillStyle = glow
                    ctx.beginPath()
                    ctx.arc(m.x, m.y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }

                const coreR = Math.max(0, glowCoreRadius)
                if (coreR > 0) {
                    ctx.globalAlpha = clamp(glowCoreOpacity, 0, 1)
                    ctx.fillStyle = "rgb(255, 255, 255)"
                    ctx.beginPath()
                    ctx.arc(m.x, m.y, coreR, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            ctx.globalAlpha = 1
        },
        [backgroundColor, computedGridStroke, displace, glowCoreOpacity, glowCoreRadius, glowRadius, glowStrength, gridOpacity, gridSize, starColor, starOpacity]
    )

    const stop = useCallback(() => {
        if (rafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const start = useCallback(() => {
        if (typeof window === "undefined") return
        stop()

        lastRef.current = performance.now()

        const loop = (now: number) => {
            const last = lastRef.current
            const dt = clamp((now - last) / 1000, 0, 0.05)
            lastRef.current = now

            draw(dt)
            rafRef.current = window.requestAnimationFrame(loop)
        }

        rafRef.current = window.requestAnimationFrame(loop)
    }, [draw, stop])

    // Setup resize observation
    useEffect(() => {
        if (typeof window === "undefined") return
        resize()

        const wrapper = wrapperRef.current
        if (!wrapper) return

        let ro: ResizeObserver | null = null
        // Prefer checking the global constructor instead of using `"ResizeObserver" in window`
        // to avoid type-narrowing issues in some TS environments.
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => resize())
            ro.observe(wrapper)
        } else {
            const onResize = () => resize()
            const win = window as unknown as Window
            win.addEventListener("resize", onResize)
            return () => win.removeEventListener("resize", onResize)
        }

        return () => {
            if (ro) ro.disconnect()
        }
    }, [resize])

    // Pointer handling (local to component; no global listeners)
    useEffect(() => {
        if (typeof window === "undefined") return
        const wrapper = wrapperRef.current
        if (!wrapper) return

        if (!cursorEnabled) {
            targetRef.current = { x: -9999, y: -9999 }
            mouseRef.current = { x: -9999, y: -9999 }
            return
        }

        const onMove = (e: PointerEvent) => {
            const rect = wrapper.getBoundingClientRect()
            targetRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
        }

        const onLeave = () => {
            targetRef.current = { x: -9999, y: -9999 }
        }

        wrapper.addEventListener("pointermove", onMove)
        wrapper.addEventListener("pointerleave", onLeave)

        return () => {
            wrapper.removeEventListener("pointermove", onMove)
            wrapper.removeEventListener("pointerleave", onLeave)
        }
    }, [cursorEnabled])

    // Start/stop animation based on static renderer and in-view
    useEffect(() => {
        if (typeof window === "undefined") return

        if (isStatic) {
            stop()
            // Draw a single static frame (no twinkle progression).
            draw(1 / 60)
            return
        }

        if (!isInView) {
            stop()
            return
        }

        start()
        return () => stop()
    }, [draw, isInView, isStatic, start, stop])

    // When certain inputs change, refresh stars + sizing and render immediately
    useEffect(() => {
        if (typeof window === "undefined") return
        resize()
        // Render one frame so changes are visible immediately even if paused.
        draw(1 / 60)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridSize, starDensity, maxDpr, backgroundColor, gridColor])

    return (
        <div
            ref={wrapperRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                cursor: cursorEnabled ? cursor : "default",
                touchAction: "none",
            }}
            aria-label="Gravity grid canvas"
            role="img"
        >
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        </div>
    )
}

addPropertyControls(GravityGridCanvas, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#08090f",
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid",
        defaultValue: "#B4DCFF",
    },
    gridOpacity: {
        type: ControlType.Number,
        title: "Grid Opacity",
        defaultValue: 0.32,
        min: 0,
        max: 1,
        step: 0.01,
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 26,
        min: 6,
        max: 80,
        step: 1,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 14000,
        min: 0,
        max: 60000,
        step: 100,
    },
    softening: {
        type: ControlType.Number,
        title: "Softening",
        defaultValue: 28,
        min: 1,
        max: 200,
        step: 1,
    },
    glowRadius: {
        type: ControlType.Number,
        title: "Glow Radius",
        defaultValue: 140,
        min: 0,
        max: 400,
        step: 1,
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Glow Strength",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    glowCoreRadius: {
        type: ControlType.Number,
        title: "Core Radius",
        defaultValue: 2.5,
        min: 0,
        max: 20,
        step: 0.1,
    },
    glowCoreOpacity: {
        type: ControlType.Number,
        title: "Core Opacity",
        defaultValue: 0.95,
        min: 0,
        max: 1,
        step: 0.01,
    },
    starColor: {
        type: ControlType.Color,
        title: "Star",
        defaultValue: "#FFFFFF",
    },
    starOpacity: {
        type: ControlType.Number,
        title: "Star Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    starDensity: {
        type: ControlType.Number,
        title: "Star Density",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
    },
    maxDpr: {
        type: ControlType.Number,
        title: "Max DPR",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 0.5,
    },
    cursorEnabled: {
        type: ControlType.Boolean,
        title: "Cursor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cursor: {
        type: ControlType.Enum,
        title: "Cursor Style",
        options: ["crosshair", "default", "none"],
        optionTitles: ["Crosshair", "Default", "None"],
        defaultValue: "crosshair",
        hidden: ({ cursorEnabled }) => !cursorEnabled,
    },
})
