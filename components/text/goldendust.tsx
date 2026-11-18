// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useLayoutEffect, useRef, useState } from "react"

/* ---------- color helpers ---------- */

function parseColor(input) {
    const fallback = { r: 255, g: 235, b: 190 }
    if (typeof input !== "string") return fallback
    const s = input.trim()
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (isNaN(n)) return fallback
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
    }
    const m = s.match(/[-+]?[\d.]+/g)
    if (!m || m.length < 3) return fallback
    return { r: +m[0], g: +m[1], b: +m[2] }
}

function mix(a, b, t) {
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t),
    }
}

const rgb = (c) => `rgb(${c.r},${c.g},${c.b})`

/* ---------- font token helpers ----------
   Framer's Font control returns a CSS style object, so values arrive as
   strings like "56px", "1.25em", "0.02em". Canvas needs raw numbers. */

function toPx(value, base, fallback) {
    if (value === null || value === undefined) return fallback
    if (typeof value === "number") return value
    const s = String(value).trim()
    const n = parseFloat(s)
    if (isNaN(n)) return fallback
    if (s.endsWith("rem") || s.endsWith("em")) return n * base
    if (s.endsWith("%")) return (n / 100) * base
    return n
}

function toRatio(value, fontSize, fallback) {
    if (value === null || value === undefined) return fallback
    if (typeof value === "number") return value
    const s = String(value).trim()
    const n = parseFloat(s)
    if (isNaN(n)) return fallback
    if (s.endsWith("em")) return n
    if (s.endsWith("%")) return n / 100
    if (s.endsWith("px")) return n / (fontSize || 1)
    return n
}

/* ---------- text layout ---------- */

function layoutLines(ctx, text, maxWidth) {
    const out = []
    const paragraphs = String(text || "").split("\n")
    for (const p of paragraphs) {
        const words = p.split(" ")
        let line = ""
        for (const w of words) {
            const test = line ? line + " " + w : w
            if (
                line &&
                maxWidth > 0 &&
                ctx.measureText(test).width > maxWidth
            ) {
                out.push(line)
                line = w
            } else {
                line = test
            }
        }
        out.push(line)
    }
    return out
}

function measureLines(ctx, lines) {
    let w = 0
    for (const l of lines) {
        const m = ctx.measureText(l).width
        if (m > w) w = m
    }
    return w
}

/* ---------- glow sprites ---------- */

const STEPS = 12

function makeSprites(c1, c2, dotSize, glow, dpr) {
    const R = Math.max(0.8, dotSize * glow)
    const px = Math.max(4, Math.ceil(R * 2 * dpr))
    const list = []
    for (let i = 0; i < STEPS; i++) {
        const col = mix(c1, c2, i / (STEPS - 1))
        const cv = document.createElement("canvas")
        cv.width = px
        cv.height = px
        const g = cv.getContext("2d")
        const grad = g.createRadialGradient(
            px / 2,
            px / 2,
            0,
            px / 2,
            px / 2,
            px / 2
        )
        const base = `${col.r},${col.g},${col.b}`
        grad.addColorStop(0, `rgba(${base},1)`)
        grad.addColorStop(0.28, `rgba(${base},0.6)`)
        grad.addColorStop(0.6, `rgba(${base},0.15)`)
        grad.addColorStop(1, `rgba(${base},0)`)
        g.fillStyle = grad
        g.fillRect(0, 0, px, px)
        list.push(cv)
    }
    return { list, size: R * 2, radius: R }
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 120
 */
export default function GoldenDustText(props) {
    const {
        text,
        font,
        align,
        maxWidth,
        colorStart,
        colorEnd,
        gradientDirection,
        brightness,
        shine,
        shineSize,
        gap,
        dotSize,
        glow,
        repelRadius,
        repelForce,
        settle,
        style,
    } = props

    /* resolve Framer's font style object into canvas-ready primitives */
    const f = font || {}
    const fontFamily = f.fontFamily || "Georgia, serif"
    const fontWeight = f.fontWeight === undefined ? 400 : f.fontWeight
    const fontStyle = f.fontStyle || "normal"
    const fontSize = toPx(f.fontSize, 16, 56)
    const lineHeightRaw = toRatio(f.lineHeight, fontSize, 1.25)
    const lineHeight =
        lineHeightRaw >= 0.5 && lineHeightRaw <= 4 ? lineHeightRaw : 1.25
    const letterSpacing = toPx(f.letterSpacing, fontSize, 0)

    const canvasRef = useRef(null)
    const mouseRef = useRef({ x: -9999, y: -9999, active: false })
    const [size, setSize] = useState({
        w: 320,
        h: fontSize * lineHeight + fontSize,
    })
    const isStatic = useIsStaticRenderer()

    /* build + animate */
    useLayoutEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        let raf = 0
        let disposed = false
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const c1 = parseColor(colorStart)
        const c2 = parseColor(colorEnd)
        const pad = Math.max(24, fontSize * 0.6)
        const font2d = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

        /* viewport gating: the particle loop only runs while the component
           is actually on screen, so offscreen instances cost nothing */
        let frameFn = null
        let onscreen = true
        let running = false

        function startLoop() {
            if (disposed || running || !onscreen || !frameFn) return
            running = true
            raf = requestAnimationFrame(frameFn)
        }

        function stopLoop() {
            running = false
            cancelAnimationFrame(raf)
            raf = 0
        }

        function build() {
            if (disposed) return

            const measure = document.createElement("canvas").getContext("2d")
            measure.font = font2d
            try {
                measure.letterSpacing = `${letterSpacing}px`
            } catch (e) {}

            /* width is driven by the text itself, capped by Max Width */
            const cap = maxWidth > 0 ? Math.max(10, maxWidth - pad * 2) : 0
            const lines = layoutLines(measure, text, cap)
            const textW = Math.ceil(
                measureLines(measure, lines) + letterSpacing
            )
            const width = Math.max(1, textW + pad * 2)
            const lh = fontSize * lineHeight
            const h = Math.ceil(lines.length * lh + pad * 2)
            setSize((prev) =>
                prev.w === width && prev.h === h ? prev : { w: width, h }
            )

            /* crisp gradient text layer */
            const crisp = document.createElement("canvas")
            crisp.width = Math.ceil(width * dpr)
            crisp.height = Math.ceil(h * dpr)
            const cx = crisp.getContext("2d")
            cx.scale(dpr, dpr)
            cx.font = font2d
            try {
                cx.letterSpacing = `${letterSpacing}px`
            } catch (e) {}
            cx.textBaseline = "middle"
            cx.textAlign = align

            let grad
            if (gradientDirection === "vertical")
                grad = cx.createLinearGradient(0, 0, 0, h)
            else if (gradientDirection === "diagonal")
                grad = cx.createLinearGradient(0, 0, width, h)
            else grad = cx.createLinearGradient(0, 0, width, 0)
            grad.addColorStop(0, rgb(c1))
            grad.addColorStop(1, rgb(c2))
            cx.fillStyle = grad

            const anchor =
                align === "center"
                    ? width / 2
                    : align === "right"
                      ? width - pad
                      : pad
            lines.forEach((line, i) => {
                cx.fillText(line, anchor, pad + lh * (i + 0.5))
            })

            /* sample at 1x for particle homes */
            const sample = document.createElement("canvas")
            sample.width = Math.ceil(width)
            sample.height = h
            const sx = sample.getContext("2d")
            sx.font = font2d
            try {
                sx.letterSpacing = `${letterSpacing}px`
            } catch (e) {}
            sx.textBaseline = "middle"
            sx.textAlign = align
            sx.fillStyle = "#fff"
            lines.forEach((line, i) => {
                sx.fillText(line, anchor, pad + lh * (i + 0.5))
            })

            const data = sx.getImageData(0, 0, sample.width, sample.height).data
            const step = Math.max(1, Math.round(gap))
            const particles = []
            for (let y = 0; y < sample.height; y += step) {
                for (let x = 0; x < sample.width; x += step) {
                    const a = data[(y * sample.width + x) * 4 + 3]
                    if (a < 60) continue
                    let t
                    if (gradientDirection === "vertical") t = y / h
                    else if (gradientDirection === "diagonal")
                        t = (x / width + y / h) / 2
                    else t = x / width
                    particles.push({
                        hx: x,
                        hy: y,
                        x,
                        y,
                        vx: 0,
                        vy: 0,
                        a: a / 255,
                        s: Math.min(STEPS - 1, Math.floor(t * STEPS)),
                        j: 0.55 + Math.random() * 0.9,
                        r: (Math.random() - 0.5) * 0.9,
                    })
                }
            }

            const sprites = makeSprites(c1, c2, dotSize, glow, dpr)

            canvas.width = Math.ceil(width * dpr)
            canvas.height = Math.ceil(h * dpr)
            canvas.style.width = width + "px"
            canvas.style.height = h + "px"
            const ctx = canvas.getContext("2d")
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            if (isStatic) {
                ctx.drawImage(crisp, 0, 0, width, h)
                return
            }

            let scatter = 0
            const R = repelRadius
            const S = sprites.size
            const half = S / 2

            /* first paint while offscreen, so the text is already correct
               the moment it scrolls into view */
            ctx.clearRect(0, 0, width, h)
            ctx.drawImage(crisp, 0, 0, width, h)

            function frame() {
                if (disposed || !onscreen) {
                    running = false
                    return
                }
                const m = mouseRef.current
                let target = 0

                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i]
                    if (m.active) {
                        const dx = p.x - m.x
                        const dy = p.y - m.y
                        const d2 = dx * dx + dy * dy
                        if (d2 < R * R) {
                            const d = Math.sqrt(d2) || 0.001
                            const f2 = (1 - d / R) * repelForce * p.j
                            const ux = dx / d
                            const uy = dy / d
                            p.vx += (ux - uy * p.r) * f2
                            p.vy += (uy + ux * p.r) * f2
                        }
                    }
                    p.vx += (p.hx - p.x) * settle
                    p.vy += (p.hy - p.y) * settle
                    p.vx *= 0.88
                    p.vy *= 0.88
                    p.x += p.vx
                    p.y += p.vy

                    const ox = p.x - p.hx
                    const oy = p.y - p.hy
                    const off = Math.abs(ox) + Math.abs(oy)
                    if (off > target) target = off
                }

                const want = Math.min(1, target / 6)
                scatter += (want - scatter) * (want > scatter ? 0.25 : 0.08)

                ctx.clearRect(0, 0, width, h)
                ctx.globalCompositeOperation = "source-over"

                if (scatter < 0.995) {
                    ctx.globalAlpha = 1 - scatter
                    ctx.drawImage(crisp, 0, 0, width, h)
                }

                if (scatter > 0.005) {
                    ctx.globalCompositeOperation = "lighter"
                    for (let i = 0; i < particles.length; i++) {
                        const p = particles[i]
                        ctx.globalAlpha = p.a * brightness * scatter
                        ctx.drawImage(
                            sprites.list[p.s],
                            p.x - half,
                            p.y - half,
                            S,
                            S
                        )
                    }
                }

                if (shine > 0 && m.inBox) {
                    ctx.globalCompositeOperation = "source-atop"
                    ctx.globalAlpha = 1
                    const sg = ctx.createRadialGradient(
                        m.x,
                        m.y,
                        0,
                        m.x,
                        m.y,
                        shineSize
                    )
                    sg.addColorStop(0, `rgba(255,248,225,${shine})`)
                    sg.addColorStop(0.5, `rgba(255,240,205,${shine * 0.35})`)
                    sg.addColorStop(1, "rgba(255,240,205,0)")
                    ctx.fillStyle = sg
                    ctx.fillRect(0, 0, width, h)
                }

                ctx.globalAlpha = 1
                ctx.globalCompositeOperation = "source-over"
                raf = requestAnimationFrame(frame)
            }

            frameFn = frame
            startLoop()
        }

        function rebuild() {
            if (disposed) return
            stopLoop()
            frameFn = null
            build()
        }

        build()

        /* pause the loop whenever the component is offscreen */
        let io = null
        if (!isStatic && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    onscreen = entries[0]?.isIntersecting ?? true
                    if (onscreen) {
                        startLoop()
                    } else {
                        stopLoop()
                        mouseRef.current = {
                            x: -9999,
                            y: -9999,
                            active: false,
                            inBox: false,
                        }
                    }
                },
                { threshold: 0 }
            )
            io.observe(canvas)
        }

        /* also stop while the tab is hidden */
        function onVisibility() {
            if (typeof document === "undefined") return
            if (document.hidden) stopLoop()
            else startLoop()
        }
        if (!isStatic && typeof document !== "undefined") {
            document.addEventListener("visibilitychange", onVisibility)
        }

        /* wait for the Framer-loaded webfont, then redraw */
        if (typeof document !== "undefined" && document.fonts) {
            if (document.fonts.load) {
                document.fonts
                    .load(font2d, String(text || "A"))
                    .then(rebuild)
                    .catch(() => {})
            }
            if (document.fonts.ready) {
                document.fonts.ready.then(rebuild).catch(() => {})
            }
        }

        return () => {
            disposed = true
            stopLoop()
            if (io) io.disconnect()
            if (typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", onVisibility)
            }
        }
    }, [
        text,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        lineHeight,
        letterSpacing,
        align,
        maxWidth,
        colorStart,
        colorEnd,
        gradientDirection,
        brightness,
        shine,
        shineSize,
        gap,
        dotSize,
        glow,
        repelRadius,
        repelForce,
        settle,
        isStatic,
    ])

    /* pointer tracking */
    useLayoutEffect(() => {
        if (isStatic) return
        function onMove(e) {
            const el = canvasRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const x = e.clientX - r.left
            const y = e.clientY - r.top
            const pad = repelRadius
            mouseRef.current = {
                x,
                y,
                active:
                    x > -pad &&
                    y > -pad &&
                    x < r.width + pad &&
                    y < r.height + pad,
                inBox: x >= 0 && y >= 0 && x <= r.width && y <= r.height,
            }
        }
        function onLeave() {
            mouseRef.current = {
                x: -9999,
                y: -9999,
                active: false,
                inBox: false,
            }
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("pointerleave", onLeave)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerleave", onLeave)
        }
    }, [repelRadius, isStatic])

    return (
        <div
            style={{
                position: "relative",
                display: "block",
                width: size.w,
                height: size.h,
                flexShrink: 0,
                ...style,
            }}
        >
            {/* invisible text node so Framer actually downloads the chosen font */}
            <span
                aria-hidden
                style={{
                    ...font,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    opacity: 0,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                }}
            >
                {text}
            </span>
            <canvas
                ref={canvasRef}
                style={{ position: "relative", display: "block" }}
            />
        </div>
    )
}

GoldenDustText.defaultProps = {
    text: "No shortcuts. No gimmicks.",
    font: {
        fontFamily: "Georgia, serif",
        fontSize: "56px",
        fontWeight: 400,
        lineHeight: "1.25em",
        letterSpacing: "0.02em",
    },
    align: "center",
    maxWidth: 0,
    colorStart: "#FFF4DC",
    colorEnd: "#C39A55",
    gradientDirection: "diagonal",
    brightness: 1,
    shine: 0.28,
    shineSize: 240,
    gap: 2,
    dotSize: 1.1,
    glow: 2.6,
    repelRadius: 95,
    repelForce: 1.1,
    settle: 0.045,
}

addPropertyControls(GoldenDustText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "No shortcuts. No gimmicks.",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 56,
            variant: "Regular",
            lineHeight: "1.25em",
            letterSpacing: "0.02em",
        },
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 0,
        min: 0,
        max: 2000,
        step: 10,
        unit: "px",
        description: "0 = no wrapping, width follows the text",
    },
    colorStart: {
        type: ControlType.Color,
        title: "Gold Light",
        defaultValue: "#FFF4DC",
    },
    colorEnd: {
        type: ControlType.Color,
        title: "Gold Deep",
        defaultValue: "#C39A55",
    },
    gradientDirection: {
        type: ControlType.Enum,
        title: "Gradient",
        defaultValue: "diagonal",
        options: ["horizontal", "vertical", "diagonal"],
        optionTitles: ["Horizontal", "Vertical", "Diagonal"],
    },
    brightness: {
        type: ControlType.Number,
        title: "Dust Bright",
        defaultValue: 1,
        min: 0.2,
        max: 2,
        step: 0.05,
    },
    shine: {
        type: ControlType.Number,
        title: "Shine",
        defaultValue: 0.28,
        min: 0,
        max: 1,
        step: 0.01,
    },
    shineSize: {
        type: ControlType.Number,
        title: "Shine Size",
        defaultValue: 240,
        min: 40,
        max: 800,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Dust Density",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dust Size",
        defaultValue: 1.1,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    glow: {
        type: ControlType.Number,
        title: "Dust Glow",
        defaultValue: 2.6,
        min: 1,
        max: 6,
        step: 0.1,
    },
    repelRadius: {
        type: ControlType.Number,
        title: "Repel Radius",
        defaultValue: 95,
        min: 20,
        max: 400,
        unit: "px",
    },
    repelForce: {
        type: ControlType.Number,
        title: "Repel Force",
        defaultValue: 1.1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    settle: {
        type: ControlType.Number,
        title: "Settle Speed",
        defaultValue: 0.045,
        min: 0.005,
        max: 0.2,
        step: 0.005,
    },
})
