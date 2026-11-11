// ============================================================================
// Magnetic Grid
// ----------------------------------------------------------------------------
// A grid of dots that respond to the cursor like magnets - the nearest few
// drift toward your pointer, leave a tapering trail, and snap back home.
//
// Author: sbarah.com
// Ported from Magnetic Grid.html
// Marketplace listing copy: ./MagneticGrid.md
// ============================================================================

import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------- Static stylesheet (injected once per document) ----------
const STATIC_CSS = `
.mg-root {
  position: relative;
  width: 100%; height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--mg-bg, #efeae1);
}
.mg-root.is-hide-cursor { cursor: none; }
.mg-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.mg-ring,
.mg-pin {
  position: absolute;
  left: 0; top: 0;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transform: translate(-9999px, -9999px);
  transition: opacity var(--mg-fade, 200ms) ease;
  will-change: transform, opacity;
}
.mg-ring { border-style: solid; box-sizing: border-box; }
.mg-root.is-active .mg-ring,
.mg-root.is-active .mg-pin { opacity: 1; }
`

let styleInjected = false
function injectStyle() {
    if (styleInjected || typeof document === "undefined") return
    styleInjected = true
    const el = document.createElement("style")
    el.setAttribute("data-mg-style", "1")
    el.textContent = STATIC_CSS
    document.head.appendChild(el)
}

// ---------- Color helpers ----------
function parseRGBA(c: string): [number, number, number, number] {
    if (!c) return [20, 19, 15, 1]
    const s = c.trim()
    if (s.startsWith("#")) {
        let hex = s.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((ch) => ch + ch)
                .join("")
        }
        if (hex.length === 8) {
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16),
                parseInt(hex.slice(6, 8), 16) / 255,
            ]
        }
        if (hex.length === 6) {
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16),
                1,
            ]
        }
    }
    const m = s.match(/rgba?\s*\(([^)]+)\)/i)
    if (m) {
        const parts = m[1].split(",").map((p) => parseFloat(p.trim()))
        return [
            parts[0] || 0,
            parts[1] || 0,
            parts[2] || 0,
            parts[3] != null ? parts[3] : 1,
        ]
    }
    return [20, 19, 15, 1]
}
function rgbaCss(rgba: [number, number, number, number]) {
    const [r, g, b, a] = rgba
    return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`
}

// ---------- Group types ----------
interface GridGroup {
    cols: number
    rows: number
    margin: number
    dotSize: number
    dotSizeNear: number
    latticeSize: number
}
interface MagnetGroup {
    stiffness: number
    damping: number
    range: number
    pull: number
    maxOffset: number
    nearestCount: number
}
interface TrailGroup {
    show: boolean
    length: number
    opacityScale: number
    widthScale: number
}
interface ConnectorGroup {
    show: boolean
    thickness: number
    dashSize: number
    gapSize: number
    opacity: number
}
interface RingGroup {
    show: boolean
    size: number
    thickness: number
    fadeMs: number
}
interface PinGroup {
    show: boolean
    size: number
}
// ---------- Props ----------
interface MagneticGridProps {
    background: string
    dotColor: string
    latticeColor: string
    trailColor: string
    linkColor: string
    ringColor: string
    pinColor: string
    grid: GridGroup
    magnet: MagnetGroup
    trail: TrailGroup
    connector: ConnectorGroup
    ring: RingGroup
    pin: PinGroup
    hideCursor: boolean
    fps: number
    style?: CSSProperties
}

interface Dot {
    hx: number
    hy: number
    x: number
    y: number
    vx: number
    vy: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */
export default function MagneticGrid(props: MagneticGridProps) {
    const {
        background,
        dotColor,
        latticeColor,
        trailColor,
        linkColor,
        ringColor,
        pinColor,
        grid,
        magnet,
        trail,
        connector,
        ring,
        pin,
        hideCursor,
        fps,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const ringRef = useRef<HTMLDivElement | null>(null)
    const pinRef = useRef<HTMLDivElement | null>(null)

    // Live ref so the rAF loop reads the latest props without re-binding listeners.
    const liveRef = useRef(props)
    liveRef.current = props

    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return
        injectStyle()

        const root = rootRef.current
        const canvas = canvasRef.current
        const ringEl = ringRef.current
        const pinEl = pinRef.current
        if (!root || !canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // ---- State ----
        let cssW = 0,
            cssH = 0
        let dpr =
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        let dots: Dot[] = []
        const trails = new Map<number, { x: number; y: number }[]>()

        let mouseX = -9999,
            mouseY = -9999,
            mouseActive = false

        let raf = 0
        let disposed = false
        let visible = typeof document !== "undefined" ? !document.hidden : true
        let onScreen = true

        let prevCols = liveRef.current.grid.cols
        let prevRows = liveRef.current.grid.rows
        let prevMargin = liveRef.current.grid.margin
        let tPrev = performance.now()
        let needsPaint = true

        // ---- Layout ----
        const recomputeHomes = () => {
            const g = liveRef.current.grid
            const cols = Math.max(2, Math.round(g.cols))
            const rows = Math.max(2, Math.round(g.rows))
            const m = Math.max(0, g.margin)
            const stepX = cols > 1 ? (cssW - m * 2) / (cols - 1) : 0
            const stepY = rows > 1 ? (cssH - m * 2) / (rows - 1) : 0
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const i = r * cols + c
                    const d = dots[i]
                    if (!d) continue
                    d.hx = m + c * stepX
                    d.hy = m + r * stepY
                }
            }
        }

        const rebuildDots = () => {
            const g = liveRef.current.grid
            const cols = Math.max(2, Math.round(g.cols))
            const rows = Math.max(2, Math.round(g.rows))
            dots = new Array(cols * rows)
            for (let i = 0; i < dots.length; i++) {
                dots[i] = { hx: 0, hy: 0, x: 0, y: 0, vx: 0, vy: 0 }
            }
            trails.clear()
            recomputeHomes()
            // Snap to home immediately so there's no spring-in animation.
            if (cssW > 0 && cssH > 0) {
                for (const d of dots) {
                    d.x = d.hx
                    d.y = d.hy
                }
            }
        }

        const sizeCanvas = () => {
            const rect = root.getBoundingClientRect()
            cssW = Math.max(0, rect.width)
            cssH = Math.max(0, rect.height)
            dpr = window.devicePixelRatio || 1
            canvas.width = Math.max(1, Math.round(cssW * dpr))
            canvas.height = Math.max(1, Math.round(cssH * dpr))
            canvas.style.width = cssW + "px"
            canvas.style.height = cssH + "px"
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            recomputeHomes()
            // Always snap dots to new home positions on resize.
            // Skipping this causes dots to hold old pixel coords while homes
            // shift, creating a violent spring snap and a visible flicker.
            if (cssW > 0 && cssH > 0) {
                for (const d of dots) {
                    d.x = d.hx
                    d.y = d.hy
                    d.vx = 0
                    d.vy = 0
                }
            }
            // Changing canvas.width/height clears the canvas.
            // We must draw at least one frame after resize or the grid disappears.
            needsPaint = true
        }

        rebuildDots()
        sizeCanvas()

        // ---- Pause logic ----
        const startRaf = () => {
            if (raf || disposed) return
            if (!visible || !onScreen) return
            tPrev = performance.now()
            raf = requestAnimationFrame(frame)
        }
        const stopRaf = () => {
            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        // ---- Frame ----
        const frame = (now: number) => {
            raf = 0
            if (disposed || !visible || !onScreen) return
            const live = liveRef.current

            // FPS cap
            const minDt = 1 / Math.max(10, live.fps)
            const dt = (now - tPrev) / 1000
            if (dt < minDt) {
                raf = requestAnimationFrame(frame)
                return
            }
            tPrev = now

            // React to grid structural changes
            if (live.grid.cols !== prevCols || live.grid.rows !== prevRows) {
                prevCols = live.grid.cols
                prevRows = live.grid.rows
                prevMargin = live.grid.margin
                rebuildDots()
            } else if (live.grid.margin !== prevMargin) {
                prevMargin = live.grid.margin
                recomputeHomes()
            }

            const m = live.magnet
            const STIFF = m.stiffness
            const DAMP = m.damping
            const RANGE = Math.max(1, m.range)
            const PULL = m.pull
            const MAX = Math.max(0, m.maxOffset)
            const NEAR_K = Math.max(0, Math.round(m.nearestCount))
            const TRAIL_LEN = Math.max(2, Math.round(live.trail.length))

            // ---- Physics ----
            for (let i = 0; i < dots.length; i++) {
                const d = dots[i]
                let ax = (d.hx - d.x) * STIFF
                let ay = (d.hy - d.y) * STIFF
                if (mouseActive) {
                    const dx = mouseX - d.x
                    const dy = mouseY - d.y
                    const dist = Math.hypot(dx, dy) + 0.0001
                    const t = dist / RANGE
                    // Smooth roll-off: ~1 inside half-range, ~0 past full range
                    const f = 1 / (1 + t * t * 2.6)
                    if (f > 0.015) {
                        ax += (dx / dist) * PULL * f
                        ay += (dy / dist) * PULL * f
                    }
                }
                d.vx = (d.vx + ax) * DAMP
                d.vy = (d.vy + ay) * DAMP
                d.x += d.vx
                d.y += d.vy
                const ox = d.x - d.hx,
                    oy = d.y - d.hy
                const om = Math.hypot(ox, oy)
                if (om > MAX && MAX > 0) {
                    d.x = d.hx + ox * (MAX / om)
                    d.y = d.hy + oy * (MAX / om)
                }
            }

            // ---- Nearest set (by home position) ----
            let nearestIdx: number[] = []
            if (mouseActive && NEAR_K > 0) {
                const ranked: { i: number; d2: number }[] = []
                for (let i = 0; i < dots.length; i++) {
                    const d = dots[i]
                    const dx = mouseX - d.hx
                    const dy = mouseY - d.hy
                    ranked.push({ i, d2: dx * dx + dy * dy })
                }
                ranked.sort((a, b) => a.d2 - b.d2)
                const k = Math.min(NEAR_K, ranked.length)
                for (let i = 0; i < k; i++) nearestIdx.push(ranked[i].i)
            }
            const nearestSet = new Set(nearestIdx)

            // ---- Trails ----
            if (live.trail.show) {
                for (const i of nearestIdx) {
                    let buf = trails.get(i)
                    if (!buf) {
                        buf = []
                        trails.set(i, buf)
                    }
                    const d = dots[i]
                    buf.push({ x: d.x, y: d.y })
                    if (buf.length > TRAIL_LEN) buf.shift()
                }
                for (const [i, buf] of trails) {
                    if (!nearestSet.has(i)) {
                        // Shed two samples per frame so trails fade quickly when focus moves
                        buf.shift()
                        if (buf.length) buf.shift()
                        if (!buf.length) trails.delete(i)
                    }
                }
            } else if (trails.size) {
                trails.clear()
            }

            // ---- Draw ----
            ctx.clearRect(0, 0, cssW, cssH)

            // Lattice (faint home-position dots)
            const lattice = parseRGBA(live.latticeColor)
            ctx.fillStyle = rgbaCss(lattice)
            for (let i = 0; i < dots.length; i++) {
                const d = dots[i]
                ctx.beginPath()
                ctx.arc(
                    d.hx,
                    d.hy,
                    Math.max(0.1, live.grid.latticeSize),
                    0,
                    Math.PI * 2
                )
                ctx.fill()
            }

            // Trails (under dots)
            if (live.trail.show && trails.size) {
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
                const baseTrail = parseRGBA(live.trailColor)
                const opScale = Math.max(0, live.trail.opacityScale)
                const wScale = Math.max(0, live.trail.widthScale)
                for (const [, buf] of trails) {
                    if (buf.length < 2) continue
                    for (let j = 1; j < buf.length; j++) {
                        const a = buf[j - 1]
                        const b = buf[j]
                        const t = j / buf.length
                        const alpha = baseTrail[3] * (0.04 + 0.55 * t) * opScale
                        const w = (0.6 + 0.7 * t) * wScale
                        ctx.strokeStyle = rgbaCss([
                            baseTrail[0],
                            baseTrail[1],
                            baseTrail[2],
                            alpha,
                        ])
                        ctx.lineWidth = Math.max(0.1, w)
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.stroke()
                    }
                }
            }

            // Dotted connector from each nearest dot back to its home
            if (live.connector.show && nearestIdx.length) {
                const link = parseRGBA(live.linkColor)
                ctx.strokeStyle = rgbaCss([
                    link[0],
                    link[1],
                    link[2],
                    link[3] * Math.max(0, live.connector.opacity),
                ])
                ctx.lineWidth = Math.max(0.1, live.connector.thickness)
                ctx.setLineDash([
                    Math.max(0.1, live.connector.dashSize),
                    Math.max(0.1, live.connector.gapSize),
                ])
                for (const i of nearestIdx) {
                    const d = dots[i]
                    ctx.beginPath()
                    ctx.moveTo(d.hx, d.hy)
                    ctx.lineTo(d.x, d.y)
                    ctx.stroke()
                }
                ctx.setLineDash([])
            }

            // Active dots - slight size bump for the nearest set
            ctx.fillStyle = live.dotColor
            for (let i = 0; i < dots.length; i++) {
                const d = dots[i]
                const r = nearestSet.has(i)
                    ? live.grid.dotSizeNear
                    : live.grid.dotSize
                ctx.beginPath()
                ctx.arc(d.x, d.y, Math.max(0.1, r), 0, Math.PI * 2)
                ctx.fill()
            }

            // ---- Stop-when-settled ----
            // If the cursor is gone AND every dot is back at rest AND no trails
            // remain, stop the loop. It restarts on the next pointer event.
            if (!mouseActive && trails.size === 0) {
                let allSettled = true
                for (let i = 0; i < dots.length; i++) {
                    const d = dots[i]
                    if (
                        Math.abs(d.vx) > 0.005 ||
                        Math.abs(d.vy) > 0.005 ||
                        Math.abs(d.x - d.hx) > 0.05 ||
                        Math.abs(d.y - d.hy) > 0.05
                    ) {
                        allSettled = false
                        break
                    }
                }
                if (allSettled && !needsPaint) return
            }
            needsPaint = false

            raf = requestAnimationFrame(frame)
        }

        // ---- Pointer handling ----
        const updateIndicators = () => {
            if (ringEl) {
                ringEl.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`
            }
            if (pinEl) {
                pinEl.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`
            }
        }
        const onPointerMove = (e: PointerEvent) => {
            const rect = root.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top
            mouseActive = true
            updateIndicators()
            if (!root.classList.contains("is-active")) {
                root.classList.add("is-active")
            }
            startRaf()
        }
        const onPointerLeave = () => {
            mouseActive = false
            mouseX = -9999
            mouseY = -9999
            root.classList.remove("is-active")
            if (ringEl) {
                ringEl.style.transform = `translate(-9999px, -9999px) translate(-50%, -50%)`
            }
            if (pinEl) {
                pinEl.style.transform = `translate(-9999px, -9999px) translate(-50%, -50%)`
            }
            startRaf()
        }
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerenter", onPointerMove)
        root.addEventListener("pointerleave", onPointerLeave)

        // ---- Visibility / focus ----
        const onVisibility = () => {
            visible = !document.hidden
            if (!visible) {
                mouseActive = false
                stopRaf()
            } else startRaf()
        }
        const onBlur = () => {
            visible = false
            mouseActive = false
            stopRaf()
        }
        const onFocus = () => {
            visible = !document.hidden
            startRaf()
        }
        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("blur", onBlur)
        window.addEventListener("focus", onFocus)

        // ---- IntersectionObserver ----
        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) onScreen = entry.isIntersecting
            if (!onScreen) stopRaf()
            else startRaf()
        })
        io.observe(root)

        // ---- ResizeObserver ----
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                sizeCanvas()
                startRaf()
            })
            ro.observe(root)
        }

        startRaf()

        return () => {
            disposed = true
            stopRaf()
            io.disconnect()
            if (ro) ro.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("blur", onBlur)
            window.removeEventListener("focus", onFocus)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerenter", onPointerMove)
            root.removeEventListener("pointerleave", onPointerLeave)
        }
    }, [isStatic])

    // ---- Render-side computed styles ----
    const cssVars: CSSProperties = {
        ...style,
        ["--mg-bg" as any]: background,
        ["--mg-fade" as any]: `${ring.fadeMs}ms`,
    }

    const ringStyle: CSSProperties = {
        width: ring.size,
        height: ring.size,
        borderWidth: ring.thickness,
        borderColor: ringColor,
        display: ring.show ? "block" : "none",
    }
    const pinStyle: CSSProperties = {
        width: pin.size,
        height: pin.size,
        background: pinColor,
        display: pin.show ? "block" : "none",
    }

    // ---- Static render: paint a rich still frame; no listeners, no RAF ----
    if (isStatic) {
        const cols = Math.max(2, Math.round(grid.cols))
        const rows = Math.max(2, Math.round(grid.rows))
        const W = 400,
            H = 400
        const m = Math.max(0, grid.margin)
        const stepX = cols > 1 ? (W - m * 2) / (cols - 1) : 0
        const stepY = rows > 1 ? (H - m * 2) / (rows - 1) : 0
        const cells: { cx: number; cy: number }[] = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                cells.push({ cx: m + c * stepX, cy: m + r * stepY })
            }
        }

        // Simulate a cursor in the centre and pull the 5 nearest dots
        const centreX = W / 2
        const centreY = H / 2
        const ranked = cells
            .map((cell, i) => ({
                i,
                d2: (cell.cx - centreX) ** 2 + (cell.cy - centreY) ** 2,
            }))
            .sort((a, b) => a.d2 - b.d2)
        const nearestCount = Math.min(
            Math.max(0, Math.round(magnet.nearestCount)),
            cells.length
        )
        const nearestIdx = new Set(
            ranked.slice(0, nearestCount).map((v) => v.i)
        )

        const pulled = cells.map((cell, i) => {
            if (!nearestIdx.has(i)) return { x: cell.cx, y: cell.cy }
            const dx = centreX - cell.cx
            const dy = centreY - cell.cy
            const dist = Math.hypot(dx, dy) + 0.0001
            const maxPull = Math.min(magnet.maxOffset * 0.35, 24)
            const pull = Math.min(dist * 0.25, maxPull)
            return {
                x: cell.cx + (dx / dist) * pull,
                y: cell.cy + (dy / dist) * pull,
            }
        })

        // Static trail segments for nearest dots
        const trailSegs: {
            x1: number
            y1: number
            x2: number
            y2: number
            a: number
            w: number
        }[] = []
        if (trail.show) {
            const steps = Math.max(4, Math.round(trail.length / 6))
            for (const i of nearestIdx) {
                const home = cells[i]
                const p = pulled[i]
                for (let s = 1; s <= steps; s++) {
                    const t0 = (s - 1) / steps
                    const t1 = s / steps
                    trailSegs.push({
                        x1: home.cx + (p.x - home.cx) * t0,
                        y1: home.cy + (p.y - home.cy) * t0,
                        x2: home.cx + (p.x - home.cx) * t1,
                        y2: home.cy + (p.y - home.cy) * t1,
                        a: 0.04 + 0.55 * t1,
                        w: (0.6 + 0.7 * t1) * trail.widthScale,
                    })
                }
            }
        }

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    background,
                    ...style,
                }}
                aria-label="Magnetic grid"
            >
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    width="100%"
                    height="100%"
                    aria-hidden="true"
                >
                    {/* Lattice */}
                    {cells.map((c, i) => (
                        <circle
                            key={`l${i}`}
                            cx={c.cx}
                            cy={c.cy}
                            r={Math.max(0.1, grid.latticeSize)}
                            fill={latticeColor}
                        />
                    ))}

                    {/* Connectors */}
                    {connector.show &&
                        Array.from(nearestIdx).map((i) => (
                            <line
                                key={`c${i}`}
                                x1={cells[i].cx}
                                y1={cells[i].cy}
                                x2={pulled[i].x}
                                y2={pulled[i].y}
                                stroke={linkColor}
                                strokeWidth={Math.max(0.1, connector.thickness)}
                                strokeDasharray={`${Math.max(0.1, connector.dashSize)} ${Math.max(0.1, connector.gapSize)}`}
                                opacity={connector.opacity}
                            />
                        ))}

                    {/* Trails */}
                    {trail.show &&
                        trailSegs.map((s, i) => (
                            <line
                                key={`t${i}`}
                                x1={s.x1}
                                y1={s.y1}
                                x2={s.x2}
                                y2={s.y2}
                                stroke={trailColor}
                                strokeWidth={Math.max(0.1, s.w)}
                                strokeLinecap="round"
                                opacity={s.a * trail.opacityScale}
                            />
                        ))}

                    {/* Active dots */}
                    {cells.map((c, i) => (
                        <circle
                            key={`d${i}`}
                            cx={pulled[i].x}
                            cy={pulled[i].y}
                            r={Math.max(
                                0.1,
                                nearestIdx.has(i)
                                    ? grid.dotSizeNear
                                    : grid.dotSize
                            )}
                            fill={dotColor}
                        />
                    ))}
                </svg>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            className={`mg-root${hideCursor ? " is-hide-cursor" : ""}`}
            style={cssVars}
            aria-label="Magnetic grid"
        >
            <canvas ref={canvasRef} className="mg-canvas" />
            <div ref={ringRef} className="mg-ring" style={ringStyle} />
            <div ref={pinRef} className="mg-pin" style={pinStyle} />
        </div>
    )
}

// ---------------------- Defaults ----------------------

MagneticGrid.defaultProps = {
    background: "#efeae1",
    dotColor: "#14130f",
    latticeColor: "rgba(26, 25, 23, 0.10)",
    trailColor: "rgba(20, 19, 15, 1)",
    linkColor: "rgba(20, 19, 15, 0.16)",
    ringColor: "rgba(20, 19, 15, 0.30)",
    pinColor: "#14130f",
    grid: {
        cols: 6,
        rows: 6,
        margin: 70,
        dotSize: 3.0,
        dotSizeNear: 3.6,
        latticeSize: 0.9,
    },
    magnet: {
        stiffness: 0.07,
        damping: 0.82,
        range: 140,
        pull: 1.5,
        maxOffset: 58,
        nearestCount: 5,
    },
    trail: {
        show: true,
        length: 36,
        opacityScale: 1,
        widthScale: 1,
    },
    connector: {
        show: true,
        thickness: 0.5,
        dashSize: 2,
        gapSize: 3,
        opacity: 1,
    },
    ring: {
        show: true,
        size: 32,
        thickness: 1,
        fadeMs: 160,
    },
    pin: {
        show: true,
        size: 4,
    },
    hideCursor: true,
    fps: 60,
}

// ---------------------- Property Controls ----------------------

addPropertyControls(MagneticGrid, {
    // ===== Colors (flat per design intent) =====
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#efeae1",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot",
        defaultValue: "#14130f",
        description: "Fill of the active grid dots.",
    },
    latticeColor: {
        type: ControlType.Color,
        title: "Lattice",
        defaultValue: "rgba(26, 25, 23, 0.10)",
        description:
            "Faint dots painted at every dot's home position for grounding.",
    },
    trailColor: {
        type: ControlType.Color,
        title: "Trail",
        defaultValue: "rgba(20, 19, 15, 1)",
        description:
            "Base color of the tapering motion trails. Per-segment alpha is applied automatically.",
    },
    linkColor: {
        type: ControlType.Color,
        title: "Link",
        defaultValue: "rgba(20, 19, 15, 0.16)",
        description:
            "Color of the dotted connector from each pulled dot back to its home position.",
    },
    ringColor: {
        type: ControlType.Color,
        title: "Ring",
        defaultValue: "rgba(20, 19, 15, 0.30)",
    },
    pinColor: {
        type: ControlType.Color,
        title: "Pin",
        defaultValue: "#14130f",
    },
    // ===== Grid =====
    grid: {
        type: ControlType.Object,
        title: "Grid",
        icon: "effect",
        controls: {
            cols: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 6,
                min: 2,
                max: 40,
                step: 1,
                displayStepper: true,
            },
            rows: {
                type: ControlType.Number,
                title: "Rows",
                defaultValue: 6,
                min: 2,
                max: 40,
                step: 1,
                displayStepper: true,
            },
            margin: {
                type: ControlType.Number,
                title: "Margin",
                defaultValue: 70,
                min: 0,
                max: 300,
                step: 1,
                unit: "px",
                description: "Inner edge inset of the grid from the stage.",
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 3.0,
                min: 0.5,
                max: 20,
                step: 0.1,
                unit: "px",
            },
            dotSizeNear: {
                type: ControlType.Number,
                title: "Dot Size (Near)",
                defaultValue: 3.6,
                min: 0.5,
                max: 30,
                step: 0.1,
                unit: "px",
                description:
                    "Radius of dots currently magnetized by the cursor.",
            },
            latticeSize: {
                type: ControlType.Number,
                title: "Lattice Size",
                defaultValue: 0.9,
                min: 0,
                max: 6,
                step: 0.1,
                unit: "px",
                description: "Size of the faint home-position lattice dots.",
            },
        },
    },

    // ===== Magnet =====
    magnet: {
        type: ControlType.Object,
        title: "Magnet",
        icon: "interact",
        controls: {
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                defaultValue: 0.07,
                min: 0.01,
                max: 0.4,
                step: 0.005,
                description: "Restorative spring strength back to home.",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: 0.82,
                min: 0.5,
                max: 0.99,
                step: 0.01,
                description: "Velocity damping. Higher = settles faster.",
            },
            range: {
                type: ControlType.Number,
                title: "Range",
                defaultValue: 140,
                min: 10,
                max: 600,
                step: 1,
                unit: "px",
                description: "Cursor influence radius.",
            },
            pull: {
                type: ControlType.Number,
                title: "Pull",
                defaultValue: 1.5,
                min: 0,
                max: 6,
                step: 0.05,
                description: "Peak per-frame pull toward the cursor.",
            },
            maxOffset: {
                type: ControlType.Number,
                title: "Max Offset",
                defaultValue: 58,
                min: 0,
                max: 300,
                step: 1,
                unit: "px",
                description: "Cap on how far a dot can drift from its home.",
            },
            nearestCount: {
                type: ControlType.Number,
                title: "Nearest Count",
                defaultValue: 5,
                min: 0,
                max: 40,
                step: 1,
                displayStepper: true,
                description:
                    "How many of the closest dots receive trails and connectors. 0 disables both.",
            },
        },
    },

    // ===== Trail =====
    trail: {
        type: ControlType.Object,
        title: "Trail",
        icon: "effect",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            length: {
                type: ControlType.Number,
                title: "Length",
                defaultValue: 36,
                min: 4,
                max: 200,
                step: 1,
                description: "Number of samples held per trail.",
                hidden: ({ show }) => !show,
            },
            opacityScale: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 1,
                min: 0,
                max: 2,
                step: 0.05,
                description: "Multiplier on the per-segment trail alpha.",
                hidden: ({ show }) => !show,
            },
            widthScale: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 1,
                min: 0,
                max: 4,
                step: 0.05,
                description: "Multiplier on the per-segment trail width.",
                hidden: ({ show }) => !show,
            },
        },
    },

    // ===== Connector =====
    connector: {
        type: ControlType.Object,
        title: "Connector",
        icon: "effect",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Dotted line from each pulled dot back to its home.",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 0.5,
                min: 0.25,
                max: 4,
                step: 0.25,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            dashSize: {
                type: ControlType.Number,
                title: "Dash",
                defaultValue: 2,
                min: 0.5,
                max: 16,
                step: 0.5,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            gapSize: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 3,
                min: 0.5,
                max: 16,
                step: 0.5,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 1,
                min: 0,
                max: 2,
                step: 0.05,
                description: "Multiplier on the link color's alpha.",
                hidden: ({ show }) => !show,
            },
        },
    },

    // ===== Ring =====
    ring: {
        type: ControlType.Object,
        title: "Ring",
        icon: "effect",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 32,
                min: 4,
                max: 400,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 1,
                min: 0.5,
                max: 8,
                step: 0.5,
                unit: "px",
                hidden: ({ show }) => !show,
            },
            fadeMs: {
                type: ControlType.Number,
                title: "Fade",
                defaultValue: 160,
                min: 0,
                max: 1500,
                step: 10,
                unit: "ms",
                hidden: ({ show }) => !show,
            },
        },
    },

    // ===== Pin =====
    pin: {
        type: ControlType.Object,
        title: "Pin",
        icon: "effect",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 4,
                min: 1,
                max: 40,
                step: 1,
                unit: "px",
                hidden: ({ show }) => !show,
            },
        },
    },

    // ===== Cursor =====
    hideCursor: {
        type: ControlType.Boolean,
        title: "Hide Cursor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Hide the system cursor inside the stage. The Ring and Pin replace it.",
    },

    // ===== Performance =====
    fps: {
        type: ControlType.Number,
        title: "Max FPS",
        defaultValue: 60,
        min: 15,
        max: 120,
        step: 5,
        description: "Frame-rate cap. Lower saves CPU.",
    },
})
