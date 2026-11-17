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


function parseColor(input: string): [number, number, number] {
    const s = (input || "").trim()
    const rgb = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (rgb) {
        return [
            Math.max(0, Math.min(255, parseFloat(rgb[1]))),
            Math.max(0, Math.min(255, parseFloat(rgb[2]))),
            Math.max(0, Math.min(255, parseFloat(rgb[3]))),
        ]
    }
    let hex = s.replace("#", "")
    // Expand shorthand (#RGB / #RGBA) and drop any alpha channel
    // (#RRGGBBAA) — Framer's Color control emits both of these, not
    // just plain 6-digit hex.
    hex =
        hex.length <= 4
            ? hex.slice(0, 3).replace(/./g, (c) => c + c)
            : hex.slice(0, 6)
    const n = parseInt(hex, 16) || 0
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

interface Point {
    hx: number
    hy: number
    x: number
    y: number
    vx: number
    vy: number
    t: number
}

interface FontControlValue {
    fontFamily?: string
    fontStyle?: string
    fontWeight?: number | string
}

// Framer's Font control's exact value shape (named weights vs numeric,
// `fontFamily` vs `family`, whether the chosen webfont is even loaded yet)
// isn't worth guessing at. Instead this gets applied as real inline CSS on
// a hidden probe element — the same way Framer's own Text layers consume
// it — so the browser resolves it correctly and Framer's font pipeline
// actually fetches the font file. rebuild() then reads the result back via
// getComputedStyle, which always returns canvas-safe values.
function styleFromFont(
    input: FontControlValue | string | undefined
): React.CSSProperties {
    if (typeof input === "string")
        return { fontFamily: input || "Archivo Black" }
    return { fontFamily: "Archivo Black", ...(input || {}) }
}

export interface LineStitchProps {
    text: string
    font: FontControlValue
    stitchLen: number
    threadWidth: number
    showKnots: boolean
    repelRadius: number
    repelForce: number
    jitter: number
    spring: number
    damping: number
    threadColor: string
    unravelColor: string
    introReveal: boolean
    staticPreview: boolean
}

/**
 * Line Stitch
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 180
 */
export default function LineStitch(props: Partial<LineStitchProps>) {
    const {
        text = "STITCH",
        font = { fontFamily: "Archivo Black" },
        stitchLen = 7,
        threadWidth = 1.4,
        showKnots = true,
        repelRadius = 120,
        repelForce = 2.6,
        jitter = 1,
        spring = 0.06,
        damping = 0.8,
        threadColor = "#EAE6DD",
        unravelColor = "#FF6B4A",
        introReveal = true,
        staticPreview = false,
    } = props

    // True only for genuinely static contexts (canvas thumbnail, export) —
    // unlike RenderTarget.canvas, this stays false for the canvas's own
    // Live/interactive preview, so hover interaction still works there.
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const fontProbeRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pointsRef = useRef<Point[]>([])
    const mouseRef = useRef({ x: -99999, y: -99999 })
    const rafRef = useRef(0)
    const loopRunningRef = useRef(false)
    const isVisibleRef = useRef(false)
    const seqRef = useRef(0)
    const sizeRef = useRef({ dpr: 1, vw: 0, vh: 0 })
    const hexCacheRef = useRef<Record<string, [number, number, number]>>({})
    const reducedMotionRef = useRef(false)

    const cfgRef = useRef<LineStitchProps>(null as any)
    cfgRef.current = {
        text,
        font,
        stitchLen,
        threadWidth,
        showKnots,
        repelRadius,
        repelForce,
        jitter,
        spring,
        damping,
        threadColor,
        unravelColor,
        introReveal,
        staticPreview,
    }

    function getRgb(hex: string) {
        const cache = hexCacheRef.current
        if (!cache[hex]) cache[hex] = parseColor(hex)
        return cache[hex]
    }

    function isFrozen(c: LineStitchProps) {
        return reducedMotionRef.current || c.staticPreview || isStatic
    }

    async function rebuild() {
        const seq = ++seqRef.current
        const cv = canvasRef.current
        const container = containerRef.current
        if (!cv || !container) return
        const c = cfgRef.current
        const w = container.clientWidth
        const h = container.clientHeight
        if (!w || !h) return
        const dpr = Math.min(
            2,
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
        )
        cv.width = Math.round(w * dpr)
        cv.height = Math.round(h * dpr)
        sizeRef.current = { dpr, vw: w, vh: h }

        // Read the font back off the hidden probe element (see styleFromFont)
        // via getComputedStyle — the browser has already resolved whatever
        // shape Framer's control returned into canvas-safe values.
        let family = "Archivo Black"
        let weight: string | number = 700
        let style = ""
        const probe = fontProbeRef.current
        if (probe && typeof window !== "undefined") {
            const cs = window.getComputedStyle(probe)
            if (cs.fontFamily) family = cs.fontFamily
            if (cs.fontWeight) weight = cs.fontWeight
            if (cs.fontStyle === "italic") style = "italic "
        }

        try {
            const fonts = (document as any).fonts
            if (fonts?.ready) await fonts.ready
        } catch (e) {}
        if (seq !== seqRef.current) return

        const g = Math.max(4, Math.round(c.stitchLen))
        const sampleGlyphs = (
            fam: string,
            wt: number | string,
            sty: string
        ) => {
            const off = document.createElement("canvas")
            off.width = w
            off.height = h
            const octx = off.getContext("2d", {
                willReadFrequently: true,
            }) as CanvasRenderingContext2D
            const fontStr = (s: number) =>
                sty + wt + " " + s + "px " + fam + ", sans-serif"
            octx.font = fontStr(100)
            const tw = Math.max(1, octx.measureText(c.text).width)
            let size = Math.min(((w * 0.86) / tw) * 100, h * 0.5)
            size = Math.max(24, size)
            octx.font = fontStr(size)
            octx.textAlign = "center"
            octx.textBaseline = "middle"
            octx.fillStyle = "#fff"
            octx.fillText(c.text, w / 2, h / 2)
            const data = octx.getImageData(0, 0, w, h).data
            const pts: { x: number; y: number }[] = []
            for (let y = 0; y < h; y += g) {
                for (let x = 0; x < w; x += g) {
                    if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y })
                }
            }
            return pts
        }

        let raw = sampleGlyphs(family, weight, style)
        // The requested font produced nothing visible (unresolved family,
        // still-loading webfont, bad control shape) — fall back to a font
        // guaranteed to render rather than leaving the canvas empty.
        if (!raw.length && family !== "sans-serif") {
            raw = sampleGlyphs("sans-serif", 700, "")
        }

        const pts: { x: number; y: number }[] = []
        if (raw.length) {
            let idx = 0
            for (let i = 1; i < raw.length; i++)
                if (raw[i].x < raw[idx].x) idx = i
            const used = new Uint8Array(raw.length)
            let cur = raw[idx]
            used[idx] = 1
            pts.push(cur)
            for (let n = 1; n < raw.length; n++) {
                let best = -1
                let bestD = Infinity
                for (let i = 0; i < raw.length; i++) {
                    if (used[i]) continue
                    const dx = raw[i].x - cur.x
                    const dy = raw[i].y - cur.y
                    const d = dx * dx + dy * dy
                    if (d < bestD) {
                        bestD = d
                        best = i
                    }
                }
                used[best] = 1
                cur = raw[best]
                pts.push(cur)
            }
        }

        const scatterOnLoad = !isFrozen(c) && c.introReveal
        pointsRef.current = pts.map((pt) => ({
            hx: pt.x,
            hy: pt.y,
            x: scatterOnLoad ? w / 2 + (Math.random() - 0.5) * w * 0.9 : pt.x,
            y: scatterOnLoad ? h / 2 + (Math.random() - 0.5) * h * 0.9 : pt.y,
            vx: 0,
            vy: 0,
            t: 0,
        }))
    }

    function loop() {
        rafRef.current = requestAnimationFrame(loop)
        draw()
    }

    // The rAF loop only runs while the component is both non-static and
    // actually scrolled into view — offscreen instances (below the fold,
    // inside a collapsed panel, …) shouldn't keep animating unseen.
    function startLoop() {
        if (loopRunningRef.current || isStatic) return
        loopRunningRef.current = true
        rafRef.current = requestAnimationFrame(loop)
    }

    function stopLoop() {
        loopRunningRef.current = false
        cancelAnimationFrame(rafRef.current)
    }

    function draw() {
        const cv = canvasRef.current
        const { dpr, vw, vh } = sizeRef.current
        if (!cv || !vw) return
        const ctx = cv.getContext("2d")
        if (!ctx) return
        const c = cfgRef.current
        const frozen = isFrozen(c)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, vw, vh)

        const rest = getRgb(c.threadColor)
        const fly = getRgb(c.unravelColor)
        const rr = c.repelRadius
        const rr2 = rr * rr
        const { x: mx, y: my } = mouseRef.current
        const pts = pointsRef.current

        for (let i = 0; i < pts.length; i++) {
            const p = pts[i]
            if (!frozen) {
                const dx = p.x - mx
                const dy = p.y - my
                const d2 = dx * dx + dy * dy
                if (d2 < rr2 && d2 > 0.01) {
                    const d = Math.sqrt(d2)
                    const f = (1 - d / rr) * c.repelForce
                    p.vx += (dx / d) * f + (Math.random() - 0.5) * c.jitter
                    p.vy += (dy / d) * f + (Math.random() - 0.5) * c.jitter
                }
                p.vx += (p.hx - p.x) * c.spring
                p.vy += (p.hy - p.y) * c.spring
                p.vx *= c.damping
                p.vy *= c.damping
                p.x += p.vx
                p.y += p.vy
            } else {
                p.x = p.hx
                p.y = p.hy
            }
            const ox = p.x - p.hx
            const oy = p.y - p.hy
            const t = (ox * ox + oy * oy) / 900
            p.t = t > 1 ? 1 : t
        }

        ctx.lineWidth = c.threadWidth
        ctx.lineCap = "round"
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1]
            const b = pts[i]
            const t = (a.t + b.t) / 2
            const r = rest[0] + (fly[0] - rest[0]) * t
            const g = rest[1] + (fly[1] - rest[1]) * t
            const bl = rest[2] + (fly[2] - rest[2]) * t
            ctx.strokeStyle =
                "rgb(" + (r | 0) + "," + (g | 0) + "," + (bl | 0) + ")"
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
        }

        if (c.showKnots) {
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i]
                const t = p.t
                const r = rest[0] + (fly[0] - rest[0]) * t
                const g = rest[1] + (fly[1] - rest[1]) * t
                const bl = rest[2] + (fly[2] - rest[2]) * t
                ctx.fillStyle =
                    "rgb(" + (r | 0) + "," + (g | 0) + "," + (bl | 0) + ")"
                ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
            }
        }
    }

    useEffect(() => {
        reducedMotionRef.current =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const cv = canvasRef.current
        if (!cv) return

        const onMove = (e: PointerEvent) => {
            const r = cv.getBoundingClientRect()
            mouseRef.current.x = e.clientX - r.left
            mouseRef.current.y = e.clientY - r.top
        }
        const onLeave = () => {
            mouseRef.current.x = -99999
            mouseRef.current.y = -99999
        }
        cv.addEventListener("pointermove", onMove)
        cv.addEventListener("pointerdown", onMove)
        cv.addEventListener("pointerleave", onLeave)

        const ro = new ResizeObserver(() => {
            rebuild().then(() => {
                if (isStatic) draw()
            })
        })
        if (containerRef.current) ro.observe(containerRef.current)

        const io = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                if (entry.isIntersecting) startLoop()
                else stopLoop()
            },
            { threshold: 0 }
        )
        if (containerRef.current) io.observe(containerRef.current)

        rebuild().then(() => {
            if (isStatic) {
                draw()
            } else if (isVisibleRef.current) {
                startLoop()
            }
        })

        return () => {
            stopLoop()
            ro.disconnect()
            io.disconnect()
            cv.removeEventListener("pointermove", onMove)
            cv.removeEventListener("pointerdown", onMove)
            cv.removeEventListener("pointerleave", onLeave)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fontKey = JSON.stringify(font)
    useEffect(() => {
        rebuild().then(() => {
            if (isStatic) draw()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, fontKey, stitchLen])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
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
                    display: "block",
                }}
            />
            <div
                ref={fontProbeRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    opacity: 0,
                    pointerEvents: "none",
                    ...styleFromFont(font),
                }}
            >
                {text}
            </div>
        </div>
    )
}

LineStitch.displayName = "Line Stitch"

addPropertyControls(LineStitch, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "STITCH",
        section: "Content",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Archivo Black",
        },
        section: "Content",
    },
    stitchLen: {
        type: ControlType.Number,
        title: "Stitch Length",
        defaultValue: 7,
        min: 4,
        max: 14,
        step: 1,
        unit: "px",
        section: "Thread",
    },
    threadWidth: {
        type: ControlType.Number,
        title: "Thread Width",
        defaultValue: 1.4,
        min: 0.5,
        max: 4,
        step: 0.1,
        unit: "px",
        section: "Thread",
    },
    showKnots: {
        type: ControlType.Boolean,
        title: "Show Knots",
        defaultValue: true,
        section: "Thread",
    },
    repelRadius: {
        type: ControlType.Number,
        title: "Repel Radius",
        defaultValue: 120,
        min: 30,
        max: 320,
        step: 5,
        unit: "px",
        section: "Physics",
    },
    repelForce: {
        type: ControlType.Number,
        title: "Repel Force",
        defaultValue: 2.6,
        min: 0.2,
        max: 10,
        step: 0.2,
        section: "Physics",
    },
    jitter: {
        type: ControlType.Number,
        title: "Jitter",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 0.1,
        section: "Physics",
    },
    spring: {
        type: ControlType.Number,
        title: "Spring",
        defaultValue: 0.06,
        min: 0.01,
        max: 0.2,
        step: 0.005,
        section: "Physics",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 0.8,
        min: 0.5,
        max: 0.98,
        step: 0.01,
        section: "Physics",
    },
    threadColor: {
        type: ControlType.Color,
        title: "Thread Color",
        defaultValue: "#EAE6DD",
        section: "Look",
    },
    unravelColor: {
        type: ControlType.Color,
        title: "Unravel Color",
        defaultValue: "#FF6B4A",
        section: "Look",
    },
    introReveal: {
        type: ControlType.Boolean,
        title: "Intro Reveal",
        defaultValue: true,
        description:
            "Scatter-and-assemble on load. Turn off to start fully formed.",
        section: "Behavior",
    },
    staticPreview: {
        type: ControlType.Boolean,
        title: "Static Preview",
        defaultValue: false,
        section: "Behavior",
    },
})
