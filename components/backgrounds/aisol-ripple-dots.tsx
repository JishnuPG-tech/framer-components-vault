// build: R13-1 Aisol Ripple Dots (2026-10-09, commander build from manifest.json)
// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

/*
 * Aisol Ripple Dots
 * A grid of dots that reacts to the pointer. In Ripple mode the dots near the
 * cursor swell and a tap sends a ring outward through the grid; in Magnet
 * mode the dots are pushed away from the cursor; Still draws the grid only.
 * Frames are drawn only while something is moving: once the dots settle, or
 * when the section is off screen or the tab is hidden, the loop stops. The
 * server, the canvas, thumbnails and exports show the same grid as plain CSS,
 * and that CSS grid is also the fallback when the 2D context is missing.
 * Visitors who prefer reduced motion get the still grid. Decorative only:
 * hidden from assistive technology. Only nodes inside this component are
 * read or written.
 */

type ColorValue = string | { value?: string }
type Response = "ripple" | "magnet" | "still"

interface Props {
    dotColor?: ColorValue
    background?: ColorValue
    spacing?: number
    dotSize?: number
    response?: Response
    reach?: number
    strength?: number
    tapRing?: boolean
    style?: CSSProperties
}

const MAX_DOTS = 6000
const MAX_DPR = 2
const MAX_AREA = 4_000_000 // backbuffer pixels, about 4 MP
const RING_SPEED = 900 // px per second
const RING_WIDTH = 70
const RING_LIFE = 1.4 // seconds

const tok = (c: ColorValue | undefined, fb: string) => (typeof c === "string" ? c : c && c.value) || fb
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

// The CSS twin of the canvas grid: same spacing, dot size and colours.
function gridCss(dot: string, bg: string, spacing: number, size: number): CSSProperties {
    const s = Math.max(4, spacing)
    const r = Math.max(0.5, size / 2)
    return {
        backgroundColor: bg,
        backgroundImage: `radial-gradient(circle at ${s / 2}px ${s / 2}px, ${dot} ${r}px, transparent ${r + 0.6}px)`,
        backgroundSize: `${s}px ${s}px`,
        backgroundRepeat: "repeat",
    }
}

function rootStyle(style: CSSProperties | undefined): CSSProperties {
    // minHeight keeps a visible grid when the frame height is auto (0 px otherwise)
    return { position: "relative", width: "100%", height: "100%", minHeight: 120, overflow: "hidden", ...style }
}

const fill: CSSProperties = { position: "absolute", inset: 0 }

function readProps(props: Props) {
    return {
        dot: tok(props.dotColor, "#B8B2A6"),
        bg: tok(props.background, "rgba(0,0,0,0)"),
        spacing: clamp(typeof props.spacing === "number" ? props.spacing : 28, 12, 80),
        size: clamp(typeof props.dotSize === "number" ? props.dotSize : 2.5, 1, 8),
        response: (props.response || "ripple") as Response,
        reach: clamp(typeof props.reach === "number" ? props.reach : 160, 40, 400),
        strength: clamp(typeof props.strength === "number" ? props.strength : 0.7, 0, 1),
        tapRing: props.tapRing !== false,
    }
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AisolRippleDots(props: Props) {
    const isStatic = useIsStaticRenderer()
    return isStatic ? <StaticField {...props} /> : <LiveField {...props} />
}

// Canvas, thumbnails, export and the server: the CSS grid only.
function StaticField(props: Props) {
    const p = readProps(props)
    return (
        <div className="ard-root" aria-hidden="true" style={rootStyle(props.style)}>
            <div className="ard-poster" style={{ ...fill, ...gridCss(p.dot, p.bg, p.spacing, p.size) }} />
        </div>
    )
}

interface Ring {
    x: number
    y: number
    t: number // seconds since the tap
}

interface Field {
    cols: number
    rows: number
    ox: number
    oy: number
    n: number
    base: Float32Array // x, y per dot (css px)
    off: Float32Array // dx, dy per dot
    vel: Float32Array // vx, vy per dot
    sc: Float32Array // scale per dot (1 = rest)
    sv: Float32Array // scale velocity
}

function LiveField(props: Props) {
    const p = readProps(props)
    const [mounted, setMounted] = useState(false)
    const [failed, setFailed] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const live = useRef(p)
    live.current = p
    const poke = useRef<(rebuild?: boolean) => void>(() => undefined)

    useEffect(() => {
        setMounted(true)
    }, [])

    // one effect owns the field, the listeners and the loop
    useEffect(() => {
        if (!mounted || failed) return
        const root = rootRef.current
        const cv = canvasRef.current
        if (!root || !cv) return
        const ctx = cv.getContext("2d", { alpha: true })
        if (!ctx) {
            setFailed(true)
            return
        }

        let W = 0
        let H = 0
        let dpr = 1
        let field: Field | null = null
        let raf = 0
        let last = 0
        let onScreen = false
        let tabOn = document.visibilityState === "visible"
        let reduce = false
        let px = -1e9
        let py = -1e9
        let pointerIn = false
        const rings: Ring[] = []
        let settled = true
        let dirty = true // a still frame is owed (size or prop change)

        const mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        const readReduce = () => {
            reduce = !!(mq && mq.matches)
            if (reduce) {
                rings.length = 0
                if (field) {
                    field.off.fill(0)
                    field.vel.fill(0)
                    field.sc.fill(1)
                    field.sv.fill(0)
                }
                dirty = true
            }
            schedule()
        }

        const build = () => {
            const { spacing } = live.current
            let s = spacing
            let cols = Math.ceil(W / s) + 1
            let rows = Math.ceil(H / s) + 1
            while (cols * rows > MAX_DOTS) {
                s *= 1.25
                cols = Math.ceil(W / s) + 1
                rows = Math.ceil(H / s) + 1
            }
            const n = cols * rows
            const base = new Float32Array(n * 2)
            const ox = ((W % s) - s) / 2 + s / 2
            const oy = ((H % s) - s) / 2 + s / 2
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const i = (r * cols + c) * 2
                    base[i] = ox + c * s
                    base[i + 1] = oy + r * s
                }
            }
            field = { cols, rows, ox, oy, n, base, off: new Float32Array(n * 2), vel: new Float32Array(n * 2), sc: new Float32Array(n).fill(1), sv: new Float32Array(n) }
            dirty = true
        }

        const size = () => {
            const r = root.getBoundingClientRect()
            const w = Math.max(1, Math.round(r.width))
            const h = Math.max(1, Math.round(r.height))
            let d = Math.min(window.devicePixelRatio || 1, MAX_DPR)
            if (w * h * d * d > MAX_AREA) d = Math.max(1, Math.sqrt(MAX_AREA / (w * h)))
            if (w !== W || h !== H || d !== dpr) {
                W = w
                H = h
                dpr = d
                cv.width = Math.round(W * dpr)
                cv.height = Math.round(H * dpr)
                build()
            }
        }

        const draw = () => {
            if (!field) return
            const { dot, bg, size: ds } = live.current
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            if (bg && bg !== "transparent") {
                ctx.fillStyle = bg
                ctx.fillRect(0, 0, W, H)
            }
            ctx.fillStyle = dot
            const r0 = ds / 2
            const { n, base, off, sc } = field
            ctx.beginPath()
            for (let i = 0; i < n; i++) {
                const x = base[i * 2] + off[i * 2]
                const y = base[i * 2 + 1] + off[i * 2 + 1]
                const r = r0 * sc[i]
                ctx.moveTo(x + r, y)
                ctx.arc(x, y, r, 0, 6.2832)
            }
            ctx.fill()
        }

        // one physics step; returns true when everything is at rest
        const step = (dt: number): boolean => {
            if (!field) return true
            const { response, reach, strength } = live.current
            const { n, base, off, vel, sc, sv } = field
            const k = 180 // spring
            const damp = Math.exp(-dt * 11)
            let moving = false
            const reach2 = reach * reach
            const inField = pointerIn && response !== "still" && !reduce
            for (let i = 0; i < n; i++) {
                const bx = base[i * 2]
                const by = base[i * 2 + 1]
                let tx = 0
                let ty = 0
                let ts = 1
                if (inField) {
                    const dx = bx - px
                    const dy = by - py
                    const d2 = dx * dx + dy * dy
                    if (d2 < reach2) {
                        const d = Math.sqrt(d2) || 1
                        const f = 1 - d / reach // 1 at the pointer, 0 at the edge
                        const g = f * f * (3 - 2 * f)
                        if (response === "magnet") {
                            const push = g * reach * 0.35 * strength
                            tx = (dx / d) * push
                            ty = (dy / d) * push
                            ts = 1 + g * 0.6 * strength
                        } else {
                            ts = 1 + g * 2.2 * strength
                        }
                    }
                }
                for (let q = 0; q < rings.length; q++) {
                    const rg = rings[q]
                    const rr = rg.t * RING_SPEED
                    const dx = bx - rg.x
                    const dy = by - rg.y
                    const d = Math.sqrt(dx * dx + dy * dy)
                    const band = Math.abs(d - rr)
                    if (band < RING_WIDTH) {
                        const f = 1 - band / RING_WIDTH
                        const fade = 1 - rg.t / RING_LIFE
                        ts += f * f * 1.8 * fade * strength
                    }
                }
                // scale spring
                let a = (ts - sc[i]) * k
                sv[i] = (sv[i] + a * dt) * damp
                sc[i] += sv[i] * dt
                // offset spring
                a = (tx - off[i * 2]) * k
                vel[i * 2] = (vel[i * 2] + a * dt) * damp
                off[i * 2] += vel[i * 2] * dt
                a = (ty - off[i * 2 + 1]) * k
                vel[i * 2 + 1] = (vel[i * 2 + 1] + a * dt) * damp
                off[i * 2 + 1] += vel[i * 2 + 1] * dt
                if (!moving) {
                    if (Math.abs(sc[i] - ts) > 0.004 || Math.abs(sv[i]) > 0.02 || Math.abs(off[i * 2] - tx) > 0.05 || Math.abs(off[i * 2 + 1] - ty) > 0.05 || Math.abs(vel[i * 2]) > 0.5 || Math.abs(vel[i * 2 + 1]) > 0.5) moving = true
                }
            }
            for (let q = rings.length - 1; q >= 0; q--) {
                rings[q].t += dt
                if (rings[q].t > RING_LIFE) rings.splice(q, 1)
            }
            if (rings.length) moving = true
            return !moving
        }

        const tick = (now: number) => {
            raf = 0
            if (!onScreen || !tabOn) return
            const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
            last = now
            settled = step(dt)
            draw()
            dirty = false
            if (!settled) raf = requestAnimationFrame(tick)
            else last = 0
        }

        // start the loop if there is a reason to draw
        const schedule = () => {
            if (raf || !onScreen || !tabOn) return
            if (settled && !dirty) return
            last = 0
            raf = requestAnimationFrame(tick)
        }
        poke.current = (rebuild?: boolean) => {
            if (rebuild) build()
            dirty = true
            schedule()
        }

        const onMove = (e: PointerEvent) => {
            if (reduce || live.current.response === "still") return
            px = e.offsetX
            py = e.offsetY
            pointerIn = true
            settled = false
            schedule()
        }
        const onLeave = () => {
            pointerIn = false
            settled = false
            schedule()
        }
        const onDown = (e: PointerEvent) => {
            const { response, tapRing } = live.current
            if (reduce || response !== "ripple" || !tapRing) return
            if (rings.length >= 4) rings.shift()
            rings.push({ x: e.offsetX, y: e.offsetY, t: 0 })
            px = e.offsetX
            py = e.offsetY
            settled = false
            schedule()
        }
        const onVis = () => {
            tabOn = document.visibilityState === "visible"
            if (!tabOn && raf) {
                cancelAnimationFrame(raf)
                raf = 0
                last = 0
            } else {
                dirty = true
                schedule()
            }
        }

        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointercancel", onLeave)
        root.addEventListener("pointerdown", onDown)
        document.addEventListener("visibilitychange", onVis)
        if (mq) mq.addEventListener("change", readReduce)
        readReduce()

        let roTimer = 0
        const ro = new ResizeObserver(() => {
            if (roTimer) window.clearTimeout(roTimer)
            roTimer = window.setTimeout(() => {
                roTimer = 0
                size()
                schedule()
            }, 60)
        })
        ro.observe(root)
        const io = new IntersectionObserver(
            (entries) => {
                onScreen = entries.some((en) => en.isIntersecting)
                if (!onScreen) {
                    if (raf) cancelAnimationFrame(raf)
                    raf = 0
                    last = 0
                    pointerIn = false
                } else {
                    dirty = true
                    schedule()
                }
            },
            { root: null, rootMargin: "80px 0px" }
        )
        io.observe(root)
        size()

        return () => {
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointercancel", onLeave)
            root.removeEventListener("pointerdown", onDown)
            document.removeEventListener("visibilitychange", onVis)
            if (mq) mq.removeEventListener("change", readReduce)
            if (roTimer) window.clearTimeout(roTimer)
            ro.disconnect()
            io.disconnect()
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            poke.current = () => undefined
        }
    }, [mounted, failed])

    // a prop change while idle: one still frame; spacing changes the dot count, so rebuild the grid first
    useEffect(() => {
        poke.current()
    }, [p.dot, p.bg, p.size, p.response, p.reach, p.strength, p.tapRing])
    useEffect(() => {
        poke.current(true)
    }, [p.spacing])

    const showCanvas = mounted && !failed
    return (
        <div ref={rootRef} className="ard-root" aria-hidden="true" style={{ ...rootStyle(props.style), touchAction: "pan-y" }}>
            <div className="ard-poster" style={{ ...fill, ...gridCss(p.dot, p.bg, p.spacing, p.size), opacity: showCanvas ? 0 : 1 }} />
            {showCanvas ? <canvas ref={canvasRef} className="ard-gl" style={{ ...fill, width: "100%", height: "100%", display: "block" }} /> : null}
        </div>
    )
}

addPropertyControls(AisolRippleDots, {
    dotColor: { type: ControlType.Color, title: "Dots", description: "Colour of the dots.", defaultValue: "#B8B2A6" },
    background: { type: ControlType.Color, title: "Background", description: "Behind the dots. Transparent lets the section colour through.", defaultValue: "rgba(0,0,0,0)" },
    spacing: { type: ControlType.Number, title: "Spacing", description: "Distance between dot centres.", defaultValue: 28, min: 12, max: 80, step: 1, unit: "px" },
    dotSize: { type: ControlType.Number, title: "Dot size", description: "Diameter at rest.", defaultValue: 2.5, min: 1, max: 8, step: 0.5, unit: "px" },
    response: {
        type: ControlType.Enum,
        title: "Response",
        description: "How the grid reacts to the pointer.",
        options: ["ripple", "magnet", "still"],
        optionTitles: ["Ripple", "Magnet", "Still"],
        defaultValue: "ripple",
        displaySegmentedControl: true,
    },
    reach: { type: ControlType.Number, title: "Reach", description: "Radius around the pointer that reacts.", defaultValue: 160, min: 40, max: 400, step: 10, unit: "px", hidden: (p) => p.response === "still" },
    strength: { type: ControlType.Number, title: "Strength", description: "How much the dots swell or move.", defaultValue: 0.7, min: 0, max: 1, step: 0.05, hidden: (p) => p.response === "still" },
    tapRing: { type: ControlType.Boolean, title: "Tap ring", description: "A click or tap sends a ring through the grid.", defaultValue: true, hidden: (p) => p.response !== "ripple" },
})
